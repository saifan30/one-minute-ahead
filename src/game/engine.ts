import {
  FutureSimulationState,
  GameStatus,
  GameTelemetry,
  HazardState,
  InputState,
  Particle,
  Vector2D,
  Wall,
} from '../types/game';
import { soundFx } from './audio';
import { distanceSquared, resolveWallCollisions } from './collision';
import {
  createTestingChamber,
  evaluateHazardState,
  getSectorData,
  isCascadeGateOpen,
  isTemporalGateOpen,
  isTemporalLockGateOpen,
  SectorData,
} from './environment';
import { Player } from './player';
import { runFutureSimulation } from './simulation';

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animFrameId: number | null = null;
  private lastTime: number = 0;
  
  public sector: SectorData;
  public player: Player;
  public status: GameStatus = 'RUNNING';
  public elapsedSeconds: number = 0;
  public collisionCount: number = 0;

  public isPreviewActive: boolean = true;
  public courseWaypoint: Vector2D | null = null;
  public hazards: HazardState[] = [];
  public futureState: FutureSimulationState;
  private hadInterceptWarning: boolean = false;
  public temporalInterceptionAlert: string | null = null;
  private temporalAlertTimer: number = 0;

  public input: InputState = {
    up: false,
    down: false,
    left: false,
    right: false,
    interact: false,
    restart: false,
    pause: false,
    togglePreview: false,
  };

  private particles: Particle[] = [];
  private onTelemetryUpdate?: (telemetry: GameTelemetry) => void;
  private fpsCounter: number = 60;
  private frameCount: number = 0;
  private fpsTimer: number = 0;
  private gridGlowPhase: number = 0;

  constructor(canvas: HTMLCanvasElement, onTelemetryUpdate?: (telemetry: GameTelemetry) => void) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Canvas 2D context is not available');
    }
    this.ctx = context;
    this.onTelemetryUpdate = onTelemetryUpdate;

    this.sector = createTestingChamber();
    this.player = new Player(this.sector.spawnPoint.x, this.sector.spawnPoint.y);
    this.hazards = this.sector.hazards.map((h) => evaluateHazardState(h, 0));
    this.futureState = runFutureSimulation({
      player: this.player,
      input: this.input,
      sector: this.sector,
      elapsedSeconds: 0,
      courseWaypoint: null,
      horizonSeconds: 60.0,
    });
  }

  public start() {
    this.lastTime = performance.now();
    this.status = 'RUNNING';
    this.loop(this.lastTime);
  }

  public stop() {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  public pause() {
    if (this.status === 'RUNNING') {
      this.status = 'PAUSED';
      this.emitTelemetry();
    }
  }

  public resume() {
    if (this.status === 'PAUSED') {
      this.status = 'RUNNING';
      this.lastTime = performance.now();
      this.emitTelemetry();
    }
  }

  public togglePause() {
    if (this.status === 'RUNNING') {
      this.pause();
    } else if (this.status === 'PAUSED') {
      this.resume();
    }
  }

  public togglePreview(): boolean {
    this.isPreviewActive = !this.isPreviewActive;
    if (this.isPreviewActive) {
      soundFx.playTemporalActivate();
    } else {
      soundFx.playTemporalDeactivate();
    }
    this.emitTelemetry();
    return this.isPreviewActive;
  }

  public setPreviewActive(active: boolean) {
    if (this.isPreviewActive !== active) {
      this.isPreviewActive = active;
      if (active) {
        soundFx.playTemporalActivate();
      } else {
        soundFx.playTemporalDeactivate();
      }
      this.emitTelemetry();
    }
  }

  public setCourseWaypoint(point: Vector2D | null) {
    this.courseWaypoint = point;
    if (point) {
      soundFx.playInteract();
      this.spawnSparks(point.x, point.y, '#00f0ff', 12);
    }
    this.emitTelemetry();
  }

  public clearCourseWaypoint() {
    this.courseWaypoint = null;
    this.emitTelemetry();
  }

  public setWaypointFromCanvasCoords(canvasX: number, canvasY: number) {
    const dpr = window.devicePixelRatio || 1;
    const displayWidth = this.canvas.width / dpr;
    const displayHeight = this.canvas.height / dpr;
    const scale = Math.min(displayWidth / this.sector.width, displayHeight / this.sector.height);
    const offsetX = (displayWidth - this.sector.width * scale) / 2;
    const offsetY = (displayHeight - this.sector.height * scale) / 2;

    const worldX = (canvasX - offsetX) / scale;
    const worldY = (canvasY - offsetY) / scale;

    if (
      worldX >= 24 &&
      worldX <= this.sector.width - 24 &&
      worldY >= 24 &&
      worldY <= this.sector.height - 24
    ) {
      // If clicking near existing waypoint, toggle it off
      if (this.courseWaypoint) {
        const distToExisting = Math.hypot(this.courseWaypoint.x - worldX, this.courseWaypoint.y - worldY);
        if (distToExisting < 25) {
          this.clearCourseWaypoint();
          return;
        }
      }
      this.setCourseWaypoint({ x: Math.round(worldX), y: Math.round(worldY) });
    }
  }

  public restart() {
    soundFx.playRestart();
    this.sector = getSectorData(this.sector.id);
    this.player.reset(this.sector.spawnPoint.x, this.sector.spawnPoint.y);
    this.status = 'RUNNING';
    this.elapsedSeconds = 0;
    this.collisionCount = 0;
    this.particles = [];
    this.courseWaypoint = null;
    this.hadInterceptWarning = false;
    this.temporalInterceptionAlert = null;
    this.temporalAlertTimer = 0;
    this.lastTime = performance.now();
    this.hazards = this.sector.hazards.map((h) => evaluateHazardState(h, 0));
    this.futureState = runFutureSimulation({
      player: this.player,
      input: this.input,
      sector: this.sector,
      elapsedSeconds: 0,
      courseWaypoint: null,
      horizonSeconds: 60.0,
    });
    this.spawnSparks(this.player.x, this.player.y, '#00f0ff', 24);
    this.emitTelemetry();
  }

  public loadSector(sectorId: string) {
    soundFx.playRestart();
    this.sector = getSectorData(sectorId);
    this.player.reset(this.sector.spawnPoint.x, this.sector.spawnPoint.y);
    this.status = 'RUNNING';
    this.elapsedSeconds = 0;
    this.collisionCount = 0;
    this.particles = [];
    this.courseWaypoint = null;
    this.hadInterceptWarning = false;
    this.temporalInterceptionAlert = null;
    this.temporalAlertTimer = 0;
    this.lastTime = performance.now();
    this.hazards = this.sector.hazards.map((h) => evaluateHazardState(h, 0));
    this.futureState = runFutureSimulation({
      player: this.player,
      input: this.input,
      sector: this.sector,
      elapsedSeconds: 0,
      courseWaypoint: null,
      horizonSeconds: 60.0,
    });
    this.spawnSparks(this.player.x, this.player.y, '#00f0ff', 24);
    this.emitTelemetry();
  }

  public setInput(newInput: Partial<InputState>) {
    this.input = { ...this.input, ...newInput };
  }

  public resize(width: number, height: number) {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  private loop = (currentTime: number) => {
    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;

    // Calculate FPS
    this.frameCount++;
    this.fpsTimer += dt;
    if (this.fpsTimer >= 0.5) {
      this.fpsCounter = Math.round((this.frameCount / this.fpsTimer));
      this.frameCount = 0;
      this.fpsTimer = 0;
    }

    if (this.status === 'RUNNING') {
      this.update(dt);
    }

    this.render();
    this.emitTelemetry();

    this.animFrameId = requestAnimationFrame(this.loop);
  };

  private update(dt: number) {
    this.elapsedSeconds += dt;
    this.gridGlowPhase += dt * 2;

    if (this.temporalAlertTimer > 0) {
      this.temporalAlertTimer -= dt;
      if (this.temporalAlertTimer <= 0) {
        this.temporalInterceptionAlert = null;
      }
    }

    // Optional waypoint autopilot steering if no manual keyboard inputs active
    const hasKeyboardInput =
      this.input.up || this.input.down || this.input.left || this.input.right;
    if (!hasKeyboardInput && this.courseWaypoint) {
      const dx = this.courseWaypoint.x - this.player.x;
      const dy = this.courseWaypoint.y - this.player.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 16) {
        const ax = dx / dist;
        const ay = dy / dist;
        this.player.vx += ax * this.player.acceleration * dt;
        this.player.vy += ay * this.player.acceleration * dt;
      } else {
        // Auto-funnel logic based on active sector
        if (this.sector.id === 'SEC-01') {
          const blastDoor = this.sector.walls.find(w => w.id === 'door-extraction-gate');
          const isDoorOpen = blastDoor ? !blastDoor.isActive : true;
          if (isDoorOpen && this.courseWaypoint.x >= 680 && (this.courseWaypoint.y < 180 || this.courseWaypoint.y > 360)) {
            this.courseWaypoint = { x: 760, y: 270 };
          } else {
            this.courseWaypoint = null;
          }
        } else if (this.sector.id === 'SEC-02') {
          if (this.player.x >= 580) {
            this.courseWaypoint = { x: 740, y: 270 };
          } else {
            this.courseWaypoint = null;
          }
        } else if (this.sector.id === 'SEC-04') {
          if (this.player.x >= 580) {
            this.courseWaypoint = { x: 740, y: 270 };
          } else if (this.courseWaypoint.x >= 480 && this.courseWaypoint.x <= 530) {
            const dist = Math.hypot(this.player.x - this.courseWaypoint.x, this.player.y - this.courseWaypoint.y);
            if (dist < 28) {
              this.courseWaypoint = { x: 570, y: 270 };
            }
          } else {
            this.courseWaypoint = null;
          }
        } else if (this.sector.id === 'SEC-03') {
          if (this.player.x >= 560) {
            this.courseWaypoint = { x: 730, y: 270 };
          } else if (this.courseWaypoint.x >= 470 && this.courseWaypoint.x <= 510) {
            const dist = Math.hypot(this.player.x - this.courseWaypoint.x, this.player.y - this.courseWaypoint.y);
            if (dist < 28) {
              this.courseWaypoint = { x: 550, y: 270 };
            }
          } else {
            this.courseWaypoint = null;
          }
        } else {
          this.courseWaypoint = null;
        }
      }
    }

    // Dynamic state update for Temporal Lock aperture in Sector 04
    const lockGate = this.sector.walls.find(w => w.id === 'gate-lock-aperture');
    if (lockGate) {
      const isOpen = isTemporalLockGateOpen(this.elapsedSeconds);
      const wasActive = lockGate.isActive;
      lockGate.isActive = !isOpen; // Collides only when locked/closed
      if (wasActive && !lockGate.isActive) {
        soundFx.playDoorUnlock();
        this.spawnSparks(lockGate.x + lockGate.width / 2, lockGate.y + lockGate.height / 2, '#ec4899', 25);
      }
    }

    // Dynamic state update for Future Gate aperture in Sector 02
    const futureGate = this.sector.walls.find(w => w.id === 'gate-temporal-aperture');
    if (futureGate) {
      const isOpen = isTemporalGateOpen(this.elapsedSeconds);
      const wasActive = futureGate.isActive;
      futureGate.isActive = !isOpen; // Collides only when locked/closed
      if (wasActive && !futureGate.isActive) {
        soundFx.playDoorUnlock();
        this.spawnSparks(futureGate.x + futureGate.width / 2, futureGate.y + futureGate.height / 2, '#10b981', 25);
      }
    }

    // Dynamic state update for Cascade Gate aperture in Sector 03
    const cascadeGate = this.sector.walls.find(w => w.id === 'gate-cascade-aperture');
    if (cascadeGate) {
      const isOpen = isCascadeGateOpen(this.elapsedSeconds);
      const wasActive = cascadeGate.isActive;
      cascadeGate.isActive = !isOpen; // Collides only when locked/closed
      if (wasActive && !cascadeGate.isActive) {
        soundFx.playDoorUnlock();
        this.spawnSparks(cascadeGate.x + cascadeGate.width / 2, cascadeGate.y + cascadeGate.height / 2, '#c084fc', 25);
      }
    }

    // Update Player Movement & Input
    this.player.update(dt, this.input);

    // Collision detection with walls
    const colResult = resolveWallCollisions(this.player, this.sector.walls);
    if (colResult.collided) {
      this.collisionCount += colResult.count;
      if (Math.hypot(this.player.vx, this.player.vy) > 80) {
        soundFx.playCollision();
        this.spawnSparks(this.player.x, this.player.y, '#38bdf8', 4);
      }
    }

    // Update Present Moving Hazards
    this.hazards = this.sector.hazards.map((h) =>
      evaluateHazardState(h, this.elapsedSeconds)
    );

    // Hazard proximity / collision in the present
    for (const hazard of this.hazards) {
      const dx = this.player.x - hazard.x;
      const dy = this.player.y - hazard.y;
      const dist = Math.hypot(dx, dy);
      const minDist = hazard.radius + this.player.radius;

      if (dist < minDist) {
        const nx = dist > 0 ? dx / dist : 1;
        const ny = dist > 0 ? dy / dist : 0;

        if (hazard.id === 'hazard-lock-overseer') {
          // Temporal Lock Overseer in Sector 04
          this.player.vx = -320;
          this.player.vy = ny * 180;
          this.player.x = Math.min(this.player.x, 480);
          this.courseWaypoint = null;
          this.collisionCount++;
          soundFx.playHazardWarning();
          this.spawnSparks(this.player.x, this.player.y, '#f43f5e', 26);
          this.spawnSparks(this.player.x, this.player.y, '#ec4899', 20);
          this.temporalInterceptionAlert =
            '⚠ TEMPORAL OVERSEER INTERCEPT! TIMELINE COLLAPSED. ENGAGE +60s PREVIEW TO TIME SANCTUARY TRANSIT!';
          this.temporalAlertTimer = 3.5;
        } else if (hazard.id === 'hazard-lock-guardian') {
          // Aperture Lock Guardian in Sector 04
          this.player.vx = -270;
          this.player.vy = ny * 160;
          this.player.x = Math.min(this.player.x, 520);
          this.courseWaypoint = null;
          this.collisionCount++;
          soundFx.playHazardWarning();
          this.spawnSparks(this.player.x, this.player.y, '#ec4899', 24);
          this.temporalInterceptionAlert =
            '⚠ LOCK GUARDIAN INTERCEPT! HOLD IN SANCTUARY UNTIL TEMPORAL LOCK OPENS!';
          this.temporalAlertTimer = 3.5;
        } else if (hazard.id === 'hazard-chrono-omega') {
          // Temporal Interception with Chrono Interceptor Omega
          this.player.vx = -320;
          this.player.vy = ny * 180;
          this.player.x = Math.min(this.player.x, 605); // push back before blast gate
          this.courseWaypoint = null;
          this.collisionCount++;
          soundFx.playHazardWarning();
          this.spawnSparks(this.player.x, this.player.y, '#f43f5e', 24);
          this.spawnSparks(this.player.x, this.player.y, '#a855f7', 16);
          this.temporalInterceptionAlert =
            '⚠ TEMPORAL INTERCEPTION! TIMELINE COLLAPSED. ENGAGE +60s PREVIEW [SPACE] TO CHART SAFE TRANSIT!';
          this.temporalAlertTimer = 3.2;
        } else if (hazard.id === 'hazard-cascade-drone') {
          // Cascade Interceptor Omega in Sector 03
          this.player.vx = -300;
          this.player.vy = ny * 180;
          this.player.x = Math.min(this.player.x, 470);
          this.courseWaypoint = null;
          this.collisionCount++;
          soundFx.playHazardWarning();
          this.spawnSparks(this.player.x, this.player.y, '#f43f5e', 24);
          this.spawnSparks(this.player.x, this.player.y, '#c084fc', 20);
          this.temporalInterceptionAlert =
            '⚠ CASCADE INTERCEPTOR STRIKE! TIMELINE COLLAPSED. USE +60s SENSOR TO PLAN OPPOSITE ROUTE!';
          this.temporalAlertTimer = 3.5;
        } else if (hazard.id === 'hazard-cascade-sweeper') {
          // Aperture Guardian in Sector 03
          this.player.vx = -260;
          this.player.vy = ny * 160;
          this.player.x = Math.min(this.player.x, 490);
          this.courseWaypoint = null;
          this.collisionCount++;
          soundFx.playHazardWarning();
          this.spawnSparks(this.player.x, this.player.y, '#f59e0b', 24);
          this.temporalInterceptionAlert =
            '⚠ APERTURE GUARDIAN INTERCEPT! HOLD IN STAGING POCKET UNTIL CASCADE WINDOW OPENS!';
          this.temporalAlertTimer = 3.5;
        } else if (hazard.id === 'hazard-gate-sweeper') {
          // Gate Sweeper in Sector 02
          this.player.vx = -260;
          this.player.vy = ny * 160;
          this.player.x = Math.min(this.player.x, 510);
          this.courseWaypoint = null;
          this.collisionCount++;
          soundFx.playHazardWarning();
          this.spawnSparks(this.player.x, this.player.y, '#f59e0b', 24);
          this.temporalInterceptionAlert =
            '⚠ GATE SWEEPER INTERCEPTION! DOCK IN STAGING COVES & CHECK +60s PREVIEW!';
          this.temporalAlertTimer = 3.2;
        } else {
          this.player.vx += nx * 160;
          this.player.vy += ny * 160;
          this.collisionCount++;
          soundFx.playHazardWarning();
          this.spawnSparks(this.player.x, this.player.y, '#f43f5e', 8);
        }
      }
    }

    // Check interaction with interactive elements
    this.updateInteractiveElements();

    // Run 60-Second Predictive Temporal Simulation
    this.futureState = runFutureSimulation({
      player: this.player,
      input: this.input,
      sector: this.sector,
      elapsedSeconds: this.elapsedSeconds,
      courseWaypoint: this.courseWaypoint,
      horizonSeconds: 60.0,
    });

    if (this.futureState.interceptWarning && !this.hadInterceptWarning) {
      this.hadInterceptWarning = true;
      soundFx.playHazardWarning();
    } else if (!this.futureState.interceptWarning) {
      this.hadInterceptWarning = false;
    }

    // Update ambient particles
    this.updateParticles(dt);
  }

  private updateInteractiveElements() {
    let activeNodes = 0;
    const requiredConduits = this.sector.interactiveElements.filter(e => e.type === 'conduit');

    for (const elem of this.sector.interactiveElements) {
      if (elem.type === 'conduit' || elem.type === 'pressure_plate') {
        const distSq = distanceSquared({ x: this.player.x, y: this.player.y }, { x: elem.x, y: elem.y });
        const triggerRadius = elem.radius + this.player.radius + 6;

        if (distSq <= triggerRadius * triggerRadius) {
          if (!elem.isActivated) {
            elem.isActivated = true;
            soundFx.playInteract();
            this.spawnSparks(elem.x, elem.y, '#10b981', 20);
          }
        }
      }

      if (elem.isActivated && (elem.type === 'conduit' || elem.type === 'pressure_plate')) {
        activeNodes++;
      }
    }

    // Check if blast door should unlock
    const allConduitsActive = requiredConduits.every(c => c.isActivated);
    const blastDoor = this.sector.walls.find(w => w.id === 'door-extraction-gate');
    
    if (blastDoor && blastDoor.isActive && allConduitsActive) {
      blastDoor.isActive = false; // Open gate
      soundFx.playDoorUnlock();
      this.spawnSparks(blastDoor.x + blastDoor.width / 2, blastDoor.y + blastDoor.height / 2, '#10b981', 30);
    }

    // Check exit portal trigger
    const exitPortal = this.sector.interactiveElements.find(e => e.type === 'exit_portal');
    if (exitPortal && !exitPortal.isActivated) {
      const distSq = distanceSquared({ x: this.player.x, y: this.player.y }, { x: exitPortal.x, y: exitPortal.y });
      const triggerRadius = exitPortal.radius + this.player.radius;

      const requirementsMet =
        this.sector.id === 'SEC-04'
          ? this.player.x > 590
          : this.sector.id === 'SEC-03'
          ? this.player.x > 570
          : this.sector.id === 'SEC-02'
          ? this.player.x > 600
          : allConduitsActive;

      if (distSq <= triggerRadius * triggerRadius && requirementsMet) {
        if (!this.isPreviewActive) {
          // Without Preview, player cannot safely complete extraction
          this.player.vx = -140;
          this.temporalInterceptionAlert =
            '⚠ EXTRACTION BLOCKED: TEMPORAL ANCHOR REQUIRES ACTIVE +60s SENSOR PREVIEW [SPACE] TO VALIDATE TIMELINE!';
          this.temporalAlertTimer = 2.5;
          soundFx.playHazardWarning();
        } else if (this.futureState.interceptWarning) {
          // If future timeline predicts an interception, extraction cannot be completed safely
          this.player.vx = -140;
          this.temporalInterceptionAlert =
            '⚠ EXTRACTION HAZARD: FLIGHT VECTOR INTERCEPTED! ADJUST MOVEMENT PATH TO CLEAR TIMELINE.';
          this.temporalAlertTimer = 2.5;
          soundFx.playHazardWarning();
        } else {
          exitPortal.isActivated = true;
          this.status = 'SECTOR_CLEAR';
          soundFx.playGoal();
          this.spawnSparks(exitPortal.x, exitPortal.y, '#00f0ff', 50);
        }
      }
    }
  }

  private spawnSparks(x: number, y: number, color: string, count: number) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 30 + Math.random() * 120;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: 0.3 + Math.random() * 0.3,
        color,
        size: 1.5 + Math.random() * 2.5,
        alpha: 1,
      });
    }
  }

  private updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.alpha = 1 - p.life / p.maxLife;
    }
  }

  private render() {
    const { ctx, canvas } = this;
    const dpr = window.devicePixelRatio || 1;
    const displayWidth = canvas.width / dpr;
    const displayHeight = canvas.height / dpr;

    // Calculate scale and translation to center sector in canvas
    const scaleX = displayWidth / this.sector.width;
    const scaleY = displayHeight / this.sector.height;
    const scale = Math.min(scaleX, scaleY);

    const offsetX = (displayWidth - this.sector.width * scale) / 2;
    const offsetY = (displayHeight - this.sector.height * scale) / 2;

    // Clear background
    ctx.save();
    ctx.fillStyle = '#070a0f';
    ctx.fillRect(0, 0, displayWidth, displayHeight);

    // Apply viewport scale & translation
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    // Render floor grid & circuit conduits
    this.renderFloorGrid();

    // Render Interactive Elements (conduits, pads, portal)
    this.renderInteractiveElements();

    // Render Moving Hazards
    this.renderHazards();

    // Render Walls & Laser Blast Gates
    this.renderWalls();

    // Render Spark Particles
    this.renderParticles();

    // Render Temporal Projection (trajectory ribbon & future ghost) when preview is active
    if (this.isPreviewActive) {
      this.renderTemporalProjection();
    }

    // Render Player
    this.player.render(ctx);

    ctx.restore();
  }

  private renderFloorGrid() {
    const { ctx } = this;
    const { width, height } = this.sector;
    const gridSize = 30;

    // Base floor slate
    ctx.fillStyle = '#0c111a';
    ctx.fillRect(0, 0, width, height);

    // Subtle grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
    ctx.lineWidth = 1;

    ctx.beginPath();
    for (let x = 0; x <= width; x += gridSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    for (let y = 0; y <= height; y += gridSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();

    // Circuit trace lines connecting conduits to blast door
    const door = this.sector.walls.find(w => w.id === 'door-extraction-gate');
    const conduits = this.sector.interactiveElements.filter(e => e.type === 'conduit');

    if (door) {
      const doorTargetX = door.x;
      const doorTargetY = door.y + door.height / 2;

      for (const conduit of conduits) {
        ctx.save();
        ctx.strokeStyle = conduit.isActivated ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.2)';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.lineDashOffset = -this.gridGlowPhase * 8;

        ctx.beginPath();
        ctx.moveTo(conduit.x, conduit.y);
        ctx.lineTo(doorTargetX - 40, conduit.y);
        ctx.lineTo(doorTargetX, doorTargetY);
        ctx.stroke();
        ctx.restore();
      }
    }

    // Floor sector label markings
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.font = 'bold 11px monospace';
    if (this.sector.id === 'SEC-04') {
      ctx.fillText('SECTOR_04 // TEMPORAL_LOCK_VAULT', 40, 48);
      ctx.fillText('FINAL_CHALLENGE // 15s OVERSEER × 24s TEMPORAL_LOCK', 40, height - 36);

      ctx.font = 'bold 9px monospace';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.fillText('▲ NORTH SANCTUARY [APPROACH_α]', 290, 52);
      ctx.fillText('▼ SOUTH SANCTUARY [APPROACH_β]', 290, height - 42);
      ctx.fillText('TEMPORAL LOCK APERTURE', 500, 274);
      ctx.fillText('◄ EXTRACTION ANCHOR VAULT ►', 660, 274);
    } else if (this.sector.id === 'SEC-03') {
      ctx.fillText('SECTOR_03 // TEMPORAL_CASCADE_CHAMBER', 40, 48);
      ctx.fillText('COORDINATED_SYSTEM // 16s INTERCEPTOR × 24s CASCADE_GATE', 40, height - 36);

      ctx.font = 'bold 9px monospace';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.fillText('▲ NORTH CASCADE ROUTE [CORRIDOR_α]', 310, 52);
      ctx.fillText('▼ SOUTH CASCADE ROUTE [CORRIDOR_β]', 310, height - 42);
      ctx.fillText('CASCADE APERTURE GATEWAY', 480, 274);
      ctx.fillText('◄ CASCADE ANCHOR VAULT ►', 670, 274);
    } else if (this.sector.id === 'SEC-02') {
      ctx.fillText('SECTOR_02 // FUTURE_GATE_COMPLEX', 40, 48);
      ctx.fillText('TEMPORAL_PHASE // DETERMINISTIC 24s CYCLE', 40, height - 36);

      ctx.font = 'bold 9px monospace';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.fillText('▲ STAGING COVE [NORTH: Y:100]', 400, 52);
      ctx.fillText('▼ STAGING COVE [SOUTH: Y:440]', 400, height - 42);
      ctx.fillText('CYCLIC BARRIER APERTURE', 500, 274);
      ctx.fillText('◄ OMEGA ANCHOR VAULT ►', 680, 274);
    } else {
      ctx.fillText('SECTOR_01 // CALIBRATION_LAB_GRID', 40, 48);
      ctx.fillText('EXPERIMENTAL_ZONE // RESTRICTED', 40, height - 36);

      // Extraction Approaches Floor Labels
      ctx.font = 'bold 9px monospace';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.fillText('▲ NORTH CORRIDOR [APPROACH_A]', 640, 52);
      ctx.fillText('▼ SOUTH CORRIDOR [APPROACH_B]', 640, height - 42);
      ctx.fillText('◄ TEMPORAL ANCHOR ZONE ►', 680, 274);
    }
  }

  private renderInteractiveElements() {
    const { ctx } = this;

    for (const elem of this.sector.interactiveElements) {
      ctx.save();
      ctx.translate(elem.x, elem.y);

      if (elem.type === 'conduit') {
        const glowColor = elem.isActivated ? 'rgba(16, 185, 129, ' : 'rgba(239, 68, 68, ';
        
        // Pulse ring
        const pulse = Math.sin(this.gridGlowPhase * 2 + elem.x) * 3;
        ctx.strokeStyle = elem.isActivated ? '#10b981' : '#ef4444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, elem.radius + pulse, 0, Math.PI * 2);
        ctx.stroke();

        // Node fill
        const gradient = ctx.createRadialGradient(0, 0, 2, 0, 0, elem.radius);
        gradient.addColorStop(0, glowColor + '0.8)');
        gradient.addColorStop(0.7, glowColor + '0.2)');
        gradient.addColorStop(1, glowColor + '0.0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, elem.radius, 0, Math.PI * 2);
        ctx.fill();

        // Core icon/diamond
        ctx.fillStyle = elem.isActivated ? '#34d399' : '#f87171';
        ctx.beginPath();
        ctx.moveTo(0, -6);
        ctx.lineTo(6, 0);
        ctx.lineTo(0, 6);
        ctx.lineTo(-6, 0);
        ctx.closePath();
        ctx.fill();

        // Label
        ctx.fillStyle = elem.isActivated ? '#a7f3d0' : '#fecaca';
        ctx.font = '9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(elem.label, 0, elem.radius + 14);
        ctx.fillText(elem.isActivated ? '[ACTIVE]' : '[OFFLINE]', 0, elem.radius + 24);
      } else if (elem.type === 'pressure_plate') {
        // Pressure plate design
        ctx.fillStyle = elem.isActivated ? '#064e3b' : '#1e293b';
        ctx.strokeStyle = elem.isActivated ? '#10b981' : '#64748b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-elem.radius, -elem.radius, elem.radius * 2, elem.radius * 2, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = elem.isActivated ? '#6ee7b7' : '#94a3b8';
        ctx.font = '9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(elem.label, 0, 3);
      } else if (elem.type === 'exit_portal') {
        // Exit Portal / Temporal Anchor Pad
        const door = this.sector.walls.find(w => w.id === 'door-extraction-gate');
        const isDoorOpen = door ? !door.isActive : true;

        const portalGlow = isDoorOpen ? 'rgba(0, 240, 255, 0.4)' : 'rgba(100, 116, 139, 0.2)';
        const pulse = Math.sin(this.gridGlowPhase * 3) * 4;

        // Outer beacon ring
        ctx.strokeStyle = isDoorOpen ? '#00f0ff' : '#475569';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, elem.radius + pulse, 0, Math.PI * 2);
        ctx.stroke();

        // Rotating vortex arcs
        if (isDoorOpen) {
          ctx.save();
          ctx.rotate(this.gridGlowPhase);
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(0, 0, elem.radius * 0.7, 0, Math.PI * 1.2);
          ctx.stroke();
          ctx.restore();
        }

        // Core pad
        ctx.fillStyle = portalGlow;
        ctx.beginPath();
        ctx.arc(0, 0, elem.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = isDoorOpen ? '#e0f2fe' : '#94a3b8';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('TEMPORAL_ANCHOR', 0, -elem.radius - 10);
        ctx.fillText(isDoorOpen ? '>>> EXTRACTION READY <<<' : '[GATE LOCKED]', 0, elem.radius + 16);
      }

      ctx.restore();
    }
  }

  private renderWalls() {
    const { ctx } = this;

    for (const wall of this.sector.walls) {
      if (wall.type === 'solid') {
        // High-tech solid wall
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1.5;

        ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
        ctx.strokeRect(wall.x, wall.y, wall.width, wall.height);

        // Inner bevel highlight
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(wall.x + 3, wall.y + 3, Math.max(1, wall.width - 6), Math.max(1, wall.height - 6));

        // Wall label / hazard indicator for large pillars
        if (wall.label) {
          ctx.fillStyle = '#475569';
          ctx.font = '8px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(wall.label, wall.x + wall.width / 2, wall.y + wall.height / 2 + 3);
        }
      } else if (wall.type === 'door') {
        const isLockGate = wall.id === 'gate-lock-aperture';
        const isFutureGate = wall.id === 'gate-temporal-aperture';
        const isCascadeGate = wall.id === 'gate-cascade-aperture';
        const isApertureGate = isLockGate || isFutureGate || isCascadeGate;

        if (wall.isActive) {
          // Closed/Locked Gate
          const tint = isLockGate
            ? 'rgba(236, 72, 153, 0.2)'
            : isCascadeGate
            ? 'rgba(192, 132, 252, 0.18)'
            : isFutureGate
            ? 'rgba(245, 158, 11, 0.18)'
            : 'rgba(239, 68, 68, 0.15)';
          const stroke = isLockGate ? '#ec4899' : isCascadeGate ? '#c084fc' : isFutureGate ? '#f59e0b' : '#ef4444';
          ctx.fillStyle = tint;
          ctx.fillRect(wall.x, wall.y, wall.width, wall.height);

          ctx.strokeStyle = stroke;
          ctx.lineWidth = 3;
          ctx.strokeRect(wall.x, wall.y, wall.width, wall.height);

          // Pulsing laser bars
          const beamCount = isApertureGate ? 6 : 4;
          for (let b = 1; b <= beamCount; b++) {
            const beamY = wall.y + (wall.height / (beamCount + 1)) * b;
            ctx.strokeStyle = isLockGate
              ? 'rgba(251, 207, 232, 0.95)'
              : isCascadeGate
              ? 'rgba(243, 232, 255, 0.9)'
              : isFutureGate
              ? 'rgba(254, 240, 138, 0.9)'
              : 'rgba(254, 202, 202, 0.9)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(wall.x, beamY);
            ctx.lineTo(wall.x + wall.width, beamY);
            ctx.stroke();
          }

          ctx.fillStyle = stroke;
          ctx.font = 'bold 8px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(isLockGate ? 'LOCKED' : isApertureGate ? 'BARRIER' : 'LOCKED', wall.x + wall.width / 2, wall.y + wall.height / 2 + 3);
        } else {
          // Open Gate
          const stroke = isLockGate
            ? 'rgba(236, 72, 153, 0.9)'
            : isCascadeGate
            ? 'rgba(192, 132, 252, 0.9)'
            : isFutureGate
            ? 'rgba(0, 240, 255, 0.8)'
            : 'rgba(16, 185, 129, 0.4)';
          const fill = isLockGate
            ? 'rgba(236, 72, 153, 0.25)'
            : isCascadeGate
            ? 'rgba(192, 132, 252, 0.25)'
            : isFutureGate
            ? 'rgba(0, 240, 255, 0.2)'
            : 'rgba(16, 185, 129, 0.6)';

          ctx.strokeStyle = stroke;
          ctx.lineWidth = isApertureGate ? 2 : 1;
          ctx.setLineDash([3, 3]);
          ctx.strokeRect(wall.x, wall.y, wall.width, wall.height);
          ctx.setLineDash([]);

          ctx.fillStyle = fill;
          ctx.font = 'bold 8px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('APERTURE', wall.x + wall.width / 2, wall.y + wall.height / 2 + 3);
        }
      }
    }
  }

  private renderParticles() {
    const { ctx } = this;
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  private renderHazards() {
    const { ctx } = this;
    for (const hazard of this.hazards) {
      ctx.save();
      ctx.translate(hazard.x, hazard.y);

      if (hazard.id === 'hazard-lock-overseer') {
        // Temporal Lock Overseer Omega in SEC-04 - Prismatic Quantum Distortion Core
        const pulse = Math.sin(this.gridGlowPhase * 5) * 4;

        // Prismatic field rings
        ctx.strokeStyle = 'rgba(236, 72, 153, 0.75)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(0, 0, hazard.radius + 10 + pulse, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, hazard.radius + 3, 0, Math.PI * 2);
        ctx.stroke();

        // Dark singularity core
        ctx.fillStyle = '#26061a';
        ctx.beginPath();
        ctx.arc(0, 0, hazard.radius, 0, Math.PI * 2);
        ctx.fill();

        // Rotating octa-star chrono blades
        ctx.save();
        ctx.rotate(this.gridGlowPhase * 3);
        ctx.strokeStyle = '#f472b6';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-hazard.radius + 2, 0);
        ctx.lineTo(hazard.radius - 2, 0);
        ctx.moveTo(0, -hazard.radius + 2);
        ctx.lineTo(0, hazard.radius - 2);
        ctx.moveTo((-hazard.radius + 2) * 0.707, (-hazard.radius + 2) * 0.707);
        ctx.lineTo((hazard.radius - 2) * 0.707, (hazard.radius - 2) * 0.707);
        ctx.moveTo((-hazard.radius + 2) * 0.707, (hazard.radius - 2) * 0.707);
        ctx.lineTo((hazard.radius - 2) * 0.707, (-hazard.radius + 2) * 0.707);
        ctx.stroke();
        ctx.restore();

        // Singularity gem
        ctx.fillStyle = '#ec4899';
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Label
        ctx.fillStyle = '#fbcfe8';
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(hazard.label, 0, hazard.radius + 15);
      } else if (hazard.id === 'hazard-lock-guardian') {
        // Aperture Lock Guardian in SEC-04
        const pulse = Math.sin(this.gridGlowPhase * 6) * 3;
        ctx.strokeStyle = 'rgba(236, 72, 153, 0.7)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.arc(0, 0, hazard.radius + 6 + pulse, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#26061a';
        ctx.strokeStyle = '#ec4899';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, hazard.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.save();
        ctx.rotate(this.gridGlowPhase * 4.5);
        ctx.strokeStyle = '#f472b6';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-hazard.radius + 2, 0);
        ctx.lineTo(hazard.radius - 2, 0);
        ctx.stroke();
        ctx.restore();

        ctx.fillStyle = '#ec4899';
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fbcfe8';
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(hazard.label, 0, hazard.radius + 13);
      } else if (hazard.id === 'hazard-chrono-omega') {
        // Chrono Interceptor Omega - Temporal Anomaly Aesthetics
        const pulse = Math.sin(this.gridGlowPhase * 4) * 4;

        // Multi-ring temporal distortion field
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(0, 0, hazard.radius + 10 + pulse, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.strokeStyle = 'rgba(244, 63, 94, 0.75)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, hazard.radius + 3, 0, Math.PI * 2);
        ctx.stroke();

        // Pulsing dark core
        ctx.fillStyle = '#1e0b24';
        ctx.beginPath();
        ctx.arc(0, 0, hazard.radius, 0, Math.PI * 2);
        ctx.fill();

        // Rotating quantum chrono blades
        ctx.save();
        ctx.rotate(this.gridGlowPhase * 2.5);
        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-hazard.radius + 3, 0);
        ctx.lineTo(hazard.radius - 3, 0);
        ctx.moveTo(0, -hazard.radius + 3);
        ctx.lineTo(0, hazard.radius - 3);
        ctx.stroke();
        ctx.restore();

        // Singularity center
        ctx.fillStyle = '#f43f5e';
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, 2, 0, Math.PI * 2);
        ctx.fill();

        // Label
        ctx.fillStyle = '#f472b6';
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(hazard.label, 0, hazard.radius + 15);
      } else if (hazard.id === 'hazard-cascade-drone') {
        // Cascade Interceptor Drone - Deep Purple & Violet Vortex
        const pulse = Math.sin(this.gridGlowPhase * 4.5) * 4;
        ctx.strokeStyle = 'rgba(192, 132, 252, 0.7)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.arc(0, 0, hazard.radius + 8 + pulse, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, hazard.radius + 2, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#1c0d2b';
        ctx.beginPath();
        ctx.arc(0, 0, hazard.radius, 0, Math.PI * 2);
        ctx.fill();

        // Quad chrono vortex blades
        ctx.save();
        ctx.rotate(this.gridGlowPhase * 3.2);
        ctx.strokeStyle = '#e879f9';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-hazard.radius + 3, 0);
        ctx.lineTo(hazard.radius - 3, 0);
        ctx.moveTo(0, -hazard.radius + 3);
        ctx.lineTo(0, hazard.radius - 3);
        ctx.stroke();
        ctx.restore();

        ctx.fillStyle = '#a855f7';
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#f5d0fe';
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(hazard.label, 0, hazard.radius + 14);
      } else if (hazard.id === 'hazard-cascade-sweeper' || hazard.id === 'hazard-gate-sweeper') {
        // High-speed barrier sweepers (Gate Sweeper & Aperture Guardian)
        const pulse = Math.sin(this.gridGlowPhase * 5) * 3;
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.arc(0, 0, hazard.radius + 6 + pulse, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#241407';
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, hazard.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Rotary sweeper line
        ctx.save();
        ctx.rotate(this.gridGlowPhase * 4);
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-hazard.radius + 2, 0);
        ctx.lineTo(hazard.radius - 2, 0);
        ctx.stroke();
        ctx.restore();

        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fef08a';
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(hazard.label, 0, hazard.radius + 13);
      } else {
        // Standard Sentinel Drones
        const pulse = Math.sin(this.gridGlowPhase * 3 + hazard.x) * 3;
        ctx.strokeStyle = 'rgba(244, 63, 94, 0.45)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(0, 0, hazard.radius + 8 + pulse, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#1e111a';
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, hazard.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.strokeStyle = 'rgba(254, 205, 211, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(
          Math.cos(hazard.heading) * (hazard.radius + 4),
          Math.sin(hazard.heading) * (hazard.radius + 4)
        );
        ctx.stroke();

        ctx.fillStyle = '#f43f5e';
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fda4af';
        ctx.font = '8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(hazard.label, 0, hazard.radius + 13);
      }

      ctx.restore();
    }
  }

  private renderTemporalProjection() {
    if (!this.futureState) return;

    const { ctx } = this;
    const { trajectory, playerPos, interceptWarning, timelineStatus } = this.futureState;

    // 1. Draw predictive trajectory path ribbon from present to future
    if (trajectory.length > 1) {
      ctx.save();
      ctx.strokeStyle = interceptWarning
        ? 'rgba(244, 63, 94, 0.65)'
        : timelineStatus === 'EXTRACTION_REACHED'
        ? 'rgba(16, 185, 129, 0.6)'
        : 'rgba(0, 240, 255, 0.45)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.lineDashOffset = -this.gridGlowPhase * 12;

      ctx.beginPath();
      ctx.moveTo(this.player.x, this.player.y);
      for (let i = 0; i < trajectory.length; i++) {
        ctx.lineTo(trajectory[i].x, trajectory[i].y);
      }
      ctx.stroke();
      ctx.restore();
    }

    // 2. Course Waypoint indicator if placed
    if (this.courseWaypoint) {
      ctx.save();
      ctx.translate(this.courseWaypoint.x, this.courseWaypoint.y);
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.moveTo(-14, 0);
      ctx.lineTo(14, 0);
      ctx.moveTo(0, -14);
      ctx.lineTo(0, 14);
      ctx.stroke();

      ctx.fillStyle = '#67e8f9';
      ctx.font = '8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('WAYPOINT', 0, 20);
      ctx.restore();
    }

    // 3. Render Intermediate & Horizon Future Hazard Shadows (T+15s, T+30s, T+45s, T+60s)
    if (this.futureState.hazardShadows && this.futureState.hazardShadows.length > 0) {
      // Connect future shadow line from present Omega to future positions
      const omegaPresent = this.hazards.find(h => h.id === 'hazard-chrono-omega');
      if (omegaPresent) {
        ctx.save();
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.35)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(omegaPresent.x, omegaPresent.y);
        for (const s of this.futureState.hazardShadows) {
          ctx.lineTo(s.x, s.y);
        }
        ctx.stroke();
        ctx.restore();
      }

      for (const shadow of this.futureState.hazardShadows) {
        ctx.save();
        ctx.translate(shadow.x, shadow.y);
        const isHorizon = shadow.timeOffset >= 59.0;
        const alpha = isHorizon ? 0.35 : 0.15;
        const strokeAlpha = isHorizon ? 0.9 : 0.45;

        // Shadow ring
        ctx.strokeStyle = `rgba(168, 85, 247, ${strokeAlpha})`;
        ctx.lineWidth = isHorizon ? 2 : 1;
        ctx.setLineDash(isHorizon ? [4, 2] : [2, 2]);
        ctx.beginPath();
        ctx.arc(0, 0, shadow.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Shadow body
        ctx.fillStyle = `rgba(168, 85, 247, ${alpha})`;
        ctx.beginPath();
        ctx.arc(0, 0, shadow.radius, 0, Math.PI * 2);
        ctx.fill();

        // Label
        ctx.fillStyle = isHorizon ? '#f3e8ff' : '#d8b4fe';
        ctx.font = isHorizon ? 'bold 8px monospace' : '7px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`SHADOW T+${shadow.timeOffset.toFixed(0)}s`, 0, isHorizon ? -shadow.radius - 5 : shadow.radius + 10);
        ctx.restore();
      }
    } else {
      // Fallback: Render single horizon hazards (T+60.00s)
      for (const fHazard of this.futureState.hazards) {
        ctx.save();
        ctx.translate(fHazard.x, fHazard.y);
        const isOmega = fHazard.id === 'hazard-chrono-omega';
        ctx.strokeStyle = isOmega ? 'rgba(168, 85, 247, 0.85)' : 'rgba(244, 63, 94, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.arc(0, 0, fHazard.radius + 4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = isOmega ? 'rgba(168, 85, 247, 0.15)' : 'rgba(244, 63, 94, 0.15)';
        ctx.beginPath();
        ctx.arc(0, 0, fHazard.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = isOmega ? '#e9d5ff' : '#fecdd3';
        ctx.font = 'bold 7px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${fHazard.label} (T+60s)`, 0, -fHazard.radius - 4);
        ctx.restore();
      }
    }

    // 4. Corridor Safe vs Hazardous Real-time Assessment Overlays
    if (this.futureState.routeAnalysis) {
      const { northStatus, southStatus } = this.futureState.routeAnalysis;
      ctx.save();
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';

      // North Corridor Badge
      const isNorthSafe = northStatus === 'SAFE';
      ctx.fillStyle = isNorthSafe ? 'rgba(16, 185, 129, 0.18)' : 'rgba(239, 68, 68, 0.18)';
      ctx.strokeStyle = isNorthSafe ? '#10b981' : '#ef4444';
      ctx.lineWidth = 1;
      ctx.fillRect(660, 68, 120, 20);
      ctx.strokeRect(660, 68, 120, 20);
      ctx.fillStyle = isNorthSafe ? '#a7f3d0' : '#fecaca';
      ctx.fillText(`NORTH: ${northStatus}`, 720, 81);

      // South Corridor Badge
      const isSouthSafe = southStatus === 'SAFE';
      ctx.fillStyle = isSouthSafe ? 'rgba(16, 185, 129, 0.18)' : 'rgba(239, 68, 68, 0.18)';
      ctx.strokeStyle = isSouthSafe ? '#10b981' : '#ef4444';
      ctx.lineWidth = 1;
      ctx.fillRect(660, 452, 120, 20);
      ctx.strokeRect(660, 452, 120, 20);
      ctx.fillStyle = isSouthSafe ? '#a7f3d0' : '#fecaca';
      ctx.fillText(`SOUTH: ${southStatus}`, 720, 465);

      ctx.restore();
    }

    // Future Gate T+60s Predicted State Overlay in Sector 02, Sector 03 & Sector 04
    if ((this.sector.id === 'SEC-02' || this.sector.id === 'SEC-03' || this.sector.id === 'SEC-04') && this.futureState.gateAnalysis) {
      const { futureIsOpen, futureNextTransition } = this.futureState.gateAnalysis;
      ctx.save();
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';

      const isSec04 = this.sector.id === 'SEC-04';
      const isSec03 = this.sector.id === 'SEC-03';
      const gateX = isSec04 ? 540 : isSec03 ? 550 : 580;
      const gateY = isSec04 ? 204 : isSec03 ? 204 : 210;
      const gateW = isSec04 ? 20 : isSec03 ? 20 : 16;
      const gateH = isSec04 ? 132 : isSec03 ? 132 : 120;
      const bannerX = isSec04 ? 460 : isSec03 ? 480 : 510;
      const bannerY = isSec04 ? 170 : isSec03 ? 170 : 175;
      const bannerW = isSec04 ? 180 : isSec03 ? 164 : 156;
      const bannerH = 22;

      const gateLabel = isSec04 ? 'LOCK' : isSec03 ? 'CASCADE' : 'GATE';
      const accentStroke = isSec04 ? 'rgba(236, 72, 153, 0.95)' : isSec03 ? 'rgba(192, 132, 252, 0.95)' : 'rgba(0, 240, 255, 0.9)';
      const accentFill = isSec04 ? 'rgba(236, 72, 153, 0.25)' : isSec03 ? 'rgba(192, 132, 252, 0.25)' : 'rgba(0, 240, 255, 0.2)';
      const bgBox = isSec04 ? 'rgba(76, 5, 45, 0.9)' : isSec03 ? 'rgba(59, 7, 100, 0.9)' : 'rgba(6, 78, 59, 0.9)';
      const borderBox = isSec04 ? '#ec4899' : isSec03 ? '#c084fc' : '#10b981';
      const textFill = isSec04 ? '#fbcfe8' : isSec03 ? '#e9d5ff' : '#6ee7b7';

      if (futureIsOpen) {
        ctx.strokeStyle = accentStroke;
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(gateX, gateY, gateW, gateH);
        ctx.setLineDash([]);
        ctx.fillStyle = accentFill;
        ctx.fillRect(gateX, gateY, gateW, gateH);

        ctx.fillStyle = bgBox;
        ctx.strokeStyle = borderBox;
        ctx.lineWidth = 1;
        ctx.fillRect(bannerX, bannerY, bannerW, bannerH);
        ctx.strokeRect(bannerX, bannerY, bannerW, bannerH);
        ctx.fillStyle = textFill;
        ctx.fillText(`T+60s ${gateLabel}: OPEN (${futureNextTransition.toFixed(1)}s)`, bannerX + bannerW / 2, bannerY + 14);
      } else {
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.9)';
        ctx.lineWidth = 2;
        ctx.strokeRect(gateX, gateY, gateW, gateH);
        ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
        ctx.fillRect(gateX, gateY, gateW, gateH);

        ctx.fillStyle = 'rgba(69, 10, 10, 0.9)';
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1;
        ctx.fillRect(bannerX, bannerY, bannerW, bannerH);
        ctx.strokeRect(bannerX, bannerY, bannerW, bannerH);
        ctx.fillStyle = '#fca5a5';
        ctx.fillText(`T+60s ${gateLabel}: CLOSED (${futureNextTransition.toFixed(1)}s)`, bannerX + bannerW / 2, bannerY + 14);
      }
      ctx.restore();
    }

    // 5. Intercept warning reticle on projected collision point
    if (interceptWarning && this.futureState.interceptTime !== undefined) {
      const targetTime = this.futureState.interceptTime;
      const interceptPt =
        trajectory.find(p => Math.abs(p.timeOffset - targetTime) < 1.0) ||
        trajectory[Math.floor(trajectory.length / 2)];

      if (interceptPt) {
        ctx.save();
        ctx.translate(interceptPt.x, interceptPt.y);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 16 + Math.sin(this.gridGlowPhase * 8) * 3, 0, Math.PI * 2);
        ctx.moveTo(-22, 0);
        ctx.lineTo(22, 0);
        ctx.moveTo(0, -22);
        ctx.lineTo(0, 22);
        ctx.stroke();

        ctx.fillStyle = '#fee2e2';
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`⚠ INTERCEPTION HAZARD (T+${targetTime.toFixed(1)}s)`, 0, -22);
        ctx.restore();
      }
    }

    // 5. Shimmering Holographic Future Player Ghost (+60.00s)
    ctx.save();
    ctx.translate(playerPos.x, playerPos.y);

    const pulse = Math.sin(this.gridGlowPhase * 4) * 2;
    ctx.strokeStyle = interceptWarning
      ? 'rgba(244, 63, 94, 0.8)'
      : 'rgba(168, 85, 247, 0.85)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.arc(0, 0, this.player.radius + 6 + pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Translucent ghost body
    ctx.fillStyle = interceptWarning
      ? 'rgba(244, 63, 94, 0.25)'
      : 'rgba(168, 85, 247, 0.25)';
    ctx.strokeStyle = interceptWarning ? '#f43f5e' : '#c084fc';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, this.player.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Projected heading arrow
    if (this.futureState.playerSpeed > 10) {
      ctx.strokeStyle = interceptWarning ? '#fda4af' : '#e9d5ff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(
        Math.cos(this.futureState.playerAngle) * (this.player.radius + 8),
        Math.sin(this.futureState.playerAngle) * (this.player.radius + 8)
      );
      ctx.stroke();
    }

    // Core holographic center
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Badge label
    ctx.fillStyle = interceptWarning ? '#fecdd3' : '#e9d5ff';
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('FUTURE T+60s', 0, -this.player.radius - 8);

    ctx.restore();

    // 6. On-screen Temporal Interception Alert Toast
    if (this.temporalInterceptionAlert && this.temporalAlertTimer > 0) {
      ctx.save();
      const alpha = Math.min(1, this.temporalAlertTimer);
      const bannerW = 600;
      const bannerH = 34;
      const bannerX = (this.sector.width - bannerW) / 2;
      const bannerY = 28;

      ctx.fillStyle = `rgba(15, 23, 42, ${alpha * 0.92})`;
      ctx.strokeStyle = `rgba(239, 68, 68, ${alpha})`;
      ctx.lineWidth = 1.5;
      ctx.fillRect(bannerX, bannerY, bannerW, bannerH);
      ctx.strokeRect(bannerX, bannerY, bannerW, bannerH);

      ctx.fillStyle = `rgba(254, 202, 202, ${alpha})`;
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(this.temporalInterceptionAlert, this.sector.width / 2, bannerY + 21);
      ctx.restore();
    }
  }

  private emitTelemetry() {
    if (!this.onTelemetryUpdate) return;

    const conduits = this.sector.interactiveElements.filter(e => e.type === 'conduit');
    const activeNodes = conduits.filter(c => c.isActivated).length;
    const door = this.sector.walls.find(w => w.id === 'door-extraction-gate');
    const exitPortal = this.sector.interactiveElements.find(e => e.type === 'exit_portal');

    this.onTelemetryUpdate({
      activeSectorId: this.sector.id,
      activeSectorName: this.sector.name,
      status: this.status,
      elapsedSeconds: this.elapsedSeconds,
      playerPos: { x: Math.round(this.player.x), y: Math.round(this.player.y) },
      playerVelocity: { x: Math.round(this.player.vx), y: Math.round(this.player.vy) },
      playerSpeed: Math.round(this.player.getSpeed()),
      activeNodesCount: activeNodes,
      totalNodesCount: conduits.length,
      doorUnlocked: door ? !door.isActive : false,
      exitReached: exitPortal ? exitPortal.isActivated : false,
      collisionCount: this.collisionCount,
      fps: this.fpsCounter,
      isPreviewActive: this.isPreviewActive,
      hazards: this.hazards,
      futureState: this.futureState,
      courseWaypoint: this.courseWaypoint,
      temporalInterceptionAlert: this.temporalInterceptionAlert,
    });
  }
}
