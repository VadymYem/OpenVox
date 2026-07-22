export interface PitchResult {
  frequency: number;
  confidence: number;
}

export function detectPitchYin(buffer: Float32Array, sampleRate: number): PitchResult | null {
  const minFrequency = 55;
  const maxFrequency = 1400;
  const minTau = Math.max(2, Math.floor(sampleRate / maxFrequency));
  const maxTau = Math.min(Math.floor(sampleRate / minFrequency), Math.floor(buffer.length / 2));
  if (maxTau <= minTau) return null;

  let rms = 0;
  for (let i = 0; i < buffer.length; i++) rms += buffer[i] * buffer[i];
  rms = Math.sqrt(rms / buffer.length);
  if (rms < 0.0025) return null;

  const yin = new Float32Array(maxTau + 1);
  for (let tau = 1; tau <= maxTau; tau++) {
    let sum = 0;
    for (let i = 0; i < buffer.length - tau; i++) {
      const delta = buffer[i] - buffer[i + tau];
      sum += delta * delta;
    }
    yin[tau] = sum;
  }

  yin[0] = 1;
  let runningSum = 0;
  for (let tau = 1; tau <= maxTau; tau++) {
    runningSum += yin[tau];
    yin[tau] = runningSum === 0 ? 1 : (yin[tau] * tau) / runningSum;
  }

  const threshold = 0.15;
  let tauEstimate = -1;
  for (let tau = minTau; tau < maxTau; tau++) {
    if (yin[tau] < threshold) {
      while (tau + 1 < maxTau && yin[tau + 1] < yin[tau]) tau++;
      tauEstimate = tau;
      break;
    }
  }

  if (tauEstimate < 0) {
    let bestTau = minTau;
    for (let tau = minTau + 1; tau <= maxTau; tau++) {
      if (yin[tau] < yin[bestTau]) bestTau = tau;
    }
    if (yin[bestTau] > 0.38) return null;
    tauEstimate = bestTau;
  }

  const x0 = tauEstimate > 1 ? tauEstimate - 1 : tauEstimate;
  const x2 = tauEstimate + 1 <= maxTau ? tauEstimate + 1 : tauEstimate;
  const s0 = yin[x0];
  const s1 = yin[tauEstimate];
  const s2 = yin[x2];
  const denominator = 2 * (2 * s1 - s2 - s0);
  const betterTau = Math.abs(denominator) < 1e-9 ? tauEstimate : tauEstimate + (s2 - s0) / denominator;

  const frequency = sampleRate / betterTau;
  if (!Number.isFinite(frequency) || frequency < minFrequency || frequency > maxFrequency) return null;
  const confidence = Math.max(0, Math.min(1, 1 - yin[tauEstimate]));
  return { frequency, confidence };
}
