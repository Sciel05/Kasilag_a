# Start here

This repo holds the spec and design references for building **Kasilag**.

- `docs/MVP.md`: what v1 includes, the content plan, the data model, the architecture, and risks
- `docs/DESIGN.md`: colors, fonts, spacing, navigation, and what each screen contains
- `design/screens/`: the mockup source for each screen (reference only, not runnable)

## How to use it in Antigravity

1. Clone this repo.
2. Open the repo folder as your workspace in Antigravity.
3. Paste the kickoff prompt below into the agent chat.
4. Work in small steps: one prompt per milestone, and review each result before moving on.

## Kickoff prompt (paste into the agent)

```
Read START-HERE.md, docs/MVP.md and docs/DESIGN.md first. They are the source of truth
for this project. The files in design/screens/ are design mockups for reference only:
match their layout, colors and copy, but rebuild them in React Native. Don't run or copy
them as-is.

Before writing code, give me a short plan for step 1 below and wait for my OK.

Step 1 only: set up the project.
- Expo (React Native, TypeScript) app with 4 bottom tabs: Home, Study, Practice, Progress,
  plus a full-screen Solving route with no tab bar.
- Theme file with the exact tokens from docs/DESIGN.md (colors, DM Sans + DM Mono, radii).
- Placeholder screens for each tab, using the theme.
- A separate /server folder: Node + Express + TypeScript, with a /health route.
- Supabase: create the tables from the "Data model" section of docs/MVP.md as a SQL
  migration file. Don't connect real keys yet; use a .env.example.

Rules for the whole project:
- The problem engine runs only on the server. The app never receives correct answers.
- Use math.js for formulas and units. Never use eval().
- Templates are data (JSON), not code.
- Android first.
```

## Next prompts, one at a time
1. Build the problem engine on the server: generate values from a template + seed, check a step answer with tolerance and units, and return which mistake matched. Include unit tests, plus one Torsion template (hollow shaft) to test with.
2. Build the Solving screen against the engine, matching `design/screens/Solve.dc.html`.
3. Build Home and the day-plans sheet (`Main.dc.html`, `DaySheet.dc.html`).
4. Logging attempts and the Progress screen.
5. Study (uploads + class folders) and Practice.
