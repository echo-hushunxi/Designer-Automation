import path from 'node:path';
import {root, writeJSON} from '../lib/io.mjs';
import {publicFiles, readJSON} from '../bin/common.mjs';
const config = await readJSON(path.join(root, 'config/workspace.json'));
await writeJSON(path.join(root, 'manifest.json'), {version: config.version, files: await publicFiles(root)});
console.log('Updated public manifest');
