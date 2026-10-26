import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {randomBytes} from 'node:crypto';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StreamableHTTPClientTransport} from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import {MongoExperienceStore} from '../lib/experience-mongo.mjs';
import {ExperienceClient} from '../lib/experience.mjs';
import {startExperienceServer} from '../lib/experience-server.mjs';
import {backupDocument,writeBackup,readBackup} from '../lib/experience-backup.mjs';
import {digest,readJSON} from '../lib/io.mjs';

const testConfig = process.env.DA_EXPERIENCE_TEST_CONFIG;
const options = {skip:!testConfig};
const sample = summary=>({summary:summary || 'Synthetic Mongo fixture',cause:'Protocol test',prevention:'Keep idempotency and publication guards',actor:'synthetic-mongo-test',classification:'general',scope:{pages:['home']},evidence:[{candidate:digest('mongo-fixture')}],verification:{retested:true,designerApproved:true}});
async function fixture(t) {
  const {mongo}=await readJSON(testConfig), suffix=randomBytes(8).toString('hex');
  const config={...mongo,collection:'test_'+suffix}, store=await MongoExperienceStore.connect(config);
  const restored='restore_test_'+suffix;
  t.after(async()=>{try{await store.collection.drop();await store.client.db(store.database).collection(restored).drop().catch(e=>{if(e.code!==26) throw e;});}finally{await store.close();}});
  return {store,config,restored};
}
test('MongoDB keeps concurrent captures idempotent, publication atomic, and records durable across clients',options,async t=>{
  const {store,config}=await fixture(t), peer=await MongoExperienceStore.connect(config);t.after(()=>peer.close());
  const captured=await Promise.all(Array.from({length:20},()=>store.capture(sample())));assert.equal(new Set(captured.map(c=>c.id)).size,1);assert.equal(await store.collection.countDocuments(),1);
  const args={id:captured[0].id,expectedRevision:1,actor:'synthetic-maintainer',reason:'Protocol fixture'};
  const published=await Promise.allSettled([store.publish(args),peer.publish(args)]);assert.equal(published.filter(p=>p.status==='fulfilled').length,1);
  const active=(await peer.search({pages:['home']})).cases[0];assert.equal(active.revision,2);
  assert.equal((await peer.search({pages:['offer-detail']})).cases.length,0);assert.equal((await peer.search({query:'.*'})).cases.length,0);
  const scoped=await store.capture({...sample('Synthetic site preference'),classification:'site-preference',scope:{pages:['home'],site:'synthetic-a'}});await store.publish({...args,id:scoped.id});
  assert.equal((await peer.search({pages:['home'],site:'synthetic-b'})).cases.length,1);assert.equal((await peer.search({pages:['home'],site:'synthetic-a'})).cases.length,2);
  const pending=await store.capture({...sample('Synthetic raw feedback'),classification:'unclassified'});await assert.rejects(store.publish({...args,id:pending.id}),/Unclassified/);
  assert.equal((await peer.read()).cases.length,3);
});
test('MongoDB snapshot backup restores every lifecycle field into a new collection and preserves live data',options,async t=>{
  const {store,restored}=await fixture(t), root=await fs.mkdtemp(path.join(os.tmpdir(),'da-mongo-restore-'));t.after(()=>fs.rm(root,{recursive:true,force:true}));
  const approved={...sample(),verification:{retested:true,designerApproved:true,candidate:digest('mongo-fixture')},approval:{decision:'approve',actor:'synthetic-designer',text:'Synthetic confirmation for backup protocol only',candidate:digest('mongo-fixture'),at:'2026-10-26T00:00:00.000Z'}};
  const entry=await store.capture(approved);assert.equal(entry.status,'active');await store.capture({...sample('Synthetic pending feedback'),verification:{retested:false,designerApproved:false}});
  const state=await store.read(), archive=await writeBackup(root,backupDocument(state,{database:store.database,collection:store.collectionName})), source=await readBackup(archive.file);
  const result=await store.restoreInto(restored,source.cases);assert.equal(result.count,2);assert.equal(result.hash,source.hash);assert.equal(result.liveCollectionUnchanged,store.collectionName);
  await assert.rejects(store.restoreInto(restored,[]));await assert.rejects(store.restoreInto(store.collectionName,[]),/live collection/);
  assert.deepEqual(await store.read(),state);assert.deepEqual(await store.importCases(state.cases),{inserted:0,total:2});
  const conflicting={...state.cases[0],createdAt:new Date(Date.now()+1000).toISOString()};await assert.rejects(store.importCases([conflicting]),/conflicts/);assert.deepEqual(await store.read(),state);
});
test('anonymous HTTP/MCP use MongoDB; snapshot requires maintainer; restart keeps shared records',options,async t=>{
  const {store,config}=await fixture(t), maintainer='synthetic-maintainer-token-abcdefghijklmnopqrstuvwxyz';
  // This fixture owns the connection; the service gets a non-owning wrapper.
  const service=await startExperienceServer({store:new Proxy(store,{get:(target,key)=>key==='close'?async()=>{}:typeof target[key]==='function'?target[key].bind(target):target[key]}),allowAnonymous:true,maintainerToken:maintainer});t.after(()=>service.close());
  const client=new Client({name:'synthetic-mongo-mcp',version:'1'});await client.connect(new StreamableHTTPClientTransport(new URL(service.url+'/mcp')));t.after(()=>client.close());
  assert.deepEqual((await client.listTools()).tools.map(t=>t.name),['experience_search','experience_capture']);
  const result=await client.callTool({name:'experience_capture',arguments:{case:sample()}});assert(!result.isError);assert.equal((await store.read()).cases.length,1);
  assert.equal((await fetch(service.url+'/health').then(r=>r.json())).backend,'mongodb');assert.equal((await fetch(service.url+'/v1/admin/snapshot')).status,403);
  const snapshot=await fetch(service.url+'/v1/admin/snapshot',{headers:{authorization:'Bearer '+maintainer}}).then(r=>r.json());assert.equal(snapshot.count,1);
  const restarted=await startExperienceServer({mongo:config,allowAnonymous:true});t.after(()=>restarted.close());
  const replay=await new ExperienceClient({url:restarted.url}).capture(sample());assert.equal(replay.id,JSON.parse(result.content[0].text).id);assert.equal((await store.read()).cases.length,1);
  const approved={...sample('Synthetic automatic sharing'),verification:{retested:true,designerApproved:true,candidate:digest('mongo-fixture')},approval:{decision:'approve',actor:'synthetic-designer',text:'Synthetic confirmation for automatic activation only',candidate:digest('mongo-fixture'),at:'2026-10-26T00:00:00.000Z'}};
  const saved=await client.callTool({name:'experience_capture',arguments:{case:approved}});assert.equal(JSON.parse(saved.content[0].text).status,'active');
  const peer=new ExperienceClient({url:restarted.url});t.after(()=>peer.close());assert.equal((await peer.search({pages:['home']})).cases.length,1);
});
