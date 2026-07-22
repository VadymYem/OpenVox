import type { OpenVoxProject, RecordingEntry } from '../../types';
import { downloadBlob } from '../export/scoreExport';
import { notifySupportOpportunity } from '../support';
import { synchronizeNotePitch } from '../music/notes';

interface OpenVoxArchive {
  format: 'OpenVoxProject';
  version: 1;
  exportedAt: string;
  project: OpenVoxProject;
  recordings: Array<{
    id: string;
    projectId: string;
    name: string;
    mimeType: string;
    duration: number;
    createdAt: number;
    dataUrl: string;
  }>;
}

export async function exportOpenVoxProject(project: OpenVoxProject, recordings: RecordingEntry[]): Promise<void> {
  const archivedRecordings = await Promise.all(
    recordings.map(async (recording) => ({
      id: recording.id,
      projectId: recording.projectId,
      name: recording.name,
      mimeType: recording.mimeType,
      duration: recording.duration,
      createdAt: recording.createdAt,
      dataUrl: await blobToDataUrl(recording.blob)
    }))
  );
  const archive: OpenVoxArchive = {
    format: 'OpenVoxProject',
    version: 1,
    exportedAt: new Date().toISOString(),
    project,
    recordings: archivedRecordings
  };
  downloadBlob(
    new Blob([JSON.stringify(archive)], { type: 'application/vnd.openvox.project+json' }),
    `${safeName(project.name)}.openvox`
  );
}

export async function importOpenVoxProject(
  file: File
): Promise<{ project: OpenVoxProject; recordings: RecordingEntry[] }> {
  const text = await file.text();
  const archive = JSON.parse(text) as OpenVoxArchive;
  if (archive.format !== 'OpenVoxProject' || archive.version !== 1 || !archive.project)
    throw new Error('Unsupported OpenVox project file.');
  const recordings = await Promise.all(
    (archive.recordings || []).map(async (recording) => ({
      id: recording.id,
      projectId: archive.project.id,
      name: recording.name,
      mimeType: recording.mimeType,
      duration: recording.duration,
      createdAt: recording.createdAt,
      blob: await (await fetch(recording.dataUrl)).blob()
    }))
  );
  const project = {
    ...archive.project,
    score: {
      ...archive.project.score,
      notes: archive.project.score.notes.map(synchronizeNotePitch)
    }
  };
  return { project, recordings };
}

export async function saveBlobToDevice(blob: Blob, suggestedName: string, mimeType: string): Promise<void> {
  const picker = (window as Window & { showSaveFilePicker?: (options: unknown) => Promise<FileSystemFileHandle> })
    .showSaveFilePicker;
  if (picker) {
    const extension = suggestedName.includes('.') ? `.${suggestedName.split('.').pop()}` : '';
    const handle = await picker({
      suggestedName,
      types: [
        {
          description: 'OpenVox media',
          accept: { [mimeType || 'application/octet-stream']: extension ? [extension] : [] }
        }
      ]
    });
    const writable = await handle.createWritable();
    await writable.write(blob);
    await writable.close();
    notifySupportOpportunity();
    return;
  }
  downloadBlob(blob, suggestedName);
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error || new Error('Unable to read recording.'));
    reader.readAsDataURL(blob);
  });
}

function safeName(value: string): string {
  return (
    value
      .trim()
      .replace(/[^a-z0-9а-яіїєґäöüß_-]+/gi, '_')
      .replace(/^_+|_+$/g, '') || 'OpenVox_Project'
  );
}
