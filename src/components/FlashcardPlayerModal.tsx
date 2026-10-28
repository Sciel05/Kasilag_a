import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { colors, typography, radii, spacing } from '../theme';
import { Flashcard, FlashcardRating } from '../types';
import { CloseIcon, RefreshIcon, CheckIcon, CardsIcon } from './Icons';

interface FlashcardPlayerModalProps {
  visible: boolean;
  flashcards: Flashcard[];
  onClose: () => void;
  onRateCard: (cardId: string, rating: FlashcardRating) => Promise<any>;
}

export const FlashcardPlayerModal: React.FC<FlashcardPlayerModalProps> = ({
  visible,
  flashcards,
  onClose,
  onRateCard,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [ratingBusy, setRatingBusy] = useState(false);

  const currentCard = flashcards[currentIndex];

  const handleRating = async (rating: FlashcardRating) => {
    if (!currentCard || ratingBusy) return;
    try {
      setRatingBusy(true);
      await onRateCard(currentCard.id, rating);
      if (currentIndex + 1 < flashcards.length) {
        setIsFlipped(false);
        setCurrentIndex(currentIndex + 1);
      } else {
        setSessionCompleted(true);
      }
    } finally {
      setRatingBusy(false);
    }
  };

  const handleResetSession = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setSessionCompleted(false);
    onClose();
  };

  if (!visible) return null;

  const katexHtml = currentCard?.latexFormula
    ? `
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
      padding: 10px;
      display: flex;
      justify-content: center;
      align-items: center;
      background-color: #FFF4F7;
      color: #3A2530;
      font-family: -apple-system, sans-serif;
      min-height: 60px;
      overflow: hidden;
    }
    #math-box { font-size: 1.3rem; text-align: center; }
  </style>
</head>
<body>
  <div id="math-box"></div>
  <script>
    function renderMath() {
      if (window.katex) {
        katex.render(${JSON.stringify(currentCard.latexFormula)}, document.getElementById('math-box'), {
          displayMode: true,
          throwOnError: false
        });
      } else {
        setTimeout(renderMath, 40);
      }
    }
    window.onload = renderMath;
  </script>
</body>
</html>
`
    : null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleResetSession}
    >
      <SafeAreaView style={styles.safeContainer}>
        {/* Top Navbar */}
        <View style={styles.navbar}>
          <TouchableOpacity style={styles.closeBtn} onPress={handleResetSession}>
            <CloseIcon color={colors.ink} size={18} strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={styles.progressCounter}>
            {sessionCompleted
              ? 'Complete'
              : `Card ${currentIndex + 1} of ${flashcards.length}`}
          </Text>
          <View style={styles.deckBadge}>
            <CardsIcon color={colors.roseText} size={14} />
            <Text style={styles.deckBadgeText}>SM-2</Text>
          </View>
        </View>

        {/* Empty state if 0 cards */}
        {flashcards.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <CheckIcon color={colors.roseText} size={28} strokeWidth={3} />
            </View>
            <Text style={styles.emptyTitle}>All Caught Up!</Text>
            <Text style={styles.emptySubtitle}>
              No flashcards are due right now. Check back tomorrow or review your course folders.
            </Text>
            <TouchableOpacity style={styles.emptyDoneBtn} onPress={handleResetSession}>
              <Text style={styles.emptyDoneBtnText}>Back to Practice</Text>
            </TouchableOpacity>
          </View>
        ) : sessionCompleted ? (
          /* Session Completed View */
          <View style={styles.completedContainer}>
            <View style={styles.completedCircle}>
              <CheckIcon color="#FFFFFF" size={32} strokeWidth={3} />
            </View>
            <Text style={styles.completedTitle}>Session Finished!</Text>
            <Text style={styles.completedSubtitle}>
              You reviewed {flashcards.length} spaced-retrieval cards. Your intervals have been updated.
            </Text>
            <TouchableOpacity style={styles.completedBtn} onPress={handleResetSession}>
              <Text style={styles.completedBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Active Flashcard Player */
          <View style={styles.playerContent}>
            {/* Flip Card Container */}
            <TouchableOpacity
              style={styles.cardContainer}
              activeOpacity={0.92}
              onPress={() => setIsFlipped(!isFlipped)}
            >
              {/* Card Meta Top */}
              <View style={styles.cardHeader}>
                <View style={styles.cardTypeBadge}>
                  <Text style={styles.cardTypeBadgeText}>
                    {currentCard.cardType.replace('_', ' ').toUpperCase()}
                  </Text>
                </View>
                <View style={styles.clusterBadge}>
                  <Text style={styles.clusterBadgeText}>{currentCard.cluster}</Text>
                </View>
              </View>

              <ScrollView
                style={styles.cardScrollView}
                contentContainerStyle={styles.cardScrollInner}
                showsVerticalScrollIndicator={false}
              >
                {/* Prompt (Front) */}
                <Text style={styles.promptLabel}>
                  {isFlipped ? 'QUESTION / PROMPT' : 'PROMPT'}
                </Text>
                <Text style={styles.promptText}>{currentCard.prompt}</Text>

                {/* Answer (Back) */}
                {isFlipped ? (
                  <View style={styles.answerWrap}>
                    <View style={styles.divider} />
                    <Text style={styles.answerLabel}>ANSWER</Text>
                    <Text style={styles.answerText}>{currentCard.answer}</Text>

                    {/* KaTeX formula if formula card */}
                    {katexHtml && (
                      <View style={styles.webviewBox}>
                        <WebView
                          originWhitelist={['*']}
                          source={{ html: katexHtml }}
                          style={styles.webview}
                          scrollEnabled={false}
                        />
                      </View>
                    )}
                  </View>
                ) : (
                  <View style={styles.tapPromptBox}>
                    <Text style={styles.tapPromptText}>Tap anywhere to flip card</Text>
                  </View>
                )}
              </ScrollView>
            </TouchableOpacity>

            {/* Bottom Rating Bar (Only visible after flipped) */}
            {isFlipped ? (
              <View style={styles.ratingBar}>
                <Text style={styles.ratingBarLabel}>How well did you know this?</Text>
                <View style={styles.ratingsRow}>
                  <TouchableOpacity
                    style={[styles.ratingBtn, { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' }]}
                    onPress={() => handleRating('Again')}
                    disabled={ratingBusy}
                  >
                    <Text style={[styles.ratingBtnText, { color: '#B91C1C' }]}>Again</Text>
                    <Text style={styles.intervalText}>1d</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.ratingBtn, { backgroundColor: '#FEF3C7', borderColor: '#FCD34D' }]}
                    onPress={() => handleRating('Hard')}
                    disabled={ratingBusy}
                  >
                    <Text style={[styles.ratingBtnText, { color: '#B45309' }]}>Hard</Text>
                    <Text style={styles.intervalText}>
                      {Math.max(1, Math.round(currentCard.interval * 1.2))}d
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.ratingBtn, { backgroundColor: '#E0E7FF', borderColor: '#A5B4FC' }]}
                    onPress={() => handleRating('Good')}
                    disabled={ratingBusy}
                  >
                    <Text style={[styles.ratingBtnText, { color: '#4338CA' }]}>Good</Text>
                    <Text style={styles.intervalText}>
                      {currentCard.interval === 1 ? '3d' : `${Math.round(currentCard.interval * currentCard.ease)}d`}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.ratingBtn, { backgroundColor: '#DCFCE7', borderColor: '#86EFAC' }]}
                    onPress={() => handleRating('Easy')}
                    disabled={ratingBusy}
                  >
                    <Text style={[styles.ratingBtnText, { color: '#15803D' }]}>Easy</Text>
                    <Text style={styles.intervalText}>
                      {currentCard.interval === 1 ? '5d' : `${Math.round(currentCard.interval * currentCard.ease * 1.3)}d`}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.peekHelper}>
                <Text style={styles.peekHelperText}>
                  Test your unassisted recall before flipping to reveal the answer.
                </Text>
              </View>
            )}
          </View>
        )}
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
  progressCounter: {
    fontSize: 14,
    fontFamily: typography.fontFamily.bold,
    color: colors.ink,
  },
  deckBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.pinkSoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  deckBadgeText: {
    fontSize: 11,
    fontFamily: typography.fontFamily.bold,
    color: colors.roseText,
  },
  playerContent: {
    flex: 1,
    padding: spacing.screenPaddingHorizontal,
    justifyContent: 'space-between',
  },
  cardContainer: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.cardLarge,
    borderWidth: 1,
    borderColor: colors.pinkLine,
    padding: 20,
    marginBottom: 16,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardTypeBadge: {
    backgroundColor: colors.pinkSoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  cardTypeBadgeText: {
    fontSize: 10,
    fontFamily: typography.fontFamily.bold,
    color: colors.roseText,
    letterSpacing: 0.5,
  },
  clusterBadge: {
    backgroundColor: colors.bg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.pinkLine,
  },
  clusterBadgeText: {
    fontSize: 10,
    fontFamily: typography.fontFamily.bold,
    color: colors.muted,
  },
  cardScrollView: {
    flex: 1,
  },
  cardScrollInner: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  promptLabel: {
    fontSize: 11,
    fontFamily: typography.fontFamily.bold,
    color: colors.muted,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  promptText: {
    fontSize: 18,
    fontFamily: typography.fontFamily.bold,
    color: colors.ink,
    lineHeight: 26,
  },
  divider: {
    height: 1,
    backgroundColor: colors.pinkLine,
    marginVertical: 16,
  },
  answerWrap: {
    gap: 8,
  },
  answerLabel: {
    fontSize: 11,
    fontFamily: typography.fontFamily.bold,
    color: colors.roseText,
    letterSpacing: 0.8,
  },
  answerText: {
    fontSize: 15,
    fontFamily: typography.fontFamily.regular,
    color: colors.ink,
    lineHeight: 22,
  },
  webviewBox: {
    backgroundColor: colors.bg,
    borderRadius: radii.cardSmall,
    borderWidth: 1,
    borderColor: colors.pinkLine,
    overflow: 'hidden',
    marginTop: 8,
  },
  webview: {
    height: 75,
    backgroundColor: 'transparent',
  },
  tapPromptBox: {
    alignItems: 'center',
    paddingVertical: 24,
    marginTop: 20,
  },
  tapPromptText: {
    fontSize: 13,
    fontFamily: typography.fontFamily.medium,
    color: colors.muted,
  },
  ratingBar: {
    gap: 8,
    paddingBottom: Platform.OS === 'ios' ? 12 : 8,
  },
  ratingBarLabel: {
    fontSize: 12,
    fontFamily: typography.fontFamily.medium,
    color: colors.muted,
    textAlign: 'center',
  },
  ratingsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  ratingBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radii.button,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    gap: 2,
  },
  ratingBtnText: {
    fontSize: 13,
    fontFamily: typography.fontFamily.bold,
  },
  intervalText: {
    fontSize: 10,
    fontFamily: typography.fontFamily.regular,
    color: colors.muted,
  },
  peekHelper: {
    alignItems: 'center',
    paddingBottom: 16,
  },
  peekHelperText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.regular,
    color: colors.muted,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    gap: 12,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.pinkSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: typography.fontFamily.bold,
    color: colors.ink,
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: typography.fontFamily.regular,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyDoneBtn: {
    marginTop: 12,
    backgroundColor: colors.rose,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: radii.button,
  },
  emptyDoneBtnText: {
    color: '#FFFFFF',
    fontFamily: typography.fontFamily.bold,
    fontSize: 14,
  },
  completedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    gap: 12,
  },
  completedCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  completedTitle: {
    fontSize: 22,
    fontFamily: typography.fontFamily.bold,
    color: colors.ink,
  },
  completedSubtitle: {
    fontSize: 14,
    fontFamily: typography.fontFamily.regular,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
  completedBtn: {
    marginTop: 16,
    backgroundColor: colors.rose,
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: radii.button,
  },
  completedBtnText: {
    color: '#FFFFFF',
    fontFamily: typography.fontFamily.bold,
    fontSize: 15,
  },
});

