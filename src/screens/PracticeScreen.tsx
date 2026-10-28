import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { TabScreenProps } from '../navigation/types';
import { colors, typography, radii, spacing } from '../theme';
import {
  CardsIcon,
  RefreshIcon,
  ClockIcon,
  CheckIcon,
  AlertCircleIcon,
  ChevronRightIcon,
  PlusIcon,
  PracticeIcon,
} from '../components/Icons';
import { usePractice } from '../hooks/usePractice';
import { ClusterTopic, Cluster, TemplateDifficulty } from '../types';
import { FlashcardPlayerModal } from '../components/FlashcardPlayerModal';
import { SituationDrillModal } from '../components/SituationDrillModal';
import { ErrorLogModal } from '../components/ErrorLogModal';
import { CustomSetModal } from '../components/CustomSetModal';
import { GoalEditModal } from '../components/GoalEditModal';

export const PracticeScreen: React.FC<TabScreenProps<'Practice'>> = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  const {
    cluster,
    setCluster,
    dailyGoalData,
    updateDailyGoal,
    topics,
    dueFlashcards,
    dueFlashcardsCount,
    situations,
    errorLog,
    errorLogCount,
    rateFlashcard,
    recordAttemptOutcome,
    loading,
  } = usePractice('All');

  // Modals
  const [showFlashcards, setShowFlashcards] = useState(false);
  const [showDrill, setShowDrill] = useState(false);
  const [showErrorLog, setShowErrorLog] = useState(false);
  const [showCustomSet, setShowCustomSet] = useState(false);
  const [showGoalEdit, setShowGoalEdit] = useState(false);

  // Collapsible cluster states (by default all open)
  const [collapsedClusters, setCollapsedClusters] = useState<Record<string, boolean>>({});

  const toggleClusterCollapse = (cl: string) => {
    setCollapsedClusters((prev) => ({
      ...prev,
      [cl]: !prev[cl],
    }));
  };

  const filterChips = ['All', 'MSTE', 'HGE', 'PSAD'] as const;

  // Group topics by cluster
  const topicsByCluster = useMemo(() => {
    const map: Record<string, ClusterTopic[]> = {};
    topics.forEach((t) => {
      if (!map[t.cluster]) map[t.cluster] = [];
      map[t.cluster].push(t);
    });
    return map;
  }, [topics]);

  const clusterKeys = Object.keys(topicsByCluster);

  // Daily goal progress percent
  const goalProgressPct = Math.min(
    100,
    Math.round((dailyGoalData.solvedToday / dailyGoalData.goal) * 100)
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Practice</Text>
          <Text style={styles.headerSub}>Recalls, drills, and board situation sets</Text>
        </View>

        {/* 2. Daily Goal Card (Tappable to edit) */}
        <TouchableOpacity
          style={styles.dailyGoalCard}
          activeOpacity={0.8}
          onPress={() => setShowGoalEdit(true)}
        >
          <View style={styles.goalTopRow}>
            <View style={styles.goalInfo}>
              <Text style={styles.goalBadgeLabel}>DAILY RETENTION GOAL</Text>
              <Text style={styles.goalMainText}>
                <Text style={styles.goalSolvedNumber}>{dailyGoalData.solvedToday}</Text> / {dailyGoalData.goal} solved without hints today
              </Text>
            </View>
            <View style={styles.streakBadge}>
              <Text style={styles.streakIconText}>🔥</Text>
              <Text style={styles.streakText}>{dailyGoalData.streakDays}d streak</Text>
            </View>
          </View>

          {/* Goal progress bar */}
          <View style={styles.goalProgressBg}>
            <View
              style={[
                styles.goalProgressFill,
                { width: `${goalProgressPct}%`, backgroundColor: colors.rose },
              ]}
            />
          </View>
          <Text style={styles.goalTapHint}>Tap to adjust target goal</Text>
        </TouchableOpacity>

        {/* 3. Cluster Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {filterChips.map((chip) => {
            const isSelected = cluster === chip;
            return (
              <TouchableOpacity
                key={chip}
                style={[styles.filterChip, isSelected && styles.filterChipActive]}
                onPress={() => setCluster(chip)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isSelected && styles.filterChipTextActive,
                  ]}
                >
                  {chip}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Loading state */}
        {loading && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={colors.rose} />
            <Text style={styles.loadingText}>Loading practice topics...</Text>
          </View>
        )}

        {/* 4. Three Mode Cards */}
        <View style={styles.modesContainer}>
          {/* Row of 2: Flashcards & Error Log */}
          <View style={styles.modesRow}>
            {/* Flashcards Card */}
            <TouchableOpacity
              style={styles.modeCardHalf}
              activeOpacity={0.8}
              onPress={() => setShowFlashcards(true)}
            >
              <View style={[styles.modeIconCircle, { backgroundColor: '#F3E8FF' }]}>
                <CardsIcon color="#7C3AED" size={20} />
              </View>
              <Text style={styles.modeCardTitle}>Flashcards</Text>
              <Text style={styles.modeCardBadge}>
                {dueFlashcardsCount} due
              </Text>
              <Text style={styles.modeCardDesc}>SM-2 spaced recall</Text>
            </TouchableOpacity>

            {/* Error Log Card */}
            <TouchableOpacity
              style={styles.modeCardHalf}
              activeOpacity={0.8}
              onPress={() => setShowErrorLog(true)}
            >
              <View style={[styles.modeIconCircle, { backgroundColor: '#FEE2E2' }]}>
                <AlertCircleIcon color="#DC2626" size={20} />
              </View>
              <Text style={styles.modeCardTitle}>Error Log</Text>
              <Text style={[styles.modeCardBadge, { color: '#DC2626' }]}>
                {errorLogCount} to rework
              </Text>
              <Text style={styles.modeCardDesc}>2-day mastery rule</Text>
            </TouchableOpacity>
          </View>

          {/* Full-width: Situation Drill Card */}
          <TouchableOpacity
            style={styles.modeCardFull}
            activeOpacity={0.8}
            onPress={() => setShowDrill(true)}
          >
            <View style={[styles.modeIconCircle, { backgroundColor: colors.pinkSoft }]}>
              <PracticeIcon color={colors.roseText} size={22} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <View style={styles.situationTitleRow}>
                <Text style={styles.modeCardTitle}>Situation Drill</Text>
                <View style={styles.drillCountPill}>
                  <Text style={styles.drillCountPillText}>
                    {situations.length} available
                  </Text>
                </View>
              </View>
              <Text style={styles.modeCardDesc}>
                Board-style connected MCQs with givens & timer
              </Text>
            </View>
            <ChevronRightIcon color={colors.chevron} size={18} />
          </TouchableOpacity>
        </View>

        {/* 5. By Cluster (Collapsible Sections) */}
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>By Board Cluster</Text>

          {clusterKeys.map((clusterKey) => {
            const topicList = topicsByCluster[clusterKey] || [];
            const isCollapsed = collapsedClusters[clusterKey];

            return (
              <View key={clusterKey} style={styles.clusterAccordion}>
                {/* Accordion Header */}
                <TouchableOpacity
                  style={styles.accordionHeader}
                  activeOpacity={0.7}
                  onPress={() => toggleClusterCollapse(clusterKey)}
                >
                  <View style={styles.clusterBadge}>
                    <Text style={styles.clusterBadgeText}>{clusterKey}</Text>
                  </View>
                  <Text style={styles.accordionTitle}>
                    {clusterKey === 'PSAD'
                      ? 'Structural Analysis & Design'
                      : clusterKey === 'HGE'
                      ? 'Hydraulics & Geotechnical'
                      : 'Mathematics & Surveying'}
                  </Text>
                  <Text style={styles.accordionCount}>
                    {topicList.length} topic{topicList.length > 1 ? 's' : ''}
                  </Text>
                </TouchableOpacity>

                {/* Topics Rows */}
                {!isCollapsed && (
                  <View style={styles.topicsList}>
                    {topicList.map((top) => {
                      const hasTemplate = !!top.templateId;
                      const accuracyText =
                        top.attemptsCount < 5
                          ? '—'
                          : `${top.unassistedAccuracyPct}% · ${top.attemptsCount} attempts`;

                      return (
                        <View key={top.id} style={styles.topicRow}>
                          <View style={styles.topicInfo}>
                            <Text style={styles.topicName}>{top.name}</Text>
                            <Text style={styles.topicAccuracy}>
                              Unassisted: {accuracyText}
                            </Text>
                          </View>

                          {hasTemplate ? (
                            <TouchableOpacity
                              style={styles.solveBtn}
                              activeOpacity={0.8}
                              onPress={() =>
                                navigation.navigate('Solve', {
                                  templateId: top.templateId!,
                                  title: top.name,
                                })
                              }
                            >
                              <Text style={styles.solveBtnText}>Solve</Text>
                            </TouchableOpacity>
                          ) : (
                            <View style={styles.comingSoonPill}>
                              <Text style={styles.comingSoonText}>Coming soon</Text>
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* 6. Custom Set Button */}
        <TouchableOpacity
          style={styles.customSetBtn}
          activeOpacity={0.85}
          onPress={() => setShowCustomSet(true)}
        >
          <View style={styles.customSetIconCircle}>
            <PlusIcon color={colors.roseText} size={16} strokeWidth={2.8} />
          </View>
          <Text style={styles.customSetBtnText}>+ Create practice set</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Flashcard Player Modal */}
      <FlashcardPlayerModal
        visible={showFlashcards}
        flashcards={dueFlashcards}
        onClose={() => setShowFlashcards(false)}
        onRateCard={rateFlashcard}
      />

      {/* Situation Drill Modal */}
      <SituationDrillModal
        visible={showDrill}
        situations={situations}
        onClose={() => setShowDrill(false)}
        onRecordAttempt={(sitId, sitCluster, title, isCorrect, isAssisted, mistakeType) =>
          recordAttemptOutcome(
            sitId,
            'situation',
            sitCluster,
            title,
            isCorrect,
            isAssisted,
            mistakeType
          )
        }
        onOpenSource={() => {
          setShowDrill(false);
          navigation.navigate('Study');
        }}
      />

      {/* Error Log Modal */}
      <ErrorLogModal
        visible={showErrorLog}
        errorLog={errorLog}
        onClose={() => setShowErrorLog(false)}
        onReworkAll={() => {
          setShowErrorLog(false);
          setShowDrill(true);
        }}
      />

      {/* Custom Set Setup Modal */}
      <CustomSetModal
        visible={showCustomSet}
        topics={topics}
        onClose={() => setShowCustomSet(false)}
        onStartCustomSet={() => {
          setShowDrill(true);
        }}
      />

      {/* Goal Edit Modal */}
      <GoalEditModal
        visible={showGoalEdit}
        currentGoal={dailyGoalData.goal}
        onClose={() => setShowGoalEdit(false)}
        onSaveGoal={updateDailyGoal}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollContent: {
    paddingHorizontal: spacing.screenPaddingHorizontal,
    paddingBottom: 32,
    gap: spacing.sectionGap,
  },
  header: {
    marginTop: 4,
  },
  headerTitle: {
    fontSize: typography.sizes.screenTitle,
    fontFamily: typography.fontFamily.bold,
    color: colors.ink,
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: typography.sizes.body,
    color: colors.muted,
    fontFamily: typography.fontFamily.regular,
    marginTop: 2,
  },
  dailyGoalCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.pinkLine,
    borderRadius: radii.card,
    padding: 14,
    gap: 10,
  },
  goalTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalInfo: {
    gap: 3,
    flex: 1,
  },
  goalBadgeLabel: {
    fontSize: 10,
    fontFamily: typography.fontFamily.bold,
    color: colors.roseText,
    letterSpacing: 0.8,
  },
  goalMainText: {
    fontSize: 14,
    fontFamily: typography.fontFamily.medium,
    color: colors.ink,
  },
  goalSolvedNumber: {
    fontSize: 17,
    fontFamily: typography.fontFamily.bold,
    color: colors.roseText,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.pinkSoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  streakIconText: {
    fontSize: 12,
  },
  streakText: {
    fontSize: 11,
    fontFamily: typography.fontFamily.bold,
    color: colors.roseText,
  },
  goalProgressBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.pinkTrack,
    overflow: 'hidden',
  },
  goalProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  goalTapHint: {
    fontSize: 10,
    fontFamily: typography.fontFamily.regular,
    color: colors.muted,
    textAlign: 'right',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: radii.chip,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.pinkLine,
  },
  filterChipActive: {
    backgroundColor: colors.pinkSoft,
    borderColor: colors.rose,
  },
  filterChipText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.medium,
    color: colors.muted,
  },
  filterChipTextActive: {
    color: colors.roseText,
    fontFamily: typography.fontFamily.bold,
  },
  loadingBox: {
    padding: 16,
    alignItems: 'center',
    gap: 6,
  },
  loadingText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.regular,
    color: colors.muted,
  },
  modesContainer: {
    gap: 10,
  },
  modesRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modeCardHalf: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.cardSmall,
    borderWidth: 1,
    borderColor: colors.pinkLine,
    padding: 14,
    gap: 4,
  },
  modeIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  modeCardTitle: {
    fontSize: 14,
    fontFamily: typography.fontFamily.bold,
    color: colors.ink,
  },
  modeCardBadge: {
    fontSize: 12,
    fontFamily: typography.fontFamily.bold,
    color: '#7C3AED',
  },
  modeCardDesc: {
    fontSize: 11,
    fontFamily: typography.fontFamily.regular,
    color: colors.muted,
    lineHeight: 15,
  },
  modeCardFull: {
    backgroundColor: colors.surface,
    borderRadius: radii.cardSmall,
    borderWidth: 1,
    borderColor: colors.pinkLine,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  situationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  drillCountPill: {
    backgroundColor: colors.pinkSoft,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  drillCountPillText: {
    fontSize: 10,
    fontFamily: typography.fontFamily.bold,
    color: colors.roseText,
  },
  section: {
    gap: 10,
  },
  sectionHeading: {
    fontSize: typography.sizes.sectionHeading,
    fontFamily: typography.fontFamily.bold,
    color: colors.ink,
  },
  clusterAccordion: {
    backgroundColor: colors.surface,
    borderRadius: radii.cardSmall,
    borderWidth: 1,
    borderColor: colors.pinkLine,
    overflow: 'hidden',
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
    backgroundColor: colors.surface,
  },
  clusterBadge: {
    backgroundColor: colors.pinkSoft,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  clusterBadgeText: {
    fontSize: 10,
    fontFamily: typography.fontFamily.bold,
    color: colors.roseText,
  },
  accordionTitle: {
    flex: 1,
    fontSize: 13,
    fontFamily: typography.fontFamily.bold,
    color: colors.ink,
  },
  accordionCount: {
    fontSize: 11,
    fontFamily: typography.fontFamily.regular,
    color: colors.muted,
  },
  topicsList: {
    borderTopWidth: 1,
    borderTopColor: colors.pinkLine,
  },
  topicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.bg,
    gap: 8,
  },
  topicInfo: {
    flex: 1,
    gap: 2,
  },
  topicName: {
    fontSize: 13,
    fontFamily: typography.fontFamily.medium,
    color: colors.ink,
  },
  topicAccuracy: {
    fontSize: 11,
    fontFamily: typography.fontFamily.regular,
    color: colors.muted,
  },
  solveBtn: {
    backgroundColor: colors.rose,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: radii.chip,
  },
  solveBtnText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.bold,
    color: '#FFFFFF',
  },
  comingSoonPill: {
    backgroundColor: colors.bg,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radii.chip,
    borderWidth: 1,
    borderColor: colors.pinkLine,
  },
  comingSoonText: {
    fontSize: 11,
    fontFamily: typography.fontFamily.medium,
    color: colors.muted,
  },
  customSetBtn: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.pinkAccent,
    borderRadius: radii.cardSmall,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  customSetIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.pinkSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customSetBtnText: {
    fontSize: 13,
    fontFamily: typography.fontFamily.bold,
    color: colors.roseText,
  },
});
