import { describe, expect, it } from 'vitest';
import { audioBufferToWav } from '../src/core/audio/wav';

describe('WAV export', () => {
  it('writes a valid mono PCM WAV header and payload size', async () => {
    const samples = new Float32Array([0, 0.5, -0.5, 1, -1]);
    const fake = {
      numberOfChannels: 1,
      length: samples.length,
      sampleRate: 48000,
      getChannelData: () => samples
    } as unknown as AudioBuffer;

    const blob = audioBufferToWav(fake);
    expect(blob.type).toBe('audio/wav');
    expect(blob.size).toBe(44 + samples.length * 2);

    const view = new DataView(await blob.arrayBuffer());
    const ascii = (start: number, length: number) =>
      Array.from({ length }, (_, index) => String.fromCharCode(view.getUint8(start + index))).join('');
    expect(ascii(0, 4)).toBe('RIFF');
    expect(ascii(8, 4)).toBe('WAVE');
    expect(ascii(12, 4)).toBe('fmt ');
    expect(ascii(36, 4)).toBe('data');
    expect(view.getUint16(22, true)).toBe(1);
    expect(view.getUint32(24, true)).toBe(48000);
    expect(view.getUint16(34, true)).toBe(16);
  });

  it('interleaves no more than two channels for broad WAV compatibility', () => {
    const fake = {
      numberOfChannels: 3,
      length: 2,
      sampleRate: 44100,
      getChannelData: (channel: number) => new Float32Array([channel === 0 ? 1 : 0, channel === 1 ? 1 : 0])
    } as unknown as AudioBuffer;
    const blob = audioBufferToWav(fake);
    expect(blob.size).toBe(44 + 2 * 2 * 2);
  });
});
