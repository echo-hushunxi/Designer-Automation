import fs from 'node:fs/promises';
import path from 'node:path';
import {files,hash,readJSON,writeJSON,inside} from './common.mjs';
import {coverageFor,doctor,reconcile,taskScopeHash} from './task.mjs';
import {validateModuleVisualRecord} from './module-review.mjs';
import {auditPortableOutputs,verifyPortableAutomaticLayout} from './automatic-layout.mjs';

const nonempty=value=>typeof value==='string'&&value.trim().length>0;
async function validateVisualEvidence(run,check,criteria){
  if(!criteria.every(key=>nonempty(check.observations?.[key])))throw Error('Visual check needs concrete observations for every criterion: '+check.id);
  if(!Array.isArray(check.pixelEvidence)||!check.pixelEvidence.length)throw Error('Visual check needs actual pixel evidence: '+check.id);
  for(const ref of check.pixelEvidence){
    if(typeof ref!=='string'||!check.evidence.includes(ref))throw Error('Pixel evidence must also be listed in check evidence: '+check.id);
    const bytes=await fs.readFile(inside(run,ref));
    const png=/\.png$/i.test(ref)&&bytes.length>=24&&bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
    const jpeg=/\.jpe?g$/i.test(ref)&&bytes.length>=4&&bytes[0]===255&&bytes[1]===216&&bytes.at(-2)===255&&bytes.at(-1)===217;
    const webp=/\.webp$/i.test(ref)&&bytes.length>=16&&bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP';
    if(!png&&!jpeg&&!webp)throw Error('Pixel evidence needs PNG/JPEG/WebP bytes, not a measurement or renamed text file: '+ref);
  }
}
async function validatedCoverage(run){
  const [coverage,context,template]=await Promise.all([
    readJSON(path.join(run,'inputs/coverage.json')),
    readJSON(path.join(run,'inputs/context.json')),
    readJSON(path.join(run,'inputs/package/templates/coverage.json'))
  ]);
  const requested=context.requestedProjects;
  let task;
  try{task=await readJSON(path.join(run,'inputs/task.json'));}catch(error){if(error.code!=='ENOENT')throw error;}
  if(task){
    if(context.coverageMode==='task-derived-v2'&&taskScopeHash(task)!==context.taskScopeHash)throw Error('Initial task scope changed; create a new run with explicit supersedes, do not shrink routes/modules/states');
    const expected=await coverageFor(task,path.join(run,'inputs/package'));
    if(expected.projects.some(p=>p.candidateId==='UNBOUND'))throw Error('Bind actual candidate IDs in task and regenerate coverage before freeze');
    if(JSON.stringify(coverage)!==JSON.stringify(expected))throw Error('Task-derived coverage changed or omitted an obligation; regenerate from task');
    if(JSON.stringify(task.projects.map(p=>p.id))!==JSON.stringify(requested))throw Error('Task projects differ from initial request');
  }else if(coverage.version===2||context.coverageMode==='task-derived-v2')throw Error('Version 2 coverage requires task.json');
  if(!Array.isArray(requested)||!requested.length||!Array.isArray(coverage.projects)
    ||coverage.projects.length!==requested.length
    ||new Set(coverage.projects.map(p=>p.projectId)).size!==requested.length
    ||requested.some(id=>!coverage.projects.some(p=>p.projectId===id&&nonempty(p.candidateId))))throw Error('Coverage projects must reconcile every requested project with a candidate identity');
  const dimensions=template.requiredDimensions;
  if(!Array.isArray(coverage.requiredDimensions)||JSON.stringify(coverage.requiredDimensions)!==JSON.stringify(dimensions))throw Error('Required quality dimensions cannot be omitted or changed');
  if(!Array.isArray(coverage.checks)||!coverage.checks.length||new Set(coverage.checks.map(c=>c.id)).size!==coverage.checks.length)throw Error('Coverage needs unique checks');
  for(const c of coverage.checks){
    const project=coverage.projects.find(p=>p.projectId===c.projectId);
    if(!project||c.candidateId!==project.candidateId||!c.id?.startsWith(c.projectId+'/')
      ||!dimensions.includes(c.dimension)
      ||['page','route','component','cardFamily','viewport','state','rule','ruleSource','expected'].some(k=>!nonempty(c[k]))
      ||!Array.isArray(c.samples)||!c.samples.length)throw Error('Coverage check needs project/candidate, dimension, page, route, component, card family, viewport, state, rule source, samples and expected result');
  }
  for(const project of coverage.projects)for(const dimension of dimensions)
    if(!coverage.checks.some(c=>c.projectId===project.projectId&&c.dimension===dimension))throw Error('Coverage missing '+project.projectId+'/'+dimension);
  return coverage;
}

export async function freeze(run){
  try{await fs.access(path.join(run,'candidate.lock.json'));throw Error('Candidate already frozen; use verify or create a new run');}catch(error){if(error.code!=='ENOENT')throw error;}
  const candidate=await files(path.join(run,'outputs'));
  if(!candidate.length)throw Error('Cannot freeze empty outputs');
  const inputs=await files(path.join(run,'inputs'));
  if(!inputs.some(f=>f.path==='context.json'))throw Error('Missing frozen context');
  await validatedCoverage(run);
  const automaticLayout=await auditPortableOutputs(run);
  const record={version:1,createdAt:new Date().toISOString(),inputs,candidate,acceptance:'not-reviewed',...(automaticLayout?{automaticLayout}:{})};
  await writeJSON(path.join(run,'candidate.lock.json'),record,true);
  return record;
}
export async function verify(run){
  const lock=await readJSON(path.join(run,'candidate.lock.json'));
  if(JSON.stringify(await files(path.join(run,'outputs')))!==JSON.stringify(lock.candidate)||JSON.stringify(await files(path.join(run,'inputs')))!==JSON.stringify(lock.inputs))throw Error('Frozen candidate or inputs changed');
  await verifyPortableAutomaticLayout(run,lock);
  return lock;
}
export async function sealReview(run,reviewPath){
  await verify(run);
  const review=await readJSON(reviewPath);
  const candidateHash=hash(await fs.readFile(path.join(run,'candidate.lock.json')));
  if(review.candidateHash!==candidateHash)throw Error('Review refers to another candidate');
  if(!['pass','revise','not-run'].includes(review.verdict)||!review.reviewer||!Array.isArray(review.checks)||!review.checks.length)throw Error('Review needs reviewer, verdict and nonempty checks');
  const context=await readJSON(path.join(run,'inputs/context.json'));
  if(review.reviewer===context.author)throw Error('Reviewer must differ from author');
  if(!Array.isArray(review.findings)||!Array.isArray(review.notRun))throw Error('Review needs findings and notRun');
  const coverage=await validatedCoverage(run);
  const template=await readJSON(path.join(run,'inputs/package/templates/coverage.json'));
  if(coverage.version===2){
    const task=await readJSON(path.join(run,'inputs/task.json'));
    const capabilities=await readJSON(path.join(run,'inputs/capabilities.json'));
    const capabilityStatus=await doctor(task,capabilities,path.join(run,'inputs'));
    const inventory=await readJSON(path.join(run,'review-1/inventory.json'));
    const inventoryStatus=await reconcile(task,inventory,path.join(run,'inputs/package'));
    for(const route of inventory.routes){
      if(!route.evidence.startsWith('review-1/'))throw Error('Inventory evidence must be under review-1');
      await fs.readFile(inside(run,route.evidence));
      if(template.visualDimensions?.['card-density-and-composition'])for(const card of route.moduleCards||[]){
        if(typeof card.evidence!=='string'||!card.evidence.startsWith('review-1/'))throw Error('Module inventory evidence must be under review-1');
        await fs.readFile(inside(run,card.evidence));
      }
    }
    if(review.verdict==='pass'&&(capabilityStatus.status!=='ready-for-execution'||inventoryStatus.status!=='matched'))throw Error('Capability or observed page/module inventory incomplete; cannot pass');
  }
  const expected=new Map(coverage.checks.map(c=>[c.id,c]));
  if(new Set(review.checks.map(c=>c.id)).size!==review.checks.length||review.checks.length!==expected.size||review.checks.some(c=>!expected.has(c.id)))throw Error('Review must cover every declared check exactly once');
  if(!Array.isArray(review.projectResults)||review.projectResults.length!==coverage.projects.length
    ||coverage.projects.some(p=>!review.projectResults.some(r=>r.projectId===p.projectId&&r.candidateId===p.candidateId&&['pass','revise','not-run'].includes(r.verdict))))throw Error('Review needs one exact-candidate result per requested project');
  for(const project of review.projectResults){
    const own=review.checks.filter(c=>c.projectId===project.projectId);
    if(project.verdict==='pass'&&(!own.some(c=>c.status==='pass')||own.some(c=>['fail','not-run'].includes(c.status))))throw Error('Project cannot pass with failed or unexecuted checks: '+project.projectId);
  }
  for(const c of review.checks){
    const plan=expected.get(c.id);
    if(c.projectId!==plan.projectId||c.candidateId!==plan.candidateId||c.dimension!==plan.dimension)throw Error('Review check identity differs from frozen coverage');
    if(coverage.version===2&&['page','route','component','cardFamily','viewport','state','ruleSource'].some(k=>c[k]!==plan[k]))throw Error('Review location/state differs from frozen coverage');
    if(!['pass','fail','not-run','not-applicable'].includes(c.status)||!c.id)throw Error('Invalid review check');
    if(plan.reviewKind==='visual'&&plan.component!=='whole-page'&&c.status==='not-applicable')throw Error('Required module visual check cannot be skipped as not-applicable: '+c.id);
    if(['pass','fail'].includes(c.status)){
      if(!Array.isArray(c.evidence)||!c.evidence.length)throw Error('Executed checks need local evidence');
      for(const ref of c.evidence){
        if(!ref.startsWith('review-1/'))throw Error('Review evidence must be under review-1');
        await fs.readFile(inside(run,ref));
      }
      const criteria=template.visualDimensions?.[c.dimension];
      if(criteria)await validateVisualEvidence(run,c,criteria);
      if(plan.reviewKind==='visual'&&plan.dimension==='card-density-and-composition'&&coverage.version===2)validateModuleVisualRecord(plan,c,c.pixelEvidence||[],{allowMissing:c.status==='fail'});
    }else if(!c.reason)throw Error('Unexecuted checks need a reason');
  }
  if(review.verdict==='pass'&&(!review.checks.some(c=>c.status==='pass')||review.notRun.length||review.findings.some(f=>f.blocking||['major','blocking','critical'].includes(f.severity))||review.checks.some(c=>['fail','not-run'].includes(c.status))||review.projectResults.some(r=>r.verdict!=='pass')))throw Error('Incomplete or failed review cannot pass');
  await fs.mkdir(path.join(run,'review-1'),{recursive:true});
  await writeJSON(path.join(run,'review-1/review.json'),review,true);
  const receipt={candidateHash,reviewFiles:await files(path.join(run,'review-1')),verdict:review.verdict,verification:'Integrity only; claims still require actual independent review'};
  await writeJSON(path.join(run,'review.lock.json'),receipt,true);
  return receipt;
}
export async function reveal(run,history){
  await verify(run);
  const lock=await readJSON(path.join(run,'review.lock.json'));
  if(lock.candidateHash!==hash(await fs.readFile(path.join(run,'candidate.lock.json')))||JSON.stringify(lock.reviewFiles)!==JSON.stringify(await files(path.join(run,'review-1'))))throw Error('Sealed review changed');
  const historicalFiles=await files(history);
  if(!historicalFiles.length)throw Error('Empty history');
  await fs.mkdir(path.join(run,'reveal')); // No overwrite / repeated reveal.
  for(const f of historicalFiles){const target=inside(path.join(run,'reveal'),f.path);await fs.mkdir(path.dirname(target),{recursive:true});await fs.copyFile(inside(history,f.path),target);}
  await writeJSON(path.join(run,'reveal.lock.json'),{files:historicalFiles,reviewLockHash:hash(await fs.readFile(path.join(run,'review.lock.json')))},true);
  return {status:'revealed',files:historicalFiles.length};
}
