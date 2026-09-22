import React from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RotateCcw, Clock } from 'lucide-react';
import { InputState } from '../types/game';

interface ControlOverlayProps {
  onInputStateChange: (input: Partial<InputState>) => void;
  onRestart: () => void;
  onTogglePreview: () => void;
}

export const ControlOverlay: React.FC<ControlOverlayProps> = ({
  onInputStateChange,
  onRestart,
  onTogglePreview,
}) => {
  const handleTouch = (key: keyof InputState, pressed: boolean) => {
    onInputStateChange({ [key]: pressed });
  };

  return (
    <div className="md:hidden flex items-center justify-between w-full px-4 py-3 bg-[#080c14]/90 border-t border-cyan-950/80 backdrop-blur z-20">
      {/* Directional Pad */}
      <div className="relative w-32 h-32 flex items-center justify-center">
        {/* Up */}
        <button
          id="btn-dpad-up"
          type="button"
          onMouseDown={() => handleTouch('up', true)}
          onMouseUp={() => handleTouch('up', false)}
          onTouchStart={(e) => { e.preventDefault(); handleTouch('up', true); }}
          onTouchEnd={(e) => { e.preventDefault(); handleTouch('up', false); }}
          className="absolute top-0 w-10 h-10 bg-slate-900/90 border border-cyan-800/60 active:bg-cyan-900 rounded flex items-center justify-center text-cyan-400 select-none touch-none"
        >
          <ArrowUp className="w-5 h-5" />
        </button>

        {/* Down */}
        <button
          id="btn-dpad-down"
          type="button"
          onMouseDown={() => handleTouch('down', true)}
          onMouseUp={() => handleTouch('down', false)}
          onTouchStart={(e) => { e.preventDefault(); handleTouch('down', true); }}
          onTouchEnd={(e) => { e.preventDefault(); handleTouch('down', false); }}
          className="absolute bottom-0 w-10 h-10 bg-slate-900/90 border border-cyan-800/60 active:bg-cyan-900 rounded flex items-center justify-center text-cyan-400 select-none touch-none"
        >
          <ArrowDown className="w-5 h-5" />
        </button>

        {/* Left */}
        <button
          id="btn-dpad-left"
          type="button"
          onMouseDown={() => handleTouch('left', true)}
          onMouseUp={() => handleTouch('left', false)}
          onTouchStart={(e) => { e.preventDefault(); handleTouch('left', true); }}
          onTouchEnd={(e) => { e.preventDefault(); handleTouch('left', false); }}
          className="absolute left-0 w-10 h-10 bg-slate-900/90 border border-cyan-800/60 active:bg-cyan-900 rounded flex items-center justify-center text-cyan-400 select-none touch-none"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Right */}
        <button
          id="btn-dpad-right"
          type="button"
          onMouseDown={() => handleTouch('right', true)}
          onMouseUp={() => handleTouch('right', false)}
          onTouchStart={(e) => { e.preventDefault(); handleTouch('right', true); }}
          onTouchEnd={(e) => { e.preventDefault(); handleTouch('right', false); }}
          className="absolute right-0 w-10 h-10 bg-slate-900/90 border border-cyan-800/60 active:bg-cyan-900 rounded flex items-center justify-center text-cyan-400 select-none touch-none"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-2">
        <button
          id="btn-mobile-preview"
          type="button"
          onClick={onTogglePreview}
          className="px-3 py-2 bg-cyan-950/80 border border-cyan-600/70 active:bg-cyan-900 rounded text-cyan-300 font-mono text-xs flex items-center gap-1.5"
        >
          <Clock className="w-4 h-4 text-cyan-400" />
          <span>+60s PREVIEW</span>
        </button>

        <button
          id="btn-mobile-restart"
          type="button"
          onClick={onRestart}
          className="px-3 py-2 bg-slate-900/90 border border-slate-700/60 active:bg-slate-800 rounded text-slate-300 font-mono text-xs flex items-center gap-1.5"
        >
          <RotateCcw className="w-4 h-4 text-slate-400" />
          <span>RESTART</span>
        </button>
      </div>
    </div>
  );
};
