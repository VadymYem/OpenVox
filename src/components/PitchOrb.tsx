import type { PitchFrame } from '../types';

export function PitchOrb({ pitch, level, active }: { pitch: PitchFrame | null; level: number; active: boolean }) {
  const cents = pitch?.cents || 0;
  const hueShift = Math.min(1, Math.abs(cents) / 50);
  const scale = 1 + Math.min(0.18, level * 1.8);
  return (
    <div className={`pitch-orb-wrap ${active ? 'active' : ''}`}>
      <div className="pitch-orb-ring ring-a" style={{ transform: `scale(${scale})` }} />
      <div className="pitch-orb-ring ring-b" style={{ transform: `scale(${1 + level}) rotate(${cents * 0.35}deg)` }} />
      <div
        className="pitch-orb"
        style={{ '--level': String(level), '--error': String(hueShift) } as React.CSSProperties}
      >
        <span className="pitch-note">{pitch ? `${pitch.note}${pitch.octave}` : '—'}</span>
        <span className="pitch-cents">
          {pitch ? `${pitch.cents > 0 ? '+' : ''}${pitch.cents} cents` : active ? 'listening' : 'offline'}
        </span>
      </div>
    </div>
  );
}
