import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {randomBytes} from 'node:crypto';
import {root,exists,readJSON,writeJSON,command} from '../lib/io.mjs';

if (process.platform !== 'darwin') throw Error('Managed install currently targets macOS; other hosts can run npm run knowledge with persistent environment settings');
const action = process.argv[2] || 'status', label = 'com.designer-automation.experience';
const options = {};
for (let i=3;i<process.argv.length;i+=2) {
  if (process.argv[i] !== '--auth' || !['none','token'].includes(process.argv[i+1])) throw Error('Use --auth none or --auth token');
  options.auth = process.argv[i+1];
}
const directory = path.join(os.homedir(),'Library/Application Support/Designer-Automation/experience');
const configFile = path.join(directory,'service.json'), plistFile = path.join(os.homedir(),'Library/LaunchAgents',label+'.plist');
const domain = 'gui/'+process.getuid(), serviceId = domain+'/'+label;
const escape = value => String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const addresses = () => Object.values(os.networkInterfaces()).flat().filter(i=>i.family==='IPv4'&&!i.internal).map(i=>'http://'+i.address+':4381/mcp');
if (action === 'install') {
  await fs.mkdir(directory,{recursive:true,mode:0o700}); await fs.chmod(directory,0o700);
  const config = await exists(configFile) ? await readJSON(configFile) : {directory:path.join(directory,'store'),host:'0.0.0.0',port:4381,token:randomBytes(32).toString('hex'),maintainerToken:randomBytes(32).toString('hex'),allowedOrigins:[]};
  if (options.auth) config.allowAnonymous = options.auth === 'none';
  await writeJSON(configFile,config); await fs.chmod(configFile,0o600);
  const tokenFile = path.join(directory,'designer-token.txt'); await fs.writeFile(tokenFile,config.token+'\n',{mode:0o600}); await fs.chmod(tokenFile,0o600);
  const args = [process.execPath,path.join(root,'bin/experience-managed.mjs'),configFile];
  const plist = '<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n<plist version="1.0"><dict>'+[
    '<key>Label</key><string>'+label+'</string>',
    '<key>ProgramArguments</key><array>'+args.map(a=>'<string>'+escape(a)+'</string>').join('')+'</array>',
    '<key>WorkingDirectory</key><string>'+escape(root)+'</string>',
    '<key>RunAtLoad</key><true/><key>KeepAlive</key><true/><key>ThrottleInterval</key><integer>10</integer>',
    '<key>StandardOutPath</key><string>'+escape(path.join(directory,'service.log'))+'</string>',
    '<key>StandardErrorPath</key><string>'+escape(path.join(directory,'service-error.log'))+'</string>'
  ].join('')+'</dict></plist>\n';
  await fs.mkdir(path.dirname(plistFile),{recursive:true}); await fs.writeFile(plistFile,plist,{mode:0o600});
  const registered = await command(['launchctl','print',serviceId],root).then(()=>true).catch(()=>false);
  if (registered) await command(['launchctl','bootout',serviceId],root);
  await command(['launchctl','enable',serviceId],root);
  await command(['launchctl','bootstrap',domain,plistFile],root);
  console.log(JSON.stringify({installed:true,label,endpoints:addresses(),authentication:config.allowAnonymous?'internal-anonymous':'bearer',tokenFile:config.allowAnonymous?null:tokenFile,configFile,storage:config.directory,notice:config.allowAnonymous?'Internal clients can search and capture without tokens. Publishing remains a maintainer operation.':'Writer token is separate from the maintainer credential. No credentials are printed.'},null,2));
} else if (action === 'status') {
  const result = await command(['launchctl','print',serviceId],root);
  const config = await readJSON(configFile);
  console.log(JSON.stringify({label,state:result.output.split('\n').filter(line=>/^\s*(state|pid|last exit code) =/.test(line)).map(line=>line.trim()),endpoints:addresses(),authentication:config.allowAnonymous?'internal-anonymous':'bearer',configFile},null,2));
} else if (action === 'stop') {
  await command(['launchctl','bootout',serviceId],root); console.log(JSON.stringify({label,stopped:true}));
} else throw Error('Use install, status or stop');
