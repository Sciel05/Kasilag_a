# Kasilag: MVP Technical Spec

Kasilag is an Android-first mobile app with server-side problem generation and step-by-step answer checking. This document covers the v1 scope, screens, template format, data model and architecture.

## Core principles

1. **Step-checked solving.** Problems are generated from templates with randomized values. Every step is checked, and a wrong answer is matched to a specific known mistake.
2. **Server-side engine.** Correct answers are computed and checked only on the server. The app never receives them.
3. **Templates are data.** Problems are JSON definitions, not code, so new ones can be added without a release.
4. **Honest progress.** Metrics measure what the user solves unassisted, computed from per-step attempt logs.

**v1 is done when:**

- The engine returns identical values for the same template + seed, checks answers within tolerance and units, and names the matching mistake (covered by unit tests)
- 40 templates pass verification (worked-example check + 500-instance auto-check)
- Solve, recall, logging and Progress work end to end on an Android device

## Scope

| Area | In the MVP | Later |
| --- | --- | --- |
| Problem engine | Randomized templates, step checking, unit-aware answers, mistake detection, carried-error grading | Diagram input by the user |
| Content | 40 templates | Larger library, AI-assisted authoring |
| Modes | Solve (guided steps), quick recall, formula recall (build, pick, rearrange), 1-situation drill | Full timed mock exams, cross-topic situations |
| Topic ladder | Stages 1 and 2 (Learn, Fade) | Stages 3 and 4 (Situation, Pressure) |
| Study | Upload a file or link, tag it to a folder, view it | AI extracts formulas and drafts templates from uploads |
| Home | Deadline card, week strip, add plans to a day | Auto-fill dates from a photo |
| Progress | Unassisted accuracy, per-course bars, one insight card, formula mastery | Bayesian Knowledge Tracing, charts, weighted readiness |
| Users | One account, simple login | Multi-user, author roles, payments |
| Concept questions | Fixed questions with explanations | Socratic AI tutor |

AI-assisted authoring is deferred to after v1. Even then, the AI only drafts templates; the engine computes every answer.

## Screens

Four tabs (Home, Study, Practice, Progress) plus a full-screen Solving view. See `DESIGN.md` and `design/screens/`.

| Screen | MVP features | Cut for now |
| --- | --- | --- |
| Home | Nearest deadline card with countdown; week strip; tap a day to open a sheet that lists and adds plans (title, type, time, course); today list: quick recall, solve, drill | Notifications, streaks |
| Study | Add a source (file, link, photo); recently added list; course folders; inside a folder: chapters with their sources, key formulas, the top 2 common mistakes and a short units note | Auto-extracted formulas, worked examples, concept check per chapter |
| Practice | Due now (quick recalls); continue (current ladder stage and progress); drill; formula recall cards mixed into Due now; list of problem sets | Mock exams, subject filters |
| Solving | Scenario text and diagram; one step at a time; numeric input with unit picker; check, hint, mistake-specific feedback; confidence rating | Timer pressure modes, drawing input |
| Progress | Unassisted accuracy headline; per-course bars; one plain-language insight; most common mistake; formula mastery (recall, choose, apply) | Weighted readiness bars |

Use line icons throughout, never emoji: emoji render differently across Android devices.

## Formula recall

Practice and Progress treat each formula as an item to recall and apply on its own, not only as a step inside one problem.

| Recall type | What the user does | MVP? |
| --- | --- | --- |
| Build it | Assembles the formula from tiles, with no list to pick from | Yes |
| Pick it | Reads a new situation in words and chooses the governing relation | Yes |
| Rearrange | Solves the formula for a different unknown | Yes |
| When it holds | Picks the conditions where the formula is valid | Later |
| Read the units | Picks a consistent unit set | Later |
| What changes | Predicts the effect of changing one variable | Later |

How it works:

- Each formula is its own item with its own review schedule.
- Recall cards are mixed into Due now, interleaved across chapters.
- In Solve, a "which equation?" step comes before the numbers, so choosing the formula is graded separately from computing with it.
- Typed formulas are checked for equivalence by evaluating the user's expression and the correct one at random values (so `T*r/J` and `r*T/J` both pass).

Progress tracks three levels per formula: **Recall** (can write it), **Choose** (picks it in a new situation) and **Apply** (uses it correctly in problems).

## Template format

Every template uses one JSON format. Formulas compute in real units, so math.js handles every conversion.

```json
{
  "title": "Torsion: hollow shaft transmitting power",
  "board_subject": "PSAD",
  "chapter": "deformable.torsion",
  "scenario": "A hollow steel shaft {L} long transmits {P} at {f}. Outer diameter {D}, inner diameter {d}. G = {G}.",
  "parameters": {
    "L": { "min": 2.0, "max": 4.0, "step": 0.1, "unit": "m" },
    "P": { "min": 150, "max": 350, "step": 10, "unit": "kW" },
    "f": { "min": 2, "max": 6, "step": 0.5, "unit": "Hz" },
    "D": { "min": 100, "max": 140, "step": 5, "unit": "mm" },
    "d": { "min": 60, "max": 90, "step": 5, "unit": "mm" },
    "G": { "value": 83, "unit": "GPa" }
  },
  "constraints": ["(D - d) / 2 >= 10 mm"],
  "steps": [
    {
      "order": 1,
      "prompt": "Torque transmitted by the shaft",
      "formula_id": "torque_power",
      "formula": "P / (2 * pi * f)",
      "answer_unit": "kN*m",
      "tolerance_pct": 1.5,
      "skill": "torque_power_relation",
      "mistakes": [
        { "label": "Left out the 2π", "formula": "P / f" },
        { "label": "Used rpm in place of Hz", "formula": "P / (2 * pi * f * 60)" }
      ]
    },
    {
      "order": 2,
      "prompt": "Polar moment of inertia, J",
      "formula_id": "j_hollow",
      "formula": "pi * (D^4 - d^4) / 32",
      "answer_unit": "mm^4",
      "display_scale": "1e6",
      "tolerance_pct": 1.5,
      "skill": "polar_moment",
      "mistakes": [
        { "label": "Used π/16 instead of π/32", "formula": "pi * (D^4 - d^4) / 16" },
        { "label": "Used (D − d)⁴", "formula": "pi * (D - d)^4 / 32" }
      ]
    },
    {
      "order": 3,
      "prompt": "Maximum shear stress",
      "formula_id": "torsion_stress",
      "formula": "T * (D / 2) / J",
      "uses": { "T": 1, "J": 2 },
      "answer_unit": "MPa",
      "tolerance_pct": 1.5,
      "skill": "torsion_shear_stress",
      "mistakes": [
        { "label": "Used the inner radius", "formula": "T * (d / 2) / J" },
        { "label": "Used the diameter instead of the radius", "formula": "T * D / J" }
      ]
    }
  ]
}
```

Rules:

- **Unit-clean formulas.** No scaling such as `/ 1e6` inside a formula. `answer_unit` and `display_scale` (shown as ×10⁶ mm⁴) are separate fields.
- **Constraints** are checked whenever values are drawn, so the randomizer never produces impossible inputs.
- **Tolerance** defaults to ±1.5% to absorb rounding.
- **Carried error.** `uses` names the earlier results a step depends on. The engine also grades the step against the user's own earlier answers, so one early mistake doesn't fail every later step, and it reports when the method was right.
- **Mistake formulas are tested too.** The 500-instance check confirms each one stays more than 5% from the correct answer.
- **`formula_id`** links each step to a formula record, which feeds formula recall and the Recall / Choose / Apply levels.
- Subject codes and their weights live in a config table, not in code.

## Content verification

1. For every template, take a solved reference example, plug its numbers into the template, and confirm the engine reproduces the reference answer.
2. Run the auto-check: 500 random instances, all answers finite, all constraints satisfied, no mistake formula within 5% of the correct answer.
3. Have a domain reviewer check each chapter's common-mistakes list.

## Data model

`step_attempts` is the most important table: every progress metric is computed from it.

| Table | Key fields | Why it exists |
| --- | --- | --- |
| users | id, name, email | One user now, many later |
| courses | id, user_id, name, board_subject | Course folders in Study |
| chapters | id, course_id, name, order | Folder contents |
| sources | id, chapter_id, kind (file, link, photo), url, title | Uploaded materials |
| plans | id, user_id, date, time, title, type (exam, study, deadline, other), course_id | Calendar items; exams drive review scheduling |
| skills | id, chapter_id, name | Granular skills, e.g. "polar moment of inertia" |
| templates | id, chapter_id, kind (problem, situation), params (JSON ranges + units), constraints, difficulty, verified | Problem definitions as data |
| template_steps | id, template_id, order, prompt, answer_formula, unit, tolerance, hints, skill_id, formula_id, uses, mistakes (JSON: label + formula) | Each step is checked and tied to a skill and a formula |
| concept_questions | id, chapter_id, prompt, choices, answer, explanation | Concept questions |
| attempts | id, user_id, template_id, seed, mode (solve, recall, drill), stage, confidence, started_at, finished_at | One run of a problem; the seed rebuilds its values |
| step_attempts | id, attempt_id, step_id, answer, unit, is_correct, mistake_label, hints_used, tries, time_ms | The source of every metric |
| skill_state | user_id, skill_id, mastery, stage, last_practiced, next_review_due | Ladder stage and quick-recall schedule |
| formulas | id, chapter_id, name, expression, variables (JSON: symbol, meaning, unit), conditions | One record per formula; steps link to it |
| recall_items | id, formula_id, kind (build, pick, rearrange), prompt, answer | Formula recall cards |
| formula_state | user_id, formula_id, recall, choose, apply, next_review_due | Three-level mastery and review schedule per formula |

## Architecture and stack

One mobile app talks to one API. The problem engine lives on the server, so answers never reach the device and every submission is logged.

```
Mobile app (Expo / React Native)
        │  REST
API (Node + Express, one app split into modules)
  ├─ auth        session check
  ├─ content     courses, sources, templates
  ├─ engine      value generation, step checking, mistake matching
  ├─ attempts    logs every step answer
  └─ analytics   mastery, recall scheduling
        │  SQL
Supabase (Postgres, storage, auth)
```

- **Mobile:** Expo (React Native, TypeScript). Android first.
- **API:** Node + Express + TypeScript, modular monolith.
- **Database, files, login:** Supabase.
- **Engine:** math.js for formulas and units; never `eval()`. A seed is stored per attempt so any problem can be rebuilt.
- **Background job:** nightly; recomputes mastery and schedules recalls.
- **Hosting:** API on Render or Railway; Android APK via EAS build (the `preview` profile must set `android.buildType` to `apk`).
- **Later:** AI authoring pipeline (upload → structured JSON draft → validation → human confirm → saved as template).

## Risks

| Risk | Mitigation |
| --- | --- |
| A template computes a wrong answer | Reference-example check for every template; 500-instance auto-check |
| A mistake formula equals the correct answer at some inputs | Validator flags collisions; narrow parameter ranges or add constraints |
| A mistake formula is itself wrong (e.g. ×60 instead of ÷60) | Mistake formulas go through the same checks as answers |
| Diagrams take longer than expected | One parametric component per figure type; static SVGs for the rest |
| Scope too large for the timeline | Write templates in parallel with the code; cut lowest-priority templates first |

## Open items

- [ ] Study folder structure
- [ ] Build schedule
