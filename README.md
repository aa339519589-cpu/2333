# AetherGrid

AetherGrid is a browser-native future city digital twin command center reconstructed from the original development transcript. It combines a procedurally generated 3D city, a causal real-time simulation Worker, event operations, time replay, a scene editor, analytics, global search, command palette, workspaces and PWA offline support.

## Features

- Seeded 3D city with 200+ buildings, roads, district rings, traffic nodes and autonomous drones.
- Clickable city assets with live district telemetry and clear 3D selection feedback.
- Web Worker simulation for power, traffic, air, water, communications, public safety, medical capacity and weather.
- Causal relationships: storms slow traffic, congestion raises pollution, heat raises grid load, outages degrade communications, incidents raise medical pressure.
- 24 event types with map markers, alert handling and resolution strategies that change future simulation behavior.
- Pause and 0.5× / 1× / 2× / 5× / 10× speed control.
- Historical state buffer with timeline scrubbing and explicit history mode.
- Scene editor for buildings, energy nodes, hospitals, communications towers and road status.
- Command palette (`Ctrl/Cmd+K`), global search (`Ctrl/Cmd+F`), camera modes, cruise and bookmarks.
- IndexedDB workspaces with save, load, import and export.
- PWA installability and service-worker caching.
- Hidden-style performance diagnostics for FPS, frame time, draw calls, triangles, heap and Worker state.

## Architecture

`src/city` generates deterministic city geometry. `src/simulation` contains strict typed domain models, the causal engine, Worker runtime and Worker client. `src/store` owns UI and replay state with Zustand and persists workspaces in IndexedDB. `src/components` contains the 3D command center and operational panels.

The 3D city uses a single instanced mesh for the building fleet to keep draw calls bounded. The simulation runs independently of React in a Web Worker. History is kept as immutable frames and replay only changes the inspected frame; live simulation continues separately.

## Project structure

```text
src/
  city/          procedural city model
  simulation/    causal engine + Web Worker
  store/         Zustand state + IndexedDB workspaces
  components/    3D twin and control surfaces
  lib/           formatting helpers
tests/e2e/       Playwright critical interaction test
.github/workflows/ci-pages.yml  verification and Pages deployment
```

## Local development

```bash
npm install
npm run dev
```

## Tests

```bash
npm test
npm run test:e2e
```

## Build

```bash
npm run typecheck
npm run lint
npm run build
```

## Performance design

- Instanced building geometry.
- Web Worker simulation.
- Bounded immutable history buffer.
- Memoized 3D scene component.
- Manual vendor chunks for Three.js and charting.
- Adaptive device pixel ratio.
- Event and workspace lists stay bounded.

## Deployment

Push to `main`. GitHub Actions runs type checking, lint, unit tests and a production build, then enables and deploys GitHub Pages.

## Known limits

The city is an operational simulation rather than a GIS-accurate model of a real municipality. Browser heap reporting is only available in browsers exposing the non-standard Performance Memory API. First-person mode uses a low eye-level camera with orbit interaction rather than full collision-aware walking.
