import path from 'node:path';
import fs from 'node:fs/promises';
import {readJSON,inside,checkPackage,packageRoot} from './common.mjs';

export async function context({root=packageRoot,page,mode='preserve',profile='standard',role='author',adapter,designer,stage='resolve',local=false,at=new Date().toISOString().slice(0,10)}={}){
  const integrity=await checkPackage(root);
  const config=await readJSON(path.join(root,'config/workspace.json'));
  adapter??=config.defaultAdapter;designer??=config.defaultDesigner;
  if(!config.pages.includes(page))throw Error('Unknown page: '+page);
  if(!['preserve','new-design','reuse','reference-rebuild'].includes(mode))throw Error('Unknown mode');
  if(!['standard','homepage-first'].includes(profile))throw Error('Unknown profile');
  if(profile==='homepage-first'&&mode!=='new-design')throw Error('homepage-first requires new-design');
  if(!['author','reviewer'].includes(role))throw Error('Unknown role');
  if(!['generic','codex','harness'].includes(adapter))throw Error('Unknown adapter');
  if(!['resolve','plan','make','check','review','deliver','all'].includes(stage))throw Error('Unknown stage');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(at))throw Error('at must be YYYY-MM-DD');
  const catalogue=await readJSON(path.join(root,'knowledge/index.json'));
  const workflowPath=`workflows/${config.defaultWorkflow}/workflow.json`;
  const workflow=await readJSON(inside(root,workflowPath));
  const capabilities=await readJSON(path.join(root,'config/mcp.json'));
  const entries=[...catalogue.entries];
  if(local){
    const privateIndex=await readJSON(path.join(root,'config/knowledge.local.json'));
    for(const entry of privateIndex.entries){
      if(!entry.id||!entry.source||!entry.version||!Array.isArray(entry.pages)||!entry.pages.length||!['active','candidate','draft','retired'].includes(entry.status))throw Error('Private knowledge needs identity, scope, source, version and status');
      if(entries.some(e=>e.id===entry.id))throw Error('Private knowledge cannot overwrite shared IDs');
      if(!entry.path.startsWith('knowledge/local/'))throw Error('Private entry must live under knowledge/local');
      entries.push({...entry,private:true});
    }
  }
  const matches=e=>(e.pages.includes('*')||e.pages.includes(page))&&(!e.modes||e.modes.includes(mode))&&(!e.profiles||e.profiles.includes(profile))&&(!e.roles||e.roles.includes(role))&&(!e.validFrom||e.validFrom<=at)&&(!e.validUntil||e.validUntil>=at);
  const selected=entries.filter(e=>e.status==='active'&&matches(e));
  const candidates=entries.filter(e=>e.status==='candidate'&&matches(e));
  const designerFile=inside(root,`designers/${designer}/profile.json`);
  const method=await readJSON(designerFile);
  if(method.status!=='active')throw Error('Designer is not active');
  const paths=[...config.core,workflowPath,'systems/generic.md',`systems/${adapter}.md`,method.method,...selected.map(e=>e.path)];
  for(const file of paths)await fs.readFile(inside(root,file));
  const stageById={
    'visual-completion':['plan','make','check','review'], 'research-informed-visual-craft':['plan','make','check','review'],
    'shared-business':['plan','make','check','review'], 'shared-craft':['plan','make','check','review'],
    'real-data':['plan','make','check','review'], 'independent-review':['review'],
    'detail-generation':['plan','make','check'], 'detail-review':['review'],
    'detail-layout-methods':['plan','make','check','review'], 'detail-measurement-standard':['plan','make','check','review'],
    'home-direction':['plan','make','review'], 'home-card-reference-methods':['plan','make','check','review'],
    'home-visual-calibration':['plan','make','check','review'],
    'card-density-and-diversity':['plan','make','check','review'], 'homepage-first':['plan','make','check','review'],
    'reference-rebuild':['plan','make','check','review']};
  const resources=selected.map(e=>({...e,kind:/\.(mjs|json)$/.test(e.path)?'asset':'instruction',stages:stageById[e.id]||['resolve','plan','make','check','review','deliver']}));
  const coreForStage=stage==='resolve'?['core/start.md','core/quality.md']:config.core;
  const read=[...new Set([...coreForStage,'systems/generic.md',`systems/${adapter}.md`,method.method,...resources.filter(r=>r.kind==='instruction'&&(stage==='all'||r.stages.includes(stage))).map(r=>r.path)])];
  const assets=resources.filter(r=>r.kind==='asset');
  return {...integrity,page,mode,profile,role,adapter,designer,stage,at,
    readiness:catalogue.pages[page],read,resources,assets,
    deferredRequired:resources.filter(r=>r.kind==='instruction'&&!read.includes(r.path)).map(({id,path,stages})=>({id,path,stages})),
    enabled:selected.map(({id,path,private:isPrivate})=>({id,path,private:!!isPrivate})),
    loading:'All enabled rules remain applicable. Read each phase before executing it. Assets are consumed by tools or queried as data, not discarded. Use stage=all for the full instruction set.',
    candidates:candidates.map(({id,path})=>({id,path})),
    toolGroups:Object.fromEntries(workflow.toolGroups[role].map(name=>{if(!capabilities.groups[name])throw Error('Missing capability group: '+name);return [name,capabilities.groups[name]];})),
    capabilityStatus:'not-checked',
    gaps:catalogue.pages[page].detail==='pending'?['Shared business, craft and card-density methods apply; the measured page-specific standard is still pending.']:catalogue.pages[page].detail==='partial'?['Page-specific detail is partial; apply shared rules and explicitly review unresolved page-specific geometry before claiming complete.']:[],
    reviewOrder:role==='reviewer'?['Freeze candidate identity','View actual pixels and record first impressions','Read selected rules and author plans','Complete actual checks and return one issue packet']:undefined,
    acceptance:'Context selection and integrity are not visual, functional, offline or owner acceptance.'};
}
