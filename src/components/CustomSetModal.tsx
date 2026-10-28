import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { colors, typography, radii, spacing } from '../theme';
import { Cluster, ClusterTopic, TemplateDifficulty } from '../types';
import { CloseIcon, CheckIcon } from './Icons';

interface CustomSetModalProps {
  visible: boolean;
  topics: ClusterTopic[];
  onClose: () => void;
  onStartCustomSet: (config: {
    clusters: Cluster[];
    selectedTopicIds: string[];
    difficulty: TemplateDifficulty;
    questionCount: number;
    timerEnabled: boolean;
  }) => void;
}

const CLUSTERS: Cluster[] = ['PSAD', 'HGE', 'MSTE'];
const DIFFICULTIES: { label: string; val: TemplateDifficulty }[] = [
  { label: 'Easy', val: 'easy' },
  { label: 'Moderate', val: 'moderate' },
  { label: 'Board Level', val: 'board' },
];
const COUNTS = [5, 10, 15];

export const CustomSetModal: React.FC<CustomSetModalProps> = ({
  visible,
  topics,
  onClose,
  onStartCustomSet,
}) => {
  const [selectedClusters, setSelectedClusters] = useState<Cluster[]>(['PSAD', 'HGE']);
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<TemplateDifficulty>('board');
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [timerEnabled, setTimerEnabled] = useState<boolean>(true);

  // Filter available topics by selected clusters
  const visibleTopics = useMemo(() => {
    return topics.filter((t) => selectedClusters.includes(t.cluster));
  }, [topics, selectedClusters]);

  const toggleCluster = (cl: Cluster) => {
    if (selectedClusters.includes(cl)) {
      if (selectedClusters.length > 1) {
        setSelectedClusters(selectedClusters.filter((c) => c !== cl));
      }
    } else {
      setSelectedClusters([...selectedClusters, cl]);
    }
  };

  const toggleTopic = (id: string) => {
    if (selectedTopicIds.includes(id)) {
      setSelectedTopicIds(selectedTopicIds.filter((t) => t !== id));
    } else {
      setSelectedTopicIds([...selectedTopicIds, id]);
    }
  };

  const handleStart = () => {
    onStartCustomSet({
      clusters: selectedClusters,
      selectedTopicIds:
        selectedTopicIds.length > 0
          ? selectedTopicIds
          : visibleTopics.map((t) => t.id),
      difficulty,
      questionCount,
      timerEnabled,
    });
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheetContainer}>
          {/* Grab handle */}
          <View style={styles.grabHandle} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Create Practice Set</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <CloseIcon color={colors.muted} size={18} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* 1. Clusters */}
            <View style={styles.fieldSection}>
              <Text style={styles.fieldLabel}>Board Subject Clusters</Text>
              <View style={styles.chipsRow}>
                {CLUSTERS.map((cl) => {
                  const isSelected = selectedClusters.includes(cl);
                  return (
                    <TouchableOpacity
                      key={cl}
                      style={[styles.chip, isSelected && styles.chipActive]}
                      onPress={() => toggleCluster(cl)}
                    >
                      <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                        {cl}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 2. Topics multi-select */}
            <View style={styles.fieldSection}>
              <Text style={styles.fieldLabel}>Topics ({visibleTopics.length} available)</Text>
              <View style={styles.topicsGrid}>
                {visibleTopics.map((top) => {
                  const isSelected =
                    selectedTopicIds.length === 0 || selectedTopicIds.includes(top.id);
                  return (
                    <TouchableOpacity
                      key={top.id}
                      style={[styles.topicChip, isSelected && styles.topicChipActive]}
                      onPress={() => toggleTopic(top.id)}
                    >
                      <Text style={[styles.topicChipText, isSelected && styles.topicChipTextActive]} numberOfLines={1}>
                        {top.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 3. Difficulty */}
            <View style={styles.fieldSection}>
              <Text style={styles.fieldLabel}>Difficulty</Text>
              <View style={styles.chipsRow}>
                {DIFFICULTIES.map((d) => {
                  const isSelected = difficulty === d.val;
                  return (
                    <TouchableOpacity
                      key={d.val}
                      style={[styles.chip, isSelected && styles.chipActive]}
                      onPress={() => setDifficulty(d.val)}
                    >
                      <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                        {d.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 4. Question Count */}
            <View style={styles.fieldSection}>
              <Text style={styles.fieldLabel}>Question Count</Text>
              <View style={styles.chipsRow}>
                {COUNTS.map((cnt) => {
                  const isSelected = questionCount === cnt;
                  return (
                    <TouchableOpacity
                      key={cnt}
                      style={[styles.chip, isSelected && styles.chipActive]}
                      onPress={() => setQuestionCount(cnt)}
                    >
                      <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                        {cnt} Questions
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 5. Timer toggle */}
            <View style={styles.fieldSection}>
              <Text style={styles.fieldLabel}>Countdown Timer</Text>
              <View style={styles.chipsRow}>
                <TouchableOpacity
                  style={[styles.chip, timerEnabled && styles.chipActive]}
                  onPress={() => setTimerEnabled(true)}
                >
                  <Text style={[styles.chipText, timerEnabled && styles.chipTextActive]}>
                    Timer On (1.5 min / question)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.chip, !timerEnabled && styles.chipActive]}
                  onPress={() => setTimerEnabled(false)}
                >
                  <Text style={[styles.chipText, !timerEnabled && styles.chipTextActive]}>
                    Untimed
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Start Button */}
            <TouchableOpacity style={styles.startBtn} activeOpacity={0.85} onPress={handleStart}>
              <Text style={styles.startBtnText}>Start Practice Set</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(58, 37, 48, 0.45)',
  },
  backdrop: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    borderWidth: 1,
    borderColor: colors.pinkLine,
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
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
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
    gap: 16,
    paddingBottom: 20,
  },
  fieldSection: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 13,
    fontFamily: typography.fontFamily.bold,
    color: colors.ink,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radii.chip,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.pinkLine,
  },
  chipActive: {
    backgroundColor: colors.pinkSoft,
    borderColor: colors.rose,
  },
  chipText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.medium,
    color: colors.muted,
  },
  chipTextActive: {
    color: colors.roseText,
    fontFamily: typography.fontFamily.bold,
  },
  topicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  topicChip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radii.chip,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.pinkLine,
    maxWidth: '100%',
  },
  topicChipActive: {
    backgroundColor: colors.pinkSoft,
    borderColor: colors.pinkAccent,
  },
  topicChipText: {
    fontSize: 11,
    fontFamily: typography.fontFamily.medium,
    color: colors.muted,
  },
  topicChipTextActive: {
    color: colors.roseText,
    fontFamily: typography.fontFamily.bold,
  },
  startBtn: {
    backgroundColor: colors.rose,
    borderRadius: radii.button,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  startBtnText: {
    color: '#FFFFFF',
    fontFamily: typography.fontFamily.bold,
    fontSize: 15,
  },
});

