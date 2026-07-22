import type { ScoreDocument } from '../../types';
import { parseMusicXml } from './musicXmlParser';

export function importMusicXml(text: string): ScoreDocument {
  const parsed = parseMusicXml(text);
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    title: parsed.title,
    composer: parsed.composer,
    tempo: parsed.tempo,
    timeSignature: parsed.timeSignature,
    keyFifths: parsed.keyFifths,
    notes: parsed.parts[0].notes,
    createdAt: now,
    updatedAt: now
  };
}
