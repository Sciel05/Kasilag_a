import React, { useMemo } from 'react';
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
  ChevronRightIcon,
  RefreshIcon,
  PracticeIcon,
  ClockIcon,
  CheckIcon,
} from '../components/Icons';
import { DaySheetModal } from '../components/DaySheetModal';
import { usePlans } from '../hooks/usePlans';
import { Plan } from '../types';
import {
  formatHeaderDate,
  formatFullDate,
  getWeekDaysForDate,
  parseISODate,
} from '../utils/date';

export const HomeScreen: React.FC<TabScreenProps<'Home'>> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [sheetVisible, setSheetVisible] = React.useState(false);

  const {
    todayDate,
    selectedDate,
    selectDate,
    plans,
    allPlans,
    deadline,
    typeColors,
    loading,
    togglePlan,
    addPlan,
    deletePlan,
    updateTypeColor,
    getTypeTheme,
    getDayDots,
    reassignSubject,
    getSubjectPlanCount,
  } = usePlans();

  // Current Mon-Sun week containing today
  const weekDays = useMemo(() => {
    return getWeekDaysForDate(parseISODate(todayDate));
  }, [todayDate]);

  const currentDayInfo =
    weekDays.find((d) => d.date === selectedDate) || {
      w: '—',
      n: '',
      date: selectedDate,
      full: formatFullDate(selectedDate),
    };

  const headerMonthText = useMemo(() => {
    const d = parseISODate(todayDate);
    return d.toLocaleString('en-US', { month: 'long' });
  }, [todayDate]);

  const renderTaskIcon = (plan: Plan) => {
    const planTheme = getTypeTheme(plan.type);

    if (plan.completed) {
      return (
        <View style={[styles.taskIconBg, { backgroundColor: colors.pinkSoft }]}>
          <CheckIcon color={colors.roseText} size={18} strokeWidth={3} />
        </View>
      );
    }
    if (plan.linkRoute === 'Solve') {
      return (
        <View style={[styles.taskIconBg, { backgroundColor: planTheme.bg }]}>
          <PracticeIcon color={planTheme.dot} size={20} />
        </View>
      );
    }
    if (plan.type === 'exam' || plan.type === 'deadline') {
      return (
        <View style={[styles.taskIconBg, { backgroundColor: planTheme.bg }]}>
          <ClockIcon color={planTheme.dot} size={20} />
        </View>
      );
    }
    return (
      <View style={[styles.taskIconBg, { backgroundColor: planTheme.bg }]}>
        <RefreshIcon color={planTheme.dot} size={20} />
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header - Real device today date */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerDate}>{formatHeaderDate(parseISODate(todayDate))}</Text>
            <Text style={styles.headerTitle}>Hi, Student</Text>
          </View>
          <TouchableOpacity
            style={styles.avatarButton}
            activeOpacity={0.8}
            accessibilityLabel="Profile"
          >
            <Text style={styles.avatarText}>K</Text>
          </TouchableOpacity>
        </View>

        {/* Nearest Deadline Card (dynamic: hidden if no upcoming deadline) */}
        {deadline && (
          <View style={styles.deadlineContainer}>
            <View style={styles.deadlineInfo}>
              <Text style={styles.deadlineSub}>NEAREST DEADLINE</Text>
              <Text style={styles.deadlineTitle}>{deadline.title}</Text>
              <Text style={styles.deadlineMeta}>{deadline.timeText}</Text>
              <Text style={styles.deadlineCourse}>{deadline.courseName}</Text>
            </View>
            <View style={styles.countdownRing}>
              <Text style={styles.countdownNumber}>{deadline.daysLeft}</Text>
              <Text style={styles.countdownUnit}>
                {deadline.daysLeft === 1 ? 'day' : 'days'}
              </Text>
            </View>
          </View>
        )}

        {/* Interactive Week Strip (Current Mon–Sun week) */}
        <View style={styles.weekCard}>
          <View style={styles.weekHeader}>
            <View>
              <Text style={styles.sectionHeading}>{headerMonthText}</Text>
              <Text style={styles.weekHelpText}>Tap a day to view plans</Text>
            </View>
            <TouchableOpacity
              style={styles.adjustScheduleBtn}
              activeOpacity={0.8}
              onPress={() => setSheetVisible(true)}
              accessibilityLabel="Open schedule modal"
            >
              <Text style={styles.adjustScheduleText}>+ Adjust plans</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.daysRow}>
            {weekDays.map((d) => {
              const isSelected = d.date === selectedDate;
              const isToday = d.date === todayDate;
              const dayDots = getDayDots(d.date);

              return (
                <TouchableOpacity
                  key={d.date}
                  style={[
                    styles.dayItem,
                    isSelected && styles.dayItemToday,
                    isToday && !isSelected && styles.dayItemCurrentToday,
                  ]}
                  activeOpacity={0.7}
                  onPress={() => {
                    if (isSelected) {
                      setSheetVisible(true);
                    } else {
                      selectDate(d.date);
                    }
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Select ${d.full}`}
                >
                  <Text
                    style={[
                      styles.dayWeekday,
                      isSelected && styles.dayWeekdayToday,
                    ]}
                  >
                    {d.w}
                  </Text>
                  <Text
                    style={[
                      styles.dayNumber,
                      isSelected && styles.dayNumberToday,
                    ]}
                  >
                    {d.n}
                  </Text>

                  {/* Day Dots Row (up to 3 colored dots based on custom type colors) */}
                  <View style={styles.dayDotsContainer}>
                    {dayDots.length === 0 ? (
                      <View style={[styles.dayDot, { backgroundColor: 'transparent' }]} />
                    ) : (
                      dayDots.map((dot, idx) => (
                        <View
                          key={`${dot.key}-${idx}`}
                          style={[styles.dayDot, { backgroundColor: dot.color }]}
                        />
                      ))
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Dynamic Theme Color Legend */}
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendDot, { backgroundColor: getTypeTheme('exam').dot }]}
              />
              <Text style={styles.legendText}>Quiz/exam</Text>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendDot, { backgroundColor: getTypeTheme('study').dot }]}
              />
              <Text style={styles.legendText}>Study</Text>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendDot, { backgroundColor: getTypeTheme('deadline').dot }]}
              />
              <Text style={styles.legendText}>Deadline</Text>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendDot, { backgroundColor: getTypeTheme('other').dot }]}
              />
              <Text style={styles.legendText}>Other</Text>
            </View>
          </View>
        </View>

        {/* Tasks Section for Selected Day */}
        <View style={styles.todaySection}>
          <View style={styles.todayHeader}>
            <Text style={styles.sectionHeading}>
              {selectedDate === todayDate ? 'Today' : currentDayInfo.full}
            </Text>
            <Text style={styles.todayEst}>
              {plans.length > 0 ? `${plans.length} task${plans.length > 1 ? 's' : ''}` : 'No tasks'}
            </Text>
          </View>

          {/* Loading State */}
          {loading && (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color={colors.rose} />
              <Text style={styles.loadingText}>Loading day plans...</Text>
            </View>
          )}

          {/* Empty State */}
          {!loading && plans.length === 0 && (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Nothing scheduled</Text>
              <Text style={styles.emptySubtitle}>
                No tasks or exams planned for {currentDayInfo.full}.
              </Text>
            </View>
          )}

          {/* Dynamic Interactive Task List */}
          {!loading &&
            plans.map((plan) => {
              const isSolve = plan.linkRoute === 'Solve';
              const planTheme = getTypeTheme(plan.type);

              return (
                <View
                  key={plan.id}
                  style={[
                    styles.taskCard,
                    isSolve && styles.taskCardFeatured,
                    plan.completed && styles.taskCardCompleted,
                  ]}
                >
                  {/* Task Content / Navigation trigger */}
                  <TouchableOpacity
                    style={styles.taskTouchArea}
                    activeOpacity={0.7}
                    onPress={() => {
                      if (plan.linkRoute === 'Solve') {
                        navigation.navigate('Solve', {
                          templateId: plan.templateId || 'torsion_hollow',
                          title: plan.title,
                        });
                      } else if (plan.linkRoute === 'Practice') {
                        navigation.navigate('Practice');
                      } else {
                        // Tapping the card toggles completion
                        togglePlan(plan.id);
                      }
                    }}
                  >
                    {renderTaskIcon(plan)}
                    <View style={styles.taskContent}>
                      <Text
                        style={[
                          styles.taskTitle,
                          plan.completed && styles.taskTitleCompleted,
                        ]}
                      >
                        {plan.title}
                      </Text>
                      {plan.subtitle && (
                        <Text
                          style={[
                            styles.taskSub,
                            plan.completed && styles.taskSubCompleted,
                          ]}
                        >
                          {plan.subtitle}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>

                  {/* Complete Checkbox Button */}
                  <TouchableOpacity
                    style={[
                      styles.checkboxTouch,
                      plan.completed && styles.checkboxTouchActive,
                    ]}
                    activeOpacity={0.8}
                    onPress={() => togglePlan(plan.id)}
                    accessibilityLabel={plan.completed ? 'Mark incomplete' : 'Mark completed'}
                  >
                    {plan.completed ? (
                      <CheckIcon color="#FFFFFF" size={14} strokeWidth={3} />
                    ) : (
                      <View style={styles.checkboxEmpty} />
                    )}
                  </TouchableOpacity>
                </View>
              );
            })}
        </View>
      </ScrollView>

      {/* Day Plans Bottom Sheet Modal */}
      <DaySheetModal
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        selectedDate={selectedDate}
        onSelectDate={selectDate}
        plans={plans}
        allPlans={allPlans}
        todayDate={todayDate}
        onAddPlan={addPlan}
        onDeletePlan={deletePlan}
        getTypeTheme={getTypeTheme}
        typeColors={typeColors}
        onUpdateTypeColor={updateTypeColor}
        reassignSubject={reassignSubject}
        getSubjectPlanCount={getSubjectPlanCount}
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
    paddingBottom: 24,
    gap: spacing.sectionGap,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  headerDate: {
    fontSize: typography.sizes.meta,
    color: colors.muted,
    fontFamily: typography.fontFamily.medium,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: typography.sizes.screenTitle,
    fontFamily: typography.fontFamily.bold,
    color: colors.ink,
    letterSpacing: -0.3,
  },
  avatarButton: {
    width: spacing.minTouchTarget,
    height: spacing.minTouchTarget,
    borderRadius: radii.round,
    backgroundColor: colors.pinkSoft,
    borderWidth: 1,
    borderColor: colors.pinkLine,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontFamily: typography.fontFamily.bold,
    color: colors.roseText,
  },
  deadlineContainer: {
    backgroundColor: colors.pinkSoft,
    borderWidth: 1,
    borderColor: colors.pinkLine,
    borderRadius: radii.cardLarge,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  deadlineInfo: {
    flex: 1,
    gap: 3,
  },
  deadlineSub: {
    fontSize: 11,
    fontFamily: typography.fontFamily.bold,
    color: colors.roseText,
    letterSpacing: 0.8,
  },
  deadlineTitle: {
    fontSize: 20,
    fontFamily: typography.fontFamily.bold,
    color: colors.ink,
  },
  deadlineMeta: {
    fontSize: typography.sizes.meta,
    color: colors.muted,
    fontFamily: typography.fontFamily.regular,
  },
  deadlineCourse: {
    fontSize: typography.sizes.meta,
    color: colors.muted,
    fontFamily: typography.fontFamily.regular,
  },
  countdownRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.surface,
    borderWidth: 3,
    borderColor: colors.pinkAccent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownNumber: {
    fontFamily: typography.fontFamily.monoMedium,
    fontSize: 28,
    color: colors.roseText,
    lineHeight: 30,
  },
  countdownUnit: {
    fontSize: 11,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.muted,
  },
  weekCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.pinkLine,
    borderRadius: radii.card,
    padding: 14,
    gap: 12,
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  sectionHeading: {
    fontSize: typography.sizes.sectionHeading,
    fontFamily: typography.fontFamily.bold,
    color: colors.ink,
  },
  weekHelpText: {
    fontSize: typography.sizes.caption,
    color: colors.muted,
    fontFamily: typography.fontFamily.regular,
  },
  adjustScheduleBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radii.chip,
    backgroundColor: colors.pinkSoft,
    borderWidth: 1,
    borderColor: colors.pinkLine,
  },
  adjustScheduleText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.bold,
    color: colors.roseText,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  dayItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 14,
    minHeight: spacing.minTouchTarget,
    gap: 2,
  },
  dayItemToday: {
    backgroundColor: colors.pinkSoft,
    borderWidth: 1.5,
    borderColor: colors.pinkAccent,
  },
  dayItemCurrentToday: {
    borderWidth: 1.5,
    borderColor: colors.rose,
  },
  dayWeekday: {
    fontSize: 11,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.muted,
  },
  dayWeekdayToday: {
    color: colors.roseText,
    fontFamily: typography.fontFamily.bold,
  },
  dayNumber: {
    fontSize: 16,
    fontFamily: typography.fontFamily.bold,
    color: colors.ink,
  },
  dayNumberToday: {
    color: colors.roseText,
  },
  dayDotsContainer: {
    flexDirection: 'row',
    gap: 2,
    alignItems: 'center',
    justifyContent: 'center',
    height: 8,
    marginTop: 2,
  },
  dayDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingTop: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  legendText: {
    fontSize: typography.sizes.caption,
    color: colors.muted,
    fontFamily: typography.fontFamily.regular,
  },
  todaySection: {
    gap: spacing.listGap,
  },
  todayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  todayEst: {
    fontSize: typography.sizes.meta,
    color: colors.muted,
    fontFamily: typography.fontFamily.regular,
  },
  taskCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.pinkLine,
    borderRadius: radii.cardSmall,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  taskCardFeatured: {
    borderWidth: 2,
    borderColor: colors.pinkAccent,
  },
  taskCardCompleted: {
    opacity: 0.7,
    backgroundColor: '#FAF5F7',
    borderColor: '#ECD4DC',
  },
  taskTouchArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  taskIconBg: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskContent: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  taskTitle: {
    fontSize: typography.sizes.cardTitle,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.ink,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: colors.muted,
  },
  taskSub: {
    fontSize: typography.sizes.meta,
    color: colors.muted,
    fontFamily: typography.fontFamily.regular,
  },
  taskSubCompleted: {
    textDecorationLine: 'line-through',
    opacity: 0.8,
  },
  checkboxTouch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.pinkInput,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  checkboxTouchActive: {
    backgroundColor: colors.rose,
    borderColor: colors.rose,
  },
  checkboxEmpty: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  loadingBox: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: typography.sizes.caption,
    color: colors.muted,
    fontFamily: typography.fontFamily.regular,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.pinkLine,
    borderRadius: radii.cardSmall,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  emptyTitle: {
    fontSize: 15,
    fontFamily: typography.fontFamily.bold,
    color: colors.ink,
  },
  emptySubtitle: {
    fontSize: typography.sizes.caption,
    color: colors.muted,
    fontFamily: typography.fontFamily.regular,
    textAlign: 'center',
  },
});
