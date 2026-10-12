# HANDOFF — AI Learning Lab

Budget: **$100 API credits** (stated session 1). Session 1 spent a small share: scaffold + hub only.

## 1. Status

| # | Lab | Status | Anatomy figure |
|---|---|---|---|
| 0 | `hub` | **done** (3D map + list, progress counts, keyboard, phone layout, break-ui pass) | n/a |
| 1 | `tokenizer` | not started | no |
| 2 | `neural-net` | not started | no |
| 3 | `attention` | not started | no |
| 4 | `inference` | not started | no |
| 5 | `serving` | not started | no |
| 6 | `agent` | not started | no |

## 2. Exact next step

Build **Lab 1 `tokenizer`**, sim first:
1. `pnpm add gpt-tokenizer`, then create `src/sim/tokenizer/index.ts` (char / word / BPE tokenizers
   returning `{ text, id }[]` + count) and `src/sim/tokenizer/index.test.ts`. Run `pnpm test`.
2. Build the framework pieces the lab needs (none exist yet): `src/framework/LabShell.tsx`,
   `ControlPanel`, `MissionList`, `InspectPanel`, `LessonFlow`. Contract types already in
   `src/framework/types.ts`.
3. `src/labs/tokenizer/index.ts` exporting a `LabDefinition`; render it from
   `src/framework/LabPage.tsx` (currently an honest "Not built yet" card for every lab).
4. In `src/labs/registry.ts` set tokenizer `status: 'ready'` and its `missionCount`.
5. Missions write to `useProgress().completeMission(labId, missionId)` (`src/store/progressStore.ts`).

## 3. Known bugs

- None open. At 200% root font size map labels truncate hard ("Tok…"); the list beside the map
  shows full titles. Accepted.
- Hub 3D chunk (three.js) is ~940 kB; it is lazy-loaded so the list paints first. Vite's chunk-size
  warning is expected.

## 4. Decisions made

- **drei `<Html>` not used** for 3D labels: it threw a `removeChild` error and dropped a label under
  React 19. Labels are a DOM overlay pinned each frame by `LabelProjector` in `src/hub/HubScene.tsx`,
  sized to the box's on-screen width and truncated. Reuse this pattern in 3D labs.
- Unbuilt labs are clickable and open `/lab/:id`, which says plainly the lab isn't built (no fake UI).
- Hub flows left→right by prerequisite depth (`src/hub/layout.ts`); below 768px it flows top→bottom.
- Prerequisites: attention ← tokenizer + neural-net; inference ← attention; serving, agent ← inference.
- TypeScript resolved to 7.x; scripts use `tsc --noEmit` (not `tsc -b`). Vitest config lives in
  `vite.config.ts` (imports `defineConfig` from `vitest/config`).
- emilkowalski/skills committed under `.agents/skills/` (symlinked from `.claude/skills/`), so no
  reinstall needed. Anatomy skill **not** installed yet (not needed until all labs are done).
- Added `clsx` (on the pick-ui-library list). No motion library yet; CSS transitions + R3F damping suffice.

## 5. How to run

```
pnpm install && pnpm dev     # http://localhost:5173
pnpm test                    # vitest (sim + pure logic only)
pnpm typecheck && pnpm build
```
- Dev-only break-ui fixture: `http://localhost:5173/?data=worst` (9 long-titled labs, missions 0/1/4).
- Headless screenshots: Playwright is installed globally; launch Chromium with
  `--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader` for WebGL.
- Don't `pkill -f vite` from the Bash tool — it matches the tool's own shell and kills it.
- Session 1 push to GitHub failed (403: Claude GitHub App lacked repo access). Check that commits
  reached `origin` before building on them.

## 6. Do not redo

- Scaffold: Vite + React 19 + TS strict + Tailwind v4 + Zustand + React Router + Vitest + R3F/drei.
- `src/sim/rng.ts` (seeded mulberry32, tested). All randomness goes through it.
- `src/store/progress.ts` + `progressStore.ts` (localStorage key `ai-lab-progress`, tested).
- `src/hub/*`: hub is done; only update `src/labs/registry.ts` as labs ship.
- `src/framework/types.ts` (lab contract).
