import { access, mkdir, stat } from 'node:fs/promises';
import { spawn, spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const source = resolve('packages/dsp/openvox_dsp.c');
const outputDir = resolve('public/wasm');
const output = resolve(outputDir, 'openvox_dsp.wasm');
await mkdir(outputDir, { recursive: true });

const clang = process.env.CLANG || 'clang';
const probe = spawnSync(clang, ['--version'], { stdio: 'ignore' });
if (probe.status !== 0) {
  await access(output);
  const info = await stat(output);
  if (info.size < 500) throw new Error('Clang is unavailable and the committed WASM module is invalid.');
  console.log(`Clang is unavailable; using committed ${output}.`);
  process.exit(0);
}

const args = [
  '--target=wasm32', '-O3', '-nostdlib', source,
  '-Wl,--no-entry',
  '-Wl,--export-memory',
  '-Wl,--export=get_buffer_ptr',
  '-Wl,--export=get_buffer_capacity',
  '-Wl,--export=get_last_confidence',
  '-Wl,--export=detect_pitch',
  '-Wl,--initial-memory=262144',
  '-Wl,--max-memory=262144',
  '-Wl,--strip-all',
  '-o', output
];

await new Promise((resolvePromise, reject) => {
  const child = spawn(clang, args, { stdio: 'inherit' });
  child.on('error', reject);
  child.on('exit', (code) => code === 0
    ? resolvePromise()
    : reject(new Error(`WASM compilation failed with exit code ${code}.`)));
});

console.log(`Built ${output}`);
