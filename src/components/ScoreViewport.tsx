import { useState } from 'react';

interface ScoreViewportProps {
  svg: string;
  label?: string;
  compact?: boolean;
}

export function ScoreViewport({ svg, label = 'Score preview', compact = false }: ScoreViewportProps) {
  const [zoom, setZoom] = useState(100);
  const changeZoom = (delta: number) => setZoom((value) => Math.max(70, Math.min(180, value + delta)));

  return (
    <div className={`score-viewport ${compact ? 'compact' : ''}`}>
      <div className="score-viewport-controls" aria-label={`${label} zoom controls`}>
        <button className="mini-button score-zoom-button" onClick={() => changeZoom(-10)} aria-label="Zoom out">
          −
        </button>
        <button className="mini-button score-zoom-value" onClick={() => setZoom(100)} aria-label="Reset score zoom">
          {zoom}%
        </button>
        <button className="mini-button score-zoom-button" onClick={() => changeZoom(10)} aria-label="Zoom in">
          +
        </button>
      </div>
      <div className="score-svg-wrap score-viewport-scroll" aria-label={label}>
        <div
          className="score-viewport-canvas"
          style={{ width: `${zoom}%` }}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </div>
    </div>
  );
}
