#!/usr/bin/env node
import path from 'node:path';
import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js';
import {ReliableExperienceClient} from '../lib/experience-delivery.mjs';
import {experienceMcp} from '../lib/experience-server.mjs';
import {root,exists,readJSON} from '../lib/io.mjs';
const file = path.join(root,'.designer-data/client.json');
const profile = await exists(file) ? await readJSON(file) : {};
const shared = await readJSON(path.join(root,'config/experience-service.json'));
const url = process.env.DA_EXPERIENCE_URL || profile.url || shared.url;
const store = new ReliableExperienceClient({url,token:process.env.DA_EXPERIENCE_TOKEN || (url === profile.url ? profile.token : undefined),data:process.env.DA_EXPERIENCE_CLIENT_DATA || path.join(root,'.designer-data')});
await store.initialize();
const supervisor = setInterval(()=>{void store.resume().catch(()=>{});},2000);supervisor.unref();
const server = experienceMcp(store);
server.server.onclose = async()=>{ clearInterval(supervisor); await store.close(); };
await server.connect(new StdioServerTransport());
