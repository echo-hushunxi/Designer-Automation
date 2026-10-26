import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

export const packageRoot=fileURLToPath(new URL('../',import.meta.url));
export const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
export const readJSON=async file=>JSON.parse(await fs.readFile(file,'utf8'));
export async function writeJSON(file,value,exclusive=false){
  await fs.mkdir(path.dirname(file),{recursive:true});
  await fs.writeFile(file,JSON.stringify(value,null,2)+'\n',{flag:exclusive?'wx':'w'});
}
export function inside(root,relative){
  if(typeof relative!=='string'||!relative||path.isAbsolute(relative)||relative.split(/[\\/]/).includes('..'))throw Error('Unsafe relative path: '+relative);
  return path.join(root,relative);
}
export async function files(root,rel='',exclude=()=>false){
  const result=[];
  for(const entry of (await fs.readdir(path.join(root,rel),{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))){
    const name=rel?`${rel}/${entry.name}`:entry.name;
    if(exclude(name))continue;
    if(entry.isSymbolicLink())throw Error('Portable/frozen trees cannot contain symlinks: '+name);
    if(entry.isDirectory())result.push(...await files(root,name,exclude));
    else if(entry.isFile())result.push({path:name,sha256:hash(await fs.readFile(inside(root,name)))});
    else throw Error('Unsupported file: '+name);
  }
  return result;
}
export const privatePath=p=>p==='runs'||p==='.designer-data'||p==='knowledge/local'||p==='config/knowledge.local.json'||p==='.git'||p==='.codex/plugins'||p==='.codex/config.toml'||p==='node_modules'||p.startsWith('.env')||p.startsWith('systems/connection-check-');
export const publicFiles=root=>files(root,'',p=>privatePath(p)||p==='manifest.json');
export async function checkPackage(root=packageRoot){
  const manifest=await readJSON(path.join(root,'manifest.json'));
  const actual=await publicFiles(root);
  if(JSON.stringify(actual)!==JSON.stringify(manifest.files))throw Error('Package content differs from manifest; regenerate the export before use');
  const config=await readJSON(path.join(root,'config/workspace.json'));
  const index=await readJSON(path.join(root,'knowledge/index.json'));
  if(config.version!==manifest.version||index.version!==manifest.version)throw Error('Package/index/workspace versions differ');
  const seen=new Set();
  for(const entry of index.entries){
    if(!entry.id||seen.has(entry.id))throw Error('Missing or duplicate knowledge ID');
    seen.add(entry.id);
    if(!['active','candidate','draft','retired'].includes(entry.status)||!entry.version||!entry.source||!Array.isArray(entry.pages)||!entry.pages.length||entry.pages.some(p=>p!=='*'&&!config.pages.includes(p)))throw Error('Invalid knowledge scope or provenance: '+entry.id);
    await fs.access(inside(root,entry.path));
  }
  for(const page of config.pages)if(!index.pages[page])throw Error('Missing page readiness: '+page);
  return {version:manifest.version,manifestHash:hash(await fs.readFile(path.join(root,'manifest.json'))),fileCount:actual.length};
}
