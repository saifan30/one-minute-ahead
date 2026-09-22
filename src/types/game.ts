export interface Vector2D {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Wall extends Rect {
  id: string;
  type: 'solid' | 'laser' | 'door';
  label?: string;
  isActive?: boolean;
  color?: string;
}

export interface InteractiveElement {
  id: string;
  type: 'conduit' | 'pressure_plate' | 'terminal' | 'exit_portal';
  x: number;
  y: number;
  radius: number;
  label: string;
  isActivated: boolean;
  linkedWallId?: string; // e.g. door it unlocks
  requiredTrigger?: boolean;
}

export interface Hazard {
  id: string;
  type: 'patrol_drone' | 'laser_sweep';
  label: string;
  radius: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  period: number; // Cycle duration in seconds
  phaseOffset?: number;
}

export interface HazardState {
  id: string;
  x: number;
  y: number;
  radius: number;
  label: string;
  speed: number;
  heading: number;
}

export interface TrajectoryPoint {
  x: number;
  y: number;
  timeOffset: number;
  hasCollision?: boolean;
}

export interface HazardShadowNode {
  id: string;
  label: string;
  timeOffset: number;
  x: number;
  y: number;
  radius: number;
  heading: number;
}

export interface RouteAnalysis {
  northStatus: 'SAFE' | 'HAZARDOUS';
  southStatus: 'SAFE' | 'HAZARDOUS';
  hazardFutureY: number;
  recommendedRoute: 'NORTH' | 'SOUTH';
}

export interface GateAnalysis {
  presentIsOpen: boolean;
  presentPhase: number;
  presentNextTransition: number;
  futureIsOpen: boolean;
  futurePhase: number;
  futureNextTransition: number;
  cyclePeriod: number;
  openDuration: number;
  arrivalGateOpen?: boolean;
  arrivalTime?: number;
  statusLabel:
    | 'FUTURE GATE: OPEN'
    | 'FUTURE GATE: CLOSED'
    | 'TEMPORAL LOCK: OPEN'
    | 'TEMPORAL LOCK: CLOSED'
    | 'TIMELINE: NOMINAL'
    | 'UNSAFE TRANSIT';
}

export interface LockAnalysis {
  allSatisfied: boolean;
  gateApertureOpen: boolean;
  overseerSweepClear: boolean;
  playerInSafeCorridor: boolean;
  northRouteStatus: 'SAFE' | 'HAZARD_INTERCEPT' | 'LOCK_BLOCKED';
  southRouteStatus: 'SAFE' | 'HAZARD_INTERCEPT' | 'LOCK_BLOCKED';
  futureOverseerY: number;
  presentGateIsOpen: boolean;
  futureGateIsOpen: boolean;
  recommendedApproach: 'NORTH_SANCTUARY' | 'SOUTH_SANCTUARY' | 'HOLD_INGRESS';
  lockStatusLabel:
    | 'TIMELINE: NOMINAL'
    | 'INTERCEPTION HAZARD'
    | 'TEMPORAL LOCK: OPEN'
    | 'TEMPORAL LOCK: CLOSED';
  secondsUntilWindow: number;
  gatePhase: number;
  overseerPhase: number;
}

export interface CascadeAnalysis {
  currentHazardState: 'NORTH_ROUTE' | 'SOUTH_ROUTE' | 'TRANSIT_SWEEP';
  futureHazardState: 'NORTH_ROUTE' | 'SOUTH_ROUTE' | 'TRANSIT_SWEEP';
  futureHazardY: number;
  currentGateState: 'OPEN' | 'CLOSED';
  futureGateState: 'OPEN' | 'CLOSED';
  recommendedRoute: 'NORTH_CASCADE' | 'SOUTH_CASCADE' | 'HOLD_POCKET';
  routeSafety: {
    north: 'SAFE' | 'HAZARD_INTERCEPT' | 'GATE_BLOCKED';
    south: 'SAFE' | 'HAZARD_INTERCEPT' | 'GATE_BLOCKED';
  };
  cascadeStatusLabel:
    | 'TIMELINE: NOMINAL'
    | 'TEMPORAL CASCADE WARNING'
    | 'FUTURE INTERCEPT'
    | 'FUTURE GATE: OPEN'
    | 'FUTURE GATE: CLOSED';
  secondsUntilWindow: number;
  gatePhase: number;
  hazardPhase: number;
}

export interface FutureSimulationState {
  timeHorizon: number; // Exactly 60.0
  predictedElapsed: number; // Current elapsed + 60.0
  playerPos: Vector2D;
  playerVelocity: Vector2D;
  playerAngle: number;
  playerSpeed: number;
  trajectory: TrajectoryPoint[];
  hazards: HazardState[];
  hazardShadows?: HazardShadowNode[];
  routeAnalysis?: RouteAnalysis;
  gateAnalysis?: GateAnalysis;
  cascadeAnalysis?: CascadeAnalysis;
  lockAnalysis?: LockAnalysis;
  conduits: { id: string; label: string; isActivated: boolean; x: number; y: number }[];
  doorUnlocked: boolean;
  exitReached: boolean;
  interceptWarning: boolean;
  interceptTime?: number;
  interceptHazardLabel?: string;
  timelineStatus:
    | 'TIMELINE_NOMINAL'
    | 'INTERCEPTION_HAZARD'
    | 'EXTRACTION_REACHED'
    | 'STABLE'
    | 'HAZARD_INTERCEPT';
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  alpha: number;
}

export type GameStatus = 'RUNNING' | 'PAUSED' | 'SECTOR_CLEAR' | 'RESETTING';

export interface GameTelemetry {
  status: GameStatus;
  elapsedSeconds: number;
  activeSectorId: string;
  activeSectorName: string;
  playerPos: Vector2D;
  playerVelocity: Vector2D;
  playerSpeed: number;
  activeNodesCount: number;
  totalNodesCount: number;
  doorUnlocked: boolean;
  exitReached: boolean;
  collisionCount: number;
  fps: number;
  isPreviewActive: boolean;
  hazards: HazardState[];
  futureState: FutureSimulationState;
  courseWaypoint: Vector2D | null;
  temporalInterceptionAlert?: string | null;
}

export interface InputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  interact: boolean;
  restart: boolean;
  pause: boolean;
  togglePreview: boolean;
}
