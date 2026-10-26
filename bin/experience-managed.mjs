import {readJSON} from '../lib/io.mjs';
import {startExperienceServer} from '../lib/experience-server.mjs';
const config = await readJSON(process.argv[2]);
const service = await startExperienceServer(config);
console.log(JSON.stringify({service:'designer-automation-experience',listen:service.url,startedAt:new Date().toISOString()}));
for (const signal of ['SIGTERM','SIGINT']) process.on(signal,async () => { await service.close(); process.exit(0); });
