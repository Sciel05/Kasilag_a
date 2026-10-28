import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { colors, typography, radii, spacing } from '../theme';
import { Cluster, Program, Course } from '../types';
import { CloseIcon, TrashIcon, PlusIcon, ChevronRightIcon } from './Icons';

interface NewCourseModalProps {
  visible: boolean;
  programs: Program[];
  courses: Course[];
  onClose: () => void;
  onCreateSubject: (data: {
    name: string;
    programId: string;
    cluster?: Cluster;
  }) => Promise<Course>;
  onAddProgram: (name: string) => Promise<Program>;
  onDeleteProgram: (id: string) => Promise<void>;
}

type ClusterOption = 'None' | 'MSTE' | 'HGE' | 'PSAD';
const CLUSTERS: ClusterOption[] = ['None', 'MSTE', 'HGE', 'PSAD'];

export const NewCourseModal: React.FC<NewCourseModalProps> = ({
  visible,
  programs,
  courses,
  onClose,
  onCreateSubject,
  onAddProgram,
  onDeleteProgram,
}) => {
  const [selectedProgramId, setSelectedProgramId] = useState<string>('');
  const [subjectName, setSubjectName] = useState('');
  const [selectedCluster, setSelectedCluster] = useState<ClusterOption>('None');
  const [saving, setSaving] = useState(false);

  // Course dropdown expansion & inline adding
  const [showProgramDropdown, setShowProgramDropdown] = useState(false);
  const [showInlineNewCourse, setShowInlineNewCourse] = useState(false);
  const [newProgramName, setNewProgramName] = useState('');
  const [addingProgram, setAddingProgram] = useState(false);

  useEffect(() => {
    if (programs.length > 0 && !selectedProgramId) {
      setSelectedProgramId(programs[0].id);
    }
  }, [programs, selectedProgramId]);

  const activeProgram = programs.find((p) => p.id === selectedProgramId) || programs[0];

  const handleAddProgramInline = async () => {
    const trimmed = newProgramName.trim();
    if (!trimmed) {
      Alert.alert('Course Name Required', 'Please enter a name for the course.');
      return;
    }
    try {
      setAddingProgram(true);
      const created = await onAddProgram(trimmed);
      setSelectedProgramId(created.id);
      setNewProgramName('');
      setShowInlineNewCourse(false);
      setShowProgramDropdown(false);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to add course');
    } finally {
      setAddingProgram(false);
    }
  };

  const handleDeleteProgram = (prog: Program) => {
    const hasSubjects = courses.some((c) => c.programId === prog.id);
    if (hasSubjects) {
      Alert.alert(
        'Cannot Delete Course',
        'Move or delete its subjects first.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Delete Course',
      `Are you sure you want to delete "${prog.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await onDeleteProgram(prog.id);
              if (selectedProgramId === prog.id) {
                const remaining = programs.filter((p) => p.id !== prog.id);
                if (remaining.length > 0) {
                  setSelectedProgramId(remaining[0].id);
                }
              }
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to delete course');
            }
          },
        },
      ]
    );
  };

  const handleSave = async () => {
    const trimmed = subjectName.trim();
    if (!trimmed) {
      Alert.alert('Subject Name Required', 'Please enter a name for the subject.');
      return;
    }

    const progId = selectedProgramId || programs[0]?.id;
    if (!progId) {
      Alert.alert('Course Required', 'Please select or add a course first.');
      return;
    }

    // Check duplicate in same course
    const duplicate = courses.some(
      (c) =>
        c.programId === progId &&
        c.name.trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (duplicate) {
      Alert.alert('Duplicate Subject', 'A subject with this name already exists in this course.');
      return;
    }

    try {
      setSaving(true);
      await onCreateSubject({
        name: trimmed,
        programId: progId,
        cluster: selectedCluster === 'None' ? undefined : (selectedCluster as Cluster),
      });
      setSubjectName('');
      setSelectedCluster('None');
      setShowProgramDropdown(false);
      setShowInlineNewCourse(false);
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to create subject folder');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.dialogCard}>
          <View style={styles.header}>
            <Text style={styles.title}>New Class Folder</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <CloseIcon color={colors.muted} size={16} />
            </TouchableOpacity>
          </View>

          {/* Field 1: Course / Program Dropdown */}
          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>Course (Program)</Text>
            <TouchableOpacity
              style={styles.dropdownTrigger}
              activeOpacity={0.8}
              onPress={() => setShowProgramDropdown(!showProgramDropdown)}
            >
              <Text style={styles.dropdownTriggerText}>
                {activeProgram?.name || 'Select Course'}
              </Text>
              <ChevronRightIcon
                color={colors.muted}
                size={16}
                style={{ transform: [{ rotate: showProgramDropdown ? '90deg' : '0deg' }] }}
              />
            </TouchableOpacity>

            {/* Dropdown list */}
            {showProgramDropdown && (
              <View style={styles.dropdownMenu}>
                <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                  {programs.map((p) => {
                    const isSelected = p.id === (activeProgram?.id || '');
                    return (
                      <View key={p.id} style={styles.dropdownItemRow}>
                        <TouchableOpacity
                          style={styles.dropdownItemLeft}
                          onPress={() => {
                            setSelectedProgramId(p.id);
                            setShowProgramDropdown(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.dropdownItemText,
                              isSelected && styles.dropdownItemTextSelected,
                            ]}
                          >
                            {p.name}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.deleteProgBtn}
                          onPress={() => handleDeleteProgram(p)}
                          accessibilityLabel={`Delete ${p.name}`}
                        >
                          <TrashIcon color={colors.muted} size={14} />
                        </TouchableOpacity>
                      </View>
                    );
                  })}

                  {/* + Add course inline trigger */}
                  {!showInlineNewCourse ? (
                    <TouchableOpacity
                      style={styles.addCourseTrigger}
                      onPress={() => setShowInlineNewCourse(true)}
                    >
                      <PlusIcon color={colors.roseText} size={14} strokeWidth={2.5} />
                      <Text style={styles.addCourseTriggerText}>+ Add course</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.inlineAddWrap}>
                      <TextInput
                        style={styles.inlineInput}
                        placeholder="e.g. BS Architecture"
                        placeholderTextColor={colors.muted}
                        value={newProgramName}
                        onChangeText={setNewProgramName}
                        autoFocus
                      />
                      <View style={styles.inlineActionRow}>
                        <TouchableOpacity
                          style={styles.inlineCancelBtn}
                          onPress={() => {
                            setShowInlineNewCourse(false);
                            setNewProgramName('');
                          }}
                        >
                          <Text style={styles.inlineCancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.inlineSaveBtn}
                          onPress={handleAddProgramInline}
                          disabled={addingProgram}
                        >
                          <Text style={styles.inlineSaveText}>
                            {addingProgram ? 'Saving...' : 'Add'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Field 2: Subject Name */}
          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>Subject Name</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Mechanics of Deformable Bodies"
              placeholderTextColor={colors.muted}
              value={subjectName}
              onChangeText={setSubjectName}
            />
          </View>

          {/* Field 3: Board Subject Cluster (Optional) */}
          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>Board Subject Cluster (Optional)</Text>
            <View style={styles.clustersRow}>
              {CLUSTERS.map((cl) => {
                const isSelected = cl === selectedCluster;
                return (
                  <TouchableOpacity
                    key={cl}
                    style={[styles.clusterChip, isSelected && styles.clusterChipSelected]}
                    onPress={() => setSelectedCluster(cl)}
                  >
                    <Text
                      style={[
                        styles.clusterChipText,
                        isSelected && styles.clusterChipTextSelected,
                      ]}
                    >
                      {cl}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Action buttons */}
          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmBtn, saving && styles.confirmBtnDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={styles.confirmText}>{saving ? 'Creating...' : 'Create Folder'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(58, 37, 48, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.pinkLine,
    gap: 14,
    ...Platform.select({
      ios: {
        shadowColor: colors.ink,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 18,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 17,
    fontFamily: typography.fontFamily.bold,
    color: colors.ink,
  },
  closeBtn: {
    padding: 4,
  },
  fieldWrap: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 12,
    fontFamily: typography.fontFamily.bold,
    color: colors.ink,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.pinkLine,
    borderRadius: radii.input,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dropdownTriggerText: {
    fontSize: 13,
    fontFamily: typography.fontFamily.medium,
    color: colors.ink,
  },
  dropdownMenu: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.pinkLine,
    borderRadius: radii.cardSmall,
    maxHeight: 180,
    overflow: 'hidden',
    marginTop: 2,
  },
  dropdownScroll: {
    paddingVertical: 4,
  },
  dropdownItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.pinkLine,
  },
  dropdownItemLeft: {
    flex: 1,
  },
  dropdownItemText: {
    fontSize: 13,
    fontFamily: typography.fontFamily.regular,
    color: colors.ink,
  },
  dropdownItemTextSelected: {
    fontFamily: typography.fontFamily.bold,
    color: colors.roseText,
  },
  deleteProgBtn: {
    padding: 6,
  },
  addCourseTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.pinkSoft,
  },
  addCourseTriggerText: {
    fontSize: 13,
    fontFamily: typography.fontFamily.bold,
    color: colors.roseText,
  },
  inlineAddWrap: {
    padding: 10,
    backgroundColor: colors.pinkSoft,
    gap: 8,
  },
  inlineInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.pinkLine,
    borderRadius: radii.input,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    fontFamily: typography.fontFamily.regular,
    color: colors.ink,
  },
  inlineActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  inlineCancelBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  inlineCancelText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.medium,
    color: colors.muted,
  },
  inlineSaveBtn: {
    backgroundColor: colors.rose,
    borderRadius: radii.buttonSmall,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  inlineSaveText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.bold,
    color: '#FFFFFF',
  },
  textInput: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.pinkLine,
    borderRadius: radii.input,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    fontFamily: typography.fontFamily.regular,
    color: colors.ink,
  },
  clustersRow: {
    flexDirection: 'row',
    gap: 8,
  },
  clusterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.pinkLine,
    backgroundColor: colors.bg,
  },
  clusterChipSelected: {
    backgroundColor: colors.rose,
    borderColor: colors.rose,
  },
  clusterChipText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.bold,
    color: colors.muted,
  },
  clusterChipTextSelected: {
    color: '#FFFFFF',
  },
  btnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 6,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radii.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 13,
    fontFamily: typography.fontFamily.medium,
    color: colors.muted,
  },
  confirmBtn: {
    backgroundColor: colors.rose,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: radii.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnDisabled: {
    opacity: 0.6,
  },
  confirmText: {
    fontSize: 13,
    fontFamily: typography.fontFamily.bold,
    color: '#FFFFFF',
  },
});
