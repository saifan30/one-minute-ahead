import { Hazard, HazardState, InteractiveElement, Wall } from '../types/game';

export interface SectorData {
  id: string;
  name: string;
  description: string;
  width: number;
  height: number;
  spawnPoint: { x: number; y: number };
  walls: Wall[];
  interactiveElements: InteractiveElement[];
  hazards: Hazard[];
}

export function evaluateHazardState(hazard: Hazard, elapsedSeconds: number): HazardState {
  const phase = ((elapsedSeconds + (hazard.phaseOffset || 0)) % hazard.period) / hazard.period;
  // Smooth cosine ping-pong interpolation
  const t = (1 - Math.cos(phase * Math.PI * 2)) / 2;
  const x = hazard.startX + (hazard.endX - hazard.startX) * t;
  const y = hazard.startY + (hazard.endY - hazard.startY) * t;

  // Velocity derivative to calculate heading and speed
  const dt = 0.05;
  const phaseNext = ((elapsedSeconds + (hazard.phaseOffset || 0) + dt) % hazard.period) / hazard.period;
  const tNext = (1 - Math.cos(phaseNext * Math.PI * 2)) / 2;
  const nextX = hazard.startX + (hazard.endX - hazard.startX) * tNext;
  const nextY = hazard.startY + (hazard.endY - hazard.startY) * tNext;

  const dx = (nextX - x) / dt;
  const dy = (nextY - y) / dt;
  const speed = Math.hypot(dx, dy);
  const heading = Math.atan2(dy, dx);

  return {
    id: hazard.id,
    x,
    y,
    radius: hazard.radius,
    label: hazard.label,
    speed,
    heading,
  };
}

export function createTestingChamber(): SectorData {
  const width = 840;
  const height = 540;
  const wallThickness = 24;

  const walls: Wall[] = [
    // Outer perimeter boundaries
    { id: 'wall-top', x: 0, y: 0, width: width, height: wallThickness, type: 'solid' },
    { id: 'wall-bottom', x: 0, y: height - wallThickness, width: width, height: wallThickness, type: 'solid' },
    { id: 'wall-left', x: 0, y: 0, width: wallThickness, height: height, type: 'solid' },
    { id: 'wall-right', x: width - wallThickness, y: 0, width: wallThickness, height: height, type: 'solid' },

    // Left chamber division wall with passage
    { id: 'wall-div-left-top', x: 260, y: wallThickness, width: 20, height: 180, type: 'solid' },
    { id: 'wall-div-left-bottom', x: 260, y: 320, width: 20, height: height - 320 - wallThickness, type: 'solid' },

    // Central chamber pillars / baffles
    { id: 'pillar-1', x: 380, y: 120, width: 60, height: 60, type: 'solid', label: 'CORE_PYLON_A' },
    { id: 'pillar-2', x: 380, y: 360, width: 60, height: 60, type: 'solid', label: 'CORE_PYLON_B' },
    { id: 'pillar-center', x: 500, y: 220, width: 40, height: 100, type: 'solid', label: 'CENTRAL_HEATSINK' },

    // Right gate divider with blast door
    { id: 'wall-div-right-top', x: 620, y: wallThickness, width: 20, height: 170, type: 'solid' },
    { id: 'wall-div-right-bottom', x: 620, y: 350, width: 20, height: height - 350 - wallThickness, type: 'solid' },
    
    // Blast Door barrier (isActive is toggled by power conduits)
    {
      id: 'door-extraction-gate',
      x: 620,
      y: 194,
      width: 20,
      height: 156,
      type: 'door',
      isActive: true,
      label: 'BLAST_GATE_T1',
      color: '#ef4444',
    },

    // Central Divider in East Extraction Chamber (creates two distinct North and South approaches)
    {
      id: 'baffle-east-center',
      x: 678,
      y: 220,
      width: 14,
      height: 100,
      type: 'solid',
      label: 'DIVIDER',
    },
  ];

  const interactiveElements: InteractiveElement[] = [
    // Conduit Alpha (North-West wing)
    {
      id: 'conduit-alpha',
      type: 'conduit',
      x: 140,
      y: 110,
      radius: 20,
      label: 'CONDUIT_α',
      isActivated: false,
    },
    // Conduit Beta (South-Central wing)
    {
      id: 'conduit-beta',
      type: 'conduit',
      x: 410,
      y: 270,
      radius: 20,
      label: 'CONDUIT_β',
      isActivated: false,
    },
    // Pressure switch / terminal (South-West auxiliary)
    {
      id: 'plate-gamma',
      type: 'pressure_plate',
      x: 140,
      y: 430,
      radius: 24,
      label: 'STABILIZER_γ',
      isActivated: false,
    },
    // Extraction Portal / Temporal Anchor (East wing behind blast door and approach divider)
    {
      id: 'portal-exit',
      type: 'exit_portal',
      x: 760,
      y: 270,
      radius: 28,
      label: 'TEMPORAL_ANCHOR',
      isActivated: false,
      linkedWallId: 'door-extraction-gate',
    },
  ];

  const hazards: Hazard[] = [
    // Sentinel Drone Alpha - patrols vertical access lane between chamber partition and pylon
    {
      id: 'hazard-sentinel-alpha',
      type: 'patrol_drone',
      label: 'SENTINEL_α',
      radius: 16,
      startX: 200,
      startY: 90,
      endX: 200,
      endY: 450,
      period: 8.0, // 8.0s cycle
      phaseOffset: 0,
    },
    // Sweeper Drone Beta - patrols horizontal corridor between central pylons
    {
      id: 'hazard-sentinel-beta',
      type: 'patrol_drone',
      label: 'SWEEPER_β',
      radius: 16,
      startX: 330,
      startY: 270,
      endX: 560,
      endY: 270,
      period: 10.0, // 10.0s cycle
      phaseOffset: 1.5,
    },
    // Chrono Interceptor Omega - Moving temporal hazard patrolling the North & South approaches
    // 24.0s harmonic cycle: In exactly +60.00s, phase advances by 2.5 cycles (180 deg opposite)
    // Periodically shifts which approach is hazardous vs safe in the predicted future
    {
      id: 'hazard-chrono-omega',
      type: 'patrol_drone',
      label: 'CHRONO_INTERCEPTOR_Ω',
      radius: 25,
      startX: 720,
      startY: 120, // North Approach Corridor Hub
      endX: 720,
      endY: 420,   // South Approach Corridor Hub
      period: 24.0,
      phaseOffset: 0,
    },
  ];

  return {
    id: 'SEC-01',
    name: 'Sector 01: Temporal Calibration Hub',
    description: 'Synchronize power conduits, unlock the blast gate, and use the 60-second temporal preview to bypass Chrono Interceptor Omega to reach the Temporal Anchor.',
    width,
    height,
    spawnPoint: { x: 90, y: 270 },
    walls,
    interactiveElements,
    hazards,
  };
}

export const FUTURE_GATE_CONFIG = {
  cyclePeriod: 24.0,
  openDuration: 8.0,
  openStartPhase: 14.0, // Open from 14.0s to 22.0s in cycle
};

export function isTemporalGateOpen(elapsedSeconds: number): boolean {
  const phase = (elapsedSeconds % FUTURE_GATE_CONFIG.cyclePeriod);
  return phase >= FUTURE_GATE_CONFIG.openStartPhase && 
         phase < (FUTURE_GATE_CONFIG.openStartPhase + FUTURE_GATE_CONFIG.openDuration);
}

export function getTemporalGateState(elapsedSeconds: number) {
  const period = FUTURE_GATE_CONFIG.cyclePeriod;
  const openDuration = FUTURE_GATE_CONFIG.openDuration;
  const openStart = FUTURE_GATE_CONFIG.openStartPhase;
  const openEnd = openStart + openDuration;
  const phase = elapsedSeconds % period;
  const isOpen = phase >= openStart && phase < openEnd;

  let timeUntilNextState: number;
  if (isOpen) {
    timeUntilNextState = openEnd - phase;
  } else {
    timeUntilNextState = phase < openStart ? (openStart - phase) : (period - phase + openStart);
  }

  return {
    isOpen,
    phase,
    period,
    openDuration,
    timeUntilNextState,
  };
}

export function createFutureGateChamber(): SectorData {
  const width = 840;
  const height = 540;
  const wallThickness = 24;

  const walls: Wall[] = [
    // Outer perimeter boundaries
    { id: 'sec2-wall-top', x: 0, y: 0, width, height: wallThickness, type: 'solid' },
    { id: 'sec2-wall-bottom', x: 0, y: height - wallThickness, width, height: wallThickness, type: 'solid' },
    { id: 'sec2-wall-left', x: 0, y: 0, width: wallThickness, height, type: 'solid' },
    { id: 'sec2-wall-right', x: width - wallThickness, y: 0, width: wallThickness, height, type: 'solid' },

    // Western Staging Bay Partition (wide 192px central clearance)
    { id: 'sec2-part-top', x: 200, y: wallThickness, width: 20, height: 150, type: 'solid', label: 'PYLON_WEST_N' },
    { id: 'sec2-part-bottom', x: 200, y: 366, width: 20, height: height - 366 - wallThickness, type: 'solid', label: 'PYLON_WEST_S' },

    // Central Chamber Insulators & Tactical Staging Coves
    { id: 'sec2-center-core', x: 320, y: 235, width: 30, height: 70, type: 'solid', label: 'FLUX_STABILIZER' },
    { id: 'sec2-cove-top', x: 380, y: 140, width: 80, height: 18, type: 'solid', label: 'STAGING_COVE_N' },
    { id: 'sec2-cove-bottom', x: 380, y: 382, width: 80, height: 18, type: 'solid', label: 'STAGING_COVE_S' },

    // Future Gate Security Partition (x: 580)
    { id: 'sec2-gate-top', x: 580, y: wallThickness, width: 20, height: 190, type: 'solid', label: 'GATE_TERMINAL_N' },
    { id: 'sec2-gate-bottom', x: 580, y: 326, width: 20, height: height - 326 - wallThickness, type: 'solid', label: 'GATE_TERMINAL_S' },

    // Temporal Security Gate Barrier (dynamic cyclic aperture)
    {
      id: 'gate-temporal-aperture',
      x: 580,
      y: 214,
      width: 20,
      height: 112,
      type: 'door',
      isActive: true,
      label: 'FUTURE_GATE',
      color: '#f59e0b',
    },
  ];

  const interactiveElements: InteractiveElement[] = [
    // Resonator Node in West Staging Bay
    {
      id: 'conduit-sec2-sync',
      type: 'conduit',
      x: 110,
      y: 270,
      radius: 20,
      label: 'CHRONO_SYNC_α',
      isActivated: false,
    },
    // Final Omega Extraction Anchor behind the Future Gate
    {
      id: 'portal-exit-sec2',
      type: 'exit_portal',
      x: 740,
      y: 270,
      radius: 28,
      label: 'OMEGA_ANCHOR',
      isActivated: false,
      linkedWallId: 'gate-temporal-aperture',
    },
  ];

  const hazards: Hazard[] = [
    // Flux Pulse Drone A (North Central Corridor)
    {
      id: 'hazard-flux-sentinel-1',
      type: 'patrol_drone',
      label: 'FLUX_SENTINEL_A',
      radius: 15,
      startX: 260,
      startY: 190,
      endX: 470,
      endY: 190,
      period: 6.0,
      phaseOffset: 0,
    },
    // Flux Pulse Drone B (South Central Corridor)
    {
      id: 'hazard-flux-sentinel-2',
      type: 'patrol_drone',
      label: 'FLUX_SENTINEL_B',
      radius: 15,
      startX: 470,
      startY: 350,
      endX: 260,
      endY: 350,
      period: 6.0,
      phaseOffset: 1.0,
    },
    // Gate Sweeper Gamma (sweeps the gate approach line at x=535, preventing camping)
    {
      id: 'hazard-gate-sweeper',
      type: 'patrol_drone',
      label: 'GATE_SWEEPER_Γ',
      radius: 18,
      startX: 535,
      startY: 160,
      endX: 535,
      endY: 380,
      period: 8.0,
      phaseOffset: 0,
    },
  ];

  return {
    id: 'SEC-02',
    name: 'Sector 02: Future Gate',
    description: 'Use the 60-second temporal preview to calculate the deterministic opening of the Future Gate. Evade the Flux Sentinels, hold in the staging coves, and sprint through during the predicted aperture window.',
    width,
    height,
    spawnPoint: { x: 80, y: 270 },
    walls,
    interactiveElements,
    hazards,
  };
}

export const CASCADE_CONFIG = {
  cyclePeriod: 24.0,
  openDuration: 8.0,
  openStartPhase: 12.0, // Open from 12.0s to 20.0s in 24.0s cycle
  hazardPeriod: 16.0,
};

export function isCascadeGateOpen(elapsedSeconds: number): boolean {
  const phase = elapsedSeconds % CASCADE_CONFIG.cyclePeriod;
  return (
    phase >= CASCADE_CONFIG.openStartPhase &&
    phase < CASCADE_CONFIG.openStartPhase + CASCADE_CONFIG.openDuration
  );
}

export function getCascadeGateState(elapsedSeconds: number) {
  const period = CASCADE_CONFIG.cyclePeriod;
  const openDuration = CASCADE_CONFIG.openDuration;
  const openStart = CASCADE_CONFIG.openStartPhase;
  const openEnd = openStart + openDuration;
  const phase = elapsedSeconds % period;
  const isOpen = phase >= openStart && phase < openEnd;

  let timeUntilNextState: number;
  if (isOpen) {
    timeUntilNextState = openEnd - phase;
  } else {
    timeUntilNextState = phase < openStart ? openStart - phase : period - phase + openStart;
  }

  return {
    isOpen,
    phase,
    period,
    openDuration,
    timeUntilNextState,
  };
}

export function createTemporalCascadeChamber(): SectorData {
  const width = 840;
  const height = 540;
  const wallThickness = 24;

  const walls: Wall[] = [
    // Outer perimeter boundaries
    { id: 'sec3-wall-top', x: 0, y: 0, width, height: wallThickness, type: 'solid' },
    { id: 'sec3-wall-bottom', x: 0, y: height - wallThickness, width, height: wallThickness, type: 'solid' },
    { id: 'sec3-wall-left', x: 0, y: 0, width: wallThickness, height, type: 'solid' },
    { id: 'sec3-wall-right', x: width - wallThickness, y: 0, width: wallThickness, height, type: 'solid' },

    // West Ingress Division Pylons (leaving two wide 76px corridors North and South)
    { id: 'sec3-part-top', x: 180, y: wallThickness, width: 20, height: 120, type: 'solid', label: 'PYLON_W_N' },
    { id: 'sec3-part-center', x: 180, y: 220, width: 20, height: 100, type: 'solid', label: 'PYLON_W_C' },
    { id: 'sec3-part-bottom', x: 180, y: 396, width: 20, height: height - 396 - wallThickness, type: 'solid', label: 'PYLON_W_S' },

    // Central Cascade Reactor Core (forces distinct North and South transit routes)
    {
      id: 'sec3-reactor-core',
      x: 270,
      y: 195,
      width: 170,
      height: 150,
      type: 'solid',
      label: 'CASCADE_CORE',
    },

    // Tactical Staging Pockets in North and South corridors
    { id: 'sec3-pocket-n', x: 340, y: 70, width: 50, height: 16, type: 'solid', label: 'STAGING_N' },
    { id: 'sec3-pocket-s', x: 340, y: 454, width: 50, height: 16, type: 'solid', label: 'STAGING_S' },

    // Gate Partition at x: 550
    { id: 'sec3-gate-top', x: 550, y: wallThickness, width: 20, height: 180, type: 'solid', label: 'GATE_TERMINAL_N' },
    { id: 'sec3-gate-bottom', x: 550, y: 336, width: 20, height: height - 336 - wallThickness, type: 'solid', label: 'GATE_TERMINAL_S' },

    // Temporal Security Gate Aperture (Cyclic 24s period)
    {
      id: 'gate-cascade-aperture',
      x: 550,
      y: 204,
      width: 20,
      height: 132,
      type: 'door',
      isActive: true,
      label: 'CASCADE_GATE',
      color: '#c084fc',
    },

    // East Extraction Deflection Pylons (leaving clear 160px central channel to anchor)
    { id: 'sec3-deflect-n', x: 630, y: 120, width: 20, height: 70, type: 'solid', label: 'DEFLECTOR_N' },
    { id: 'sec3-deflect-s', x: 630, y: 350, width: 20, height: 70, type: 'solid', label: 'DEFLECTOR_S' },
  ];

  const interactiveElements: InteractiveElement[] = [
    // Quantum Cascade Relay Node in West Ingress
    {
      id: 'conduit-cascade-sync',
      type: 'conduit',
      x: 100,
      y: 270,
      radius: 20,
      label: 'CASCADE_SYNC',
      isActivated: false,
    },
    // Final Cascade Extraction Anchor
    {
      id: 'portal-exit-sec3',
      type: 'exit_portal',
      x: 730,
      y: 270,
      radius: 28,
      label: 'CASCADE_ANCHOR',
      isActivated: false,
      linkedWallId: 'gate-cascade-aperture',
    },
  ];

  const hazards: Hazard[] = [
    // Chrono Cascade Interceptor - Moving harmonic hazard sweeping the junction lines between North and South corridors
    {
      id: 'hazard-cascade-drone',
      type: 'patrol_drone',
      label: 'CASCADE_INTERCEPTOR_Ω',
      radius: 22,
      startX: 490,
      startY: 110,
      endX: 490,
      endY: 430,
      period: 16.0, // 16s period interacts with 24s gate cycle (LCM = 48s)
      phaseOffset: 0,
    },
    // Gate Aperture Guardian - Sweeps aperture approach to prevent camping
    {
      id: 'hazard-cascade-sweeper',
      type: 'patrol_drone',
      label: 'APERTURE_GUARDIAN_Γ',
      radius: 15,
      startX: 525,
      startY: 230,
      endX: 525,
      endY: 310,
      period: 5.0,
      phaseOffset: 0,
    },
    // Patrol Drone North Corridor
    {
      id: 'hazard-sentinel-north',
      type: 'patrol_drone',
      label: 'CASCADE_SENTRY_N',
      radius: 14,
      startX: 220,
      startY: 110,
      endX: 320,
      endY: 110,
      period: 6.0,
      phaseOffset: 0,
    },
    // Patrol Drone South Corridor
    {
      id: 'hazard-sentinel-south',
      type: 'patrol_drone',
      label: 'CASCADE_SENTRY_S',
      radius: 14,
      startX: 320,
      startY: 430,
      endX: 220,
      endY: 430,
      period: 6.0,
      phaseOffset: 1.5,
    },
  ];

  return {
    id: 'SEC-03',
    name: 'Sector 03: Temporal Cascade',
    description: 'Coordinate multiple interacting future events: time the 16s Cascade Interceptor sweep across North and South routes with the deterministic 24s Cascade Gate aperture to reach the Cascade Anchor.',
    width,
    height,
    spawnPoint: { x: 80, y: 270 },
    walls,
    interactiveElements,
    hazards,
  };
}

export const TEMPORAL_LOCK_CONFIG = {
  cyclePeriod: 24.0,
  openDuration: 8.0,
  openStartPhase: 12.0, // Open from 12.0s to 20.0s in 24.0s cycle
  overseerPeriod: 15.0,
};

export function isTemporalLockGateOpen(elapsedSeconds: number): boolean {
  const phase = elapsedSeconds % TEMPORAL_LOCK_CONFIG.cyclePeriod;
  return (
    phase >= TEMPORAL_LOCK_CONFIG.openStartPhase &&
    phase < TEMPORAL_LOCK_CONFIG.openStartPhase + TEMPORAL_LOCK_CONFIG.openDuration
  );
}

export function getTemporalLockGateState(elapsedSeconds: number) {
  const period = TEMPORAL_LOCK_CONFIG.cyclePeriod;
  const openDuration = TEMPORAL_LOCK_CONFIG.openDuration;
  const openStart = TEMPORAL_LOCK_CONFIG.openStartPhase;
  const openEnd = openStart + openDuration;
  const phase = elapsedSeconds % period;
  const isOpen = phase >= openStart && phase < openEnd;

  let timeUntilNextState: number;
  if (isOpen) {
    timeUntilNextState = openEnd - phase;
  } else {
    timeUntilNextState = phase < openStart ? openStart - phase : period - phase + openStart;
  }

  return {
    isOpen,
    phase,
    period,
    openDuration,
    timeUntilNextState,
  };
}

export function createTemporalLockChamber(): SectorData {
  const width = 840;
  const height = 540;
  const wallThickness = 24;

  const walls: Wall[] = [
    // Outer perimeter boundaries
    { id: 'sec4-wall-top', x: 0, y: 0, width, height: wallThickness, type: 'solid' },
    { id: 'sec4-wall-bottom', x: 0, y: height - wallThickness, width, height: wallThickness, type: 'solid' },
    { id: 'sec4-wall-left', x: 0, y: 0, width: wallThickness, height, type: 'solid' },
    { id: 'sec4-wall-right', x: width - wallThickness, y: 0, width: wallThickness, height, type: 'solid' },

    // Ingress Western Partition at x: 180 (creates clear North and South channels)
    { id: 'sec4-part-top', x: 180, y: wallThickness, width: 20, height: 120, type: 'solid', label: 'LOCK_PYLON_W_N' },
    { id: 'sec4-part-center', x: 180, y: 215, width: 20, height: 110, type: 'solid', label: 'LOCK_CORE_SHIELD' },
    { id: 'sec4-part-bottom', x: 180, y: 396, width: 20, height: height - 396 - wallThickness, type: 'solid', label: 'LOCK_PYLON_W_S' },

    // Central Temporal Lock Core (Forces distinct North vs South approach routes)
    {
      id: 'sec4-lock-core',
      x: 270,
      y: 190,
      width: 180,
      height: 160,
      type: 'solid',
      label: 'TEMPORAL_LOCK_CORE',
    },

    // Tactical Holding Sanctuaries (safe observation coves)
    { id: 'sec4-sanctuary-n', x: 350, y: 64, width: 60, height: 18, type: 'solid', label: 'SANCTUARY_α' },
    { id: 'sec4-sanctuary-s', x: 350, y: 458, width: 60, height: 18, type: 'solid', label: 'SANCTUARY_β' },

    // Temporal Security Gate Barrier Wall at x: 570
    { id: 'sec4-gate-top', x: 570, y: wallThickness, width: 20, height: 186, type: 'solid', label: 'LOCK_TERMINAL_N' },
    { id: 'sec4-gate-bottom', x: 570, y: 330, width: 20, height: height - 330 - wallThickness, type: 'solid', label: 'LOCK_TERMINAL_S' },

    // Dynamic Temporal Lock Aperture (Cyclic 24s period)
    {
      id: 'gate-lock-aperture',
      x: 570,
      y: 210,
      width: 20,
      height: 120,
      type: 'door',
      isActive: true,
      label: 'TEMPORAL_LOCK',
      color: '#ec4899',
    },

    // East Anchor Vault Deflectors
    { id: 'sec4-deflect-n', x: 650, y: 110, width: 20, height: 80, type: 'solid', label: 'DEFLECTOR_N' },
    { id: 'sec4-deflect-s', x: 650, y: 350, width: 20, height: 80, type: 'solid', label: 'DEFLECTOR_S' },
  ];

  const interactiveElements: InteractiveElement[] = [
    // Quantum Master Resonance Relay Node in Ingress Bay
    {
      id: 'conduit-lock-master-sync',
      type: 'conduit',
      x: 95,
      y: 270,
      radius: 20,
      label: 'CHRONO_LOCK_SYNC',
      isActivated: false,
    },
    // Final Temporal Lock Extraction Anchor behind the Temporal Lock
    {
      id: 'portal-exit-sec4',
      type: 'exit_portal',
      x: 740,
      y: 270,
      radius: 28,
      label: 'TEMPORAL_LOCK_ANCHOR',
      isActivated: false,
      linkedWallId: 'gate-lock-aperture',
    },
  ];

  const hazards: Hazard[] = [
    // Temporal Lock Overseer - Sweeps the critical approach junction at x=510 with 15.0s harmonic cycle
    {
      id: 'hazard-lock-overseer',
      type: 'patrol_drone',
      label: 'LOCK_OVERSEER_Ω',
      radius: 22,
      startX: 510,
      startY: 100,
      endX: 510,
      endY: 440,
      period: 15.0,
      phaseOffset: 0,
    },
    // Aperture Lock Guardian - Rapid sweep directly in front of the Temporal Lock gate (x=545)
    {
      id: 'hazard-lock-guardian',
      type: 'patrol_drone',
      label: 'LOCK_GUARDIAN_Γ',
      radius: 15,
      startX: 545,
      startY: 230,
      endX: 545,
      endY: 310,
      period: 4.5,
      phaseOffset: 0,
    },
    // North Approach Rapid Sentry
    {
      id: 'hazard-lock-sentry-north',
      type: 'patrol_drone',
      label: 'LOCK_SENTRY_N',
      radius: 14,
      startX: 230,
      startY: 110,
      endX: 330,
      endY: 110,
      period: 6.0,
      phaseOffset: 0,
    },
    // South Approach Rapid Sentry
    {
      id: 'hazard-lock-sentry-south',
      type: 'patrol_drone',
      label: 'LOCK_SENTRY_S',
      radius: 14,
      startX: 330,
      startY: 430,
      endX: 230,
      endY: 430,
      period: 6.0,
      phaseOffset: 1.5,
    },
  ];

  return {
    id: 'SEC-04',
    name: 'Sector 04: Temporal Lock',
    description: 'Master the ultimate 60-second temporal puzzle: coordinate the 15s Lock Overseer sweep across North/South approaches with the 24s Temporal Lock aperture. Adjust present trajectory to make the future safe and achieve total timeline extraction.',
    width,
    height,
    spawnPoint: { x: 80, y: 270 },
    walls,
    interactiveElements,
    hazards,
  };
}

export function getSectorData(sectorId: string): SectorData {
  if (sectorId === 'SEC-04') {
    return createTemporalLockChamber();
  }
  if (sectorId === 'SEC-03') {
    return createTemporalCascadeChamber();
  }
  if (sectorId === 'SEC-02') {
    return createFutureGateChamber();
  }
  return createTestingChamber();
}
