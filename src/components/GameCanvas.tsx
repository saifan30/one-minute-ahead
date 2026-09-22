import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from '../game/engine';
import { GameTelemetry, InputState } from '../types/game';
import { StatusOverlay } from './StatusOverlay';

interface GameCanvasProps {
  onTelemetryUpdate: (telemetry: GameTelemetry) => void;
  engineRef: React.MutableRefObject<GameEngine | null>;
  onToggleMute?: () => void;
  onNextSector?: () => void;
  onShowVictory?: () => void;
  onOpenHowToPlay?: () => void;
  onOpenControls?: () => void;
  onReturnToTitle?: () => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  onTelemetryUpdate,
  engineRef,
  onToggleMute,
  onNextSector,
  onShowVictory,
  onOpenHowToPlay,
  onOpenControls,
  onReturnToTitle,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentTelemetry, setCurrentTelemetry] = useState<GameTelemetry | null>(null);

  const handleTelemetry = useCallback(
    (telemetry: GameTelemetry) => {
      setCurrentTelemetry(telemetry);
      onTelemetryUpdate(telemetry);
    },
    [onTelemetryUpdate]
  );

  // Initialize GameEngine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new GameEngine(canvas, handleTelemetry);
    engineRef.current = engine;
    engine.start();

    // Keyboard event listeners
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      const key = e.key.toLowerCase();
      if (key === 'w' || key === 'arrowup') engine.setInput({ up: true });
      if (key === 's' || key === 'arrowdown') engine.setInput({ down: true });
      if (key === 'a' || key === 'arrowleft') engine.setInput({ left: true });
      if (key === 'd' || key === 'arrowright') engine.setInput({ right: true });
      if (key === 'e') engine.setInput({ interact: true });
      if (key === ' ' || key === 'f' || key === 't') {
        engine.togglePreview();
      }
      if (key === 'c') engine.clearCourseWaypoint();
      if (key === 'r') engine.restart();
      if (key === 'p' || key === 'escape') engine.togglePause();
      if (key === 'm') onToggleMute?.();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === 'w' || key === 'arrowup') engine.setInput({ up: false });
      if (key === 's' || key === 'arrowdown') engine.setInput({ down: false });
      if (key === 'a' || key === 'arrowleft') engine.setInput({ left: false });
      if (key === 'd' || key === 'arrowright') engine.setInput({ right: false });
      if (key === 'e') engine.setInput({ interact: false });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      engine.stop();
      engineRef.current = null;
    };
  }, [handleTelemetry, engineRef]);

  // ResizeObserver on canvas container for responsive resolution
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0 && engineRef.current) {
          engineRef.current.resize(width, height);
        }
      }
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [engineRef]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !engineRef.current) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    engineRef.current.setWaypointFromCanvasCoords(x, y);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[380px] bg-[#070a0f] border border-cyan-950/80 rounded-lg overflow-hidden shadow-2xl flex items-center justify-center"
    >
      <canvas
        id="game-viewport-canvas"
        ref={canvasRef}
        onClick={handleCanvasClick}
        className="w-full h-full block focus:outline-none cursor-crosshair"
        tabIndex={0}
      />

      {/* Sci-Fi Viewport HUD Overlays & Coordinate Reticles */}
      <div className="absolute top-2 left-2 pointer-events-none text-[10px] font-mono text-cyan-500/70 select-none">
        [VIEWPORT_CANVAS: 840x540]
      </div>
      <div className="absolute top-2 right-2 pointer-events-none text-[10px] font-mono text-cyan-500/70 select-none">
        SEC: CHRONO_01
      </div>
      <div className="absolute bottom-2 left-2 pointer-events-none text-[10px] font-mono text-slate-500 select-none">
        COLLISION_ENGINE: ACTIVE
      </div>

      {/* State Overlay (Pause / Sector Clear) */}
      <StatusOverlay
        status={currentTelemetry?.status ?? 'RUNNING'}
        telemetry={currentTelemetry}
        onResume={() => engineRef.current?.resume()}
        onRestart={() => engineRef.current?.restart()}
        onNextSector={onNextSector}
        onShowVictory={onShowVictory}
        onOpenHowToPlay={onOpenHowToPlay}
        onOpenControls={onOpenControls}
        onReturnToTitle={onReturnToTitle}
      />
    </div>
  );
};
