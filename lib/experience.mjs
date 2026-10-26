import fs from 'node:fs/promises';
import path from 'node:path';
import {digest, readJSON, writeJSON, exists, locked, requireText} from './io.mjs';
import {loadTask} from './workbench.mjs';

export class ExperienceStore {
  constructor(directory) { this.directory = directory; this.file = path.join(directory, 'store.json'); this.queue = Promise.resolve(); }
  mutate(action) {
    const pending = this.queue.then(() => locked(this.directory,action));
    this.queue = pending.catch(() => {}); return pending;
  }
  async read() { return await exists(this.file) ? readJSON(this.file) : {version:1,revision:0,cases:[]}; }
  async capture(input) {
    for (const key of ['summary','cause','prevention','actor']) requireText(input[key], key);
    if (!['general','site-preference','hard-failure','unclassified'].includes(input.classification)) throw Error('Invalid experience classification');
    if (!input.scope?.pages?.length || input.scope.pages.some(p => typeof p !== 'string' || !p)) throw Error('Experience requires page scope');
    if (input.classification === 'site-preference' && !input.scope.site) throw Error('Site preference needs site identity');
    if (!Array.isArray(input.evidence) || !input.evidence.length || input.evidence.some(e => !/^[a-f0-9]{64}$/.test(e.candidate || ''))) throw Error('Experience needs exact candidate evidence');
    // Content identity makes retries and multiple clients idempotent. Never
    // promote remotely supplied status or overwrite an existing accepted case.
    const content = {summary:input.summary,cause:input.cause,prevention:input.prevention,classification:input.classification,scope:input.scope,evidence:input.evidence,verification:input.verification || {},actor:input.actor};
    const id = 'case-' + digest(content).slice(0,32);
    return this.mutate(async () => {
      const state = await this.read(), old = state.cases.find(c => c.id === id);
      if (old) return old;
      const entry = {...content,id,status:'candidate',revision:1,createdAt:new Date().toISOString()};
      await writeJSON(this.file, {...state,revision:state.revision+1,cases:[...state.cases,entry]}); return entry;
    });
  }
  async search({pages = [], site, query = '', includeCandidates = false} = {}) {
    const state = await this.read();
    const cases = state.cases.filter(c => (includeCandidates || c.status === 'active')
      && (!c.scope.site || c.scope.site === site)
      && (!pages.length || c.scope.pages.includes('*') || c.scope.pages.some(p => pages.includes(p)))
      && (!query || (c.summary+' '+c.cause+' '+c.prevention).toLowerCase().includes(query.toLowerCase())));
    return {revision:state.revision,cases,hash:digest(cases)};
  }
  async publish({id, expectedRevision, actor, reason}) {
    requireText(actor, 'Maintainer'); requireText(reason, 'Validation reason');
    return this.mutate(async () => {
      const state = await this.read(), entry = state.cases.find(c => c.id === id);
      if (!entry || entry.revision !== expectedRevision) throw Error('Experience revision is absent or stale');
      if (entry.classification === 'unclassified') throw Error('Unclassified dialogue feedback must be investigated before activation');
      if (!entry.verification.retested || !entry.verification.designerApproved) throw Error('Retest and designer approval are required before shared activation');
      if (entry.status === 'active') return entry;
      const active = {...entry,status:'active',revision:entry.revision+1,publishedBy:actor,reason,publishedAt:new Date().toISOString()};
      await writeJSON(this.file, {...state,revision:state.revision+1,cases:state.cases.map(c => c.id === id ? active : c)}); return active;
    });
  }
}

export class ExperienceClient {
  constructor({url, token = process.env.DA_EXPERIENCE_TOKEN, cache, timeout = 8000}) {
    const base = new URL(url);
    if (!['http:','https:'].includes(base.protocol) || base.username || base.password || base.search || base.hash) throw Error('Use a credential-free HTTP service address');
    this.url = base.href.replace(/\/$/,''); this.token = token; this.cache = cache; this.timeout = timeout;
  }
  async request(route, options = {}) {
    const response = await fetch(this.url + route, {...options,redirect:'error',signal:AbortSignal.timeout(this.timeout),headers:{...(this.token ? {authorization:'Bearer '+this.token} : {}),...options.headers}});
    if (!response.ok && response.status !== 304) throw Error('Experience service HTTP ' + response.status);
    return response;
  }
  async search(filter) {
    const key = digest(filter), file = this.cache && path.join(this.cache,key+'.json');
    const cached = file && await exists(file) ? await readJSON(file) : null;
    try {
      const query = new URLSearchParams({pages:filter.pages.join(','),site:filter.site || ''});
      const response = await this.request('/v1/lessons?'+query, {headers:cached ? {'if-none-match':cached.etag} : {}});
      if (response.status === 304 && cached) return {...cached.data,source:'remote-cache'};
      const data = await response.json();
      if (!Array.isArray(data.cases) || data.hash !== digest(data.cases) || data.cases.some(c => c.status !== 'active')) throw Error('Invalid published experience response');
      if (file) await writeJSON(file,{etag:response.headers.get('etag'),data});
      return {...data,source:'remote'};
    } catch (error) {
      if (cached) return {...cached.data,source:'offline-cache',warning:error.message};
      return {cases:[],hash:digest([]),source:'unavailable',warning:error.message};
    }
  }
  async capture(entry) {
    const response = await this.request('/v1/cases',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(entry)});
    return response.json();
  }
}

export async function learnTask({data, id, actor, summary, cause, prevention, classification = 'general', client}) {
  const task = await loadTask(data,id), candidate = task.candidates.at(-1);
  if (!candidate) throw Error('No candidate to learn from');
  const feedback = task.feedback.filter(f => f.decision === 'revise');
  if (!feedback.length) throw Error('Preserve actual designer correction feedback before extracting a lesson');
  const entry = {summary:requireText(summary,'Summary'),cause:requireText(cause,'Confirmed cause'),prevention:requireText(prevention,'Transferable prevention'),actor:requireText(actor,'Actor'),classification,
    scope:{pages:[...new Set(task.config.pages.map(p => p.family))],...(classification === 'site-preference' ? {site:task.repo} : {})},
    evidence:[...feedback.map(f => ({candidate:f.candidate,feedback:f.text,feedbackId:f.id})),{candidate:candidate.hash,sourceHash:digest(candidate.source),artifactHash:candidate.artifactHash}],
    verification:{retested:task.checks.every(c => task.results[c.id]?.candidate === candidate.hash && task.results[c.id].status === 'pass'),designerApproved:task.approval?.candidate === candidate.hash}};
  return queueCapture({data,id,entry,client});
}

async function queueCapture({data,id,entry,client}) {
  const store = new ExperienceStore(path.join(data,'experience')), local = await store.capture(entry);
  const outbox = path.join(data,'outbox',local.id+'.json'); await writeJSON(outbox,{entry:local,task:id});
  if (client) {
    try { const remote = await client.capture(local); await fs.unlink(outbox); return {local,remote,sync:'saved'}; }
    catch (error) { return {local,sync:'queued',reason:error.message}; }
  }
  return {local,sync:'local'};
}

export async function captureDialogue({data,id,client}) {
  const task = await loadTask(data,id), feedback = task.feedback.at(-1);
  if (!feedback) throw Error('No actual designer feedback to capture');
  const entry = {summary:feedback.text,cause:'Pending investigation; original designer feedback is preserved',prevention:'Pending verified correction; do not treat raw feedback as a shared rule',actor:feedback.actor,classification:'unclassified',scope:{pages:[...new Set(task.config.pages.map(p=>p.family))],site:task.repo},evidence:[{candidate:feedback.candidate,feedbackId:feedback.id,decision:feedback.decision}],verification:{retested:false,designerApproved:false}};
  return queueCapture({data,id,entry,client});
}

export async function syncOutbox(data, client) {
  const directory = path.join(data,'outbox'); if (!await exists(directory)) return {saved:0,pending:0};
  let saved = 0; const errors = [];
  for (const file of (await fs.readdir(directory)).filter(f => f.endsWith('.json'))) {
    try { await client.capture((await readJSON(path.join(directory,file))).entry); await fs.unlink(path.join(directory,file)); saved++; }
    catch (error) { errors.push({id:file,reason:error.message}); }
  }
  return {saved,pending:errors.length,errors};
}
