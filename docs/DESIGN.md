# Kasilag: Design Spec

Mobile app (Android first), built with Expo / React Native. The reference screens are in `design/screens/`.

> **About the screen files:** the `.dc.html` files are design mockups from a design canvas. They are **reference only**. Do not run or ship them. Read them for exact layout, spacing, colors, copy, and component structure, then rebuild each one in React Native. Inside them, `<sc-for>` means "repeat this element for each item in a list", and the `<script>` block at the bottom shows the sample data. Screen titles still say "Moment", the old placeholder name: use **Kasilag** instead.

## Design tokens

### Colors
| Token | Hex | Use |
|---|---|---|
| bg | `#FFF4F7` | Screen background (pastel pink-white) |
| surface | `#FFFFFF` | Cards, tab bar, sheets |
| pink-soft | `#FCE4EC` | Pastel pink cards, active tab pill, chips |
| pink-line | `#F5CAD7` | Card borders, dividers |
| pink-input | `#EBC4D2` | Input borders, sheet grab handle |
| pink-track | `#F5DDE6` | Empty progress-bar track |
| pink-accent | `#E58AAA` | Highlighted card border, countdown ring |
| pink-dot | `#D9568A` | Quiz/exam markers, board readiness bars |
| rose | `#C2416E` | **Primary buttons only** (white text) |
| rose-text | `#A8325D` | Pink-colored text and icons |
| blue | `#3B6BD0` | Progress bars, links, "study plan" markers, secondary buttons |
| blue-soft | `#E6EEFC` | Blue cards and chips |
| blue-text-muted | `#4F5E7A` | Text on blue-soft |
| ink | `#3A2530` | Main text |
| muted | `#7A5F6B` | Secondary text |
| chevron | `#C7A9B5` | List chevrons |

Rule: never put white text on pastel pink, since it's unreadable. Pastel pink is for backgrounds; rose is for primary actions; blue is for progress and highlights.

### Typography
- **DM Sans** (400/500/600/700) for all UI text
- **DM Mono** (400/500) for numbers, formulas, units, countdowns
- Sizes: screen title 26 bold; section heading 16 bold; card title 15 semibold; body 14; meta 12–13; tab label 11

### Shape and spacing
- Screen padding: 20 px horizontal; top padding clears the status bar
- Card radius: 18–22; small chips 8–12; buttons 14–16; pill/tab 15–22
- Gaps: 16–18 between sections, 8–10 inside lists
- Touch targets: at least 44 px
- Tab bar: 84 px tall, white, top border pink-line; active tab gets a pink-soft pill behind its icon and rose-text label

## Navigation
Bottom tabs: **Home · Study · Practice · Progress**
- Home → tap a weekday → **Day plans sheet** (bottom sheet modal)
- Home "Today" items → Practice or **Solving**
- Study → class card → **Class folder**
- Class folder "Practice this" → **Solving**
- Practice items → **Solving**
- **Solving is full screen with no tab bar**; the close (X) button goes back

## Screens
| File | Screen | Key parts |
|---|---|---|
| `Main.dc.html` | Home | Greeting; nearest-deadline card with countdown ring; week strip (7 days, colored dots for plans); "Today" list of 3 items |
| `DaySheet.dc.html` | Day plans (sheet) | Day's plans list (pink = quiz/exam, blue = study); add-plan form: title, type chips (Quiz/exam, Study, Deadline, Other), time, class; Save |
| `Study.dc.html` | Study | Add a source: File / Link / Photo; recently added sources; class folder grid (2 columns); "New class folder" |
| `Folder.dc.html` | Class folder | Chapters list; open chapter shows sources, key formulas, worked examples, concept check, "Practice this". **Structure still being decided.** |
| `Practice.dc.html` | Practice | Filter chips; Due now (quick recalls); Continue (ladder stage progress); Board mode (situation drill, mock exam); problem sets list |
| `Solve.dc.html` | Solving | Situation text + diagram; completed steps collapsed; current step with value input + unit picker; mistake-specific feedback; Hint / Check buttons pinned at bottom |
| `Progress.dc.html` | Progress | Overall learning ring (problems solved unassisted); Uni coursework bars + insight; Board readiness bars by subject + most common mistake |

All numbers in the mockups are sample data. The Torsion problem on the Solving screen is real and correct (T = 9.95 kN·m, J = 1.63 × 10⁷ mm⁴; the student's 3.27 × 10⁷ is the π/16 mistake).
