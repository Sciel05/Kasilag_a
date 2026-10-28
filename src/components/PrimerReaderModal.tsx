import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { colors, typography, radii, spacing } from '../theme';
import { Primer } from '../types';
import { CloseIcon, BookOpenIcon, ClockIcon } from './Icons';

interface PrimerReaderModalProps {
  visible: boolean;
  primer: Primer | null;
  courseName?: string;
  cluster?: string;
  onClose: () => void;
}

export const PrimerReaderModal: React.FC<PrimerReaderModalProps> = ({
  visible,
  primer,
  courseName,
  cluster,
  onClose,
}) => {
  if (!primer) return null;

  // Simple clean markdown paragraph parser for headings and body
  const renderFormattedBody = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) {
        return <View key={idx} style={{ height: 10 }} />;
      }
      if (trimmed.startsWith('# ')) {
        return (
          <Text key={idx} style={styles.h1}>
            {trimmed.replace('# ', '')}
          </Text>
        );
      }
      if (trimmed.startsWith('## ')) {
        return (
          <Text key={idx} style={styles.h2}>
            {trimmed.replace('## ', '')}
          </Text>
        );
      }
      if (trimmed.startsWith('- ')) {
        return (
          <View key={idx} style={styles.bulletRow}>
            <View style={styles.bulletDot} />
            <Text style={styles.bulletText}>{trimmed.replace('- ', '')}</Text>
          </View>
        );
      }
      if (trimmed.startsWith('$$') && trimmed.endsWith('$$')) {
        return (
          <View key={idx} style={styles.formulaCallout}>
            <Text style={styles.formulaCalloutText}>
              {trimmed.replace(/\$\$/g, '')}
            </Text>
          </View>
        );
      }
      return (
        <Text key={idx} style={styles.paragraph}>
          {trimmed.replace(/\$/g, '')}
        </Text>
      );
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeContainer}>
        {/* Top Navbar */}
        <View style={styles.navBar}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <CloseIcon color={colors.ink} size={20} strokeWidth={2.5} />
          </TouchableOpacity>
          <View style={styles.badgesRow}>
            {cluster && (
              <View style={styles.clusterBadge}>
                <Text style={styles.clusterBadgeText}>{cluster}</Text>
              </View>
            )}
            <View style={styles.readTimeBadge}>
              <ClockIcon color={colors.muted} size={13} />
              <Text style={styles.readTimeText}>{primer.readMinutes} min read</Text>
            </View>
          </View>
        </View>

        {/* Scrollable Reader Content */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {courseName && <Text style={styles.courseSubtitle}>{courseName}</Text>}
          <Text style={styles.primerTitle}>{primer.title}</Text>

          {/* Quick Summary Card */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <BookOpenIcon color={colors.roseText} size={16} />
              <Text style={styles.summaryLabel}>QUICK SUMMARY</Text>
            </View>
            <Text style={styles.summaryText}>{primer.summary}</Text>
          </View>

          {/* Body Content */}
          <View style={styles.bodyWrap}>
            {renderFormattedBody(primer.body)}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPaddingHorizontal,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.pinkLine,
    backgroundColor: colors.surface,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.pinkLine,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clusterBadge: {
    backgroundColor: colors.pinkSoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  clusterBadgeText: {
    fontSize: 11,
    fontFamily: typography.fontFamily.bold,
    color: colors.roseText,
  },
  readTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.pinkLine,
  },
  readTimeText: {
    fontSize: 11,
    fontFamily: typography.fontFamily.medium,
    color: colors.muted,
  },
  scrollContent: {
    paddingHorizontal: spacing.screenPaddingHorizontal,
    paddingVertical: 20,
    gap: 14,
  },
  courseSubtitle: {
    fontSize: 12,
    fontFamily: typography.fontFamily.bold,
    color: colors.roseText,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  primerTitle: {
    fontSize: 24,
    fontFamily: typography.fontFamily.bold,
    color: colors.ink,
    lineHeight: 30,
  },
  summaryCard: {
    backgroundColor: colors.pinkSoft,
    borderRadius: radii.cardSmall,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.pinkLine,
    gap: 6,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  summaryLabel: {
    fontSize: 11,
    fontFamily: typography.fontFamily.bold,
    color: colors.roseText,
    letterSpacing: 0.8,
  },
  summaryText: {
    fontSize: 13,
    fontFamily: typography.fontFamily.medium,
    color: colors.ink,
    lineHeight: 18,
  },
  bodyWrap: {
    gap: 10,
    marginTop: 6,
  },
  h1: {
    fontSize: 20,
    fontFamily: typography.fontFamily.bold,
    color: colors.ink,
    marginTop: 10,
    marginBottom: 4,
  },
  h2: {
    fontSize: 16,
    fontFamily: typography.fontFamily.bold,
    color: colors.roseText,
    marginTop: 8,
    marginBottom: 2,
  },
  paragraph: {
    fontSize: 14,
    fontFamily: typography.fontFamily.regular,
    color: colors.ink,
    lineHeight: 22,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingLeft: 4,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.rose,
    marginTop: 8,
  },
  bulletText: {
    fontSize: 14,
    fontFamily: typography.fontFamily.regular,
    color: colors.ink,
    lineHeight: 20,
    flex: 1,
  },
  formulaCallout: {
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.pinkLine,
    alignItems: 'center',
    marginVertical: 4,
  },
  formulaCalloutText: {
    fontSize: 15,
    fontFamily: typography.fontFamily.monoMedium,
    color: colors.roseText,
  },
});

