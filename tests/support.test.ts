import { beforeEach, describe, expect, it } from 'vitest';
import { shouldPromptForSupport } from '../src/core/support';

describe('project support prompt cadence', () => {
  beforeEach(() => window.localStorage.clear());

  it('prompts after the first export and every fourth export after that', () => {
    expect(shouldPromptForSupport()).toBe(true);
    expect(shouldPromptForSupport()).toBe(false);
    expect(shouldPromptForSupport()).toBe(false);
    expect(shouldPromptForSupport()).toBe(true);
    expect(shouldPromptForSupport()).toBe(false);
  });
});
