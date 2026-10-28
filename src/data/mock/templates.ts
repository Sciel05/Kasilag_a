import { Template } from '../../types';

export const mockTemplates: Record<string, Template> = {
  torsion_hollow: {
    id: 'torsion_hollow',
    title: 'Torsion: hollow shaft transmitting power',
    boardSubject: 'PSAD',
    cluster: 'PSAD',
    topic: 'Torsion',
    difficulty: 'board',
    chapterId: 'ch-3',
    chapterName: 'deformable.torsion',
    scenario:
      'A hollow steel shaft 2.4 m long transmits 250 kW at 4 Hz. Outer diameter 120 mm, inner 80 mm. G = 83 GPa. Find (a) the max shear stress and (b) the angle of twist.',
    parameters: {
      L: { value: 2.4, unit: 'm' },
      P: { value: 250, unit: 'kW' },
      f: { value: 4, unit: 'Hz' },
      D: { value: 120, unit: 'mm' },
      d: { value: 80, unit: 'mm' },
      G: { value: 83, unit: 'GPa' },
    },
    constraints: ['(D - d) / 2 >= 10 mm'],
    diagramType: 'hollow_shaft',
    steps: [
      {
        order: 1,
        prompt: 'Torque transmitted by the shaft',
        formulaId: 'torque_power',
        formula: 'P / (2 * pi * f)',
        answerUnit: 'kN·m',
        acceptableUnits: ['kN·m', 'kN*m', 'N·m', 'N*m'],
        tolerancePct: 1.5,
        skill: 'torque_power_relation',
        calculatedValue: 9.95, // kN*m (250 / (2 * pi * 4) = 9.947 kN*m)
        hints: [
          'Recall power relation: P = 2 * π * f * T, where f is in Hertz (1/s).',
          'Isolate torque: T = P / (2 * π * f). Keep kW and Hz to get kN·m directly.',
        ],
        mistakes: [
          {
            label: 'Left out the 2π',
            formula: 'P / f',
            explanation: 'Remember power relates to angular velocity ω = 2πf, not linear frequency alone.',
          },
          {
            label: 'Used rpm in place of Hz',
            formula: 'P / (2 * pi * f * 60)',
            explanation: 'The problem specified frequency in Hz (rev/sec), not rpm. Do not divide by 60.',
          },
        ],
      },
      {
        order: 2,
        prompt: 'Polar moment of inertia, J',
        formulaId: 'j_hollow',
        formula: 'pi * (D^4 - d^4) / 32',
        answerUnit: 'mm⁴',
        acceptableUnits: ['mm⁴', 'm⁴'],
        tolerancePct: 1.5,
        displayScale: '1e6',
        skill: 'polar_moment',
        calculatedValue: 16.34, // in 10^6 mm^4: pi * (120^4 - 80^4) / 32 = 1.6336e7 mm^4 = 16.34 x 10^6 mm^4 (or 1.63 x 10^7)
        hints: [
          'For a hollow circular section, subtract inner polar moment from outer.',
          'With diameters: J = π(D⁴ − d⁴) / 32. Do not use π/16 (which applies to solid shaft radius).',
        ],
        mistakes: [
          {
            label: 'Used π/16 instead of π/32',
            formula: 'pi * (D^4 - d^4) / 16',
            explanation: 'Almost. Your answer is exactly double. With diameters, J uses π/32, not π/16.',
          },
          {
            label: 'Used (D − d)⁴',
            formula: 'pi * (D - d)^4 / 32',
            explanation: 'Do not subtract diameters before raising to the 4th power. J depends on (D⁴ − d⁴).',
          },
        ],
      },
      {
        order: 3,
        prompt: 'Maximum shear stress, τ_max',
        formulaId: 'torsion_stress',
        formula: 'T * (D / 2) / J',
        uses: { T: 1, J: 2 },
        answerUnit: 'MPa',
        acceptableUnits: ['MPa', 'kPa', 'N/mm²'],
        tolerancePct: 1.5,
        skill: 'torsion_shear_stress',
        calculatedValue: 36.55, // MPa: 9.947e6 N*mm * 60 mm / 16.336e6 mm^4 = 36.53 MPa
        hints: [
          'Use the torsion shear stress formula: τ_max = T * c / J.',
          'Here c is the outer radius c = D / 2 = 60 mm. Ensure units match (N·mm for T, mm⁴ for J).',
        ],
        mistakes: [
          {
            label: 'Used the inner radius',
            formula: 'T * (d / 2) / J',
            explanation: 'Maximum shear stress occurs on the outer surface (radius D/2), not the inner surface.',
          },
          {
            label: 'Used the diameter instead of the radius',
            formula: 'T * D / J',
            explanation: 'Torsion formula uses radius c = D/2 from the neutral axis, not diameter D.',
          },
        ],
      },
      {
        order: 4,
        prompt: 'Angle of twist, θ',
        formulaId: 'angle_twist',
        formula: 'T * L / (J * G)',
        uses: { T: 1, J: 2 },
        answerUnit: 'deg',
        acceptableUnits: ['deg', 'rad'],
        tolerancePct: 2.5,
        skill: 'angle_of_twist',
        calculatedValue: 1.01, // degrees: 9.947e6 * 2400 / (16.336e6 * 83000) = 0.0176 rad = 1.01 deg
        hints: [
          'Recall angle of twist formula: θ = (T * L) / (J * G).',
          'Convert L to mm (2400 mm) and G to MPa (83,000 MPa). Result is in radians; multiply by 180 / π for degrees.',
        ],
        mistakes: [
          {
            label: 'Forgot to convert radians to degrees',
            formula: 'T * L / (J * G)',
            explanation: 'Your value matches the result in radians (~0.0176 rad). Multiply by 180 / π to obtain degrees.',
          },
          {
            label: 'Did not convert length L from meters to mm',
            formula: 'T * 2.4 / (J * G)',
            explanation: 'Unit mismatch: Length is given in meters (2.4 m = 2400 mm). When J is in mm⁴ and G in MPa, length must be in mm.',
          },
        ],
      },
    ],
  },
};
