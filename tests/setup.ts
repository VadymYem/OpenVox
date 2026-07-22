import 'fake-indexeddb/auto';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
});

Object.defineProperty(window, 'scrollTo', { writable: true, value: vi.fn() });
Object.defineProperty(window, 'open', { writable: true, value: vi.fn() });
Object.defineProperty(URL, 'createObjectURL', { writable: true, value: vi.fn(() => 'blob:openvox-test') });
Object.defineProperty(URL, 'revokeObjectURL', { writable: true, value: vi.fn() });

Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  configurable: true,
  value: vi.fn(() => null)
});

Object.defineProperty(HTMLMediaElement.prototype, 'play', {
  configurable: true,
  value: vi.fn(async () => undefined)
});
Object.defineProperty(HTMLMediaElement.prototype, 'pause', {
  configurable: true,
  value: vi.fn()
});

if (!globalThis.crypto?.randomUUID) {
  Object.defineProperty(globalThis, 'crypto', {
    configurable: true,
    value: {
      randomUUID: () => `00000000-0000-4000-8000-${Math.random().toString(16).slice(2, 14).padEnd(12, '0')}`
    }
  });
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(async () => {
  cleanup();
  await new Promise<void>((resolve) => {
    const request = indexedDB.deleteDatabase('openvox-studio');
    request.onsuccess = () => resolve();
    request.onerror = () => resolve();
    request.onblocked = () => resolve();
  });
  document.head.querySelectorAll('script[data-openvox-analytics]').forEach((node) => node.remove());
});
