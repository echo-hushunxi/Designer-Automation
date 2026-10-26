#!/usr/bin/env node
import path from 'node:path';
import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js';
import {ExperienceClient} from '../lib/experience.mjs';
import {experienceMcp} from '../lib/experience-server.mjs';
import {root,exists,readJSON} from '../lib/io.mjs';
const file = path.join(root,'.designer-data/client.json');
const profile = await exists(file) ? await readJSON(file) : {};
const url = process.env.DA_EXPERIENCE_URL || profile.url;
if (!url) throw Error('Run npm run connect first, or set DA_EXPERIENCE_URL to the central service');
const store = new ExperienceClient({url,token:process.env.DA_EXPERIENCE_TOKEN || (url === profile.url ? profile.token : undefined),cache:path.join(root,'.designer-data/experience-cache')});
await experienceMcp(store).connect(new StdioServerTransport());
