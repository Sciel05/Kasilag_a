import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { colors, typography, radii, spacing } from '../theme';
import { Situation, Formula, Cluster } from '../types';
import { mockTemplates } from '../data/mock/templates';
import {
  CloseIcon,
  ClockIcon,
  CheckIcon,
  PinIcon,
  BookOpenIcon,
  ChevronRightIcon,
  AlertCircleIcon,
} from './Icons';
import { formatSecondsToTimer } from '../utils/date';

interface SituationDrillModalProps {
  visible: boolean;
  situations: Situation[];
  pinnedFormulas?: Formula[];
  onClose: () => void;
  onRecordAttempt: (
    situationId: string,
    cluster: Cluster,
    title: string,
    isCorrect: boolean,
    isAssisted: boolean,
    mistakeType?: string
  ) => Promise<any>;
  onOpenSource?: (sourceId: string) => void;
}

type DrillPhase = 'setup' | 'drill' | 'review';

export const SituationDrillModal: React.FC<SituationDrillModalProps> = ({
  visible,
  situations,
  onClose,
  onRecordAttempt,
  onOpenSource,
}) => {
  // Phase
  const [phase, setPhase] = useState<DrillPhase>('setup');

  // Setup options
  const [selectedCluster, setSelectedCluster] = useState<string>('All');
  const [situationCount, setSituationCount] = useState<number>(1);
  const [timerSeconds, setTimerSeconds] = useState<number>(300); // 5 min default
  const [isExamMode, setIsExamMode] = useState<boolean>(false);

  // Active drill states
  const [activeSituations, setActiveSituations] = useState<Situation[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState<number>(300);
  const [formulaDrawerOpen, setFormulaDrawerOpen] = useState<boolean>(false);
  const [wasAssisted, setWasAssisted] = useState<boolean>(false);

  // Timer interval
  const timerRef = useRef<any>(null);

  // Filter situations for drill based on setup
  const filteredSituations = useMemo(() => {
    if (selectedCluster === 'All') return situations;
    return situations.filter((s) => s.cluster === selectedCluster);
  }, [situations, selectedCluster]);

  const currentTopicTemplate = useMemo(() => {
    const sit = activeSituations[0];
    if (!sit) return mockTemplates.torsion_hollow;
    if (sit.topic.toLowerCase().includes('torsion') || sit.cluster === 'PSAD') {
      return mockTemplates.torsion_hollow;
    }
    return mockTemplates.torsion_hollow;
  }, [activeSituations]);

  const templateFormulas = useMemo(() => {
    if (!currentTopicTemplate) return [];
    return currentTopicTemplate.steps.map((s) => ({
      id: s.formulaId,
      label: s.prompt,
      formula: s.formula,
      unit: s.answerUnit,
    }));
  }, [currentTopicTemplate]);

  const handleStartDrill = () => {
    const list = filteredSituations.slice(0, situationCount);
    if (list.length === 0) return;
    setActiveSituations(list);
    setSelectedAnswers({});
    setTimeRemaining(timerSeconds);
    setFormulaDrawerOpen(false);
    setWasAssisted(false);
    setPhase('drill');
  };

  // Timer countdown
  useEffect(() => {
    if (phase === 'drill' && timerSeconds > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleSubmitDrill();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, timerSeconds]);

  const handleOpenFormulaDrawer = () => {
    setFormulaDrawerOpen(true);
    // Opening formula drawer marks attempt as assisted!
    setWasAssisted(true);
  };

  const handleSelectOption = (questionId: string, choiceLabel: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: choiceLabel,
    }));
  };

  const handleSubmitDrill = () => {
    if (timerRef.current) clearInterval(timerRef.current);

    // Calculate correctness
    activeSituations.forEach((sit) => {
      const allCorrect = sit.questions.every(
        (q) => selectedAnswers[q.id] === q.correctLabel
      );
      const mistakeType = allCorrect
        ? undefined
        : 'Board drill multiple choice error';

      onRecordAttempt(
        sit.id,
        sit.cluster,
        sit.topic,
        allCorrect,
        wasAssisted,
        mistakeType
      );
    });

    setPhase('review');
  };

  const handleCloseAll = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase('setup');
    setSelectedAnswers({});
    onClose();
  };

  if (!visible) return null;

  // Single KaTeX WebView HTML for the Solution Review Screen
  const reviewKaTexHtml = useMemo(() => {
    if (phase !== 'review') return '';

    const reviewItems = activeSituations.flatMap((sit) => sit.questions);
    const mathContent = reviewItems
      .map((q, idx) => {
        const isCorrect = selectedAnswers[q.id] === q.correctLabel;
        const eq = q.equationUsed || '';
        const sub = q.substitution || '';
        const ans = q.finalAnswer || '';

        return `
        <div class="review-block">
          <div class="q-header">
            <span class="badge ${isCorrect ? 'badge-correct' : 'badge-wrong'}">
              Question ${idx + 1}: ${isCorrect ? 'CORRECT' : 'INCORRECT (Your choice: ' + (selectedAnswers[q.id] || 'None') + ')'}
            </span>
          </div>
          <div class="q-prompt">${q.prompt}</div>
          <div class="math-group">
            <div class="math-label">Governing Equation:</div>
            <div class="math-render" id="eq-${q.id}"></div>
            <div class="math-label">Step-by-step Substitution:</div>
            <div class="math-render" id="sub-${q.id}"></div>
            <div class="math-label">Final Value:</div>
            <div class="math-render" id="ans-${q.id}"></div>
          </div>
        </div>
      `;
      })
      .join('');

    const renderScript = reviewItems
      .map(
        (q) => `
        try {
          if (${JSON.stringify(q.equationUsed)}) {
            katex.render(${JSON.stringify(q.equationUsed)}, document.getElementById('eq-${q.id}'), { displayMode: true, throwOnError: false });
          }
          if (${JSON.stringify(q.substitution)}) {
            katex.render(${JSON.stringify(q.substitution)}, document.getElementById('sub-${q.id}'), { displayMode: true, throwOnError: false });
          }
          if (${JSON.stringify(q.finalAnswer)}) {
            katex.render(${JSON.stringify(q.finalAnswer)}, document.getElementById('ans-${q.id}'), { displayMode: true, throwOnError: false });
          }
        } catch(e) {}
      `
      )
      .join('\n');

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css">
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js"></script>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 12px;
      background-color: #FFF4F7;
      color: #3A2530;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .review-block {
      background: #FFFFFF;
      border: 1px solid #F5CAD7;
      border-radius: 14px;
      padding: 14px;
      margin-bottom: 14px;
    }
    .badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: bold;
      margin-bottom: 6px;
    }
    .badge-correct { background: #DCFCE7; color: #15803D; }
    .badge-wrong { background: #FEE2E2; color: #B91C1C; }
    .q-prompt { font-size: 13px; font-weight: 600; margin-bottom: 10px; color: #3A2530; }
    .math-label { font-size: 11px; font-weight: 600; color: #7A5F6B; margin-top: 6px; }
    .math-render { font-size: 1.15rem; margin: 4px 0 8px 0; }
  </style>
</head>
<body>
  ${mathContent}
  <script>
    function runKaTeX() {
      if (window.katex) {
        ${renderScript}
      } else {
        setTimeout(runKaTeX, 50);
      }
    }
    window.onload = runKaTeX;
  </script>
</body>
</html>
    `;
  }, [phase, activeSituations, selectedAnswers]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleCloseAll}
    >
      <SafeAreaView style={styles.safeContainer}>
        {/* ================= PHASE 1: SETUP SHEET ================= */}
        {phase === 'setup' && (
          <View style={styles.setupContainer}>
            <View style={styles.topNavbar}>
              <Text style={styles.navTitle}>Situation Drill Setup</Text>
              <TouchableOpacity style={styles.closeBtn} onPress={handleCloseAll}>
                <CloseIcon color={colors.ink} size={18} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.setupScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.setupDesc}>
                Board-exam style situation problem sets with multiple connected sub-questions.
              </Text>

              {/* Cluster selector */}
              <View style={styles.setupSection}>
                <Text style={styles.sectionLabel}>Cluster</Text>
                <View style={styles.pillsRow}>
                  {['All', 'PSAD', 'HGE', 'MSTE'].map((cl) => {
                    const isSelected = selectedCluster === cl;
                    return (
                      <TouchableOpacity
                        key={cl}
                        style={[styles.setupPill, isSelected && styles.setupPillActive]}
                        onPress={() => setSelectedCluster(cl)}
                      >
                        <Text style={[styles.setupPillText, isSelected && styles.setupPillTextActive]}>
                          {cl}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Number of Situations */}
              <View style={styles.setupSection}>
                <Text style={styles.sectionLabel}>Situations Count</Text>
                <View style={styles.pillsRow}>
                  {[1, 2].map((cnt) => {
                    const isSelected = situationCount === cnt;
                    return (
                      <TouchableOpacity
                        key={cnt}
                        style={[styles.setupPill, isSelected && styles.setupPillActive]}
                        onPress={() => setSituationCount(cnt)}
                      >
                        <Text style={[styles.setupPillText, isSelected && styles.setupPillTextActive]}>
                          {cnt} Situation{cnt > 1 ? 's' : ''} ({cnt * 3} questions)
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Timer selection */}
              <View style={styles.setupSection}>
                <Text style={styles.sectionLabel}>Timer</Text>
                <View style={styles.pillsRow}>
                  {[
                    { label: '3 min', val: 180 },
                    { label: '5 min', val: 300 },
                    { label: '10 min', val: 600 },
                    { label: 'Untimed', val: 0 },
                  ].map((t) => {
                    const isSelected = timerSeconds === t.val;
                    return (
                      <TouchableOpacity
                        key={t.label}
                        style={[styles.setupPill, isSelected && styles.setupPillActive]}
                        onPress={() => setTimerSeconds(t.val)}
                      >
                        <Text style={[styles.setupPillText, isSelected && styles.setupPillTextActive]}>
                          {t.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Practice Mode / Exam Mode Toggle */}
              <View style={styles.setupSection}>
                <Text style={styles.sectionLabel}>Mode</Text>
                <View style={styles.modeToggleCard}>
                  <TouchableOpacity
                    style={[styles.modeToggleHalf, !isExamMode && styles.modeToggleHalfActive]}
                    onPress={() => setIsExamMode(false)}
                  >
                    <Text style={[styles.modeToggleText, !isExamMode && styles.modeToggleTextActive]}>
                      Practice Mode
                    </Text>
                    <Text style={styles.modeToggleSub}>Formula drawer available</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modeToggleHalf, isExamMode && styles.modeToggleHalfActive]}
                    onPress={() => setIsExamMode(true)}
                  >
                    <Text style={[styles.modeToggleText, isExamMode && styles.modeToggleTextActive]}>
                      Exam Mode
                    </Text>
                    <Text style={styles.modeToggleSub}>No formula drawer</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Start Button */}
              <TouchableOpacity style={styles.startBtn} activeOpacity={0.85} onPress={handleStartDrill}>
                <Text style={styles.startBtnText}>Start Board Drill</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}

        {/* ================= PHASE 2: DRILL EXECUTION ================= */}
        {phase === 'drill' && (
          <View style={styles.drillContainer}>
            {/* Top Bar with Timer and Formula Drawer Trigger */}
            <View style={styles.topNavbar}>
              <View style={styles.timerWrap}>
                <ClockIcon color={colors.roseText} size={16} />
                <Text style={styles.timerText}>
                  {timerSeconds > 0 ? formatSecondsToTimer(timeRemaining) : 'Untimed'}
                </Text>
              </View>

              <View style={styles.navRightWrap}>
                {!isExamMode && (
                  <TouchableOpacity
                    style={[styles.formulaDrawerBtn, wasAssisted && styles.formulaDrawerBtnAssisted]}
                    onPress={handleOpenFormulaDrawer}
                  >
                    <PinIcon color={colors.roseText} size={14} filled={wasAssisted} />
                    <Text style={styles.formulaDrawerBtnText}>
                      {wasAssisted ? 'Formulas (Assisted)' : 'Formulas'}
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.closeBtn} onPress={handleCloseAll}>
                  <CloseIcon color={colors.ink} size={18} strokeWidth={2.5} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Drill Questions Scroll */}
            <ScrollView contentContainerStyle={styles.drillScroll} showsVerticalScrollIndicator={false}>
              {activeSituations.map((sit, sitIdx) => (
                <View key={sit.id} style={styles.situationBlock}>
                  {/* Shared Given Scenario */}
                  <View style={styles.givenBox}>
                    <View style={styles.givenHeader}>
                      <View style={styles.clusterBadge}>
                        <Text style={styles.clusterBadgeText}>{sit.cluster}</Text>
                      </View>
                      <Text style={styles.givenTitle}>SITUATION {sitIdx + 1}: {sit.topic.toUpperCase()}</Text>
                    </View>
                    <Text style={styles.givenText}>{sit.given}</Text>
                  </View>

                  {/* Connected MCQ Questions */}
                  {sit.questions.map((q) => (
                    <View key={q.id} style={styles.questionCard}>
                      <Text style={styles.questionPrompt}>{q.prompt}</Text>
                      <View style={styles.choicesList}>
                        {q.options.map((opt) => {
                          const isSelected = selectedAnswers[q.id] === opt.label;
                          return (
                            <TouchableOpacity
                              key={opt.label}
                              style={[styles.choiceBtn, isSelected && styles.choiceBtnSelected]}
                              activeOpacity={0.8}
                              onPress={() => handleSelectOption(q.id, opt.label)}
                            >
                              <View style={[styles.choiceCircle, isSelected && styles.choiceCircleSelected]}>
                                <Text style={[styles.choiceLetter, isSelected && styles.choiceLetterSelected]}>
                                  {opt.label}
                                </Text>
                              </View>
                              <Text style={[styles.choiceText, isSelected && styles.choiceTextSelected]}>
                                {opt.text}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  ))}
                </View>
              ))}

              {/* Submit Drill Button */}
              <TouchableOpacity style={styles.submitDrillBtn} activeOpacity={0.85} onPress={handleSubmitDrill}>
                <Text style={styles.submitDrillBtnText}>Submit Answers & Review</Text>
              </TouchableOpacity>
            </ScrollView>

            {/* Formula Drawer (in Practice Mode) */}
            {formulaDrawerOpen && (
              <Modal
                transparent
                visible={formulaDrawerOpen}
                animationType="slide"
                onRequestClose={() => setFormulaDrawerOpen(false)}
              >
                <View style={styles.drawerOverlay}>
                  <TouchableOpacity
                    style={styles.drawerBackdrop}
                    activeOpacity={1}
                    onPress={() => setFormulaDrawerOpen(false)}
                  />
                  <View style={styles.drawerCard}>
                    <View style={styles.drawerHeader}>
                      <View>
                        <Text style={styles.drawerTitle}>
                          Topic Formulas ({currentTopicTemplate?.topic || 'Practice'})
                        </Text>
                        <Text style={styles.drawerSub}>Opening formulas marks drill as assisted</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.closeBtn}
                        onPress={() => setFormulaDrawerOpen(false)}
                      >
                        <CloseIcon color={colors.muted} size={16} />
                      </TouchableOpacity>
                    </View>

                    <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
                      {templateFormulas.map((f) => (
                        <View key={f.id} style={styles.drawerFormulaItem}>
                          <Text style={styles.drawerFormulaPlainText}>{f.formula}</Text>
                          <Text style={styles.drawerFormulaLabel}>
                            {f.label} ({f.unit})
                          </Text>
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                </View>
              </Modal>
            )}
          </View>
        )}

        {/* ================= PHASE 3: SOLUTION REVIEW SCREEN ================= */}
        {phase === 'review' && (
          <View style={styles.reviewContainer}>
            <View style={styles.topNavbar}>
              <Text style={styles.navTitle}>Solution Review</Text>
              <TouchableOpacity style={styles.closeBtn} onPress={handleCloseAll}>
                <CloseIcon color={colors.ink} size={18} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.reviewScroll} showsVerticalScrollIndicator={false}>
              {/* Assisted status notice */}
              <View style={[styles.assistedNotice, wasAssisted && styles.assistedNoticeActive]}>
                <AlertCircleIcon color={wasAssisted ? colors.roseText : '#059669'} size={16} />
                <Text style={[styles.assistedNoticeText, wasAssisted && { color: colors.roseText }]}>
                  {wasAssisted
                    ? 'Formula drawer was opened during this drill (marked assisted).'
                    : 'Unassisted solve! Counted toward your daily goal.'}
                </Text>
              </View>

              {/* All math solutions rendered in ONE single WebView */}
              <View style={styles.singleWebviewContainer}>
                <WebView
                  originWhitelist={['*']}
                  source={{ html: reviewKaTexHtml }}
                  style={styles.reviewWebview}
                  scrollEnabled={false}
                />
              </View>

              {/* Step-by-step text solutions & Review Source links */}
              {activeSituations.map((sit) => (
                <View key={sit.id} style={styles.reviewStepsCard}>
                  <Text style={styles.reviewStepsTitle}>Explanation & Sources</Text>
                  {sit.questions.map((q, idx) => (
                    <View key={q.id} style={styles.reviewQuestionBlock}>
                      <Text style={styles.reviewQuestionHeading}>
                        Q{idx + 1} Method:
                      </Text>
                      {q.solutionSteps.map((step, sIdx) => (
                        <Text key={sIdx} style={styles.reviewStepLine}>
                          • {step}
                        </Text>
                      ))}

                      {/* Review source link */}
                      {sit.relatedSourceId && onOpenSource && (
                        <TouchableOpacity
                          style={styles.reviewSourceLink}
                          onPress={() => onOpenSource(sit.relatedSourceId!)}
                        >
                          <BookOpenIcon color={colors.roseText} size={13} />
                          <Text style={styles.reviewSourceText}>Review related Study source →</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </View>
              ))}

              <TouchableOpacity style={styles.doneReviewBtn} onPress={handleCloseAll}>
                <Text style={styles.doneReviewBtnText}>Finish Review</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  setupContainer: {
    flex: 1,
  },
  drillContainer: {
    flex: 1,
  },
  reviewContainer: {
    flex: 1,
  },
  topNavbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPaddingHorizontal,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.pinkLine,
    backgroundColor: colors.surface,
  },
  navTitle: {
    fontSize: 16,
    fontFamily: typography.fontFamily.bold,
    color: colors.ink,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.pinkLine,
  },
  setupScroll: {
    padding: spacing.screenPaddingHorizontal,
    gap: 16,
    paddingBottom: 30,
  },
  setupDesc: {
    fontSize: 13,
    fontFamily: typography.fontFamily.regular,
    color: colors.muted,
    lineHeight: 18,
  },
  setupSection: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 13,
    fontFamily: typography.fontFamily.bold,
    color: colors.ink,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  setupPill: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radii.chip,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.pinkLine,
  },
  setupPillActive: {
    backgroundColor: colors.pinkSoft,
    borderColor: colors.rose,
  },
  setupPillText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.medium,
    color: colors.muted,
  },
  setupPillTextActive: {
    color: colors.roseText,
    fontFamily: typography.fontFamily.bold,
  },
  modeToggleCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radii.cardSmall,
    borderWidth: 1,
    borderColor: colors.pinkLine,
    overflow: 'hidden',
  },
  modeToggleHalf: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    gap: 2,
  },
  modeToggleHalfActive: {
    backgroundColor: colors.pinkSoft,
  },
  modeToggleText: {
    fontSize: 13,
    fontFamily: typography.fontFamily.bold,
    color: colors.muted,
  },
  modeToggleTextActive: {
    color: colors.roseText,
  },
  modeToggleSub: {
    fontSize: 10,
    fontFamily: typography.fontFamily.regular,
    color: colors.muted,
  },
  startBtn: {
    backgroundColor: colors.rose,
    borderRadius: radii.button,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  startBtnText: {
    color: '#FFFFFF',
    fontFamily: typography.fontFamily.bold,
    fontSize: 15,
  },
  timerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.pinkSoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  timerText: {
    fontSize: 13,
    fontFamily: typography.fontFamily.monoMedium,
    color: colors.roseText,
  },
  navRightWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  formulaDrawerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.chip,
    backgroundColor: colors.pinkSoft,
    borderWidth: 1,
    borderColor: colors.pinkLine,
  },
  formulaDrawerBtnAssisted: {
    backgroundColor: '#FFE4E6',
    borderColor: colors.rose,
  },
  formulaDrawerBtnText: {
    fontSize: 11,
    fontFamily: typography.fontFamily.bold,
    color: colors.roseText,
  },
  drillScroll: {
    padding: spacing.screenPaddingHorizontal,
    gap: 16,
    paddingBottom: 30,
  },
  situationBlock: {
    gap: 12,
  },
  givenBox: {
    backgroundColor: colors.surface,
    borderRadius: radii.cardSmall,
    borderWidth: 1,
    borderColor: colors.pinkLine,
    padding: 14,
    gap: 8,
  },
  givenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clusterBadge: {
    backgroundColor: colors.pinkSoft,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  clusterBadgeText: {
    fontSize: 10,
    fontFamily: typography.fontFamily.bold,
    color: colors.roseText,
  },
  givenTitle: {
    fontSize: 11,
    fontFamily: typography.fontFamily.bold,
    color: colors.muted,
    letterSpacing: 0.6,
  },
  givenText: {
    fontSize: 14,
    fontFamily: typography.fontFamily.regular,
    color: colors.ink,
    lineHeight: 20,
  },
  questionCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.cardSmall,
    borderWidth: 1,
    borderColor: colors.pinkLine,
    padding: 14,
    gap: 10,
  },
  questionPrompt: {
    fontSize: 14,
    fontFamily: typography.fontFamily.bold,
    color: colors.ink,
    lineHeight: 20,
  },
  choicesList: {
    gap: 8,
  },
  choiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.pinkLine,
    backgroundColor: colors.bg,
    gap: 10,
  },
  choiceBtnSelected: {
    backgroundColor: colors.pinkSoft,
    borderColor: colors.rose,
  },
  choiceCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.pinkLine,
  },
  choiceCircleSelected: {
    backgroundColor: colors.rose,
    borderColor: colors.rose,
  },
  choiceLetter: {
    fontSize: 12,
    fontFamily: typography.fontFamily.bold,
    color: colors.muted,
  },
  choiceLetterSelected: {
    color: '#FFFFFF',
  },
  choiceText: {
    fontSize: 13,
    fontFamily: typography.fontFamily.medium,
    color: colors.ink,
    flex: 1,
  },
  choiceTextSelected: {
    color: colors.roseText,
    fontFamily: typography.fontFamily.bold,
  },
  submitDrillBtn: {
    backgroundColor: colors.rose,
    borderRadius: radii.button,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  submitDrillBtnText: {
    color: '#FFFFFF',
    fontFamily: typography.fontFamily.bold,
    fontSize: 15,
  },
  drawerOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(58, 37, 48, 0.45)',
  },
  drawerBackdrop: {
    flex: 1,
  },
  drawerCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: 400,
    gap: 12,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  drawerTitle: {
    fontSize: 16,
    fontFamily: typography.fontFamily.bold,
    color: colors.ink,
  },
  drawerSub: {
    fontSize: 11,
    fontFamily: typography.fontFamily.regular,
    color: colors.roseText,
  },
  drawerFormulaItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.pinkLine,
    gap: 2,
  },
  drawerFormulaPlainText: {
    fontSize: 13,
    fontFamily: typography.fontFamily.monoMedium,
    color: colors.ink,
  },
  drawerFormulaLabel: {
    fontSize: 11,
    fontFamily: typography.fontFamily.regular,
    color: colors.muted,
  },
  reviewScroll: {
    padding: spacing.screenPaddingHorizontal,
    gap: 14,
    paddingBottom: 30,
  },
  assistedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ECFDF5',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  assistedNoticeActive: {
    backgroundColor: '#FFF1F2',
    borderColor: '#FECDD3',
  },
  assistedNoticeText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.medium,
    color: '#065F46',
    flex: 1,
  },
  singleWebviewContainer: {
    borderRadius: radii.cardSmall,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.pinkLine,
    backgroundColor: colors.bg,
    minHeight: 380,
  },
  reviewWebview: {
    height: 480,
    backgroundColor: 'transparent',
  },
  reviewStepsCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.cardSmall,
    borderWidth: 1,
    borderColor: colors.pinkLine,
    padding: 14,
    gap: 10,
  },
  reviewStepsTitle: {
    fontSize: 14,
    fontFamily: typography.fontFamily.bold,
    color: colors.ink,
  },
  reviewQuestionBlock: {
    gap: 4,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.pinkLine,
  },
  reviewQuestionHeading: {
    fontSize: 12,
    fontFamily: typography.fontFamily.bold,
    color: colors.roseText,
  },
  reviewStepLine: {
    fontSize: 12,
    fontFamily: typography.fontFamily.regular,
    color: colors.ink,
    lineHeight: 18,
  },
  reviewSourceLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  reviewSourceText: {
    fontSize: 11,
    fontFamily: typography.fontFamily.bold,
    color: colors.roseText,
  },
  doneReviewBtn: {
    backgroundColor: colors.rose,
    borderRadius: radii.button,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  doneReviewBtnText: {
    color: '#FFFFFF',
    fontFamily: typography.fontFamily.bold,
    fontSize: 15,
  },
});

