# Gamilearn backend — how it works (AI & gamification focus)

This document is a **code walkthrough aid** for explaining the backend in a presentation of **about 7–10 minutes**. It centers on **AI-powered tutoring** and **XP / levels / achievements**.

---

## 1. Big picture (~1 min)

- **Stack:** Node.js **Express** API, **MongoDB** via Mongoose, **JWT** auth (`middleware/auth.js`).
- **Entry:** `server.js` — connects to MongoDB, enables CORS for the Vite app, mounts routes under `/api/*`.
- **Main route groups:**
  - `/api/auth` — signup, login, password reset  
  - `/api/modules` — lesson catalog (and admin CRUD where protected)  
  - `/api/user` — profile, dashboard data, **module progress**, **complete module**, avatars  
  - `/api/achievements` — catalog, user badges, **progress check** (gamification rules)  
  - `/api/tutor` — **all AI tutor endpoints** (hints, verify, MCQ, explain, lecture notes)  
  - `/api/admin` — staff tools (users, stats, AI module helpers)

**Say in the talk:** *“The backend is a thin Express layer: routes → controllers → services. The two richest areas are `lessonXpService` + achievements for progression, and `aiService` + `tutorController` for the coding tutor.”*

---

## 2. Gamification: XP, levels, and “no double-dipping” (~2.5–3 min)

### Single source of truth: `User.totalPoints`

- Lifetime **XP** is stored as **`User.totalPoints`**.
- **Level** is always derived from that total using the same math as the frontend (`utils/levelSystem.js` mirrors `gamilearn/src/utils/levelCurve.js`).
- Formula for XP needed to go from level **L** to **L+1** (see `constants/levelRanks.js`):

  `XP_PER_LEVEL_BASE + (L - 1) * XP_PER_LEVEL_INCREMENT`

  (e.g. base **100**, increment **10** per level band.)

### Named ranks (flavor, not separate currency)

- `constants/levelRanks.js` defines **EXPERIENCE_RANKS** (e.g. Amateur → … → higher tiers) as **level ranges** with display names and colors.
- `buildLevelInfo` in `levelSystem.js` combines numeric level + progress bar fields (`currentXP`, `xpNeeded`, `xpToNext`, `percentage`) for the API responses the UI shows on Dashboard / Profile.

### Keyed lesson XP — idempotent rewards (`lessonXpService.js`)

Lesson rewards must fire **at most once per logical event**. The service uses **`User.lessonXpKeys`**: an array of string keys.

| Event | Key pattern (conceptually) | Constant (amount) |
|--------|----------------------------|-------------------|
| Step verified by AI | `{moduleId}:step:{stepIndex}` | `STEP_VERIFY_XP` (e.g. **15**) |
| MCQ answered correctly | `{moduleId}:mcq:{stepIndex}:{questionIndex}` | `MCQ_CORRECT_XP` (e.g. **10**) |
| First-time module complete | `{moduleId}:complete` | `MODULE_COMPLETION_XP` (e.g. **150**) |

- **`grantKeyedXp`** does an atomic-style update: only if the key is **not** already in `lessonXpKeys` does it `$push` the key and `$inc` `totalPoints`, then refresh level.
- **Wrong MCQ or failed verify** does not write a key — a later success can still earn XP.

**Say in the talk:** *“We never trust the client for how much XP you have. The server stores total points and a list of keys so you can’t farm the same step or the same quiz question forever.”*

### Where XP is granted in the flow

1. **`tutorController.verifyStep`** — after the AI (and rules in `utils/tutor.js`) decide the step is correct → **`grantStepVerifyXp`** → JSON includes `xpAwarded`, optional `levelInfo` bump.
2. **`tutorController.verifyMCQ`** — if the model says the answer is correct → **`grantMcqCorrectXp`**.
3. **`userController.completeModule`** — if the module was **not** already in `completedModules` → push completion, **`grantModuleCompletionXp`**, then run achievement check (below).

### Achievements (`achievementService.js` + `achievementsController.js`)

- Achievements are **documents** with requirements like `complete_1_module`, streaks, AI usage counts (`aiHintRequests`, `aiCompanionUses`, etc.).
- **`checkProgress(userId, progressData)`** merges **client session stats** (`sessionStats` from the editor: edits, streak, etc.) with the **user document** using **`mergeProgressWithUser`** — it takes **max** of stored vs incoming counters so stats **accumulate** across sessions.
- It loads all active achievements, skips already-earned IDs, evaluates rules, awards points via **`lessonXpService.syncStoredLevelFromPoints`**, persists `earnedAchievements` and `gameStats`.
- **`completeModule`** calls `checkProgress` after module completion XP so **“complete N modules”** and similar badges can unlock in the same response (`newlyEarned` in the JSON).

**Say in the talk:** *“Gamification is two layers: keyed lesson XP for fair, repeatable pedagogy, and a separate achievement engine that looks at lifetime stats and can add bonus XP.”*

---

## 3. AI: models, services, and tutor API (~2.5–3.5 min)

### Provider: GitHub Models (`services/githubModelsService.js` + env)

- Calls go through **GitHub’s inference API**; **`GITHUB_TOKEN`** is required (`aiService.js` warns if missing).
- Model IDs live in **`constants/ai.js`** (overridable via env vars such as `GITHUB_MODELS_MODEL`).

Rough roles (check `constants/ai.js` for exact IDs):

| Constant | Typical use |
|----------|-------------|
| `AI_MODEL` | General tutor replies, code summary, explain code/error |
| `AI_MCQ_MODEL` | Generate and verify multiple-choice questions |
| `AI_GENERAL_MODEL` | Step verification / structured checks |
| `AI_LECTURE_MODEL` | Longer-form lecture notes for the overview popup |

### `services/aiService.js` — prompts and orchestration

- **`generateTextWithModel`** — shared chat completion wrapper (temperature, max tokens).
- **Pedagogy helpers:** e.g. **`summarizeCodeToMarkdown`** — turns editor excerpts into short bullets **grounded in actual code** (reduces tutor hallucination).
- **`USER_REPLY_STYLE`** — injected into prompts so answers stay **warm, skimmable, bullet-friendly** (fits a learning product).
- Other exports cover **MCQ generation**, **MCQ verification with explanations**, **step verification**, **explain code**, **explain error**, **lecture notes** — each builds a focused system/user prompt and parses JSON where needed.

### `utils/tutor.js` — rules before/around the model

- Builds **pedagogical prompts** (`buildPedagogicalPrompt`), **fallback hints** when AI is uncertain, **confidence** heuristics for MCQs (`assessQuestionConfidence`), etc.
- Keeps **verify types** aligned with the module editor: `code`, `checkConsole`, `checkComments` (see `aiService` / controller).

### `controllers/tutorController.js` — HTTP + XP side effects

All tutor routes use **auth** + **rate limiting** (`routes/tutor.js`, `constants/rateLimit.js`).

| Method | Route | Role |
|--------|--------|------|
| POST | `/api/tutor` | General tutor message + structured **context** (module, step, code) |
| POST | `/api/tutor/verify` | AI checks learner code vs step → on success **grants step XP** |
| POST | `/api/tutor/mcq/generate` | 1–2 questions for a step |
| POST | `/api/tutor/mcq/verify` | Validates answer; can return explanation; on correct **grants MCQ XP** |
| POST | `/api/tutor/explain-code` | Explains a **selected snippet** |
| POST | `/api/tutor/explain-error` | Explains a **console/runtime error** in context |
| POST | `/api/tutor/lecture-notes` | Generates **learning overview** content for the module popup |

**Say in the talk:** *“The tutor isn’t one chatbot call — it’s specialized endpoints with different models and prompts. Verification and MCQs are tied directly into XP so practice and assessment feel like part of the game loop.”*

---

## 4. How AI and gamification connect (~1 min)

- **Step verify** and **MCQ verify** both return **`xpAwarded`** and updated **`levelInfo`** when the server actually increments points.
- **Module complete** adds completion XP once, then **achievementService** may add more XP and return **`newlyEarned`** badges.
- **gameStats** tracks **AI usage** (hints, explain, companion) so achievements can reward *how* you learn, not only *what* you finished.

---

## 5. Optional closing (~30 s)

- **Auth:** JWT on protected routes; admin routes use **`requireAdmin`**.
- **Rate limits:** Tutor routes use stricter limits to protect cost and abuse.
- **Data:** `User`, `Module`, `Achievement` models hold progression and content; editor progress can also sync via `userController` step-progress endpoints.

---

## Suggested 7-minute talk outline (timing)

| Minutes | Topic |
|--------|--------|
| 0:00–1:00 | Stack, `server.js`, route map — point to `tutor` + `user` + `achievements` |
| 1:00–3:30 | Gamification: `totalPoints`, level curve, `lessonXpKeys`, three XP grants, `completeModule` → achievements |
| 3:30–6:30 | AI: GitHub Models, `constants/ai.js`, `aiService` vs `tutorController`, walk one path (e.g. verify step → XP) and one (MCQ generate → verify → XP) |
| 6:30–7:00+ | Tie-together: session stats, achievement AI counters, rate limits / auth |

Open the codebase alongside this doc: **`lessonXpService.js`**, **`tutorController.js`** (top + `verifyStep` / `verifyMCQ`), **`achievementService.js`** (`checkProgress`), **`aiService.js`** (imports + `generateTextWithModel`), and **`routes/tutor.js`**.
