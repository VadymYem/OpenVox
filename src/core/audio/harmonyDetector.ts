import type { HarmonyPitch } from '../../types';
import { frequencyToNote } from '../music/notes';

export function detectHarmonyPeaks(
  frequencyData: Uint8Array,
  sampleRate: number,
  fftSize: number,
  referenceA4 = 440,
  maxVoices = 4
): HarmonyPitch[] {
  const candidates: Array<{ bin: number; value: number }> = [];
  const minBin = Math.max(1, Math.floor((55 * fftSize) / sampleRate));
  const maxBin = Math.min(frequencyData.length - 2, Math.ceil((1400 * fftSize) / sampleRate));

  for (let i = minBin + 1; i < maxBin - 1; i++) {
    const value = frequencyData[i];
    if (value < 95) continue;
    if (value > frequencyData[i - 1] && value >= frequencyData[i + 1]) candidates.push({ bin: i, value });
  }

  candidates.sort((a, b) => b.value - a.value);
  const selected: HarmonyPitch[] = [];
  for (const candidate of candidates) {
    const frequency = (candidate.bin * sampleRate) / fftSize;
    const noteInfo = frequencyToNote(frequency, referenceA4);
    const duplicate = selected.some((item) => Math.abs(1200 * Math.log2(frequency / item.frequency)) < 70);
    const harmonicOfExisting = selected.some((item) => {
      const ratio = frequency / item.frequency;
      return [2, 3, 4].some((h) => Math.abs(ratio - h) < 0.04);
    });
    if (duplicate || harmonicOfExisting) continue;
    selected.push({
      frequency,
      note: `${noteInfo.note}${noteInfo.octave}`,
      cents: noteInfo.cents,
      strength: candidate.value / 255
    });
    if (selected.length >= maxVoices) break;
  }
  return selected;
}
