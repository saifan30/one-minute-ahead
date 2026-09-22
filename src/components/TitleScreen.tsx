import React from 'react';
import {
  Play,
  HelpCircle,
  Keyboard,
  RotateCcw,
  Clock,
  Shield,
  Zap,
  Radio,
  Key,
  ChevronRight,
  Layers,
} from 'lucide-react';

interface TitleScreenProps {
  onStartGame: () => void;
  onResumeGame?: () => void;
  hasActiveGame: boolean;
  currentSectorId: string;
  onOpenHowToPlay: () => void;
  onOpenControls: () => void;
  onSelectSector: (sectorId: string) => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStartGame,
  onResumeGame,
  hasActiveGame,
  currentSectorId,
  onOpenHowToPlay,
  onOpenControls,
  onSelectSector,
}) => {
  return (
    <div className="relative min-h-screen w-full bg-[#03060c] text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden select-none">
      {/* Background Animated Temporal Grid & Ambient Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(0,240,255,0.08),transparent_60%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#091220_1px,transparent_1px),linear-gradient(to_bottom,#091220_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-10 max-w-2xl w-full flex flex-col items-center text-center">
        {/* Logo Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 text-xs font-mono tracking-widest uppercase mb-6 shadow-[0_0_15px_rgba(0,240,255,0.2)]">
          <Clock className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>TEMPORAL FORESIGHT SIMULATOR</span>
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-6xl font-extrabold font-mono tracking-wider text-transparent bg-clip-text bg-gradient-to-b from-white via-cyan-100 to-cyan-400 mb-3 drop-shadow-[0_0_25px_rgba(0,240,255,0.3)]">
          ONE MINUTE AHEAD
        </h1>

        {/* Subtitle */}
        <p className="text-sm sm:text-base font-mono tracking-widest text-cyan-400/90 uppercase font-semibold mb-8">
          SEE THE FUTURE. CHANGE THE PRESENT.
        </p>

        {/* Core Premise Pill */}
        <div className="max-w-md w-full bg-[#070d18]/90 border border-cyan-900/60 rounded-lg p-3.5 mb-8 text-xs font-mono text-slate-300 shadow-lg leading-relaxed text-left flex items-start gap-3">
          <div className="p-1.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60 mt-0.5">
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <span className="text-cyan-300 font-bold block mb-0.5">CHRONO PROTOCOL ACTIVE:</span>
            Your onboard sensors compute your exact flight trajectory and environmental state{' '}
            <strong className="text-white">+60 seconds in the future</strong>. Alter your course in the present to survive what lies ahead.
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md mb-8 font-mono text-xs">
          {hasActiveGame && onResumeGame ? (
            <>
              <button
                id="btn-title-resume"
                onClick={onResumeGame}
                className="flex-1 py-3 px-5 bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600 text-slate-950 font-bold rounded-lg transition duration-150 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,240,255,0.35)] cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>RESUME EXPERIMENT ({currentSectorId})</span>
              </button>

              <button
                id="btn-title-start-new"
                onClick={onStartGame}
                className="py-3 px-4 bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-700/80 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
                <span>NEW RUN</span>
              </button>
            </>
          ) : (
            <button
              id="btn-title-start"
              onClick={onStartGame}
              className="w-full py-3.5 px-6 bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600 text-slate-950 font-bold rounded-lg transition duration-150 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,240,255,0.35)] cursor-pointer text-sm tracking-wider"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>START EXPERIMENT</span>
            </button>
          )}
        </div>

        {/* Secondary Navigation Buttons (How to Play & Controls) */}
        <div className="flex flex-wrap items-center justify-center gap-3 w-full max-w-md mb-10 font-mono text-xs">
          <button
            id="btn-title-how-to-play"
            onClick={onOpenHowToPlay}
            className="flex-1 min-w-[140px] py-2.5 px-4 bg-[#080e1a] hover:bg-[#0d1628] text-slate-300 hover:text-cyan-300 border border-cyan-950 hover:border-cyan-700/60 rounded-lg transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            <HelpCircle className="w-4 h-4 text-cyan-400" />
            <span>HOW TO PLAY</span>
          </button>

          <button
            id="btn-title-controls"
            onClick={onOpenControls}
            className="flex-1 min-w-[140px] py-2.5 px-4 bg-[#080e1a] hover:bg-[#0d1628] text-slate-300 hover:text-cyan-300 border border-cyan-950 hover:border-cyan-700/60 rounded-lg transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            <Keyboard className="w-4 h-4 text-cyan-400" />
            <span>CONTROLS</span>
          </button>
        </div>

        {/* Sector Fast-Select Section */}
        <div className="w-full max-w-lg border-t border-cyan-950/80 pt-6">
          <div className="flex items-center justify-between mb-3 text-xs font-mono text-slate-400">
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              TEST CHAMBER DIRECT ACCESS
            </span>
            <span className="text-[10px] text-cyan-500">4 SECTORS</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px]">
            <button
              id="btn-select-sec1"
              onClick={() => onSelectSector('SEC-01')}
              className={`p-2.5 rounded-lg border text-left transition cursor-pointer flex flex-col justify-between ${
                currentSectorId === 'SEC-01'
                  ? 'bg-cyan-950/80 border-cyan-500/80 text-cyan-200 shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                  : 'bg-[#060a12] border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-cyan-400">SEC-01</span>
                <Shield className="w-3 h-3 text-cyan-400" />
              </div>
              <span className="text-[10px] truncate">CALIBRATION</span>
            </button>

            <button
              id="btn-select-sec2"
              onClick={() => onSelectSector('SEC-02')}
              className={`p-2.5 rounded-lg border text-left transition cursor-pointer flex flex-col justify-between ${
                currentSectorId === 'SEC-02'
                  ? 'bg-cyan-950/80 border-cyan-500/80 text-cyan-200 shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                  : 'bg-[#060a12] border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-cyan-400">SEC-02</span>
                <Zap className="w-3 h-3 text-cyan-400" />
              </div>
              <span className="text-[10px] truncate">FUTURE GATE</span>
            </button>

            <button
              id="btn-select-sec3"
              onClick={() => onSelectSector('SEC-03')}
              className={`p-2.5 rounded-lg border text-left transition cursor-pointer flex flex-col justify-between ${
                currentSectorId === 'SEC-03'
                  ? 'bg-purple-950/80 border-purple-500/80 text-purple-200 shadow-[0_0_10px_rgba(192,132,252,0.25)]'
                  : 'bg-[#060a12] border-slate-800/80 text-slate-400 hover:text-purple-300 hover:border-purple-900/60'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-purple-400">SEC-03</span>
                <Radio className="w-3 h-3 text-purple-400" />
              </div>
              <span className="text-[10px] truncate">CASCADE</span>
            </button>

            <button
              id="btn-select-sec4"
              onClick={() => onSelectSector('SEC-04')}
              className={`p-2.5 rounded-lg border text-left transition cursor-pointer flex flex-col justify-between ${
                currentSectorId === 'SEC-04'
                  ? 'bg-rose-950/80 border-rose-500/80 text-rose-200 shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                  : 'bg-[#060a12] border-slate-800/80 text-slate-400 hover:text-rose-300 hover:border-rose-900/60'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-rose-400">SEC-04</span>
                <Key className="w-3 h-3 text-rose-400" />
              </div>
              <span className="text-[10px] truncate">TEMPORAL LOCK</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
