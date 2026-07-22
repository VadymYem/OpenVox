import { build } from 'esbuild';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const directory = await mkdtemp(join(tmpdir(), 'openvox-core-test-'));
const outfile = join(directory, 'core-test.mjs');
try {
  await build({
    entryPoints: [resolve('tests/core.test.ts')],
    outfile,
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node20',
    logLevel: 'silent'
  });
  await import(`${pathToFileURL(outfile).href}?t=${Date.now()}`);
} finally {
  await rm(directory, { recursive: true, force: true });
}
