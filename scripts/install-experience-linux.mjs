import fs from 'node:fs/promises';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import {root,readJSON,command} from '../lib/io.mjs';

if (process.platform !== 'linux') throw Error('This installer requires Linux with the existing PM2 service and user crontab');
const file = process.argv[2];
if (!file || !path.isAbsolute(file)) throw Error('Supply an absolute private configuration path');
const config = await readJSON(file);
if (!config.mongo?.uri || !config.mongo.database || !config.maintainerToken || !path.isAbsolute(config.backup?.directory || '')) throw Error('Configure MongoDB, maintainerToken and an absolute backup.directory first');
if (((await fs.stat(file)).mode & 0o077) !== 0) throw Error('Private server configuration must be mode 600');
await fs.mkdir(config.backup.directory,{recursive:true,mode:0o700});
const log = path.join(path.dirname(config.backup.directory),'backup.log');
const pm2 = path.join(path.dirname(process.execPath),'pm2');
const processName = 'designer-automation-experience';
const listed = JSON.parse((await command([process.execPath,pm2,'jlist'],root,{maxBytes:10000000})).output);
const previous = listed.find(app=>app.name === processName);
const replacing = previous && previous.pm2_env.pm_exec_path !== path.join(root,'bin/experience-managed.mjs');
if (replacing) await command([process.execPath,pm2,'delete',processName],root);
try {
  await command([process.execPath,pm2,'startOrReload',path.join(root,'deploy/ecosystem.config.cjs'),'--only',processName,'--update-env'],root,{env:{DA_EXPERIENCE_CONFIG:file}});
  const expected = (await readJSON(path.join(root,'package.json'))).version;
  let healthy = false;
  for (let attempt=0;attempt<20;attempt++) {
    try {
      const response = await fetch('http://127.0.0.1:'+config.port+'/health',{headers:{authorization:'Bearer '+config.maintainerToken},signal:AbortSignal.timeout(1000)});
      const status = await response.json();
      if (response.ok && status.status === 'ok' && status.version === expected) { healthy = true; break; }
    } catch { /* The owned process may still be starting. */ }
    await delay(250);
  }
  if (!healthy) throw Error('The running experience service did not match the expected healthy release');
} catch (error) {
  if (replacing) {
    await command([process.execPath,pm2,'delete',processName],root).catch(()=>{});
    const prior = previous.pm2_env;
    await command([process.execPath,pm2,'start',prior.pm_exec_path,'--name',processName,'--cwd',prior.pm_cwd,'--interpreter',prior.exec_interpreter,'--',...(Array.isArray(prior.args) ? prior.args : [prior.args])],root);
    await command([process.execPath,pm2,'save'],root);
  }
  throw error;
}
// PM2 startup is already installed on the chosen host. Preserve its other apps.
await command([process.execPath,pm2,'save'],root);
const old = spawnSync('crontab',['-l'],{encoding:'utf8'});
if (old.status !== 0 && !/no crontab/i.test(old.stderr || '')) throw Error('Cannot inspect the existing crontab; preserved unchanged');
const begin = '# Designer-Automation backup begin', end = '# Designer-Automation backup end';
const current = old.stdout || '', a = current.indexOf(begin), b = current.indexOf(end);
if ((a<0)!==(b<0) || (a>=0 && (b<a || current.indexOf(begin,a+begin.length)>=0))) throw Error('Existing managed backup markers are inconsistent; crontab preserved');
const preserved = a<0 ? current : current.slice(0,a)+current.slice(b+end.length).replace(/^\r?\n/,'');
const quote = value => "'"+value.replaceAll("'","'\\''")+"'";
if ([process.execPath,root,file,log].some(v=>/[\r\n%]/.test(v))) throw Error('Cron paths cannot contain newline or percent characters');
const line = '0 */6 * * * '+[process.execPath,path.join(root,'scripts/experience-admin.mjs'),'backup','--config',file].map(quote).join(' ')+' >> '+quote(log)+' 2>&1';
const installed = spawnSync('crontab',['-'],{input:preserved.trimEnd()+'\n\n'+begin+'\n'+line+'\n'+end+'\n',encoding:'utf8'});
if (installed.status !== 0) throw Error('Could not install the managed backup entry');
console.log(JSON.stringify({service:'designer-automation-experience',authentication:config.allowAnonymous?'internal-anonymous':'bearer',backend:'mongodb',database:config.mongo.database,backupDirectory:config.backup.directory,schedule:'Every six hours (server timezone)',retentionDays:config.backup.retentionDays || 30,existingCrontabPreserved:true}));
