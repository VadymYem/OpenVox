import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../app/AppContext';
import { Icon } from '../components/Icon';
import { Seo } from '../components/Seo';
import {
  frequencyForMidi,
  INSTRUMENT_TUNINGS,
  loadCustomTunings,
  nearestString,
  saveCustomTunings,
  tuningLabel
} from '../core/instruments/instrumentTunings';
import { TonePlayer } from '../core/music/player';
import { midiToNote } from '../core/music/notes';
import { useAudioEngine } from '../hooks/useAudioEngine';
import { useI18n } from '../i18n/I18nContext';
import { proText } from '../i18n/proTranslations';
import type { InstrumentTuning } from '../types';

function noteEvent(midi: number) {
  const note = midiToNote(midi);
  return [
    {
      id: crypto.randomUUID(),
      midi,
      note: note.note,
      octave: note.octave,
      start: 0,
      duration: 1.5,
      velocity: 92,
      confidence: 1
    }
  ];
}

export function InstrumentsPage() {
  const { settings, project } = useApp();
  const { language } = useI18n();
  const x = (key: string) => proText(language, key);
  const audio = useAudioEngine(settings.referenceA4, settings.processingMode, settings.gateMultiplier);
  const player = useRef(new TonePlayer());
  const [customTunings, setCustomTunings] = useState<InstrumentTuning[]>(() => loadCustomTunings());
  const tunings = useMemo(() => [...INSTRUMENT_TUNINGS, ...customTunings], [customTunings]);
  const [tuningId, setTuningId] = useState('guitar-standard');
  const [selectedStringId, setSelectedStringId] = useState('');
  const [transposition, setTransposition] = useState(0);
  const [customName, setCustomName] = useState(() => proText(language, 'instrument.customName'));
  const [customNotes, setCustomNotes] = useState('E2 A2 D3 G3 B3 E4');
  const [midiStatus, setMidiStatus] = useState(() => proText(language, 'instrument.notConnected'));
  const [midiMessage, setMidiMessage] = useState('—');
  const [message, setMessage] = useState('');
  const tuning = tunings.find((item) => item.id === tuningId) || tunings[0];
  const activeTuning = useMemo<InstrumentTuning>(
    () => ({ ...tuning, strings: tuning.strings.map((string) => ({ ...string, midi: string.midi + transposition })) }),
    [tuning, transposition]
  );

  const detectedMidi = audio.pitch?.midi ?? null;
  const matchedString = detectedMidi !== null ? nearestString(activeTuning, detectedMidi) : null;
  const targetString = activeTuning.strings.find((item) => item.id === selectedStringId) || matchedString;
  const centsFromTarget =
    detectedMidi !== null && targetString ? (detectedMidi - targetString.midi) * 100 : (audio.pitch?.cents ?? null);
  const inTune = centsFromTarget !== null && Math.abs(centsFromTarget) <= settings.audio.tunerToleranceCents;

  useEffect(() => () => player.current.stop(), []);

  const start = async () => {
    if (audio.state.active) {
      await audio.engine.stop();
      return;
    }
    try {
      await audio.engine.start({
        deviceId: settings.microphoneId || undefined,
        processingMode: 'raw',
        referenceA4: settings.referenceA4,
        gateMultiplier: 1,
        noiseFloor: Math.min(project.settings.noiseFloor, 0.01),
        audioPreferences: settings.audio
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : x('status.micRequired'));
    }
  };

  const playReference = async (midi: number) => {
    await player.current.play(noteEvent(midi), 0.18, 'reference');
  };

  const saveCustom = () => {
    const names = customNotes
      .trim()
      .split(/[\s,;]+/)
      .filter(Boolean);
    const noteToMidi = (label: string) => {
      const match = /^([A-Ga-g])([#♯b♭]?)(-?\d)$/.exec(label);
      if (!match) return null;
      const bases: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
      let semitone = bases[match[1].toUpperCase()];
      if (match[2] === '#' || match[2] === '♯') semitone += 1;
      if (match[2] === 'b' || match[2] === '♭') semitone -= 1;
      return (Number(match[3]) + 1) * 12 + semitone;
    };
    const midis = names
      .map(noteToMidi)
      .filter((value): value is number => value !== null && value >= 0 && value <= 127);
    if (!midis.length) {
      setMessage(x('instrument.invalid'));
      return;
    }
    const next: InstrumentTuning = {
      id: `custom-${crypto.randomUUID()}`,
      instrumentId: 'custom',
      name: customName.trim() || x('instrument.customFallback'),
      strings: midis.map((midi, index) => ({
        id: `custom-${index}-${midi}`,
        label: `${index + 1} · ${tuningLabel(midi)}`,
        midi
      }))
    };
    const updated = [...customTunings, next];
    setCustomTunings(updated);
    saveCustomTunings(updated);
    setTuningId(next.id);
    setMessage(x('instrument.saved'));
  };

  const deleteCustom = () => {
    if (tuning.builtIn) return;
    const updated = customTunings.filter((item) => item.id !== tuning.id);
    setCustomTunings(updated);
    saveCustomTunings(updated);
    setTuningId('chromatic');
  };

  const connectMidi = async () => {
    try {
      if (!('requestMIDIAccess' in navigator)) throw new Error('Web MIDI is not supported by this browser.');
      const access = await (
        navigator as Navigator & { requestMIDIAccess: () => Promise<MIDIAccess> }
      ).requestMIDIAccess();
      const inputs = [...access.inputs.values()];
      setMidiStatus(
        inputs.length ? `${inputs.length} MIDI input${inputs.length === 1 ? '' : 's'}` : x('instrument.noMidi')
      );
      inputs.forEach((input) => {
        input.onmidimessage = (event) => {
          const data = event.data;
          if (!data || data.length < 2) return;
          const status = data[0] & 0xf0;
          const note = data[1];
          const velocity = data[2] || 0;
          if (status === 0x90 && velocity > 0) {
            const info = midiToNote(note);
            setMidiMessage(`${info.note}${info.octave} · velocity ${velocity}`);
          }
        };
      });
    } catch (error) {
      setMidiStatus(error instanceof Error ? error.message : 'MIDI access failed.');
    }
  };

  return (
    <div className="page">
      <Seo
        title="Instrument Workshop"
        description="Chromatic and instrument tuning, alternate tunings, reference tones and MIDI monitoring in OpenVox Studio."
        path="/instruments"
      />
      <div className="page-header">
        <div className="page-title-wrap">
          <div className="eyebrow">{x('instrument.eyebrow')}</div>
          <h1>{x('instrument.title')}</h1>
          <p>{x('instrument.body')}</p>
        </div>
        <button
          className={`button ${audio.state.active ? 'button-danger' : 'button-primary'}`}
          onClick={() => void start()}
        >
          <Icon name={audio.state.active ? 'stop' : 'mic'} />
          {audio.state.active ? x('instrument.stop') : x('instrument.start')}
        </button>
      </div>

      <div className="instrument-grid">
        <section className="card panel span-4">
          <div className="card-title">
            <h2>{x('instrument.section')}</h2>
            <span className="badge">{tuning.instrumentId}</span>
          </div>
          <div className="field">
            <label>{x('instrument.preset')}</label>
            <select
              aria-label={x('instrument.preset')}
              value={tuningId}
              onChange={(e) => {
                setTuningId(e.target.value);
                setSelectedStringId('');
              }}
            >
              {tunings.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>
              {x('instrument.transpose')} · {transposition > 0 ? '+' : ''}
              {transposition}
            </label>
            <input
              aria-label={x('instrument.transpose')}
              type="range"
              min="-12"
              max="12"
              step="1"
              value={transposition}
              onChange={(e) => setTransposition(Number(e.target.value))}
            />
            <div className="action-row">
              <span className="hint">{x('instrument.transposeHelp')}</span>
              <button className="mini-button" onClick={() => setTransposition(0)}>
                {x('instrument.resetTranspose')}
              </button>
            </div>
          </div>
          <div className="string-grid">
            {activeTuning.strings.length ? (
              activeTuning.strings.map((string) => (
                <div key={string.id} className={`string-button ${targetString?.id === string.id ? 'active' : ''}`}>
                  <button
                    className="string-select"
                    onClick={() => setSelectedStringId(string.id)}
                    aria-pressed={targetString?.id === string.id}
                    aria-label={`${string.label} · ${frequencyForMidi(string.midi, settings.referenceA4).toFixed(2)} Hz`}
                  >
                    <strong>{string.label}</strong>
                    <span>{frequencyForMidi(string.midi, settings.referenceA4).toFixed(2)} Hz</span>
                  </button>
                  <button
                    className="string-play"
                    onClick={() => void playReference(string.midi)}
                    aria-label={`Play ${string.label}`}
                  >
                    <Icon name="play" />
                  </button>
                </div>
              ))
            ) : (
              <div className="empty-state">{x('instrument.chromaticHelp')}</div>
            )}
          </div>
          {!tuning.builtIn && (
            <button className="mini-button danger-text" onClick={deleteCustom}>
              {x('instrument.deleteCustom')}
            </button>
          )}
        </section>

        <section className="card panel span-8 instrument-tuner-stage">
          <div className="tuner-note-large">{audio.pitch ? `${audio.pitch.note}${audio.pitch.octave}` : '—'}</div>
          <div className="tuner-frequency">
            {audio.pitch ? `${audio.pitch.frequency.toFixed(2)} Hz` : x('instrument.startMic')}
          </div>
          <div className="instrument-cent-gauge">
            <span className="gauge-center" />
            <span
              className={`gauge-dot ${inTune ? 'in-tune' : ''}`}
              style={{
                left: `${centsFromTarget === null ? 50 : Math.max(0, Math.min(100, 50 + centsFromTarget / 2))}%`
              }}
            />
          </div>
          <div className="tuner-status-row">
            <span>{targetString ? `${x('instrument.target')}: ${targetString.label}` : x('instrument.nearest')}</span>
            <strong className={inTune ? 'good' : ''}>
              {centsFromTarget === null ? '—' : `${centsFromTarget > 0 ? '+' : ''}${centsFromTarget.toFixed(1)} cents`}
            </strong>
            <span>
              {x('instrument.tolerance')} ±{settings.audio.tunerToleranceCents}¢
            </span>
          </div>
        </section>

        <section className="card panel span-6">
          <div className="card-title">
            <h2>{x('instrument.custom')}</h2>
            <span className="badge">Local</span>
          </div>
          <div className="field">
            <label>{x('instrument.name')}</label>
            <input
              aria-label={x('instrument.name')}
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
            />
          </div>
          <div className="field">
            <label>{x('instrument.strings')}</label>
            <input
              aria-label={x('instrument.strings')}
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              placeholder="E2 A2 D3 G3 B3 E4"
            />
          </div>
          <button className="button button-primary" onClick={saveCustom}>
            <Icon name="save" />
            {x('instrument.save')}
          </button>
        </section>

        <section className="card panel span-6">
          <div className="card-title">
            <h2>{x('instrument.midi')}</h2>
            <span className="badge">{x('instrument.optional')}</span>
          </div>
          <p className="hint">{x('instrument.midiHelp')}</p>
          <div className="metric-row">
            <div>
              <span>{x('instrument.status')}</span>
              <strong>{midiStatus}</strong>
            </div>
            <div>
              <span>{x('instrument.lastNote')}</span>
              <strong>{midiMessage}</strong>
            </div>
          </div>
          <button className="button" onClick={() => void connectMidi()}>
            <Icon name="music" />
            {x('instrument.connect')}
          </button>
        </section>
      </div>
      {message && (
        <div className="toast" role="status">
          {message}
        </div>
      )}
    </div>
  );
}
