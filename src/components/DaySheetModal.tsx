import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { colors, typography, radii, spacing, PaletteColorKey, TypeColorConfig } from '../theme';
import { CloseIcon, TrashIcon, PaletteIcon, PlusIcon, ClockIcon } from './Icons';
import { Plan, PlanType } from '../types';
import { DurationPickerModal } from './DurationPickerModal';
import { TypeColorPickerModal } from './TypeColorPickerModal';
import { useCourses } from '../hooks/useCourses';
import {
  formatFullDate,
  getRelativeDateLabel,
  formatTime24To12,
  formatDurationDisplay,
  formatTimeRange,
  time24ToDate,
  dateToTime24,
  toISODate,
} from '../utils/date';

interface DaySheetModalProps {
  visible: boolean;
  onClose: () => void;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  plans: Plan[];
  allPlans: Plan[];
  todayDate: string;
  onAddPlan: (plan: Omit<Plan, 'id'>) => Promise<any>;
  onDeletePlan: (planId: string) => Promise<any>;
  getTypeTheme: (type: PlanType) => TypeColorConfig;
  typeColors: Record<PlanType, PaletteColorKey>;
  onUpdateTypeColor: (type: PlanType, colorKey: PaletteColorKey) => Promise<void>;
  reassignSubject: (oldSubject: string, newSubject: string) => Promise<number>;
  getSubjectPlanCount: (subject: string) => number;
}

export const DaySheetModal: React.FC<DaySheetModalProps> = ({
  visible,
  onClose,
  selectedDate,
  onSelectDate,
  plans,
  allPlans,
  todayDate,
  onAddPlan,
  onDeletePlan,
  getTypeTheme,
  typeColors,
  onUpdateTypeColor,
  reassignSubject,
  getSubjectPlanCount,
}) => {
  const { courses, addSubject, deleteSubject } = useCourses();

  // Form states
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<PlanType>('study');
  const [startTime, setStartTime] = useState('15:00'); // 3:00 PM
  const [durationMinutes, setDurationMinutes] = useState(60); // 1 hr 0 min
  const [selectedClass, setSelectedClass] = useState('Mechanics of Deformable Bodies');
  const [saving, setSaving] = useState(false);

  // Pickers and sub-modals
  const [showNativeTimePicker, setShowNativeTimePicker] = useState(false);
  const [showWebTimeModal, setShowWebTimeModal] = useState(false);
  const [showDurationModal, setShowDurationModal] = useState(false);
  const [paletteModalTarget, setPaletteModalTarget] = useState<PlanType | null>(null);

  // Subject management modals
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [newSubjectInput, setNewSubjectInput] = useState('');
  const [deleteSubjectTarget, setDeleteSubjectTarget] = useState<{ id: string; name: string } | null>(null);

  // Fallback for default class selection if list loads
  React.useEffect(() => {
    if (courses.length > 0 && !courses.some((c) => c.name === selectedClass)) {
      setSelectedClass(courses[0].name);
    }
  }, [courses, selectedClass]);

  const typeOptions: Array<{ type: PlanType; label: string }> = [
    { type: 'exam', label: 'Quiz / exam' },
    { type: 'study', label: 'Study' },
    { type: 'deadline', label: 'Deadline' },
    { type: 'other', label: 'Other' },
  ];

  // Build marked dates for react-native-calendars
  const calendarMarkedDates = useMemo(() => {
    const marks: Record<string, any> = {};

    // Group all plans by date
    const plansByDate: Record<string, Plan[]> = {};
    allPlans.forEach((p) => {
      if (!plansByDate[p.date]) plansByDate[p.date] = [];
      plansByDate[p.date].push(p);
    });

    // Dates that have plans or are today or selected
    const dateKeys = new Set([...Object.keys(plansByDate), todayDate, selectedDate]);

    dateKeys.forEach((d) => {
      const isSelected = d === selectedDate;
      const dayPlans = plansByDate[d] || [];

      // Max 3 colored dots
      const dots = dayPlans.slice(0, 3).map((p) => {
        const theme = getTypeTheme(p.type);
        return {
          key: p.id,
          color: theme.dot,
          selectedDotColor: theme.dot,
        };
      });

      marks[d] = {
        dots,
        selected: isSelected,
        selectedColor: colors.pinkSoft,
        selectedTextColor: colors.roseText,
      };
    });

    return marks;
  }, [allPlans, todayDate, selectedDate, getTypeTheme]);

  const handleTimePickerPress = () => {
    if (Platform.OS === 'web') {
      setShowWebTimeModal(true);
    } else {
      setShowNativeTimePicker(true);
    }
  };

  const handleNativeTimeChange = (_event: DateTimePickerEvent, date?: Date) => {
    setShowNativeTimePicker(false);
    if (date) {
      // Step to nearest 5 minutes
      const hours = date.getHours();
      const minutes = Math.round(date.getMinutes() / 5) * 5;
      const roundedDate = new Date(date);
      roundedDate.setHours(hours, minutes, 0, 0);
      setStartTime(dateToTime24(roundedDate));
    }
  };

  const handleAddSubjectSubmit = async () => {
    const trimmed = newSubjectInput.trim();
    if (!trimmed) {
      Alert.alert('Subject Required', 'Please enter a subject name.');
      return;
    }
    const isDuplicate = courses.some(
      (c) => c.name.trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (isDuplicate) {
      Alert.alert('Duplicate Subject', 'A subject with this name already exists.');
      return;
    }

    try {
      const created = await addSubject(trimmed);
      setSelectedClass(created.name);
      setNewSubjectInput('');
      setShowAddSubjectModal(false);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to add subject');
    }
  };

  const handleSubjectLongPress = (course: { id: string; name: string }) => {
    setDeleteSubjectTarget(course);
  };

  const handleConfirmDeleteSubject = async () => {
    if (!deleteSubjectTarget) return;
    const targetName = deleteSubjectTarget.name;
    const targetId = deleteSubjectTarget.id;

    try {
      const count = getSubjectPlanCount(targetName);
      if (count > 0) {
        await reassignSubject(targetName, 'Other');
      }
      await deleteSubject(targetId);

      // If deleted subject was selected, fallback
      if (selectedClass.trim().toLowerCase() === targetName.trim().toLowerCase()) {
        const remaining = courses.filter((c) => c.id !== targetId);
        setSelectedClass(remaining.length > 0 ? remaining[0].name : 'Other');
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to delete subject');
    } finally {
      setDeleteSubjectTarget(null);
    }
  };

  const handleSave = async () => {
    if (!newTitle.trim()) {
      Alert.alert('Plan title required', 'Please enter what you plan to do.');
      return;
    }

    try {
      setSaving(true);
      const timeFormatted = `${formatTime24To12(startTime)} · ${formatDurationDisplay(durationMinutes)}`;
      await onAddPlan({
        userId: 'user-1',
        date: selectedDate,
        time: timeFormatted,
        startTime,
        durationMinutes,
        title: newTitle.trim(),
        subtitle: `${formatTime24To12(startTime)} · ${selectedClass}`,
        type: newType,
        completed: false,
        courseName: selectedClass,
      });
      setNewTitle('');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to save plan');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.sheetContainer}
        >
          {/* Grab Handle */}
          <View style={styles.grabHandle} />

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.relativeBadge}>
                {getRelativeDateLabel(selectedDate, todayDate)}
              </Text>
              <Text style={styles.headerTitle}>{formatFullDate(selectedDate)}</Text>
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              activeOpacity={0.8}
              onPress={onClose}
              accessibilityLabel="Close schedule modal"
            >
              <CloseIcon color={colors.muted} size={18} />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollBody}
            showsVerticalScrollIndicator={false}
          >
            {/* Full Month Calendar */}
            <View style={styles.calendarCard}>
              <Calendar
                current={selectedDate}
                markingType={'multi-dot'}
                markedDates={calendarMarkedDates}
                onDayPress={(day: DateData) => {
                  onSelectDate(day.dateString);
                }}
                enableSwipeMonths={true}
                theme={{
                  backgroundColor: colors.surface,
                  calendarBackground: colors.surface,
                  textSectionTitleColor: colors.muted,
                  selectedDayBackgroundColor: colors.pinkSoft,
                  selectedDayTextColor: colors.roseText,
                  todayTextColor: colors.roseText,
                  dayTextColor: colors.ink,
                  textDisabledColor: '#D8C5CC',
                  dotColor: colors.pinkDot,
                  selectedDotColor: colors.pinkDot,
                  arrowColor: colors.rose,
                  monthTextColor: colors.ink,
                  textDayFontFamily: typography.fontFamily.medium,
                  textMonthFontFamily: typography.fontFamily.bold,
                  textDayHeaderFontFamily: typography.fontFamily.semiBold,
                  textDayFontSize: 13,
                  textMonthFontSize: 15,
                  textDayHeaderFontSize: 11,
                  'stylesheet.day.basic': {
                    today: {
                      borderWidth: 1.5,
                      borderColor: colors.rose,
                      borderRadius: 16,
                    },
                    selected: {
                      backgroundColor: colors.pinkSoft,
                      borderRadius: 16,
                    },
                  },
                } as any}
              />
            </View>

            {/* Existing Plans for this Day */}
            <View style={styles.plansSection}>
              <Text style={styles.sectionHeading}>
                Scheduled for {formatFullDate(selectedDate)}
              </Text>
              {plans.length === 0 ? (
                <View style={styles.emptyDayBox}>
                  <Text style={styles.emptyDayText}>No plans scheduled for this day.</Text>
                </View>
              ) : (
                plans.map((p) => {
                  const typeTheme = getTypeTheme(p.type);
                  return (
                    <View key={p.id} style={[styles.planCard, { backgroundColor: typeTheme.bg }]}>
                      <View style={[styles.planColorBar, { backgroundColor: typeTheme.dot }]} />
                      <View style={styles.planInfo}>
                        <Text style={styles.planTitle}>{p.title}</Text>
                        <Text style={styles.planMeta}>
                          {p.time} {p.courseName ? `· ${p.courseName}` : ''}
                        </Text>
                      </View>
                      <Text style={[styles.planBadge, { color: typeTheme.text }]}>
                        {p.type === 'exam' ? 'QUIZ' : p.type.toUpperCase()}
                      </Text>
                      <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => onDeletePlan(p.id)}
                        activeOpacity={0.7}
                        accessibilityLabel="Delete plan"
                      >
                        <TrashIcon color={colors.muted} size={15} />
                      </TouchableOpacity>
                    </View>
                  );
                })
              )}
            </View>

            {/* Add a Plan Form */}
            <View style={styles.formContainer}>
              <Text style={styles.formTitle}>Add a plan to {formatFullDate(selectedDate)}</Text>

              {/* Title input */}
              <View style={styles.fieldWrap}>
                <Text style={styles.fieldLabel}>What's the plan?</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Group study, Prelim exam, Drill"
                  placeholderTextColor={colors.muted}
                  value={newTitle}
                  onChangeText={setNewTitle}
                />
              </View>

              {/* Type chips with Palette Icon and Long-Press Customization */}
              <View style={styles.fieldWrap}>
                <View style={styles.labelWithActionRow}>
                  <Text style={styles.fieldLabel}>Type</Text>
                  <TouchableOpacity
                    style={styles.palettePill}
                    activeOpacity={0.7}
                    onPress={() => setPaletteModalTarget(newType)}
                  >
                    <PaletteIcon color={getTypeTheme(newType).dot} size={14} />
                    <Text style={[styles.palettePillText, { color: getTypeTheme(newType).text }]}>
                      Pick color
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.typeChipsRow}>
                  {typeOptions.map((opt) => {
                    const isSelected = newType === opt.type;
                    const optTheme = getTypeTheme(opt.type);

                    return (
                      <TouchableOpacity
                        key={opt.type}
                        style={[
                          styles.typeChip,
                          isSelected && {
                            backgroundColor: optTheme.bg,
                            borderColor: optTheme.dot,
                            borderWidth: 2,
                          },
                        ]}
                        onPress={() => setNewType(opt.type)}
                        onLongPress={() => setPaletteModalTarget(opt.type)}
                        activeOpacity={0.8}
                      >
                        <View style={[styles.typeChipDot, { backgroundColor: optTheme.dot }]} />
                        <Text
                          style={[
                            styles.typeChipText,
                            isSelected && {
                              color: optTheme.text,
                              fontFamily: typography.fontFamily.bold,
                            },
                          ]}
                        >
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <Text style={styles.fieldHelper}>
                  Tip: Long-press a chip or tap "Pick color" to customize its theme color.
                </Text>
              </View>

              {/* Start Time + Duration Row */}
              <View style={styles.fieldWrap}>
                <View style={styles.timeDurationRow}>
                  {/* Start time field */}
                  <View style={styles.timeFieldHalf}>
                    <Text style={styles.fieldLabel}>Start time</Text>
                    <TouchableOpacity
                      style={styles.pickerSelector}
                      onPress={handleTimePickerPress}
                      activeOpacity={0.8}
                    >
                      <ClockIcon color={colors.roseText} size={16} />
                      <Text style={styles.pickerSelectorText}>
                        {formatTime24To12(startTime)}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Duration field */}
                  <View style={styles.timeFieldHalf}>
                    <Text style={styles.fieldLabel}>Duration</Text>
                    <TouchableOpacity
                      style={styles.pickerSelector}
                      onPress={() => setShowDurationModal(true)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.pickerSelectorText}>
                        {formatDurationDisplay(durationMinutes)}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Computed End Time Display */}
                <View style={styles.computedTimeBox}>
                  <Text style={styles.computedTimeLabel}>Scheduled time slot:</Text>
                  <Text style={styles.computedTimeValue}>
                    {formatTimeRange(startTime, durationMinutes)}
                  </Text>
                </View>
              </View>

              {/* Subject / Course Chips with + Add & Long-press Delete */}
              <View style={styles.fieldWrap}>
                <View style={styles.labelWithActionRow}>
                  <Text style={styles.fieldLabel}>Subject / Course</Text>
                  <Text style={styles.fieldHelperInline}>Hold chip to delete</Text>
                </View>

                <View style={styles.classChipsRow}>
                  {courses.map((c) => {
                    const isSelected = selectedClass === c.name;
                    return (
                      <TouchableOpacity
                        key={c.id}
                        style={[
                          styles.classChip,
                          isSelected && styles.classChipActive,
                        ]}
                        onPress={() => setSelectedClass(c.name)}
                        onLongPress={() => handleSubjectLongPress(c)}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.classChipText,
                            isSelected && styles.classChipTextActive,
                          ]}
                          numberOfLines={1}
                        >
                          {c.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}

                  {/* + Add Subject Chip */}
                  <TouchableOpacity
                    style={styles.addSubjectChip}
                    onPress={() => {
                      setNewSubjectInput('');
                      setShowAddSubjectModal(true);
                    }}
                    activeOpacity={0.8}
                  >
                    <PlusIcon color={colors.roseText} size={14} strokeWidth={3} />
                    <Text style={styles.addSubjectText}>Add</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Informational tip */}
              <View style={styles.tipBox}>
                <Text style={styles.tipText}>
                  Adding a quiz or exam lets the app automatically track upcoming deadlines on your Home screen.
                </Text>
              </View>

              {/* Save Button */}
              <TouchableOpacity
                style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                onPress={handleSave}
                disabled={saving}
                activeOpacity={0.85}
              >
                <Text style={styles.saveBtnText}>
                  {saving ? 'Saving...' : 'Save plan'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Native DateTimePicker for Start Time */}
        {showNativeTimePicker && Platform.OS !== 'web' && (
          <DateTimePicker
            value={time24ToDate(startTime)}
            mode="time"
            display="spinner"
            minuteInterval={5}
            onChange={handleNativeTimeChange}
          />
        )}

        {/* Web Fallback Modal for Start Time */}
        {showWebTimeModal && (
          <Modal
            transparent
            visible={showWebTimeModal}
            animationType="fade"
            onRequestClose={() => setShowWebTimeModal(false)}
          >
            <View style={styles.subModalOverlay}>
              <View style={styles.dialogCard}>
                <Text style={styles.dialogTitle}>Select Start Time</Text>
                <TextInput
                  style={[styles.textInput, { marginVertical: 14 }]}
                  defaultValue={startTime}
                  placeholder="HH:mm (24h) e.g. 15:00"
                  onChangeText={(val) => {
                    if (val.includes(':')) setStartTime(val);
                  }}
                />
                <View style={styles.dialogBtnRow}>
                  <TouchableOpacity
                    style={styles.dialogCancelBtn}
                    onPress={() => setShowWebTimeModal(false)}
                  >
                    <Text style={styles.dialogCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.dialogConfirmBtn}
                    onPress={() => setShowWebTimeModal(false)}
                  >
                    <Text style={styles.dialogConfirmText}>Set Time</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}

        {/* Duration Picker Scroll-Wheel Bottom Sheet */}
        <DurationPickerModal
          visible={showDurationModal}
          initialMinutes={durationMinutes}
          onClose={() => setShowDurationModal(false)}
          onConfirm={(mins) => setDurationMinutes(mins)}
        />

        {/* Type Color Picker Modal */}
        <TypeColorPickerModal
          visible={paletteModalTarget !== null}
          targetType={paletteModalTarget}
          currentColorKey={paletteModalTarget ? typeColors[paletteModalTarget] : 'slate'}
          onSelectColor={(type, colorKey) => {
            onUpdateTypeColor(type, colorKey);
          }}
          onClose={() => setPaletteModalTarget(null)}
        />

        {/* Add Subject Modal */}
        {showAddSubjectModal && (
          <Modal
            transparent
            visible={showAddSubjectModal}
            animationType="fade"
            onRequestClose={() => setShowAddSubjectModal(false)}
          >
            <View style={styles.subModalOverlay}>
              <View style={styles.dialogCard}>
                <Text style={styles.dialogTitle}>Add New Subject</Text>
                <Text style={styles.dialogSubtitle}>
                  Enter the subject name to use for your study plans.
                </Text>
                <TextInput
                  style={[styles.textInput, { marginVertical: 14 }]}
                  placeholder="e.g. Surveying, Highway Engineering"
                  placeholderTextColor={colors.muted}
                  value={newSubjectInput}
                  onChangeText={setNewSubjectInput}
                  autoFocus
                />
                <View style={styles.dialogBtnRow}>
                  <TouchableOpacity
                    style={styles.dialogCancelBtn}
                    onPress={() => setShowAddSubjectModal(false)}
                  >
                    <Text style={styles.dialogCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.dialogConfirmBtn}
                    onPress={handleAddSubjectSubmit}
                  >
                    <Text style={styles.dialogConfirmText}>Add Subject</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}

        {/* Delete Subject Confirm Dialog */}
        {deleteSubjectTarget && (
          <Modal
            transparent
            visible={deleteSubjectTarget !== null}
            animationType="fade"
            onRequestClose={() => setDeleteSubjectTarget(null)}
          >
            <View style={styles.subModalOverlay}>
              <View style={styles.dialogCard}>
                <Text style={styles.dialogTitle}>
                  Delete "{deleteSubjectTarget.name}"?
                </Text>
                <Text style={styles.dialogSubtitle}>
                  {(() => {
                    const count = getSubjectPlanCount(deleteSubjectTarget.name);
                    return count > 0
                      ? `${count} plans use this subject. They'll be moved to 'Other'.`
                      : 'Are you sure you want to delete this subject?';
                  })()}
                </Text>
                <View style={styles.dialogBtnRow}>
                  <TouchableOpacity
                    style={styles.dialogCancelBtn}
                    onPress={() => setDeleteSubjectTarget(null)}
                  >
                    <Text style={styles.dialogCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.dialogConfirmBtn, { backgroundColor: '#DC2626' }]}
                    onPress={handleConfirmDeleteSubject}
                  >
                    <Text style={styles.dialogConfirmText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(58, 37, 48, 0.42)',
  },
  backdrop: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '92%',
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  grabHandle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.pinkInput,
    alignSelf: 'center',
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  relativeBadge: {
    fontSize: 11,
    fontFamily: typography.fontFamily.bold,
    letterSpacing: 0.8,
    color: colors.roseText,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: typography.fontFamily.bold,
    color: colors.ink,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.pinkLine,
  },
  calendarCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.pinkLine,
    overflow: 'hidden',
    paddingBottom: 6,
  },
  scrollBody: {
    paddingVertical: 14,
    gap: 16,
  },
  plansSection: {
    gap: 8,
  },
  sectionHeading: {
    fontSize: 14,
    fontFamily: typography.fontFamily.bold,
    color: colors.ink,
    marginBottom: 2,
  },
  emptyDayBox: {
    backgroundColor: colors.bg,
    borderRadius: radii.chip,
    padding: 14,
    alignItems: 'center',
  },
  emptyDayText: {
    fontSize: typography.sizes.caption,
    color: colors.muted,
    fontFamily: typography.fontFamily.regular,
  },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    gap: 10,
  },
  planColorBar: {
    width: 4,
    height: 36,
    borderRadius: 2,
  },
  planInfo: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  planTitle: {
    fontSize: 14,
    fontFamily: typography.fontFamily.bold,
    color: colors.ink,
  },
  planMeta: {
    fontSize: 12,
    color: colors.muted,
    fontFamily: typography.fontFamily.regular,
  },
  planBadge: {
    fontSize: 11,
    fontFamily: typography.fontFamily.bold,
    marginRight: 6,
  },
  deleteBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  formContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.pinkLine,
    paddingTop: 16,
    gap: 12,
  },
  formTitle: {
    fontSize: 16,
    fontFamily: typography.fontFamily.bold,
    color: colors.ink,
  },
  fieldWrap: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.muted,
  },
  labelWithActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  palettePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.pinkSoft,
  },
  palettePillText: {
    fontSize: 11,
    fontFamily: typography.fontFamily.semiBold,
  },
  fieldHelper: {
    fontSize: 11,
    fontFamily: typography.fontFamily.regular,
    color: colors.muted,
    marginTop: 2,
  },
  fieldHelperInline: {
    fontSize: 11,
    fontFamily: typography.fontFamily.regular,
    color: colors.muted,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.pinkInput,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontFamily: typography.fontFamily.regular,
    fontSize: 14,
    color: colors.ink,
    backgroundColor: colors.surface,
  },
  typeChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radii.button,
    borderWidth: 1,
    borderColor: colors.pinkInput,
    backgroundColor: colors.surface,
    minHeight: 40,
    gap: 6,
  },
  typeChipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  typeChipText: {
    fontSize: 13,
    fontFamily: typography.fontFamily.medium,
    color: colors.muted,
  },
  timeDurationRow: {
    flexDirection: 'row',
    gap: 12,
  },
  timeFieldHalf: {
    flex: 1,
    gap: 6,
  },
  pickerSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.pinkInput,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: colors.surface,
  },
  pickerSelectorText: {
    fontSize: 14,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.ink,
  },
  computedTimeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.pinkSoft,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginTop: 2,
  },
  computedTimeLabel: {
    fontSize: 12,
    fontFamily: typography.fontFamily.medium,
    color: colors.muted,
  },
  computedTimeValue: {
    fontSize: 12,
    fontFamily: typography.fontFamily.bold,
    color: colors.roseText,
  },
  classChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  classChip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radii.chip,
    borderWidth: 1,
    borderColor: colors.pinkInput,
    backgroundColor: colors.surface,
  },
  classChipActive: {
    backgroundColor: colors.pinkSoft,
    borderColor: colors.pinkAccent,
  },
  classChipText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.medium,
    color: colors.muted,
  },
  classChipTextActive: {
    color: colors.roseText,
    fontFamily: typography.fontFamily.bold,
  },
  addSubjectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radii.chip,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.rose,
    backgroundColor: colors.pinkSoft,
  },
  addSubjectText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.bold,
    color: colors.roseText,
  },
  tipBox: {
    backgroundColor: colors.blueSoft,
    borderRadius: 12,
    padding: 12,
  },
  tipText: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.blueTextMuted,
    fontFamily: typography.fontFamily.regular,
  },
  saveBtn: {
    backgroundColor: colors.rose,
    borderRadius: radii.button,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: colors.surface,
    fontFamily: typography.fontFamily.bold,
    fontSize: 16,
  },
  subModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(58, 37, 48, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.pinkLine,
  },
  dialogTitle: {
    fontSize: 17,
    fontFamily: typography.fontFamily.bold,
    color: colors.ink,
    marginBottom: 4,
  },
  dialogSubtitle: {
    fontSize: 13,
    fontFamily: typography.fontFamily.regular,
    color: colors.muted,
    lineHeight: 18,
  },
  dialogBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 8,
  },
  dialogCancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radii.chip,
  },
  dialogCancelText: {
    fontSize: 14,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.muted,
  },
  dialogConfirmBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: radii.chip,
    backgroundColor: colors.rose,
  },
  dialogConfirmText: {
    fontSize: 14,
    fontFamily: typography.fontFamily.bold,
    color: '#FFFFFF',
  },
});
