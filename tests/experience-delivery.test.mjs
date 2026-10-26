import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {spawn} from 'node:child_process';
import {ExperienceStore,ExperienceClient,captureDialogue} from '../lib/experience.mjs';
import {ReliableExperienceClient} from '../lib/experience-delivery.mjs';
import {ExperienceBridgeClient} from '../lib/experience-bridge.mjs';
import {startExperienceServer} from '../lib/experience-server.mjs';
import {caseContent,capturedCase,caseId} from '../lib/experience-case.mjs';
import {digest,writeJSON,exists} from '../lib/io.mjs';

const candidate=digest('synthetic-approved-candidate');
const sample=(summary='Synthetic confirmed correction')=>({summary,cause:'Synthetic protocol fixture cause',prevention:'Preserve the verified correction for matching pages',actor:'synthetic-agent',classification:'general',scope:{pages:['home']},evidence:[{candidate}],verification:{retested:true,designerApproved:true,candidate},approval:{decision:'approve',actor:'synthetic-designer',text:'Synthetic confirmation; not real site acceptance',candidate,at:'2026-10-26T00:00:00.000Z'}});
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function until(predicate,timeout=10000) { const deadline=Date.now()+timeout; while(Date.now()<deadline){if(await predicate())return;await sleep(50);}throw Error('Automatic delivery did not finish within test deadline'); }
async function fixture(t) {
  const directory=await fs.mkdtemp(path.join(os.tmpdir(),'da-delivery-'));t.after(()=>fs.rm(directory,{recursive:true,force:true}));
  const store=new ExperienceStore(path.join(directory,'shared'));let service=await startExperienceServer({store,allowAnonymous:true});
  const url=service.url,port=service.server.address().port;let active=true;
  t.after(async()=>{if(active)await service.close();});
  return {directory,store,url,stop:async()=>{await service.close();active=false;},start:async()=>{service=await startExperienceServer({store,allowAnonymous:true,port});active=true;}};
}
test('exact designer confirmation activates scoped lessons immediately through MCP without maintainer credentials',async t=>{
  const {directory,store,url}=await fixture(t),client=new ReliableExperienceClient({url,data:directory});t.after(()=>client.close());
  const saved=await client.capture(sample());assert.equal(saved.status,'active');assert.equal(saved.shared,true);
  assert.equal((await client.search({pages:['home']})).cases.length,1);assert.equal((await client.search({pages:['home']})).source,'remote-cache');
  assert.equal((await client.capture(sample())).id,saved.id);assert.equal((await store.read()).cases.length,1);
  const scoped=sample('Synthetic site preference');scoped.classification='site-preference';scoped.scope.site='synthetic-a';await client.capture(scoped);
  assert.equal((await client.search({pages:['home'],site:'synthetic-b'})).cases.length,1);
  await assert.rejects(client.capture({...sample(),approval:{...sample().approval,candidate:digest('stale')}}),/match/);
  await assert.rejects(client.capture({...sample(),classification:'unclassified'}),/classified/);
  await assert.rejects(client.capture({...sample(),verification:{retested:false,designerApproved:true,candidate}}),/match/);
});
test('MCP-only workbench bridge automatically captures a confirmed lesson from exact task feedback',async t=>{
  const {directory,store,url}=await fixture(t),bridge=new ExperienceBridgeClient({url,data:path.join(directory,'client')});t.after(()=>bridge.close());
  const task={id:'fixture',repo:'synthetic-site',config:{pages:[{family:'home'}]},candidates:[{hash:candidate,source:{'index.html':digest('fixture')},artifactHash:digest('synthetic-artifact')}],checks:[{id:'fixture-check'}],results:{'fixture-check':{candidate,status:'pass'}},feedback:[{id:'feedback-1',candidate:digest('previous'),actor:'synthetic-designer',text:'Synthetic correction request',decision:'revise'},{id:'feedback-2',candidate,actor:'synthetic-designer',text:sample().approval.text,decision:'approve',lessons:[{summary:sample().summary,cause:sample().cause,prevention:sample().prevention,classification:'general'}]}],approval:{candidate,actor:'synthetic-designer',text:sample().approval.text,at:sample().approval.at}};
  await writeJSON(path.join(directory,'tasks/fixture/task.json'),task);
  const result=await captureDialogue({data:directory,id:'fixture',client:bridge});assert.equal(result.sync,'saved');assert.equal(result.records[0].status,'active');
  const active=(await store.search({pages:['home']})).cases[0];assert.equal(active.approval.candidate,candidate);assert.equal(active.approval.text,task.approval.text);
  // An automatic repair can be approved without an earlier designer rejection.
  const repaired={...task,id:'auto-fixture',events:[{type:'repair',from:digest('auto-before'),files:['style.css'],at:sample().approval.at}],feedback:[{...task.feedback.at(-1),lessons:[{...task.feedback.at(-1).lessons[0],summary:'Synthetic approved automatic repair'}]}]};
  await writeJSON(path.join(directory,'tasks/auto-fixture/task.json'),repaired);
  const automatic=await captureDialogue({data:directory,id:'auto-fixture',client:bridge});assert.equal(automatic.records[0].status,'active');assert.equal((await store.search({pages:['home']})).cases.length,2);
});
test('disconnected capture survives caller exit; detached worker retries automatically after recovery with one stored case',async t=>{
  const f=await fixture(t),client=new ReliableExperienceClient({url:f.url,data:path.join(f.directory,'client'),timeout:300,retryMin:50,retryMax:150});
  await f.stop();const result=await client.capture(sample());assert.equal(result.sync,'queued');assert.equal(result.shared,false);assert.equal((await client.syncStatus()).pending,1);
  await client.close(); // No open Agent or caller is required for the worker to finish.
  await f.start();await until(async()=>((await f.store.read()).cases.length===1));
  await until(async()=>!(await exists(path.join(client.directory,'worker.lock'))));
  assert.equal((await f.store.search({pages:['home']})).cases[0].status,'active');assert.equal((await client.syncStatus()).pending,0);
  const peer=new ExperienceClient({url:f.url});t.after(()=>peer.close());assert.equal((await peer.search({pages:['home']})).cases.length,1);
});
test('pending records resume at startup and lost acknowledgements are safely retried',async t=>{
  const {directory,store,url}=await fixture(t),data=path.join(directory,'resumed'),entry=sample('Synthetic lost acknowledgement');
  const client=new ReliableExperienceClient({url,data,retryMin:50,retryMax:100});t.after(()=>client.close());
  // Simulate a previous process ending after the server committed but before its local acknowledgement.
  await store.capture(caseContent(entry));await client.initialize();await client.enqueue(caseContent(entry));await client.resume();
  await until(async()=>(await client.syncStatus()).pending===0);await until(async()=>!(await exists(path.join(client.directory,'worker.lock'))));
  assert.equal((await store.read()).cases.length,1);
});
test('offline reads use endpoint-specific cache and old outboxes resume without a manual command',async t=>{
  const f=await fixture(t),data=path.join(f.directory,'client'),client=new ReliableExperienceClient({url:f.url,data,timeout:300,retryMin:50,retryMax:100});t.after(()=>client.close());
  await client.capture(sample());await client.search({pages:['home']});await f.stop();assert.equal((await client.search({pages:['home']})).source,'offline-cache');
  const other=new ReliableExperienceClient({url:'http://127.0.0.1:1',data,timeout:100,autoWorker:false});t.after(()=>other.close());assert.equal((await other.search({pages:['home']})).source,'unavailable');
  const entry=caseContent(sample('Synthetic legacy outbox'));await writeJSON(path.join(data,'outbox',caseId(entry)+'.json'),{entry});
  const resumed=new ReliableExperienceClient({url:f.url,data,timeout:300,retryMin:50,retryMax:100});t.after(()=>resumed.close());await resumed.resume();await f.start();
  await until(async()=>(await f.store.read()).cases.length===2);await until(async()=>!(await exists(path.join(resumed.directory,'worker.lock'))));assert.equal((await resumed.syncStatus()).pending,0);
});

test('permanent rejection preserves the original record and does not retry it forever',async t=>{
  const f=await fixture(t),client=new ReliableExperienceClient({url:f.url,data:path.join(f.directory,'client')});t.after(()=>client.close());
  f.store.capture=async()=>{throw Error('Synthetic permanent rejection');};
  await assert.rejects(client.capture(sample()),/rejected/);
  const status=await client.syncStatus();assert.equal(status.pending,0);assert.equal(status.rejected,1);
  const record=JSON.parse(await fs.readFile(path.join(client.rejected,(await fs.readdir(client.rejected))[0]),'utf8'));assert.equal(record.entry.summary,sample().summary);assert.match(record.reason,/permanent rejection/);
});
