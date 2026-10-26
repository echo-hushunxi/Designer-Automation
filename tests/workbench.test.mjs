import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {root,digest,command,readJSON,writeJSON} from '../lib/io.mjs';
import {openTask,prepare,repair,loadTask,recordObservations,confirmCoverage,handoff,feedback,verifyCandidate} from '../lib/workbench.mjs';
import {lessonSpec} from './experience-fixture.mjs';
import {audit,status} from '../lib/audit.mjs';
import {ensurePreview,stopPreview} from '../lib/preview.mjs';

const executable = process.env.SITE_BROWSER_EXECUTABLE;
async function fixture(t) {
  const temp = await fs.mkdtemp(path.join(os.tmpdir(),'da-maintenance-')), repo = path.join(temp,'source.git'),data = path.join(temp,'data');
  t.after(() => fs.rm(temp,{recursive:true,force:true})); await fs.mkdir(repo);
  await fs.writeFile(path.join(repo,'index.html'),'<!doctype html><html><head><link rel="stylesheet" href="style.css"></head><body><main><h1>Save on your next order</h1><p>Actual audit fixture</p><a href="detail.html">View details</a></main></body></html>');
  await fs.writeFile(path.join(repo,'detail.html'),'<!doctype html><html><head><link rel="stylesheet" href="style.css"></head><body><main><h1>Offer detail</h1><button id="copy" onclick="this.textContent=\'Copied\'">Copy</button></main></body></html>');
  await fs.writeFile(path.join(repo,'style.css'),'body{margin:0;font:16px Arial}main{width:900px}button{min-height:44px}');
  await command(['git','init','-b','main'],repo);
  // Local fixture history is test data, not an authored delivery commit.
  await command(['git','add','.'],repo);
  await command(['git','-c','user.name=Fixture','-c','user.email=fixture@invalid.test','commit','-m','test fixture\n\nPenny: recvlpqd9p'],repo);
  const config = {version:1,request:'Fix responsive overflow while preserving both page identities',artifactRoot:'.',allowedPaths:['**/*.html','**/*.css'],widths:[320,393,1440],commands:{},pages:[
    {id:'home',family:'home',route:'/index.html',dependsOn:['index.html']},
    {id:'detail',family:'offer-detail',route:'/detail.html',dependsOn:['detail.html'],interactions:[{id:'copy-feedback',actions:[{type:'click',selector:'#copy'}],expected:[{type:'text',selector:'#copy',value:'Copied'}]}]}
  ]};
  const task = await openTask({data,id:'trial',repo,config}); return {temp,repo,data,config,task};
}
async function observeVisuals(data,id) {
  const task = await loadTask(data,id), candidate = task.candidates.at(-1);
  const observations = task.checks.filter(c => c.kind === 'visual' && task.results[c.id]?.status === 'needs-observation').map(check => ({id:check.id,status:'pass',actor:'synthetic-test-observer',observations:Object.fromEntries(check.criteria.map(key => [key,'Synthetic protocol fixture; this is not a real aesthetic verdict.']))}));
  if (observations.length) await recordObservations({data,id,candidate:candidate.hash,observations});
}
test('Git clone is isolated and reused; exact repairs build new immutable candidates and scope/staleness are enforced',async t => {
  const {repo,data,config} = await fixture(t);
  const again = await openTask({data,id:'trial',repo,config}); assert.equal(again.reusedWorkspace,true);
  let task = await prepare(data,'trial'), candidate = task.candidates.at(-1);
  const original = await fs.readFile(path.join(task.source,'style.css'),'utf8');
  await assert.rejects(repair({data,id:'trial',candidate:candidate.hash,edits:[{file:'package.json',expectedHash:'x',find:'x',replace:'y'}]}),/outside authorized/);
  await assert.rejects(repair({data,id:'trial',candidate:'stale',edits:[]}),/stale/);
  task = await repair({data,id:'trial',candidate:candidate.hash,edits:[{file:'style.css',expectedHash:digest(original),find:'width:900px',replace:'max-width:900px;width:100%'}]});
  assert.notEqual(task.candidates.at(-1).hash,candidate.hash);
  assert.equal(await fs.readFile(path.join(repo,'style.css'),'utf8'),original);
  assert.equal(await fs.readFile(path.join(candidate.directory,'site/style.css'),'utf8'),original);
  assert.equal((await prepare(data,'trial')).reusedBuild,true);
  await assert.rejects(feedback({data,id:'trial',candidate:task.candidates.at(-1).hash,actor:'test',text:'fixture',decision:'approve'}),/before approval/);
  await fs.writeFile(path.join(task.source,'unexpected.txt'),'external change');
  await assert.rejects(prepare(data,'trial'),/outside authorized/);
});

test('real browser cycle detects overflow, fixes it, reuses unchanged checks, widens shared CSS, and binds human feedback', {skip:!executable}, async t => {
  const {data} = await fixture(t);
  await prepare(data,'trial');
  let task = await audit({data,id:'trial',executable});
  assert.equal(task.lastAudit.visits,9); // Six initial route/width visits plus three interactions.
  assert.equal(task.lastAudit.executed,15); // Layout and visual share their actual browser visit.
  assert(Object.values(task.results).some(r => r.status === 'fail'));
  assert(Object.values(task.results).some(r => r.status === 'needs-observation'));
  await assert.rejects(handoff(data,'trial'),/coverage/);
  const original = await fs.readFile(path.join(task.source,'style.css'),'utf8');
  task = await repair({data,id:'trial',candidate:task.candidates.at(-1).hash,edits:[{file:'style.css',expectedHash:digest(original),find:'width:900px',replace:'max-width:900px;width:100%'}]});
  task = await audit({data,id:'trial',executable}); assert.equal(task.lastAudit.executed,15);
  await observeVisuals(data,'trial');
  await confirmCoverage({data,id:'trial',actor:'test-fixture',notes:'Synthetic two-page fixture covers declared page states; not production acceptance'});
  task = await handoff(data,'trial'); assert.equal(task.status,'awaiting-designer');
  const preview = await ensurePreview(data,'trial'); t.after(() => stopPreview(data,'trial'));
  const secondPreview = await ensurePreview(data,'trial'); assert.equal(secondPreview.pid,preview.pid); assert(secondPreview.reused);
  task = await audit({data,id:'trial',executable}); assert.equal(task.lastAudit.executed,0); assert.equal(task.lastAudit.reused,15); assert.equal(task.lastAudit.visits,0);
  const homeChecks = task.checks.filter(c => c.page === 'home').map(c => c.id);
  task = await feedback({data,id:'trial',candidate:task.candidates.at(-1).hash,actor:'synthetic-designer',text:'Fixture: improve the home heading',checkIds:homeChecks});
  await assert.rejects(handoff(data,'trial'),/feedback/);
  const html = await fs.readFile(path.join(task.source,'index.html'),'utf8');
  task = await repair({data,id:'trial',candidate:task.candidates.at(-1).hash,edits:[{file:'index.html',expectedHash:digest(html),find:'Save on your next order',replace:'Browse current offers'}]});
  task = await audit({data,id:'trial',executable});
  assert.equal(task.lastAudit.executed,6); assert.equal(task.lastAudit.reused,9); assert.equal(task.lastAudit.visits,3);
  assert.equal((await fetch(preview.url+'/index.html')).headers.get('x-designer-candidate'),task.candidates.at(-1).hash);
  assert.match(await (await fetch(preview.url+'/index.html')).text(),/Browse current offers/);
  await observeVisuals(data,'trial'); await handoff(data,'trial');
  task = await feedback({data,id:'trial',candidate:task.candidates.at(-1).hash,actor:'synthetic-designer',text:'Synthetic workflow approval only',decision:'approve',lessons:[{...lessonSpec(),classification:'site-preference'}]});
  assert.equal(task.status,'approved');
  const style = await fs.readFile(path.join(task.source,'style.css'),'utf8');
  await repair({data,id:'trial',candidate:task.candidates.at(-1).hash,edits:[{file:'style.css',expectedHash:digest(style),find:'margin:0',replace:'margin:0;padding:0'}]});
  task = await audit({data,id:'trial',executable}); assert.equal(task.lastAudit.executed,15); assert.equal(task.approval,null);
  await observeVisuals(data,'trial');
  task = await audit({data,id:'trial',executable}); assert.equal(task.lastAudit.reused,15);
  const evidence = task.results[homeChecks[0]].evidence[0]; await fs.writeFile(evidence.path,'tampered');
  await assert.rejects(handoff(data,'trial'),/Evidence changed/);
  task = await audit({data,id:'trial',executable}); assert(task.lastAudit.executed >= 2);
  await fs.writeFile(path.join(task.candidates.at(-1).directory,'site/index.html'),'tampered');
  await assert.rejects(verifyCandidate(task),/Frozen candidate changed/);
});

test('original generation implementation and policy files are pinned in the independent package',async () => {
  const baseline = await readJSON(path.join(root,'compatibility/generation-baseline.json'));
  for (const entry of baseline.files) assert.equal(digest(await fs.readFile(path.join(root,entry.path))),entry.sha256,'Changed legacy generation source: '+entry.path);
});
