import fs from 'node:fs/promises';
import path from 'node:path';
import {root,exists,readJSON,writeJSON} from '../lib/io.mjs';
import {ExperienceClient} from '../lib/experience.mjs';

const options = {};
for (let i=2;i<process.argv.length;i+=2) {
  if (!process.argv[i].startsWith('--') || !process.argv[i+1]) throw Error('Use --url URL [--token-file PATH] [--client codex|generic]');
  options[process.argv[i].slice(2)] = process.argv[i+1];
}
const shared = await readJSON(path.join(root,'config/experience-service.json'));
const url = (options.url || process.env.DA_EXPERIENCE_URL || shared.url).replace(/\/mcp\/?$/,'').replace(/\/$/,'');
if (options.auth && !['none','token'].includes(options.auth)) throw Error('Auth must be none or token');
const token = options['token-file'] ? (await fs.readFile(path.resolve(options['token-file']),'utf8')).trim() : options.auth === 'token' ? process.env.DA_EXPERIENCE_TOKEN : null;
if ((options['token-file'] || options.auth === 'token') && (!token || token.length < 24)) throw Error('Supply the shared writer token through --token-file or DA_EXPERIENCE_TOKEN');
const client = new ExperienceClient({url,token}), type = options.client || 'codex';
if (!['codex','generic'].includes(type)) throw Error('Client must be codex or generic');
const profile = path.join(root,'.designer-data/client.json');
if (type === 'codex') {
  const config = path.join(root,'.codex/config.toml');
  const begin = '# Designer-Automation experience begin', end = '# Designer-Automation experience end';
  let text = await exists(config) ? await fs.readFile(config,'utf8') : '';
  const start = text.indexOf(begin), finish = text.indexOf(end);
  if ((start < 0) !== (finish < 0) || (start >= 0 && (finish < start || text.indexOf(begin,start+begin.length) >= 0))) throw Error('Managed MCP configuration markers are inconsistent; existing configuration preserved');
  const preserved = start < 0 ? text : text.slice(0,start)+text.slice(finish+end.length).replace(/^\r?\n/,'');
  if (/^\s*\[mcp_servers\.designer_experience\]/m.test(preserved)) throw Error('Existing unmanaged designer_experience configuration preserved; rename it before connecting');
  const header = token ? `http_headers = { Authorization = ${JSON.stringify('Bearer '+token)} }\n` : '';
  const block = `${begin}\n[mcp_servers.designer_experience]\nurl = ${JSON.stringify(client.url+'/mcp')}\n${header}startup_timeout_sec = 15\ntool_timeout_sec = 30\nenabled_tools = ["experience_search", "experience_capture"]\n${end}\n`;
  await fs.mkdir(path.dirname(config),{recursive:true});
  await fs.writeFile(config,preserved.trimEnd()+'\n\n'+block,{mode:0o600}); await fs.chmod(config,0o600);
}
await writeJSON(profile,{url:client.url,token}); await fs.chmod(profile,0o600);
console.log(JSON.stringify({connectedProfile:client.url+'/mcp',client:type,authentication:token?'bearer':'none',profile,notice:type==='codex'?'Reopen/restart the project MCP connection so Codex reads its project configuration.':token?'Add the endpoint and Bearer token in your agent MCP settings.':'Add the endpoint in your agent MCP settings; authentication is not required.',secrets:'Stored only in ignored local files; no token is printed.'},null,2));
