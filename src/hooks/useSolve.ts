import { useState, useEffect, useCallback } from 'react';
import { Template, TemplateStep } from '../types';
import { solveService, StepCheckResult } from '../services/solveService';

export function useSolve(templateId: string = 'torsion_hollow') {
  const [template, setTemplate] = useState<Template | null>(null);
  const [currentStepOrder, setCurrentStepOrder] = useState<number>(1);
  const [userAnswers, setUserAnswers] = useState<Record<number, { value: number; unit: string }>>({});
  const [completedSteps, setCompletedSteps] = useState<
    Array<{ step: TemplateStep; value: number; unit: string; hintsUsed: number }>
  >([]);
  const [revealedHints, setRevealedHints] = useState<Record<number, number>>({});
  const [feedback, setFeedback] = useState<StepCheckResult | null>(null);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [checking, setChecking] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadTemplate = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await solveService.getTemplateById(templateId);
      if (!data) {
        throw new Error(`Template not found: ${templateId}`);
      }
      setTemplate(data);
      setCurrentStepOrder(1);
      setCompletedSteps([]);
      setRevealedHints({});
      setFeedback(null);
      setIsCompleted(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to load problem');
    } finally {
      setLoading(false);
    }
  }, [templateId]);

  useEffect(() => {
    loadTemplate();
  }, [loadTemplate]);

  const currentStep = template?.steps.find((s) => s.order === currentStepOrder) || null;
  const currentStepHintsRevealed = revealedHints[currentStepOrder] || 0;

  const revealNextHint = useCallback(() => {
    if (!currentStep) return;
    const maxHints = currentStep.hints.length;
    setRevealedHints((prev) => {
      const current = prev[currentStepOrder] || 0;
      if (current < maxHints) {
        return { ...prev, [currentStepOrder]: current + 1 };
      }
      return prev;
    });
  }, [currentStep, currentStepOrder]);

  const checkAnswer = useCallback(
    async (numericVal: number, unit: string) => {
      if (!template || !currentStep) return;
      try {
        setChecking(true);
        const priorNumbers: Record<number, number> = {};
        Object.entries(userAnswers).forEach(([k, v]) => {
          priorNumbers[Number(k)] = v.value;
        });

        const result = await solveService.checkStepAnswer(
          template.id,
          currentStep.order,
          numericVal,
          unit,
          priorNumbers
        );

        setFeedback(result);

        const hintsCount = revealedHints[currentStep.order] || 0;

        // Log attempt
        await solveService.logStepAttempt({
          attemptId: `att-${template.id}`,
          stepOrder: currentStep.order,
          answer: numericVal,
          unit,
          isCorrect: result.isCorrect,
          mistakeLabel: result.mistakeLabel,
          hintsUsed: hintsCount,
          tries: 1,
          timeMs: 45000,
        });

        if (result.isCorrect) {
          // Record completed step
          setCompletedSteps((prev) => [
            ...prev,
            { step: currentStep, value: numericVal, unit, hintsUsed: hintsCount },
          ]);
          setUserAnswers((prev) => ({
            ...prev,
            [currentStep.order]: { value: numericVal, unit },
          }));

          // Move to next step or finish
          const nextOrder = currentStep.order + 1;
          const nextStep = template.steps.find((s) => s.order === nextOrder);
          if (nextStep) {
            setCurrentStepOrder(nextOrder);
            setFeedback(null);
          } else {
            setIsCompleted(true);
          }
        }
      } catch (err: any) {
        setError(err?.message || 'Error checking answer');
      } finally {
        setChecking(false);
      }
    },
    [template, currentStep, userAnswers, revealedHints]
  );

  return {
    template,
    currentStep,
    currentStepOrder,
    totalSteps: template?.steps.length || 0,
    completedSteps,
    hintsRevealedCount: currentStepHintsRevealed,
    activeHints: currentStep ? currentStep.hints.slice(0, currentStepHintsRevealed) : [],
    revealNextHint,
    checkAnswer,
    feedback,
    clearFeedback: useCallback(() => setFeedback(null), []),
    isCompleted,
    loading,
    checking,
    error,
    restart: loadTemplate,
  };
}
