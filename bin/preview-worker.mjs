import path from 'node:path';
import {serveCandidate} from '../lib/audit.mjs';
import {loadTask, taskDirectory} from '../lib/workbench.mjs';
import {writeJSON} from '../lib/io.mjs';
const [data,id,identity] = process.argv.slice(2), task = await loadTask(data,id);
const preview = await serveCandidate(task,{taskProvider:() => loadTask(data,id),identity});
await writeJSON(path.join(taskDirectory(data,id),'preview.json'),{url:preview.url,pid:process.pid,id,identity});
for (const signal of ['SIGINT','SIGTERM']) process.on(signal,async () => { await preview.close(); process.exit(0); });
