import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const bytes = await readFile(resolve('public/wasm/openvox_dsp.wasm'));
const { instance } = await WebAssembly.instantiate(bytes, {});
const wasm = instance.exports;
const capacity = wasm.get_buffer_capacity();
const pointer = wasm.get_buffer_ptr();
const input = new Float32Array(wasm.memory.buffer, pointer, capacity);
const sampleRate = 48000;

const frequencies = [110, 220, 261.6256, 440, 880];
for (const expected of frequencies) {
  const length = Math.min(4096, capacity);
  for (let i = 0; i < length; i++) {
    const clean = Math.sin(2 * Math.PI * expected * i / sampleRate) * .7;
    const overtone = Math.sin(2 * Math.PI * expected * 2 * i / sampleRate) * .12;
    input[i] = clean + overtone;
  }
  const detected = wasm.detect_pitch(length, sampleRate, 55, 1400);
  const confidence = wasm.get_last_confidence();
  const cents = Math.abs(1200 * Math.log2(detected / expected));
  if (!Number.isFinite(detected) || cents > 5 || confidence < .75) {
    throw new Error(`WASM pitch test failed for ${expected.toFixed(2)} Hz: ${detected.toFixed(2)} Hz, ${cents.toFixed(2)} cents, confidence ${confidence.toFixed(3)}`);
  }
  console.log(`WASM pitch test passed: ${expected.toFixed(2)} Hz -> ${detected.toFixed(2)} Hz, confidence ${confidence.toFixed(3)}`);
}
