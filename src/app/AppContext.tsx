import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { AppSettings, OpenVoxProject, ScoreDocument } from '../types';
import { listProjects, loadSettings, saveProject, saveSettings } from '../core/storage/database';
import { setAnalyticsEnabled } from '../core/analytics';
import { getInitialLanguagePreference, getInitialThemePreference, mirrorInterfacePreferences } from '../core/systemPreferences';

const defaultScore = (): ScoreDocument => {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    title: 'Untitled Voice Score',
    composer: 'AuthorChe',
    tempo: 90,
    timeSignature: [4, 4],
    keyFifths: 0,
    notes: [],
    createdAt: now,
    updatedAt: now
  };
};

export const defaultSettings: AppSettings = {
  language: 'en',
  theme: 'system',
  referenceA4: 440,
  processingMode: 'vocal',
  gateMultiplier: 1.8,
  microphoneId: '',
  analyticsEnabled: true,
  audio: {
    requestedSampleRate: 48000,
    channelCount: 1,
    echoCancellation: false,
    noiseSuppression: false,
    autoGainControl: false,
    latencyHint: 'interactive',
    minimumPitchHz: 65,
    maximumPitchHz: 1400,
    confidenceThreshold: 0.6,
    tunerToleranceCents: 5
  },
  accessibility: {
    reducedMotion: false,
    highContrast: false,
    largeControls: false
  }
};

interface AppContextValue {
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  project: OpenVoxProject;
  setProject: React.Dispatch<React.SetStateAction<OpenVoxProject>>;
  createProject: (name?: string) => OpenVoxProject;
  persistProject: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

function makeProject(name = 'My OpenVox Project'): OpenVoxProject {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    name,
    createdAt: now,
    updatedAt: now,
    score: defaultScore(),
    pitchHistory: [],
    settings: { processingMode: 'vocal', noiseFloor: 0.008, gateMultiplier: 1.8, referenceA4: 440 }
  };
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(() => ({
    ...defaultSettings,
    language: getInitialLanguagePreference(),
    theme: getInitialThemePreference()
  }));
  const [project, setProject] = useState<OpenVoxProject>(() => makeProject());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    void Promise.all([loadSettings(), listProjects()])
      .then(([savedSettings, projects]) => {
        if (savedSettings)
          setSettings({
            ...defaultSettings,
            ...savedSettings,
            audio: { ...defaultSettings.audio, ...(savedSettings.audio || {}) },
            accessibility: { ...defaultSettings.accessibility, ...(savedSettings.accessibility || {}) }
          });
        if (projects[0]) setProject(projects[0]);
      })
      .catch(() => undefined)
      .finally(() => setHydrated(true));
  }, []);
  useEffect(() => {
    if (hydrated) void saveSettings(settings).catch(() => undefined);
  }, [settings, hydrated]);
  useEffect(() => {
    if (!hydrated) return;
    void setAnalyticsEnabled(settings.analyticsEnabled);
  }, [settings.analyticsEnabled, hydrated]);
  useEffect(() => {
    if (!hydrated) return;
    const timer = window.setTimeout(() => {
      void saveProject({ ...project, updatedAt: Date.now() }).catch(() => undefined);
    }, 700);
    return () => window.clearTimeout(timer);
  }, [project, hydrated]);
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = settings.theme;
    root.dataset.highContrast = settings.accessibility.highContrast ? 'true' : 'false';
    root.dataset.largeControls = settings.accessibility.largeControls ? 'true' : 'false';
    root.dataset.reduceMotion = settings.accessibility.reducedMotion ? 'true' : 'false';
    root.lang = settings.language;
    mirrorInterfacePreferences(settings.language, settings.theme);

    const media = typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-color-scheme: light)') : undefined;
    const syncThemeColor = () => {
      const light = settings.theme === 'light' || (settings.theme === 'system' && (media?.matches ?? false));
      document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.setAttribute('content', light ? '#f8f5ef' : '#030712');
    };
    syncThemeColor();
    if (settings.theme === 'system') media?.addEventListener?.('change', syncThemeColor);
    return () => media?.removeEventListener?.('change', syncThemeColor);
  }, [settings.theme, settings.language, settings.accessibility]);

  const value = useMemo<AppContextValue>(
    () => ({
      settings,
      setSettings,
      project,
      setProject,
      createProject(name) {
        const next = makeProject(name);
        setProject(next);
        return next;
      },
      async persistProject() {
        const next = { ...project, updatedAt: Date.now() };
        setProject(next);
        await saveProject(next);
      }
    }),
    [settings, project]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used inside AppProvider.');
  return context;
}
