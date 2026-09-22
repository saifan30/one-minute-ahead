import { InputState, Particle, Vector2D } from '../types/game';
import { soundFx } from './audio';

export class Player {
  public x: number;
  public y: number;
  public vx: number = 0;
  public vy: number = 0;
  public radius: number = 14;
  public maxSpeed: number = 260; // pixels per second
  public acceleration: number = 1400;
  public friction: number = 0.86;
  public angle: number = 0;
  public particles: Particle[] = [];
  
  private pulseTimer: number = 0;
  private stepSoundTimer: number = 0;

  constructor(startX: number, startY: number) {
    this.x = startX;
    this.y = startY;
  }

  public reset(startX: number, startY: number) {
    this.x = startX;
    this.y = startY;
    this.vx = 0;
    this.vy = 0;
    this.particles = [];
  }

  public update(dt: number, input: InputState) {
    let moveX = 0;
    let moveY = 0;

    if (input.left) moveX -= 1;
    if (input.right) moveX += 1;
    if (input.up) moveY -= 1;
    if (input.down) moveY += 1;

    // Normalize diagonal input vector
    if (moveX !== 0 && moveY !== 0) {
      const len = Math.SQRT2;
      moveX /= len;
      moveY /= len;
    }

    const isMoving = moveX !== 0 || moveY !== 0;

    if (isMoving) {
      this.vx += moveX * this.acceleration * dt;
      this.vy += moveY * this.acceleration * dt;

      // Calculate heading angle
      this.angle = Math.atan2(moveY, moveX);

      // Audio step pulse
      this.stepSoundTimer += dt;
      if (this.stepSoundTimer > 0.22) {
        soundFx.playStepPulse();
        this.stepSoundTimer = 0;
      }

      // Spawn thruster particles
      this.spawnThrusterParticles();
    } else {
      this.stepSoundTimer = 0.2;
    }

    // Apply friction/drag
    this.vx *= Math.pow(this.friction, dt * 60);
    this.vy *= Math.pow(this.friction, dt * 60);

    // Clamp max velocity
    const speed = Math.hypot(this.vx, this.vy);
    if (speed > this.maxSpeed) {
      const ratio = this.maxSpeed / speed;
      this.vx *= ratio;
      this.vy *= ratio;
    }

    // Small threshold cutoff
    if (Math.abs(this.vx) < 0.5) this.vx = 0;
    if (Math.abs(this.vy) < 0.5) this.vy = 0;

    // Integrate position
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Update particles
    this.updateParticles(dt);

    this.pulseTimer += dt * 3;
  }

  private spawnThrusterParticles() {
    if (Math.random() > 0.4) {
      const backAngle = this.angle + Math.PI + (Math.random() - 0.5) * 0.5;
      const speed = 40 + Math.random() * 60;
      const offset = this.radius * 0.8;
      
      this.particles.push({
        x: this.x - Math.cos(this.angle) * offset + (Math.random() - 0.5) * 4,
        y: this.y - Math.sin(this.angle) * offset + (Math.random() - 0.5) * 4,
        vx: Math.cos(backAngle) * speed + this.vx * 0.2,
        vy: Math.sin(backAngle) * speed + this.vy * 0.2,
        life: 0,
        maxLife: 0.25 + Math.random() * 0.2,
        color: Math.random() > 0.3 ? '#00f0ff' : '#38bdf8',
        size: 2 + Math.random() * 3,
        alpha: 0.8,
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
      p.alpha = 1 - (p.life / p.maxLife);
    }
  }

  public render(ctx: CanvasRenderingContext2D) {
    // Render exhaust particles first
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (1 - p.life / p.maxLife), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.save();
    ctx.translate(this.x, this.y);

    // Ambient glow underneath player
    const glowGradient = ctx.createRadialGradient(0, 0, 4, 0, 0, this.radius * 2.2);
    glowGradient.addColorStop(0, 'rgba(0, 240, 255, 0.45)');
    glowGradient.addColorStop(0.5, 'rgba(0, 240, 255, 0.15)');
    glowGradient.addColorStop(1, 'rgba(0, 240, 255, 0)');
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius * 2.2, 0, Math.PI * 2);
    ctx.fill();

    // Outer shield / chassis ring
    ctx.rotate(this.angle);

    // Outer hull
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Directional visor / nose cone
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(this.radius * 0.7, -4);
    ctx.lineTo(this.radius * 1.3, 0);
    ctx.lineTo(this.radius * 0.7, 4);
    ctx.closePath();
    ctx.fill();

    // Internal reactor core (pulsing)
    const corePulse = 0.8 + Math.sin(this.pulseTimer) * 0.2;
    ctx.fillStyle = '#e0f2fe';
    ctx.beginPath();
    ctx.arc(0, 0, 4 * corePulse, 0, Math.PI * 2);
    ctx.fill();

    // Side sensor vents
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(-this.radius * 0.6, -this.radius * 0.8, 3, 2);
    ctx.fillRect(-this.radius * 0.6, this.radius * 0.6, 3, 2);

    ctx.restore();
  }

  public getVelocity(): Vector2D {
    return { x: this.vx, y: this.vy };
  }

  public getSpeed(): number {
    return Math.hypot(this.vx, this.vy);
  }
}
