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
import { Course, Chapter, SourceKind } from '../types';
import { courseService } from '../services/courseService';
import {
  CloseIcon,
  FileTextIcon,
  LinkIcon,
  CameraIcon,
  CardsIcon,
  ChevronRightIcon,
  EditIcon,
} from './Icons';

interface StudyAddSheetModalProps {
  visible: boolean;
  courses: Course[];
  onClose: () => void;
  onAddSource: (
    courseId: string,
    source: {
      title: string;
      kind: SourceKind;
      fileExt?: string;
      url?: string;
      noteBody?: string;
      companions?: { flashcardCount?: number; hasSummary?: boolean };
    },
    chapterId?: string
  ) => Promise<any>;
}

type AddViewMode = 'menu' | 'file' | 'link' | 'photo' | 'note' | 'deck';

export const StudyAddSheetModal: React.FC<StudyAddSheetModalProps> = ({
  visible,
  courses,
  onClose,
  onAddSource,
}) => {
  const [mode, setMode] = useState<AddViewMode>('menu');
  const [selectedCourseId, setSelectedCourseId] = useState(courses[0]?.id || '');
  const [subjectChapters, setSubjectChapters] = useState<Chapter[]>([]);
  const [selectedChapterId, setSelectedChapterId] = useState<string | undefined>(undefined); // undefined = Unsorted

  const [titleInput, setTitleInput] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [noteBodyInput, setNoteBodyInput] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (courses.length > 0 && !courses.some((c) => c.id === selectedCourseId)) {
      setSelectedCourseId(courses[0].id);
    }
  }, [courses, selectedCourseId]);

  useEffect(() => {
    if (selectedCourseId) {
      courseService.getChaptersByCourse(selectedCourseId).then((chs) => {
        setSubjectChapters(chs);
        setSelectedChapterId(undefined); // default Unsorted
      });
    }
  }, [selectedCourseId]);

  const resetForm = () => {
    setMode('menu');
    setTitleInput('');
    setUrlInput('');
    setNoteBodyInput('');
    setSelectedChapterId(undefined);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSave = async () => {
    const title = titleInput.trim();
    if (!title) {
      Alert.alert('Title Required', 'Please enter a title/name.');
      return;
    }

    try {
      setSaving(true);
      if (mode === 'file') {
        await onAddSource(
          selectedCourseId,
          {
            title,
            kind: 'file',
            fileExt: 'PDF',
            companions: { flashcardCount: 6, hasSummary: true },
          },
          selectedChapterId
        );
      } else if (mode === 'photo') {
        await onAddSource(
          selectedCourseId,
          {
            title,
            kind: 'photo',
            fileExt: 'JPG',
            companions: { flashcardCount: 3, hasSummary: false },
          },
          selectedChapterId
        );
      } else if (mode === 'link') {
        await onAddSource(
          selectedCourseId,
          {
            title,
            kind: 'link',
            fileExt: 'LINK',
            url: urlInput.trim() || 'https://civilengineering.org',
            companions: { flashcardCount: 4, hasSummary: true },
          },
          selectedChapterId
        );
      } else if (mode === 'note') {
        await onAddSource(
          selectedCourseId,
          {
            title,
            kind: 'note',
            fileExt: 'NOTE',
            noteBody: noteBodyInput.trim() || 'No additional note content.',
            companions: { flashcardCount: 5, hasSummary: true },
          },
          selectedChapterId
        );
      } else if (mode === 'deck') {
        await onAddSource(
          selectedCourseId,
          {
            title: `${title} (Flashcard Deck)`,
            kind: 'file',
            fileExt: 'DECK',
            companions: { flashcardCount: 15, hasSummary: false },
          },
          selectedChapterId
        );
      }
      handleClose();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to save item');
    } finally {
      setSaving(false);
    }
  };

  const renderSubjectAndChapterPickers = () => (
    <View style={styles.pickerSection}>
      {/* Subject Picker */}
      <View style={styles.fieldWrap}>
        <Text style={styles.fieldLabel}>Subject Folder</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.pillScroll}
        >
          {courses.map((c) => {
            const isSelected = c.id === selectedCourseId;
            return (
              <TouchableOpacity
                key={c.id}
                style={[styles.pill, isSelected && styles.pillSelected]}
                onPress={() => setSelectedCourseId(c.id)}
              >
                <Text
                  style={[styles.pillText, isSelected && styles.pillTextSelected]}
                >
                  {c.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Chapter Picker (Default: Unsorted) */}
      <View style={styles.fieldWrap}>
        <Text style={styles.fieldLabel}>Chapter (Default: Unsorted)</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.pillScroll}
        >
          <TouchableOpacity
            style={[
              styles.pill,
              selectedChapterId === undefined && styles.pillSelected,
            ]}
            onPress={() => setSelectedChapterId(undefined)}
          >
            <Text
              style={[
                styles.pillText,
                selectedChapterId === undefined && styles.pillTextSelected,
              ]}
            >
              Unsorted
            </Text>
          </TouchableOpacity>
          {subjectChapters.map((ch) => {
            const isSelected = ch.id === selectedChapterId;
            return (
              <TouchableOpacity
                key={ch.id}
                style={[styles.pill, isSelected && styles.pillSelected]}
                onPress={() => setSelectedChapterId(ch.id)}
              >
                <Text
                  style={[styles.pillText, isSelected && styles.pillTextSelected]}
                >
                  {ch.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose} />
        <View style={styles.sheetContainer}>
          <View style={styles.grabHandle} />

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>
                {mode === 'menu'
                  ? 'Add Study Material'
                  : mode === 'file'
                  ? 'Upload Document / File'
                  : mode === 'photo'
                  ? 'Add Photo Note'
                  : mode === 'link'
                  ? 'Add Web Resource'
                  : mode === 'note'
                  ? 'Write Study Note'
                  : 'New Flashcard Deck'}
              </Text>
              <Text style={styles.subtitle}>
                {mode === 'menu'
                  ? 'Select type of study source to add'
                  : 'Assign to a subject and chapter'}
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
              <CloseIcon color={colors.muted} size={18} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          {/* 1. Main Menu Mode */}
          {mode === 'menu' && (
            <View style={styles.menuGrid}>
              <TouchableOpacity
                style={styles.menuOption}
                activeOpacity={0.75}
                onPress={() => setMode('file')}
              >
                <View style={[styles.optionIconCircle, { backgroundColor: '#EFF6FF' }]}>
                  <FileTextIcon color={colors.blue} size={20} />
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>File / Document</Text>
                  <Text style={styles.optionSub}>PDF, PPTX, DOCX, or problem set</Text>
                </View>
                <ChevronRightIcon color={colors.muted} size={16} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuOption}
                activeOpacity={0.75}
                onPress={() => setMode('link')}
              >
                <View style={[styles.optionIconCircle, { backgroundColor: colors.pinkSoft }]}>
                  <LinkIcon color={colors.roseText} size={20} />
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>Web Link</Text>
                  <Text style={styles.optionSub}>Online reference, derivation, or video</Text>
                </View>
                <ChevronRightIcon color={colors.muted} size={16} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuOption}
                activeOpacity={0.75}
                onPress={() => setMode('photo')}
              >
                <View style={[styles.optionIconCircle, { backgroundColor: '#F0FDFA' }]}>
                  <CameraIcon color="#0D9488" size={20} />
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>Photo Note</Text>
                  <Text style={styles.optionSub}>Capture whiteboard diagram or handout</Text>
                </View>
                <ChevronRightIcon color={colors.muted} size={16} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuOption}
                activeOpacity={0.75}
                onPress={() => setMode('note')}
              >
                <View style={[styles.optionIconCircle, { backgroundColor: '#F5F3FF' }]}>
                  <EditIcon color="#7C3AED" size={20} />
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>Note</Text>
                  <Text style={styles.optionSub}>Write quick summaries or derivations</Text>
                </View>
                <ChevronRightIcon color={colors.muted} size={16} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuOption}
                activeOpacity={0.75}
                onPress={() => setMode('deck')}
              >
                <View style={[styles.optionIconCircle, { backgroundColor: '#F5F3FF' }]}>
                  <CardsIcon color="#8B5CF6" size={20} />
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>Flashcard Deck</Text>
                  <Text style={styles.optionSub}>Spaced retrieval cards for formulas</Text>
                </View>
                <ChevronRightIcon color={colors.muted} size={16} />
              </TouchableOpacity>
            </View>
          )}

          {/* 2. Sub-Form Modes */}
          {mode !== 'menu' && (
            <ScrollView
              contentContainerStyle={styles.formContainer}
              showsVerticalScrollIndicator={false}
            >
              {renderSubjectAndChapterPickers()}

              {/* Title input */}
              <View style={styles.fieldWrap}>
                <Text style={styles.fieldLabel}>
                  {mode === 'note' ? 'Note Title' : mode === 'deck' ? 'Deck Title' : 'File Name / Title'}
                </Text>
                <TextInput
                  style={styles.textInput}
                  placeholder={
                    mode === 'file'
                      ? 'e.g. Chapter 3 Review Problems.pdf'
                      : mode === 'photo'
                      ? 'e.g. Mohr Circle Diagram.jpg'
                      : mode === 'link'
                      ? 'e.g. Torsion Analysis Video Lecture'
                      : mode === 'note'
                      ? 'e.g. Navier-Bernoulli Assumptions'
                      : 'e.g. Shear & Moment Formulas Deck'
                  }
                  placeholderTextColor={colors.muted}
                  value={titleInput}
                  onChangeText={setTitleInput}
                  autoFocus
                />
              </View>

              {/* Link URL */}
              {mode === 'link' && (
                <View style={styles.fieldWrap}>
                  <Text style={styles.fieldLabel}>URL</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="https://example.com/notes"
                    placeholderTextColor={colors.muted}
                    value={urlInput}
                    onChangeText={setUrlInput}
                    autoCapitalize="none"
                  />
                </View>
              )}

              {/* Note Body */}
              {mode === 'note' && (
                <View style={styles.fieldWrap}>
                  <Text style={styles.fieldLabel}>Note Content</Text>
                  <TextInput
                    style={[styles.textInput, { height: 120, textAlignVertical: 'top' }]}
                    placeholder="Write key equations, derivations, or exam notes..."
                    placeholderTextColor={colors.muted}
                    value={noteBodyInput}
                    onChangeText={setNoteBodyInput}
                    multiline
                  />
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.actionBtnRow}>
                <TouchableOpacity
                  style={styles.backBtn}
                  onPress={() => setMode('menu')}
                >
                  <Text style={styles.backBtnText}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  <Text style={styles.saveBtnText}>
                    {saving ? 'Adding...' : 'Add Material'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
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
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.pinkLine,
    alignSelf: 'center',
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontFamily: typography.fontFamily.bold,
    color: colors.ink,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: typography.fontFamily.regular,
    color: colors.muted,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: colors.bg,
  },
  menuGrid: {
    gap: 8,
    paddingBottom: 16,
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: radii.cardSmall,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.pinkLine,
    gap: 12,
  },
  optionIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 14,
    fontFamily: typography.fontFamily.bold,
    color: colors.ink,
  },
  optionSub: {
    fontSize: 11,
    fontFamily: typography.fontFamily.regular,
    color: colors.muted,
  },
  formContainer: {
    gap: 14,
    paddingBottom: 20,
  },
  pickerSection: {
    gap: 10,
    backgroundColor: colors.bg,
    padding: 12,
    borderRadius: radii.cardSmall,
    borderWidth: 1,
    borderColor: colors.pinkLine,
  },
  fieldWrap: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 12,
    fontFamily: typography.fontFamily.bold,
    color: colors.ink,
  },
  pillScroll: {
    flexDirection: 'row',
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.pinkLine,
    backgroundColor: colors.surface,
    marginRight: 6,
  },
  pillSelected: {
    backgroundColor: colors.rose,
    borderColor: colors.rose,
  },
  pillText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.medium,
    color: colors.muted,
  },
  pillTextSelected: {
    color: '#FFFFFF',
    fontFamily: typography.fontFamily.bold,
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
  actionBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 6,
  },
  backBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radii.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    fontSize: 13,
    fontFamily: typography.fontFamily.medium,
    color: colors.muted,
  },
  saveBtn: {
    backgroundColor: colors.rose,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: radii.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    fontSize: 13,
    fontFamily: typography.fontFamily.bold,
    color: '#FFFFFF',
  },
});
