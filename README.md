# ONE MINUTE AHEAD

> **SEE THE FUTURE. CHANGE THE PRESENT.**

## Overview

**ONE MINUTE AHEAD** is an original browser-based sci-fi temporal puzzle game built around a deterministic 60-second future-preview mechanic. Players pilot a temporal probe through high-security test chambers, reading telemetry exactly 60.0 seconds into the future to evade moving hazards, align with cyclic aperture windows, and extract temporal anchors before timeline collapse.

---

## Core Gameplay Loop

The gameplay is driven by a five-stage foresight loop:

```
SEE THE FUTURE  ──>  DECIDE  ──>  CHANGE THE PRESENT  ──>  SURVIVE THE FUTURE  ──>  EXTRACT
```

1. **SEE THE FUTURE**: Activate the Temporal Sensor to render your simulated position, velocity, and hazard positions at `T+60.0s`.
2. **DECIDE**: Analyze future aperture states (`OPEN` vs. `CLOSED`), hazard trajectory sweeps, and route safety indicators.
3. **CHANGE THE PRESENT**: Alter velocity vectors, change heading toward North/South corridors, or hold position in staging sanctuaries.
4. **SURVIVE THE FUTURE**: Resolve `INTERCEPTION HAZARD` warnings until the predictive telemetry reads `TIMELINE: NOMINAL`.
5. **EXTRACT**: Coordinate arrival at the temporal gate aperture and synchronize the chamber's Temporal Anchor.

---

## Key Features

- **Deterministic T+60 Temporal Prediction**: Simulates 180 forward steps over a precise 60-second horizon using real kinematics, wall damping, and cyclic time equations.
- **Predictive Player Trajectory**: Visualizes the player's continuous flight path and future probe ghost at `T+60s`.
- **Future Hazard Visualization**: Displays multi-point hazard shadow paths (`T+15s`, `T+30s`, `T+45s`, `T+60s`) and real-time corridor safety assessments.
- **Dedicated Temporal Sensor**: Interactive sensor viewport that renders real-time lookahead telemetry alongside present-state diagnostics.
- **Dynamic Interception Detection**: Automatic collision prediction triggering `INTERCEPTION HAZARD` warnings when flight trajectories overlap hazard danger zones.
- **Deterministic Temporal Gates**: Apertures operating on exact mathematical periods requiring forward synchronization to traverse safely.
- **Tactical Route & Timing Decisions**: Choose between North/South corridors and staging zones based on future obstacle placements.
- **Four Playable Sectors**: A complete campaign progressing from baseline calibration to multi-cyclic synchronization and triple-state alignment.
- **Kinematic Physics & Wall Sliding**: Continuous vector propulsion, friction damping, acceleration limits, and smooth bounding-box collision resolution.
- **Multi-Modal Controls**: Full support for desktop keyboard shortcuts, canvas click-to-waypoint charting, sensor interactions, and mobile virtual D-pads.
- **Custom Web Audio Synthesizer**: Procedurally synthesized polyphonic audio effects using clean exponential gain ramps for thrust pulses, conduit links, aperture transitions, and warning alerts.
- **Responsive Sci-Fi Interface**: Dark sci-fi HUD layout with high-contrast objective banners, live timer counters, modal briefings, and viewport scaling.

---

## Sectors

### SEC-01 — CALIBRATION
- **Objective**: Synchronize Conduits Alpha and Beta to disengage the blast gate and reach the Temporal Anchor.
- **Intel**: A Chrono Interceptor operates on a 12-second horizontal patrol across the central transit corridor.
- **Foresight Focus**: Establishing baseline predictive kinematics and corridor selection (North vs. South).

### SEC-02 — FUTURE GATE
- **Objective**: Use the future gate state and temporal prediction to pass through the Future Gate.
- **Intel**: Flux Sentinels guard ingress channels. The Future Gate operates on a strict 24-second deterministic cycle (14s closed, 8s open, 2s transition).
- **Foresight Focus**: Staging in North/South pockets to align arrival with the future open aperture window.

### SEC-03 — TEMPORAL CASCADE
- **Objective**: Coordinate the future gate and Sentinel hazard to reach extraction.
- **Intel**: Dual non-harmonic cycles: a 16-second sweeping Cascade Drone combined with a 24-second Cascade Gate.
- **Foresight Focus**: Multi-period harmonic synchronization to avoid transit sweeps while the aperture is open.

### SEC-04 — TEMPORAL LOCK
- **Objective**: Use the 60-second prediction to coordinate the Temporal Lock and final extraction.
- **Intel**: A 15-second Lock Overseer, an orbital Lock Guardian, and a 24-second Lock Aperture requiring simultaneous +60s alignment.
- **Foresight Focus**: Triple-state alignment, Sanctuary Alpha/Beta staging, and breach of the Final Vault Anchor.

---

## Controls

### Desktop Keyboard
| Key | Action |
| :--- | :--- |
| **W / A / S / D** | Propulsion & Vector Thrust (Up / Left / Down / Right) |
| **Arrow Keys** | Alternative Propulsion Controls |
| **SPACE / F / T** | Toggle +60s Temporal Preview |
| **R** | Restart Current Sector |
| **P / ESC** | Pause / Resume Simulation |
| **M** | Toggle Audio Mute / Unmute |
| **C** | Clear Course Waypoint |

### Mouse & Waypoint Charting
- **Click on Viewport Canvas**: Chart a tactical course waypoint for automated steering.
- **Click on Temporal Sensor**: Set target waypoints directly within the predictive sensor viewport.
- **Click on Target Waypoint / Press C**: Clear the charted waypoint.

### Mobile & Touchscreen
- **Virtual D-Pad**: On-screen directional buttons for vector propulsion.
- **Action Buttons**: Dedicated touch buttons for `+60s PREVIEW` and `RESTART`.

---

## Technology Stack

- **Framework**: React 19 (`react`, `react-dom`)
- **Language**: TypeScript 5 (`strict` type checking)
- **Build Tool**: Vite 8 with `@vitejs/plugin-react`
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`)
- **Rendering Engine**: HTML5 Canvas 2D Context (`requestAnimationFrame` loop)
- **Audio Engine**: Web Audio API (`AudioContext`, `OscillatorNode`, `GainNode`)
- **Icons**: Lucide React (`lucide-react`)

---

## Project Structure

```
├── public/
│   └── vite.svg
├── src/
│   ├── components/
│   │   ├── ControlOverlay.tsx           # Mobile touch virtual D-pad & buttons
│   │   ├── ControlsModal.tsx            # Keybinding & control reference dialog
│   │   ├── FuturePreviewPlaceholder.tsx # Temporal Sensor canvas & future telemetry
│   │   ├── GameCanvas.tsx               # Primary 2D simulation canvas & input router
│   │   ├── HowToPlayModal.tsx           # Gameplay tutorial & mechanics overview
│   │   ├── HUD.tsx                      # In-game telemetry header & action toolbar
│   │   ├── SectorBriefingModal.tsx      # Sector threat intel & objective briefings
│   │   ├── StatusOverlay.tsx            # Pause & Sector Clear overlay dialogs
│   │   ├── TitleScreen.tsx              # Opening title menu & sector direct access
│   │   └── VictoryScreen.tsx            # Campaign completion protocol & statistics
│   ├── game/
│   │   ├── audio.ts                     # Web Audio API sound synthesizer
│   │   ├── collision.ts                 # Vector math, line-circle & AABB collision
│   │   ├── engine.ts                    # Main game loop, player physics & state manager
│   │   ├── environment.ts               # Sector definitions, cyclic gate & hazard formulas
│   │   ├── player.ts                    # Kinematic player entity & vector physics
│   │   └── simulation.ts                # Deterministic 60-second lookahead simulator
│   ├── types/
│   │   └── game.ts                      # Shared TypeScript interfaces, types & enums
│   ├── App.tsx                          # Root application component & screen coordinator
│   ├── index.css                        # Global Tailwind CSS styling entry
│   └── main.tsx                         # React application entry point
├── index.html                           # HTML5 host document & meta headers
├── metadata.json                        # Application metadata & platform settings
├── package.json                         # Project dependencies & build scripts
├── tsconfig.json                        # TypeScript compiler configuration
└── vite.config.ts                       # Vite configuration
```

---

## Running Locally

### Prerequisites
- Node.js 18 or later
- npm or bun

### Installation & Execution
1. Clone the repository and navigate to the project root:
   ```bash
   git clone <repository-url>
   cd one-minute-ahead
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```
   The application will be accessible at `http://localhost:3000`.

4. Type-check the codebase:
   ```bash
   npm run lint
   ```

5. Build for production:
   ```bash
   npm run build
   ```

---

## Deployment

The application compiles into static production assets via Vite:
```bash
npm run build
```
Compiled output is written to the `dist/` directory, ready for deployment to static hosting platforms, Cloud Run, Vercel, Netlify, or GitHub Pages.

---

## Game Design Principle

In **ONE MINUTE AHEAD**, the 60-second temporal prediction is not a decorative visual flourish—it is an essential gameplay decision mechanic:

- **Information Over Reflexes**: The chambers are mathematically calibrated so that entering active hazard lanes without foresight leads to deterministic interception.
- **Action-Reaction Coupling**: Every thrust input in the present instantly shifts the future trajectory ribbon, requiring deliberate vector planning.
- **Foresight as Navigation**: Players use the lookahead window to read cyclical gate apertures and plan multi-stage maneuvers before committing to restricted corridors.

---

## Credits

- **Developer**: Saifan Khalfe
- **Challenge**: Developed for the **EVOX 1.0** game-building challenge.

---

## Originality

**ONE MINUTE AHEAD** is an original game project. All core simulation algorithms, deterministic lookahead mathematics, collision resolution pipelines, level designs, audio synthesis routines, and user interface components were developed specifically for this game.
