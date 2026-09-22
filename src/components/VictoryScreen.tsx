import React from 'react';
import {
  Trophy,
  RotateCcw,
  Home,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Zap,
  Activity,
  Award,
} from 'lucide-react';
import { GameTelemetry } from '../types/game';

interface VictoryScreenProps {
  telemetry: GameTelemetry | null;
  onRestartFullMission: () => void;
  onReplaySector4: () => void;
  onReturnToTitle: () => void;
}

export const VictoryScreen: React.FC<VictoryScreenProps> = ({
  telemetry,
  onRestartFullMission,
  onReplaySector4,
  onReturnToTitle,
}) => {
  const elapsed = telemetry?.elapsedSeconds ?? 0;
  const minutes = Math.floor(elapsed / 60);
  const seconds = Math.floor(elapsed % 60);
  const centiseconds = Math.floor((elapsed * 100) % 100);

  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds
    .toString()
    .padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;

  return (
    <div className="relative min-h-screen w-full bg-[#03060c] text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden select-none animate-in fade-in duration-300">
      {/* Background Animated Temporal Grid & Ambient Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(16,185,129,0.12),transparent_60%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#071510_1px,transparent_1px),linear-gradient(to_bottom,#071510_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-10 max-w-xl w-full bg-[#08121a]/95 border border-emerald-500/70 rounded-2xl p-6 sm:p-8 flex flex-col items-center text-center shadow-[0_0_60px_rgba(16,185,129,0.25)]">
        {/* Victory Trophy Badge */}
        <div className="w-16 h-16 rounded-full bg-emerald-950/90 border-2 border-emerald-400 flex items-center justify-center mb-5 shadow-[0_0_30px_rgba(16,185,129,0.5)]">
          <Trophy className="w-8 h-8 text-emerald-300 animate-bounce" />
        </div>

        {/* Brand & Subtitle */}
        <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 mb-2 tracking-widest uppercase">
          EXPERIMENT CONCLUDED WITH 100% TIMELINE COHESION
        </span>

        <h1 className="text-3xl sm:text-4xl font-extrabold font-mono tracking-wider text-transparent bg-clip-text bg-gradient-to-b from-white via-emerald-100 to-emerald-400 mb-1">
          ONE MINUTE AHEAD
        </h1>

        <h2 className="text-base sm:text-lg font-mono font-bold tracking-widest text-emerald-400 uppercase mb-6">
          TEMPORAL SEQUENCE COMPLETE
        </h2>

        <p className="text-xs font-mono text-slate-300 mb-6 leading-relaxed max-w-md">
          All four temporal sectors have been successfully synchronized, traversed, and extracted. The 60-second predictive foresight protocol has been mastered.
        </p>

        {/* Sector Completion Matrix */}
        <div className="w-full bg-[#04090e] border border-emerald-900/60 rounded-xl p-4 mb-6 text-left font-mono text-xs space-y-2.5">
          <span className="text-[10px] text-slate-400 font-bold tracking-wider uppercase block border-b border-slate-800 pb-1.5">
            CONQUERED TEST CHAMBERS:
          </span>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="flex items-center gap-2 text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>SEC-01: CALIBRATION</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>SEC-02: FUTURE GATE</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>SEC-03: CASCADE</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>SEC-04: TEMPORAL LOCK</span>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-2 flex items-center justify-between text-slate-400 text-xs">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              FINAL CHAMBER CHRONO:
            </span>
            <span className="text-emerald-300 font-bold">{formattedTime}s</span>
          </div>

          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              WALL CONTACTS:
            </span>
            <span className="text-cyan-300 font-bold">{telemetry?.collisionCount ?? 0}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 w-full font-mono text-xs">
          <button
            id="btn-victory-restart-all"
            onClick={onRestartFullMission}
            className="flex-1 py-3 px-4 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-bold rounded-lg transition flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.4)] cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>PLAY AGAIN (SEC-01)</span>
          </button>

          <button
            id="btn-victory-replay-sec4"
            onClick={onReplaySector4}
            className="py-3 px-4 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
            <span>REPLAY SEC-04</span>
          </button>

          <button
            id="btn-victory-return-title"
            onClick={onReturnToTitle}
            className="py-3 px-4 bg-[#050910] hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Home className="w-3.5 h-3.5 text-cyan-400" />
            <span>TITLE</span>
          </button>
        </div>
      </div>
    </div>
  );
};
