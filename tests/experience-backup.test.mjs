import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {gzipSync} from 'node:zlib';
import {ExperienceStore} from '../lib/experience.mjs';
import {
  backupDocument,
  readBackup,
  writeBackup,
} from '../lib/experience-backup.mjs';
import {digest} from '../lib/io.mjs';
import {sample} from './experience-fixture.mjs';
import {startExperienceServer} from '../lib/experience-server.mjs';

async function fixture(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'da-backup-'));
  t.after(() => fs.rm(root, {recursive: true, force: true}));
  const store = new ExperienceStore(path.join(root, 'local'));
  await store.capture(sample());
  return {root, store};
}
test('archives preserve candidate/publication data, verify checksums and only prune owned expired archives', async (t) => {
  const {root, store} = await fixture(t),
    directory = path.join(root, 'backups');
  const archive = await writeBackup(
    directory,
    backupDocument(await store.read(), {database: 'synthetic'}),
  );
  const restored = await readBackup(archive.file);
  assert.equal(restored.cases[0].status, 'active');
  assert.equal(restored.cases[0].revision, 2);
  assert.equal(restored.cases[0].publishedBy, 'synthetic-designer');
  assert.equal((await fs.stat(archive.file)).mode & 0o777, 0o600);
  const unrelated = path.join(directory, 'operator-notes.txt');
  await fs.writeFile(unrelated, 'preserve');
  const old = new Date(Date.now() - 40 * 86400000);
  await fs.utimes(archive.file, old, old);
  await fs.utimes(unrelated, old, old);
  const next = await writeBackup(
    directory,
    backupDocument(await store.read(), {}),
  );
  await assert.rejects(fs.access(archive.file));
  assert.equal(await fs.readFile(unrelated, 'utf8'), 'preserve');
  assert.equal((await readBackup(next.file)).count, 1);
});
test('restore input rejects corrupt archives and fabricated case identity before any database operation', async (t) => {
  const {root, store} = await fixture(t),
    document = backupDocument(await store.read(), {}),
    file = path.join(root, 'corrupt.gz');
  await fs.writeFile(
    file,
    gzipSync(JSON.stringify({...document, hash: 'bad'})),
  );
  await assert.rejects(readBackup(file), /checksum/);
  const cases = document.cases.map((c) => ({
    ...c,
    summary: 'tampered content',
  }));
  await fs.writeFile(
    file,
    gzipSync(
      JSON.stringify({
        ...document,
        cases,
        hash: digest({cases, lessons: document.lessons}),
      }),
    ),
  );
  await assert.rejects(readBackup(file), /identity/);
  await assert.rejects(
    writeBackup(path.join(root, 'backups'), {...document, count: 2}),
    /count/,
  );
});
test('central server refuses missing database configuration and never falls back to local JSON', async () => {
  await assert.rejects(
    startExperienceServer({allowAnonymous: true}),
    /explicit MongoDB/,
  );
});
