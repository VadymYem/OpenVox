import { describe, expect, it } from 'vitest';
import { defaultSettings } from '../src/app/AppContext';

describe('privacy defaults', () => {
  it('enables the configured Google Analytics measurement by default while keeping the Settings opt-out available', () => {
    expect(defaultSettings.analyticsEnabled).toBe(true);
  });
});
