import React from 'react';
import { GameStatus, GameTelemetry } from '../types/game';
import {
  Play,
  RotateCcw,
  ShieldCheck,
  ArrowRight,
  HelpCircle,
  Keyboard,
  Home,
  Trophy,
} from 'lucide-react';

interface StatusOverlayProps {
  status: GameStatus;
  telemetry: GameTelemetry | null;
  onResume: () => void;
  onRestart: () => void;
  onNextSector?: () => void;
  onShowVictory?: () => void;
  onOpenHowToPlay?: () => void;
  onOpenControls?: () => void;
  onReturnToTitle?: () => void;
}

export const StatusOverlay: React.FC<StatusOverlayProps> = ({
  status,
  telemetry,
  onResume,
  onRestart,
  onNextSector,
  onShowVictory,
  onOpenHowToPlay,
  onOpenControls,
  onReturnToTitle,
}) => {
  if (status === 'RUNNING') return null;

  const currentSector = telemetry?.activeSectorId ?? 'SEC-01';
  const isSector4 = currentSector === 'SEC-04';

  return (
    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-30 select-none animate-in fade-in duration-150">
      {status === 'PAUSED' && (
        <div className="bg-[#0b1018] border border-cyan-800/80 rounded-xl p-6 max-w-sm w-full text-center shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-cyan-950/80 border border-cyan-500/60 flex items-center justify-center mx-auto mb-3 text-cyan-400">
            <Play className="w-6 h-6 ml-0.5" />
          </div>
          <h2 className="text-lg font-bold font-mono tracking-wider text-slate-100 uppercase mb-1">
            SIMULATION PAUSED
          </h2>
          <p className="text-xs font-mono text-slate-400 mb-5">
            Temporal clock frozen. Select an action to proceed.
          </p>

          <div className="flex flex-col gap-2 font-mono text-xs">
            <button
              id="btn-modal-resume"
              onClick={onResume}
              className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600 text-slate-950 font-bold rounded transition flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(0,240,255,0.2)]"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>RESUME EXPERIMENT [P]</span>
            </button>

            <button
              id="btn-modal-restart"
              onClick={onRestart}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded border border-slate-700 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
              <span>RESTART SECTOR [R]</span>
            </button>

            {onOpenHowToPlay && (
              <button
                id="btn-modal-how-to-play"
                onClick={onOpenHowToPlay}
                className="w-full py-2 bg-[#060a12] hover:bg-slate-800 text-slate-300 rounded border border-slate-800 hover:border-slate-700 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
                <span>HOW TO PLAY</span>
              </button>
            )}

            {onOpenControls && (
              <button
                id="btn-modal-controls"
                onClick={onOpenControls}
                className="w-full py-2 bg-[#060a12] hover:bg-slate-800 text-slate-300 rounded border border-slate-800 hover:border-slate-700 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Keyboard className="w-3.5 h-3.5 text-cyan-400" />
                <span>CONTROLS</span>
              </button>
            )}

            {onReturnToTitle && (
              <button
                id="btn-modal-title"
                onClick={onReturnToTitle}
                className="w-full py-2 bg-[#04070e] hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 rounded border border-slate-900 hover:border-rose-900/50 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Home className="w-3.5 h-3.5 text-slate-400" />
                <span>RETURN TO TITLE</span>
              </button>
            )}
          </div>
        </div>
      )}

      {status === 'SECTOR_CLEAR' && (
        <div className="bg-[#09121d] border border-emerald-500/80 rounded-xl p-6 max-w-md w-full text-center shadow-2xl animate-in fade-in duration-200">
          <div className="w-14 h-14 rounded-full bg-emerald-950/80 border border-emerald-500/60 flex items-center justify-center mx-auto mb-3 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold font-mono tracking-wider text-emerald-300 uppercase mb-1">
            {isSector4
              ? 'TEMPORAL LOCK MASTER CLEARANCE'
              : currentSector === 'SEC-03'
              ? 'CASCADE FACILITY SYNCHRONIZED'
              : currentSector === 'SEC-02'
              ? 'FUTURE GATE COMPLEX SECURED'
              : 'CALIBRATION SECTOR CLEAR'}
          </h2>
          <p className="text-xs font-mono text-slate-300 mb-4">
            {isSector4
              ? 'Final Temporal Lock breached! Triple-state alignment, Overseer evasion, and Sanctuary staging executed with perfect foresight. Timeline unified.'
              : currentSector === 'SEC-03'
              ? 'Cascade anchor vault reached with zero temporal collapse. Coordinated multi-cyclic aperture traversed.'
              : currentSector === 'SEC-02'
              ? 'Omega anchor vault breached using predictive temporal foresight. Future gate successfully traversed.'
              : 'Extraction portal reached. Kinetic movement & collision matrix nominal.'}
          </p>

          <div className="bg-[#04080e] border border-emerald-900/60 rounded-lg p-3 mb-5 text-left font-mono text-xs space-y-1.5">
            <div className="flex justify-between text-slate-400">
              <span>ELAPSED CHRONO:</span>
              <span className="text-emerald-400 font-semibold">{telemetry?.elapsedSeconds.toFixed(2)}s</span>
            </div>
            {currentSector === 'SEC-01' ? (
              <div className="flex justify-between text-slate-400">
                <span>POWER CONDUITS:</span>
                <span className="text-emerald-400 font-semibold">{telemetry?.activeNodesCount}/{telemetry?.totalNodesCount} SYNCHRONIZED</span>
              </div>
            ) : (
              <div className="flex justify-between text-slate-400">
                <span>TEMPORAL GATE STATUS:</span>
                <span className="text-emerald-400 font-semibold">SYNCHRONIZED T+60s TRANSIT</span>
              </div>
            )}
            <div className="flex justify-between text-slate-400">
              <span>WALL CONTACTS:</span>
              <span className="text-cyan-400 font-semibold">{telemetry?.collisionCount}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2.5 font-mono text-xs">
            {isSector4 ? (
              <button
                id="btn-modal-view-victory"
                onClick={onShowVictory || onRestart}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-bold rounded-lg transition flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.4)] cursor-pointer"
              >
                <Trophy className="w-4 h-4" />
                <span>VIEW MISSION VICTORY PROTOCOL</span>
              </button>
            ) : onNextSector ? (
              <button
                id="btn-modal-next-sector"
                onClick={onNextSector}
                className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600 text-slate-950 font-bold rounded-lg transition flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,240,255,0.3)] cursor-pointer"
              >
                <span>PROCEED TO {currentSector === 'SEC-01' ? 'SEC-02' : currentSector === 'SEC-02' ? 'SEC-03' : 'SEC-04'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : null}

            <button
              id="btn-modal-clear-restart"
              onClick={onRestart}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-700 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
              <span>REPLAY SECTOR [R]</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

