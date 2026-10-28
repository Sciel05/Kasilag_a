import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import { colors, typography, radii, spacing } from '../theme';
import { CloseIcon } from './Icons';

interface GoalEditModalProps {
  visible: boolean;
  currentGoal: number;
  onClose: () => void;
  onSaveGoal: (goal: number) => Promise<any>;
}

export const GoalEditModal: React.FC<GoalEditModalProps> = ({
  visible,
  currentGoal,
  onClose,
  onSaveGoal,
}) => {
  const [goalText, setGoalText] = useState(String(currentGoal));

  React.useEffect(() => {
    setGoalText(String(currentGoal));
  }, [currentGoal]);

  const handleSave = async (num?: number) => {
    const val = num !== undefined ? num : parseInt(goalText, 10);
    if (!isNaN(val) && val > 0) {
      await onSaveGoal(val);
      onClose();
    }
  };

  if (!visible) return null;

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
            <Text style={styles.title}>Daily Unassisted Goal</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <CloseIcon color={colors.muted} size={16} />
            </TouchableOpacity>
          </View>

          <Text style={styles.desc}>
            Set the number of problems and concepts you target solving without hints each day.
          </Text>

          {/* Preset Buttons */}
          <View style={styles.presetRow}>
            {[3, 5, 8, 10].map((preset) => (
              <TouchableOpacity
                key={preset}
                style={[
                  styles.presetBtn,
                  parseInt(goalText, 10) === preset && styles.presetBtnActive,
                ]}
                onPress={() => {
                  setGoalText(String(preset));
                  handleSave(preset);
                }}
              >
                <Text
                  style={[
                    styles.presetBtnText,
                    parseInt(goalText, 10) === preset && styles.presetBtnTextActive,
                  ]}
                >
                  {preset}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Custom Input */}
          <View style={styles.customRow}>
            <TextInput
              style={styles.textInput}
              keyboardType="number-pad"
              value={goalText}
              onChangeText={setGoalText}
              maxLength={2}
            />
            <TouchableOpacity style={styles.saveBtn} onPress={() => handleSave()}>
              <Text style={styles.saveBtnText}>Set Goal</Text>
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
    maxWidth: 360,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.pinkLine,
    gap: 12,
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
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  desc: {
    fontSize: 12,
    fontFamily: typography.fontFamily.regular,
    color: colors.muted,
    lineHeight: 17,
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  presetBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radii.chip,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.pinkLine,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetBtnActive: {
    backgroundColor: colors.pinkSoft,
    borderColor: colors.rose,
  },
  presetBtnText: {
    fontSize: 15,
    fontFamily: typography.fontFamily.bold,
    color: colors.ink,
  },
  presetBtnTextActive: {
    color: colors.roseText,
  },
  customRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  textInput: {
    width: 60,
    borderWidth: 1,
    borderColor: colors.pinkInput,
    borderRadius: 10,
    paddingVertical: 8,
    textAlign: 'center',
    fontSize: 16,
    fontFamily: typography.fontFamily.bold,
    color: colors.ink,
  },
  saveBtn: {
    flex: 1,
    backgroundColor: colors.rose,
    borderRadius: radii.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontFamily: typography.fontFamily.bold,
    fontSize: 14,
  },
});

