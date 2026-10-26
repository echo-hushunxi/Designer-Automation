import fs from 'node:fs/promises';
import path from 'node:path';
import {root,exists,readJSON,writeJSON} from '../lib/io.mjs';
import {ExperienceClient} from '../lib/experience.mjs';

const options = {};
for (let i=2;i<process.argv.length;i+=2) {
  if (!process.argv[i].startsWith('--') || !process.argv[i+1]) throw Error('Use --url URL --token-file PATH [--client codex|generic]');
  options[process.argv[i].slice(2)] = process.argv[i+1];
}
const url = (options.url || process.env.DA_EXPERIENCE_URL || '').replace(/\/mcp\/?$/,'').replace(/\/$/,'');
const token = options['token-file'] ? (await fs.readFile(path.resolve(options['token-file']),'utf8')).trim() : process.env.DA_EXPERIENCE_TOKEN;
if (!token || token.length < 24) throw Error('Supply the shared writer token through --token-file or DA_EXPERIENCE_TOKEN');
const client = new ExperienceClient({url,token}), type = options.client || 'codex';
if (!['codex','generic'].includes(type)) throw Error('Client must be codex or generic');
const profile = path.join(root,'.designer-data/client.json');
await writeJSON(profile,{url:client.url,token});
await fs.chmod(profile,0o600);
if (type === 'codex') {
  const config = path.join(root,'.codex/config.toml');
  const begin = '# Designer-Automation experience begin', end = '# Designer-Automation experience end';
  let text = await exists(config) ? await fs.readFile(config,'utf8') : '';
  const marker = new RegExp(begin+'[\\s\\S]*?'+end+'\\n?','g');
  const preserved = text.replace(marker,'');
  if (/^\s*\[mcp_servers\.designer_experience\]/m.test(preserved)) throw Error('Existing unmanaged designer_experience configuration preserved; rename it before connecting');
  const block = `${begin}\n[mcp_servers.designer_experience]\nurl = ${JSON.stringify(client.url+'/mcp')}\nhttp_headers = { Authorization = ${JSON.stringify('Bearer '+token)} }\nstartup_timeout_sec = 15\ntool_timeout_sec = 30\nenabled_tools = ["experience_search", "experience_capture"]\n${end}\n`;
  await fs.mkdir(path.dirname(config),{recursive:true});
  await fs.writeFile(config,preserved.trimEnd()+'\n\n'+block,{mode:0o600}); await fs.chmod(config,0o600);
}
console.log(JSON.stringify({connectedProfile:client.url+'/mcp',client:type,profile,notice:type==='codex'?'Reopen/restart the project MCP connection so Codex reads its project configuration.':'Add the endpoint and Bearer token in your agent MCP settings.',secrets:'Stored only in ignored local files; no token is printed.'},null,2));
