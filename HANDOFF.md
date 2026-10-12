# HANDOFF — AI Learning Lab

Budget: **$100 API credits** (stated session 1). Session 1 built scaffold + hub, then (at the user's request) Lab 1 and a hub redesign. Roughly 20–25% of the budget used so far (estimate).

## 1. Status

| # | Lab | Status | Anatomy figure |
|---|---|---|---|
| 0 | `hub` | **done**: diorama of pedestals with a 3D model per lab (painted = built, clay = not built), hover animates the mechanism, mission pips, list, keyboard, phone layout | n/a |
| 1 | `tokenizer` | **done**: char / toy-word / real GPT-4o BPE rows, drag-to-split with live preview, context dial, 8 steps, 3 missions + break-it. break-ui done informally (long rare word, Hindi/emoji, overflow, 390px); no `?data=worst` fixture yet | no |
| 2 | `neural-net` | not started | no |
| 3 | `attention` | not started | no |
| 4 | `inference` | not started | no |
| 5 | `serving` | not started | no |
| 6 | `agent` | not started | no |

## 2. Exact next step

Build **Lab 2 `neural-net`**, sim first:
1. `src/sim/mlp/index.ts`: tiny MLP (2→H→1, tanh/sigmoid), real forward + backward, SGD step,
   XOR + 2-D spiral datasets from `src/sim/rng.ts`, train/held-out split, loss. Tests in
   `src/sim/mlp/index.test.ts` (gradient check vs finite differences, XOR converges, huge LR diverges).
2. `src/labs/neural-net/{definition.ts,store.ts,Scene.tsx,NeuralNetLab.tsx}`. Copy the shape of
   `src/labs/tokenizer/` (definition = steps/missions/explanations/simplifications; store = Zustand).
3. Register in `src/labs/components.ts` and set `status: 'ready'`, `missionCount` in `src/labs/registry.ts`.
4. Scene: weights drawn on the connections and draggable (pointer drag changes the weight; output
   surface on `<canvas>` redraws while dragging). Break it: LR too high.

## 3. Known bugs

- None open. At 200% root font size map labels truncate hard ("Tok…"); the list beside the map
  shows full titles. Accepted.
- Hub 3D chunk (three.js) is ~940 kB; it is lazy-loaded so the list paints first. Vite's chunk-size
  warning is expected.

## 4. Decisions made

- **User override (session 1):** built Lab 1 *and* redesigned the hub in the same session as the
  scaffold, despite the one-lab-per-session rule. The user asked for both.
- Tokenizer BPE row uses **GPT-4o's o200k_base** (most relevant today); the inference lab will use
  GPT-2's own tokenizer. The lab's simplifications say so.
- gpt-tokenizer decodes via one shared streaming TextDecoder; `src/sim/tokenizer/index.ts` flushes it
  after every decode (`decodeClean`), otherwise byte-fragment tokens corrupt later results.
- Lab layout: scene scrolls on its own (desktop) with the ControlPanel pinned under it, so controls
  never cover the scene. Drag auto-scrolls near the scene's edges.
- Fonts: Bricolage Grotesque (display), Instrument Sans (body), IBM Plex Mono (token ids), from Google Fonts.

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

## 6. Do not redo

- Scaffold: Vite + React 19 + TS strict + Tailwind v4 + Zustand + React Router + Vitest + R3F/drei.
- `src/sim/rng.ts` (seeded mulberry32, tested). All randomness goes through it.
- `src/store/progress.ts` + `progressStore.ts` (localStorage key `ai-lab-progress`, tested).
- `src/hub/*`: hub is done; only update `src/labs/registry.ts` as labs ship.
- `src/framework/*` (LabShell, LessonFlow, MissionList, ExplanationPanel, InspectPanel, ControlPanel, types).
- `src/sim/tokenizer/*` + `src/labs/tokenizer/*` (Lab 1).
- Hosted preview: `pnpm build:preview` → `dist-preview/`, published as a claude.ai artifact
  (https://claude.ai/artifact/Aa83TZRjd9aopfenv11U15). Republish after each lab.
