import { Course, Chapter, Primer, Formula, Source, Program } from '../../types';

export interface MockFlashcard {
  id: string;
  courseId: string;
  cluster: string;
  prompt: string;
  answer: string;
  reviewIntervalDays: number;
  dueToday: boolean;
}

export const mockPrograms: Program[] = [
  { id: 'prog-ce', name: 'BS Civil Engineering' },
];

export const mockCourses: Course[] = [
  {
    id: 'deformable',
    userId: 'user-1',
    programId: 'prog-ce',
    name: 'Mechanics of Deformable Bodies',
    boardSubject: 'PSAD',
    cluster: 'PSAD',
    chaptersCount: 3,
    sourcesCount: 10,
    cardsCount: 32,
  },
  {
    id: 'structural',
    userId: 'user-1',
    programId: 'prog-ce',
    name: 'Structural Theory',
    boardSubject: 'PSAD',
    cluster: 'PSAD',
    chaptersCount: 3,
    sourcesCount: 9,
    cardsCount: 25,
  },
  {
    id: 'geotech',
    userId: 'user-1',
    programId: 'prog-ce',
    name: 'Geotechnical Engineering',
    boardSubject: 'GEOTECH',
    cluster: 'HGE',
    chaptersCount: 3,
    sourcesCount: 9,
    cardsCount: 28,
  },
  {
    id: 'hydraulics',
    userId: 'user-1',
    programId: 'prog-ce',
    name: 'Hydraulics & Water Resources',
    boardSubject: 'HGE',
    cluster: 'HGE',
    chaptersCount: 3,
    sourcesCount: 9,
    cardsCount: 24,
  },
];

export const mockFlashcards: MockFlashcard[] = [
  // Deformable (32 total, 21 interval >= 7, 6 due today)
  ...Array.from({ length: 32 }, (_, i) => ({
    id: `fc-def-${i + 1}`,
    courseId: 'deformable',
    cluster: 'PSAD',
    prompt: `Torsion concept prompt #${i + 1}`,
    answer: `Torsion concept answer #${i + 1}`,
    reviewIntervalDays: i < 21 ? 14 : 3,
    dueToday: i < 6,
  })),

  // Structural (25 total, 16 interval >= 7, 2 due today)
  ...Array.from({ length: 25 }, (_, i) => ({
    id: `fc-str-${i + 1}`,
    courseId: 'structural',
    cluster: 'PSAD',
    prompt: `Structural concept prompt #${i + 1}`,
    answer: `Structural concept answer #${i + 1}`,
    reviewIntervalDays: i < 16 ? 10 : 2,
    dueToday: i < 2,
  })),

  // Geotechnical (28 total, 20 interval >= 7, 3 due today)
  ...Array.from({ length: 28 }, (_, i) => ({
    id: `fc-geo-${i + 1}`,
    courseId: 'geotech',
    cluster: 'HGE',
    prompt: `Geotech concept prompt #${i + 1}`,
    answer: `Geotech concept answer #${i + 1}`,
    reviewIntervalDays: i < 20 ? 8 : 4,
    dueToday: i < 3,
  })),

  // Hydraulics (24 total, 14 interval >= 7, 3 due today)
  ...Array.from({ length: 24 }, (_, i) => ({
    id: `fc-hyd-${i + 1}`,
    courseId: 'hydraulics',
    cluster: 'HGE',
    prompt: `Hydraulics concept prompt #${i + 1}`,
    answer: `Hydraulics concept answer #${i + 1}`,
    reviewIntervalDays: i < 14 ? 14 : 2,
    dueToday: i < 3,
  })),
];

export const mockPrimers: Primer[] = [
  {
    id: 'primer-1',
    courseId: 'deformable',
    title: 'Mohr’s Circle & Stress Transformation',
    readMinutes: 3,
    summary: 'Transform 2D stress states to find principal stresses without memorizing rotational equations.',
    body: `# Mohr’s Circle & Stress Transformation

## 1. Overview
Mohr’s circle is a graphical representation of the 2D state of plane stress at a point. It enables quick visual determination of:
- **Principal stresses** ($\\sigma_1, \\sigma_2$)
- **Maximum in-plane shear stress** ($\\tau_{max}$)
- **Orientation of principal planes** ($\\theta_p$)

## 2. Fundamental Equations
Given stresses $\\sigma_x$, $\\sigma_y$, and $\\tau_{xy}$:
- **Center of Circle:**
  $$C = \\left(\\frac{\\sigma_x + \\sigma_y}{2}, 0\\right) = (\\sigma_{avg}, 0)$$
- **Radius of Circle:**
  $$R = \\sqrt{\\left(\\frac{\\sigma_x - \\sigma_y}{2}\\right)^2 + \\tau_{xy}^2}$$
- **Principal Stresses:**
  $$\\sigma_{1,2} = \\sigma_{avg} \\pm R$$
- **Maximum In-Plane Shear Stress:**
  $$\\tau_{max} = R = \\frac{\\sigma_1 - \\sigma_2}{2}$$

## 3. Key Derivation Insights
1. The reference points plotted on the circle are $(X): (\\sigma_x, -\\tau_{xy})$ and $(Y): (\\sigma_y, \\tau_{xy})$.
2. Angles on Mohr's circle are doubled ($2\\theta$) relative to real-space rotations ($\\theta$).
3. Counterclockwise rotation in physical coordinates corresponds to counterclockwise rotation on the circle.

## 4. Common Exam Traps
- **Sign conventions for shear:** Clockwise couple vs counterclockwise couple on the element faces.
- **Radius calculation:** Be sure to divide the normal stress difference by 2 before squaring!
`,
  },
  {
    id: 'primer-2',
    courseId: 'deformable',
    title: 'Hollow vs Solid Shaft Torsion Efficiency',
    readMinutes: 4,
    summary: 'Why removing center material boosts strength-to-weight ratio in power transmission shafts.',
    body: `# Hollow vs Solid Shaft Torsion Efficiency

## 1. Core Principle
Shearing stress due to torsion varies linearly from zero at the neutral axis (center) to maximum at the outer surface:
$$\\tau = \\frac{T\\rho}{J}$$

Because the material near the center carries very little stress, it contributes insignificantly to torque resistance while adding substantial dead weight.

## 2. Polar Moment of Inertia
- **Solid Shaft (Diameter D):**
  $$J = \\frac{\\pi D^4}{32}$$
- **Hollow Shaft (Outer D, Inner d):**
  $$J = \\frac{\\pi (D^4 - d^4)}{32}$$

## 3. Weight Reduction Drill
When designing for equal maximum shear stress $\\tau_{max}$, a hollow shaft with $d/D = 0.6$ achieves approximately a **25% reduction in weight** compared to a solid shaft of equivalent strength.

## 4. Exam Strategy
Always check whether outer diameter or wall thickness is specified, and convert all millimetre measurements to metres early when working with Joules or Watts!
`,
  },
  {
    id: 'primer-3',
    courseId: 'hydraulics',
    title: 'Bernoulli Energy Line & Hydraulic Grade Line',
    readMinutes: 3,
    summary: 'Distinguish between pressure head, velocity head, and elevation head in pipe networks.',
    body: `# Bernoulli Energy Line & Hydraulic Grade Line

## 1. The Energy Equation
For steady, incompressible, frictionless flow along a streamline:
$$H = z + \\frac{P}{\\gamma} + \\frac{v^2}{2g} = \\text{constant}$$

Where:
- $z$ = Elevation head (potential energy)
- $\\frac{P}{\\gamma}$ = Pressure head (flow work)
- $\\frac{v^2}{2g}$ = Velocity head (kinetic energy)

## 2. EGL vs HGL
- **Energy Grade Line (EGL):** Plots total head $H$. Always slopes downward in the direction of flow when head loss is present.
- **Hydraulic Grade Line (HGL):** Plots $z + \\frac{P}{\\gamma}$. Lies exactly $\\frac{v^2}{2g}$ below the EGL.
- When HGL falls below the pipe centerline, negative gauge pressure (sub-atmospheric / cavitation risk) occurs!
`,
  },
  {
    id: 'primer-4',
    courseId: 'geotech',
    title: 'Soil Phase Relationships & Index Properties',
    readMinutes: 2,
    summary: 'Interconnect void ratio, porosity, moisture content, and degree of saturation with Se = wGs.',
    body: `# Soil Phase Relationships & Index Properties

## 1. The Golden Identity
$$S \\cdot e = w \\cdot G_s$$

Where:
- $S$ = Degree of saturation ($0 \\le S \\le 1$)
- $e$ = Void ratio ($V_v / V_s$)
- $w$ = Moisture / water content ($W_w / W_s$)
- $G_s$ = Specific gravity of soil solids

## 2. Unit Weight Formulas
- **Total Unit Weight:**
  $$\\gamma = \\frac{(G_s + S \\cdot e)\\gamma_w}{1 + e}$$
- **Dry Unit Weight:**
  $$\\gamma_d = \\frac{G_s \\gamma_w}{1 + e} = \\frac{\\gamma}{1 + w}$$
- **Saturated Unit Weight ($S=1$):**
  $$\\gamma_{sat} = \\frac{(G_s + e)\\gamma_w}{1 + e}$$
`,
  },
];

export const mockFormulas: Formula[] = [
  {
    id: 'formula-torsion',
    courseId: 'deformable',
    label: 'Torsion Shear Stress',
    plainText: 'τ = Tρ / J',
    latex: '\\tau = \\frac{T\\rho}{J}',
    variables: [
      { symbol: 'τ', meaning: 'Shear stress at distance ρ', unit: 'MPa' },
      { symbol: 'T', meaning: 'Internal torque', unit: 'N·m' },
      { symbol: 'ρ', meaning: 'Radial distance from axis', unit: 'mm' },
      { symbol: 'J', meaning: 'Polar moment of inertia', unit: 'mm⁴' },
    ],
    derivationSteps: [
      'Assume circular cross-sections remain planar and circular without warping.',
      'Shearing strain varies linearly with radius: γ = ρθ / L.',
      'Apply Hooke’s Law for shear: τ = Gγ = Gρθ / L.',
      'Equate internal resisting torque: T = ∫ ρ τ dA = (Gθ / L) ∫ ρ² dA = (Gθ / L) J.',
      'Substitute Gθ / L = T / J back into τ = Gρθ / L to yield τ = Tρ / J.',
    ],
    pinned: true,
  },
  {
    id: 'formula-euler',
    courseId: 'structural',
    label: 'Euler Critical Buckling Load',
    plainText: 'P_cr = π²EI / L²',
    latex: 'P_{cr} = \\frac{\\pi^2 EI}{(KL)^2}',
    variables: [
      { symbol: 'P_cr', meaning: 'Critical column buckling load', unit: 'kN' },
      { symbol: 'E', meaning: 'Modulus of elasticity', unit: 'GPa' },
      { symbol: 'I', meaning: 'Least moment of inertia', unit: 'mm⁴' },
      { symbol: 'K', meaning: 'Effective length factor', unit: '—' },
      { symbol: 'L', meaning: 'Unsupported column length', unit: 'm' },
    ],
    derivationSteps: [
      'Differential equation for column deflection: EI (d²y/dx²) + Py = 0.',
      'General solution: y(x) = A sin(λx) + B cos(λx), where λ² = P / EI.',
      'Boundary conditions for pinned ends (y(0) = 0, y(L) = 0) require B = 0 and sin(λL) = 0.',
      'Lowest non-trivial buckling mode gives λL = π.',
      'Square both sides: P / EI = (π / L)² → P_cr = π²EI / L².',
    ],
    pinned: true,
  },
  {
    id: 'formula-flexure',
    courseId: 'deformable',
    label: 'Flexure Formula (Bending Stress)',
    plainText: 'σ = My / I',
    latex: '\\sigma = \\frac{My}{I}',
    variables: [
      { symbol: 'σ', meaning: 'Normal bending stress', unit: 'MPa' },
      { symbol: 'M', meaning: 'Internal bending moment', unit: 'N·m' },
      { symbol: 'y', meaning: 'Distance from neutral axis', unit: 'mm' },
      { symbol: 'I', meaning: 'Moment of inertia', unit: 'mm⁴' },
    ],
    derivationSteps: [
      'Assume plane sections remain plane under pure bending (Navier-Bernoulli).',
      'Normal strain varies linearly: ε = −y / ρ.',
      'Apply Hooke’s Law: σ = Eε = −(E/ρ) y.',
      'Equate internal bending moment: M = −∫ y σ dA = (E/ρ) ∫ y² dA = (E/ρ) I.',
      'Substitute E/ρ = M / I back to obtain σ = My / I.',
    ],
    pinned: true,
  },
  {
    id: 'formula-bernoulli',
    courseId: 'hydraulics',
    label: 'Bernoulli Energy Equation',
    plainText: 'H = z + P/γ + v²/(2g)',
    latex: 'H = z + \\frac{P}{\\gamma} + \\frac{v^2}{2g}',
    variables: [
      { symbol: 'H', meaning: 'Total energy head', unit: 'm' },
      { symbol: 'z', meaning: 'Elevation above datum', unit: 'm' },
      { symbol: 'P/γ', meaning: 'Pressure head', unit: 'm' },
      { symbol: 'v²/(2g)', meaning: 'Velocity head', unit: 'm' },
    ],
    derivationSteps: [
      'Integrate Euler’s equation of motion along a streamline for inviscid fluid: dp/ρ + v dv + g dz = 0.',
      'Assuming incompressible fluid (ρ is constant), integrate each term directly.',
      'Divide by gravitational acceleration g: P/(ρg) + v²/(2g) + z = constant.',
      'Define specific weight γ = ρg to obtain H = z + P/γ + v²/(2g).',
    ],
    pinned: true,
  },
];

export const mockRecentSources: Source[] = [
  {
    id: 'src-def-pinned-1',
    courseId: 'deformable',
    chapterId: 'ch-def-1',
    kind: 'file',
    fileExt: 'PDF',
    title: 'Ch1 Lecture Notes.pdf',
    createdAt: 'Yesterday',
    pinned: true,
    order: 1,
    companions: {
      flashcardCount: 8,
      hasSummary: true,
    },
  },
  {
    id: 'src-def-pinned-2',
    courseId: 'deformable',
    chapterId: 'ch-def-1',
    kind: 'file',
    fileExt: 'PPTX',
    title: 'Ch1 Worksheet.pptx',
    createdAt: '2 days ago',
    pinned: true,
    order: 2,
    companions: {
      flashcardCount: 6,
      hasSummary: false,
    },
  },
  {
    id: 'src-str-pinned-1',
    courseId: 'structural',
    chapterId: 'ch-str-1',
    kind: 'file',
    fileExt: 'PDF',
    title: 'Ch1 Truss Method of Joints.pdf',
    createdAt: '3 days ago',
    pinned: true,
    order: 1,
    companions: {
      flashcardCount: 10,
      hasSummary: true,
    },
  },
  {
    id: 'src-geo-pinned-1',
    courseId: 'geotech',
    chapterId: 'ch-geo-1',
    kind: 'note',
    title: 'Ch1 Soil Properties Cheat Sheet',
    noteBody: 'Golden equation: Se = wGs. Total unit weight = (Gs + Se)γw / (1 + e). Dry unit weight = Gs γw / (1 + e).',
    createdAt: '4 days ago',
    pinned: true,
    order: 3,
    companions: {
      flashcardCount: 5,
      hasSummary: true,
    },
  },
];

export const mockChapters: Record<string, Chapter[]> = {
  deformable: [
    {
      id: 'ch-def-1',
      courseId: 'deformable',
      name: 'Chapter 1 · Simple Stress & Strain',
      order: 1,
      sourcesCount: 3,
      mastered: true,
      statusText: '3 of 3',
      sources: [
        {
          id: 'src-def-1-1',
          courseId: 'deformable',
          chapterId: 'ch-def-1',
          kind: 'file',
          fileExt: 'PDF',
          title: 'Ch1 Lecture Notes.pdf',
          createdAt: '2 weeks ago',
          pinned: true,
          order: 1,
        },
        {
          id: 'src-def-1-2',
          courseId: 'deformable',
          chapterId: 'ch-def-1',
          kind: 'file',
          fileExt: 'PPTX',
          title: 'Ch1 Worksheet.pptx',
          createdAt: '1 week ago',
          pinned: true,
          order: 2,
        },
        {
          id: 'src-def-1-3',
          courseId: 'deformable',
          chapterId: 'ch-def-1',
          kind: 'note',
          title: 'Ch1 Notes',
          noteBody: 'Key points: Normal stress is perpendicular to the plane (σ = P/A). Shearing stress acts parallel to the plane (τ = V/A). Check factor of safety requirements for exam problems.',
          createdAt: '1 week ago',
          pinned: false,
          order: 3,
        },
      ],
      keyFormulas: ['σ = P / A', 'τ = V / A', 'σ_bearing = P / (d · t)'],
      workedExamplesCount: 4,
      conceptQuestionsCount: 6,
    },
    {
      id: 'ch-def-2',
      courseId: 'deformable',
      name: 'Chapter 2 · Axial Deformation & Thermal Stresses',
      order: 2,
      sourcesCount: 3,
      mastered: false,
      statusText: '2 of 3',
      sources: [
        {
          id: 'src-def-2-1',
          courseId: 'deformable',
          chapterId: 'ch-def-2',
          kind: 'file',
          fileExt: 'PDF',
          title: 'Ch2 Lecture.pdf',
          createdAt: '6 days ago',
          pinned: false,
          order: 1,
        },
        {
          id: 'src-def-2-2',
          courseId: 'deformable',
          chapterId: 'ch-def-2',
          kind: 'file',
          fileExt: 'DOCX',
          title: 'Ch2 Worksheet.docx',
          createdAt: '5 days ago',
          pinned: false,
          order: 2,
        },
        {
          id: 'src-def-2-3',
          courseId: 'deformable',
          chapterId: 'ch-def-2',
          kind: 'note',
          title: 'Ch2 Notes',
          noteBody: 'Deformation δ = PL / AE. Thermal expansion δ_T = α L ΔT. Statically indeterminate systems require compatibility equations.',
          createdAt: '4 days ago',
          pinned: false,
          order: 3,
        },
      ],
      keyFormulas: ['δ = PL / AE', 'δ_T = α L ΔT'],
      workedExamplesCount: 3,
      conceptQuestionsCount: 5,
    },
    {
      id: 'ch-def-3',
      courseId: 'deformable',
      name: 'Chapter 3 · Torsion of Shafts',
      order: 3,
      sourcesCount: 3,
      mastered: false,
      statusText: 'Step 2 of 4',
      sources: [
        {
          id: 'src-def-3-1',
          courseId: 'deformable',
          chapterId: 'ch-def-3',
          kind: 'file',
          fileExt: 'PDF',
          title: 'Ch3 Lecture.pdf',
          createdAt: 'Yesterday',
          pinned: false,
          order: 1,
        },
        {
          id: 'src-def-3-2',
          courseId: 'deformable',
          chapterId: 'ch-def-3',
          kind: 'file',
          fileExt: 'PPTX',
          title: 'Ch3 Worksheet.pptx',
          createdAt: 'Yesterday',
          pinned: false,
          order: 2,
        },
        {
          id: 'src-def-3-3',
          courseId: 'deformable',
          chapterId: 'ch-def-3',
          kind: 'note',
          title: 'Ch3 Notes',
          noteBody: 'Torsion formula: τ = Tρ / J. Angle of twist θ = TL / JG. For hollow shafts, J = π(D⁴ − d⁴)/32. Power relation: P = 2πfT.',
          createdAt: 'Yesterday',
          pinned: false,
          order: 3,
        },
      ],
      keyFormulas: ['τ = Tρ / J', 'θ = TL / JG', 'J = π(D⁴ − d⁴)/32'],
      workedExamplesCount: 3,
      conceptQuestionsCount: 8,
    },
  ],
  structural: [
    {
      id: 'ch-str-1',
      courseId: 'structural',
      name: 'Chapter 1 · Truss Analysis & Determinacy',
      order: 1,
      sourcesCount: 3,
      mastered: true,
      statusText: '3 of 3',
      sources: [
        {
          id: 'src-str-1-1',
          courseId: 'structural',
          chapterId: 'ch-str-1',
          kind: 'file',
          fileExt: 'PDF',
          title: 'Ch1 Truss Method of Joints.pdf',
          createdAt: '3 days ago',
          pinned: true,
          order: 1,
        },
        {
          id: 'src-str-1-2',
          courseId: 'structural',
          chapterId: 'ch-str-1',
          kind: 'file',
          fileExt: 'PPTX',
          title: 'Ch1 Worksheet.pptx',
          createdAt: '3 days ago',
          pinned: false,
          order: 2,
        },
        {
          id: 'src-str-1-3',
          courseId: 'structural',
          chapterId: 'ch-str-1',
          kind: 'note',
          title: 'Ch1 Notes',
          noteBody: 'Static determinacy criterion for planar trusses: m + r = 2j. If m + r > 2j, truss is statically indeterminate.',
          createdAt: '3 days ago',
          pinned: false,
          order: 3,
        },
      ],
      keyFormulas: ['m + r = 2j', 'ΣFx = 0', 'ΣFy = 0'],
      workedExamplesCount: 5,
      conceptQuestionsCount: 6,
    },
    {
      id: 'ch-str-2',
      courseId: 'structural',
      name: 'Chapter 2 · Shear and Moment Diagrams in Beams',
      order: 2,
      sourcesCount: 3,
      mastered: false,
      statusText: '1 of 3',
      sources: [
        {
          id: 'src-str-2-1',
          courseId: 'structural',
          chapterId: 'ch-str-2',
          kind: 'file',
          fileExt: 'PDF',
          title: 'Ch2 Lecture.pdf',
          createdAt: '5 days ago',
          pinned: false,
          order: 1,
        },
        {
          id: 'src-str-2-2',
          courseId: 'structural',
          chapterId: 'ch-str-2',
          kind: 'file',
          fileExt: 'XLSX',
          title: 'Ch2 Worksheet.xlsx',
          createdAt: '5 days ago',
          pinned: false,
          order: 2,
        },
        {
          id: 'src-str-2-3',
          courseId: 'structural',
          chapterId: 'ch-str-2',
          kind: 'note',
          title: 'Ch2 Notes',
          noteBody: 'The slope of shear diagram is load intensity w(x). The slope of moment diagram is shear force V(x).',
          createdAt: '5 days ago',
          pinned: false,
          order: 3,
        },
      ],
      keyFormulas: ['dV/dx = -w', 'dM/dx = V'],
      workedExamplesCount: 3,
      conceptQuestionsCount: 4,
    },
    {
      id: 'ch-str-3',
      courseId: 'structural',
      name: 'Chapter 3 · Influence Lines for Statically Determinate Beams',
      order: 3,
      sourcesCount: 3,
      mastered: false,
      statusText: '0 of 3',
      sources: [
        {
          id: 'src-str-3-1',
          courseId: 'structural',
          chapterId: 'ch-str-3',
          kind: 'file',
          fileExt: 'PDF',
          title: 'Ch3 Lecture.pdf',
          createdAt: '6 days ago',
          pinned: false,
          order: 1,
        },
        {
          id: 'src-str-3-2',
          courseId: 'structural',
          chapterId: 'ch-str-3',
          kind: 'file',
          fileExt: 'PPTX',
          title: 'Ch3 Worksheet.pptx',
          createdAt: '6 days ago',
          pinned: false,
          order: 2,
        },
        {
          id: 'src-str-3-3',
          courseId: 'structural',
          chapterId: 'ch-str-3',
          kind: 'note',
          title: 'Ch3 Notes',
          noteBody: 'Müller-Breslau Principle: The influence line for any function is represented to scale by the deflected shape when the restraint is removed and unit displacement applied.',
          createdAt: '6 days ago',
          pinned: false,
          order: 3,
        },
      ],
      keyFormulas: ['Müller-Breslau Principle'],
      workedExamplesCount: 2,
      conceptQuestionsCount: 3,
    },
  ],
  geotech: [
    {
      id: 'ch-geo-1',
      courseId: 'geotech',
      name: 'Chapter 1 · Soil Phase Relationships',
      order: 1,
      sourcesCount: 3,
      mastered: true,
      statusText: '3 of 3',
      sources: [
        {
          id: 'src-geo-1-1',
          courseId: 'geotech',
          chapterId: 'ch-geo-1',
          kind: 'file',
          fileExt: 'PDF',
          title: 'Ch1 Lecture.pdf',
          createdAt: '1 week ago',
          pinned: false,
          order: 1,
        },
        {
          id: 'src-geo-1-2',
          courseId: 'geotech',
          chapterId: 'ch-geo-1',
          kind: 'file',
          fileExt: 'PPTX',
          title: 'Ch1 Worksheet.pptx',
          createdAt: '1 week ago',
          pinned: false,
          order: 2,
        },
        {
          id: 'src-geo-1-3',
          courseId: 'geotech',
          chapterId: 'ch-geo-1',
          kind: 'note',
          title: 'Ch1 Soil Properties Cheat Sheet',
          noteBody: 'Golden equation: Se = wGs. Total unit weight = (Gs + Se)γw / (1 + e). Dry unit weight = Gs γw / (1 + e).',
          createdAt: '4 days ago',
          pinned: true,
          order: 3,
        },
      ],
      keyFormulas: ['Se = wGs', 'e = n / (1 - n)'],
      workedExamplesCount: 4,
      conceptQuestionsCount: 5,
    },
    {
      id: 'ch-geo-2',
      courseId: 'geotech',
      name: 'Chapter 2 · Soil Permeability & Seepage',
      order: 2,
      sourcesCount: 3,
      mastered: false,
      statusText: '1 of 3',
      sources: [
        {
          id: 'src-geo-2-1',
          courseId: 'geotech',
          chapterId: 'ch-geo-2',
          kind: 'file',
          fileExt: 'PDF',
          title: 'Ch2 Lecture.pdf',
          createdAt: '5 days ago',
          pinned: false,
          order: 1,
        },
        {
          id: 'src-geo-2-2',
          courseId: 'geotech',
          chapterId: 'ch-geo-2',
          kind: 'file',
          fileExt: 'PPTX',
          title: 'Ch2 Worksheet.pptx',
          createdAt: '5 days ago',
          pinned: false,
          order: 2,
        },
        {
          id: 'src-geo-2-3',
          courseId: 'geotech',
          chapterId: 'ch-geo-2',
          kind: 'note',
          title: 'Ch2 Notes',
          noteBody: "Darcy's Law: v = ki, Q = kiA. Constant head test vs falling head permeability test formulas.",
          createdAt: '5 days ago',
          pinned: false,
          order: 3,
        },
      ],
      keyFormulas: ['Q = k · i · A'],
      workedExamplesCount: 3,
      conceptQuestionsCount: 4,
    },
    {
      id: 'ch-geo-3',
      courseId: 'geotech',
      name: 'Chapter 3 · Stresses in Soil Mass & Mohr-Coulomb',
      order: 3,
      sourcesCount: 3,
      mastered: false,
      statusText: '0 of 3',
      sources: [
        {
          id: 'src-geo-3-1',
          courseId: 'geotech',
          chapterId: 'ch-geo-3',
          kind: 'file',
          fileExt: 'PDF',
          title: 'Ch3 Lecture.pdf',
          createdAt: '3 days ago',
          pinned: false,
          order: 1,
        },
        {
          id: 'src-geo-3-2',
          courseId: 'geotech',
          chapterId: 'ch-geo-3',
          kind: 'file',
          fileExt: 'DOCX',
          title: 'Ch3 Worksheet.docx',
          createdAt: '3 days ago',
          pinned: false,
          order: 2,
        },
        {
          id: 'src-geo-3-3',
          courseId: 'geotech',
          chapterId: 'ch-geo-3',
          kind: 'note',
          title: 'Ch3 Notes',
          noteBody: 'Effective stress principle: σ = σ′ + u. Shear strength τ_f = c + σ′ tan(ϕ).',
          createdAt: '3 days ago',
          pinned: false,
          order: 3,
        },
      ],
      keyFormulas: ['σ′ = σ - u', 'τ = c + σ′ tan φ'],
      workedExamplesCount: 3,
      conceptQuestionsCount: 4,
    },
  ],
  hydraulics: [
    {
      id: 'ch-hyd-1',
      courseId: 'hydraulics',
      name: 'Chapter 1 · Fluid Properties & Hydrostatics',
      order: 1,
      sourcesCount: 3,
      mastered: true,
      statusText: '3 of 3',
      sources: [
        {
          id: 'src-hyd-1-1',
          courseId: 'hydraulics',
          chapterId: 'ch-hyd-1',
          kind: 'file',
          fileExt: 'PDF',
          title: 'Ch1 Lecture.pdf',
          createdAt: '1 week ago',
          pinned: false,
          order: 1,
        },
        {
          id: 'src-hyd-1-2',
          courseId: 'hydraulics',
          chapterId: 'ch-hyd-1',
          kind: 'file',
          fileExt: 'PPTX',
          title: 'Ch1 Worksheet.pptx',
          createdAt: '1 week ago',
          pinned: false,
          order: 2,
        },
        {
          id: 'src-hyd-1-3',
          courseId: 'hydraulics',
          chapterId: 'ch-hyd-1',
          kind: 'note',
          title: 'Ch1 Notes',
          noteBody: 'Hydrostatic pressure P = γ h. Total hydrostatic force on submerged plane: F = γ h_c A. Location of center of pressure: y_cp = y_c + I_xc / (y_c A).',
          createdAt: '1 week ago',
          pinned: false,
          order: 3,
        },
      ],
      keyFormulas: ['P = γ · h', 'F = γ · h_c · A'],
      workedExamplesCount: 4,
      conceptQuestionsCount: 6,
    },
    {
      id: 'ch-hyd-2',
      courseId: 'hydraulics',
      name: 'Chapter 2 · Fluid Kinematics & Bernoulli Equation',
      order: 2,
      sourcesCount: 3,
      mastered: false,
      statusText: '2 of 3',
      sources: [
        {
          id: 'src-hyd-2-1',
          courseId: 'hydraulics',
          chapterId: 'ch-hyd-2',
          kind: 'file',
          fileExt: 'PDF',
          title: 'Ch2 Lecture.pdf',
          createdAt: '4 days ago',
          pinned: false,
          order: 1,
        },
        {
          id: 'src-hyd-2-2',
          courseId: 'hydraulics',
          chapterId: 'ch-hyd-2',
          kind: 'file',
          fileExt: 'PPTX',
          title: 'Ch2 Worksheet.pptx',
          createdAt: '4 days ago',
          pinned: false,
          order: 2,
        },
        {
          id: 'src-hyd-2-3',
          courseId: 'hydraulics',
          chapterId: 'ch-hyd-2',
          kind: 'note',
          title: 'Ch2 Notes',
          noteBody: 'Continuity equation: Q = A1 v1 = A2 v2. Energy equation with head loss: z1 + P1/γ + v1²/(2g) = z2 + P2/γ + v2²/(2g) + h_L.',
          createdAt: '4 days ago',
          pinned: false,
          order: 3,
        },
      ],
      keyFormulas: ['Q = A · v', 'H = z + P/γ + v²/(2g)'],
      workedExamplesCount: 3,
      conceptQuestionsCount: 5,
    },
    {
      id: 'ch-hyd-3',
      courseId: 'hydraulics',
      name: 'Chapter 3 · Pipe Flow & Friction Head Loss',
      order: 3,
      sourcesCount: 3,
      mastered: false,
      statusText: '0 of 3',
      sources: [
        {
          id: 'src-hyd-3-1',
          courseId: 'hydraulics',
          chapterId: 'ch-hyd-3',
          kind: 'file',
          fileExt: 'PDF',
          title: 'Ch3 Lecture.pdf',
          createdAt: '2 days ago',
          pinned: false,
          order: 1,
        },
        {
          id: 'src-hyd-3-2',
          courseId: 'hydraulics',
          chapterId: 'ch-hyd-3',
          kind: 'file',
          fileExt: 'XLSX',
          title: 'Ch3 Worksheet.xlsx',
          createdAt: '2 days ago',
          pinned: false,
          order: 2,
        },
        {
          id: 'src-hyd-3-3',
          courseId: 'hydraulics',
          chapterId: 'ch-hyd-3',
          kind: 'note',
          title: 'Ch3 Notes',
          noteBody: 'Darcy-Weisbach equation: h_f = f (L/D) (v² / 2g). Hazen-Williams equation for water distribution networks.',
          createdAt: '2 days ago',
          pinned: false,
          order: 3,
        },
      ],
      keyFormulas: ['h_f = f · (L/D) · (v² / 2g)'],
      workedExamplesCount: 3,
      conceptQuestionsCount: 4,
    },
  ],
};
