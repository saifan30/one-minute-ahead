import React from 'react';
import { X, Keyboard, Smartphone, RotateCcw, Play, Clock, Volume2 } from 'lucide-react';

interface ControlsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartGame?: () => void;
}

export const ControlsModal: React.FC<ControlsModalProps> = ({
  isOpen,
  onClose,
  onStartGame,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-in fade-in duration-150">
      <div className="bg-[#080d16] border border-cyan-500/70 rounded-xl max-w-lg w-full shadow-[0_0_40px_rgba(0,240,255,0.2)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-cyan-950 bg-[#05080e]">
          <div className="flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-mono font-bold tracking-wider text-slate-100 uppercase">
              PROBE CONTROL SYSTEMS
            </h2>
          </div>
          <button
            id="btn-close-controls"
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 font-mono text-xs text-slate-300">
          <div className="space-y-2.5">
            {/* Movement */}
            <div className="flex items-center justify-between p-2.5 rounded bg-[#04070d] border border-cyan-950/80">
              <span className="text-slate-200 font-semibold">Propulsion & Vector Thrust:</span>
              <div className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-slate-800 rounded border border-slate-700 text-cyan-300 font-bold">W</kbd>
                <kbd className="px-2 py-1 bg-slate-800 rounded border border-slate-700 text-cyan-300 font-bold">A</kbd>
                <kbd className="px-2 py-1 bg-slate-800 rounded border border-slate-700 text-cyan-300 font-bold">S</kbd>
                <kbd className="px-2 py-1 bg-slate-800 rounded border border-slate-700 text-cyan-300 font-bold">D</kbd>
                <span className="text-slate-500 text-[10px] mx-1">OR</span>
                <span className="text-slate-400 text-[10px]">ARROWS</span>
              </div>
            </div>

            {/* Temporal Preview */}
            <div className="flex items-center justify-between p-2.5 rounded bg-[#04070d] border border-cyan-950/80">
              <span className="text-slate-200 font-semibold">Toggle +60s Temporal Preview:</span>
              <kbd className="px-3 py-1 bg-slate-800 rounded border border-cyan-800/80 text-cyan-300 font-bold shadow-[0_0_8px_rgba(0,240,255,0.2)]">
                SPACE
              </kbd>
            </div>

            {/* Sector Reset */}
            <div className="flex items-center justify-between p-2.5 rounded bg-[#04070d] border border-cyan-950/80">
              <span className="text-slate-200 font-semibold">Reset Current Sector:</span>
              <kbd className="px-2.5 py-1 bg-slate-800 rounded border border-slate-700 text-slate-300 font-bold">
                R
              </kbd>
            </div>

            {/* Pause / Resume */}
            <div className="flex items-center justify-between p-2.5 rounded bg-[#04070d] border border-cyan-950/80">
              <span className="text-slate-200 font-semibold">Pause / Resume Simulation:</span>
              <div className="flex items-center gap-1">
                <kbd className="px-2.5 py-1 bg-slate-800 rounded border border-slate-700 text-slate-300 font-bold">P</kbd>
                <span className="text-slate-500 text-[10px] mx-1">OR</span>
                <kbd className="px-2 py-1 bg-slate-800 rounded border border-slate-700 text-slate-300 font-bold text-[10px]">ESC</kbd>
              </div>
            </div>

            {/* Mute Audio */}
            <div className="flex items-center justify-between p-2.5 rounded bg-[#04070d] border border-cyan-950/80">
              <span className="text-slate-200 font-semibold">Toggle Sound FX:</span>
              <kbd className="px-2.5 py-1 bg-slate-800 rounded border border-slate-700 text-slate-300 font-bold">
                M
              </kbd>
            </div>
          </div>

          {/* Touch / Mobile note */}
          <div className="p-3 bg-[#050912] border border-cyan-900/50 rounded-lg flex items-start gap-2.5 text-[11px] text-slate-400">
            <Smartphone className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-300 block">Mobile & Touch Support:</strong>
              On mobile/touchscreens, an on-screen virtual directional pad and instant +60s preview toggle are automatically rendered at the screen corners.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-cyan-950 bg-[#05080e] flex items-center justify-end gap-2 font-mono text-xs">
          <button
            id="btn-controls-dismiss"
            onClick={onClose}
            className="py-2 px-4 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-lg transition cursor-pointer"
          >
            CLOSE
          </button>
          {onStartGame && (
            <button
              id="btn-controls-engage"
              onClick={() => {
                onClose();
                onStartGame();
              }}
              className="py-2 px-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg transition cursor-pointer shadow-[0_0_15px_rgba(0,240,255,0.3)]"
            >
              ENGAGE EXPERIMENT
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
