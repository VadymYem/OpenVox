import { useEffect, useState } from 'react';
import { useApp } from '../app/AppContext';
import { Icon } from '../components/Icon';
import { Seo } from '../components/Seo';
import { useI18n } from '../i18n/I18nContext';
import { proText } from '../i18n/proTranslations';

export function SettingsPage() {
  const { t, language } = useI18n();
  const x = (key: string) => proText(language, key);
  const { settings, setSettings } = useApp();
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const refreshDevices = async () => {
    try {
      const list = (await navigator.mediaDevices?.enumerateDevices?.()) || [];
      setDevices(list.filter((d) => d.kind === 'audioinput'));
    } catch {
      setDevices([]);
    }
  };
  useEffect(() => {
    void refreshDevices();
  }, []);
  const updateAudio = <K extends keyof typeof settings.audio>(key: K, value: (typeof settings.audio)[K]) =>
    setSettings((current) => ({ ...current, audio: { ...current.audio, [key]: value } }));
  const updateAccess = <K extends keyof typeof settings.accessibility>(key: K, value: boolean) =>
    setSettings((current) => ({ ...current, accessibility: { ...current.accessibility, [key]: value } }));
  return (
    <div className="page page-narrow">
      <Seo
        title={t('settings.title')}
        description="OpenVox Studio language, appearance, accessibility, tuning and professional local audio preferences."
        path="/settings"
      />
      <div className="page-header">
        <div className="page-title-wrap">
          <div className="eyebrow">{t('settings.eyebrow')}</div>
          <h1>{t('settings.title')}</h1>
          <p>{x('settings.body')}</p>
        </div>
      </div>

      <section className="card panel settings-section">
        <div className="card-title">
          <h2>{x('settings.interface')}</h2>
          <span className="badge">Material 3</span>
        </div>
        <div className="setting-row">
          <div>
            <h3>{t('settings.language')}</h3>
            <p>English · Українська · Deutsch</p>
          </div>
          <select
            aria-label={t('settings.language')}
            value={settings.language}
            onChange={(e) =>
              setSettings((current) => ({ ...current, language: e.target.value as typeof settings.language }))
            }
          >
            <option value="en">English</option>
            <option value="uk">Українська</option>
            <option value="de">Deutsch</option>
          </select>
        </div>
        <div className="setting-row">
          <div>
            <h3>{t('settings.theme')}</h3>
            <p>{t('settings.themeInfo')}</p>
          </div>
          <select
            aria-label={t('settings.theme')}
            value={settings.theme}
            onChange={(e) => setSettings((current) => ({ ...current, theme: e.target.value as typeof settings.theme }))}
          >
            <option value="system">{t('settings.system')}</option>
            <option value="dark">{t('settings.dark')}</option>
            <option value="light">{t('settings.light')}</option>
          </select>
        </div>
        <div className="setting-row">
          <div>
            <h3>{x('settings.reducedMotion')}</h3>
            <p>{x('settings.reducedMotionBody')}</p>
          </div>
          <button
            className={`switch ${settings.accessibility.reducedMotion ? 'on' : ''}`}
            aria-label={x('settings.reducedMotion')}
            aria-pressed={settings.accessibility.reducedMotion}
            onClick={() => updateAccess('reducedMotion', !settings.accessibility.reducedMotion)}
          >
            <span />
          </button>
        </div>
        <div className="setting-row">
          <div>
            <h3>{x('settings.highContrast')}</h3>
            <p>{x('settings.highContrastBody')}</p>
          </div>
          <button
            className={`switch ${settings.accessibility.highContrast ? 'on' : ''}`}
            aria-label={x('settings.highContrast')}
            aria-pressed={settings.accessibility.highContrast}
            onClick={() => updateAccess('highContrast', !settings.accessibility.highContrast)}
          >
            <span />
          </button>
        </div>
        <div className="setting-row">
          <div>
            <h3>{x('settings.largeControls')}</h3>
            <p>{x('settings.largeControlsBody')}</p>
          </div>
          <button
            className={`switch ${settings.accessibility.largeControls ? 'on' : ''}`}
            aria-label={x('settings.largeControls')}
            aria-pressed={settings.accessibility.largeControls}
            onClick={() => updateAccess('largeControls', !settings.accessibility.largeControls)}
          >
            <span />
          </button>
        </div>
      </section>

      <section className="card panel settings-section">
        <div className="card-title">
          <h2>{x('settings.microphoneAudio')}</h2>
          <button className="mini-button" onClick={() => void refreshDevices()}>
            <Icon name="settings" />
            {x('settings.refresh')}
          </button>
        </div>
        <div className="setting-row">
          <div>
            <h3>{x('settings.preferredMic')}</h3>
            <p>{x('settings.micPermission')}</p>
          </div>
          <select
            aria-label={x('settings.preferredMic')}
            value={settings.microphoneId}
            onChange={(e) => setSettings((current) => ({ ...current, microphoneId: e.target.value }))}
          >
            <option value="">{x('settings.defaultInput')}</option>
            {devices.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Microphone ${device.deviceId.slice(0, 6)}`}
              </option>
            ))}
          </select>
        </div>
        <div className="setting-row">
          <div>
            <h3>{x('settings.sampleRate')}</h3>
            <p>{x('settings.sampleRateBody')}</p>
          </div>
          <select
            aria-label={x('settings.sampleRate')}
            value={settings.audio.requestedSampleRate}
            onChange={(e) =>
              updateAudio('requestedSampleRate', Number(e.target.value) as typeof settings.audio.requestedSampleRate)
            }
          >
            {[32000, 44100, 48000, 88200, 96000].map((rate) => (
              <option value={rate} key={rate}>
                {rate / 1000} kHz
              </option>
            ))}
          </select>
        </div>
        <div className="setting-row">
          <div>
            <h3>{x('settings.channels')}</h3>
            <p>{x('settings.channelsBody')}</p>
          </div>
          <select
            aria-label={x('settings.channels')}
            value={settings.audio.channelCount}
            onChange={(e) => updateAudio('channelCount', Number(e.target.value) as 1 | 2)}
          >
            <option value="1">{x('settings.mono')}</option>
            <option value="2">{x('settings.stereo')}</option>
          </select>
        </div>
        <div className="setting-row">
          <div>
            <h3>{x('settings.latency')}</h3>
            <p>{x('settings.latencyBody')}</p>
          </div>
          <select
            aria-label={x('settings.latency')}
            value={settings.audio.latencyHint}
            onChange={(e) => updateAudio('latencyHint', e.target.value as typeof settings.audio.latencyHint)}
          >
            <option value="interactive">{x('settings.interactive')}</option>
            <option value="balanced">{x('settings.balanced')}</option>
            <option value="playback">{x('settings.playback')}</option>
          </select>
        </div>
        {(
          [
            ['echoCancellation', 'settings.echo'],
            ['noiseSuppression', 'settings.noise'],
            ['autoGainControl', 'settings.agc']
          ] as const
        ).map(([key, labelKey]) => (
          <div className="setting-row" key={key}>
            <div>
              <h3>{x(labelKey)}</h3>
              <p>{x('settings.browserProcess')}</p>
            </div>
            <button
              className={`switch ${settings.audio[key] ? 'on' : ''}`}
              aria-label={x(labelKey)}
              aria-pressed={settings.audio[key]}
              onClick={() => updateAudio(key, !settings.audio[key])}
            >
              <span />
            </button>
          </div>
        ))}
      </section>

      <section className="card panel settings-section">
        <div className="card-title">
          <h2>{x('settings.pitchTuning')}</h2>
          <span className="badge">{x('settings.global')}</span>
        </div>
        <div className="setting-row">
          <div>
            <h3>{t('settings.a4')}</h3>
            <p>{t('settings.a4Info')}</p>
          </div>
          <input
            aria-label={t('settings.a4')}
            type="number"
            min="400"
            max="480"
            value={settings.referenceA4}
            onChange={(e) =>
              setSettings((current) => ({
                ...current,
                referenceA4: Math.max(400, Math.min(480, Number(e.target.value)))
              }))
            }
          />
        </div>
        <div className="setting-row">
          <div>
            <h3>{x('settings.pitchRange')}</h3>
            <p>{x('settings.pitchRangeBody')}</p>
          </div>
          <div className="inline-fields">
            <input
              aria-label={`${x('settings.pitchRange')} minimum`}
              type="number"
              min="20"
              max="1000"
              value={settings.audio.minimumPitchHz}
              onChange={(e) => updateAudio('minimumPitchHz', Number(e.target.value))}
            />
            <span>–</span>
            <input
              aria-label={`${x('settings.pitchRange')} maximum`}
              type="number"
              min="100"
              max="5000"
              value={settings.audio.maximumPitchHz}
              onChange={(e) => updateAudio('maximumPitchHz', Number(e.target.value))}
            />
            <span>Hz</span>
          </div>
        </div>
        <div className="setting-row">
          <div>
            <h3>{x('settings.minConfidence')}</h3>
            <p>{x('settings.minConfidenceBody')}</p>
          </div>
          <input
            aria-label={x('settings.minConfidence')}
            type="range"
            min="0.3"
            max="0.95"
            step="0.05"
            value={settings.audio.confidenceThreshold}
            onChange={(e) => updateAudio('confidenceThreshold', Number(e.target.value))}
          />
        </div>
        <div className="setting-row">
          <div>
            <h3>{x('settings.tunerTolerance')}</h3>
            <p>{x('settings.tunerToleranceBody')}</p>
          </div>
          <input
            aria-label={x('settings.tunerTolerance')}
            type="number"
            min="1"
            max="30"
            value={settings.audio.tunerToleranceCents}
            onChange={(e) => updateAudio('tunerToleranceCents', Number(e.target.value))}
          />
        </div>
        <div className="setting-row">
          <div>
            <h3>{t('settings.gate')}</h3>
            <p>{t('settings.gateInfo')}</p>
          </div>
          <input
            aria-label={t('settings.gate')}
            type="range"
            min="1"
            max="4"
            step="0.1"
            value={settings.gateMultiplier}
            onChange={(e) => setSettings((current) => ({ ...current, gateMultiplier: Number(e.target.value) }))}
          />
        </div>
      </section>

      <section className="card panel settings-section">
        <div className="card-title">
          <h2>{x('settings.privacyTelemetry')}</h2>
          <span className="badge">{x('settings.optOut')}</span>
        </div>
        <div className="setting-row">
          <div>
            <h3>{t('settings.analytics')}</h3>
            <p>{t('settings.analyticsInfo')}</p>
          </div>
          <button
            className={`switch ${settings.analyticsEnabled ? 'on' : ''}`}
            onClick={() => setSettings((current) => ({ ...current, analyticsEnabled: !current.analyticsEnabled }))}
            aria-label={t('settings.analytics')}
            aria-pressed={settings.analyticsEnabled}
          >
            <span />
          </button>
        </div>
      </section>
    </div>
  );
}
