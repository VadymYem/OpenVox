import type { AppSettings, OpenVoxProject, PracticeGoal, RecordingEntry, TrainingSessionEntry } from '../../types';
import { synchronizeNotePitch } from '../music/notes';

const DB_NAME = 'openvox-studio';
const DB_VERSION = 2;
const PROJECTS = 'projects';
const RECORDINGS = 'recordings';
const SETTINGS = 'settings';
const SESSIONS = 'trainingSessions';
const GOALS = 'practiceGoals';

function normalizeProjectPitchData(project: OpenVoxProject): OpenVoxProject {
  return {
    ...project,
    score: {
      ...project.score,
      notes: project.score.notes.map(synchronizeNotePitch)
    }
  };
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(PROJECTS)) db.createObjectStore(PROJECTS, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(RECORDINGS)) {
        const store = db.createObjectStore(RECORDINGS, { keyPath: 'id' });
        store.createIndex('projectId', 'projectId', { unique: false });
      }
      if (!db.objectStoreNames.contains(SETTINGS)) db.createObjectStore(SETTINGS, { keyPath: 'key' });
      if (!db.objectStoreNames.contains(SESSIONS)) {
        const store = db.createObjectStore(SESSIONS, { keyPath: 'id' });
        store.createIndex('projectId', 'projectId', { unique: false });
        store.createIndex('startedAt', 'startedAt', { unique: false });
        store.createIndex('category', 'category', { unique: false });
      }
      if (!db.objectStoreNames.contains(GOALS)) db.createObjectStore(GOALS, { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Unable to open local database.'));
  });
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Local database operation failed.'));
  });
}

function transactionDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error('Local database transaction failed.'));
    tx.onabort = () => reject(tx.error || new Error('Local database transaction was aborted.'));
  });
}

export async function saveProject(project: OpenVoxProject): Promise<void> {
  const db = await openDatabase();
  const tx = db.transaction(PROJECTS, 'readwrite');
  tx.objectStore(PROJECTS).put(normalizeProjectPitchData(project));
  await transactionDone(tx);
  db.close();
}

export async function getProject(id: string): Promise<OpenVoxProject | undefined> {
  const db = await openDatabase();
  const tx = db.transaction(PROJECTS, 'readonly');
  const result = await requestToPromise<OpenVoxProject | undefined>(tx.objectStore(PROJECTS).get(id));
  db.close();
  return result ? normalizeProjectPitchData(result) : undefined;
}

export async function listProjects(): Promise<OpenVoxProject[]> {
  const db = await openDatabase();
  const tx = db.transaction(PROJECTS, 'readonly');
  const result = await requestToPromise<OpenVoxProject[]>(tx.objectStore(PROJECTS).getAll());
  db.close();
  return result.map(normalizeProjectPitchData).sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function deleteProject(id: string): Promise<void> {
  const db = await openDatabase();
  const tx = db.transaction([PROJECTS, RECORDINGS, SESSIONS], 'readwrite');
  tx.objectStore(PROJECTS).delete(id);
  const recordings = tx.objectStore(RECORDINGS).index('projectId');
  const recordingKeys = await requestToPromise<IDBValidKey[]>(recordings.getAllKeys(id));
  recordingKeys.forEach((key) => tx.objectStore(RECORDINGS).delete(key));
  const sessions = tx.objectStore(SESSIONS).index('projectId');
  const sessionKeys = await requestToPromise<IDBValidKey[]>(sessions.getAllKeys(id));
  sessionKeys.forEach((key) => tx.objectStore(SESSIONS).delete(key));
  await transactionDone(tx);
  db.close();
}

export async function saveRecording(recording: RecordingEntry): Promise<void> {
  const db = await openDatabase();
  const tx = db.transaction(RECORDINGS, 'readwrite');
  tx.objectStore(RECORDINGS).put(recording);
  await transactionDone(tx);
  db.close();
}
export async function deleteRecording(id: string): Promise<void> {
  const db = await openDatabase();
  const tx = db.transaction(RECORDINGS, 'readwrite');
  tx.objectStore(RECORDINGS).delete(id);
  await transactionDone(tx);
  db.close();
}
export async function listRecordings(projectId: string): Promise<RecordingEntry[]> {
  const db = await openDatabase();
  const tx = db.transaction(RECORDINGS, 'readonly');
  const result = await requestToPromise<RecordingEntry[]>(
    tx.objectStore(RECORDINGS).index('projectId').getAll(projectId)
  );
  db.close();
  return result.sort((a, b) => b.createdAt - a.createdAt);
}

export async function saveTrainingSession(session: TrainingSessionEntry): Promise<void> {
  const db = await openDatabase();
  const tx = db.transaction(SESSIONS, 'readwrite');
  tx.objectStore(SESSIONS).put(session);
  await transactionDone(tx);
  db.close();
}
export async function listTrainingSessions(projectId?: string): Promise<TrainingSessionEntry[]> {
  const db = await openDatabase();
  const tx = db.transaction(SESSIONS, 'readonly');
  const store = tx.objectStore(SESSIONS);
  const result = projectId
    ? await requestToPromise<TrainingSessionEntry[]>(store.index('projectId').getAll(projectId))
    : await requestToPromise<TrainingSessionEntry[]>(store.getAll());
  db.close();
  return result.sort((a, b) => b.startedAt - a.startedAt);
}
export async function deleteTrainingSession(id: string): Promise<void> {
  const db = await openDatabase();
  const tx = db.transaction(SESSIONS, 'readwrite');
  tx.objectStore(SESSIONS).delete(id);
  await transactionDone(tx);
  db.close();
}

export async function savePracticeGoal(goal: PracticeGoal): Promise<void> {
  const db = await openDatabase();
  const tx = db.transaction(GOALS, 'readwrite');
  tx.objectStore(GOALS).put(goal);
  await transactionDone(tx);
  db.close();
}
export async function listPracticeGoals(): Promise<PracticeGoal[]> {
  const db = await openDatabase();
  const tx = db.transaction(GOALS, 'readonly');
  const result = await requestToPromise<PracticeGoal[]>(tx.objectStore(GOALS).getAll());
  db.close();
  return result.sort((a, b) => b.createdAt - a.createdAt);
}
export async function deletePracticeGoal(id: string): Promise<void> {
  const db = await openDatabase();
  const tx = db.transaction(GOALS, 'readwrite');
  tx.objectStore(GOALS).delete(id);
  await transactionDone(tx);
  db.close();
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  const db = await openDatabase();
  const tx = db.transaction(SETTINGS, 'readwrite');
  tx.objectStore(SETTINGS).put({ key: 'app', value: settings });
  await transactionDone(tx);
  db.close();
}
export async function loadSettings(): Promise<AppSettings | undefined> {
  const db = await openDatabase();
  const tx = db.transaction(SETTINGS, 'readonly');
  const result = await requestToPromise<{ key: string; value: AppSettings } | undefined>(
    tx.objectStore(SETTINGS).get('app')
  );
  db.close();
  return result?.value;
}
