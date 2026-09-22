import React from 'react';
import {
  X,
  Clock,
  Eye,
  Crosshair,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartGame?: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({
  isOpen,
  onClose,
  onStartGame,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-in fade-in duration-150">
      <div className="bg-[#080d16] border border-cyan-500/70 rounded-xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-[0_0_40px_rgba(0,240,255,0.2)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-cyan-950 bg-[#05080e]">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <h2 className="text-sm font-mono font-bold tracking-wider text-slate-100 uppercase">
              TEMPORAL FORESIGHT PROTOCOL
            </h2>
          </div>
          <button
            id="btn-close-how-to-play"
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-4 font-mono text-xs text-slate-300">
          {/* Core Principle Banner */}
          <div className="p-3.5 bg-gradient-to-r from-cyan-950/80 to-slate-900 border border-cyan-500/50 rounded-lg text-left shadow-inner">
            <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block mb-1">
              THE CORE MECHANIC
            </span>
            <p className="text-sm font-bold text-white leading-relaxed">
              “You can see the game state 60 seconds ahead.”
            </p>
            <p className="text-[11px] text-cyan-300/80 mt-1">
              The preview projection is critical gameplay data—not decoration. Every movement or pause in the present instantly recalculates your future state.
            </p>
          </div>

          {/* 6-Step Execution Loop */}
          <div>
            <span className="text-[11px] font-bold text-slate-200 uppercase tracking-wide block mb-2">
              HOW TO OPERATE YOUR TEMPORAL PROBE:
            </span>

            <div className="space-y-2">
              <div className="flex items-start gap-2.5 p-2 rounded bg-[#04070d] border border-cyan-950/80">
                <div className="w-5 h-5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-700/60 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <strong className="text-cyan-300">Activate the Temporal Sensor:</strong>
                  <span className="text-slate-400 ml-1">
                    Press <kbd className="px-1 py-0.2 bg-slate-800 rounded text-cyan-300 border border-slate-700">SPACE</kbd> or use the Sensor Module to display the lookahead projection.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2 rounded bg-[#04070d] border border-cyan-950/80">
                <div className="w-5 h-5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-700/60 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <strong className="text-cyan-300">Inspect the Predicted Future:</strong>
                  <span className="text-slate-400 ml-1">
                    Examine the purple future ghost and trajectory trail showing where you will be at <strong className="text-slate-200">T+60s</strong>.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2 rounded bg-[#04070d] border border-cyan-950/80">
                <div className="w-5 h-5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-700/60 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <strong className="text-cyan-300">Identify Hazards & Gate States:</strong>
                  <span className="text-slate-400 ml-1">
                    Check if the deterministic Future Gate is <span className="text-emerald-400 font-bold">OPEN</span> or <span className="text-rose-400 font-bold">CLOSED</span>, and monitor sentinel flight paths.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2 rounded bg-[#04070d] border border-cyan-950/80">
                <div className="w-5 h-5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-700/60 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  4
                </div>
                <div>
                  <strong className="text-cyan-300">Change Present Movement or Route:</strong>
                  <span className="text-slate-400 ml-1">
                    Steer toward North or South corridors, or hold in staging coves/sanctuaries until the future aligns.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2 rounded bg-[#04070d] border border-cyan-950/80">
                <div className="w-5 h-5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-700/60 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  5
                </div>
                <div>
                  <strong className="text-cyan-300">Avoid Predicted Interception:</strong>
                  <span className="text-slate-400 ml-1">
                    Clear any <span className="text-rose-400 font-bold">INTERCEPTION HAZARD</span> warnings until telemetry reads <span className="text-emerald-400 font-bold">TIMELINE: NOMINAL</span>.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2 rounded bg-[#04070d] border border-cyan-950/80">
                <div className="w-5 h-5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-700/60 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  6
                </div>
                <div>
                  <strong className="text-cyan-300">Reach the Extraction Point:</strong>
                  <span className="text-slate-400 ml-1">
                    Pass through the aperture when the horizon confirms a safe vector to the Temporal Anchor.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-cyan-950 bg-[#05080e] flex items-center justify-end gap-2 font-mono text-xs">
          <button
            id="btn-how-to-play-close"
            onClick={onClose}
            className="py-2 px-4 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-lg transition cursor-pointer"
          >
            DISMISS
          </button>
          {onStartGame && (
            <button
              id="btn-how-to-play-engage"
              onClick={() => {
                onClose();
                onStartGame();
              }}
              className="py-2 px-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(0,240,255,0.3)]"
            >
              <span>ENGAGE EXPERIMENT</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
