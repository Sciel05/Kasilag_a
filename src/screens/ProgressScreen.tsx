import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { TabScreenProps } from '../navigation/types';
import { colors, typography, radii, spacing } from '../theme';
import { progressService } from '../services/progressService';

export const ProgressScreen: React.FC<TabScreenProps<'Progress'>> = () => {
  const insets = useSafeAreaInsets();

  const courses = [
    { id: 'deformable', name: 'Mechanics of Deformable Bodies', pct: progressService.getCourseMastery('deformable') },
    { id: 'structural', name: 'Structural Theory', pct: progressService.getCourseMastery('structural') },
    { id: 'geotech', name: 'Geotechnical Engineering', pct: progressService.getCourseMastery('geotech') },
    { id: 'hydraulics', name: 'Hydraulics & Water Resources', pct: progressService.getCourseMastery('hydraulics') },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Progress</Text>
          <Text style={styles.headerSub}>Unassisted mastery and board readiness</Text>
        </View>

        {/* Headline Ring Card */}
        <View style={styles.headlineCard}>
          <View style={styles.ringContainer}>
            <View style={styles.ringOuter}>
              <Text style={styles.ringValue}>78%</Text>
            </View>
          </View>
          <View style={styles.headlineTextWrap}>
            <Text style={styles.headlineTitle}>Unassisted accuracy</Text>
            <Text style={styles.headlineDesc}>
              Steps solved on the first attempt without requesting hints
            </Text>
          </View>
        </View>

        {/* Insight Card */}
        <View style={styles.insightCard}>
          <Text style={styles.insightTag}>LEARNING INSIGHT</Text>
          <Text style={styles.insightText}>
            Your method on torque and power relations is solid. Most errors occur in polar
            moment of inertia (confusing diameter formulas π/32 with radius formulas π/2).
          </Text>
        </View>

        {/* Coursework Mastery */}
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Coursework readiness</Text>
          <View style={styles.cardContainer}>
            {courses.map((c, i) => (
              <View key={i} style={styles.courseProgressRow}>
                <View style={styles.courseProgressHeader}>
                  <Text style={styles.courseProgressName} numberOfLines={1}>
                    {c.name}
                  </Text>
                  <Text style={styles.courseProgressPct}>{c.pct}%</Text>
                </View>
                <View style={styles.progressBarBg}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${c.pct}%`, backgroundColor: colors.blue },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Formula Mastery Levels */}
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Formula mastery levels</Text>
          <View style={styles.formulaLevelsRow}>
            <View style={styles.levelCard}>
              <Text style={styles.levelTitle}>Recall</Text>
              <Text style={styles.levelCount}>24</Text>
              <Text style={styles.levelMeta}>Can write formula</Text>
            </View>
            <View style={styles.levelCard}>
              <Text style={styles.levelTitle}>Choose</Text>
              <Text style={styles.levelCount}>18</Text>
              <Text style={styles.levelMeta}>Picks in situation</Text>
            </View>
            <View style={styles.levelCard}>
              <Text style={styles.levelTitle}>Apply</Text>
              <Text style={styles.levelCount}>12</Text>
              <Text style={styles.levelMeta}>Solves cleanly</Text>
            </View>
          </View>
        </View>

        {/* Most Common Mistake */}
        <View style={styles.mistakeCard}>
          <Text style={styles.mistakeTag}>FREQUENT MISTAKE PATTERN</Text>
          <Text style={styles.mistakeTitle}>
            Used π/16 instead of π/32 for polar moment of inertia
          </Text>
          <Text style={styles.mistakeMeta}>
            Detected in 3 recent shaft torsion attempts
          </Text>
        </View>
      </ScrollView>
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
    marginTop: 4,
  },
  headerTitle: {
    fontSize: typography.sizes.screenTitle,
    fontFamily: typography.fontFamily.bold,
    color: colors.ink,
  },
  headerSub: {
    fontSize: typography.sizes.body,
    color: colors.muted,
    fontFamily: typography.fontFamily.regular,
    marginTop: 2,
  },
  headlineCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.pinkLine,
    borderRadius: radii.cardLarge,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  ringContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringOuter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.blueSoft,
  },
  ringValue: {
    fontFamily: typography.fontFamily.monoMedium,
    fontSize: 22,
    color: colors.blue,
  },
  headlineTextWrap: {
    flex: 1,
    gap: 3,
  },
  headlineTitle: {
    fontSize: 17,
    fontFamily: typography.fontFamily.bold,
    color: colors.ink,
  },
  headlineDesc: {
    fontSize: typography.sizes.caption,
    color: colors.muted,
    fontFamily: typography.fontFamily.regular,
    lineHeight: 18,
  },
  insightCard: {
    backgroundColor: colors.pinkSoft,
    borderWidth: 1,
    borderColor: colors.pinkLine,
    borderRadius: radii.card,
    padding: 16,
    gap: 6,
  },
  insightTag: {
    fontSize: 10,
    fontFamily: typography.fontFamily.bold,
    color: colors.roseText,
    letterSpacing: 0.8,
  },
  insightText: {
    fontSize: typography.sizes.body,
    lineHeight: 20,
    color: colors.ink,
    fontFamily: typography.fontFamily.regular,
  },
  section: {
    gap: spacing.listGap,
  },
  sectionHeading: {
    fontSize: typography.sizes.sectionHeading,
    fontFamily: typography.fontFamily.bold,
    color: colors.ink,
  },
  cardContainer: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.pinkLine,
    borderRadius: radii.card,
    padding: 16,
    gap: 14,
  },
  courseProgressRow: {
    gap: 6,
  },
  courseProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  courseProgressName: {
    fontSize: 13,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.ink,
    flex: 1,
    marginRight: 10,
  },
  courseProgressPct: {
    fontFamily: typography.fontFamily.monoMedium,
    fontSize: 13,
    color: colors.muted,
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.pinkTrack,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  formulaLevelsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  levelCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.pinkLine,
    borderRadius: radii.cardSmall,
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  levelTitle: {
    fontSize: 12,
    fontFamily: typography.fontFamily.bold,
    color: colors.roseText,
  },
  levelCount: {
    fontFamily: typography.fontFamily.monoMedium,
    fontSize: 22,
    color: colors.ink,
  },
  levelMeta: {
    fontSize: 10,
    color: colors.muted,
    fontFamily: typography.fontFamily.regular,
    textAlign: 'center',
  },
  mistakeCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.pinkAccent,
    borderRadius: radii.card,
    padding: 16,
    gap: 6,
  },
  mistakeTag: {
    fontSize: 10,
    fontFamily: typography.fontFamily.bold,
    color: colors.pinkDot,
    letterSpacing: 0.8,
  },
  mistakeTitle: {
    fontSize: 14,
    fontFamily: typography.fontFamily.bold,
    color: colors.ink,
  },
  mistakeMeta: {
    fontSize: typography.sizes.caption,
    color: colors.muted,
    fontFamily: typography.fontFamily.regular,
  },
});
