import { describe, expect, it } from 'vitest';

function relativeLuminance(hex: string) {
  const value = hex.replace('#', '');
  const channels = [0, 2, 4].map((offset) => Number.parseInt(value.slice(offset, offset + 2), 16) / 255);
  const linear = channels.map((channel) => (channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4));
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function contrast(foreground: string, background: string) {
  const a = relativeLuminance(foreground);
  const b = relativeLuminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

describe('theme contrast tokens', () => {
  it('keeps primary dark-theme text and accents above normal-text AA contrast', () => {
    const background = '#030712';
    for (const foreground of ['#e4edff', '#aebbd5', '#e8d0a0']) {
      expect(contrast(foreground, background)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('keeps primary light-theme text and accents above normal-text AA contrast', () => {
    const background = '#f8f5ef';
    for (const foreground of ['#25212a', '#625e69', '#8b6428', '#7a551d', '#6b4615']) {
      expect(contrast(foreground, background)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('keeps primary-button text readable against both gold gradient endpoints', () => {
    expect(contrast('#030712', '#e8d0a0')).toBeGreaterThanOrEqual(4.5);
    expect(contrast('#030712', '#c8a96e')).toBeGreaterThanOrEqual(4.5);
    expect(contrast('#f8f5ef', '#7a551d')).toBeGreaterThanOrEqual(4.5);
    expect(contrast('#f8f5ef', '#8b6428')).toBeGreaterThanOrEqual(4.5);
  });
});
