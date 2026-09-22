import {
  CascadeAnalysis,
  FutureSimulationState,
  GateAnalysis,
  HazardState,
  InputState,
  LockAnalysis,
  TrajectoryPoint,
  Vector2D,
  Wall,
} from '../types/game';
import { resolveWallCollisions } from './collision';
import {
  evaluateHazardState,
  getCascadeGateState,
  getTemporalGateState,
  getTemporalLockGateState,
  isCascadeGateOpen,
  isTemporalGateOpen,
  isTemporalLockGateOpen,
  SectorData,
} from './environment';
import { Player } from './player';

export interface SimulationParams {
  player: Player;
  input: InputState;
  sector: SectorData;
  elapsedSeconds: number;
  courseWaypoint: Vector2D | null;
  horizonSeconds?: number;
}

/**
 * Deterministically predicts the game state exactly 60.0 seconds into the future.
 * Simulates player kinematics, wall collision responses, conduit triggers,
 * blast gate states, and moving hazard trajectories.
 */
export function runFutureSimulation({
  player,
  input,
  sector,
  elapsedSeconds,
  courseWaypoint,
  horizonSeconds = 60.0,
}: SimulationParams): FutureSimulationState {
  const steps = 180;
  const dt = horizonSeconds / steps;

  let simX = player.x;
  let simY = player.y;
  let simVx = player.vx;
  let simVy = player.vy;
  const radius = player.radius;
  const maxSpeed = player.maxSpeed;
  const acceleration = player.acceleration;
  const friction = player.friction;

  // Deep clone conduit states from present
  const conduits = sector.interactiveElements
    .filter((e) => e.type === 'conduit')
    .map((c) => ({
      id: c.id,
      label: c.label,
      isActivated: c.isActivated,
      x: c.x,
      y: c.y,
    }));

  let doorUnlocked = conduits.every((c) => c.isActivated);
  let exitReached = false;
  let interceptWarning = false;
  let interceptTime: number | undefined;
  let interceptHazardLabel: string | undefined;

  const trajectory: TrajectoryPoint[] = [
    { x: simX, y: simY, timeOffset: 0, hasCollision: false },
  ];

  // Run simulation forward over the 60.0 second horizon
  for (let step = 1; step <= steps; step++) {
    const simTimeOffset = step * dt;
    const currentSimTime = elapsedSeconds + simTimeOffset;

    // 1. Calculate active steering / thrust intent
    let ax = 0;
    let ay = 0;

    const hasKeyboardInput = input.up || input.down || input.left || input.right;

    if (hasKeyboardInput) {
      if (input.left) ax -= 1;
      if (input.right) ax += 1;
      if (input.up) ay -= 1;
      if (input.down) ay += 1;

      const len = Math.hypot(ax, ay);
      if (len > 0) {
        ax /= len;
        ay /= len;
      }
    } else if (courseWaypoint) {
      // Guide trajectory toward waypoint if set
      let targetX = courseWaypoint.x;
      let targetY = courseWaypoint.y;

      // In Sector 01: If simulated player reaches the approach corridor checkpoint, continue toward Temporal Anchor
      const distToWp = Math.hypot(targetX - simX, targetY - simY);
      if (sector.id === 'SEC-01' && distToWp < 28 && targetX >= 680 && (targetY < 180 || targetY > 360) && doorUnlocked) {
        targetX = 760;
        targetY = 270;
      }

      // In Sector 02: If simulated player passes through or reaches the Future Gate area, continue toward Omega Anchor
      if (sector.id === 'SEC-02' && (simX >= 590 || (distToWp < 28 && targetX >= 560 && targetX <= 600))) {
        targetX = 740;
        targetY = 270;
      }

      // In Sector 04: If simulated player passes through or reaches the Temporal Lock area, continue toward Lock Anchor
      if (sector.id === 'SEC-04') {
        if (simX >= 580 || (distToWp < 28 && targetX >= 550 && targetX <= 590)) {
          targetX = 740;
          targetY = 270;
        } else if (distToWp < 28 && (targetX >= 480 && targetX <= 530)) {
          // Reached North/South junction point, funnel into Temporal Lock aperture
          targetX = 570;
          targetY = 270;
        }
      }

      // In Sector 03: If simulated player passes through or reaches the Cascade Gate area, continue toward Cascade Anchor
      if (sector.id === 'SEC-03') {
        if (simX >= 560 || (distToWp < 28 && targetX >= 530 && targetX <= 570)) {
          targetX = 730;
          targetY = 270;
        } else if (distToWp < 28 && (targetX >= 470 && targetX <= 510)) {
          // Reached North/South junction point, funnel into gate aperture
          targetX = 550;
          targetY = 270;
        }
      }

      const dx = targetX - simX;
      const dy = targetY - simY;
      const dist = Math.hypot(dx, dy);
      if (dist > 14) {
        ax = dx / dist;
        ay = dy / dist;
      }
    }

    // Apply acceleration
    simVx += ax * acceleration * dt;
    simVy += ay * acceleration * dt;

    // Apply physics damping / friction
    const frictionFactor = Math.pow(friction, dt * 60);
    simVx *= frictionFactor;
    simVy *= frictionFactor;

    // Clamp to max speed
    const currentSpeed = Math.hypot(simVx, simVy);
    if (currentSpeed > maxSpeed) {
      simVx = (simVx / currentSpeed) * maxSpeed;
      simVy = (simVy / currentSpeed) * maxSpeed;
    }

    // Update position
    simX += simVx * dt;
    simY += simVy * dt;

    // 2. Prepare walls based on dynamic Future Gate, Cascade Gate, Temporal Lock, and blast door unlock states
    const wallsForStep: Wall[] = sector.walls.filter((w) => {
      // Sector 04 dynamic Temporal Lock aperture
      if (w.id === 'gate-lock-aperture') {
        const isOpen = isTemporalLockGateOpen(currentSimTime);
        return !isOpen;
      }
      // Sector 03 dynamic Cascade Gate aperture
      if (w.id === 'gate-cascade-aperture') {
        const isOpen = isCascadeGateOpen(currentSimTime);
        return !isOpen;
      }
      // Sector 02 dynamic Future Gate aperture
      if (w.id === 'gate-temporal-aperture') {
        const isOpen = isTemporalGateOpen(currentSimTime);
        return !isOpen; // Only collides when gate is closed
      }
      // Sector 01 blast door
      if (w.type === 'door' && doorUnlocked) {
        return false; // Door is open
      }
      return true;
    });

    // 3. Resolve wall collisions along predicted trajectory
    const dummyPlayer = {
      x: simX,
      y: simY,
      radius,
      vx: simVx,
      vy: simVy,
    };
    const colResult = resolveWallCollisions(dummyPlayer, wallsForStep);
    simX = dummyPlayer.x;
    simY = dummyPlayer.y;
    simVx = dummyPlayer.vx;
    simVy = dummyPlayer.vy;

    // Check if player collided with a closed Temporal Lock in Sector 04
    if (sector.id === 'SEC-04' && !interceptWarning) {
      const nearGate = Math.abs(simX - 570) < 22 && simY >= 200 && simY <= 340;
      if (nearGate && !isTemporalLockGateOpen(currentSimTime)) {
        interceptWarning = true;
        interceptTime = simTimeOffset;
        interceptHazardLabel = 'TEMPORAL LOCK: APERTURE LOCKED';
      }
    }

    // Check if player collided with a closed Future Gate in Sector 02
    if (sector.id === 'SEC-02' && !interceptWarning) {
      const nearGate = Math.abs(simX - 580) < 22 && simY >= 210 && simY <= 330;
      if (nearGate && !isTemporalGateOpen(currentSimTime)) {
        interceptWarning = true;
        interceptTime = simTimeOffset;
        interceptHazardLabel = 'FUTURE GATE: APERTURE LOCKED';
      }
    }

    // Check if player collided with a closed Cascade Gate in Sector 03
    if (sector.id === 'SEC-03' && !interceptWarning) {
      const nearGate = Math.abs(simX - 550) < 22 && simY >= 200 && simY <= 340;
      if (nearGate && !isCascadeGateOpen(currentSimTime)) {
        interceptWarning = true;
        interceptTime = simTimeOffset;
        interceptHazardLabel = 'CASCADE GATE: APERTURE LOCKED';
      }
    }

    // 4. Check conduit activation triggers in future simulation
    for (const conduit of conduits) {
      if (!conduit.isActivated) {
        const dx = simX - conduit.x;
        const dy = simY - conduit.y;
        const distSq = dx * dx + dy * dy;
        const triggerRadius = 20 + radius + 4;
        if (distSq <= triggerRadius * triggerRadius) {
          conduit.isActivated = true;
        }
      }
    }

    // Check if blast gate opens as a result (Sector 01)
    if (!doorUnlocked && conduits.every((c) => c.isActivated)) {
      doorUnlocked = true;
    }

    // 5. Check exit portal trigger in future simulation
    const exitPortal = sector.interactiveElements.find((e) => e.type === 'exit_portal');
    if (exitPortal && !exitReached) {
      const isPassageOpen =
        sector.id === 'SEC-04'
          ? isTemporalLockGateOpen(currentSimTime) || simX > 580
          : sector.id === 'SEC-03'
          ? isCascadeGateOpen(currentSimTime) || simX > 560
          : sector.id === 'SEC-02'
          ? isTemporalGateOpen(currentSimTime) || simX > 590
          : doorUnlocked;

      if (isPassageOpen) {
        const dx = simX - exitPortal.x;
        const dy = simY - exitPortal.y;
        const distSq = dx * dx + dy * dy;
        const triggerRadius = exitPortal.radius + radius;
        if (distSq <= triggerRadius * triggerRadius) {
          exitReached = true;
        }
      }
    }

    // 6. Check hazards proximity along simulated time
    if (!interceptWarning && !exitReached) {
      for (const hazard of sector.hazards) {
        const hazardState = evaluateHazardState(hazard, currentSimTime);
        const dx = simX - hazardState.x;
        const dy = simY - hazardState.y;
        const dist = Math.hypot(dx, dy);
        const dangerRadius = hazardState.radius + radius + 8;

        if (dist <= dangerRadius) {
          interceptWarning = true;
          interceptTime = simTimeOffset;
          interceptHazardLabel = hazard.label;
        }
      }
    }

    // Record trajectory point every 3 steps (approx every ~1.0s of future time)
    if (step % 3 === 0 || step === steps) {
      trajectory.push({
        x: simX,
        y: simY,
        timeOffset: simTimeOffset,
        hasCollision: colResult.collided,
      });
    }
  }

  // Evaluate final hazards state at exactly horizon (elapsed + 60.0s)
  const futureHazards: HazardState[] = sector.hazards.map((h) =>
    evaluateHazardState(h, elapsedSeconds + horizonSeconds)
  );

  // Generate intermediate Future Hazard Shadows (T+15s, T+30s, T+45s, T+60s)
  const hazardShadows = [];
  const shadowIntervals = [15.0, 30.0, 45.0, 60.0];
  const primaryHazard = sector.hazards.find(
    (h) =>
      h.id === 'hazard-lock-overseer' ||
      h.id === 'hazard-cascade-drone' ||
      h.id === 'hazard-chrono-omega' ||
      h.id === 'hazard-gate-sweeper'
  );
  if (primaryHazard) {
    for (const offset of shadowIntervals) {
      const state = evaluateHazardState(primaryHazard, elapsedSeconds + offset);
      hazardShadows.push({
        id: primaryHazard.id,
        label: primaryHazard.label,
        timeOffset: offset,
        x: state.x,
        y: state.y,
        radius: state.radius,
        heading: state.heading,
      });
    }
  }

  // Dynamic corridor safety evaluation for North vs South approaches (Sector 01)
  const omegaFutureState = futureHazards.find((h) => h.id === 'hazard-chrono-omega');
  const futureOmegaY = omegaFutureState ? omegaFutureState.y : 270;
  const northHazardous = futureOmegaY <= 270;
  const routeAnalysis = sector.id === 'SEC-01' ? {
    northStatus: (northHazardous ? 'HAZARDOUS' : 'SAFE') as 'SAFE' | 'HAZARDOUS',
    southStatus: (northHazardous ? 'SAFE' : 'HAZARDOUS') as 'SAFE' | 'HAZARDOUS',
    hazardFutureY: futureOmegaY,
    recommendedRoute: (northHazardous ? 'SOUTH' : 'NORTH') as 'NORTH' | 'SOUTH',
  } : undefined;

  // Evaluate Gate Analysis
  const isSec4 = sector.id === 'SEC-04';
  const isSec3 = sector.id === 'SEC-03';
  const presentGate = isSec4
    ? getTemporalLockGateState(elapsedSeconds)
    : isSec3
    ? getCascadeGateState(elapsedSeconds)
    : getTemporalGateState(elapsedSeconds);
  const futureGate = isSec4
    ? getTemporalLockGateState(elapsedSeconds + horizonSeconds)
    : isSec3
    ? getCascadeGateState(elapsedSeconds + horizonSeconds)
    : getTemporalGateState(elapsedSeconds + horizonSeconds);

  let gateStatusLabel: GateAnalysis['statusLabel'] = 'TIMELINE: NOMINAL';
  if (interceptWarning) {
    gateStatusLabel = 'UNSAFE TRANSIT';
  } else if (exitReached) {
    gateStatusLabel = 'TIMELINE: NOMINAL';
  } else if (futureGate.isOpen) {
    gateStatusLabel = isSec4 ? 'TEMPORAL LOCK: OPEN' : 'FUTURE GATE: OPEN';
  } else {
    gateStatusLabel = isSec4 ? 'TEMPORAL LOCK: CLOSED' : 'FUTURE GATE: CLOSED';
  }

  const gateAnalysis: GateAnalysis = {
    presentIsOpen: presentGate.isOpen,
    presentPhase: presentGate.phase,
    presentNextTransition: presentGate.timeUntilNextState,
    futureIsOpen: futureGate.isOpen,
    futurePhase: futureGate.phase,
    futureNextTransition: futureGate.timeUntilNextState,
    cyclePeriod: presentGate.period,
    openDuration: presentGate.openDuration,
    statusLabel: gateStatusLabel,
  };

  // Evaluate Lock Analysis for Sector 04 (Temporal Lock Overseer + Aperture Sync)
  let lockAnalysis: LockAnalysis | undefined;
  if (isSec4) {
    const overseerFuture = futureHazards.find((h) => h.id === 'hazard-lock-overseer');
    const futureOverseerY = overseerFuture ? overseerFuture.y : 270;

    const overseerInNorth = futureOverseerY <= 265;
    const overseerInSouth = futureOverseerY >= 275;
    const gateOpenInFuture = futureGate.isOpen;

    let northSafety: LockAnalysis['northRouteStatus'] = 'SAFE';
    if (!gateOpenInFuture) {
      northSafety = 'LOCK_BLOCKED';
    } else if (overseerInNorth) {
      northSafety = 'HAZARD_INTERCEPT';
    }

    let southSafety: LockAnalysis['southRouteStatus'] = 'SAFE';
    if (!gateOpenInFuture) {
      southSafety = 'LOCK_BLOCKED';
    } else if (overseerInSouth) {
      southSafety = 'HAZARD_INTERCEPT';
    }

    let recommendedApproach: LockAnalysis['recommendedApproach'] = 'HOLD_INGRESS';
    if (gateOpenInFuture) {
      if (!overseerInNorth && overseerInSouth) {
        recommendedApproach = 'NORTH_SANCTUARY';
      } else if (!overseerInSouth && overseerInNorth) {
        recommendedApproach = 'SOUTH_SANCTUARY';
      } else if (!overseerInNorth && !overseerInSouth) {
        recommendedApproach = 'NORTH_SANCTUARY';
      }
    }

    let lockStatusLabel: LockAnalysis['lockStatusLabel'] = 'TIMELINE: NOMINAL';
    if (interceptWarning) {
      lockStatusLabel = 'INTERCEPTION HAZARD';
    } else if (!gateOpenInFuture) {
      lockStatusLabel = 'TEMPORAL LOCK: CLOSED';
    } else {
      lockStatusLabel = 'TEMPORAL LOCK: OPEN';
    }

    const overseerSweepClear = !overseerInNorth || !overseerInSouth;
    const playerInSafeCorridor = simX > 360 || (simY > 60 && simY < 120) || (simY > 420 && simY < 480);
    const allSatisfied = gateOpenInFuture && !interceptWarning && (northSafety === 'SAFE' || southSafety === 'SAFE' || simX > 560);

    lockAnalysis = {
      allSatisfied,
      gateApertureOpen: gateOpenInFuture,
      overseerSweepClear,
      playerInSafeCorridor,
      northRouteStatus: northSafety,
      southRouteStatus: southSafety,
      futureOverseerY,
      presentGateIsOpen: presentGate.isOpen,
      futureGateIsOpen: futureGate.isOpen,
      recommendedApproach,
      lockStatusLabel,
      secondsUntilWindow: futureGate.isOpen ? 0 : futureGate.timeUntilNextState,
      gatePhase: futureGate.phase,
      overseerPhase: (elapsedSeconds + horizonSeconds) % 15.0,
    };
  }

  // Evaluate Cascade Analysis for Sector 03 (Coordinated Hazard + Gate Future Prediction)
  let cascadeAnalysis: CascadeAnalysis | undefined;
  if (isSec3) {
    const cascadeDroneFuture = futureHazards.find((h) => h.id === 'hazard-cascade-drone');
    const futureDroneY = cascadeDroneFuture ? cascadeDroneFuture.y : 270;

    const currentDrone = sector.hazards.find((h) => h.id === 'hazard-cascade-drone');
    const currentDroneState = currentDrone
      ? evaluateHazardState(currentDrone, elapsedSeconds)
      : null;
    const currentDroneY = currentDroneState ? currentDroneState.y : 270;

    const currentHazardPos: CascadeAnalysis['currentHazardState'] =
      currentDroneY < 200 ? 'NORTH_ROUTE' : currentDroneY > 340 ? 'SOUTH_ROUTE' : 'TRANSIT_SWEEP';
    const futureHazardPos: CascadeAnalysis['futureHazardState'] =
      futureDroneY < 200 ? 'NORTH_ROUTE' : futureDroneY > 340 ? 'SOUTH_ROUTE' : 'TRANSIT_SWEEP';

    const droneInNorth = futureDroneY <= 260;
    const droneInSouth = futureDroneY >= 280;
    const gateOpenInFuture = futureGate.isOpen;

    let northSafety: CascadeAnalysis['routeSafety']['north'] = 'SAFE';
    if (!gateOpenInFuture) {
      northSafety = 'GATE_BLOCKED';
    } else if (droneInNorth) {
      northSafety = 'HAZARD_INTERCEPT';
    }

    let southSafety: CascadeAnalysis['routeSafety']['south'] = 'SAFE';
    if (!gateOpenInFuture) {
      southSafety = 'GATE_BLOCKED';
    } else if (droneInSouth) {
      southSafety = 'HAZARD_INTERCEPT';
    }

    let recommendedRoute: CascadeAnalysis['recommendedRoute'] = 'HOLD_POCKET';
    if (gateOpenInFuture) {
      if (!droneInNorth && droneInSouth) {
        recommendedRoute = 'NORTH_CASCADE';
      } else if (!droneInSouth && droneInNorth) {
        recommendedRoute = 'SOUTH_CASCADE';
      } else if (!droneInNorth && !droneInSouth) {
        recommendedRoute = 'NORTH_CASCADE';
      }
    }

    let cascadeStatusLabel: CascadeAnalysis['cascadeStatusLabel'] = 'TIMELINE: NOMINAL';
    if (interceptWarning) {
      cascadeStatusLabel = 'FUTURE INTERCEPT';
    } else if (!gateOpenInFuture) {
      cascadeStatusLabel = 'FUTURE GATE: CLOSED';
    } else if (droneInNorth && droneInSouth) {
      cascadeStatusLabel = 'TEMPORAL CASCADE WARNING';
    } else {
      cascadeStatusLabel = 'FUTURE GATE: OPEN';
    }

    cascadeAnalysis = {
      currentHazardState: currentHazardPos,
      futureHazardState: futureHazardPos,
      futureHazardY: futureDroneY,
      currentGateState: presentGate.isOpen ? 'OPEN' : 'CLOSED',
      futureGateState: futureGate.isOpen ? 'OPEN' : 'CLOSED',
      recommendedRoute,
      routeSafety: {
        north: northSafety,
        south: southSafety,
      },
      cascadeStatusLabel,
      secondsUntilWindow: futureGate.isOpen ? 0 : futureGate.timeUntilNextState,
      gatePhase: futureGate.phase,
      hazardPhase: (elapsedSeconds + horizonSeconds) % 16.0,
    };
  }

  let timelineStatus: FutureSimulationState['timelineStatus'] = 'TIMELINE_NOMINAL';
  if (exitReached && !interceptWarning) {
    timelineStatus = 'EXTRACTION_REACHED';
  } else if (interceptWarning) {
    timelineStatus = 'INTERCEPTION_HAZARD';
  }

  const finalSpeed = Math.hypot(simVx, simVy);
  const finalAngle = Math.atan2(simVy, simVx);

  return {
    timeHorizon: horizonSeconds,
    predictedElapsed: elapsedSeconds + horizonSeconds,
    playerPos: { x: simX, y: simY },
    playerVelocity: { x: simVx, y: simVy },
    playerAngle: finalAngle,
    playerSpeed: finalSpeed,
    trajectory,
    hazards: futureHazards,
    hazardShadows,
    routeAnalysis,
    gateAnalysis,
    cascadeAnalysis,
    lockAnalysis,
    conduits,
    doorUnlocked,
    exitReached,
    interceptWarning,
    interceptTime,
    interceptHazardLabel,
    timelineStatus,
  };
}
