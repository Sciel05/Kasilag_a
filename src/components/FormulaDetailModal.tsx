import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { colors, typography, radii, spacing } from '../theme';
import { Formula } from '../types';
import { CloseIcon, PinIcon } from './Icons';

interface FormulaDetailModalProps {
  visible: boolean;
  formula: Formula | null;
  courseName?: string;
  onClose: () => void;
  onTogglePin: (formulaId: string) => void;
}

export const FormulaDetailModal: React.FC<FormulaDetailModalProps> = ({
  visible,
  formula,
  courseName,
  onClose,
  onTogglePin,
}) => {
  if (!formula) return null;

  const katexHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css">
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js"></script>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 12px 16px;
      display: flex;
      justify-content: center;
      align-items: center;
      background-color: #FFF4F7;
      color: #3A2530;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      overflow: hidden;
      min-height: 80px;
    }
    #math-container {
      font-size: 1.4rem;
      text-align: center;
    }
    .katex { font-size: 1.25em !important; }
  </style>
</head>
<body>
  <div id="math-container"></div>
  <script>
    function renderFormula() {
      try {
        if (window.katex) {
          katex.render(${JSON.stringify(formula.latex)}, document.getElementById('math-container'), {
            displayMode: true,
            throwOnError: false
          });
        } else {
          setTimeout(renderFormula, 50);
        }
      } catch (err) {
        document.getElementById('math-container').innerText = ${JSON.stringify(formula.plainText)};
      }
    }
    window.onload = renderFormula;
  </script>
</body>
</html>
  `;

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
            <View style={styles.headerLeft}>
              {courseName && <Text style={styles.courseBadge}>{courseName}</Text>}
              <Text style={styles.title}>{formula.label}</Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={[styles.pinBtn, formula.pinned && styles.pinBtnActive]}
                onPress={() => onTogglePin(formula.id)}
                activeOpacity={0.7}
                accessibilityLabel={formula.pinned ? 'Unpin formula' : 'Pin formula'}
              >
                <PinIcon
                  color={formula.pinned ? colors.rose : colors.muted}
                  size={18}
                  filled={formula.pinned}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={onClose}
                activeOpacity={0.7}
                accessibilityLabel="Close formula details"
              >
                <CloseIcon color={colors.muted} size={18} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* KaTeX WebView Box */}
            <View style={styles.webviewWrapper}>
              <WebView
                originWhitelist={['*']}
                source={{ html: katexHtml }}
                style={styles.webview}
                scrollEnabled={false}
                scalesPageToFit={false}
              />
              <View style={styles.plainTextRow}>
                <Text style={styles.plainTextLabel}>Plaintext:</Text>
                <Text style={styles.plainTextValue}>{formula.plainText}</Text>
              </View>
            </View>

            {/* Variables Section */}
            <View style={styles.section}>
              <Text style={styles.sectionHeading}>Variables & Units</Text>
              <View style={styles.variablesCard}>
                {formula.variables.map((v, i) => (
                  <View
                    key={i}
                    style={[
                      styles.variableRow,
                      i > 0 && styles.variableRowBorder,
                    ]}
                  >
                    <View style={styles.symbolBadge}>
                      <Text style={styles.symbolText}>{v.symbol}</Text>
                    </View>
                    <View style={styles.variableDesc}>
                      <Text style={styles.meaningText}>{v.meaning}</Text>
                      <Text style={styles.unitText}>{v.unit}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Derivation Steps */}
            <View style={styles.section}>
              <Text style={styles.sectionHeading}>Derivation Steps</Text>
              <View style={styles.derivationCard}>
                {formula.derivationSteps.map((step, idx) => (
                  <View key={idx} style={styles.stepRow}>
                    <View style={styles.stepNumberBadge}>
                      <Text style={styles.stepNumberText}>{idx + 1}</Text>
                    </View>
                    <Text style={styles.stepText}>{step}</Text>
                  </View>
                ))}
              </View>
            </View>
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
    alignItems: 'flex-start',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.pinkLine,
  },
  headerLeft: {
    flex: 1,
    paddingRight: 10,
    gap: 4,
  },
  courseBadge: {
    fontSize: 11,
    fontFamily: typography.fontFamily.bold,
    color: colors.roseText,
    letterSpacing: 0.6,
  },
  title: {
    fontSize: 18,
    fontFamily: typography.fontFamily.bold,
    color: colors.ink,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pinBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.pinkLine,
  },
  pinBtnActive: {
    backgroundColor: colors.pinkSoft,
    borderColor: colors.pinkAccent,
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
    paddingVertical: 14,
    gap: 16,
  },
  webviewWrapper: {
    backgroundColor: colors.bg,
    borderRadius: radii.cardSmall,
    borderWidth: 1,
    borderColor: colors.pinkLine,
    overflow: 'hidden',
  },
  webview: {
    height: 95,
    backgroundColor: 'transparent',
  },
  plainTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.pinkLine,
    backgroundColor: colors.surface,
    gap: 6,
  },
  plainTextLabel: {
    fontSize: 12,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.muted,
  },
  plainTextValue: {
    fontSize: 13,
    fontFamily: typography.fontFamily.monoMedium,
    color: colors.ink,
  },
  section: {
    gap: 8,
  },
  sectionHeading: {
    fontSize: 14,
    fontFamily: typography.fontFamily.bold,
    color: colors.ink,
  },
  variablesCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.pinkLine,
    borderRadius: radii.cardSmall,
    overflow: 'hidden',
  },
  variableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 12,
  },
  variableRowBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.pinkLine,
  },
  symbolBadge: {
    minWidth: 32,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: colors.pinkSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  symbolText: {
    fontSize: 14,
    fontFamily: typography.fontFamily.monoMedium,
    color: colors.roseText,
  },
  variableDesc: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  meaningText: {
    fontSize: 13,
    fontFamily: typography.fontFamily.medium,
    color: colors.ink,
    flex: 1,
  },
  unitText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.monoRegular,
    color: colors.muted,
  },
  derivationCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.pinkLine,
    borderRadius: radii.cardSmall,
    padding: 12,
    gap: 10,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  stepNumberBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.pinkSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepNumberText: {
    fontSize: 11,
    fontFamily: typography.fontFamily.bold,
    color: colors.roseText,
  },
  stepText: {
    fontSize: 13,
    fontFamily: typography.fontFamily.regular,
    color: colors.ink,
    flex: 1,
    lineHeight: 18,
  },
});

