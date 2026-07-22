const loadedScripts = new Map<string, Promise<void>>();

function loadClassicScript(src: string) {
  const existing = loadedScripts.get(src);
  if (existing) return existing;

  const pending = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = false;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });

  loadedScripts.set(src, pending);
  return pending;
}

async function loadProAudioLab() {
  const base = import.meta.env.BASE_URL;
  await loadClassicScript(`${base}pro-lab/dsp-library.js`);
  await loadClassicScript(`${base}pro-lab/pro-audio-lab.js`);
}

void loadProAudioLab().catch((error) => {
  console.error('OpenVox Pro Audio Lab failed to initialize.', error);
});
