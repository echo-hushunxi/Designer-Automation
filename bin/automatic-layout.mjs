import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {files,hash,inside,readJSON} from './common.mjs';

export async function automaticLayoutRequired(run) {
  const config=await readJSON(path.join(run,'inputs/package/config/workspace.json'));
  if(config.version.localeCompare('2026-10-24.2',undefined,{numeric:true})<0)return false;
  const task=await readJSON(path.join(run,'inputs/task.json')).catch(error=>{if(error.code==='ENOENT')return null;throw error;});
  if(!task){const context=await readJSON(path.join(run,'inputs/context.json'));if(context.mode==='preserve')return false;throw Error('New package automatic layout requires task.json; historical runs retain their frozen older package');}
  return task.mode!=='preserve';
}
export async function auditPortableOutputs(run) {
  if(!await automaticLayoutRequired(run))return undefined;
  const task=await readJSON(path.join(run,'inputs/task.json')),candidateHash=hash(JSON.stringify(await files(path.join(run,'outputs')))),reports=[];
  const runner=await import(pathToFileURL(path.join(run,'inputs/package/knowledge/imported/skills/site-design-review/scripts/automatic-layout.mjs')).href);
  for(const project of task.projects){
    if(!project.artifactRoot||!project.layoutBudget)throw Error('Automatic layout needs project.artifactRoot under outputs and project.layoutBudget under inputs: '+project.id);
    const root=inside(path.join(run,'outputs'),project.artifactRoot),planFile=inside(path.join(run,'inputs'),project.layoutBudget),bytes=await fs.readFile(planFile),plan=JSON.parse(bytes),layoutBudget=plan.layoutBudget||plan;
    const modulesByPage={};
    for(const page of project.pages){
      const mapped=layoutBudget.pages?.find(p=>p.id===page.id);if(!mapped)throw Error('Automatic layout missing page budget: '+page.id);
      modulesByPage[page.id]=page.modules.filter(m=>!m.excluded);
      for(const module of modulesByPage[page.id]){
        const checks=mapped.checks.filter(c=>c.moduleId===module.id&&c.optional!==true);
        if(!checks.length)throw Error('Automatic layout missing module budget: '+page.id+'/'+module.id);
        if(/coupon|offer/i.test(module.cardFamily)&&!checks.some(c=>c.type==='action-flow'))throw Error('Automatic layout missing offer action-flow: '+page.id+'/'+module.id);
        if(/merchant|store|category|topic/i.test(module.cardFamily))for(const width of[320,375,393,649,768,1090,1440])if(!checks.some(c=>c.type==='packing'&&Array.isArray(c.gapRange)&&width>=(c.minViewport??0)&&width<=(c.maxViewport??Infinity)))throw Error('Automatic layout missing actual host packing and visible gaps: '+page.id+'/'+module.id+' at '+width);
      }
    }
    const identity={projectId:project.id,candidateId:project.candidateId,candidateHash,planHash:hash(bytes)};
    const result=await runner.runAutomaticLayout({root,layoutBudget,identity,output:path.join(run,'automatic-layout',project.id),modulesByPage,breakpoints:project.pages.flatMap(p=>[...(p.breakpoints||[]),...(p.modules||[]).flatMap(m=>m.breakpoints||[])])});
    if(result.status!=='pass')throw Error('Automatic layout blocks freeze: '+project.id+' ('+(result.error||result.failures[0]?.reason||result.reportPath)+'). See '+result.reportPath);
    reports.push({projectId:project.id,identity,status:result.status,reportPath:path.relative(run,result.reportPath),reportHash:result.reportHash});
  }
  return reports;
}
export async function verifyPortableAutomaticLayout(run,lock) {
  if(!await automaticLayoutRequired(run))return;
  const task=await readJSON(path.join(run,'inputs/task.json')),candidateHash=hash(JSON.stringify(lock.candidate));
  if(lock.automaticLayout?.length!==task.projects.length)throw Error('Automatic layout is missing for one or more projects');
  for(const project of task.projects){
    const result=lock.automaticLayout.find(r=>r.projectId===project.id);if(!result)throw Error('Automatic layout missing project: '+project.id);
    const bytes=await fs.readFile(inside(run,result.reportPath)),report=JSON.parse(bytes),planHash=hash(await fs.readFile(inside(path.join(run,'inputs'),project.layoutBudget)));
    const identity={projectId:project.id,candidateId:project.candidateId,candidateHash,planHash};
    if(result.status!=='pass'||hash(bytes)!==result.reportHash||report.status!=='pass'||report.failures?.length||!report.results?.length||JSON.stringify(report.identity)!==JSON.stringify(identity))throw Error('Automatic layout report changed, failed or belongs to another candidate');
    const {assertAutomaticLayoutReport}=await import(pathToFileURL(path.join(run,'inputs/package/knowledge/imported/skills/site-design-review/scripts/automatic-layout.mjs')).href);
    const plan=await readJSON(inside(path.join(run,'inputs'),project.layoutBudget));
    assertAutomaticLayoutReport(report,{identity,budgetHash:hash(JSON.stringify(plan.layoutBudget||plan))});
  }
}
