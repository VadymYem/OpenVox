import { useEffect, useMemo, useState } from 'react';
import { Seo } from '../components/Seo';
import { Icon } from '../components/Icon';
import { useApp } from '../app/AppContext';
import { useAudioEngine } from '../hooks/useAudioEngine';
import { useI18n } from '../i18n/I18nContext';
import type { PitchFrame } from '../types';
import { noteLabel } from '../core/music/notes';

type PitchSegment = { midi: number; frames: PitchFrame[]; duration: number; meanDeviation: number };

function buildSegments(frames: PitchFrame[]): PitchSegment[] {
  const stableFrames = frames.filter((frame) => frame.rms > 0.0035 && frame.confidence > 0.65);
  const segments: PitchSegment[] = [];
  let current: PitchFrame[] = [];
  let midi = -1;
  const flush = () => {
    if (!current.length) return;
    const duration = Math.max(0, current[current.length - 1].timestamp - current[0].timestamp);
    const meanDeviation =
      current.reduce((sum, frame) => sum + Math.abs((frame.midi - Math.round(frame.midi)) * 100), 0) / current.length;
    segments.push({ midi, frames: current, duration, meanDeviation });
    current = [];
  };
  for (const frame of stableFrames) {
    const rounded = Math.round(frame.midi);
    const previous = current[current.length - 1];
    if (!current.length || (rounded === midi && (!previous || frame.timestamp - previous.timestamp < 0.2))) {
      midi = rounded;
      current.push(frame);
    } else {
      flush();
      midi = rounded;
      current = [frame];
    }
  }
  flush();
  return segments;
}

function calculateVibrato(frames: PitchFrame[]): { rate: number; width: number } {
  if (frames.length < 20) return { rate: 0, width: 0 };
  const midis = frames.map((frame) => frame.midi);
  const meanMidi = midis.reduce((sum, value) => sum + value, 0) / midis.length;
  const cents = midis.map((value) => (value - meanMidi) * 100);
  const smoothed = cents.map((_, index) => {
    const from = Math.max(0, index - 2);
    const to = Math.min(cents.length, index + 3);
    return cents.slice(from, to).reduce((sum, value) => sum + value, 0) / (to - from);
  });
  let crossings = 0;
  for (let i = 1; i < smoothed.length; i++)
    if ((smoothed[i - 1] <= 0 && smoothed[i] > 0) || (smoothed[i - 1] >= 0 && smoothed[i] < 0)) crossings++;
  const duration = Math.max(0.1, frames[frames.length - 1].timestamp - frames[0].timestamp);
  const rate = crossings / 2 / duration;
  const sorted = [...smoothed].sort((a, b) => a - b);
  const low = sorted[Math.floor(sorted.length * 0.1)];
  const high = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.9))];
  return { rate: rate >= 3 && rate <= 9 ? rate : 0, width: Math.abs(high - low) };
}

function rangeLabel(midis: number[]): string {
  return midis.length ? `${noteLabel(Math.min(...midis))} – ${noteLabel(Math.max(...midis))}` : '—';
}

export function AnalyzePage() {
  const { t } = useI18n();
  const { settings, project } = useApp();
  const audio = useAudioEngine(settings.referenceA4, settings.processingMode, settings.gateMultiplier);
  const [running, setRunning] = useState(false);
  const [frames, setFrames] = useState<PitchFrame[]>([]);

  useEffect(
    () =>
      audio.subscribePitch((frame) => {
        if (running && frame.confidence > 0.6) setFrames((current) => [...current, frame]);
      }),
    [audio, running]
  );

  const metrics = useMemo(() => {
    if (!frames.length) return null;
    const segments = buildSegments(frames);
    const touched = segments.filter((segment) => segment.duration >= 0.08);
    const stable = segments.filter((segment) => segment.duration >= 0.4 && segment.meanDeviation <= 38);
    const sustained = segments.filter((segment) => segment.duration >= 1.2 && segment.meanDeviation <= 32);
    const source = stable.flatMap((segment) => segment.frames);
    if (!source.length)
      return { touched, stable, sustained, stability: 0, averageDeviation: 0, vibrato: { rate: 0, width: 0 } };
    const deviations = source.map((frame) => Math.abs((frame.midi - Math.round(frame.midi)) * 100));
    const averageDeviation = deviations.reduce((sum, value) => sum + value, 0) / deviations.length;
    const stability = Math.max(0, Math.min(100, Math.round(100 - averageDeviation * 1.5)));
    const vibratoSegment = [...segments]
      .filter((segment) => segment.duration >= 1)
      .sort((a, b) => b.duration - a.duration)[0];
    return {
      touched,
      stable,
      sustained,
      stability,
      averageDeviation,
      vibrato: vibratoSegment ? calculateVibrato(vibratoSegment.frames) : { rate: 0, width: 0 }
    };
  }, [frames]);

  const toggle = async () => {
    if (!running) {
      setFrames([]);
      if (!audio.state.active)
        await audio.engine.start({
          deviceId: settings.microphoneId || undefined,
          processingMode: settings.processingMode,
          referenceA4: settings.referenceA4,
          gateMultiplier: settings.gateMultiplier,
          noiseFloor: project.settings.noiseFloor,
          audioPreferences: settings.audio
        });
      setRunning(true);
    } else setRunning(false);
  };

  const stableMidis = metrics?.stable.map((segment) => segment.midi) || [];
  const touchedMidis = metrics?.touched.map((segment) => segment.midi) || [];
  const sustainedMidis = metrics?.sustained.map((segment) => segment.midi) || [];

  return (
    <div className="page">
      <Seo title={t('analyze.title')} description={t('analyze.subtitle')} path="/analyze" />
      <div className="page-header">
        <div className="page-title-wrap">
          <div className="eyebrow">OpenVox Metrics</div>
          <h1>{t('analyze.title')}</h1>
          <p>{t('analyze.subtitle')}</p>
        </div>
        <button className={`button ${running ? 'button-danger' : 'button-primary'}`} onClick={() => void toggle()}>
          <Icon name={running ? 'stop' : 'chart'} />
          {running ? t('analyze.end') : t('analyze.begin')}
        </button>
      </div>
      {audio.error && (
        <p className="hint" style={{ color: 'var(--red)' }}>
          {audio.error}
        </p>
      )}
      <div className="analysis-grid">
        <section className="card panel span-6">
          <span className="stat-label">{t('analyze.range')}</span>
          <div className="stat-large">{rangeLabel(stableMidis)}</div>
          <div className="range-track" />
          <div className="metrics-grid" style={{ marginTop: 18 }}>
            <div className="metric">
              <span>{t('analyze.low')}</span>
              <strong>{stableMidis.length ? noteLabel(Math.min(...stableMidis)) : '—'}</strong>
            </div>
            <div className="metric">
              <span>{t('analyze.high')}</span>
              <strong>{stableMidis.length ? noteLabel(Math.max(...stableMidis)) : '—'}</strong>
            </div>
          </div>
        </section>
        <section className="card panel span-6">
          <span className="stat-label">{t('analyze.stability')}</span>
          <div className="stat-large">{metrics?.stable.length ? `${metrics.stability}%` : '—'}</div>
          <p className="hint">{t('analyze.stabilityHelp')}</p>
        </section>
        <section className="card panel span-4">
          <span className="stat-label">{t('analyze.touchedRange')}</span>
          <div className="stat-large stat-medium">{rangeLabel(touchedMidis)}</div>
          <p className="hint">{t('analyze.touchedHelp')}</p>
        </section>
        <section className="card panel span-4">
          <span className="stat-label">{t('analyze.sustainedRange')}</span>
          <div className="stat-large stat-medium">{rangeLabel(sustainedMidis)}</div>
          <p className="hint">{t('analyze.sustainedHelp')}</p>
        </section>
        <section className="card panel span-4">
          <span className="stat-label">{t('analyze.deviation')}</span>
          <div className="stat-large stat-medium">
            {metrics?.stable.length ? `${metrics.averageDeviation.toFixed(1)} ¢` : '—'}
          </div>
          <p className="hint">{t('analyze.deviationHelp')}</p>
        </section>
        <section className="card panel span-6">
          <span className="stat-label">{t('analyze.vibrato')}</span>
          <div className="stat-large">{metrics?.vibrato.rate ? `${metrics.vibrato.rate.toFixed(1)} Hz` : '—'}</div>
          <p className="hint">{t('analyze.vibratoHelp')}</p>
        </section>
        <section className="card panel span-6">
          <span className="stat-label">{t('analyze.width')}</span>
          <div className="stat-large">{metrics?.vibrato.width ? `${Math.round(metrics.vibrato.width)} ¢` : '—'}</div>
          <p className="hint">{t('analyze.widthHelp')}</p>
        </section>
      </div>
    </div>
  );
}
