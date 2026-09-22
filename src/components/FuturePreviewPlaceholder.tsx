import React, { useEffect, useRef } from 'react';
import {
  Clock,
  Radio,
  Power,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Unlock,
  Crosshair,
  MapPin,
  HelpCircle,
} from 'lucide-react';
import { GameTelemetry, Vector2D } from '../types/game';

interface FuturePreviewProps {
  telemetry: GameTelemetry | null;
  onTogglePreview: () => void;
  onSetWaypoint?: (point: Vector2D | null) => void;
}

export const FuturePreviewPlaceholder: React.FC<FuturePreviewProps> = ({
  telemetry,
  onTogglePreview,
  onSetWaypoint,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isPreviewActive = telemetry?.isPreviewActive ?? true;
  const isSector4 = telemetry?.activeSectorId === 'SEC-04';
  const isSector3 = telemetry?.activeSectorId === 'SEC-03';
  const isSector2 = telemetry?.activeSectorId === 'SEC-02';
  const isCyclicSector = isSector2 || isSector3 || isSector4;

  // Main rendering loop for temporal preview
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let phase = 0;

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      const scaleX = w / 840;
      const scaleY = h / 540;

      // 1. STANDBY MODE RENDERING
      if (!isPreviewActive) {
        ctx.fillStyle = '#060910';
        ctx.fillRect(0, 0, w, h);

        // Cyber grid
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.05)';
        ctx.lineWidth = 1;
        const step = 20;
        ctx.beginPath();
        for (let x = 0; x <= w; x += step) {
          ctx.moveTo(x, 0);
          ctx.lineTo(x, h);
        }
        for (let y = 0; y <= h; y += step) {
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
        }
        ctx.stroke();

        // Oscilloscope timeline sine wave (Temporal Horizon Wave)
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.3)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let x = 0; x < w; x++) {
          const y =
            h / 2 +
            Math.sin(x * 0.04 + phase) * 10 +
            Math.sin(x * 0.02 - phase * 0.5) * 5;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Scanning radar line
        const sweepX = (phase * 50) % w;
        const sweepGrad = ctx.createLinearGradient(sweepX - 40, 0, sweepX, 0);
        sweepGrad.addColorStop(0, 'rgba(0, 240, 255, 0)');
        sweepGrad.addColorStop(1, 'rgba(0, 240, 255, 0.12)');
        ctx.fillStyle = sweepGrad;
        ctx.fillRect(sweepX - 40, 0, 40, h);

        ctx.strokeStyle = 'rgba(0, 240, 255, 0.6)';
        ctx.beginPath();
        ctx.moveTo(sweepX, 0);
        ctx.lineTo(sweepX, h);
        ctx.stroke();

        phase += 0.03;
        animId = requestAnimationFrame(render);
        return;
      }

      // 2. ACTIVE +60s TEMPORAL PREVIEW RENDERING
      const future = telemetry?.futureState;

      // Dark obsidian chamber slate with violet/cyan aura
      ctx.fillStyle = '#050711';
      ctx.fillRect(0, 0, w, h);

      ctx.save();
      ctx.scale(scaleX, scaleY);

      // Temporal Chamber Grid Lines
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.07)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x <= 840; x += 30) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 540);
      }
      for (let y = 0; y <= 540; y += 30) {
        ctx.moveTo(0, y);
        ctx.lineTo(840, y);
      }
      ctx.stroke();

      // Outer chamber perimeter walls (simplified sleek representations)
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.lineWidth = 1.5;

      // Outer boundaries
      ctx.fillRect(0, 0, 840, 24);
      ctx.strokeRect(0, 0, 840, 24);
      ctx.fillRect(0, 516, 840, 24);
      ctx.strokeRect(0, 516, 840, 24);
      ctx.fillRect(0, 0, 24, 540);
      ctx.strokeRect(0, 0, 24, 540);
      ctx.fillRect(816, 0, 24, 540);
      ctx.strokeRect(816, 0, 24, 540);

      const isSec04 = telemetry?.activeSectorId === 'SEC-04';
      const isSec03 = telemetry?.activeSectorId === 'SEC-03';
      const isSec02 = telemetry?.activeSectorId === 'SEC-02';

      if (isSec04) {
        // Sector 04: Temporal Lock Chamber Mini-Map
        // North Sanctuary (240-320, 24-140)
        ctx.fillRect(240, 24, 20, 116);
        ctx.strokeRect(240, 24, 20, 116);
        ctx.fillRect(320, 24, 20, 116);
        ctx.strokeRect(320, 24, 20, 116);

        // South Sanctuary (240-320, 400-516)
        ctx.fillRect(240, 400, 20, 116);
        ctx.strokeRect(240, 400, 20, 116);
        ctx.fillRect(320, 400, 20, 116);
        ctx.strokeRect(320, 400, 20, 116);

        // Mid-corridor compression baffles (440, 180, 20, 180)
        ctx.fillRect(440, 180, 20, 180);
        ctx.strokeRect(440, 180, 20, 180);

        // Central Barrier Walls (540, 24, 20, 180) & (540, 336, 20, 180)
        ctx.fillRect(540, 24, 20, 180);
        ctx.strokeRect(540, 24, 20, 180);
        ctx.fillRect(540, 336, 20, 180);
        ctx.strokeRect(540, 336, 20, 180);

        // Sanctuary Labels
        ctx.fillStyle = '#f43f5e';
        ctx.font = '7px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('SANCTUARY α', 280, 80);
        ctx.fillText('SANCTUARY β', 280, 460);

        // Temporal Lock Aperture (540, 204, 20, 132)
        const lockUnlocked = future?.lockAnalysis?.allSatisfied || (future?.gateAnalysis?.futureIsOpen ?? false);
        if (lockUnlocked) {
          ctx.strokeStyle = 'rgba(244, 63, 94, 0.95)';
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
          ctx.strokeRect(540, 204, 20, 132);
          ctx.setLineDash([]);

          ctx.fillStyle = 'rgba(244, 63, 94, 0.25)';
          ctx.fillRect(540, 204, 20, 132);

          ctx.fillStyle = '#ffe4e6';
          ctx.font = 'bold 8px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('LOCK OPEN', 550, 274);
        } else {
          ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
          ctx.fillRect(540, 204, 20, 132);
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2;
          ctx.strokeRect(540, 204, 20, 132);

          for (let b = 1; b <= 3; b++) {
            const ly = 204 + (132 / 4) * b;
            ctx.strokeStyle = 'rgba(254, 202, 202, 0.8)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(540, ly);
            ctx.lineTo(560, ly);
            ctx.stroke();
          }

          ctx.fillStyle = '#fca5a5';
          ctx.font = 'bold 7px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('LOCKED', 550, 274);
        }

        // Final Vault Anchor (740, 270)
        const portalRadius = 28;
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(740, 270, portalRadius + Math.sin(phase * 3) * 3, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = 'rgba(244, 63, 94, 0.25)';
        ctx.beginPath();
        ctx.arc(740, 270, portalRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fff1f2';
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('FINAL ANCHOR', 740, 274);
      } else if (isSec03) {
        // Sector 03: Temporal Cascade Chamber Mini-Map
        // West Staging Pockets (Alpha: 260-340, North/South)
        ctx.fillRect(260, 24, 20, 150);
        ctx.strokeRect(260, 24, 20, 150);
        ctx.fillRect(260, 366, 20, 150);
        ctx.strokeRect(260, 366, 20, 150);

        ctx.fillRect(340, 24, 20, 150);
        ctx.strokeRect(340, 24, 20, 150);
        ctx.fillRect(340, 366, 20, 150);
        ctx.strokeRect(340, 366, 20, 150);

        // Mid chamber baffles
        ctx.fillRect(440, 190, 20, 160);
        ctx.strokeRect(440, 190, 20, 160);

        // Central Barrier Walls (550, 24, 20, 180) & (550, 336, 20, 180)
        ctx.fillRect(550, 24, 20, 180);
        ctx.strokeRect(550, 24, 20, 180);
        ctx.fillRect(550, 336, 20, 180);
        ctx.strokeRect(550, 336, 20, 180);

        // Labels
        ctx.fillStyle = '#c084fc';
        ctx.font = '7px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('STAGING α', 300, 85);
        ctx.fillText('STAGING β', 300, 455);

        // Cascade Gate Aperture (550, 204, 20, 132)
        const gateFutureOpen = future?.gateAnalysis?.futureIsOpen ?? false;
        if (gateFutureOpen) {
          ctx.strokeStyle = 'rgba(192, 132, 252, 0.95)';
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
          ctx.strokeRect(550, 204, 20, 132);
          ctx.setLineDash([]);

          ctx.fillStyle = 'rgba(192, 132, 252, 0.25)';
          ctx.fillRect(550, 204, 20, 132);

          ctx.fillStyle = '#e9d5ff';
          ctx.font = 'bold 8px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('CASCADE OPEN', 560, 274);
        } else {
          ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
          ctx.fillRect(550, 204, 20, 132);
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2;
          ctx.strokeRect(550, 204, 20, 132);

          for (let b = 1; b <= 3; b++) {
            const ly = 204 + (132 / 4) * b;
            ctx.strokeStyle = 'rgba(254, 202, 202, 0.8)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(550, ly);
            ctx.lineTo(570, ly);
            ctx.stroke();
          }

          ctx.fillStyle = '#fca5a5';
          ctx.font = 'bold 7px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('BARRIER', 560, 274);
        }

        // Future Exit Portal / Cascade Anchor (730, 270)
        const portalRadius = 28;
        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(730, 270, portalRadius + Math.sin(phase * 3) * 3, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = 'rgba(192, 132, 252, 0.25)';
        ctx.beginPath();
        ctx.arc(730, 270, portalRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#f3e8ff';
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('CASCADE ANCHOR', 730, 274);
      } else if (isSec02) {
        // Sector 02: Future Gate Chamber Mini-Map
        // Staging cove north
        ctx.fillRect(360, 24, 18, 120);
        ctx.strokeRect(360, 24, 18, 120);
        ctx.fillRect(460, 24, 18, 120);
        ctx.strokeRect(460, 24, 18, 120);

        // Staging cove south
        ctx.fillRect(360, 396, 18, 120);
        ctx.strokeRect(360, 396, 18, 120);
        ctx.fillRect(460, 396, 18, 120);
        ctx.strokeRect(460, 396, 18, 120);

        // Central baffle
        ctx.fillRect(220, 200, 30, 140);
        ctx.strokeRect(220, 200, 30, 140);

        // Barrier walls
        ctx.fillRect(580, 24, 16, 186);
        ctx.strokeRect(580, 24, 16, 186);
        ctx.fillRect(580, 330, 16, 186);
        ctx.strokeRect(580, 330, 16, 186);

        // Labels
        ctx.fillStyle = '#64748b';
        ctx.font = '7px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('STAGING N', 410, 85);
        ctx.fillText('STAGING S', 410, 455);

        // Future Gate Aperture (580, 210, 16, 120)
        const gateFutureOpen = future?.gateAnalysis?.futureIsOpen ?? false;
        if (gateFutureOpen) {
          ctx.strokeStyle = 'rgba(0, 240, 255, 0.9)';
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
          ctx.strokeRect(580, 210, 16, 120);
          ctx.setLineDash([]);

          ctx.fillStyle = 'rgba(0, 240, 255, 0.2)';
          ctx.fillRect(580, 210, 16, 120);

          ctx.fillStyle = '#6ee7b7';
          ctx.font = 'bold 8px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('OPEN T+60s', 588, 275);
        } else {
          ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
          ctx.fillRect(580, 210, 16, 120);
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2;
          ctx.strokeRect(580, 210, 16, 120);

          for (let b = 1; b <= 3; b++) {
            const ly = 210 + (120 / 4) * b;
            ctx.strokeStyle = 'rgba(254, 202, 202, 0.8)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(580, ly);
            ctx.lineTo(596, ly);
            ctx.stroke();
          }

          ctx.fillStyle = '#fca5a5';
          ctx.font = 'bold 7px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('CLOSED', 588, 275);
        }

        // Future Exit Portal / Omega Anchor (740, 270)
        const portalRadius = 28;
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(740, 270, portalRadius + Math.sin(phase * 3) * 3, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = 'rgba(0, 240, 255, 0.25)';
        ctx.beginPath();
        ctx.arc(740, 270, portalRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#e0f2fe';
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('OMEGA ANCHOR', 740, 274);
      } else {
        // Sector 01: Calibration Chamber Mini-Map
        // Internal partitions
        ctx.fillRect(260, 24, 20, 180);
        ctx.strokeRect(260, 24, 20, 180);
        ctx.fillRect(260, 320, 20, 196);
        ctx.strokeRect(260, 320, 20, 196);

        // Central Pylons
        ctx.fillRect(380, 120, 60, 60);
        ctx.strokeRect(380, 120, 60, 60);
        ctx.fillRect(380, 360, 60, 60);
        ctx.strokeRect(380, 360, 60, 60);
        ctx.fillRect(500, 220, 40, 100);
        ctx.strokeRect(500, 220, 40, 100);

        // Gate Dividers
        ctx.fillRect(620, 24, 20, 170);
        ctx.strokeRect(620, 24, 20, 170);
        ctx.fillRect(620, 350, 20, 166);
        ctx.strokeRect(620, 350, 20, 166);

        // Central Divider in East Extraction Chamber (678, 220, 14, 100)
        ctx.fillRect(678, 220, 14, 100);
        ctx.strokeRect(678, 220, 14, 100);
        ctx.fillStyle = '#64748b';
        ctx.font = '7px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('DIVIDER', 685, 274);

        // Future Blast Door (620, 194 to 620+20, 194+156)
        const doorOpen = future?.doorUnlocked ?? false;
        if (doorOpen) {
          ctx.strokeStyle = 'rgba(16, 185, 129, 0.8)';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.strokeRect(620, 194, 20, 156);
          ctx.setLineDash([]);

          ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
          ctx.fillRect(620, 194, 20, 156);

          ctx.fillStyle = '#6ee7b7';
          ctx.font = 'bold 9px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('OPEN T+60s', 630, 275);
        } else {
          ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
          ctx.fillRect(620, 194, 20, 156);
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2;
          ctx.strokeRect(620, 194, 20, 156);

          // Laser bars
          for (let b = 1; b <= 3; b++) {
            const ly = 194 + (156 / 4) * b;
            ctx.strokeStyle = 'rgba(254, 202, 202, 0.8)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(620, ly);
            ctx.lineTo(640, ly);
            ctx.stroke();
          }

          ctx.fillStyle = '#fca5a5';
          ctx.font = 'bold 8px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('LOCKED', 630, 275);
        }

        // Circuit lines connecting conduits in future
        const cAlpha = future?.conduits.find((c) => c.id === 'conduit-alpha');
        const cBeta = future?.conduits.find((c) => c.id === 'conduit-beta');
        if (cAlpha && cBeta) {
          [cAlpha, cBeta].forEach((c) => {
            ctx.strokeStyle = c.isActivated
              ? 'rgba(16, 185, 129, 0.6)'
              : 'rgba(239, 68, 68, 0.25)';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.moveTo(c.x, c.y);
            ctx.lineTo(580, c.y);
            ctx.lineTo(620, 270);
            ctx.stroke();
            ctx.setLineDash([]);
          });
        }

        // Future Exit Portal / Temporal Anchor (760, 270)
        const portalRadius = 28;
        const portalOpen = doorOpen;
        ctx.strokeStyle = portalOpen ? '#00f0ff' : '#475569';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(760, 270, portalRadius + Math.sin(phase * 3) * 3, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = portalOpen
          ? 'rgba(0, 240, 255, 0.25)'
          : 'rgba(51, 65, 85, 0.2)';
        ctx.beginPath();
        ctx.arc(760, 270, portalRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = portalOpen ? '#e0f2fe' : '#94a3b8';
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(portalOpen ? 'ANCHOR' : 'LOCKED', 760, 274);

        // Future Conduits
        if (future?.conduits) {
          for (const conduit of future.conduits) {
            ctx.save();
            ctx.translate(conduit.x, conduit.y);

            ctx.strokeStyle = conduit.isActivated ? '#10b981' : '#ef4444';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(0, 0, 18, 0, Math.PI * 2);
            ctx.stroke();

            ctx.fillStyle = conduit.isActivated
              ? 'rgba(16, 185, 129, 0.3)'
              : 'rgba(239, 68, 68, 0.2)';
            ctx.beginPath();
            ctx.arc(0, 0, 18, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = conduit.isActivated ? '#34d399' : '#f87171';
            ctx.beginPath();
            ctx.moveTo(0, -5);
            ctx.lineTo(5, 0);
            ctx.lineTo(0, 5);
            ctx.lineTo(-5, 0);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = conduit.isActivated ? '#a7f3d0' : '#fecaca';
            ctx.font = '8px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(
              conduit.isActivated ? '[ACTIVE]' : '[OFFLINE]',
              0,
              27
            );

            ctx.restore();
          }
        }
      }

      // Render Intermediate Future Hazard Shadows (T+15s, T+30s, T+45s, T+60s)
      if (future?.hazardShadows && future.hazardShadows.length > 0) {
        // Future patrol connector path
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.3)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        for (let i = 0; i < future.hazardShadows.length; i++) {
          const s = future.hazardShadows[i];
          if (i === 0) ctx.moveTo(s.x, s.y);
          else ctx.lineTo(s.x, s.y);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        for (const shadow of future.hazardShadows) {
          ctx.save();
          ctx.translate(shadow.x, shadow.y);
          const isHorizon = shadow.timeOffset >= 59.0;

          ctx.strokeStyle = isHorizon ? '#a855f7' : 'rgba(168, 85, 247, 0.5)';
          ctx.lineWidth = isHorizon ? 2 : 1;
          ctx.setLineDash(isHorizon ? [] : [2, 2]);
          ctx.beginPath();
          ctx.arc(0, 0, shadow.radius, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.fillStyle = isHorizon
            ? 'rgba(168, 85, 247, 0.35)'
            : 'rgba(168, 85, 247, 0.12)';
          ctx.beginPath();
          ctx.arc(0, 0, shadow.radius, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = isHorizon ? '#e9d5ff' : '#c084fc';
          ctx.font = isHorizon ? 'bold 8px monospace' : '7px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(
            `Ω T+${shadow.timeOffset.toFixed(0)}s`,
            0,
            isHorizon ? -shadow.radius - 5 : shadow.radius + 10
          );
          ctx.restore();
        }
      }

      // Corridor Safe vs Hazardous Real-Time Route Indicators
      if (future?.routeAnalysis) {
        const { northStatus, southStatus } = future.routeAnalysis;
        ctx.save();
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'center';

        // North Approach Indicator (y: 75)
        const isNorthSafe = northStatus === 'SAFE';
        ctx.fillStyle = isNorthSafe ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)';
        ctx.strokeStyle = isNorthSafe ? '#10b981' : '#ef4444';
        ctx.lineWidth = 1;
        ctx.fillRect(660, 65, 120, 20);
        ctx.strokeRect(660, 65, 120, 20);
        ctx.fillStyle = isNorthSafe ? '#a7f3d0' : '#fecaca';
        ctx.fillText(`NORTH: ${northStatus}`, 720, 78);

        // South Approach Indicator (y: 455)
        const isSouthSafe = southStatus === 'SAFE';
        ctx.fillStyle = isSouthSafe ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)';
        ctx.strokeStyle = isSouthSafe ? '#10b981' : '#ef4444';
        ctx.lineWidth = 1;
        ctx.fillRect(660, 455, 120, 20);
        ctx.strokeRect(660, 455, 120, 20);
        ctx.fillStyle = isSouthSafe ? '#a7f3d0' : '#fecaca';
        ctx.fillText(`SOUTH: ${southStatus}`, 720, 468);

        ctx.restore();
      }

      // Future Moving Hazards at T+60.00s
      if (future?.hazards) {
        for (const hazard of future.hazards) {
          ctx.save();
          ctx.translate(hazard.x, hazard.y);

          const isOmega = hazard.id === 'hazard-chrono-omega';

          if (isOmega) {
            // Chrono Interceptor Omega T+60s Holographic Threat Field
            const pulse = Math.sin(phase * 5) * 4;
            ctx.strokeStyle = 'rgba(168, 85, 247, 0.8)';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([4, 3]);
            ctx.beginPath();
            ctx.arc(0, 0, hazard.radius + 10 + pulse, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.strokeStyle = '#f43f5e';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, hazard.radius + 2, 0, Math.PI * 2);
            ctx.stroke();

            ctx.fillStyle = 'rgba(30, 11, 36, 0.9)';
            ctx.beginPath();
            ctx.arc(0, 0, hazard.radius, 0, Math.PI * 2);
            ctx.fill();

            // Singularity dot
            ctx.fillStyle = '#f43f5e';
            ctx.beginPath();
            ctx.arc(0, 0, 4, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#f472b6';
            ctx.font = 'bold 8px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('CHRONO_Ω (T+60s)', 0, -hazard.radius - 8);
          } else {
            // Future scanner warning pulse
            const pulse = Math.sin(phase * 4 + hazard.x) * 4;
            ctx.strokeStyle = 'rgba(244, 63, 94, 0.5)';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.arc(0, 0, hazard.radius + 8 + pulse, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);

            // Drone body
            ctx.fillStyle = '#261220';
            ctx.strokeStyle = '#f43f5e';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, hazard.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Heading cone
            ctx.strokeStyle = '#fda4af';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(
              Math.cos(hazard.heading) * (hazard.radius + 5),
              Math.sin(hazard.heading) * (hazard.radius + 5)
            );
            ctx.stroke();

            // Label
            ctx.fillStyle = '#fda4af';
            ctx.font = '8px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(hazard.label + ' T+60s', 0, -hazard.radius - 6);
          }

          ctx.restore();
        }
      }

      // Trajectory Ribbon from Present Probe to Future Ghost
      if (future?.trajectory && future.trajectory.length > 1) {
        ctx.strokeStyle = future.interceptWarning
          ? 'rgba(244, 63, 94, 0.7)'
          : 'rgba(0, 240, 255, 0.65)';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([5, 4]);
        ctx.lineDashOffset = -phase * 15;

        ctx.beginPath();
        const start = future.trajectory[0];
        ctx.moveTo(start.x, start.y);
        for (let i = 1; i < future.trajectory.length; i++) {
          ctx.lineTo(future.trajectory[i].x, future.trajectory[i].y);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // Small present origin marker
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(start.x, start.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Hazard Intercept Warning Reticle along timeline if detected
      if (future?.interceptWarning && future.interceptTime !== undefined) {
        // Find waypoint closest to interceptTime
        const interceptPoint =
          future.trajectory.find(
            (p) => Math.abs(p.timeOffset - future.interceptTime!) < 1.5
          ) || future.trajectory[Math.floor(future.trajectory.length / 2)];

        if (interceptPoint) {
          ctx.save();
          ctx.translate(interceptPoint.x, interceptPoint.y);

          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, 16 + Math.sin(phase * 6) * 3, 0, Math.PI * 2);
          ctx.moveTo(-22, 0);
          ctx.lineTo(22, 0);
          ctx.moveTo(0, -22);
          ctx.lineTo(0, 22);
          ctx.stroke();

          ctx.fillStyle = '#fee2e2';
          ctx.font = 'bold 8px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`⚠ INTERCEPT T+${future.interceptTime.toFixed(1)}s`, 0, -24);
          ctx.restore();
        }
      }

      // Course Waypoint Marker if set
      if (telemetry?.courseWaypoint) {
        const wp = telemetry.courseWaypoint;
        ctx.save();
        ctx.translate(wp.x, wp.y);
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.moveTo(-16, 0);
        ctx.lineTo(16, 0);
        ctx.moveTo(0, -16);
        ctx.lineTo(0, 16);
        ctx.stroke();

        ctx.fillStyle = '#67e8f9';
        ctx.font = '8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('TARGET', 0, 22);
        ctx.restore();
      }

      // Future Player Ghost Probe (+60.00s)
      if (future?.playerPos) {
        const fp = future.playerPos;
        ctx.save();
        ctx.translate(fp.x, fp.y);

        // Quantum pulse rings
        const ringPulse = Math.sin(phase * 5) * 3;
        ctx.strokeStyle = future.interceptWarning ? '#f43f5e' : '#a855f7';
        ctx.lineWidth = 2;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.arc(0, 0, 16 + ringPulse, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Translucent probe core
        ctx.fillStyle = future.interceptWarning
          ? 'rgba(244, 63, 94, 0.4)'
          : 'rgba(168, 85, 247, 0.4)';
        ctx.strokeStyle = future.interceptWarning ? '#f43f5e' : '#c084fc';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Speed vector arrow
        if (future.playerSpeed > 10) {
          ctx.strokeStyle = '#e9d5ff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(
            Math.cos(future.playerAngle) * 20,
            Math.sin(future.playerAngle) * 20
          );
          ctx.stroke();
        }

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = future.interceptWarning ? '#fca5a5' : '#e9d5ff';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('PROBE (T+60s)', 0, -18);

        ctx.restore();
      }

      ctx.restore();

      // Subtle CRT phosphor horizontal scanlines
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      for (let y = 0; y < h; y += 3) {
        ctx.fillRect(0, y, w, 1);
      }

      phase += 0.03;
      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isPreviewActive, telemetry]);

  // Click on the future sensor canvas to place or clear course waypoint
  const handleSensorCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onSetWaypoint || !canvasRef.current || !isPreviewActive) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const sectorX = (clickX / rect.width) * 840;
    const sectorY = (clickY / rect.height) * 540;

    // Check if clicked near existing waypoint to clear it
    if (telemetry?.courseWaypoint) {
      const dist = Math.hypot(
        telemetry.courseWaypoint.x - sectorX,
        telemetry.courseWaypoint.y - sectorY
      );
      if (dist < 30) {
        onSetWaypoint(null);
        return;
      }
    }

    if (sectorX >= 24 && sectorX <= 816 && sectorY >= 24 && sectorY <= 516) {
      onSetWaypoint({ x: Math.round(sectorX), y: Math.round(sectorY) });
    }
  };

  const elapsed = telemetry?.elapsedSeconds ?? 0;
  const futureElapsed = elapsed + 60;
  const fMin = Math.floor(futureElapsed / 60);
  const fSec = Math.floor(futureElapsed % 60);
  const fCent = Math.floor((futureElapsed * 100) % 100);
  const projectedTimestamp = `T+ ${fMin.toString().padStart(2, '0')}:${fSec
    .toString()
    .padStart(2, '0')}.${fCent.toString().padStart(2, '0')}`;

  const future = telemetry?.futureState;
  const isIntercept = future?.interceptWarning ?? false;
  const isClear = future?.exitReached ?? false;

  return (
    <div className="flex flex-col bg-[#090e17] border border-cyan-900/60 rounded-lg p-3.5 shadow-lg relative overflow-hidden select-none">
      {/* Corner Sci-Fi accents */}
      <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 border-cyan-400" />
      <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2 border-cyan-400" />
      <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b-2 border-l-2 border-cyan-400" />
      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 border-cyan-400" />

      {/* Sensor Header with Toggle Button */}
      <div className="flex items-center justify-between border-b border-cyan-950/80 pb-2 mb-2.5">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-mono font-bold tracking-wider text-slate-200">
            TEMPORAL SENSOR MODULE
          </span>
        </div>

        <button
          id="btn-toggle-future-preview"
          onClick={onTogglePreview}
          title="Toggle Temporal Preview [SPACE]"
          className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-mono font-bold tracking-wide transition border cursor-pointer ${
            isPreviewActive
              ? 'bg-cyan-950/90 text-cyan-300 border-cyan-500 shadow-[0_0_10px_rgba(0,240,255,0.3)]'
              : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-slate-200'
          }`}
        >
          <Power className={`w-3 h-3 ${isPreviewActive ? 'text-cyan-400' : 'text-slate-500'}`} />
          <span>{isPreviewActive ? 'FEED: ONLINE' : 'FEED: STANDBY'}</span>
          <kbd className="text-[9px] px-1 bg-slate-800 rounded border border-slate-700 text-slate-300">
            SPACE
          </kbd>
        </button>
      </div>

      {/* Main Temporal Simulation Canvas */}
      <div className="relative w-full aspect-[14/9] rounded border border-cyan-900/50 overflow-hidden bg-black flex items-center justify-center group">
        <canvas
          id="sensor-temporal-canvas"
          ref={canvasRef}
          width={420}
          height={270}
          onClick={handleSensorCanvasClick}
          className={`w-full h-full block ${
            isPreviewActive ? 'cursor-crosshair' : 'cursor-pointer'
          }`}
        />

        {/* Overlay Badges on Top of Canvas */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5 pointer-events-none">
          <span className="px-1.5 py-0.5 rounded bg-black/80 border border-cyan-900/80 text-[10px] font-mono text-cyan-400">
            OFFSET: +60.00s
          </span>
          {isPreviewActive && (
            <span
              className={`px-1.5 py-0.5 rounded border text-[10px] font-mono font-bold ${
                isIntercept
                  ? 'bg-rose-950/90 border-rose-500 text-rose-200'
                  : isClear
                  ? 'bg-emerald-950/90 border-emerald-500 text-emerald-200'
                  : 'bg-emerald-950/80 border-emerald-600 text-emerald-300'
              }`}
            >
              {isIntercept
                ? '⚠ INTERCEPTION HAZARD'
                : isClear
                ? '★ EXTRACTION READY'
                : '✔ TIMELINE: NOMINAL'}
            </span>
          )}
        </div>

        {/* Target future timestamp */}
        <div className="absolute top-2 right-2 bg-black/80 border border-cyan-900/80 px-1.5 py-0.5 rounded text-[10px] font-mono text-cyan-300 pointer-events-none">
          PROJ: {projectedTimestamp}
        </div>

        {/* Prompt overlay when in standby */}
        {!isPreviewActive && (
          <div
            onClick={onTogglePreview}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center p-3 cursor-pointer bg-black/40 hover:bg-black/20 transition"
          >
            <div className="w-10 h-10 rounded-full bg-cyan-950/90 border border-cyan-500/70 flex items-center justify-center mb-2 shadow-[0_0_15px_rgba(0,240,255,0.3)] group-hover:scale-105 transition">
              <Radio className="w-5 h-5 text-cyan-400 animate-pulse" />
            </div>
            <p className="text-xs font-mono font-bold text-cyan-300 tracking-wider mb-0.5">
              TEMPORAL FEED // STANDBY
            </p>
            <p className="text-[10px] font-mono text-slate-300 max-w-[220px]">
              Click or press <kbd className="px-1 py-0.2 bg-slate-800 rounded border border-slate-700 text-cyan-300">SPACE</kbd> to activate +60s future projection.
            </p>
          </div>
        )}

        {/* Interactive Waypoint Helper Bar */}
        {isPreviewActive && (
          <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between pointer-events-none text-[9px] font-mono text-slate-400 bg-black/70 px-2 py-0.5 rounded border border-cyan-950/60">
            <span className="text-cyan-400/90">
              {telemetry?.courseWaypoint ? 'WAYPOINT ENGAGED' : 'CLICK TO SET WAYPOINT'}
            </span>
            <span>WASD CHANGES FUTURE IN REAL-TIME</span>
          </div>
        )}
      </div>

      {/* Temporal Interception Diagnostic Alert Banner */}
      {isPreviewActive && (
        <div
          className={`mt-2 px-2.5 py-1.5 rounded border text-[10px] font-mono flex items-start gap-2 ${
            isIntercept
              ? 'bg-rose-950/70 border-rose-500/80 text-rose-200 shadow-[0_0_8px_rgba(244,63,94,0.2)]'
              : isClear
              ? 'bg-emerald-950/70 border-emerald-500/80 text-emerald-200 shadow-[0_0_8px_rgba(16,185,129,0.2)]'
              : 'bg-emerald-950/50 border-emerald-800/60 text-emerald-200'
          }`}
        >
          {isIntercept ? (
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            {isIntercept ? (
              <span>
                <strong className="text-rose-300">INTERCEPTION HAZARD:</strong>{' '}
                Collision predicted at T+{future?.interceptTime?.toFixed(1)}s with{' '}
                {future?.interceptHazardLabel || 'CHRONO_HAZARD'}! Reroute flight vector or hold in staging cove.
              </span>
            ) : isClear ? (
              <span>
                <strong className="text-emerald-300">TIMELINE: NOMINAL:</strong>{' '}
                {isSector4
                  ? 'Temporal Lock conditions fully satisfied! Secure vector to Final Vault Anchor ready!'
                  : isSector3
                  ? 'Cascade trajectory coordinated! Safe passage through Cascade Gate to extraction point confirmed!'
                  : isSector2
                  ? 'Flight vector clears Future Gate and reaches Omega Anchor safely!'
                  : 'Flight vector reaches Temporal Anchor safely without interception. Safe extraction ready!'}
              </span>
            ) : isSector4 ? (
              <span>
                <strong className="text-rose-300">TEMPORAL LOCK TIMELINE:</strong>{' '}
                {future?.lockAnalysis?.allSatisfied
                  ? `TRIPLE-STATE LOCK BREACHED AT T+60s! Gate open & Overseer clear. Proceed to extraction!`
                  : `LOCK ACTIVE AT T+60s: Gate ${
                      future?.lockAnalysis?.gateApertureOpen ? 'OPEN' : 'CLOSED'
                    } | Overseer ${
                      future?.lockAnalysis?.overseerSweepClear ? 'CLEAR' : 'SWEEPING'
                    } | Probe ${
                      future?.lockAnalysis?.playerInSafeCorridor ? 'IN CORRIDOR' : 'SANCTUARY'
                    }.`}
              </span>
            ) : isSector3 ? (
              <span>
                <strong className="text-purple-300">CASCADE GATE TIMELINE:</strong>{' '}
                {future?.gateAnalysis?.futureIsOpen
                  ? `APERTURE OPENS AT T+60s (window active for ${future.gateAnalysis.futureNextTransition.toFixed(1)}s). Advance probe now!`
                  : `APERTURE CLOSED AT T+60s (opens in ${future?.gateAnalysis?.futureNextTransition.toFixed(1)}s). Hold in staging pocket!`}
              </span>
            ) : isSector2 ? (
              <span>
                <strong className="text-cyan-300">FUTURE GATE TIMELINE:</strong>{' '}
                {future?.gateAnalysis?.futureIsOpen
                  ? `APERTURE OPENS AT T+60s (window active for ${future.gateAnalysis.futureNextTransition.toFixed(1)}s). Advance probe now!`
                  : `APERTURE CLOSED AT T+60s (opens in ${future?.gateAnalysis?.futureNextTransition.toFixed(1)}s). Hold in staging cove!`}
              </span>
            ) : (
              <span>
                <strong className="text-emerald-300">TIMELINE: NOMINAL:</strong>{' '}
                Corridor clear of future hazard shadows. Safe transit vector confirmed.
              </span>
            )}
          </div>
        </div>
      )}

      {/* Deterministic Cycle Status Bar for Sector 02, Sector 03 & Sector 04 */}
      {isCyclicSector && future?.gateAnalysis && (
        <div className="mt-2 p-2 rounded bg-[#060910] border border-cyan-900/60 font-mono text-[10px]">
          <div className="flex items-center justify-between mb-1">
            <span className="text-slate-400 font-bold flex items-center gap-1">
              <Clock className="w-3 h-3 text-cyan-400" />
              {isSector4
                ? 'LOCK ALIGNMENT (15s OVERSEER × 24s APERTURE)'
                : isSector3
                ? 'CASCADE TIMELINE (16s DRONE × 24s GATE)'
                : 'CYCLE TIMELINE (24s PERIOD)'}
            </span>
            <span
              className={`font-bold ${
                isSector4
                  ? future.lockAnalysis?.allSatisfied
                    ? 'text-emerald-400'
                    : future.gateAnalysis.futureIsOpen
                    ? 'text-rose-400'
                    : 'text-amber-400'
                  : future.gateAnalysis.futureIsOpen
                  ? 'text-emerald-400'
                  : 'text-amber-400'
              }`}
            >
              T+60s:{' '}
              {isSector4
                ? future.lockAnalysis?.allSatisfied
                  ? 'LOCK UNLOCKED'
                  : future.gateAnalysis.futureIsOpen
                  ? 'APERTURE OPEN (OVERSEER ACTIVE)'
                  : 'LOCK CLOSED'
                : future.gateAnalysis.futureIsOpen
                ? isSector3
                  ? 'CASCADE OPEN'
                  : 'APERTURE OPEN'
                : isSector3
                ? 'CASCADE CLOSED'
                : 'APERTURE CLOSED'}
            </span>
          </div>

          {/* Visual 24s period bar */}
          <div className="relative w-full h-4 bg-slate-900 rounded overflow-hidden border border-slate-700/80 mb-1 flex">
            {/* 0-14s: Closed (58.3%) */}
            <div
              className="h-full bg-rose-950/70 border-r border-rose-800/80 flex items-center justify-center text-[8px] text-rose-300"
              style={{ width: `${(14 / 24) * 100}%` }}
            >
              CLOSED (14s)
            </div>
            {/* 14-22s: Open (33.3%) */}
            <div
              className="h-full bg-emerald-950/90 border-r border-emerald-600/80 flex items-center justify-center text-[8px] text-emerald-300 font-bold"
              style={{ width: `${(8 / 24) * 100}%` }}
            >
              OPEN (8s)
            </div>
            {/* 22-24s: Closed (8.3%) */}
            <div
              className="h-full bg-rose-950/70 flex items-center justify-center text-[7px] text-rose-300"
              style={{ width: `${(2 / 24) * 100}%` }}
            >
              2s
            </div>

            {/* Present Phase Marker */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-cyan-400 shadow-[0_0_6px_#00f0ff] z-10"
              style={{ left: `${(future.gateAnalysis.presentPhase / 24) * 100}%` }}
              title={`Present T: ${future.gateAnalysis.presentPhase.toFixed(1)}s`}
            />

            {/* Future Phase Marker (T+60s) */}
            <div
              className="absolute top-0 bottom-0 w-1.5 bg-purple-400 shadow-[0_0_8px_#c084fc] z-10"
              style={{ left: `${(future.gateAnalysis.futurePhase / 24) * 100}%` }}
              title={`Future T+60s: ${future.gateAnalysis.futurePhase.toFixed(1)}s`}
            />
          </div>

          <div className="flex items-center justify-between text-[9px] text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              PRESENT:{' '}
              <strong className={future.gateAnalysis.presentIsOpen ? 'text-emerald-400' : 'text-slate-300'}>
                {future.gateAnalysis.presentIsOpen ? 'OPEN' : 'CLOSED'}
              </strong>{' '}
              ({future.gateAnalysis.presentNextTransition.toFixed(1)}s)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
              T+60s:{' '}
              <strong className={future.gateAnalysis.futureIsOpen ? 'text-emerald-400' : 'text-amber-400'}>
                {future.gateAnalysis.futureIsOpen ? 'OPEN' : 'CLOSED'}
              </strong>{' '}
              ({future.gateAnalysis.futureNextTransition.toFixed(1)}s)
            </span>
          </div>
        </div>
      )}

      {/* Transit Corridor Quick-Waypoint Nav Controls */}
      {isPreviewActive && onSetWaypoint && (
        <div className="mt-2 pt-2 border-t border-cyan-950/70 flex flex-wrap items-center gap-1.5 text-[9px] font-mono">
          <span className="text-slate-400 text-[9px] mr-1 flex items-center gap-1">
            <Crosshair className="w-3 h-3 text-cyan-400" />
            CHART ROUTE:
          </span>

          {isSector4 ? (
            <>
              <button
                id="btn-nav-sanctuary-north"
                onClick={() => onSetWaypoint({ x: 280, y: 85 })}
                className="px-2 py-0.5 bg-slate-900/90 hover:bg-rose-950 text-slate-300 hover:text-rose-300 border border-slate-700/60 rounded transition cursor-pointer"
              >
                SANCTUARY α (Y:85)
              </button>

              <button
                id="btn-nav-sanctuary-south"
                onClick={() => onSetWaypoint({ x: 280, y: 455 })}
                className="px-2 py-0.5 bg-slate-900/90 hover:bg-rose-950 text-slate-300 hover:text-rose-300 border border-slate-700/60 rounded transition cursor-pointer"
              >
                SANCTUARY β (Y:455)
              </button>

              <button
                id="btn-nav-lock-gate"
                onClick={() => onSetWaypoint({ x: 540, y: 270 })}
                className={`px-2 py-0.5 border rounded transition cursor-pointer flex items-center gap-1 ${
                  future?.gateAnalysis?.futureIsOpen
                    ? 'bg-rose-950/80 hover:bg-rose-900 text-rose-200 border-rose-500/70'
                    : 'bg-amber-950/60 hover:bg-amber-900 text-amber-200 border-amber-700/60'
                }`}
              >
                <span>TEMPORAL LOCK GATE</span>
                <span className="text-[8px] font-bold">
                  [{future?.gateAnalysis?.futureIsOpen ? 'T+60s OPEN' : 'T+60s CLOSED'}]
                </span>
              </button>

              <button
                id="btn-nav-final-anchor"
                onClick={() => onSetWaypoint({ x: 740, y: 270 })}
                className="px-2 py-0.5 bg-slate-900/90 hover:bg-emerald-950 text-slate-300 hover:text-emerald-300 border border-slate-700/60 hover:border-emerald-500/50 rounded transition cursor-pointer"
              >
                FINAL ANCHOR
              </button>
            </>
          ) : isSector3 ? (
            <>
              <button
                id="btn-nav-cascade-north"
                onClick={() => onSetWaypoint({ x: 300, y: 90 })}
                className="px-2 py-0.5 bg-slate-900/90 hover:bg-purple-950 text-slate-300 hover:text-purple-300 border border-slate-700/60 rounded transition cursor-pointer"
              >
                STAGING α (Y:90)
              </button>

              <button
                id="btn-nav-cascade-south"
                onClick={() => onSetWaypoint({ x: 300, y: 450 })}
                className="px-2 py-0.5 bg-slate-900/90 hover:bg-purple-950 text-slate-300 hover:text-purple-300 border border-slate-700/60 rounded transition cursor-pointer"
              >
                STAGING β (Y:450)
              </button>

              <button
                id="btn-nav-cascade-gate"
                onClick={() => onSetWaypoint({ x: 550, y: 270 })}
                className={`px-2 py-0.5 border rounded transition cursor-pointer flex items-center gap-1 ${
                  future?.gateAnalysis?.futureIsOpen
                    ? 'bg-purple-950/80 hover:bg-purple-900 text-purple-200 border-purple-500/70'
                    : 'bg-amber-950/60 hover:bg-amber-900 text-amber-200 border-amber-700/60'
                }`}
              >
                <span>CASCADE GATE</span>
                <span className="text-[8px] font-bold">
                  [{future?.gateAnalysis?.futureIsOpen ? 'T+60s OPEN' : 'T+60s CLOSED'}]
                </span>
              </button>

              <button
                id="btn-nav-cascade-anchor"
                onClick={() => onSetWaypoint({ x: 730, y: 270 })}
                className="px-2 py-0.5 bg-slate-900/90 hover:bg-emerald-950 text-slate-300 hover:text-emerald-300 border border-slate-700/60 hover:border-emerald-500/50 rounded transition cursor-pointer"
              >
                CASCADE ANCHOR
              </button>
            </>
          ) : isSector2 ? (
            <>
              <button
                id="btn-nav-staging-north"
                onClick={() => onSetWaypoint({ x: 410, y: 100 })}
                className="px-2 py-0.5 bg-slate-900/90 hover:bg-cyan-950 text-slate-300 hover:text-cyan-300 border border-slate-700/60 rounded transition cursor-pointer"
              >
                STAGING NORTH (Y:100)
              </button>

              <button
                id="btn-nav-staging-south"
                onClick={() => onSetWaypoint({ x: 410, y: 440 })}
                className="px-2 py-0.5 bg-slate-900/90 hover:bg-cyan-950 text-slate-300 hover:text-cyan-300 border border-slate-700/60 rounded transition cursor-pointer"
              >
                STAGING SOUTH (Y:440)
              </button>

              <button
                id="btn-nav-future-gate"
                onClick={() => onSetWaypoint({ x: 580, y: 270 })}
                className={`px-2 py-0.5 border rounded transition cursor-pointer flex items-center gap-1 ${
                  future?.gateAnalysis?.futureIsOpen
                    ? 'bg-emerald-950/80 hover:bg-emerald-900 text-emerald-200 border-emerald-500/70'
                    : 'bg-amber-950/60 hover:bg-amber-900 text-amber-200 border-amber-700/60'
                }`}
              >
                <span>FUTURE GATE (X:580)</span>
                <span className="text-[8px] font-bold">
                  [{future?.gateAnalysis?.futureIsOpen ? 'T+60s OPEN' : 'T+60s CLOSED'}]
                </span>
              </button>

              <button
                id="btn-nav-omega-anchor"
                onClick={() => onSetWaypoint({ x: 740, y: 270 })}
                className="px-2 py-0.5 bg-slate-900/90 hover:bg-emerald-950 text-slate-300 hover:text-emerald-300 border border-slate-700/60 hover:border-emerald-500/50 rounded transition cursor-pointer"
              >
                OMEGA ANCHOR
              </button>
            </>
          ) : (
            <>
              <button
                id="btn-nav-north-route"
                onClick={() => onSetWaypoint({ x: 695, y: 125 })}
                className={`px-2 py-0.5 border rounded transition cursor-pointer flex items-center gap-1 ${
                  future?.routeAnalysis?.northStatus === 'SAFE'
                    ? 'bg-emerald-950/80 hover:bg-emerald-900 text-emerald-200 border-emerald-500/70'
                    : 'bg-rose-950/60 hover:bg-rose-900 text-rose-200 border-rose-700/60'
                }`}
              >
                <span>NORTH ROUTE (Y:125)</span>
                <span className="text-[8px] font-bold">
                  [{future?.routeAnalysis?.northStatus ?? 'ROUTE'}]
                </span>
              </button>

              <button
                id="btn-nav-south-route"
                onClick={() => onSetWaypoint({ x: 695, y: 415 })}
                className={`px-2 py-0.5 border rounded transition cursor-pointer flex items-center gap-1 ${
                  future?.routeAnalysis?.southStatus === 'SAFE'
                    ? 'bg-emerald-950/80 hover:bg-emerald-900 text-emerald-200 border-emerald-500/70'
                    : 'bg-rose-950/60 hover:bg-rose-900 text-rose-200 border-rose-700/60'
                }`}
              >
                <span>SOUTH ROUTE (Y:415)</span>
                <span className="text-[8px] font-bold">
                  [{future?.routeAnalysis?.southStatus ?? 'ROUTE'}]
                </span>
              </button>

              <button
                id="btn-nav-anchor"
                onClick={() => onSetWaypoint({ x: 760, y: 270 })}
                className="px-2 py-0.5 bg-slate-900/90 hover:bg-emerald-950 text-slate-300 hover:text-emerald-300 border border-slate-700/60 hover:border-emerald-500/50 rounded transition cursor-pointer"
              >
                TEMPORAL ANCHOR
              </button>
            </>
          )}

          {telemetry?.courseWaypoint && (
            <button
              id="btn-clear-waypoint"
              onClick={() => onSetWaypoint(null)}
              className="px-2 py-0.5 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-700/60 rounded transition cursor-pointer ml-auto"
            >
              CLEAR TARGET
            </button>
          )}
        </div>
      )}

      {/* Detailed Future Projection Telemetry Readout */}
      <div className="grid grid-cols-3 gap-2 mt-2.5 pt-2 border-t border-cyan-950/80 text-[10px] font-mono">
        <div className="flex flex-col bg-[#05080e] p-1.5 rounded border border-cyan-950/60">
          <span className="text-slate-500 text-[9px]">PROJECTED POS</span>
          <span className="text-cyan-300 font-semibold truncate">
            {future ? `${Math.round(future.playerPos.x)}, ${Math.round(future.playerPos.y)}` : '--'}
          </span>
        </div>

        <div className="flex flex-col bg-[#05080e] p-1.5 rounded border border-cyan-950/60">
          <span className="text-slate-500 text-[9px]">
            {isSector4
              ? 'T+60s LOCK'
              : isCyclicSector
              ? 'T+60s GATE'
              : 'PREDICTED GATE'}
          </span>
          <span
            className={`font-semibold ${
              isSector4
                ? future?.lockAnalysis?.allSatisfied
                  ? 'text-emerald-400'
                  : future?.gateAnalysis?.futureIsOpen
                  ? 'text-rose-400'
                  : 'text-amber-400'
                : isCyclicSector
                ? future?.gateAnalysis?.futureIsOpen
                  ? 'text-emerald-400'
                  : 'text-amber-400'
                : future?.doorUnlocked
                ? 'text-emerald-400'
                : 'text-rose-400'
            }`}
          >
            {isSector4
              ? future?.lockAnalysis?.allSatisfied
                ? 'UNLOCKED'
                : future?.gateAnalysis?.futureIsOpen
                ? 'APERTURE OPEN'
                : 'LOCKED'
              : isCyclicSector
              ? future?.gateAnalysis?.futureIsOpen
                ? 'OPEN'
                : 'CLOSED'
              : future?.doorUnlocked
              ? 'UNLOCKED'
              : 'LOCKED'}
          </span>
        </div>

        <div className="flex flex-col bg-[#05080e] p-1.5 rounded border border-cyan-950/60">
          <span className="text-slate-500 text-[9px]">HORIZON STATUS</span>
          <span
            className={`font-semibold ${
              isIntercept
                ? 'text-rose-400'
                : 'text-emerald-400'
            }`}
          >
            {isIntercept
              ? 'INTERCEPTION HAZARD'
              : 'TIMELINE: NOMINAL'}
          </span>
        </div>
      </div>
    </div>
  );
};
