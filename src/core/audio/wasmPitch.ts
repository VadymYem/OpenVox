import type { PitchResult } from './pitchDetector';

type Exports = {
  memory: WebAssembly.Memory;
  get_buffer_ptr: () => number;
  get_buffer_capacity: () => number;
  get_last_confidence: () => number;
  detect_pitch: (length: number, sampleRate: number, minFrequency: number, maxFrequency: number) => number;
};

export class WasmPitchDetector {
  private exports: Exports | null = null;
  private loading: Promise<boolean> | null = null;

  load(): Promise<boolean> {
    if (this.exports) return Promise.resolve(true);
    if (this.loading) return this.loading;
    this.loading = fetch(`${import.meta.env.BASE_URL}wasm/openvox_dsp.wasm`)
      .then(async (response) => {
        if (!response.ok) throw new Error(`WASM request failed: ${response.status}`);
        try {
          return await WebAssembly.instantiateStreaming(response.clone(), {});
        } catch {
          return WebAssembly.instantiate(await response.arrayBuffer(), {});
        }
      })
      .then(({ instance }) => {
        this.exports = instance.exports as unknown as Exports;
        return true;
      })
      .catch(() => false);
    return this.loading;
  }

  detect(frame: Float32Array, sampleRate: number): PitchResult | null {
    if (!this.exports) return null;
    const capacity = this.exports.get_buffer_capacity();
    const length = Math.min(capacity, frame.length);
    const pointer = this.exports.get_buffer_ptr();
    const target = new Float32Array(this.exports.memory.buffer, pointer, capacity);
    target.set(frame.subarray(0, length), 0);
    const frequency = this.exports.detect_pitch(length, sampleRate, 55, 1400);
    const confidence = this.exports.get_last_confidence();
    if (!frequency || !Number.isFinite(frequency) || confidence < 0.5) return null;
    return { frequency, confidence };
  }
}
