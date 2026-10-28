import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Rect, Ellipse, Path, Line, Text as SvgText } from 'react-native-svg';
import type { RootStackScreenProps } from '../navigation/types';
import { useSolve } from '../hooks';
import { colors, typography, radii, spacing } from '../theme';
import {
  CloseIcon,
  CheckIcon,
  LightbulbIcon,
  AlertCircleIcon,
  AwardIcon,
  RefreshIcon,
} from '../components/Icons';
import { parseNumericInput, formatSecondsToTimer } from '../utils/math';

export const SolveScreen: React.FC<RootStackScreenProps<'Solve'>> = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const templateId = route.params?.templateId || 'torsion_hollow';

  const {
    template,
    currentStep,
    currentStepOrder,
    totalSteps,
    completedSteps,
    hintsRevealedCount,
    activeHints,
    revealNextHint,
    checkAnswer,
    feedback,
    clearFeedback,
    isCompleted,
    loading,
    checking,
    error,
    restart,
  } = useSolve(templateId);

  // Local state
  const [inputValue, setInputValue] = useState('');
  const [selectedUnit, setSelectedUnit] = useState<string>('kN·m');
  const [inputError, setInputError] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Sync unit and clear input on step change
  useEffect(() => {
    if (currentStep) {
      setSelectedUnit(currentStep.answerUnit);
      setInputValue('');
      setInputError(null);
      clearFeedback();
    }
  }, [currentStep?.order, currentStep?.answerUnit, clearFeedback]);

  // Elapsed timer
  useEffect(() => {
    if (isCompleted || loading) return;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isCompleted, loading]);

  const formattedTime = formatSecondsToTimer(elapsedSeconds);

  // Available units for active step
  const availableUnits = useMemo(() => {
    if (!currentStep) return [];
    return currentStep.acceptableUnits && currentStep.acceptableUnits.length > 0
      ? currentStep.acceptableUnits
      : [currentStep.answerUnit];
  }, [currentStep]);

  const handleCycleUnit = () => {
    if (availableUnits.length <= 1) return;
    const idx = availableUnits.indexOf(selectedUnit);
    const nextIdx = (idx + 1) % availableUnits.length;
    setSelectedUnit(availableUnits[nextIdx]);
    clearFeedback();
  };

  const handleCheck = async () => {
    if (!inputValue.trim()) {
      setInputError('Please enter a numeric answer');
      return;
    }
    const parsed = parseNumericInput(inputValue);
    if (isNaN(parsed)) {
      setInputError('Could not parse number. Example: 9.95 or 16.34 or 3.27e7');
      return;
    }
    setInputError(null);
    await checkAnswer(parsed, selectedUnit);
  };

  const handleRestart = () => {
    setElapsedSeconds(0);
    setInputValue('');
    setInputError(null);
    restart();
  };

  // Quick preset tester helper for device testing
  const handleApplyPreset = (valStr: string, unitStr?: string) => {
    setInputValue(valStr);
    if (unitStr) setSelectedUnit(unitStr);
    setInputError(null);
    clearFeedback();
  };

  // Total hints used across completed steps
  const totalHintsUsed = useMemo(() => {
    return completedSteps.reduce((acc, curr) => acc + curr.hintsUsed, 0);
  }, [completedSteps]);

  // Loading state
  if (loading) {
    return (
      <View style={[styles.centerContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.rose} />
        <Text style={styles.loadingText}>Loading problem...</Text>
      </View>
    );
  }

  // Error state
  if (error && !template) {
    return (
      <View style={[styles.centerContainer, { paddingTop: insets.top }]}>
        <AlertCircleIcon size={36} color={colors.rose} />
        <Text style={styles.errorTitle}>Error loading problem</Text>
        <Text style={styles.errorSubtitle}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRestart} activeOpacity={0.8}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoid}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
        {/* Top Bar with Close, Title, Timer */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
            accessibilityLabel="Close"
          >
            <CloseIcon color={colors.muted} size={18} />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.problemTitle} numberOfLines={1}>
              {template?.title.split(':')[0] || 'Torsion · hollow shaft'}
            </Text>
            <Text style={styles.stepSubtitle}>
              {isCompleted
                ? `Completed in ${formattedTime}`
                : `Step ${currentStepOrder} of ${totalSteps} · hints ${
                    hintsRevealedCount > 0 ? `${hintsRevealedCount} used` : 'available'
                  }`}
            </Text>
          </View>
          <View style={styles.timerBadge}>
            <Text style={styles.timerText}>{formattedTime}</Text>
          </View>
        </View>

        {/* Step Progress Segments */}
        <View style={styles.segmentsRow}>
          {Array.from({ length: totalSteps || 4 }).map((_, index) => {
            const stepNum = index + 1;
            const isStepDone = stepNum < currentStepOrder || isCompleted;
            const isStepActive = stepNum === currentStepOrder && !isCompleted;
            return (
              <View
                key={index}
                style={[
                  styles.segment,
                  isStepDone
                    ? { backgroundColor: colors.blue }
                    : isStepActive
                    ? { backgroundColor: colors.pinkAccent }
                    : { backgroundColor: colors.pinkTrack },
                ]}
              />
            );
          })}
        </View>

        {/* Scrollable Main Content */}
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 96 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Situation Card */}
          <View style={styles.situationCard}>
            <View style={styles.situationHeaderRow}>
              <Text style={styles.situationHeading}>SITUATION</Text>
              {template?.boardSubject && (
                <View style={styles.subjectTag}>
                  <Text style={styles.subjectTagText}>{template.boardSubject}</Text>
                </View>
              )}
            </View>
            <Text style={styles.situationText}>
              {template?.scenario ||
                'A hollow steel shaft 2.4 m long transmits 250 kW at 4 Hz. Outer diameter 120 mm, inner 80 mm. G = 83 GPa. Find (a) the max shear stress and (b) the angle of twist.'}
            </Text>

            {/* Diagram SVG (Hollow shaft) */}
            <View style={styles.diagramWrap}>
              <Svg viewBox="0 0 340 92" width="100%" height={92}>
                <Rect
                  x="40"
                  y="26"
                  width="230"
                  height="40"
                  rx="3"
                  fill={colors.pinkTrack}
                  stroke={colors.roseText}
                  strokeWidth="1.5"
                />
                <Rect
                  x="40"
                  y="36"
                  width="230"
                  height="20"
                  fill="#FFFFFF"
                  stroke={colors.roseText}
                  strokeWidth="1"
                  strokeDasharray="4 3"
                />
                <Ellipse
                  cx="270"
                  cy="46"
                  rx="9"
                  ry="20"
                  fill={colors.pinkSoft}
                  stroke={colors.roseText}
                  strokeWidth="1.5"
                />
                <Ellipse
                  cx="270"
                  cy="46"
                  rx="4.5"
                  ry="10"
                  fill="#FFFFFF"
                  stroke={colors.roseText}
                  strokeWidth="1"
                />
                <Path
                  d="M296 30 A 18 18 0 0 1 296 62"
                  fill="none"
                  stroke={colors.blue}
                  strokeWidth="2"
                />
                <Path d="M290 60 L297 64 L299 56 Z" fill={colors.blue} />
                <SvgText
                  x="304"
                  y="50"
                  fontSize="12"
                  fill={colors.blue}
                  fontFamily={typography.fontFamily.monoMedium}
                >
                  T
                </SvgText>
                <Line x1="40" y1="80" x2="270" y2="80" stroke={colors.muted} strokeWidth="1" />
                <SvgText
                  x="132"
                  y="78"
                  fontSize="11"
                  fill={colors.muted}
                  fontFamily={typography.fontFamily.monoRegular}
                >
                  2.4 m
                </SvgText>
                <SvgText
                  x="4"
                  y="30"
                  fontSize="10"
                  fill={colors.muted}
                  fontFamily={typography.fontFamily.monoRegular}
                >
                  D 120
                </SvgText>
                <SvgText
                  x="4"
                  y="50"
                  fontSize="10"
                  fill={colors.muted}
                  fontFamily={typography.fontFamily.monoRegular}
                >
                  d 80
                </SvgText>
              </Svg>
            </View>
          </View>

          {/* Completed Steps List */}
          {completedSteps.map((item) => (
            <View key={item.step.order} style={styles.completedStepCard}>
              <View style={styles.completedCheckBg}>
                <CheckIcon color="#FFFFFF" size={14} />
              </View>
              <View style={styles.completedStepTextContainer}>
                <Text style={styles.completedStepText}>
                  <Text style={styles.completedStepBold}>
                    Step {item.step.order}: {item.step.prompt.split(',')[0]}
                  </Text>
                  {'  '}
                  <Text style={styles.completedStepValue}>
                    = {item.value} {item.unit}
                  </Text>
                </Text>
              </View>
              <View style={styles.completedStepTagWrap}>
                <Text style={styles.completedStepTag}>
                  {item.hintsUsed === 0
                    ? 'no hints'
                    : `${item.hintsUsed} hint${item.hintsUsed > 1 ? 's' : ''}`}
                </Text>
              </View>
            </View>
          ))}

          {/* Active Step Card (When not completed) */}
          {!isCompleted && currentStep && (
            <View style={styles.activeStepCard}>
              {/* Header */}
              <View style={styles.activeStepHeader}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>
                    STEP {currentStep.order} OF {totalSteps}
                  </Text>
                </View>
                {currentStep.skill && (
                  <Text style={styles.stepSkillText}>
                    {currentStep.skill.replace(/_/g, ' ')}
                  </Text>
                )}
              </View>

              <Text style={styles.activeStepTitle}>{currentStep.prompt}</Text>

              {/* Input Row with Numeric Input and Unit Selector */}
              <View style={styles.inputRow}>
                <TextInput
                  style={[
                    styles.numericInput,
                    inputError ? styles.numericInputError : undefined,
                  ]}
                  value={inputValue}
                  onChangeText={(val) => {
                    setInputValue(val);
                    if (inputError) setInputError(null);
                  }}
                  keyboardType="numeric"
                  placeholder={
                    currentStep.formulaId === 'j_hollow'
                      ? 'e.g. 16.34 or 3.27 × 10⁷'
                      : 'Enter calculated value'
                  }
                  placeholderTextColor={colors.muted}
                  returnKeyType="done"
                  onSubmitEditing={handleCheck}
                />
                <TouchableOpacity
                  style={styles.unitSelector}
                  activeOpacity={availableUnits.length > 1 ? 0.7 : 1}
                  onPress={handleCycleUnit}
                  accessibilityLabel="Change unit"
                >
                  <Text style={styles.unitSelectorText}>{selectedUnit}</Text>
                  {availableUnits.length > 1 && (
                    <Text style={styles.unitCycleHint}>⇄</Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Input Validation Error */}
              {inputError && (
                <View style={styles.inlineWarning}>
                  <AlertCircleIcon size={14} color={colors.roseText} />
                  <Text style={styles.inlineWarningText}>{inputError}</Text>
                </View>
              )}

              {/* Progressive Hints Section */}
              {activeHints.length > 0 && (
                <View style={styles.hintsContainer}>
                  <View style={styles.hintsHeaderRow}>
                    <LightbulbIcon size={15} color={colors.roseText} />
                    <Text style={styles.hintsHeading}>
                      Revealed Hints ({activeHints.length}/{currentStep.hints.length})
                    </Text>
                  </View>
                  {activeHints.map((hint, idx) => (
                    <View key={idx} style={styles.hintItem}>
                      <View style={styles.hintIndexBadge}>
                        <Text style={styles.hintIndexText}>{idx + 1}</Text>
                      </View>
                      <Text style={styles.hintBodyText}>{hint}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Mistake Diagnostic Feedback Card */}
              {feedback && !feedback.isCorrect && (
                <View style={styles.feedbackCard}>
                  <View style={styles.feedbackHeaderRow}>
                    <AlertCircleIcon size={16} color={colors.roseText} />
                    <Text style={styles.feedbackMistakeLabel}>
                      {feedback.mistakeLabel || 'Almost there!'}
                    </Text>
                  </View>
                  <Text style={styles.feedbackText}>{feedback.explanation}</Text>
                </View>
              )}

              {/* Quick Testing Bar (For live testing on device) */}
              <View style={styles.testBenchSection}>
                <Text style={styles.testBenchLabel}>QUICK TEST ON DEVICE</Text>
                <View style={styles.testChipsRow}>
                  {/* Fill Correct */}
                  <TouchableOpacity
                    style={[styles.testChip, styles.testChipCorrect]}
                    activeOpacity={0.7}
                    onPress={() =>
                      handleApplyPreset(
                        String(currentStep.calculatedValue),
                        currentStep.answerUnit
                      )
                    }
                  >
                    <Text style={styles.testChipCorrectText}>
                      ✓ Correct: {currentStep.calculatedValue}
                    </Text>
                  </TouchableOpacity>

                  {/* Number parser test chips */}
                  <TouchableOpacity
                    style={styles.testChip}
                    activeOpacity={0.7}
                    onPress={() => handleApplyPreset('1,250')}
                  >
                    <Text style={styles.testChipText}>Test: 1,250</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.testChip}
                    activeOpacity={0.7}
                    onPress={() => handleApplyPreset('2 x 10')}
                  >
                    <Text style={styles.testChipText}>Test: 2 x 10</Text>
                  </TouchableOpacity>

                  {/* Common Mistakes */}
                  {currentStep.order === 1 && (
                    <>
                      <TouchableOpacity
                        style={styles.testChip}
                        activeOpacity={0.7}
                        onPress={() => handleApplyPreset('62.5', 'kN·m')}
                      >
                        <Text style={styles.testChipText}>Test: Left out 2π (62.5)</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.testChip}
                        activeOpacity={0.7}
                        onPress={() => handleApplyPreset('0.165', 'kN·m')}
                      >
                        <Text style={styles.testChipText}>Test: rpm error (0.165)</Text>
                      </TouchableOpacity>
                    </>
                  )}

                  {currentStep.order === 2 && (
                    <>
                      <TouchableOpacity
                        style={styles.testChip}
                        activeOpacity={0.7}
                        onPress={() => handleApplyPreset('3.27 × 10⁷', 'mm⁴')}
                      >
                        <Text style={styles.testChipText}>Test: π/16 error (3.27 × 10⁷)</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.testChip}
                        activeOpacity={0.7}
                        onPress={() => handleApplyPreset('0.25', 'mm⁴')}
                      >
                        <Text style={styles.testChipText}>Test: (D-d)⁴ error (0.25)</Text>
                      </TouchableOpacity>
                    </>
                  )}

                  {currentStep.order === 3 && (
                    <>
                      <TouchableOpacity
                        style={styles.testChip}
                        activeOpacity={0.7}
                        onPress={() => handleApplyPreset('24.3', 'MPa')}
                      >
                        <Text style={styles.testChipText}>Test: Inner radius (24.3)</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.testChip}
                        activeOpacity={0.7}
                        onPress={() => handleApplyPreset('73.1', 'MPa')}
                      >
                        <Text style={styles.testChipText}>Test: Diameter error (73.1)</Text>
                      </TouchableOpacity>
                    </>
                  )}

                  {currentStep.order === 4 && (
                    <>
                      <TouchableOpacity
                        style={styles.testChip}
                        activeOpacity={0.7}
                        onPress={() => handleApplyPreset('0.0176', 'deg')}
                      >
                        <Text style={styles.testChipText}>Test: Radians in deg (0.0176)</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.testChip}
                        activeOpacity={0.7}
                        onPress={() => handleApplyPreset('0.00101', 'deg')}
                      >
                        <Text style={styles.testChipText}>Test: Length in m (0.00101)</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            </View>
          )}

          {/* Completion Card (When all steps finished) */}
          {isCompleted && (
            <View style={styles.completionCard}>
              <View style={styles.awardCircle}>
                <AwardIcon color={colors.blue} size={36} />
              </View>
              <Text style={styles.completionTitle}>Problem Mastered!</Text>
              <Text style={styles.completionSubtitle}>
                You solved all {totalSteps} calculation steps accurately.
              </Text>

              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>TIME</Text>
                  <Text style={styles.statVal}>{formattedTime}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>STEPS</Text>
                  <Text style={styles.statVal}>
                    {completedSteps.length} / {totalSteps}
                  </Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>HINTS USED</Text>
                  <Text style={styles.statVal}>{totalHintsUsed}</Text>
                </View>
              </View>

              <View style={styles.completionActions}>
                <TouchableOpacity
                  style={styles.restartButton}
                  onPress={handleRestart}
                  activeOpacity={0.8}
                >
                  <RefreshIcon color={colors.roseText} size={18} />
                  <Text style={styles.restartButtonText}>Solve Again</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.finishButton}
                  onPress={() => navigation.goBack()}
                  activeOpacity={0.8}
                >
                  <Text style={styles.finishButtonText}>Back to Practice</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Pinned Bottom Actions */}
        {!isCompleted && currentStep && (
          <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <TouchableOpacity
              style={[
                styles.hintButton,
                hintsRevealedCount >= currentStep.hints.length && styles.hintButtonDisabled,
              ]}
              activeOpacity={0.8}
              onPress={revealNextHint}
              disabled={hintsRevealedCount >= currentStep.hints.length}
            >
              <LightbulbIcon
                size={18}
                color={
                  hintsRevealedCount >= currentStep.hints.length
                    ? colors.muted
                    : colors.roseText
                }
              />
              <Text
                style={[
                  styles.hintButtonText,
                  hintsRevealedCount >= currentStep.hints.length &&
                    styles.hintButtonTextDisabled,
                ]}
              >
                {hintsRevealedCount >= currentStep.hints.length
                  ? `All hints (${hintsRevealedCount}/${currentStep.hints.length})`
                  : `Hint (${hintsRevealedCount}/${currentStep.hints.length})`}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.checkButton, checking && styles.checkButtonLoading]}
              activeOpacity={0.8}
              onPress={handleCheck}
              disabled={checking}
            >
              {checking ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.checkButtonText}>
                  {feedback && !feedback.isCorrect ? 'Check again' : 'Check answer'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.screenPaddingHorizontal,
    gap: 12,
  },
  loadingText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.body,
    color: colors.muted,
  },
  errorTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 18,
    color: colors.ink,
    marginTop: 8,
  },
  errorSubtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.body,
    color: colors.muted,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 12,
    backgroundColor: colors.rose,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: radii.button,
  },
  retryButtonText: {
    color: colors.surface,
    fontFamily: typography.fontFamily.bold,
    fontSize: 14,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: spacing.screenPaddingHorizontal,
    paddingVertical: 10,
  },
  closeButton: {
    width: spacing.minTouchTarget,
    height: spacing.minTouchTarget,
    borderRadius: radii.round,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.pinkLine,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  problemTitle: {
    fontSize: 15,
    fontFamily: typography.fontFamily.bold,
    color: colors.ink,
  },
  stepSubtitle: {
    fontSize: typography.sizes.caption,
    color: colors.muted,
    fontFamily: typography.fontFamily.regular,
  },
  timerBadge: {
    backgroundColor: colors.pinkSoft,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.chip,
  },
  timerText: {
    fontFamily: typography.fontFamily.monoMedium,
    fontSize: 13,
    color: colors.roseText,
  },
  segmentsRow: {
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: spacing.screenPaddingHorizontal,
    marginTop: 4,
    marginBottom: 8,
  },
  segment: {
    flex: 1,
    height: 5,
    borderRadius: 3,
  },
  scrollContent: {
    paddingHorizontal: spacing.screenPaddingHorizontal,
    gap: 12,
    paddingTop: 8,
  },
  situationCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.pinkLine,
    borderRadius: radii.card,
    padding: 14,
    gap: 10,
  },
  situationHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  situationHeading: {
    fontSize: 12,
    fontFamily: typography.fontFamily.bold,
    letterSpacing: 0.8,
    color: colors.roseText,
  },
  subjectTag: {
    backgroundColor: colors.pinkSoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.chip,
  },
  subjectTagText: {
    fontFamily: typography.fontFamily.monoMedium,
    fontSize: 10,
    color: colors.roseText,
  },
  situationText: {
    fontSize: typography.sizes.body,
    lineHeight: 21,
    color: colors.ink,
    fontFamily: typography.fontFamily.regular,
  },
  diagramWrap: {
    backgroundColor: colors.bg,
    borderRadius: radii.chip,
    paddingVertical: 4,
  },
  completedStepCard: {
    backgroundColor: colors.blueSoft,
    borderRadius: radii.button,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  completedCheckBg: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedStepTextContainer: {
    flex: 1,
    minWidth: 0,
  },
  completedStepText: {
    fontSize: 13,
    color: colors.ink,
    fontFamily: typography.fontFamily.regular,
  },
  completedStepBold: {
    fontFamily: typography.fontFamily.bold,
  },
  completedStepValue: {
    fontFamily: typography.fontFamily.monoMedium,
    color: colors.blue,
  },
  completedStepTagWrap: {
    backgroundColor: '#D7E5FA',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.chip,
  },
  completedStepTag: {
    fontSize: 11,
    color: colors.blue,
    fontFamily: typography.fontFamily.medium,
  },
  activeStepCard: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.pinkAccent,
    borderRadius: radii.card,
    padding: 16,
    gap: 12,
  },
  activeStepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepBadge: {
    backgroundColor: colors.pinkSoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.chip,
  },
  stepBadgeText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 10,
    letterSpacing: 0.8,
    color: colors.roseText,
  },
  stepSkillText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 12,
    color: colors.muted,
  },
  activeStepTitle: {
    fontSize: 16,
    fontFamily: typography.fontFamily.bold,
    color: colors.ink,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  numericInput: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 2,
    borderColor: colors.pinkDot,
    borderRadius: 14,
    fontFamily: typography.fontFamily.monoMedium,
    fontSize: 16,
    color: colors.ink,
    backgroundColor: colors.surface,
  },
  numericInputError: {
    borderColor: colors.rose,
  },
  unitSelector: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.pinkInput,
    borderRadius: 14,
    backgroundColor: colors.pinkSoft,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
    minWidth: 70,
  },
  unitSelectorText: {
    fontFamily: typography.fontFamily.monoMedium,
    fontSize: 14,
    color: colors.roseText,
  },
  unitCycleHint: {
    fontSize: 13,
    color: colors.roseText,
  },
  inlineWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
  },
  inlineWarningText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 12,
    color: colors.roseText,
  },
  hintsContainer: {
    backgroundColor: '#FFF9FB',
    borderWidth: 1,
    borderColor: colors.pinkLine,
    borderRadius: 14,
    padding: 12,
    gap: 8,
  },
  hintsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  hintsHeading: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 12,
    color: colors.roseText,
    letterSpacing: 0.5,
  },
  hintItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 2,
  },
  hintIndexBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.pinkAccent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  hintIndexText: {
    color: colors.surface,
    fontSize: 10,
    fontFamily: typography.fontFamily.bold,
  },
  hintBodyText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: colors.ink,
    fontFamily: typography.fontFamily.regular,
  },
  feedbackCard: {
    backgroundColor: colors.pinkSoft,
    borderWidth: 1,
    borderColor: colors.pinkAccent,
    borderRadius: 14,
    padding: 12,
    gap: 6,
  },
  feedbackHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  feedbackMistakeLabel: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 13,
    color: colors.roseText,
  },
  feedbackText: {
    fontSize: 13,
    lineHeight: 19,
    color: '#4A2534',
    fontFamily: typography.fontFamily.regular,
  },
  testBenchSection: {
    borderTopWidth: 1,
    borderTopColor: colors.pinkTrack,
    paddingTop: 10,
    gap: 6,
  },
  testBenchLabel: {
    fontSize: 10,
    fontFamily: typography.fontFamily.bold,
    color: colors.muted,
    letterSpacing: 0.6,
  },
  testChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  testChip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.pinkLine,
    borderRadius: radii.chip,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  testChipText: {
    fontSize: 11,
    fontFamily: typography.fontFamily.monoRegular,
    color: colors.muted,
  },
  testChipCorrect: {
    backgroundColor: colors.blueSoft,
    borderColor: colors.blue,
  },
  testChipCorrectText: {
    fontSize: 11,
    fontFamily: typography.fontFamily.monoMedium,
    color: colors.blue,
  },
  completionCard: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.blue,
    borderRadius: radii.cardLarge,
    padding: 20,
    alignItems: 'center',
    gap: 12,
  },
  awardCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  completionTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 20,
    color: colors.ink,
  },
  completionSubtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
    marginTop: -4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bg,
    borderRadius: radii.cardSmall,
    paddingVertical: 14,
    paddingHorizontal: 16,
    width: '100%',
    marginVertical: 4,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: colors.pinkLine,
  },
  statLabel: {
    fontSize: 10,
    fontFamily: typography.fontFamily.bold,
    color: colors.muted,
    letterSpacing: 0.6,
  },
  statVal: {
    fontSize: 15,
    fontFamily: typography.fontFamily.monoMedium,
    color: colors.ink,
  },
  completionActions: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginTop: 4,
  },
  restartButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: radii.button,
    borderWidth: 1,
    borderColor: colors.pinkLine,
    backgroundColor: colors.surface,
  },
  restartButtonText: {
    color: colors.roseText,
    fontFamily: typography.fontFamily.bold,
    fontSize: 14,
  },
  finishButton: {
    flex: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: radii.button,
    backgroundColor: colors.blue,
  },
  finishButtonText: {
    color: colors.surface,
    fontFamily: typography.fontFamily.bold,
    fontSize: 14,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.pinkLine,
    paddingHorizontal: spacing.screenPaddingHorizontal,
    paddingTop: 12,
    flexDirection: 'row',
    gap: 10,
  },
  hintButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: radii.button,
    borderWidth: 1,
    borderColor: colors.pinkInput,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  hintButtonDisabled: {
    opacity: 0.5,
    borderColor: colors.pinkLine,
  },
  hintButtonText: {
    color: colors.roseText,
    fontFamily: typography.fontFamily.bold,
    fontSize: 14,
  },
  hintButtonTextDisabled: {
    color: colors.muted,
  },
  checkButton: {
    flex: 1.5,
    paddingVertical: 14,
    borderRadius: radii.button,
    backgroundColor: colors.rose,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkButtonLoading: {
    opacity: 0.8,
  },
  checkButtonText: {
    color: colors.surface,
    fontFamily: typography.fontFamily.bold,
    fontSize: 15,
  },
});
