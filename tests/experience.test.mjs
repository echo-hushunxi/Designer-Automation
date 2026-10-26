import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StreamableHTTPClientTransport} from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import {ExperienceStore,ExperienceClient,syncOutbox} from '../lib/experience.mjs';
import {startExperienceServer} from '../lib/experience-server.mjs';
import {digest,writeJSON} from '../lib/io.mjs';

const writer = 'writer-test-token-abcdefghijklmnopqrstuvwxyz', maintainer = 'maintainer-test-token-abcdefghijklmnopqrstuvwxyz';
const sample = () => ({summary:'Preserve long offer titles when fixing mobile capacity',cause:'Fixed width exceeded available space',prevention:'Check actual short and long content at breakpoint neighbors',actor:'synthetic-test-author',classification:'general',scope:{pages:['home']},evidence:[{candidate:digest('fixture-candidate')}],verification:{retested:true,designerApproved:true}});
async function fixture(t) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(),'da-experience-')); t.after(() => fs.rm(directory,{recursive:true,force:true}));
  const service = await startExperienceServer({directory:path.join(directory,'shared'),token:writer,maintainerToken:maintainer}); t.after(() => service.close());
  return {directory,service};
}
test('shared experience is idempotent, scoped, durable, and maintainer activation is separated from capture',async t => {
  const {directory,service} = await fixture(t), a = new ExperienceClient({url:service.url,token:writer}), b = new ExperienceClient({url:service.url,token:writer,cache:path.join(directory,'cache')});
  assert.equal((await fetch(service.url+'/v1/lessons')).status,401);
  const first = await a.capture(sample()), again = await a.capture({...sample(),status:'active'}); assert.equal(first.id,again.id); assert.equal(again.status,'candidate');
  assert.equal((await b.search({pages:['home']})).cases.length,0);
  const denied = await fetch(service.url+'/v1/publish',{method:'POST',headers:{authorization:'Bearer '+writer,'content-type':'application/json'},body:JSON.stringify({id:first.id,expectedRevision:1,actor:'test-maintainer',reason:'fixture'})}); assert.equal(denied.status,403);
  const active = await service.store.publish({id:first.id,expectedRevision:1,actor:'synthetic-maintainer',reason:'Protocol fixture approval'}); assert.equal(active.status,'active');
  assert.equal((await b.search({pages:['home']})).cases.length,1);
  assert.equal((await b.search({pages:['home']})).source,'remote-cache');
  assert.equal((await b.search({pages:['offer-detail']})).cases.length,0);
  const preference = await a.capture({...sample(),classification:'site-preference',scope:{pages:['home'],site:'site-a'}});
  await service.store.publish({id:preference.id,expectedRevision:1,actor:'test',reason:'fixture'});
  assert.equal((await b.search({pages:['home'],site:'site-b'})).cases.length,1);
  assert.equal((await b.search({pages:['home'],site:'site-a'})).cases.length,2);
  assert.equal((await new ExperienceStore(path.join(directory,'shared')).read()).cases.length,2);
  const unverified = await service.store.capture({...sample(),summary:'Not yet retested',verification:{retested:false,designerApproved:false}});
  await assert.rejects(service.store.publish({id:unverified.id,expectedRevision:1,actor:'test',reason:'fixture'}),/Retest/);
});
test('real MCP clients capture and query the same HTTP store; writers cannot publish',async t => {
  const {service} = await fixture(t);
  const client = new Client({name:'designer-fixture',version:'1.0.0'});
  const transport = new StreamableHTTPClientTransport(new URL(service.url+'/mcp'),{requestInit:{headers:{authorization:'Bearer '+writer}}});
  await client.connect(transport); t.after(() => client.close());
  const listed = await client.listTools(); assert.deepEqual(listed.tools.map(t=>t.name),['experience_search','experience_capture']);
  const captured = await client.callTool({name:'experience_capture',arguments:{case:sample()}}); assert(!captured.isError);
  const entry = JSON.parse(captured.content[0].text);
  await service.store.publish({id:entry.id,expectedRevision:1,actor:'synthetic-maintainer',reason:'fixture'});
  const found = await client.callTool({name:'experience_search',arguments:{pages:['home']}}); assert.equal(JSON.parse(found.content[0].text).cases.length,1);
  assert.equal((await service.store.read()).cases.length,1);
});
test('offline cache and outbox preserve cases and replay only pending records',async t => {
  const {directory,service} = await fixture(t), client = new ExperienceClient({url:service.url,token:writer,cache:path.join(directory,'cache')});
  const entry = await service.store.capture(sample()); await service.store.publish({id:entry.id,expectedRevision:1,actor:'test',reason:'fixture'});
  await client.search({pages:['home']});
  const offline = new ExperienceClient({url:'http://127.0.0.1:1',token:writer,cache:path.join(directory,'cache'),timeout:100});
  assert.equal((await offline.search({pages:['home']})).source,'offline-cache');
  await writeJSON(path.join(directory,'outbox',entry.id+'.json'),{entry});
  assert.equal((await syncOutbox(directory,offline)).pending,1);
  assert.equal((await syncOutbox(directory,client)).saved,1);
  assert.equal((await syncOutbox(directory,client)).saved,0);
  assert.equal((await service.store.read()).cases.length,1);
  await assert.rejects(startExperienceServer({directory,host:'0.0.0.0'}),/token/);
});
