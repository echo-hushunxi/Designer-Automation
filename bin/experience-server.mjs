#!/usr/bin/env node
import {startExperienceServer} from '../lib/experience-server.mjs';
const server = await startExperienceServer({mongo:{uri:process.env.DA_EXPERIENCE_MONGO_URI,database:process.env.DA_EXPERIENCE_DATABASE,collection:process.env.DA_EXPERIENCE_COLLECTION || 'cases'},host:process.env.DA_EXPERIENCE_HOST || '127.0.0.1',port:Number(process.env.DA_EXPERIENCE_PORT || 4381),token:process.env.DA_EXPERIENCE_TOKEN,maintainerToken:process.env.DA_EXPERIENCE_MAINTAINER_TOKEN,allowAnonymous:process.env.DA_EXPERIENCE_ALLOW_ANONYMOUS === 'true',allowedOrigins:(process.env.DA_EXPERIENCE_ORIGINS || '').split(',').filter(Boolean)});
console.log(JSON.stringify({service:server.url,mcp:server.url+'/mcp',backend:'mongodb'}));
for (const signal of ['SIGINT','SIGTERM']) process.on(signal,async () => { await server.close(); process.exit(0); });
