import { useRef, useState, type MouseEvent, type PointerEvent as ReactPointerEvent } from 'react';

export interface ScoreStaffPointer {
  measureIndex: number;
  systemIndex: number;
  x: number;
  y: number;
  measureX: number;
  measureWidth: number;
  staffTop: number;
  beatInMeasure: number;
  shiftKey: boolean;
}

interface ScoreViewportProps {
  svg: string;
  label?: string;
  compact?: boolean;
  onEventSelect?: (eventId: string) => void;
  onEventMove?: (eventId: string, point: ScoreStaffPointer) => void;
  onStaffPointer?: (point: ScoreStaffPointer) => void;
}

interface DragState {
  eventId: string;
  pointerId: number;
  startX: number;
  startY: number;
}

export function ScoreViewport({
  svg,
  label = 'Score preview',
  compact = false,
  onEventSelect,
  onEventMove,
  onStaffPointer
}: ScoreViewportProps) {
  const [zoom, setZoom] = useState(100);
  const dragRef = useRef<DragState | null>(null);
  const suppressClickRef = useRef(false);
  const changeZoom = (delta: number) => setZoom((value) => Math.max(60, Math.min(220, value + delta)));

  const resolveStaffPoint = (
    clientX: number,
    clientY: number,
    shiftKey: boolean,
    target: Element
  ): ScoreStaffPointer | null => {
    // Pointer capture makes pointerup target the canvas rather than the SVG
    // element that initiated the drag. Fall back to the SVG owned by the
    // current score canvas so drag-and-drop works consistently on touch,
    // stylus and mouse.
    const svgElement =
      (target.closest('svg') as SVGSVGElement | null) ||
      (target.closest('.score-viewport-canvas')?.querySelector('svg') as SVGSVGElement | null);
    const matrix = svgElement?.getScreenCTM();
    if (!svgElement || !matrix) return null;
    const point = svgElement.createSVGPoint();
    point.x = clientX;
    point.y = clientY;
    const local = point.matrixTransform(matrix.inverse());

    const hitboxes = Array.from(svgElement.querySelectorAll<SVGGraphicsElement>('[data-score-hitbox="true"]'));
    const hitbox = hitboxes.find((candidate) => {
      const measureX = Number(candidate.dataset.measureX || 0);
      const measureWidth = Number(candidate.dataset.measureWidth || 0);
      const staffTop = Number(candidate.dataset.staffTop || 0);
      return (
        local.x >= measureX &&
        local.x <= measureX + measureWidth &&
        local.y >= staffTop - 42 &&
        local.y <= staffTop + 92
      );
    });
    if (!hitbox) return null;

    const measureX = Number(hitbox.dataset.measureX || 0);
    const measureWidth = Number(hitbox.dataset.measureWidth || 1);
    const innerRatio = Math.max(0, Math.min(1, (local.x - measureX - 18) / Math.max(24, measureWidth - 36)));
    const anchors = (hitbox.dataset.beatAnchors || '0,4').split(',').map(Number);
    const positions = (hitbox.dataset.beatPositions || '0,1').split(',').map(Number);
    let beatInMeasure = anchors[0] || 0;
    if (anchors.length === positions.length && anchors.length >= 2) {
      for (let index = 0; index < positions.length - 1; index += 1) {
        const startPosition = positions[index];
        const endPosition = positions[index + 1];
        if (innerRatio <= endPosition + 0.000001) {
          const ratio = endPosition - startPosition <= 0.000001 ? 0 : (innerRatio - startPosition) / (endPosition - startPosition);
          beatInMeasure = anchors[index] + Math.max(0, Math.min(1, ratio)) * (anchors[index + 1] - anchors[index]);
          break;
        }
      }
    }

    return {
      measureIndex: Number(hitbox.dataset.measureIndex || 0),
      systemIndex: Number(hitbox.dataset.systemIndex || 0),
      x: local.x,
      y: local.y,
      measureX,
      measureWidth,
      staffTop: Number(hitbox.dataset.staffTop || 0),
      beatInMeasure,
      shiftKey
    };
  };

  const handleScoreClick = (event: MouseEvent<HTMLDivElement>) => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    const target = event.target as Element;
    const eventElement = target.closest('[data-event-id]');
    const eventId = eventElement?.getAttribute('data-event-id');
    if (eventId && onEventSelect) {
      onEventSelect(eventId);
      return;
    }

    if (!onStaffPointer) return;
    const point = resolveStaffPoint(event.clientX, event.clientY, event.shiftKey, target);
    if (point) onStaffPointer(point);
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!onEventMove) return;
    const target = event.target as Element;
    const eventId = target.closest('[data-event-id]')?.getAttribute('data-event-id');
    if (!eventId) return;
    dragRef.current = {
      eventId,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
    onEventSelect?.(eventId);
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId || !onEventMove) return;
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    const distance = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY);
    if (distance < 5) return;
    const point = resolveStaffPoint(event.clientX, event.clientY, event.shiftKey, event.target as Element);
    if (!point) return;
    suppressClickRef.current = true;
    onEventMove(drag.eventId, point);
  };

  const handlePointerCancel = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId === event.pointerId) dragRef.current = null;
  };

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
          onClick={handleScoreClick}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </div>
    </div>
  );
}
