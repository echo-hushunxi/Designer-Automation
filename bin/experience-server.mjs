#!/usr/bin/env node
import path from 'node:path';
import {startExperienceServer} from '../lib/experience-server.mjs';
import {root} from '../lib/io.mjs';
const server = await startExperienceServer({directory:process.env.DA_EXPERIENCE_DATA || path.join(root,'.designer-data/shared-experience'),host:process.env.DA_EXPERIENCE_HOST || '127.0.0.1',port:Number(process.env.DA_EXPERIENCE_PORT || 4381),token:process.env.DA_EXPERIENCE_TOKEN,maintainerToken:process.env.DA_EXPERIENCE_MAINTAINER_TOKEN,allowedOrigins:(process.env.DA_EXPERIENCE_ORIGINS || '').split(',').filter(Boolean)});
console.log(JSON.stringify({service:server.url,mcp:server.url+'/mcp'}));
for (const signal of ['SIGINT','SIGTERM']) process.on(signal,async () => { await server.close(); process.exit(0); });
