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
import { ErrorLogEntry } from '../types';
import { CloseIcon, RefreshIcon, AlertCircleIcon, CheckIcon } from './Icons';

interface ErrorLogModalProps {
  visible: boolean;
  errorLog: ErrorLogEntry[];
  onClose: () => void;
  onReworkAll: () => void;
}

export const ErrorLogModal: React.FC<ErrorLogModalProps> = ({
  visible,
  errorLog,
  onClose,
  onReworkAll,
}) => {
  if (!visible) return null;

  // Group by cluster
  const groupedByCluster = errorLog.reduce<Record<string, ErrorLogEntry[]>>(
    (acc, item) => {
      if (!acc[item.cluster]) acc[item.cluster] = [];
      acc[item.cluster].push(item);
      return acc;
    },
    {}
  );

  const clusterKeys = Object.keys(groupedByCluster);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeContainer}>
        {/* Top Navbar */}
        <View style={styles.navbar}>
          <Text style={styles.navTitle}>Error Log & Remediation</Text>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <CloseIcon color={colors.ink} size={18} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header Info */}
          <View style={styles.headerInfoCard}>
            <View style={styles.headerIconCircle}>
              <AlertCircleIcon color={colors.roseText} size={20} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.headerCountTitle}>{errorLog.length} Concepts to Rework</Text>
              <Text style={styles.headerRuleText}>
                Items remain here until solved unassisted on 2 separate calendar days.
              </Text>
            </View>
          </View>

          {/* Rework All Action Button */}
          {errorLog.length > 0 && (
            <TouchableOpacity style={styles.reworkAllBtn} activeOpacity={0.85} onPress={onReworkAll}>
              <RefreshIcon color="#FFFFFF" size={16} />
              <Text style={styles.reworkAllBtnText}>Rework All Concepts Now</Text>
            </TouchableOpacity>
          )}

          {errorLog.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyCheckCircle}>
                <CheckIcon color="#FFFFFF" size={24} strokeWidth={3} />
              </View>
              <Text style={styles.emptyTitle}>Error Log Clear!</Text>
              <Text style={styles.emptySubtitle}>
                You have mastered all previously missed concepts across two separate days.
              </Text>
            </View>
          ) : (
            clusterKeys.map((clusterKey) => {
              const items = groupedByCluster[clusterKey];
              return (
                <View key={clusterKey} style={styles.clusterGroup}>
                  <View style={styles.clusterGroupHeader}>
                    <View style={styles.clusterBadge}>
                      <Text style={styles.clusterBadgeText}>{clusterKey}</Text>
                    </View>
                    <Text style={styles.clusterCountText}>
                      {items.length} item{items.length > 1 ? 's' : ''}
                    </Text>
                  </View>

                  {items.map((entry) => {
                    const masteredDays = entry.correctUnassistedDates.length;
                    return (
                      <View key={entry.id} style={styles.errorItemCard}>
                        <View style={styles.itemTopRow}>
                          <View style={styles.itemTypeBadge}>
                            <Text style={styles.itemTypeBadgeText}>
                              {entry.itemType.toUpperCase()}
                            </Text>
                          </View>
                          <View style={styles.streakBadge}>
                            <Text style={styles.streakBadgeText}>
                              {masteredDays} / 2 Days Clean
                            </Text>
                          </View>
                        </View>

                        <Text style={styles.itemTitle}>{entry.title}</Text>

                        {entry.mistakeType && (
                          <View style={styles.mistakeBox}>
                            <Text style={styles.mistakeLabel}>COMMON TRAP:</Text>
                            <Text style={styles.mistakeText}>{entry.mistakeType}</Text>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              );
            })
          )}
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
  navbar: {
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
  scrollContent: {
    padding: spacing.screenPaddingHorizontal,
    gap: 16,
    paddingBottom: 30,
  },
  headerInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: radii.cardSmall,
    borderWidth: 1,
    borderColor: colors.pinkLine,
    gap: 12,
  },
  headerIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.pinkSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCountTitle: {
    fontSize: 15,
    fontFamily: typography.fontFamily.bold,
    color: colors.ink,
  },
  headerRuleText: {
    fontSize: 11,
    fontFamily: typography.fontFamily.regular,
    color: colors.muted,
    lineHeight: 15,
  },
  reworkAllBtn: {
    backgroundColor: colors.rose,
    borderRadius: radii.button,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  reworkAllBtnText: {
    color: '#FFFFFF',
    fontFamily: typography.fontFamily.bold,
    fontSize: 14,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: 30,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: colors.pinkLine,
    marginTop: 20,
  },
  emptyCheckCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: typography.fontFamily.bold,
    color: colors.ink,
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: typography.fontFamily.regular,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 18,
  },
  clusterGroup: {
    gap: 10,
  },
  clusterGroupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  clusterCountText: {
    fontSize: 11,
    fontFamily: typography.fontFamily.medium,
    color: colors.muted,
  },
  errorItemCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.cardSmall,
    borderWidth: 1,
    borderColor: colors.pinkLine,
    padding: 14,
    gap: 8,
  },
  itemTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemTypeBadge: {
    backgroundColor: colors.bg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.pinkLine,
  },
  itemTypeBadgeText: {
    fontSize: 9,
    fontFamily: typography.fontFamily.bold,
    color: colors.muted,
  },
  streakBadge: {
    backgroundColor: colors.pinkSoft,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  streakBadgeText: {
    fontSize: 10,
    fontFamily: typography.fontFamily.bold,
    color: colors.roseText,
  },
  itemTitle: {
    fontSize: 14,
    fontFamily: typography.fontFamily.bold,
    color: colors.ink,
  },
  mistakeBox: {
    backgroundColor: colors.bg,
    padding: 8,
    borderRadius: 8,
    gap: 2,
  },
  mistakeLabel: {
    fontSize: 9,
    fontFamily: typography.fontFamily.bold,
    color: colors.roseText,
    letterSpacing: 0.6,
  },
  mistakeText: {
    fontSize: 11,
    fontFamily: typography.fontFamily.regular,
    color: colors.muted,
  },
});

