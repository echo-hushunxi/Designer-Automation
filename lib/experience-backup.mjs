import fs from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {gzip, gunzip} from 'node:zlib';
import {promisify} from 'node:util';
import {digest} from './io.mjs';
import {validateStoredLesson} from './experience-policy.mjs';
import {validateStoredCase} from './experience-case.mjs';

const compress = promisify(gzip),
  decompress = promisify(gunzip);
export function backupDocument(state, source) {
  state.cases.forEach(validateStoredCase);
  const cases = [...state.cases].sort((a, b) => a.id.localeCompare(b.id));
  const lessons = [...(state.lessons || [])].sort((a, b) =>
    a.id.localeCompare(b.id),
  );
  lessons.forEach(validateStoredLesson);
  return {
    format: 'designer-automation-experience-backup',
    version: 2,
    createdAt: new Date().toISOString(),
    source,
    count: cases.length,
    lessonCount: lessons.length,
    hash: digest({cases, lessons}),
    cases,
    lessons,
  };
}
export async function readBackup(file) {
  const data = JSON.parse(
    (
      await decompress(await fs.readFile(file), {
        maxOutputLength: 256 * 1024 * 1024,
      })
    ).toString('utf8'),
  );
  validateBackup(data);
  return data;
}
function validateBackup(data) {
  if (
    data.format !== 'designer-automation-experience-backup' ||
    ![1, 2].includes(data.version) ||
    !Array.isArray(data.cases) ||
    data.count !== data.cases.length ||
    data.hash !==
      (data.version === 1
        ? digest(data.cases)
        : digest({cases: data.cases, lessons: data.lessons}))
  )
    throw Error('Backup format, count or checksum is invalid');
  data.cases.forEach(validateStoredCase);
  if (data.version === 2) {
    if (
      !Array.isArray(data.lessons) ||
      data.lessonCount !== data.lessons.length
    )
      throw Error('Backup lesson count is invalid');
    data.lessons.forEach(validateStoredLesson);
    if (new Set(data.lessons.map((l) => l.id)).size !== data.lessons.length)
      throw Error('Duplicate lesson identities');
  }
  if (new Set(data.cases.map((c) => c.id)).size !== data.count)
    throw Error('Backup has duplicate case identities');
}
export async function writeBackup(
  directory,
  document,
  {retentionDays = 30} = {},
) {
  validateBackup(document);
  if (!Number.isInteger(retentionDays) || retentionDays < 1)
    throw Error('Backup retention must be a positive number of days');
  await fs.mkdir(directory, {recursive: true, mode: 0o700});
  const filename =
    'experience-' +
    new Date().toISOString().replace(/[:.]/g, '-') +
    '-' +
    randomUUID() +
    '.json.gz';
  const file = path.join(directory, filename),
    temporary = file + '.tmp';
  const handle = await fs.open(temporary, 'wx', 0o600);
  try {
    await handle.writeFile(await compress(JSON.stringify(document)));
    await handle.sync();
  } finally {
    await handle.close();
  }
  await fs.rename(temporary, file);
  const dir = await fs.open(directory, 'r');
  try {
    await dir.sync();
  } finally {
    await dir.close();
  }
  const checked = await readBackup(file);
  // Prune only our completed archives, and only after the new archive verifies.
  const cutoff = Date.now() - retentionDays * 86400000;
  for (const entry of await fs.readdir(directory)) {
    if (
      !/^experience-[0-9TZ-]+-[a-f0-9-]{36}\.json\.gz$/.test(entry) ||
      entry === filename
    )
      continue;
    const old = path.join(directory, entry);
    if ((await fs.lstat(old)).isFile() && (await fs.stat(old)).mtimeMs < cutoff)
      await fs.unlink(old);
  }
  return {
    file,
    count: checked.count,
    lessonCount: checked.lessonCount || 0,
    hash: checked.hash,
    createdAt: checked.createdAt,
  };
}
