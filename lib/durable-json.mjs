import fs from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
export async function durableJSON(file, value) {
  await fs.mkdir(path.dirname(file), {recursive: true, mode: 0o700});
  const temporary = file + '.' + randomUUID() + '.tmp',
    handle = await fs.open(temporary, 'wx', 0o600);
  try {
    await handle.writeFile(JSON.stringify(value) + '\n');
    await handle.sync();
  } finally {
    await handle.close();
  }
  await fs.rename(temporary, file);
  if (process.platform !== 'win32') {
    const directory = await fs.open(path.dirname(file), 'r');
    try {
      await directory.sync();
    } finally {
      await directory.close();
    }
  }
}
