import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {packageRoot,readJSON,writeJSON,checkPackage,hash} from '../bin/common.mjs';
import {context} from '../bin/knowledge.mjs';
import {runCLI} from '../bin/da.mjs';
import {coverageFor,validateTask,doctor,reconcile} from '../bin/task.mjs';
import {freeze,verify,sealReview} from '../bin/blind.mjs';
import {moduleReviewWidths} from '../bin/module-review.mjs';

async function automaticFixture(run,task){
  process.env.SITE_BROWSER_EXECUTABLE ||= '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  process.env.DA_PLAYWRIGHT_MODULE ||= import.meta.resolve('playwright-core');
  for(const project of task.projects){
    const checks=[],nodes=[];
    for(const module of project.pages[0].modules){
      const tag=module.id==='header'?'header':module.id==='footer'?'footer':'section';
      checks.push({id:module.id,moduleId:module.id,type:'box',selector:module.selector,width:[1,2560]});
      const offer=/coupon|offer/i.test(module.cardFamily);
      const directory=/merchant|store|category|topic/i.test(module.cardFamily);
      if(offer)checks.push({id:module.id+'-flow',moduleId:module.id,type:'action-flow',selector:module.selector+' article',action:'a',content:'h3,time',media:'img',maxViewport:760});
      if(directory)for(const [id,minReadableWidth,minViewport,maxViewport]of[['phone',120,320,1089],['wide',180,1090,2560]])checks.push({id:module.id+'-packing-'+id,moduleId:module.id,type:'packing',selector:module.selector+' .directory',items:'a',minReadableWidth,maxItemWidth:240,gap:20,gapRange:[15,30],minViewport,maxViewport});
      nodes.push('<'+tag+' data-module="'+module.id+'">'+(offer?'<article><img width="70" height="70" alt="Merchant"><div><h3>Save on your next order</h3><time>May 28, 2027</time></div><a href="#claim" aria-label="Get code">→</a></article>':directory?'<div class="directory"><a href="#first">First</a><a href="#last">Last</a></div>':'Fixture '+module.id)+'</'+tag+'>');
    }
    const root=path.join(run,'outputs',project.artifactRoot);await fs.mkdir(root+'/en',{recursive:true});
    await fs.writeFile(root+'/en/index.html','<style>*{box-sizing:border-box}body{margin:0;font:16px Arial}article{display:grid;grid-template-columns:70px 1fr 44px;gap:12px;align-items:center}article a{display:grid;width:44px;height:44px;place-items:center}h3{font-size:16px;margin:0}.directory{display:grid;grid-template-columns:repeat(2,minmax(0,180px));gap:20px}</style><main>'+nodes.join('')+'</main>');
    await writeJSON(path.join(run,'inputs',project.layoutBudget),{pages:[{id:'home',routePattern:'en/index.html',checks}]});
  }
}

const fixture=async()=>{const task=await readJSON(path.join(packageRoot,'templates/task.json'));task.projects[0].candidateId='fixture-build';return task;};
// Synthetic image and observations exercise report integrity only, never aesthetics.
const fixturePNG=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jL1sAAAAASUVORK5CYII=','base64');
const visualFixture=c=>c.reviewKind==='visual'?{observations:Object.fromEntries(c.criteria.map(key=>[key,'Synthetic '+key+' observation; integrity fixture only'])),pixelEvidence:['review-1/fixture.png'],...(c.sampleCases?{observedSamples:c.sampleCases,evidenceViews:['group','short','long','last-row'].map(view=>({view,evidence:'review-1/fixture.png'}))}:{})}:{};
const inventoryFixture=(p,page,route,evidence)=>({project:p.id,page:page.id,route,modules:page.modules.filter(m=>!m.excluded).map(m=>m.id),markedRoles:page.modules.filter(m=>!m.excluded).map(m=>m.markedRole||m.id),moduleCards:page.modules.filter(m=>!m.excluded).map(m=>({module:m.id,cardFamily:m.cardFamily,sampleIds:m.sampleCases.map(c=>c.id),evidence})),evidence});
test('standalone package validates and every active rule is routed without loading executable source',async()=>{
  await checkPackage();
  const catalogue=await readJSON(path.join(packageRoot,'knowledge/index.json'));
  for(const page of Object.keys(catalogue.pages))for(const role of ['author','reviewer']){
    const start=await context({page,role}),all=await context({page,role,stage:'all'});
    const routed=new Set([...all.read,...all.assets.map(a=>a.path)]);
    for(const e of start.enabled)assert(routed.has(e.path),`Lost ${page}/${role}/${e.id}`);
    assert(!start.read.some(p=>p.endsWith('.mjs')));
    assert(start.read.every(p=>all.read.includes(p)||p==='core/start.md'));
  }
});
test('coverage is generated per route/module/width/state; deleting a required role or state fails',async()=>{
  const task=await fixture(),plan=await coverageFor(task);
  for(const width of [320,393,639,640,641,768,999,1000,1001,1024,1440])assert(plan.checks.some(c=>c.viewport===`${width}x900`));
  const broken=structuredClone(task);broken.projects[0].pages[0].modules.pop();await assert.rejects(validateTask(broken),/Missing required module/);
  const detail=structuredClone(task),contract=await readJSON(path.join(packageRoot,'config/page-contracts.json'));
  detail.projects[0].pages=[{id:'offer-detail',routes:['/offers/a/'],breakpoints:[],modules:contract.pages['offer-detail'].modules.map(id=>({id,selector:'main',cardFamily:id,designDecision:'Own grouping',states:['initial'],samples:['real-record'],sampleCases:['short','long','last-row'].map(role=>({role,id:'fixture-'+id+'-'+role}))}))}];
  await assert.rejects(validateTask(detail),/Missing state/);
  broken.projects[0].pages[0].modules.push({...task.projects[0].pages[0].modules.at(-1),excluded:true,reason:'want fewer checks'});
  await assert.rejects(validateTask(broken),/Only explicitly scoped preserve/);
});
test('missing capabilities and mismatched observed inventory cannot become ready',async()=>{
  const task=await fixture();assert.equal((await doctor(task,{},packageRoot)).status,'blocked');
  const p=task.projects[0],page=p.pages[0],row=inventoryFixture(p,page,page.routes[0],'review-1/observed.json');
  assert.equal((await reconcile(task,{routes:[row]})).status,'matched');
  assert.equal((await reconcile(task,{routes:[{...row,modules:row.modules.slice(1)}]})).status,'revise');
  await assert.rejects(reconcile(task,{routes:[row,row]}),/unique/);
  const wrongFamily=structuredClone(row);wrongFamily.moduleCards[0].cardFamily='a-substitute-featured-family';
  assert.equal((await reconcile(task,{routes:[wrongFamily]})).status,'revise');
  const missingSample=structuredClone(row);missingSample.moduleCards[0].sampleIds.pop();
  assert.equal((await reconcile(task,{routes:[missingSample]})).status,'revise');
  const extraRole=structuredClone(row);extraRole.markedRoles.push('undeclared-seasonal-offers');
  assert.equal((await reconcile(task,{routes:[extraRole]})).status,'revise');
});
test('exported folder works in isolation and freezes task-derived coverage without host repository',async t=>{
  const temp=await fs.mkdtemp(path.join(os.tmpdir(),'da-clean-'));t.after(()=>fs.rm(temp,{recursive:true,force:true}));
  const root=path.join(temp,'distribution','package');await runCLI(['pack','--output',root]);
  assert.equal((await checkPackage(root)).manifestHash,(await checkPackage()).manifestHash);
  const task=await fixture(),taskFile=path.join(temp,'task.json');await writeJSON(taskFile,task);
  const {run}=await runCLI(['init','--root',root,'--id','isolated','--task',taskFile]);
  const coverage=await readJSON(path.join(run,'inputs/coverage.json'));
  await fs.writeFile(path.join(run,'outputs/index.html'),'<main>Test fixture only</main>');
  const smaller=structuredClone(task);smaller.projects[0].pages[0].breakpoints=[];
  await writeJSON(path.join(run,'inputs/task.json'),smaller);await writeJSON(path.join(run,'inputs/coverage.json'),await coverageFor(smaller));
  await assert.rejects(freeze(run),/Initial task scope changed/);
  await writeJSON(path.join(run,'inputs/task.json'),task);
  await writeJSON(path.join(run,'inputs/coverage.json'),{...coverage,checks:coverage.checks.slice(1)});
  await assert.rejects(freeze(run),/omitted an obligation/);
  await writeJSON(path.join(run,'inputs/coverage.json'),coverage);await automaticFixture(run,task);const locked=await freeze(run);assert.equal(locked.automaticLayout.length,1);await verify(run);await assert.rejects(freeze(run),/already frozen/);await verify(run);
  await fs.appendFile(path.join(run,'outputs/index.html'),'changed');await assert.rejects(verify(run),/changed/);
  assert(!(await fs.readdir(root)).includes('node_modules'));
});
test('review cannot re-label a frozen check as another route, width or state; incomplete capability remains blocked',async t=>{
  const temp=await fs.mkdtemp(path.join(os.tmpdir(),'da-review-'));t.after(()=>fs.rm(temp,{recursive:true,force:true}));
  const root=path.join(temp,'package');await runCLI(['pack','--output',root]);
  const task=await fixture();task.delivery='local';const taskFile=path.join(temp,'task.json');await writeJSON(taskFile,task);
  const {run}=await runCLI(['init','--root',root,'--id','review-fixture','--task',taskFile]);
  const coverage=await readJSON(path.join(run,'inputs/coverage.json'));
  await fs.writeFile(path.join(run,'outputs/index.html'),'<main>Test fixture only, no aesthetic claim</main>');
  const capabilities=Object.fromEntries(['read-files','write-source','build','browser-read','browser-interaction','screenshot','geometry','independent-review'].map(name=>[name,{tool:'test fixture binding',status:'verified',evidence:'probe.txt'}]));
  await fs.writeFile(path.join(run,'inputs/probe.txt'),'Synthetic fixture to test integrity only');
  await writeJSON(path.join(run,'inputs/capabilities.json'),capabilities);await automaticFixture(run,task);await freeze(run);
  const p=task.projects[0];await writeJSON(path.join(run,'review-1/inventory.json'),{routes:p.pages.flatMap(page=>page.routes.map(route=>inventoryFixture(p,page,route,'review-1/fixture.txt')))});
  await fs.writeFile(path.join(run,'review-1/fixture.txt'),'Test evidence fixture; not a real page review');
  await fs.writeFile(path.join(run,'review-1/fixture.png'),fixturePNG);
  const report={reviewer:'separate-fixture-actor',candidateHash:hash(await fs.readFile(path.join(run,'candidate.lock.json'))),verdict:'pass',projectResults:coverage.projects.map(p=>({...p,verdict:'pass'})),checks:coverage.checks.map(c=>({...c,status:'pass',evidence:['review-1/fixture.txt','review-1/fixture.png'],...visualFixture(c)})),findings:[],notRun:[]};
  const file=path.join(temp,'review.json');
  for(const field of ['page','route','component','cardFamily','viewport','state','ruleSource']){
    const wrong=structuredClone(report);wrong.checks[0][field]='wrong';await writeJSON(file,wrong);
    await assert.rejects(sealReview(run,file),/location\/state differs/);
  }
  const inventory=await readJSON(path.join(run,'review-1/inventory.json'));inventory.routes[0].modules.pop();await writeJSON(path.join(run,'review-1/inventory.json'),inventory);await writeJSON(file,report);
  await assert.rejects(sealReview(run,file),/inventory incomplete/);
  inventory.routes[0].modules=p.pages[0].modules.map(m=>m.id);await writeJSON(path.join(run,'review-1/inventory.json'),inventory);
  const visualIndex=report.checks.findIndex(c=>c.dimension==='page-composition-and-rhythm');
  for(const mutate of [
    c=>{delete c.observations;},
    c=>{c.observations[c.criteria[0]]=' ';},
    c=>{delete c.observations.alignmentAndBalance;},
    c=>{delete c.pixelEvidence;},
    c=>{c.pixelEvidence=['review-1/fixture.txt'];},
    c=>{c.pixelEvidence=['review-1/renamed.png'];c.evidence.push('review-1/renamed.png');},
    c=>{c.evidence=['review-1/fixture.txt'];}
  ]){
    await fs.writeFile(path.join(run,'review-1/renamed.png'),'measurement JSON renamed to PNG');
    const wrong=structuredClone(report);mutate(wrong.checks[visualIndex]);await writeJSON(file,wrong);
    await assert.rejects(sealReview(run,file),/Visual check needs|Pixel evidence|pixel evidence/);
  }
  const missing=structuredClone(report);missing.checks.splice(visualIndex,1);await writeJSON(file,missing);
  await assert.rejects(sealReview(run,file),/every declared check/);
  const densityIndex=report.checks.findIndex(c=>c.dimension==='card-density-and-composition'&&c.component==='more-offers');
  const skippedModules=structuredClone(report);for(const c of skippedModules.checks.filter(c=>c.dimension==='card-density-and-composition'))Object.assign(c,{status:'not-applicable',reason:'Synthetic false blanket skip'});await writeJSON(file,skippedModules);
  await assert.rejects(sealReview(run,file),/Required module visual check cannot be skipped/);
  const missingInventory=structuredClone(inventory);missingInventory.routes[0].moduleCards[0].evidence='review-1/nonexistent-module-evidence.json';await writeJSON(path.join(run,'review-1/inventory.json'),missingInventory);await writeJSON(file,report);
  await assert.rejects(sealReview(run,file),/ENOENT/);await writeJSON(path.join(run,'review-1/inventory.json'),inventory);
  for(const mutate of [
    c=>{delete c.observedSamples;},
    c=>{c.observedSamples=c.observedSamples.map(s=>({...s,id:'substitute-featured-record'}));},
    c=>{c.evidenceViews=c.evidenceViews.filter(v=>v.view!=='last-row');},
    c=>{c.pixelEvidence=[];}
  ]){const wrong=structuredClone(report);mutate(wrong.checks[densityIndex]);await writeJSON(file,wrong);await assert.rejects(sealReview(run,file),/Module visual check|Visual check needs/);}
  const omittedModule=structuredClone(report);omittedModule.checks.splice(densityIndex,1);await writeJSON(file,omittedModule);
  await assert.rejects(sealReview(run,file),/every declared check/);
  const honestFailure=structuredClone(report),failed=honestFailure.checks[densityIndex];failed.status='fail';failed.observedSamples=failed.observedSamples.filter(s=>s.role!=='last-row');failed.missingSamples=failed.sampleCases.filter(s=>s.role==='last-row').map(s=>({...s,reason:'Synthetic actual last card absent'}));failed.evidenceViews=failed.evidenceViews.filter(v=>v.view!=='last-row');failed.missingViews=[{view:'last-row',reason:'Synthetic absent last card cannot be photographed'}];honestFailure.verdict='revise';honestFailure.projectResults[0].verdict='revise';
  const failureRun=path.join(temp,'honest-failure-run');await fs.cp(run,failureRun,{recursive:true});
  const failureFile=path.join(temp,'failure.json');await writeJSON(failureFile,honestFailure);assert.equal((await sealReview(failureRun,failureFile)).verdict,'revise');
  for(const status of ['fail','not-run']){
    const wrong=structuredClone(report);wrong.checks[visualIndex].status=status;wrong.checks[visualIndex].reason='Synthetic failure';await writeJSON(file,wrong);
    await assert.rejects(sealReview(run,file),/cannot pass/);
  }
  const major=structuredClone(report);major.findings.push({severity:'major',observation:'Synthetic unresolved visual defect',blocking:false});await writeJSON(file,major);
  await assert.rejects(sealReview(run,file),/cannot pass/);
  await writeJSON(file,report);
  assert.equal((await sealReview(run,file)).verdict,'pass');
});

test('visual methods reach all adapters at the author and reviewer phases without widening preserve or reference scope',async()=>{
  const visualPath='knowledge/imported/skills/site-design/references/visual-completion.md',craftPath='knowledge/imported/skills/site-design/references/creative-craft.md';
  for(const page of ['home','offer-detail','store-detail','about'])for(const adapter of ['harness','codex','generic'])for(const mode of ['new-design','reuse','preserve','reference-rebuild']){
    for(const role of ['author','reviewer'])for(const stage of role==='author'?['plan','make','check']:['review']){
      const selected=await context({page,adapter,mode,role,stage});
      assert(selected.read.includes(visualPath),[page,adapter,mode,role,stage].join('/'));
      assert.equal(selected.read.includes(craftPath),['new-design','reuse'].includes(mode));
      if(page==='about')assert.equal(selected.readiness.detail,'pending');
    }
  }
  const start=await context({page:'home',mode:'new-design',stage:'resolve'});
  assert(!start.read.includes(visualPath));assert(start.deferredRequired.some(e=>e.id==='visual-completion'));
});

test('every project and representative route gets separate PC/mobile visual obligations',async()=>{
  const task=await fixture();task.projects[0].pages[0].routes.push('/en/another/');
  task.projects.push({...structuredClone(task.projects[0]),id:'second-project',candidateId:'second-build'});
  const coverage=await coverageFor(task),template=await readJSON(path.join(packageRoot,'templates/coverage.json'));
  const dimensions=Object.keys(template.visualDimensions);
  assert.equal(dimensions.length,4);
  assert(template.visualDimensions['page-composition-and-rhythm'].includes('alignmentAndBalance'));
  for(const project of task.projects)for(const route of project.pages[0].routes)for(const dimension of dimensions.filter(d=>d!=='card-density-and-composition'))for(const width of [1440,393]){
    const checks=coverage.checks.filter(c=>c.projectId===project.id&&c.route===route&&c.dimension===dimension&&c.viewport===`${width}x900`);
    assert.equal(checks.length,1);assert.equal(checks[0].reviewKind,'visual');assert.deepEqual(checks[0].criteria,template.visualDimensions[dimension]);
  }
  for(const project of task.projects)for(const route of project.pages[0].routes)for(const module of project.pages[0].modules)for(const width of [1440,393,320]){
    const checks=coverage.checks.filter(c=>c.projectId===project.id&&c.route===route&&c.component===module.id&&c.dimension==='card-density-and-composition'&&c.viewport===`${width}x900`);
    assert.equal(checks.length,1);assert.deepEqual(checks[0].sampleCases,module.sampleCases);assert.equal(checks[0].reviewKind,'visual');
  }
  const expected=task.projects.reduce((n,p)=>n+p.pages.reduce((n,page)=>n+page.routes.length*(page.modules.reduce((n,m)=>n+moduleReviewWidths(page,m).length,0)+(dimensions.length-1)*2),0),0);
  assert.equal(coverage.checks.filter(c=>c.reviewKind==='visual').length,expected);
  assert(coverage.checks.some(c=>c.state==='initial-no-script'));
  const scoped=await fixture();scoped.mode='preserve';
  for(const module of scoped.projects[0].pages[0].modules)Object.assign(module,{excluded:true,reason:'Existing region outside this repair; keep it explicitly accounted for'});
  const preserved=await coverageFor(scoped);
  assert(!preserved.checks.some(c=>c.dimension==='responsive-geometry'));
  assert(preserved.checks.every(c=>c.samples.length),'Scoped exclusions retain references for explicit not-applicable decisions');
});
