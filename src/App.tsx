import React, { useRef, useState, useCallback } from 'react';
import { GameEngine } from './game/engine';
import { GameTelemetry, InputState } from './types/game';
import { soundFx } from './game/audio';
import { HUD } from './components/HUD';
import { GameCanvas } from './components/GameCanvas';
import { FuturePreviewPlaceholder } from './components/FuturePreviewPlaceholder';
import { ControlOverlay } from './components/ControlOverlay';
import { TitleScreen } from './components/TitleScreen';
import { HowToPlayModal } from './components/HowToPlayModal';
import { ControlsModal } from './components/ControlsModal';
import { SectorBriefingModal } from './components/SectorBriefingModal';
import { VictoryScreen } from './components/VictoryScreen';
import {
  Zap,
  Key,
  ShieldCheck,
  Compass,
  Info,
  Terminal,
  Radio,
  Crosshair,
} from 'lucide-react';

export default function App() {
  const engineRef = useRef<GameEngine | null>(null);
  const [telemetry, setTelemetry] = useState<GameTelemetry | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  // High-level App Screen Flow
  const [gameState, setGameState] = useState<'TITLE' | 'PLAYING' | 'VICTORY'>('TITLE');
  const [hasActiveGame, setHasActiveGame] = useState(false);

  // Modals state
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [briefingState, setBriefingState] = useState<{
    isOpen: boolean;
    sectorId: string;
    isFirstTimeOnboarding?: boolean;
  }>({
    isOpen: false,
    sectorId: 'SEC-01',
    isFirstTimeOnboarding: false,
  });

  const handleTelemetryUpdate = useCallback((newTelemetry: GameTelemetry) => {
    setTelemetry(newTelemetry);
  }, []);

  const handleRestart = () => {
    engineRef.current?.restart();
  };

  const handleTogglePause = () => {
    engineRef.current?.togglePause();
  };

  const handleToggleMute = () => {
    const muted = soundFx.toggleMute();
    setIsMuted(muted);
  };

  const handleTogglePreview = () => {
    engineRef.current?.togglePreview();
  };

  const handleSetWaypoint = (point: { x: number; y: number } | null) => {
    engineRef.current?.setCourseWaypoint(point);
  };

  const handleSelectSector = (sectorId: string, skipBriefing = false) => {
    if (skipBriefing) {
      setGameState('PLAYING');
      setHasActiveGame(true);
      engineRef.current?.loadSector(sectorId);
    } else {
      setBriefingState({
        isOpen: true,
        sectorId,
        isFirstTimeOnboarding: false,
      });
    }
  };

  const handleStartNewGame = () => {
    setBriefingState({
      isOpen: true,
      sectorId: 'SEC-01',
      isFirstTimeOnboarding: true,
    });
  };

  const handleResumeGame = () => {
    setGameState('PLAYING');
  };

  const handleEnterSectorFromBriefing = () => {
    const targetSector = briefingState.sectorId;
    setBriefingState({ isOpen: false, sectorId: targetSector });
    setGameState('PLAYING');
    setHasActiveGame(true);
    engineRef.current?.loadSector(targetSector);
  };

  const handleNextSectorProgression = (nextSectorId: string) => {
    setBriefingState({
      isOpen: true,
      sectorId: nextSectorId,
      isFirstTimeOnboarding: false,
    });
  };

  const handleShowVictoryScreen = () => {
    setGameState('VICTORY');
  };

  const handleRestartFullMission = () => {
    setGameState('TITLE');
    handleStartNewGame();
  };

  const handleReplaySector4 = () => {
    setGameState('PLAYING');
    engineRef.current?.loadSector('SEC-04');
  };

  const handleReturnToTitle = () => {
    setGameState('TITLE');
  };

  const handleInputStateChange = (newInput: Partial<InputState>) => {
    engineRef.current?.setInput(newInput);
  };

  const activeSectorId = telemetry?.activeSectorId ?? briefingState.sectorId ?? 'SEC-01';
  const isSector4 = activeSectorId === 'SEC-04';
  const isSector3 = activeSectorId === 'SEC-03';
  const isSector2 = activeSectorId === 'SEC-02';

  // Primary objective text per sector
  const primaryObjective =
    activeSectorId === 'SEC-04'
      ? 'Use the 60-second prediction to coordinate the Temporal Lock and final extraction.'
      : activeSectorId === 'SEC-03'
      ? 'Coordinate the future gate and Sentinel hazard to reach extraction.'
      : activeSectorId === 'SEC-02'
      ? 'Use the future gate state and temporal prediction to pass the Future Gate.'
      : 'Use the 60-second prediction to safely reach the Temporal Anchor.';

  return (
    <div className="flex flex-col min-h-screen bg-[#05080e] text-slate-200 font-sans select-none overflow-x-hidden relative">
      {/* Title Screen View */}
      {gameState === 'TITLE' && (
        <TitleScreen
          onStartGame={handleStartNewGame}
          onResumeGame={hasActiveGame ? handleResumeGame : undefined}
          hasActiveGame={hasActiveGame}
          currentSectorId={activeSectorId}
          onOpenHowToPlay={() => setShowHowToPlay(true)}
          onOpenControls={() => setShowControls(true)}
          onSelectSector={(sectorId) => handleSelectSector(sectorId)}
        />
      )}

      {/* Victory Screen View */}
      {gameState === 'VICTORY' && (
        <VictoryScreen
          telemetry={telemetry}
          onRestartFullMission={handleRestartFullMission}
          onReplaySector4={handleReplaySector4}
          onReturnToTitle={handleReturnToTitle}
        />
      )}

      {/* Active Game Playing View */}
      {gameState === 'PLAYING' && (
        <>
          {/* HUD Header */}
          <HUD
            telemetry={telemetry}
            onRestart={handleRestart}
            onTogglePause={handleTogglePause}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            onTogglePreview={handleTogglePreview}
            onSelectSector={handleSelectSector}
            onOpenHowToPlay={() => setShowHowToPlay(true)}
            onOpenControls={() => setShowControls(true)}
            onReturnToTitle={handleReturnToTitle}
          />

          {/* Main Workspace Layout */}
          <main className="flex-1 max-w-7xl w-full mx-auto p-3 md:p-5 flex flex-col gap-3">
            {/* Primary High-Visibility Objective Banner */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 bg-[#080d16] border border-cyan-900/60 rounded-lg text-xs font-mono shadow-sm">
              <div className="flex items-center gap-2">
                <Crosshair className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="text-cyan-400 font-bold uppercase tracking-wider">
                  OBJECTIVE:
                </span>
                <span className="text-slate-100 font-medium">
                  {primaryObjective}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span className="hidden sm:inline font-bold text-cyan-400">{activeSectorId}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 items-stretch">
              {/* Main Game Screen (Canvas Viewport) */}
              <div className="lg:col-span-8 flex flex-col min-h-[420px] md:min-h-[500px]">
                <GameCanvas
                  engineRef={engineRef}
                  onTelemetryUpdate={handleTelemetryUpdate}
                  onToggleMute={handleToggleMute}
                  onNextSector={
                    activeSectorId === 'SEC-01'
                      ? () => handleNextSectorProgression('SEC-02')
                      : activeSectorId === 'SEC-02'
                      ? () => handleNextSectorProgression('SEC-03')
                      : activeSectorId === 'SEC-03'
                      ? () => handleNextSectorProgression('SEC-04')
                      : undefined
                  }
                  onShowVictory={handleShowVictoryScreen}
                  onOpenHowToPlay={() => setShowHowToPlay(true)}
                  onOpenControls={() => setShowControls(true)}
                  onReturnToTitle={handleReturnToTitle}
                />

            {/* Temporal Interception Alert Notice */}
            {telemetry?.temporalInterceptionAlert && (
              <div className="mt-2 px-3 py-2 bg-rose-950/80 border border-rose-500 rounded text-xs font-mono text-rose-200 flex items-center justify-between animate-pulse">
                <span>{telemetry.temporalInterceptionAlert}</span>
                <span className="text-[10px] text-rose-400 font-bold ml-2">[TIMELINE INTERCEPT]</span>
              </div>
            )}

            {/* Controls Helper Strip */}
            <div className="flex flex-wrap items-center justify-between gap-2 mt-2 px-2 py-1.5 bg-[#090e17] border border-cyan-950/70 rounded text-[11px] font-mono text-slate-400">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-slate-500">CONTROLS:</span>
                <span className="text-slate-300">
                  <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-cyan-400">W</kbd>
                  <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-cyan-400 ml-1">A</kbd>
                  <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-cyan-400 ml-1">S</kbd>
                  <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-cyan-400 ml-1">D</kbd>
                  {' MOVE'}
                </span>
                <span className="text-slate-600">|</span>
                <span className="text-slate-300">
                  <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-cyan-400">SPACE</kbd>
                  {' +60s PREVIEW'}
                </span>
                <span className="text-slate-600">|</span>
                <span className="text-slate-300">
                  <span className="text-cyan-400">CLICK SENSOR</span>
                  {' CHART WAYPOINT'}
                </span>
                <span className="text-slate-600">|</span>
                <span className="text-slate-300">
                  <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-cyan-400">C</kbd>
                  {' CLEAR'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <span>
                  <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-cyan-400">R</kbd> Reset
                </span>
                <span>•</span>
                <span>
                  <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-cyan-400">P</kbd> Pause
                </span>
              </div>
            </div>
          </div>

          {/* Right Sidebar: Future-Preview Sensor & Telemetry Objectives */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            {/* Future-Preview Mechanic Dedicated Area */}
            <FuturePreviewPlaceholder
              telemetry={telemetry}
              onTogglePreview={handleTogglePreview}
              onSetWaypoint={handleSetWaypoint}
            />

            {/* Mission Protocol / Chamber Objectives */}
            <div className="bg-[#090e17] border border-cyan-950/80 rounded-lg p-3.5 flex-1 flex flex-col justify-between shadow-lg">
              <div>
                <div className="flex items-center justify-between border-b border-cyan-950/80 pb-2 mb-3">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-cyan-400" />
                    <h2 className="text-xs font-mono font-bold tracking-wider text-slate-200 uppercase">
                      SECTOR OBJECTIVES
                    </h2>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/60 text-cyan-400 border border-cyan-800/40">
                    {activeSectorId}
                  </span>
                </div>

                <div className="space-y-2 text-xs font-mono">
                  {isSector4 ? (
                    <>
                      {/* Objective 1 (Sector 04) */}
                      <div className="flex items-start gap-2 bg-[#050910] p-2 rounded border border-rose-950/60">
                        <div
                          className={`mt-0.5 ${
                            telemetry?.futureState.lockAnalysis?.allSatisfied
                              ? 'text-rose-400'
                              : 'text-amber-400'
                          }`}
                        >
                          <Zap className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-300 font-semibold">1. Triple-State Alignment</span>
                            <span
                              className={`text-[10px] ${
                                telemetry?.futureState.lockAnalysis?.allSatisfied
                                  ? 'text-rose-300 font-bold'
                                  : 'text-amber-400'
                              }`}
                            >
                              {telemetry?.futureState.lockAnalysis?.allSatisfied
                                ? '[T+60s UNLOCKED]'
                                : '[T+60s LOCKED]'}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Satisfy gate open + overseer clear + position alignment simultaneously at T+60s.
                          </p>
                        </div>
                      </div>

                      {/* Objective 2 (Sector 04) */}
                      <div className="flex items-start gap-2 bg-[#050910] p-2 rounded border border-rose-950/60">
                        <div
                          className={`mt-0.5 ${
                            telemetry?.futureState.interceptWarning
                              ? 'text-rose-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          <Radio className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-300 font-semibold">2. Evade Dual Hazards</span>
                            <span
                              className={`text-[10px] ${
                                telemetry?.futureState.interceptWarning
                                  ? 'text-rose-400'
                                  : 'text-emerald-400'
                              }`}
                            >
                              {telemetry?.futureState.interceptWarning
                                ? '[HAZARD ALERT]'
                                : '[CLEAR]'}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Dodge 15s Lock Overseer and orbital Lock Guardian via +60s predictive trajectory.
                          </p>
                        </div>
                      </div>

                      {/* Objective 3 (Sector 04) */}
                      <div className="flex items-start gap-2 bg-[#050910] p-2 rounded border border-rose-950/60">
                        <div className="mt-0.5 text-rose-400">
                          <Key className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-300 font-semibold">3. Sanctuary Staging</span>
                            <span className="text-[10px] text-rose-300">
                              {telemetry && (telemetry.playerPos.x > 240 && telemetry.playerPos.x < 340)
                                ? '[IN SANCTUARY]'
                                : '[EN ROUTE]'}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Stage in North/South Sanctuary to align +60s window before corridor assault.
                          </p>
                        </div>
                      </div>

                      {/* Objective 4 (Sector 04) */}
                      <div className="flex items-start gap-2 bg-[#050910] p-2 rounded border border-rose-950/60">
                        <div
                          className={`mt-0.5 ${
                            telemetry?.exitReached ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-300 font-semibold">4. Vault Extraction</span>
                            <span
                              className={`text-[10px] ${
                                telemetry?.exitReached ? 'text-emerald-400' : 'text-slate-400'
                              }`}
                            >
                              {telemetry?.exitReached ? '[EXTRACTED]' : '[REQUIRED]'}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Breach Lock Gate and extract Final Temporal Anchor at X:740.
                          </p>
                        </div>
                      </div>
                    </>
                  ) : isSector3 ? (
                    <>
                      {/* Objective 1 (Sector 03) */}
                      <div className="flex items-start gap-2 bg-[#050910] p-2 rounded border border-cyan-950/60">
                        <div
                          className={`mt-0.5 ${
                            telemetry?.futureState.gateAnalysis?.futureIsOpen
                              ? 'text-purple-400'
                              : 'text-amber-400'
                          }`}
                        >
                          <Zap className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-300 font-semibold">1. Dual Harmonic Cycles</span>
                            <span
                              className={`text-[10px] ${
                                telemetry?.futureState.gateAnalysis?.futureIsOpen
                                  ? 'text-purple-300'
                                  : 'text-amber-400'
                              }`}
                            >
                              {telemetry?.futureState.gateAnalysis?.futureIsOpen
                                ? '[T+60s OPEN]'
                                : '[T+60s CLOSED]'}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Coordinate 16s Sentinel cycle with 24s Cascade Gate aperture window.
                          </p>
                        </div>
                      </div>

                      {/* Objective 2 (Sector 03) */}
                      <div className="flex items-start gap-2 bg-[#050910] p-2 rounded border border-cyan-950/60">
                        <div
                          className={`mt-0.5 ${
                            telemetry?.futureState.interceptWarning
                              ? 'text-rose-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          <Radio className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-300 font-semibold">2. Evade Cascade Sentinels</span>
                            <span
                              className={`text-[10px] ${
                                telemetry?.futureState.interceptWarning
                                  ? 'text-rose-400'
                                  : 'text-emerald-400'
                              }`}
                            >
                              {telemetry?.futureState.interceptWarning
                                ? '[HAZARD ALERT]'
                                : '[CLEAR]'}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Dodge horizontal Cascade Drone and orbital Gate Sweeper using +60s projection.
                          </p>
                        </div>
                      </div>

                      {/* Objective 3 (Sector 03) */}
                      <div className="flex items-start gap-2 bg-[#050910] p-2 rounded border border-cyan-950/60">
                        <div className="mt-0.5 text-purple-400">
                          <Key className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-300 font-semibold">3. Staging Pocket Transit</span>
                            <span className="text-[10px] text-purple-300">
                              {telemetry && (telemetry.playerPos.x > 260 && telemetry.playerPos.x < 360)
                                ? '[IN STAGING POCKET]'
                                : '[READY]'}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Hold in West Staging Pockets Alpha or Beta until simultaneous corridor + aperture opening.
                          </p>
                        </div>
                      </div>

                      {/* Objective 4 (Sector 03) */}
                      <div className="flex items-start gap-2 bg-[#050910] p-2 rounded border border-cyan-950/60">
                        <div
                          className={`mt-0.5 ${
                            telemetry?.exitReached ? 'text-emerald-400' : 'text-purple-400'
                          }`}
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-300 font-semibold">4. Cascade Anchor Extraction</span>
                            <span
                              className={`text-[10px] ${
                                telemetry?.exitReached ? 'text-emerald-400' : 'text-slate-400'
                              }`}
                            >
                              {telemetry?.exitReached ? '[EXTRACTED]' : '[REQUIRED]'}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Traverse Cascade Gate and secure Temporal Anchor at X:730.
                          </p>
                        </div>
                      </div>
                    </>
                  ) : isSector2 ? (
                    <>
                      {/* Objective 1 (Sector 02) */}
                      <div className="flex items-start gap-2 bg-[#050910] p-2 rounded border border-cyan-950/60">
                        <div
                          className={`mt-0.5 ${
                            telemetry?.futureState.gateAnalysis?.futureIsOpen
                              ? 'text-emerald-400'
                              : 'text-amber-400'
                          }`}
                        >
                          <Zap className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-300 font-semibold">1. Predict 24s Gate Cycle</span>
                            <span
                              className={`text-[10px] ${
                                telemetry?.futureState.gateAnalysis?.futureIsOpen
                                  ? 'text-emerald-400'
                                  : 'text-amber-400'
                              }`}
                            >
                              {telemetry?.futureState.gateAnalysis?.futureIsOpen
                                ? '[T+60s OPEN]'
                                : '[T+60s CLOSED]'}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Use +60s preview to predict the 8s aperture window (t ∈ 14s-22s mod 24s).
                          </p>
                        </div>
                      </div>

                      {/* Objective 2 (Sector 02) */}
                      <div className="flex items-start gap-2 bg-[#050910] p-2 rounded border border-cyan-950/60">
                        <div
                          className={`mt-0.5 ${
                            telemetry?.futureState.interceptWarning
                              ? 'text-rose-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          <Radio className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-300 font-semibold">2. Evade Flux Sentinels</span>
                            <span
                              className={`text-[10px] ${
                                telemetry?.futureState.interceptWarning
                                  ? 'text-rose-400'
                                  : 'text-emerald-400'
                              }`}
                            >
                              {telemetry?.futureState.interceptWarning
                                ? '[HAZARD ALERT]'
                                : '[CLEAR]'}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Dodge vertical drones and rotary gate sweeper using future projections.
                          </p>
                        </div>
                      </div>

                      {/* Objective 3 (Sector 02) */}
                      <div className="flex items-start gap-2 bg-[#050910] p-2 rounded border border-cyan-950/60">
                        <div className="mt-0.5 text-cyan-400">
                          <Key className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-300 font-semibold">3. Staging Cove Holding</span>
                            <span className="text-[10px] text-cyan-400">
                              {telemetry && (telemetry.playerPos.x > 360 && telemetry.playerPos.x < 460)
                                ? '[DOCKED IN COVE]'
                                : '[COVE READY]'}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Hold in North or South cove until the +60s transit window opens.
                          </p>
                        </div>
                      </div>

                      {/* Objective 4 (Sector 02) */}
                      <div className="flex items-start gap-2 bg-[#050910] p-2 rounded border border-cyan-950/60">
                        <div
                          className={`mt-0.5 ${
                            telemetry?.exitReached ? 'text-emerald-400' : 'text-cyan-400'
                          }`}
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-300 font-semibold">4. Omega Anchor Extraction</span>
                            <span
                              className={`text-[10px] ${
                                telemetry?.exitReached ? 'text-emerald-400' : 'text-slate-400'
                              }`}
                            >
                              {telemetry?.exitReached ? '[EXTRACTED]' : '[REQUIRED]'}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Pass through open Future Gate and secure Omega Anchor at X:740.
                          </p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Objective 1 (Sector 01) */}
                      <div className="flex items-start gap-2 bg-[#050910] p-2 rounded border border-cyan-950/60">
                        <div
                          className={`mt-0.5 ${
                            telemetry?.activeNodesCount === telemetry?.totalNodesCount
                              ? 'text-emerald-400'
                              : 'text-amber-400'
                          }`}
                        >
                          <Zap className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-300 font-semibold">1. Power Conduits</span>
                            <span className="text-[10px] text-cyan-400">
                              {telemetry?.activeNodesCount ?? 0}/{telemetry?.totalNodesCount ?? 2}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Synchronize Alpha and Beta nodes to unlock blast gate.
                          </p>
                        </div>
                      </div>

                      {/* Objective 2 (Sector 01) */}
                      <div className="flex items-start gap-2 bg-[#050910] p-2 rounded border border-cyan-950/60">
                        <div
                          className={`mt-0.5 ${
                            telemetry?.doorUnlocked ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          <Key className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-300 font-semibold">2. Blast Gate Clearance</span>
                            <span
                              className={`text-[10px] ${
                                telemetry?.doorUnlocked ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                            >
                              {telemetry?.doorUnlocked ? '[UNLOCKED]' : '[LOCKED]'}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Pass into the eastern Chrono Interceptor chamber.
                          </p>
                        </div>
                      </div>

                      {/* Objective 3 (Sector 01) */}
                      <div className="flex items-start gap-2 bg-[#050910] p-2 rounded border border-cyan-950/60">
                        <div
                          className={`mt-0.5 ${
                            telemetry?.isPreviewActive
                              ? telemetry?.futureState.interceptWarning
                                ? 'text-rose-400'
                                : 'text-emerald-400'
                              : 'text-slate-500'
                          }`}
                        >
                          <Radio className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-300 font-semibold">3. 60s Temporal Preview</span>
                            <span
                              className={`text-[10px] ${
                                telemetry?.isPreviewActive
                                  ? telemetry?.futureState.interceptWarning
                                    ? '[INTERCEPT]'
                                    : '[PREVIEW ACTIVE]'
                                  : '[STANDBY]'
                              }`}
                            >
                              {telemetry?.isPreviewActive
                                ? telemetry?.futureState.interceptWarning
                                  ? '[INTERCEPT]'
                                  : '[PREVIEW ACTIVE]'
                                : '[STANDBY]'}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Predict Chrono Interceptor Omega&apos;s +60s flight path.
                          </p>
                        </div>
                      </div>

                      {/* Objective 4 (Sector 01) */}
                      <div className="flex items-start gap-2 bg-[#050910] p-2 rounded border border-cyan-950/60">
                        <div
                          className={`mt-0.5 ${
                            telemetry?.exitReached ? 'text-emerald-400' : 'text-cyan-400'
                          }`}
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-300 font-semibold">4. Temporal Anchor</span>
                            <span
                              className={`text-[10px] ${
                                telemetry?.exitReached ? 'text-emerald-400' : 'text-slate-400'
                              }`}
                            >
                              {telemetry?.exitReached ? '[EXTRACTED]' : '[REQUIRED]'}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Reach the anchor safely without future hazard interception.
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Kinetic Telemetry Readout */}
              <div className="mt-3 pt-3 border-t border-cyan-950/80 grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-400">
                <div>
                  <span className="text-slate-500">PROBE SPEED</span>
                  <p className="text-cyan-300 font-semibold">{telemetry?.playerSpeed ?? 0} px/s</p>
                </div>
                <div>
                  <span className="text-slate-500">WALL IMPACTS</span>
                  <p className="text-amber-400 font-semibold">{telemetry?.collisionCount ?? 0}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Sector Clear Completion Modal Overlay */}
      {telemetry?.status === 'SECTOR_CLEAR' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#090e17] border border-cyan-500/80 rounded-xl p-6 max-w-md w-full shadow-[0_0_40px_rgba(0,240,255,0.25)] flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-full bg-cyan-950/80 border-2 border-cyan-400 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(0,240,255,0.4)]">
              <ShieldCheck className="w-8 h-8 text-cyan-300" />
            </div>

            <span className="text-[11px] font-mono px-2.5 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-700/60 mb-2">
              TIMELINE EXTRACTION CONFIRMED
            </span>

            <h2 className="text-xl font-mono font-bold text-slate-100 tracking-wider uppercase mb-1">
              {isSector4
                ? 'SECTOR 04 CLEARED — EXPERIMENT COMPLETE'
                : isSector3
                ? 'SECTOR 03 CLEARED'
                : isSector2
                ? 'SECTOR 02 CLEARED'
                : 'SECTOR 01 CLEARED'}
            </h2>
            <p className="text-sm font-mono text-cyan-400 mb-3">
              {isSector4
                ? 'TEMPORAL LOCK MASTER SYNCHRONIZATION'
                : isSector3
                ? 'TEMPORAL CASCADE SYNCHRONIZED'
                : isSector2
                ? 'FUTURE GATE SECURED'
                : 'CALIBRATION COMPLETED'}
            </p>

            <p className="text-xs font-mono text-slate-300 mb-6 leading-relaxed">
              {isSector4
                ? 'The ultimate temporal challenge has been conquered. Simultaneous multi-condition alignment (15s Overseer + 24s Aperture + Safe Corridor) solved through disciplined T+60 foresight. All temporal sectors unified.'
                : isSector3
                ? 'Dual multi-period cycles (16s drone × 24s gate) successfully synchronized using +60s temporal preview. Cascade Anchor extracted with complete temporal integrity.'
                : isSector2
                ? 'Deterministic 24s temporal aperture cycle predicted and traversed using +60s foresight. Flux Sentinels evaded and Omega Anchor synchronized.'
                : 'Conduits synchronized, Chrono Interceptor flight path predicted, and Temporal Anchor extracted with intact timeline cohesion.'}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 w-full font-mono text-xs">
              {isSector4 ? (
                <>
                  <button
                    id="btn-replay-sec4"
                    onClick={handleRestart}
                    className="flex-1 py-2.5 px-4 bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold rounded-lg transition cursor-pointer shadow-[0_0_15px_rgba(244,63,94,0.4)]"
                  >
                    REPLAY SECTOR 04
                  </button>
                  <button
                    id="btn-return-sec1-final"
                    onClick={() => handleSelectSector('SEC-01')}
                    className="flex-1 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-lg transition cursor-pointer"
                  >
                    RETURN TO SEC-01
                  </button>
                </>
              ) : isSector3 ? (
                <>
                  <button
                    id="btn-proceed-sec4"
                    onClick={() => handleSelectSector('SEC-04')}
                    className="flex-1 py-2.5 px-4 bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold rounded-lg transition cursor-pointer shadow-[0_0_15px_rgba(244,63,94,0.4)] flex items-center justify-center gap-1.5"
                  >
                    <span>FINAL: SEC-04 TEMPORAL LOCK</span>
                    <span>→</span>
                  </button>
                  <button
                    id="btn-replay-sec3"
                    onClick={handleRestart}
                    className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-lg transition cursor-pointer"
                  >
                    REPLAY
                  </button>
                </>
              ) : isSector2 ? (
                <>
                  <button
                    id="btn-proceed-sec3"
                    onClick={() => handleSelectSector('SEC-03')}
                    className="flex-1 py-2.5 px-4 bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold rounded-lg transition cursor-pointer shadow-[0_0_15px_rgba(192,132,252,0.4)] flex items-center justify-center gap-1.5"
                  >
                    <span>SECTOR 03: CASCADE</span>
                    <span>→</span>
                  </button>
                  <button
                    id="btn-replay-sec2"
                    onClick={handleRestart}
                    className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-lg transition cursor-pointer"
                  >
                    REPLAY
                  </button>
                </>
              ) : (
                <>
                  <button
                    id="btn-proceed-sec2"
                    onClick={() => handleSelectSector('SEC-02')}
                    className="flex-1 py-2.5 px-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg transition cursor-pointer shadow-[0_0_15px_rgba(0,240,255,0.3)] flex items-center justify-center gap-1.5"
                  >
                    <span>SECTOR 02: FUTURE GATE</span>
                    <span>→</span>
                  </button>
                  <button
                    id="btn-replay-sec1"
                    onClick={handleRestart}
                    className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-lg transition cursor-pointer"
                  >
                    REPLAY
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Touch Screen Virtual D-Pad Overlay (Mobile Only) */}
      <ControlOverlay
        onInputStateChange={handleInputStateChange}
        onRestart={handleRestart}
        onTogglePreview={handleTogglePreview}
      />
        </>
      )}

      {/* How To Play Modal */}
      <HowToPlayModal
        isOpen={showHowToPlay}
        onClose={() => setShowHowToPlay(false)}
        onStartGame={gameState === 'TITLE' ? handleStartNewGame : undefined}
      />

      {/* Controls Modal */}
      <ControlsModal
        isOpen={showControls}
        onClose={() => setShowControls(false)}
        onStartGame={gameState === 'TITLE' ? handleStartNewGame : undefined}
      />

      {/* Sector Briefing Modal */}
      <SectorBriefingModal
        isOpen={briefingState.isOpen}
        sectorId={briefingState.sectorId}
        isFirstTimeOnboarding={briefingState.isFirstTimeOnboarding}
        onEnterSector={handleEnterSectorFromBriefing}
      />
    </div>
  );
}
