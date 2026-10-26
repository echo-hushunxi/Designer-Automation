#!/usr/bin/env node
import path from 'node:path';
import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js';
import {ExperienceStore} from '../lib/experience.mjs';
import {experienceMcp} from '../lib/experience-server.mjs';
import {root} from '../lib/io.mjs';
const store = new ExperienceStore(process.env.DA_EXPERIENCE_DATA || path.join(root,'.designer-data/shared-experience'));
await experienceMcp(store).connect(new StdioServerTransport());
