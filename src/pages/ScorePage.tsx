import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../app/AppContext';
import { Icon } from '../components/Icon';
import { Seo } from '../components/Seo';
import { ScoreViewport } from '../components/ScoreViewport';
import { exportMidi, exportMusicXml, exportPng, exportSvg, printScore } from '../core/export/scoreExport';
import { importMidi } from '../core/music/midiImport';
import { importMusicXml } from '../core/music/musicXmlImport';
import { midiToNote, parseNoteSpelling } from '../core/music/notes';
import { renderScoreSvg } from '../core/music/scoreRenderer';
import { TonePlayer } from '../core/music/player';
import { useI18n } from '../i18n/I18nContext';
import { proText } from '../i18n/proTranslations';
import type { MusicalNoteEvent, ScoreDocument } from '../types';

export function ScorePage() {
  const { t, language } = useI18n();
  const x = (key: string) => proText(language, key);
  const { project, setProject, persistProject } = useApp();
  const [message, setMessage] = useState('');
  const [playing, setPlaying] = useState(false);
  const [mobilePane, setMobilePane] = useState<'edit' | 'preview'>('edit');
  const player = useRef(new TonePlayer());
  const undoStack = useRef<ScoreDocument[]>([]);
  const redoStack = useRef<ScoreDocument[]>([]);
  const [historyVersion, setHistoryVersion] = useState(0);
  const [quantizeGrid, setQuantizeGrid] = useState<'quarter' | 'eighth' | 'triplet' | 'sixteenth'>('eighth');
  const score = project.score;
  const svg = useMemo(() => renderScoreSvg(score), [score]);
  useEffect(() => () => player.current.stop(), []);

  const cloneScore = (value: ScoreDocument): ScoreDocument => ({
    ...value,
    timeSignature: [...value.timeSignature] as [number, number],
    notes: value.notes.map((note) => ({ ...note }))
  });
  const commitScore = (nextScore: ScoreDocument) => {
    undoStack.current = [...undoStack.current.slice(-99), cloneScore(score)];
    redoStack.current = [];
    setProject((current) => ({ ...current, updatedAt: Date.now(), score: { ...nextScore, updatedAt: Date.now() } }));
    setHistoryVersion((value) => value + 1);
  };
  const updateScore = (patch: Partial<typeof score>) => commitScore({ ...score, ...patch, updatedAt: Date.now() });
  const undo = () => {
    const previous = undoStack.current.pop();
    if (!previous) return;
    redoStack.current.push(cloneScore(score));
    setProject((current) => ({ ...current, updatedAt: Date.now(), score: cloneScore(previous) }));
    setHistoryVersion((value) => value + 1);
  };
  const redo = () => {
    const next = redoStack.current.pop();
    if (!next) return;
    undoStack.current.push(cloneScore(score));
    setProject((current) => ({ ...current, updatedAt: Date.now(), score: cloneScore(next) }));
    setHistoryVersion((value) => value + 1);
  };
  const transposeScore = (semitones: number) => {
    if (!score.notes.length) return;
    updateScore({
      notes: score.notes.map((note) => {
        const midi = Math.max(0, Math.min(127, note.midi + semitones));
        const info = midiToNote(midi);
        return { ...note, midi, note: info.note, octave: info.octave };
      })
    });
  };
  const quantizeScore = () => {
    if (!score.notes.length) return;
    const beat = 60 / Math.max(20, score.tempo);
    const grid =
      quantizeGrid === 'quarter'
        ? beat
        : quantizeGrid === 'eighth'
          ? beat / 2
          : quantizeGrid === 'triplet'
            ? beat / 3
            : beat / 4;
    updateScore({
      notes: score.notes
        .map((note) => ({
          ...note,
          start: Math.max(0, Math.round(note.start / grid) * grid),
          duration: Math.max(grid, Math.round(note.duration / grid) * grid)
        }))
        .sort((a, b) => a.start - b.start || a.midi - b.midi)
    });
  };
  const updateNote = (id: string, patch: Partial<MusicalNoteEvent>) =>
    updateScore({ notes: score.notes.map((note) => (note.id === id ? { ...note, ...patch } : note)) });
  const changeNoteLabel = (id: string, value: string) => {
    const pitch = parseNoteSpelling(value);
    if (!pitch) return;
    updateNote(id, pitch);
  };
  const addNote = () => {
    const previous = score.notes[score.notes.length - 1];
    const midi = previous && !previous.isRest ? previous.midi : 60;
    const info = midiToNote(midi);
    const start = previous ? previous.start + previous.duration : 0;
    updateScore({
      notes: [
        ...score.notes,
        {
          id: crypto.randomUUID(),
          midi,
          note: info.note,
          octave: info.octave,
          start,
          duration: 0.5,
          velocity: 96,
          confidence: 1,
          isRest: false
        }
      ]
    });
  };
  const addRest = () => {
    const previous = score.notes[score.notes.length - 1];
    const start = previous ? previous.start + previous.duration : 0;
    updateScore({
      notes: [
        ...score.notes,
        {
          id: crypto.randomUUID(),
          midi: 60,
          note: 'C',
          octave: 4,
          start,
          duration: 0.5,
          velocity: 1,
          confidence: 1,
          isRest: true
        }
      ]
    });
  };
  const removeNote = (id: string) => updateScore({ notes: score.notes.filter((note) => note.id !== id) });
  const duplicateNote = (id: string) => {
    const index = score.notes.findIndex((note) => note.id === id);
    if (index < 0) return;
    const source = score.notes[index];
    const copy = {
      ...source,
      id: crypto.randomUUID(),
      start: source.start + source.duration,
      tieStart: false,
      tieStop: false
    };
    const next = [...score.notes];
    next.splice(index + 1, 0, copy);
    updateScore({ notes: next });
  };
  const splitNote = (id: string) => {
    const index = score.notes.findIndex((note) => note.id === id);
    if (index < 0) return;
    const source = score.notes[index];
    const half = Math.max(0.025, source.duration / 2);
    const first = { ...source, duration: half, tieStart: true };
    const second = { ...source, id: crypto.randomUUID(), start: source.start + half, duration: half, tieStop: true };
    const next = [...score.notes];
    next.splice(index, 1, first, second);
    updateScore({ notes: next });
  };
  const mergeNext = (id: string) => {
    const index = score.notes.findIndex((note) => note.id === id);
    if (index < 0 || index >= score.notes.length - 1) return;
    const current = score.notes[index];
    const following = score.notes[index + 1];
    const merged = {
      ...current,
      duration: Math.max(current.duration, following.start + following.duration - current.start),
      lyric: [current.lyric, following.lyric].filter(Boolean).join(' '),
      tieStart: false,
      tieStop: false
    };
    const next = [...score.notes];
    next.splice(index, 2, merged);
    updateScore({ notes: next });
  };

  const togglePlayback = async () => {
    if (playing) {
      player.current.stop();
      setPlaying(false);
      return;
    }
    if (!score.notes.length) return;
    setPlaying(true);
    await player.current.play(
      [...score.notes].sort((a, b) => a.start - b.start),
      0.16,
      'piano'
    );
    const end = score.notes.reduce((max, note) => Math.max(max, note.start + note.duration), 0);
    window.setTimeout(() => setPlaying(false), end * 1000 + 150);
  };

  const sortNotes = () => updateScore({ notes: [...score.notes].sort((a, b) => a.start - b.start || a.midi - b.midi) });

  const importFile = async (file: File) => {
    try {
      const imported =
        file.name.toLowerCase().endsWith('.mid') || file.name.toLowerCase().endsWith('.midi')
          ? importMidi(await file.arrayBuffer())
          : importMusicXml(await file.text());
      commitScore(imported);
      setMessage(t('score.importSuccess'));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t('score.importFailed'));
    }
  };

  return (
    <div className="page" data-history-version={historyVersion}>
      <Seo title={t('score.title')} description={t('score.subtitle')} path="/score" />
      <div className="page-header">
        <div className="page-title-wrap">
          <div className="eyebrow">OpenVox Score</div>
          <h1>{t('score.title')}</h1>
          <p>{t('score.subtitle')}</p>
        </div>
      </div>
      <div className="toolbar">
        <button
          className={`button ${playing ? 'button-danger' : 'button-primary'}`}
          onClick={() => void togglePlayback()}
        >
          <Icon name={playing ? 'stop' : 'play'} />
          {playing ? t('common.stop') : t('score.play')}
        </button>
        <button className="button" disabled={!undoStack.current.length} onClick={undo} aria-label={x('score.undo')}>
          <Icon name="undo" />
          {x('score.undo')}
        </button>
        <button className="button" disabled={!redoStack.current.length} onClick={redo} aria-label={x('score.redo')}>
          <Icon name="redo" />
          {x('score.redo')}
        </button>
        <button className="button" onClick={sortNotes}>
          <Icon name="chart" />
          {t('score.sort')}
        </button>
        <button className="button" disabled={!score.notes.length} onClick={() => transposeScore(-1)}>
          <Icon name="music" />
          {x('score.transposeDown')}
        </button>
        <button className="button" disabled={!score.notes.length} onClick={() => transposeScore(1)}>
          <Icon name="music" />
          {x('score.transposeUp')}
        </button>
        <label className="toolbar-select">
          <span>{x('score.quantize')}</span>
          <select
            aria-label={x('score.quantize')}
            value={quantizeGrid}
            onChange={(event) => setQuantizeGrid(event.target.value as typeof quantizeGrid)}
          >
            <option value="quarter">1/4</option>
            <option value="eighth">1/8</option>
            <option value="triplet">1/8T</option>
            <option value="sixteenth">1/16</option>
          </select>
        </label>
        <button className="button" disabled={!score.notes.length} onClick={quantizeScore}>
          <Icon name="chart" />
          {x('score.applyQuantize')}
        </button>
        <label className="button file-button">
          <Icon name="upload" />
          {t('score.import')}
          <input
            type="file"
            accept=".musicxml,.xml,.mid,.midi"
            onChange={(e) => e.target.files?.[0] && void importFile(e.target.files[0])}
          />
        </label>
        <button className="button" onClick={() => exportMusicXml(score)}>
          <Icon name="download" />
          {t('score.musicxml')}
        </button>
        <button className="button" onClick={() => exportMidi(score)}>
          <Icon name="download" />
          {t('score.midi')}
        </button>
        <button className="button" onClick={() => exportSvg(score)}>
          <Icon name="download" />
          {t('score.svg')}
        </button>
        <button className="button" onClick={() => void exportPng(score)}>
          <Icon name="download" />
          {t('score.png')}
        </button>
        <button className="button" onClick={() => printScore(score)}>
          <Icon name="download" />
          {t('score.pdf')}
        </button>
        <button
          className="button button-primary"
          onClick={() => void persistProject().then(() => setMessage(t('status.saved')))}
        >
          <Icon name="save" />
          {t('common.save')}
        </button>
      </div>
      {message && <div className="toast">{message}</div>}
      <div className="score-mobile-switch" role="tablist" aria-label="Score workspace">
        <button
          role="tab"
          aria-selected={mobilePane === 'edit'}
          className={mobilePane === 'edit' ? 'active' : ''}
          onClick={() => setMobilePane('edit')}
        >
          {t('score.note')}
        </button>
        <button
          role="tab"
          aria-selected={mobilePane === 'preview'}
          className={mobilePane === 'preview' ? 'active' : ''}
          onClick={() => setMobilePane('preview')}
        >
          {t('score.preview')}
        </button>
      </div>
      <div className="editor-layout" data-mobile-pane={mobilePane}>
        <aside className="card editor-panel score-editor-pane">
          <div className="field">
            <label>{t('score.metaTitle')}</label>
            <input
              aria-label={t('score.metaTitle')}
              value={score.title}
              onChange={(e) => updateScore({ title: e.target.value })}
            />
          </div>
          <div className="field">
            <label>{t('score.composer')}</label>
            <input
              aria-label={t('score.composer')}
              value={score.composer}
              onChange={(e) => updateScore({ composer: e.target.value })}
            />
          </div>
          <div className="field">
            <label>
              {t('score.tempo')} · {score.tempo} BPM
            </label>
            <input
              aria-label={t('score.tempo')}
              type="range"
              min="40"
              max="220"
              value={score.tempo}
              onChange={(e) => updateScore({ tempo: Number(e.target.value) })}
            />
          </div>
          <div className="field-row">
            <div className="field">
              <label>{t('score.timeSignature')}</label>
              <select
                aria-label={t('score.timeSignature')}
                value={`${score.timeSignature[0]}/${score.timeSignature[1]}`}
                onChange={(e) => {
                  const [a, b] = e.target.value.split('/').map(Number);
                  updateScore({ timeSignature: [a, b] });
                }}
              >
                <option>2/4</option>
                <option>3/4</option>
                <option>4/4</option>
                <option>6/8</option>
                <option>9/8</option>
                <option>12/8</option>
              </select>
            </div>
            <div className="field">
              <label>{t('score.keySignature')}</label>
              <input
                aria-label={t('score.keySignature')}
                type="number"
                min="-7"
                max="7"
                value={score.keyFifths}
                onChange={(e) => updateScore({ keyFifths: Math.max(-7, Math.min(7, Number(e.target.value))) })}
              />
            </div>
          </div>
          <div className="card-title">
            <h2>{t('score.note')}</h2>
            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
              <button className="button" onClick={addNote}>
                <Icon name="plus" />
                {t('score.add')}
              </button>
              <button className="button" onClick={addRest}>
                <Icon name="plus" />
                {t('score.addRest')}
              </button>
            </div>
          </div>
          {score.notes.length ? (
            score.notes.map((note) => (
              <div className="note-row note-row-advanced" key={note.id}>
                <div className="field">
                  <label>{t('score.type')}</label>
                  <select
                    aria-label={t('score.type')}
                    value={note.isRest ? 'rest' : 'note'}
                    onChange={(e) =>
                      updateNote(note.id, {
                        isRest: e.target.value === 'rest',
                        velocity: e.target.value === 'rest' ? 1 : 96,
                        tieStart: e.target.value === 'rest' ? false : note.tieStart,
                        tieStop: e.target.value === 'rest' ? false : note.tieStop,
                        lyric: e.target.value === 'rest' ? '' : note.lyric
                      })
                    }
                  >
                    <option value="note">{t('score.note')}</option>
                    <option value="rest">{t('score.rest')}</option>
                  </select>
                </div>
                <div className="field">
                  <label>{t('score.note')}</label>
                  <input
                    aria-label={t('score.note')}
                    key={`${note.id}-${note.midi}-${note.note}-${note.octave}-${note.isRest ? 'rest' : 'note'}`}
                    defaultValue={note.isRest ? t('score.rest') : `${note.note}${note.octave}`}
                    disabled={Boolean(note.isRest)}
                    onBlur={(e) => changeNoteLabel(note.id, e.target.value)}
                  />
                </div>
                <div className="field">
                  <label>{t('score.start')}</label>
                  <input
                    aria-label={t('score.start')}
                    type="number"
                    min="0"
                    step="0.05"
                    value={note.start}
                    onChange={(e) => updateNote(note.id, { start: Math.max(0, Number(e.target.value)) })}
                  />
                </div>
                <div className="field">
                  <label>{t('score.duration')}</label>
                  <input
                    aria-label={t('score.duration')}
                    type="number"
                    min="0.05"
                    step="0.05"
                    value={note.duration}
                    onChange={(e) => updateNote(note.id, { duration: Math.max(0.05, Number(e.target.value)) })}
                  />
                </div>
                <div className="field">
                  <label>{t('score.velocity')}</label>
                  <input
                    aria-label={t('score.velocity')}
                    type="number"
                    min="1"
                    max="127"
                    value={note.velocity}
                    disabled={Boolean(note.isRest)}
                    onChange={(e) =>
                      updateNote(note.id, { velocity: Math.max(1, Math.min(127, Number(e.target.value))) })
                    }
                  />
                </div>
                <div className="field">
                  <label>{t('score.tie')}</label>
                  <select
                    aria-label={t('score.tie')}
                    disabled={Boolean(note.isRest)}
                    value={`${note.tieStop ? 'stop' : ''}${note.tieStart ? 'start' : ''}`}
                    onChange={(e) =>
                      updateNote(note.id, {
                        tieStart: e.target.value.includes('start'),
                        tieStop: e.target.value.includes('stop')
                      })
                    }
                  >
                    <option value="">{t('score.none')}</option>
                    <option value="start">{t('score.tieStart')}</option>
                    <option value="stop">{t('score.tieStop')}</option>
                    <option value="stopstart">{t('score.tieContinue')}</option>
                  </select>
                </div>
                <div className="field note-lyric">
                  <label>{t('score.lyric')}</label>
                  <input
                    aria-label={t('score.lyric')}
                    value={note.lyric || ''}
                    disabled={Boolean(note.isRest)}
                    onChange={(e) => updateNote(note.id, { lyric: e.target.value })}
                  />
                </div>
                <div className="note-actions">
                  <button className="mini-button" onClick={() => duplicateNote(note.id)}>
                    {t('score.copy')}
                  </button>
                  <button className="mini-button" onClick={() => splitNote(note.id)}>
                    {t('score.split')}
                  </button>
                  <button className="mini-button" onClick={() => mergeNext(note.id)}>
                    {t('score.merge')}
                  </button>
                  <button className="icon-button" onClick={() => removeNote(note.id)} aria-label={t('common.delete')}>
                    <Icon name="trash" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">{t('score.empty')}</div>
          )}
        </aside>
        <section className="card score-preview-card score-preview-pane">
          <div className="card-title">
            <h2>{t('score.preview')}</h2>
            <span className="badge">{score.notes.length} events</span>
          </div>
          <ScoreViewport svg={svg} label={t('score.preview')} />
        </section>
      </div>
    </div>
  );
}
