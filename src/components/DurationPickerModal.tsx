import React, { useState, useEffect, useRef } from 'react';
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
import { formatDurationDisplay } from '../utils/date';

interface DurationPickerModalProps {
  visible: boolean;
  initialMinutes: number;
  onClose: () => void;
  onConfirm: (durationMinutes: number) => void;
}

const HOURS = [0, 1, 2, 3, 4, 5, 6, 7, 8];
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
const ITEM_HEIGHT = 44;

export const DurationPickerModal: React.FC<DurationPickerModalProps> = ({
  visible,
  initialMinutes,
  onClose,
  onConfirm,
}) => {
  const [selectedHours, setSelectedHours] = useState(() => Math.floor(initialMinutes / 60));
  const [selectedMinutes, setSelectedMinutes] = useState(() => {
    const rem = initialMinutes % 60;
    // Snap to nearest 5
    return Math.round(rem / 5) * 5;
  });

  const hourScrollRef = useRef<any>(null);
  const minuteScrollRef = useRef<any>(null);

  useEffect(() => {
    if (visible) {
      const h = Math.min(8, Math.max(0, Math.floor(initialMinutes / 60)));
      const m = Math.min(55, Math.max(0, Math.round((initialMinutes % 60) / 5) * 5));
      setSelectedHours(h);
      setSelectedMinutes(m);

      // Auto scroll to position after brief delay
      setTimeout(() => {
        const hIdx = HOURS.indexOf(h);
        if (hIdx !== -1 && hourScrollRef.current) {
          hourScrollRef.current.scrollTo({ y: hIdx * ITEM_HEIGHT, animated: false });
        }
        const mIdx = MINUTES.indexOf(m);
        if (mIdx !== -1 && minuteScrollRef.current) {
          minuteScrollRef.current.scrollTo({ y: mIdx * ITEM_HEIGHT, animated: false });
        }
      }, 50);
    }
  }, [visible, initialMinutes]);

  const currentTotalMinutes = selectedHours * 60 + selectedMinutes;
  // If user selected 0h 0m, show 5m minimum preview
  const displayMinutes = currentTotalMinutes === 0 ? 5 : currentTotalMinutes;

  const handleConfirm = () => {
    onConfirm(displayMinutes);
    onClose();
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
        <View style={styles.sheetContainer}>
          {/* Grab handle */}
          <View style={styles.grabHandle} />

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <View style={styles.titleWrap}>
              <Text style={styles.title}>Duration</Text>
              <Text style={styles.previewSubtitle}>
                {formatDurationDisplay(displayMinutes)}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.doneBtn}
              onPress={handleConfirm}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.doneText}>Done</Text>
            </TouchableOpacity>
          </View>

          {/* Scroll Wheel Columns */}
          <View style={styles.wheelWrapper}>
            {/* Center highlight bar */}
            <View style={styles.selectionIndicator} pointerEvents="none" />

            {/* Column 1: Hours */}
            <View style={styles.columnContainer}>
              <Text style={styles.columnLabel}>HOURS</Text>
              <ScrollView
                ref={hourScrollRef}
                style={styles.scrollColumn}
                contentContainerStyle={styles.scrollColumnContent}
                showsVerticalScrollIndicator={false}
                snapToInterval={ITEM_HEIGHT}
                decelerationRate="fast"
                onMomentumScrollEnd={(e) => {
                  const y = e.nativeEvent.contentOffset.y;
                  const idx = Math.min(HOURS.length - 1, Math.max(0, Math.round(y / ITEM_HEIGHT)));
                  setSelectedHours(HOURS[idx]);
                }}
              >
                {HOURS.map((h) => {
                  const isSelected = h === selectedHours;
                  return (
                    <TouchableOpacity
                      key={`h-${h}`}
                      style={[styles.wheelItem, isSelected && styles.wheelItemSelected]}
                      onPress={() => setSelectedHours(h)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.wheelItemText,
                          isSelected && styles.wheelItemTextSelected,
                        ]}
                      >
                        {h} {h === 1 ? 'hr' : 'hrs'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Column 2: Minutes */}
            <View style={styles.columnContainer}>
              <Text style={styles.columnLabel}>MINUTES</Text>
              <ScrollView
                ref={minuteScrollRef}
                style={styles.scrollColumn}
                contentContainerStyle={styles.scrollColumnContent}
                showsVerticalScrollIndicator={false}
                snapToInterval={ITEM_HEIGHT}
                decelerationRate="fast"
                onMomentumScrollEnd={(e) => {
                  const y = e.nativeEvent.contentOffset.y;
                  const idx = Math.min(MINUTES.length - 1, Math.max(0, Math.round(y / ITEM_HEIGHT)));
                  setSelectedMinutes(MINUTES[idx]);
                }}
              >
                {MINUTES.map((m) => {
                  const isSelected = m === selectedMinutes;
                  return (
                    <TouchableOpacity
                      key={`m-${m}`}
                      style={[styles.wheelItem, isSelected && styles.wheelItemSelected]}
                      onPress={() => setSelectedMinutes(m)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.wheelItemText,
                          isSelected && styles.wheelItemTextSelected,
                        ]}
                      >
                        {m} min
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
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
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.pinkLine,
  },
  cancelText: {
    fontSize: 15,
    color: colors.muted,
    fontFamily: typography.fontFamily.medium,
  },
  titleWrap: {
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontFamily: typography.fontFamily.bold,
    color: colors.ink,
  },
  previewSubtitle: {
    fontSize: 12,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.roseText,
    marginTop: 2,
  },
  doneBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radii.chip,
    backgroundColor: colors.pinkSoft,
  },
  doneText: {
    fontSize: 14,
    fontFamily: typography.fontFamily.bold,
    color: colors.roseText,
  },
  wheelWrapper: {
    flexDirection: 'row',
    height: 220,
    position: 'relative',
    marginVertical: 12,
  },
  selectionIndicator: {
    position: 'absolute',
    top: 88,
    left: 10,
    right: 10,
    height: ITEM_HEIGHT,
    borderRadius: 12,
    backgroundColor: 'rgba(252, 228, 236, 0.35)',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.pinkLine,
  },
  columnContainer: {
    flex: 1,
    alignItems: 'center',
  },
  columnLabel: {
    fontSize: 11,
    fontFamily: typography.fontFamily.bold,
    letterSpacing: 0.8,
    color: colors.muted,
    marginBottom: 6,
  },
  scrollColumn: {
    width: '100%',
  },
  scrollColumnContent: {
    paddingVertical: 88, // Centers the first/last item into the indicator
  },
  divider: {
    width: 1,
    backgroundColor: colors.pinkLine,
    marginVertical: 10,
  },
  wheelItem: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    marginHorizontal: 16,
  },
  wheelItemSelected: {
    backgroundColor: colors.pinkSoft,
  },
  wheelItemText: {
    fontSize: 16,
    fontFamily: typography.fontFamily.medium,
    color: colors.muted,
  },
  wheelItemTextSelected: {
    fontSize: 17,
    fontFamily: typography.fontFamily.bold,
    color: colors.roseText,
  },
});
