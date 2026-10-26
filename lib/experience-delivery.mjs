import fs from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {spawn} from 'node:child_process';
import {ExperienceClient} from './experience-client.mjs';
import {experienceCaseSchema} from './experience-schema.mjs';
import {caseContent,caseId} from './experience-case.mjs';
import {digest,exists,readJSON,locked,root} from './io.mjs';

const busy = error => error.message.startsWith('Another operation is active');
const files = async directory => await exists(directory) ? (await fs.readdir(directory)).filter(f=>/^case-[a-f0-9]{32}\.json$/.test(f)).sort() : [];
async function durableJSON(file,value) {
  await fs.mkdir(path.dirname(file),{recursive:true,mode:0o700});
  const temporary = file+'.'+randomUUID()+'.tmp', handle = await fs.open(temporary,'wx',0o600);
  try { await handle.writeFile(JSON.stringify(value)+'\n'); await handle.sync(); } finally { await handle.close(); }
  await fs.rename(temporary,file);
  if (process.platform !== 'win32') { const directory = await fs.open(path.dirname(file),'r'); try { await directory.sync(); } finally { await directory.close(); } }
}
export class ReliableExperienceClient {
  constructor({url,token,data = path.join(root,'.designer-data'),timeout = 8000,retryMin = 2000,retryMax = 60000,autoWorker = true}) {
    this.remote = new ExperienceClient({url,token,timeout}); this.data = data; this.autoWorker = autoWorker;
    this.directory = path.join(data,'experience-delivery',digest(this.remote.url).slice(0,24));
    this.outbox = path.join(this.directory,'outbox'); this.rejected = path.join(this.directory,'rejected');
    this.configFile = path.join(this.directory,'connection.json');
    this.settings = {url:this.remote.url,token:token || null,data,timeout,retryMin,retryMax};
    this.remote.cache = path.join(this.directory,'cache');
  }
  async initialize() {
    if (!this.ready) this.ready = (async()=>{
      await durableJSON(this.configFile,this.settings);
      // Adopt the previous workbench outbox once; never discard an unacknowledged record.
      const legacy = path.join(this.data,'outbox');
      for (const name of await files(legacy)) {
        const entry = caseContent(experienceCaseSchema.parse((await readJSON(path.join(legacy,name))).entry));
        await this.enqueue(entry); await fs.unlink(path.join(legacy,name)).catch(e=>{if(e.code!=='ENOENT')throw e;});
      }
    })();
    return this.ready;
  }
  async enqueue(entry) {
    const file = path.join(this.outbox,caseId(entry)+'.json');
    if (!await exists(file)) await durableJSON(file,{entry,queuedAt:new Date().toISOString()});
  }
  async resume() { await this.initialize(); if ((await files(this.outbox)).length) await this.startWorker(); }
  async workerRunning() {
    const owner = path.join(this.directory,'worker.lock','owner.json');
    try {
      const {pid} = await readJSON(owner);
      if (!Number.isInteger(pid) || pid < 1) return false;
      process.kill(pid,0); return true;
    } catch (error) { if (['ESRCH','ENOENT'].includes(error.code)) return false; if (error.code === 'EPERM') return true; throw error; }
  }
  async startWorker() {
    if (!this.autoWorker || await this.workerRunning()) return;
    const child = spawn(process.execPath,[path.join(root,'bin/experience-worker.mjs'),this.configFile],{detached:true,stdio:'ignore',windowsHide:true});
    await new Promise((resolve,reject)=>{child.once('spawn',resolve);child.once('error',reject);}); child.unref();
  }
  async capture(input) {
    const entry = caseContent(experienceCaseSchema.parse(input)), id = caseId(entry);
    await this.initialize(); await this.enqueue(entry);
    // Let the existing worker own backoff; additional feedback must not repeat a slow failed request.
    if (await this.workerRunning()) return {id,status:'pending-delivery',sync:'queued',shared:false,automaticRetry:true};
    const delivered = await this.flush();
    if (delivered.receipts[id]) return {...delivered.receipts[id],sync:'saved',shared:delivered.receipts[id].status === 'active'};
    const receipt = path.join(this.directory,'receipts',id+'.json');
    if (!await exists(path.join(this.outbox,id+'.json')) && await exists(receipt)) { const saved = await readJSON(receipt); return {...saved,sync:'saved',shared:saved.status === 'active'}; }
    if (await exists(path.join(this.rejected,id+'.json'))) throw Error('Experience was rejected; its original record and reason are retained locally');
    await this.startWorker();
    return {id,status:'pending-delivery',sync:'queued',shared:false,automaticRetry:true};
  }
  async search(filter) { await this.resume(); return this.remote.search(filter); }
  async syncStatus() {
    await this.resume(); const statusFile = path.join(this.directory,'status.json');
    const last = await exists(statusFile) ? await readJSON(statusFile) : {};
    return {...last,pending:(await files(this.outbox)).length,rejected:(await files(this.rejected)).length,automaticRetry:true};
  }
  async flush() {
    await this.initialize(); const receipts = {};
    try {
      return await locked(path.join(this.directory,'delivery'),async()=>{
        let lastError = null;
        for (const name of await files(this.outbox)) {
          const file = path.join(this.outbox,name), record = await readJSON(file);
          try {
            const result = await this.remote.capture(record.entry); receipts[result.id] = result;
            await durableJSON(path.join(this.directory,'receipts',result.id+'.json'),result);
            await fs.unlink(file);
          } catch (error) {
            lastError = error.message;
            if (error.retryable !== false) break;
            await durableJSON(path.join(this.rejected,name),{...record,rejectedAt:new Date().toISOString(),reason:error.message});
            await fs.unlink(file);
          }
        }
        const pending = (await files(this.outbox)).length;
        const statusFile = path.join(this.directory,'status.json'), previous = await exists(statusFile) ? await readJSON(statusFile) : {};
        await durableJSON(statusFile,{...previous,lastAttempt:new Date().toISOString(),...(Object.keys(receipts).length ? {lastSuccess:new Date().toISOString()} : {}),lastError,pending});
        return {receipts,pending};
      });
    } catch (error) { if (busy(error)) return {receipts,pending:(await files(this.outbox)).length}; throw error; }
  }
  async close() { await this.remote.close(); }
}
export async function runDeliveryWorker(configFile) {
  const config = await readJSON(configFile), client = new ReliableExperienceClient({...config,autoWorker:false});
  try {
    await client.initialize();
    while (true) {
      try {
        await locked(path.join(client.directory,'worker'),async()=>{
          let delay = config.retryMin;
          while (true) {
            const result = await client.flush();
            if (!result.pending) return;
            await new Promise(resolve=>setTimeout(resolve,delay));
            delay = Math.min(config.retryMax,delay*2);
          }
        });
      } catch (error) {
        if (!busy(error)) throw error;
        const owner = path.join(client.directory,'worker.lock','owner.json');
        if (await exists(owner)) return; // Another live worker owns delivery.
        await new Promise(resolve=>setTimeout(resolve,1000)); continue;
      }
      // Recheck after releasing the lease: an enqueue racing with worker exit
      // is either seen here or starts a new worker after the lease disappears.
      if (!(await files(client.outbox)).length) return;
    }
  } finally { await client.close(); }
}
