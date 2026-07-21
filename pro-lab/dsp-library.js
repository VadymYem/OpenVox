(() => {
  const sizes = [1024, 2048, 4096, 8192, 16384, 32768];
  const windowCache = new Map();
  const twiddleCache = new Map();

  const windowFunctions = {
    hann: (i, n) => 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (n - 1)),
    hamming: (i, n) => 0.54 - 0.46 * Math.cos((2 * Math.PI * i) / (n - 1)),
    blackman: (i, n) => {
      const phase = (2 * Math.PI * i) / (n - 1);
      return 0.42 - 0.5 * Math.cos(phase) + 0.08 * Math.cos(2 * phase);
    },
    'blackman-harris': (i, n) => {
      const phase = (2 * Math.PI * i) / (n - 1);
      return 0.35875 - 0.48829 * Math.cos(phase) + 0.14128 * Math.cos(2 * phase) - 0.01168 * Math.cos(3 * phase);
    },
    flattop: (i, n) => {
      const phase = (2 * Math.PI * i) / (n - 1);
      return (
        0.21557895 -
        0.41663158 * Math.cos(phase) +
        0.277263158 * Math.cos(2 * phase) -
        0.083578947 * Math.cos(3 * phase) +
        0.006947368 * Math.cos(4 * phase)
      );
    }
  };

  function normalizeSize(size) {
    return sizes.includes(size) ? size : 8192;
  }

  function getWindow(type, requestedSize) {
    const size = normalizeSize(requestedSize);
    const normalizedType = Object.hasOwn(windowFunctions, type) ? type : 'hann';
    const key = `${normalizedType}:${size}`;
    const cached = windowCache.get(key);
    if (cached) return cached;

    const table = new Float32Array(size);
    const fn = windowFunctions[normalizedType];
    for (let i = 0; i < size; i += 1) table[i] = fn(i, size);
    windowCache.set(key, table);
    return table;
  }

  function getTwiddle(requestedSize) {
    const size = normalizeSize(requestedSize);
    const cached = twiddleCache.get(size);
    if (cached) return cached;

    const half = size >>> 1;
    const cos = new Float32Array(half);
    const sin = new Float32Array(half);
    for (let i = 0; i < half; i += 1) {
      const phase = (-2 * Math.PI * i) / size;
      cos[i] = Math.cos(phase);
      sin[i] = Math.sin(phase);
    }

    const tables = { cos, sin };
    twiddleCache.set(size, tables);
    return tables;
  }

  window.OVX_DSP_LIBRARY = {
    sizes,
    getWindow,
    getTwiddle,
    clearCache() {
      windowCache.clear();
      twiddleCache.clear();
    },
    cacheSize() {
      return windowCache.size + twiddleCache.size;
    }
  };
})();
