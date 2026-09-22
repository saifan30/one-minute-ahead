import React from 'react';
import {
  Shield,
  Zap,
  Radio,
  Key,
  Clock,
  ArrowRight,
  Crosshair,
  AlertCircle,
} from 'lucide-react';

interface SectorBriefingModalProps {
  isOpen: boolean;
  sectorId: string;
  isFirstTimeOnboarding?: boolean;
  onEnterSector: () => void;
  onSkipToGame?: () => void;
}

interface SectorInfo {
  code: string;
  title: string;
  subtitle: string;
  objective: string;
  threatIntel: string;
  themeColor: string;
  accentBorder: string;
  badgeBg: string;
  icon: React.ReactNode;
}

const SECTOR_METADATA: Record<string, SectorInfo> = {
  'SEC-01': {
    code: 'SEC-01',
    title: 'CALIBRATION',
    subtitle: 'TEMPORAL KINEMATICS & HORIZON SENSOR',
    objective: 'Use the 60-second prediction to safely reach the Temporal Anchor.',
    threatIntel: 'Active Chrono Interceptor patrolling central corridor on a 12-second horizontal sweep.',
    themeColor: 'text-cyan-400',
    accentBorder: 'border-cyan-500/70',
    badgeBg: 'bg-cyan-950/80 text-cyan-300 border-cyan-700/60',
    icon: <Shield className="w-5 h-5 text-cyan-400" />,
  },
  'SEC-02': {
    code: 'SEC-02',
    title: 'FUTURE GATE',
    subtitle: 'DETERMINISTIC APERTURE CYCLES',
    objective: 'Use the future gate state and temporal prediction to pass the Future Gate.',
    threatIntel: 'Flux Sentinels guarding ingress. Temporal Aperture operates on a strict 24s period (14s closed, 8s open).',
    themeColor: 'text-cyan-400',
    accentBorder: 'border-cyan-500/70',
    badgeBg: 'bg-cyan-950/80 text-cyan-300 border-cyan-700/60',
    icon: <Zap className="w-5 h-5 text-cyan-400" />,
  },
  'SEC-03': {
    code: 'SEC-03',
    title: 'TEMPORAL CASCADE',
    subtitle: 'MULTI-PERIOD HARMONIC SYNCHRONIZATION',
    objective: 'Coordinate the future gate and Sentinel hazard to reach extraction.',
    threatIntel: 'Dual non-harmonic cycles: 16s Cascade Drone sweep combined with 24s Gate Aperture.',
    themeColor: 'text-purple-400',
    accentBorder: 'border-purple-500/70',
    badgeBg: 'bg-purple-950/80 text-purple-300 border-purple-700/60',
    icon: <Radio className="w-5 h-5 text-purple-400" />,
  },
  'SEC-04': {
    code: 'SEC-04',
    title: 'TEMPORAL LOCK',
    subtitle: 'TRIPLE-STATE FUTURE ALIGNMENT',
    objective: 'Use the 60-second prediction to coordinate the Temporal Lock and final extraction.',
    threatIntel: '15s Lock Overseer, orbital Lock Guardian, and 24s Lock Aperture requiring simultaneous +60s alignment.',
    themeColor: 'text-rose-400',
    accentBorder: 'border-rose-500/70',
    badgeBg: 'bg-rose-950/80 text-rose-300 border-rose-700/60',
    icon: <Key className="w-5 h-5 text-rose-400" />,
  },
};

export const SectorBriefingModal: React.FC<SectorBriefingModalProps> = ({
  isOpen,
  sectorId,
  isFirstTimeOnboarding,
  onEnterSector,
}) => {
  if (!isOpen) return null;

  const info = SECTOR_METADATA[sectorId] || SECTOR_METADATA['SEC-01'];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-in fade-in duration-200">
      <div className={`bg-[#080d16] border ${info.accentBorder} rounded-xl max-w-lg w-full shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col`}>
        {/* Top Header Badge */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-cyan-950 bg-[#05080e]">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${info.badgeBg}`}>
              {info.code}
            </span>
            <span className="text-xs font-mono tracking-wider text-slate-400 uppercase">
              CHAMBER BRIEFING
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-mono">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>T+60s FORESIGHT ACTIVE</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 font-mono">
          {/* Sector Title Banner */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-[#04070d] border border-cyan-900/60">
              {info.icon}
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-wider text-white">
                {info.title}
              </h2>
              <p className="text-[10px] text-slate-400 tracking-wider">
                {info.subtitle}
              </p>
            </div>
          </div>

          {/* First-time onboarding callout if entering SEC-01 for the first time */}
          {isFirstTimeOnboarding && sectorId === 'SEC-01' && (
            <div className="p-3 bg-cyan-950/60 border border-cyan-500/50 rounded-lg text-left shadow-inner">
              <span className="text-[10px] text-cyan-300 font-bold uppercase tracking-wider block mb-1">
                ONBOARDING DIRECTIVE:
              </span>
              <p className="text-xs font-bold text-white leading-relaxed">
                “Your actions now can change the future you see.”
              </p>
              <p className="text-[10px] text-slate-300 mt-1">
                Use your propulsion controls (WASD / Arrows) and observe how the +60s temporal projection instantly adapts to your vector.
              </p>
            </div>
          )}

          {/* Primary Concise Objective */}
          <div className="p-3.5 bg-[#050912] border border-cyan-900/60 rounded-lg text-left space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] text-cyan-400 font-bold uppercase tracking-wider">
              <Crosshair className="w-3.5 h-3.5" />
              <span>PRIMARY OBJECTIVE</span>
            </div>
            <p className="text-xs font-bold text-slate-100 leading-relaxed">
              {info.objective}
            </p>
          </div>

          {/* Threat Intel */}
          <div className="p-3 bg-[#04070e] border border-slate-800 rounded-lg text-left flex items-start gap-2.5 text-[11px] text-slate-300">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] text-amber-400 font-bold block uppercase">
                INTELLIGENCE NOTE:
              </span>
              <span className="text-slate-400">{info.threatIntel}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-cyan-950 bg-[#05080e] flex items-center justify-end font-mono text-xs">
          <button
            id="btn-enter-sector"
            onClick={onEnterSector}
            className="w-full sm:w-auto py-2.5 px-6 bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600 text-slate-950 font-bold rounded-lg transition flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,240,255,0.35)] cursor-pointer tracking-wider"
          >
            <span>ENTER {info.code}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
