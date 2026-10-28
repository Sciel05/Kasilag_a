import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { colors, typography, radii, PaletteColorKey, typeColorPalette } from '../theme';
import { PlanType } from '../types';
import { CheckIcon, CloseIcon } from './Icons';

interface TypeColorPickerModalProps {
  visible: boolean;
  targetType: PlanType | null;
  currentColorKey: PaletteColorKey;
  onSelectColor: (type: PlanType, colorKey: PaletteColorKey) => void;
  onClose: () => void;
}

const PALETTE_KEYS: PaletteColorKey[] = [
  'rose',
  'blue',
  'lavender',
  'mint',
  'peach',
  'amber',
  'teal',
  'slate',
];

const TYPE_NAMES: Record<PlanType, string> = {
  exam: 'Quiz / Exam',
  study: 'Study',
  deadline: 'Deadline',
  other: 'Other',
};

export const TypeColorPickerModal: React.FC<TypeColorPickerModalProps> = ({
  visible,
  targetType,
  currentColorKey,
  onSelectColor,
  onClose,
}) => {
  if (!targetType) return null;

  const typeName = TYPE_NAMES[targetType] || 'Plan';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheetContainer}>
          {/* Grab handle */}
          <View style={styles.grabHandle} />

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.badge}>CUSTOMIZE PALETTE</Text>
              <Text style={styles.title}>{typeName} Color</Text>
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <CloseIcon color={colors.muted} size={18} />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Select a theme color for {typeName.toLowerCase()} plans. Updates calendar dots, week strip, cards, and legend.
          </Text>

          {/* Grid of 8 colors */}
          <View style={styles.paletteGrid}>
            {PALETTE_KEYS.map((key) => {
              const config = typeColorPalette[key];
              const isSelected = key === currentColorKey;

              return (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.colorCard,
                    { backgroundColor: config.bg, borderColor: isSelected ? config.dot : colors.pinkLine },
                    isSelected && styles.colorCardSelected,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => {
                    onSelectColor(targetType, key);
                    onClose();
                  }}
                >
                  <View style={[styles.colorDot, { backgroundColor: config.dot }]} />
                  <Text style={[styles.colorName, { color: config.text }]}>
                    {config.label}
                  </Text>
                  {isSelected && (
                    <View style={[styles.checkCircle, { backgroundColor: config.dot }]}>
                      <CheckIcon color="#FFFFFF" size={10} strokeWidth={3} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
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
    marginBottom: 6,
  },
  badge: {
    fontSize: 11,
    fontFamily: typography.fontFamily.bold,
    letterSpacing: 0.8,
    color: colors.roseText,
    marginBottom: 2,
  },
  title: {
    fontSize: 20,
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
  subtitle: {
    fontSize: 13,
    fontFamily: typography.fontFamily.regular,
    color: colors.muted,
    marginBottom: 16,
    lineHeight: 18,
  },
  paletteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  colorCard: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 10,
  },
  colorCardSelected: {
    borderWidth: 2,
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  colorName: {
    fontSize: 14,
    fontFamily: typography.fontFamily.semiBold,
    flex: 1,
  },
  checkCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

