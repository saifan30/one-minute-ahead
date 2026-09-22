import React from 'react';
import { GameTelemetry } from '../types/game';
import {
  RotateCcw,
  Pause,
  Play,
  Volume2,
  VolumeX,
  Zap,
  Compass,
  Activity,
  Clock,
  HelpCircle,
  Keyboard,
  Home,
} from 'lucide-react';

interface HUDProps {
  telemetry: GameTelemetry | null;
  onRestart: () => void;
  onTogglePause: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onTogglePreview: () => void;
  onSelectSector?: (sectorId: string) => void;
  onOpenHowToPlay?: () => void;
  onOpenControls?: () => void;
  onReturnToTitle?: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  telemetry,
  onRestart,
  onTogglePause,
  isMuted,
  onToggleMute,
  onTogglePreview,
  onSelectSector,
  onOpenHowToPlay,
  onOpenControls,
  onReturnToTitle,
}) => {
  const elapsed = telemetry?.elapsedSeconds ?? 0;
  const minutes = Math.floor(elapsed / 60);
  const seconds = Math.floor(elapsed % 60);
  const centiseconds = Math.floor((elapsed * 100) % 100);

  const formattedTime = `T+ ${minutes.toString().padStart(2, '0')}:${seconds
    .toString()
    .padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;

  const isPaused = telemetry?.status === 'PAUSED';
  const isPreviewActive = telemetry?.isPreviewActive ?? true;
  const activeSectorId = telemetry?.activeSectorId ?? 'SEC-01';

  return (
    <header className="w-full bg-[#0b0f17]/95 border-b border-cyan-950/60 px-4 py-2.5 select-none backdrop-blur z-20">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Title & Sector Tabs */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#00f0ff]" />
            <h1 className="text-sm md:text-base font-bold tracking-widest text-slate-100 uppercase">
              ONE MINUTE AHEAD
            </h1>
          </div>

          {/* Sector Selector Tabs */}
          {onSelectSector && (
            <div className="flex items-center bg-[#06090e] border border-cyan-900/60 rounded p-0.5 text-[10px] font-mono">
              <button
                id="btn-hud-sector-1"
                onClick={() => onSelectSector('SEC-01')}
                className={`px-2 py-0.5 rounded transition cursor-pointer ${
                  activeSectorId === 'SEC-01'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/60 shadow-[0_0_8px_rgba(0,240,255,0.2)]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                SEC-01: CALIBRATION
              </button>
              <button
                id="btn-hud-sector-2"
                onClick={() => onSelectSector('SEC-02')}
                className={`px-2 py-0.5 rounded transition cursor-pointer ${
                  activeSectorId === 'SEC-02'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/60 shadow-[0_0_8px_rgba(0,240,255,0.2)]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                SEC-02: FUTURE GATE
              </button>
              <button
                id="btn-hud-sector-3"
                onClick={() => onSelectSector('SEC-03')}
                className={`px-2 py-0.5 rounded transition cursor-pointer ${
                  activeSectorId === 'SEC-03'
                    ? 'bg-purple-950 text-purple-300 border border-purple-700/60 shadow-[0_0_8px_rgba(192,132,252,0.25)]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                SEC-03: CASCADE
              </button>
              <button
                id="btn-hud-sector-4"
                onClick={() => onSelectSector('SEC-04')}
                className={`px-2 py-0.5 rounded transition cursor-pointer ${
                  activeSectorId === 'SEC-04'
                    ? 'bg-rose-950 text-rose-300 border border-rose-600/70 shadow-[0_0_8px_rgba(244,63,94,0.3)]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                SEC-04: TEMPORAL LOCK
              </button>
            </div>
          )}
        </div>

        {/* Real-time Telemetry Counters */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-[#06090e] border border-cyan-900/50 rounded-md px-3 py-1 font-mono text-xs">
            <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="text-cyan-300 font-semibold tracking-wider">{formattedTime}</span>
          </div>

          <div className="hidden lg:flex items-center gap-3 text-[11px] font-mono text-slate-400">
            {activeSectorId === 'SEC-01' ? (
              <div className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-emerald-400" />
                <span>
                  CONDUITS: {telemetry?.activeNodesCount ?? 0}/{telemetry?.totalNodesCount ?? 2}
                </span>
              </div>
            ) : activeSectorId === 'SEC-04' ? (
              <div className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-rose-400" />
                <span>
                  TEMPORAL LOCK:{' '}
                  {telemetry?.futureState.lockAnalysis?.allSatisfied
                    ? 'T+60s [UNLOCKED]'
                    : telemetry?.futureState.gateAnalysis?.futureIsOpen
                    ? 'T+60s [APERTURE OPEN]'
                    : 'T+60s [LOCKED]'}
                </span>
              </div>
            ) : activeSectorId === 'SEC-03' ? (
              <div className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-purple-400" />
                <span>
                  CASCADE GATE:{' '}
                  {telemetry?.futureState.gateAnalysis?.futureIsOpen
                    ? 'T+60s [OPEN]'
                    : 'T+60s [CLOSED]'}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-cyan-400" />
                <span>
                  FUTURE GATE:{' '}
                  {telemetry?.futureState.gateAnalysis?.futureIsOpen
                    ? 'T+60s [OPEN]'
                    : 'T+60s [CLOSED]'}
                </span>
              </div>
            )}
            <span className="text-slate-600">|</span>
            <div className="flex items-center gap-1">
              <Compass className="w-3 h-3 text-sky-400" />
              <span>
                POS: {telemetry?.playerPos.x ?? 0}, {telemetry?.playerPos.y ?? 0}
              </span>
            </div>
            <span className="text-slate-600">|</span>
            <div className="flex items-center gap-1">
              <span className="text-slate-400">FPS:</span>
              <span className="text-cyan-400">{telemetry?.fps ?? 60}</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Temporal Preview Toggle Button */}
          <button
            id="btn-hud-toggle-preview"
            onClick={onTogglePreview}
            title={
              isPreviewActive
                ? 'Deactivate Temporal Preview [SPACE]'
                : 'Activate Temporal Preview [SPACE]'
            }
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded transition active:scale-95 cursor-pointer border ${
              isPreviewActive
                ? 'bg-cyan-950/90 text-cyan-300 border-cyan-500 shadow-[0_0_12px_rgba(0,240,255,0.25)]'
                : 'bg-slate-900/80 text-slate-400 border-slate-700/60 hover:text-slate-200'
            }`}
          >
            <Clock
              className={`w-3.5 h-3.5 ${
                isPreviewActive ? 'text-cyan-400 animate-pulse' : 'text-slate-500'
              }`}
            />
            <span className="hidden sm:inline">
              {isPreviewActive ? 'T+60s PREVIEW: ON' : 'T+60s PREVIEW: OFF'}
            </span>
            <span className="sm:hidden">
              {isPreviewActive ? '+60s ON' : '+60s OFF'}
            </span>
            <kbd className="text-[9px] px-1 py-0.2 bg-slate-800 rounded text-slate-300 border border-slate-700">
              SPACE
            </kbd>
          </button>

          <button
            id="btn-restart"
            onClick={onRestart}
            title="Restart Sector [R]"
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono text-slate-300 bg-slate-900/80 hover:bg-cyan-950/70 border border-slate-700/60 hover:border-cyan-500/50 rounded transition active:scale-95 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">RESET</span>
            <kbd className="text-[9px] px-1 py-0.2 bg-slate-800 rounded text-slate-400 border border-slate-700">
              R
            </kbd>
          </button>

          <button
            id="btn-pause"
            onClick={onTogglePause}
            title={isPaused ? 'Resume [P]' : 'Pause [P]'}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono text-slate-300 bg-slate-900/80 hover:bg-cyan-950/70 border border-slate-700/60 hover:border-cyan-500/50 rounded transition active:scale-95 cursor-pointer"
          >
            {isPaused ? (
              <>
                <Play className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">RESUME</span>
              </>
            ) : (
              <>
                <Pause className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">PAUSE</span>
              </>
            )}
            <kbd className="text-[9px] px-1 py-0.2 bg-slate-800 rounded text-slate-400 border border-slate-700">
              P
            </kbd>
          </button>

          {onOpenHowToPlay && (
            <button
              id="btn-hud-how-to-play"
              onClick={onOpenHowToPlay}
              title="How to Play"
              className="p-1.5 text-slate-400 hover:text-cyan-300 bg-slate-900/80 border border-slate-700/60 hover:border-cyan-500/50 rounded transition cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-cyan-400" />
            </button>
          )}

          {onOpenControls && (
            <button
              id="btn-hud-controls"
              onClick={onOpenControls}
              title="Controls"
              className="hidden sm:flex p-1.5 text-slate-400 hover:text-cyan-300 bg-slate-900/80 border border-slate-700/60 hover:border-cyan-500/50 rounded transition cursor-pointer"
            >
              <Keyboard className="w-4 h-4 text-cyan-400" />
            </button>
          )}

          {onReturnToTitle && (
            <button
              id="btn-hud-title"
              onClick={onReturnToTitle}
              title="Return to Title"
              className="p-1.5 text-slate-400 hover:text-cyan-300 bg-slate-900/80 border border-slate-700/60 hover:border-cyan-500/50 rounded transition cursor-pointer"
            >
              <Home className="w-4 h-4 text-slate-300" />
            </button>
          )}

          <button
            id="btn-audio"
            onClick={onToggleMute}
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            className="p-1.5 text-slate-400 hover:text-cyan-300 bg-slate-900/80 border border-slate-700/60 hover:border-cyan-500/50 rounded transition cursor-pointer"
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-cyan-400" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
