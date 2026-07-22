import { useEffect, useRef } from 'react';
import type { PitchFrame } from '../types';

export function PitchHistory({ frames }: { frames: PitchFrame[] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.floor(rect.width * ratio));
    canvas.height = Math.max(1, Math.floor(rect.height * ratio));
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(ratio, ratio);
    const width = rect.width;
    const height = rect.height;
    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = 'rgba(200,169,110,.12)';
    ctx.lineWidth = 1;
    for (let y = 20; y < height; y += 28) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    if (frames.length < 2) return;
    const recent = frames.slice(-220);
    const midis = recent.map((frame) => frame.midi);
    const min = Math.floor(Math.min(...midis)) - 1;
    const max = Math.ceil(Math.max(...midis)) + 1;
    const range = Math.max(4, max - min);
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, '#c8a96e');
    gradient.addColorStop(0.5, '#e8d0a0');
    gradient.addColorStop(1, '#9b6eec');
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    recent.forEach((frame, index) => {
      const x = (index / Math.max(1, recent.length - 1)) * width;
      const y = height - ((frame.midi - min) / range) * height;
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }, [frames]);
  return <canvas className="pitch-history" ref={ref} />;
}
