# CLAUDE.md — AI Learning Lab

## ⚠ Read first, every session

1. **UI skill:** This project uses **https://github.com/emilkowalski/skills** for all UI,
   animation, and design decisions. Install once with `npx skills@latest add emilkowalski/skills`.
   Use `emil-design-eng` as the default for any component or layout work, `animate` when
   adding motion, `review-animations` before marking a lab done, `pick-ui-library` before
   adding any UI dependency, and `break-ui` as the last step of every lab.
2. **Explanation-figure skill:** This project uses **https://github.com/wheresryan22/anatomy**
   to build the explanatory "how this mechanism works" figures inside each lab.
   Install once with `npx skills add wheresryan22/anatomy -g -a claude-code`.
   Read the **Anatomy rules** section below before invoking it. It is expensive.
3. **Check `HANDOFF.md`** if it exists. It tells you exactly where the previous session stopped.
   Start there. Do not re-plan, re-scaffold, or re-read the whole codebase.
4. **Budget is finite.** Either $100 API credits total, or Max-plan 5-hour usage windows —
   the user will say which. Follow the Budget Protocol below without exception.

## What we are building

An interactive browser-based lab for learning how modern AI works by manipulating
simulations, not reading about them. The user is a beginner who will be perceived as an
expert; technical accuracy matters more than polish.

Core loop every lab must deliver: **user acts → mechanism responds → user observes → user understands why.**

It should **feel like a game** — direct manipulation, instant feedback, things you can grab,
turn, break and fix — **without being gamified**. No points, scores, coins, streaks, quests,
mascots or rewards. The interaction itself is the teaching. See **Interaction standard**.

## Who this is for

An absolute beginner who creates AI content and is assumed by their audience to be an
expert. They will repeat what they learn here on camera. They want to understand real
mechanisms without an engineering degree, and they want to *touch* AI, not read about it.

Every teaching decision follows from that:
- **Intuition first, terminology second.** Show it working, let them play, *then* name it.
- **Simple, but never wrong.** A true simplification with an honest "here's what's left out"
  beats a slick analogy that breaks. Don't let them say something false on camera.
- **Never overwhelming.** One idea per step. If a screen needs more than one sentence of
  instructions, the screen is wrong.
- **Fastest path to understanding, not completeness.** Skip what doesn't change how they'd
  explain AI to someone else.
- **Always connect to the big picture.** After each lab, one line on how it feeds the next:
  trained weights → used in inference → called by an agent → costs money to serve.
- **No fake interactions.** If a control doesn't change a real computation, delete it.

Unsure whether something is too technical or too shallow? Ask:
*"Would this help them explain it correctly and confidently to a smart friend?"*

## Interaction standard (what "like a game" means here)

Every lab must pass all of these before it's called done:

- **Direct manipulation over forms.** Drag the weight, don't type it. Grab the token, don't
  pick it from a dropdown. Turn the dial, don't enter a number. Sliders are the fallback,
  not the default.
- **Feedback within one frame.** The thing you touched responds *while* you're touching it,
  not after you release. Loss updates as the weight drags. Attention arrows redraw as the
  mask toggles.
- **Hover tells you what's grabbable.** Anything interactive lifts, glows or shows a cursor
  change on hover, following `emil-design-eng`. Nothing interactive looks static.
- **You can break it, and un-break it.** Every lab has at least one way to make the
  mechanism fail visibly (learning rate too high → loss explodes; context too long → OOM;
  remove a tool → agent gets stuck) and a one-click Reset.
- **Missions, not quizzes.** Each lab has 2–4 short missions, phrased as something to *do*,
  not something to answer: "Make the network overfit", "Find the two tokens that attend to
  each other most", "Get latency under 200ms without dropping a request". The lab detects
  completion from sim state. No score — a mission is either done or not.
- **Discovery before explanation.** The explanation panel for a mechanism stays collapsed
  until the user has touched that mechanism at least once. Then it opens with the name and
  the one-sentence truth.
- **Keyboard works.** Arrow keys nudge the selected control; Space steps; R resets; Esc deselects.

## Anatomy rules (budget-critical — read before every `/anatomy` call)

Anatomy builds dense, hand-crafted isometric figures. It is slow by design: its own README
says a figure is "a long session". Unconstrained, it will consume the whole budget on
three pretty machines and zero working labs. Therefore:

1. **Lab first, figure second.** Never invoke Anatomy until the lab's sim module has passing
   tests *and* the lab's raw interactive UI works end to end. The figure is the explanation
   layer, not the lab.
2. **One figure per lab, maximum.** It lives in the lab's "Understand" step and the
   InspectPanel. The main interactive scene is still built with the stack below.
3. **The figure's readout is driven by the lab's sim module, not by Anatomy's own toy model.**
   Anatomy wants to invent a small model to drive its readout; replace it with imports from
   `src/sim/<lab>/`. If the figure shows a number, it must be the same number the lab computes.
   Wire it through the lab's Zustand store so dragging in the main scene moves the figure too.
4. **SVG mode only.** No WebGL shaders, no 3D mode (beta, slow audit). React output
   (`kit/react/`), light theme first, dark second.
5. **Checks, not audits.** Run `scripts/lines.mjs` and a single `capture.mjs` screenshot.
   Skip `--audit` and the orbit audit unless the user explicitly asks.
6. **Cap the parts.** Target 30–60 solids per figure, like `dial-indicator`, not 240 like
   `arcade-cabinet`. The purpose is clarity of mechanism, not density.
7. **Name the idea, not the drawing.** Prompt Anatomy with the mechanism and the true numbers
   from the sim (e.g. "a 2-layer MLP with 2→4→1 neurons, weights in [-2,2], loss readout"),
   and let it invent the object.
8. **Figures are last, not first.** Build all labs in the table before any figure. Then build
   figures in this priority: `attention`, `inference`, `neural-net`, `serving`. On API credits,
   skip figures entirely if under $30 remains. On Max, don't start a figure with under
   90 minutes left in the window. Either way, note what was skipped in `HANDOFF.md`.

Suggested figures (invent better ones if they explain the mechanism more honestly):
- `neural-net` → a signal passing through a chain of adjustable valves/amplifiers; the final
  needle reads the prediction, a second needle reads the error.
- `attention` → a switchboard where each token's plug connects to every other with a dial
  for strength; causal mask physically drops a shutter over the future.
- `inference` → a conveyor that feeds tokens through a stamping machine one at a time, with
  a shelf (KV cache) where processed parts are kept so they aren't re-stamped.
- `serving` → a loading dock with GPU bays, memory as shelf space, requests as crates.

## Budget Protocol (mandatory)

- Work in **one lab per session**. Commit after each lab. Never start a second lab in the same session.
- Before any substantial piece of work, estimate whether it fits the remaining budget the user stated.
  If unsure, ask.
- **When the user says budget is running low, or you suspect the session may be the last, or
  before any task that could consume more than ~15% of the remaining budget (Anatomy figures
  always count as this):**
  write/update **`HANDOFF.md`** immediately, then commit. Do this *before* continuing work, not after.
- `HANDOFF.md` must contain, in this order:
  1. **Status table** — every lab in `labs/` with one of: `done` / `in-progress (what works, what doesn't)` / `not started`, plus a column for whether its Anatomy figure exists.
  2. **Exact next step** — the single concrete task to do next, with file paths. Written so a fresh Claude with zero context can start in under 2 minutes.
  3. **Known bugs** — anything broken, with repro steps.
  4. **Decisions made** — any deviation from this file and why.
  5. **How to run** — `pnpm install && pnpm dev`, test command, anything non-obvious.
  6. **Do not redo** — list of things that are finished and must not be rebuilt.
- Keep `HANDOFF.md` under 150 lines. It's a map, not a diary.
- Update `HANDOFF.md` at the end of every session regardless of budget. Cheap insurance.

## Stack (do not change without updating this file)

- Vite + React 19 + TypeScript (strict). Package manager: pnpm.
- 3D: `@react-three/fiber` + `@react-three/drei`. Use only where 3D earns it (see Labs).
- 2D: plain SVG in React, or `<canvas>` for anything with >500 elements. No charting library.
- Explanatory figures: Anatomy's `kit/react/` components, under the rules above.
- State: Zustand. One store per lab, plus one global `progressStore` (localStorage-persisted;
  tracks completed missions and opened explanations).
- Routing: React Router. Routes: `/` (hub map), `/lab/:id`.
- Tests: Vitest. **Every simulation module must have tests. UI does not need tests.**
- Styling: Tailwind. Follow emilkowalski/skills for everything else (shadows, easing, durations).
- In-browser real model: `@huggingface/transformers` (Transformers.js) for the inference lab only.
  Model: `Xenova/gpt2` or smaller. **Never call a paid API from this app.**
- Tokenizer: `gpt-tokenizer` (real BPE, runs in browser).

## Architecture rule #1: simulation ≠ rendering

```
src/
  sim/            ← pure TypeScript. No React, no DOM, no Three. Fully unit-tested.
    mlp/          ← tiny MLP, real forward/backward, SGD/Adam
    tokenizer/    ← wrapper over gpt-tokenizer + a naive char/word tokenizer for comparison
    attention/    ← single-layer toy transformer, real softmax, causal mask, multi-head
    serving/      ← queueing model: requests, GPUs, KV cache memory, batching
    agent/        ← rule-based agent loop with explicit, inspectable rules
  labs/           ← one folder per lab. Each exports a `LabDefinition`.
    <id>/figure/  ← the lab's Anatomy figure, if built. Imports from src/sim only.
  framework/      ← LabShell, LessonFlow, ControlPanel, InspectPanel, MissionList
  hub/            ← the map
  store/
```

Every lab's visuals — scene *and* figure — read from its sim module. **Controls change sim
state; sim state drives visuals.** A control that changes only a visual effect is a bug.

Simulations must be **deterministic**: all randomness goes through a seeded PRNG (`sim/rng.ts`).
"Reset" restores the seed.

## The lab contract

```ts
interface LabDefinition {
  id: string;
  title: string;
  prerequisites: string[];          // lab ids
  renderMode: '3d' | '2d';
  simplifications: string[];        // shown in InspectPanel. REQUIRED. What differs from real LLMs.
  steps: LessonStep[];              // Observe → Predict → Interact → Discover → Understand → Inspect → Apply → Recall
  missions: Mission[];              // 2–4. { id, text, isComplete(simState) => boolean }
  breakIt: { hint: string; isBroken(simState) => boolean };   // the designed failure mode
}
```

Layout (fixed, do not redesign per lab): scene fills main area; explanation panel right (or below
on narrow), collapsed until first interaction; control panel bottom-left with **max 3 controls
visible per step** (progressive disclosure — unlock more as steps advance); MissionList top-right,
small; InspectPanel collapsible, holds the Anatomy figure when one exists.

Every lab needs: Reset, Step (where there's a sequence), Replay. Pause if it animates.

Wrong answer to a prediction: do not reveal the answer. Show what actually happened and ask again.

## Technical honesty (non-negotiable)

- `simplifications[]` must be filled in truthfully for every lab.
- Never label a toy model as a real LLM. The inference lab must say which parts come from the
  real GPT-2 weights and which are toy.
- 3D positions in the embedding lab are a projection (PCA). Say so on screen.
- No fake training curves, no pre-scripted "learning" animations. If a number is shown, it was computed.
- An Anatomy figure is a **metaphor for** the mechanism. Its caption must say so in one line
  ("This valve chain is a picture of the math, not the math") and link to the InspectPanel.

## Labs — build order and scope

Build strictly in this order. Do not start N+1 until N passes `break-ui`, tests, and the
Interaction standard. Anatomy figures come after all labs (Anatomy rule 8).

| # | id | mode | sim module | scope notes |
|---|---|---|---|---|
| 0 | `hub` | 3d (light) | — | Map of labs as connected nodes. Click → navigate. Shows progress + missions done. Keep it small; it's a menu, not a world. |
| 1 | `tokenizer` | 2d | `sim/tokenizer` | Live text input. Side-by-side: char / word / BPE. Drag a word onto each tokenizer and watch it split. Token IDs, count, context-window bar. Presets: English, rare word, code, Hindi/mixed. Break it: paste something that blows the context bar. |
| 2 | `neural-net` | 2d | `sim/mlp` | 2-layer MLP on XOR and a 2D spiral. **Drag weights directly on the connections**, see output surface change live. Train step, LR slider, loss curve, noisy data toggle, overfit demo with held-out set. Break it: LR too high. |
| 3 | `attention` | 3d | `sim/attention` | Tokens as grabbable objects. Select token → see Q/K/V bars. Pair → score. **Drag arrow thickness to edit weights.** Causal mask toggle. Head switcher. Before/after residual. Baked-in weights from a small trained toy; disclose. Break it: mask off on a causal model. |
| 4 | `inference` | 2d | `sim/attention` + Transformers.js | Step-through: tokenize → embed → layers → logits → sample → KV cache → loop. Temperature, top-p, greedy/sampling. Real GPT-2 logits. Break it: temperature 2.0. |
| 5 | `serving` | 3d | `sim/serving` | GPUs, requests, KV cache as memory blocks you can watch fill. Batch size, concurrency, ctx length, quantization. OOM is modeled, not faked. Break it: exceed memory. |
| 6 | `agent` | 2d | `sim/agent` | Goal + tools + world state. Rule-based; rules shown on screen. **Drag tools in/out of the agent's belt.** Inject bad observation, change permissions. Break it: remove the one tool it needs. |
| 7+ | remaining curriculum | — | — | Only after 0–6 are done. See `CURRICULUM.md` (create it when you get here, not before). |

Curriculum topics not yet labs get a short "concept card" (text + one small diagram) linked
from the hub, marked clearly as "not yet interactive." Never fake interactivity.

## Working style

- Read only the files you need. Grep before opening.
- Prefer small targeted edits over rewrites.
- Write the sim module + tests first, then the UI, then missions, then (maybe) the figure.
  Run tests before touching UI.
- Don't add dependencies without checking `pick-ui-library` first.
- Don't ask the user to confirm things this file already decides.
- If this file and the user's instructions conflict, follow the user and note it in `HANDOFF.md`.
