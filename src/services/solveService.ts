import { Template, TemplateStep, StepAttempt } from '../types';
import { mockTemplates } from '../data/mock/templates';
import { mockAttempts } from '../data/mock/attempts';

export interface StepCheckResult {
  isCorrect: boolean;
  mistakeLabel?: string;
  explanation?: string;
  tolerancePct?: number;
}

export const solveService = {
  async getTemplateById(templateId: string): Promise<Template | null> {
    await new Promise((resolve) => setTimeout(resolve, 80));
    return mockTemplates[templateId] || null;
  },

  async checkStepAnswer(
    templateId: string,
    stepOrder: number,
    userValue: number,
    userUnit: string,
    _priorAnswers: Record<number, number> = {}
  ): Promise<StepCheckResult> {
    await new Promise((resolve) => setTimeout(resolve, 100));

    const template = mockTemplates[templateId];
    if (!template) {
      return { isCorrect: false, explanation: 'Template not found' };
    }

    const step = template.steps.find((s) => s.order === stepOrder);
    if (!step) {
      return { isCorrect: false, explanation: 'Step not found' };
    }

    // 1. Unit Check
    const cleanUnit = (u: string) =>
      u.trim().toLowerCase().replace(/·/g, '*').replace(/\s+/g, '');
    const normalizedUserUnit = cleanUnit(userUnit);
    const acceptable = (step.acceptableUnits || [step.answerUnit]).map(cleanUnit);

    if (!acceptable.includes(normalizedUserUnit)) {
      return {
        isCorrect: false,
        mistakeLabel: 'Incompatible unit',
        explanation: `Expected unit in ${step.answerUnit}, but entered ${userUnit}. Please select an acceptable unit.`,
      };
    }

    // 2. Tolerance & Unit Scaling Check
    let expected = step.calculatedValue;
    let actual = userValue;

    // Unit conversions
    if (step.formulaId === 'torque_power' && (normalizedUserUnit === 'n*m' || normalizedUserUnit === 'nm')) {
      actual = actual / 1000; // 9950 N*m -> 9.95 kN*m
    }

    if (step.formulaId === 'torsion_stress' && normalizedUserUnit === 'kpa') {
      actual = actual / 1000; // 36550 kPa -> 36.55 MPa
    }

    if (step.formulaId === 'angle_twist' && normalizedUserUnit === 'rad') {
      expected = 0.0176; // in radians
    }

    // Handle J scale (if user entered e.g. 1.63e7 or 16.34 x 10^6 or 16.34)
    if (step.formulaId === 'j_hollow') {
      if (actual > 1e6) {
        actual = actual / 1e6; // e.g. 1.634e7 -> 16.34
      }
      if (expected > 1e6) {
        expected = expected / 1e6;
      }
    }

    const diffPct = Math.abs((actual - expected) / expected) * 100;

    if (diffPct <= step.tolerancePct) {
      return {
        isCorrect: true,
      };
    }

    // 3. Known Mistake Matching
    // Check Step 1 mistakes
    if (step.formulaId === 'torque_power') {
      let checkVal = (normalizedUserUnit === 'n*m') ? userValue / 1000 : userValue;
      // Mistake 1: Left out 2pi (P / f = 250 / 4 = 62.5)
      if (Math.abs((checkVal - 62.5) / 62.5) * 100 < 5 || Math.abs((userValue - 62500) / 62500) * 100 < 5) {
        return {
          isCorrect: false,
          mistakeLabel: step.mistakes[0].label,
          explanation: step.mistakes[0].explanation,
        };
      }
      // Mistake 2: Used rpm (divided by 60)
      if (Math.abs((checkVal - 0.165) / 0.165) * 100 < 10) {
        return {
          isCorrect: false,
          mistakeLabel: step.mistakes[1].label,
          explanation: step.mistakes[1].explanation,
        };
      }
    }

    // Check Step 2 mistakes (J)
    if (step.formulaId === 'j_hollow') {
      // Mistake 1: Used pi/16 instead of pi/32 (value is exactly double: ~32.67 x 10^6 or 3.27 x 10^7)
      const mistakeVal = 32.67;
      let checkVal = userValue > 1e6 ? userValue / 1e6 : userValue;
      if (Math.abs((checkVal - mistakeVal) / mistakeVal) * 100 < 6 || Math.abs((checkVal - 3.27) / 3.27) * 100 < 6) {
        return {
          isCorrect: false,
          mistakeLabel: step.mistakes[0].label,
          explanation: step.mistakes[0].explanation,
        };
      }
      // Mistake 2: Used (D - d)^4
      if (checkVal < 1.0) {
        return {
          isCorrect: false,
          mistakeLabel: step.mistakes[1].label,
          explanation: step.mistakes[1].explanation,
        };
      }
    }

    // Check Step 3 mistakes (Stress)
    if (step.formulaId === 'torsion_stress') {
      let checkVal = (normalizedUserUnit === 'kpa') ? userValue / 1000 : userValue;
      // Inner radius mistake: ~24.3 MPa
      if (Math.abs((checkVal - 24.3) / 24.3) * 100 < 8) {
        return {
          isCorrect: false,
          mistakeLabel: step.mistakes[0].label,
          explanation: step.mistakes[0].explanation,
        };
      }
      // Diameter mistake: ~73.1 MPa
      if (Math.abs((checkVal - 73.1) / 73.1) * 100 < 8) {
        return {
          isCorrect: false,
          mistakeLabel: step.mistakes[1].label,
          explanation: step.mistakes[1].explanation,
        };
      }
    }

    // Check Step 4 mistakes (Angle of twist)
    if (step.formulaId === 'angle_twist') {
      // Mistake 1: Forgot to convert radians to degrees (~0.0176 entered in degrees)
      if (normalizedUserUnit !== 'rad' && Math.abs((userValue - 0.0176) / 0.0176) * 100 < 10) {
        return {
          isCorrect: false,
          mistakeLabel: step.mistakes[0]?.label || 'Forgot to convert radians to degrees',
          explanation: step.mistakes[0]?.explanation || 'Your answer is in radians. Multiply by 180 / π to get degrees.',
        };
      }
      // Mistake 2: Did not convert length from meters to mm (~0.00101)
      if (Math.abs((userValue - 0.00101) / 0.00101) * 100 < 15) {
        return {
          isCorrect: false,
          mistakeLabel: step.mistakes[1]?.label || 'Did not convert length L to mm',
          explanation: step.mistakes[1]?.explanation || 'Ensure length L is converted to millimeters (2.4 m = 2400 mm).',
        };
      }
    }

    return {
      isCorrect: false,
      mistakeLabel: 'Incorrect calculation',
      explanation: 'Your answer does not match the expected value within tolerance. Check the formula parameters and units.',
    };
  },

  async logStepAttempt(stepAttempt: Omit<StepAttempt, 'id'>): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    // Push to latest attempt or create a new attempt entry
    const newSa: StepAttempt = {
      ...stepAttempt,
      id: `sa-${Date.now()}`,
    };
    if (mockAttempts.length > 0) {
      mockAttempts[0].stepAttempts.push(newSa);
    }
  },
};
