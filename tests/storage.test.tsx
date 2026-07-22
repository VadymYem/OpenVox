import { describe, expect, it } from 'vitest';
import type { AppSettings, OpenVoxProject, RecordingEntry, TrainingSessionEntry } from '../src/types';
import {
  deleteProject,
  getProject,
  listProjects,
  listRecordings,
  listTrainingSessions,
  loadSettings,
  saveProject,
  saveRecording,
  saveSettings,
  saveTrainingSession
} from '../src/core/storage/database';

function project(id: string, updatedAt: number): OpenVoxProject {
  return {
    id,
    name: `Project ${id}`,
    createdAt: updatedAt - 10,
    updatedAt,
    pitchHistory: [],
    settings: { processingMode: 'vocal', noiseFloor: 0.008, gateMultiplier: 1.8, referenceA4: 440 },
    score: {
      id: `score-${id}`,
      title: 'Test',
      composer: 'AuthorChe',
      tempo: 90,
      timeSignature: [4, 4],
      keyFifths: 0,
      notes: [],
      createdAt: updatedAt - 10,
      updatedAt
    }
  };
}

describe('local IndexedDB storage', () => {
  it('persists settings and sorts projects by last update', async () => {
    const settings: AppSettings = {
      language: 'uk',
      theme: 'dark',
      referenceA4: 442,
      processingMode: 'noisy',
      gateMultiplier: 2.5,
      microphoneId: 'test-mic',
      analyticsEnabled: false,
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
      accessibility: { reducedMotion: false, highContrast: false, largeControls: false }
    };
    await saveSettings(settings);
    await saveProject(project('older', 100));
    await saveProject(project('newer', 200));

    expect(await loadSettings()).toEqual(settings);
    expect((await listProjects()).map((item) => item.id)).toEqual(['newer', 'older']);
    expect((await getProject('newer'))?.name).toBe('Project newer');
  });

  it('deletes recordings together with their project', async () => {
    const current = project('with-recording', 300);
    const recording: RecordingEntry = {
      id: 'rec-1',
      projectId: current.id,
      name: 'Take 1.webm',
      mimeType: 'audio/webm',
      blob: new Blob(['voice'], { type: 'audio/webm' }),
      duration: 2,
      createdAt: 300
    };

    await saveProject(current);
    await saveRecording(recording);
    expect(await listRecordings(current.id)).toHaveLength(1);

    await deleteProject(current.id);
    expect(await getProject(current.id)).toBeUndefined();
    expect(await listRecordings(current.id)).toHaveLength(0);
  });

  it('persists training sessions and removes them with a project', async () => {
    const current = project('training-project', 400);
    const session: TrainingSessionEntry = {
      id: 'session-1',
      projectId: current.id,
      exerciseId: 'pitch-match',
      exerciseName: 'Pitch match',
      category: 'pitch',
      difficulty: 'beginner',
      startedAt: 400,
      completedAt: 460,
      durationSeconds: 60,
      accuracy: 92,
      hitRate: 88,
      averageCents: 8.5
    };
    await saveProject(current);
    await saveTrainingSession(session);
    expect((await listTrainingSessions(current.id)).map((item) => item.id)).toEqual(['session-1']);
    await deleteProject(current.id);
    expect(await listTrainingSessions(current.id)).toHaveLength(0);
  });
});
