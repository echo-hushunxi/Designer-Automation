import fs from 'node:fs/promises';
import path from 'node:path';
import {readJSON,inside,hash,packageRoot} from './common.mjs';
import {validateSampleCases,reconcileModuleCards,moduleReviewWidths} from './module-review.mjs';

const nonempty=v=>typeof v==='string'&&v.trim().length>0;
const unique=(values,label)=>{if(!Array.isArray(values)||!values.length||new Set(values).size!==values.length)throw Error(label+' must be nonempty and unique');};
const safeId=v=>nonempty(v)&&/^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/.test(v);
export const taskScopeHash=task=>{const scope=structuredClone(task);for(const p of scope.projects)delete p.candidateId;return hash(JSON.stringify(scope));};
export async function validateTask(task,root=packageRoot){
  const catalogue=await readJSON(path.join(root,'config/page-contracts.json'));
  const moduleVisualRequired=Boolean((await readJSON(path.join(root,'templates/coverage.json'))).visualDimensions?.['card-density-and-composition']);
  if(task.version!==2||!nonempty(task.request)||!['new-design','reuse','preserve','reference-rebuild'].includes(task.mode)||!['harness','codex','generic'].includes(task.adapter))throw Error('Task needs version 2, original request, mode and adapter');
  if(!nonempty(task.author)||!nonempty(task.delivery)||!nonempty(task.data?.provenance)||!['api','frozen-snapshot'].includes(task.data?.kind))throw Error('Task needs author, delivery and real data provenance');
  unique(task.projects?.map(p=>p.id),'Task projects');
  for(const project of task.projects){
    if(!safeId(project.id)||!nonempty(project.source)||!nonempty(project.designIntent))throw Error('Project needs id, source and its own design intent');
    unique(project.pages?.map(p=>p.id),'Project pages');
    for(const page of project.pages){
      if(!catalogue.pages[page.id])throw Error('Unknown page: '+page.id);
      unique(page.routes,'Representative routes');
      if(page.routes.some(r=>!nonempty(r)||!r.startsWith('/')))throw Error('Routes must be explicit site paths');
      unique(page.modules?.map(m=>m.id),'Page modules');
      for(const required of catalogue.pages[page.id].modules){
        if(!page.modules.some(m=>m.id===required))throw Error('Missing required module '+project.id+'/'+page.id+'/'+required);
      }
      if(!Array.isArray(page.breakpoints)||page.breakpoints.some(w=>!Number.isInteger(w)||w<240||w>3840))throw Error('Declare actual viewport breakpoints (empty array is allowed if none)');
      for(const module of page.modules){
        if(!safeId(module.id))throw Error('Unsafe module id');
        if(module.excluded){
          if(task.mode!=='preserve'||!nonempty(module.reason))throw Error('Only explicitly scoped preserve work may exclude a module with reason');
          continue;
        }
        if(!nonempty(module.selector)||!nonempty(module.cardFamily)||!nonempty(module.designDecision))throw Error('Module needs selector, card family and design decision');
        unique(module.states,'Module states');unique(module.samples,'Module samples');
        if(module.states.some(s=>!safeId(s))||!module.states.includes('initial'))throw Error('States need safe IDs including initial');
        const expected=catalogue.states[module.id]||['initial'];
        for(const state of expected)if(!module.states.includes(state)&&!nonempty(module.notApplicable?.[state]))throw Error('Missing state '+page.id+'/'+module.id+'/'+state+'; declare actual absence with reason');
        if(moduleVisualRequired)validateSampleCases(module);
      }
    }
  }
  return task;
}

// Expected obligations come from the request and public module contract, not from the candidate DOM.
export async function coverageFor(task,root=packageRoot){
  await validateTask(task,root);
  const template=await readJSON(path.join(root,'templates/coverage.json'));
  const visualDimensions=template.visualDimensions||{};
  const catalogue=await readJSON(path.join(root,'knowledge/index.json'));
  const visualVersion=catalogue.entries.find(e=>e.id==='visual-completion')?.version;
  const automatic=(await readJSON(path.join(root,'config/workspace.json'))).version.localeCompare('2026-10-24.2',undefined,{numeric:true})>=0&&task.mode!=='preserve';
  const checks=[];
  for(const p of task.projects)for(const page of p.pages){
    const widths=[...new Set([1440,1024,768,393,320,...page.modules.filter(m=>!m.excluded).flatMap(m=>moduleReviewWidths(page,m))])].sort((a,b)=>b-a);
    const visualSamples=page.modules.filter(m=>!m.excluded).flatMap(m=>m.samples);
    for(const route of page.routes)for(const m of page.modules)if(!m.excluded){
      for(const width of widths)for(const state of [...new Set([...m.states,...automatic?['initial-no-script']:[]])]){
        checks.push({id:`${p.id}/${page.id}/${encodeURIComponent(route)}/${m.id}/${width}/${state}`,projectId:p.id,candidateId:p.candidateId||'UNBOUND',
          dimension:'responsive-geometry',page:page.id,route,component:m.id,selector:m.selector,cardFamily:m.cardFamily,viewport:`${width}x900`,state,
          rule:'Inspect the full module and its actual fields, capacity, hierarchy, gaps, actions and state at this width; use the selected page rules.',ruleSource:'core/quality.md + context(page, mode, role, stage=check)',samples:m.samples,expected:m.designDecision});
      }
      // Separate obligations prevent a static screenshot or two stable frames
      // from standing in for loading, text capacity and interactive states.
      for(const width of widths)for(const state of ['load-settled','short-long-content','hover-focus-pressed','reduced-motion','redraw-scrollbar']){
        checks.push({id:`${p.id}/${page.id}/${encodeURIComponent(route)}/${m.id}/${width}/stability/${state}`,projectId:p.id,candidateId:p.candidateId||'UNBOUND',
          dimension:'layout-stability',page:page.id,route,component:m.id,selector:m.selector,cardFamily:m.cardFamily,viewport:`${width}x900`,state,
          rule:'Compare the same entity and declared field tracks with the initial baseline. Preserve ordinary capacity and positions; inspect scrollbar and nested text. Record actual before/after evidence; absent behavior needs a reason, missing execution is not-run.',
          ruleSource:'global-layout-baseline + frozen layout inspector',samples:m.samples,expected:m.designDecision});
      }
      if(visualDimensions['card-density-and-composition'])for(const width of moduleReviewWidths(page,m))checks.push({id:`${p.id}/${page.id}/${encodeURIComponent(route)}/${m.id}/visual/card-density-and-composition/${width}`,projectId:p.id,candidateId:p.candidateId||'UNBOUND',
        dimension:'card-density-and-composition',page:page.id,route,component:m.id,selector:m.selector,cardFamily:m.cardFamily,viewport:`${width}x900`,state:'initial',reviewKind:'visual',
        criteria:[...visualDimensions['card-density-and-composition'],...(m.criteria||[])],sampleCases:m.samplesByWidth?.[width]?.sampleCases||m.sampleCases,
        rule:'Inspect this actual module and card family, not a substitute featured card. Bind real short/long samples, the complete group and last row to readable pixels; explain space and action ownership.',
        ruleSource:'core/quality.md + card-density-and-diversity',samples:m.samples,expected:m.designDecision});
    }
    for(const [dimension,criteria] of Object.entries(visualDimensions).filter(([dimension])=>dimension!=='card-density-and-composition'))for(const route of page.routes)for(const width of [1440,393]){
      checks.push({id:`${p.id}/${page.id}/${encodeURIComponent(route)}/visual/${dimension}/${width}`,projectId:p.id,candidateId:p.candidateId||'UNBOUND',
        dimension,page:page.id,route,component:'whole-page',cardFamily:'all-applicable',viewport:`${width}x900`,state:'initial',reviewKind:'visual',criteria,
        rule:'Observe actual pixels before author rationale; document each criterion within the authorized scope and bind real pixel evidence. Keep other widths and redraw/state checks in their own coverage.',
        ruleSource:'core/quality.md + visual-completion@'+(visualVersion||'frozen-package'),samples:visualSamples.length?visualSamples:page.routes,expected:p.designIntent});
    }
    for(const dimension of template.requiredDimensions.filter(d=>!['responsive-geometry','layout-stability'].includes(d)&&!visualDimensions[d]))checks.push({id:`${p.id}/${page.id}/whole-page/${dimension}`,projectId:p.id,candidateId:p.candidateId||'UNBOUND',dimension,page:page.id,route:page.routes[0],component:'whole-page',cardFamily:'all-applicable',viewport:'PC + mobile + declared breakpoints',state:'all-applicable',rule:dimension,ruleSource:'core/quality.md',samples:page.routes,expected:'Reconcile all modules, routes and state evidence. No average score or inherited pass.'});
  }
  return {version:2,taskHash:hash(JSON.stringify(task)),projects:task.projects.map(p=>({projectId:p.id,candidateId:p.candidateId||'UNBOUND'})),requiredDimensions:template.requiredDimensions,checks};
}

export async function doctor(task,capabilities,base){
  const required=['read-files','write-source','build','browser-read','browser-interaction','screenshot','geometry','independent-review'];
  if(/zip|offline|离线/i.test(task.delivery))required.push('offline');
  if(task.adapter==='harness')required.push('native-workflow','native-preflight','native-handoff','native-review');
  const checks=[];
  for(const name of required){
    const c=capabilities[name];let status='not-run',reason='Missing verified binding',evidenceHash;
    if(c&&nonempty(c.tool)&&nonempty(c.evidence)&&c.status==='verified'){
      const file=inside(base,c.evidence);const bytes=await fs.readFile(file);if(!bytes.length)throw Error('Empty capability evidence: '+name);
      evidenceHash=hash(bytes);status='pass';reason='Recorded binding with local evidence; reviewer must verify its actual capability and scope';
    }
    checks.push({name,status,tool:c?.tool,reason,evidence:c?.evidence,evidenceHash});
  }
  return {status:checks.every(c=>c.status==='pass')?'ready-for-execution':'blocked',checks,acceptance:'Capability evidence is not page acceptance. Never install tools, execute arbitrary supplied shell strings or bypass native gates automatically.'};
}

export async function reconcile(task,inventory,root=packageRoot){
  const moduleVisualRequired=Boolean((await readJSON(path.join(root,'templates/coverage.json'))).visualDimensions?.['card-density-and-composition']);
  const expected=task.projects.flatMap(p=>p.pages.flatMap(page=>page.routes.map(route=>({project:p.id,page:page.id,route,moduleSpecs:page.modules,modules:page.modules.filter(m=>!m.excluded).map(m=>m.id).sort()}))));
  const key=r=>JSON.stringify([r.project,r.page,r.route]);
  unique(inventory.routes?.map(key),'Observed routes');
  const failures=[];
  for(const wanted of expected){
    const actual=inventory.routes.find(r=>key(r)===key(wanted));
    if(!actual){failures.push({route:wanted.route,project:wanted.project,reason:'missing route'});continue;}
    if(!Array.isArray(actual.modules)||JSON.stringify([...actual.modules].sort())!==JSON.stringify(wanted.modules))failures.push({project:wanted.project,route:wanted.route,reason:'module inventory differs',expected:wanted.modules,actual:actual.modules});
    if(!nonempty(actual.evidence))failures.push({project:wanted.project,route:wanted.route,reason:'missing observed inventory evidence'});
    if(moduleVisualRequired)failures.push(...reconcileModuleCards(wanted.moduleSpecs,actual).map(f=>({project:wanted.project,route:wanted.route,...f})));
  }
  for(const observed of inventory.routes)if(!expected.some(r=>key(r)===key(observed)))failures.push({route:observed.route,reason:'undeclared route; expand task or explicitly explain out-of-scope in separate report'});
  return {status:failures.length?'revise':'matched',failures,limit:'Inventory evidence must be collected from actual candidate by a reviewer. This cannot detect dishonest inventory declarations.'};
}
