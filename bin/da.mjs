#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {context} from './knowledge.mjs';
import {freeze,verify,sealReview,reveal} from './blind.mjs';
import {packageRoot,checkPackage,readJSON,writeJSON,inside} from './common.mjs';
import {validateTask,coverageFor,doctor,reconcile,taskScopeHash} from './task.mjs';

export async function runCLI(args){
  const [command,...rest]=args,options={};
  if(!command||command==='help'||command==='--help')return {
    entry:'Read AGENTS.md and core/start.md; paths are relative to the portable package, not a developer machine.',
    commands:{check:'check [--root PACKAGE]',pages:'pages',policy:'policy',context:'context --page PAGE --mode MODE --adapter ADAPTER --role ROLE --stage resolve|plan|make|check|review|deliver|all',
      doctor:'doctor --task task.json --capabilities capabilities.json',plan:'plan --task task.json --output coverage.json',
      init:'init --id unique-run-id --task task.json',reconcile:'reconcile --task task.json --inventory inventory.json',
      freeze:'freeze --run runs/ID (new sites automatically run JS/noJS responsive layout before locking)',verify:'verify --run runs/ID',review:'seal-review --run runs/ID --review /actual/review.json',
      pack:'pack --output /new/nonexistent/directory',tests:'node --test tests/portable.test.mjs'},
    acceptance:'New-site freeze automatically runs the actual-output responsive audit. Missing browser capability or failed/missing coverage blocks readiness. Independent pixel and interaction review and native gates remain required.'};
  for(let i=0;i<rest.length;i+=2){if(!rest[i].startsWith('--')||!rest[i+1]||rest[i+1].startsWith('--'))throw Error('Options require --key value');options[rest[i].slice(2)]=rest[i+1];}
  const root=path.resolve(options.root||packageRoot);
  if(command==='check')return checkPackage(root);
  if(command==='context')return context({...options,root,local:options.local==='true'});
  if(command==='pages')return {pages:(await readJSON(path.join(root,'knowledge/index.json'))).pages,contracts:await readJSON(path.join(root,'config/page-contracts.json')),acceptance:'Registered business coverage is not completed page-specific visual acceptance.'};
  if(command==='policy'){
    const policy=await readJSON(path.join(root,'knowledge/imported/policy/owner-design-rejections.json'));
    return JSON.parse(JSON.stringify(policy,(key,value)=>['fingerprints','artifactHash','zipHash','currentBuild'].includes(key)?undefined:value));
  }
  if(command==='plan'&&options.task){
    await checkPackage(root);
    const task=await readJSON(path.resolve(options.task)),coverage=await coverageFor(task,root);
    if(options.output)await writeJSON(path.resolve(options.output),coverage);
    return options.output?{checks:coverage.checks.length,output:path.resolve(options.output),taskHash:coverage.taskHash}:coverage;
  }
  if(command==='doctor'&&options.task&&options.capabilities){
    const task=await validateTask(await readJSON(path.resolve(options.task)),root);
    return doctor(task,await readJSON(path.resolve(options.capabilities)),path.dirname(path.resolve(options.capabilities)));
  }
  if(command==='reconcile'&&options.task&&options.inventory)return reconcile(await validateTask(await readJSON(path.resolve(options.task)),root),await readJSON(path.resolve(options.inventory)));
  if(command==='pack'&&options.output){
    const checked=await checkPackage(root),destination=path.resolve(options.output);
    if(destination===root||destination.startsWith(root+path.sep))throw Error('Pack destination must be outside source package');
    await fs.mkdir(path.dirname(destination),{recursive:true});
    await fs.mkdir(destination); // No overwrite, no private runs/credentials.
    const manifest=await readJSON(path.join(root,'manifest.json'));
    for(const f of [...manifest.files,{path:'manifest.json'}]){const target=inside(destination,f.path);await fs.mkdir(path.dirname(target),{recursive:true});await fs.copyFile(inside(root,f.path),target);}
    await checkPackage(destination);return {...checked,destination};
  }
  if(command==='init'){
    if(!/^[a-z0-9][a-z0-9-]{0,79}$/.test(options.id||''))throw Error('Use a unique lowercase run id');
    const task=options.task?await validateTask(await readJSON(path.resolve(options.task)),root):null;
    if(!task&&options.legacy!=='true')throw Error('New agent runs require --task task.json. --legacy true is for explicit historical compatibility only, not complete task coverage.');
    if(task){options.author=task.author;options.page=task.projects[0].pages[0].id;options.mode=task.mode;options.adapter=task.adapter;}
    if(!options.author)throw Error('An actual author identity is required');
    const requestedProjects=task?task.projects.map(p=>p.id):(options.projects||'').split(',').map(item=>item.trim()).filter(Boolean);
    if(!requestedProjects.length||new Set(requestedProjects).size!==requestedProjects.length)throw Error('Init needs --projects with every requested project ID exactly once');
    const selected=await context({...options,root,local:options.local==='true'});
    const run=inside(root,`runs/${options.id}`);
    await fs.mkdir(path.dirname(run),{recursive:true});await fs.mkdir(run);
    for(const folder of ['inputs','outputs','review-1'])await fs.mkdir(path.join(run,folder));
    // Freeze all shared rules, not external paths. Private knowledge is opt-in.
    const manifest=await readJSON(path.join(root,'manifest.json'));
    for(const f of manifest.files){const dest=inside(path.join(run,'inputs/package'),f.path);await fs.mkdir(path.dirname(dest),{recursive:true});await fs.copyFile(inside(root,f.path),dest);}
    await fs.copyFile(path.join(root,'manifest.json'),path.join(run,'inputs/package/manifest.json'));
    for(const e of selected.enabled.filter(e=>e.private)){const dest=inside(path.join(run,'inputs/package'),e.path);await fs.mkdir(path.dirname(dest),{recursive:true});await fs.copyFile(inside(root,e.path),dest);}
    await writeJSON(path.join(run,'inputs/context.json'),{...selected,author:options.author,requestedProjects,taskScopeHash:task?taskScopeHash(task):undefined,coverageMode:task?'task-derived-v2':'legacy-declaration-only',createdAt:new Date().toISOString(),resourceBase:'package'});
    await fs.copyFile(path.join(root,'templates/brief.md'),path.join(run,'inputs/brief.md'));
    if(task){
      await writeJSON(path.join(run,'inputs/task.json'),task);
      await writeJSON(path.join(run,'inputs/coverage.json'),await coverageFor(task,root));
      const contexts=[];for(const p of task.projects)for(const page of p.pages)contexts.push({projectId:p.id,...await context({...options,root,page:page.id})});
      await writeJSON(path.join(run,'inputs/page-contexts.json'),contexts);
    }else await fs.copyFile(path.join(root,'templates/coverage.json'),path.join(run,'inputs/coverage.json'));
    return {run,context:selected,step:'Complete brief and source identity, create outputs, then freeze. No production changes made.'};
  }
  if(!options.run)throw Error('Expected check/context/init or --run path');
  const run=path.resolve(options.run);
  if(command==='freeze')return freeze(run);
  if(command==='verify')return verify(run);
  if(command==='seal-review'&&options.review)return sealReview(run,path.resolve(options.review));
  if(command==='reveal'&&options.history)return reveal(run,path.resolve(options.history));
  throw Error('Unknown command or missing arguments');
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{const result=await runCLI(process.argv.slice(2));console.log(JSON.stringify(result,null,2));if(['blocked','revise'].includes(result?.status))process.exitCode=2;}
  catch(error){console.error(error.message);process.exitCode=1;}
}
