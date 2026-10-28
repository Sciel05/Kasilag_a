import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  TextInput,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
import { colors, typography, radii, spacing } from '../theme';
import { Course, Chapter, Source, Program, SourceKind } from '../types';
import { courseService } from '../services/courseService';
import { progressService } from '../services/progressService';
import {
  CloseIcon,
  ChevronRightIcon,
  FileTextIcon,
  LinkIcon,
  CameraIcon,
  CardsIcon,
  PinIcon,
  TrashIcon,
  EditIcon,
  MoreVerticalIcon,
  PlusIcon,
} from './Icons';

interface CourseChaptersModalProps {
  visible: boolean;
  course: Course | null;
  programs: Program[];
  allCourses: Course[];
  onClose: () => void;
  onRenameSubject: (id: string, newName: string) => Promise<any>;
  onDeleteSubject: (id: string) => Promise<any>;
  onAddChapter: (courseId: string, name: string) => Promise<any>;
  onRenameChapter: (courseId: string, chapterId: string, newName: string) => Promise<any>;
  onDeleteChapter: (courseId: string, chapterId: string) => Promise<any>;
  onReorderChapters: (courseId: string, chapterIds: string[]) => Promise<any>;
  onAddSource: (courseId: string, source: any, chapterId?: string) => Promise<any>;
  onRenameSource: (sourceId: string, newTitle: string) => Promise<any>;
  onMoveSource: (sourceId: string, targetCourseId: string, targetChapterId?: string) => Promise<any>;
  onTogglePinSource: (sourceId: string) => Promise<any>;
  onDeleteSource: (sourceId: string) => Promise<any>;
  onReorderChapterSources: (courseId: string, chapterId: string | undefined, sourceIds: string[]) => Promise<any>;
}

export const CourseChaptersModal: React.FC<CourseChaptersModalProps> = ({
  visible,
  course,
  programs,
  allCourses,
  onClose,
  onRenameSubject,
  onDeleteSubject,
  onAddChapter,
  onRenameChapter,
  onDeleteChapter,
  onReorderChapters,
  onAddSource,
  onRenameSource,
  onMoveSource,
  onTogglePinSource,
  onDeleteSource,
  onReorderChapterSources,
}) => {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [unsortedSources, setUnsortedSources] = useState<Source[]>([]);
  const [collapsedChapters, setCollapsedChapters] = useState<Record<string, boolean>>({});
  const [unsortedCollapsed, setUnsortedCollapsed] = useState(false);

  // Subject menu
  const [showSubjectMenu, setShowSubjectMenu] = useState(false);
  const [showRenameSubjectModal, setShowRenameSubjectModal] = useState(false);
  const [renameSubjectInput, setRenameSubjectInput] = useState('');

  // Chapter modals
  const [showAddChapterModal, setShowAddChapterModal] = useState(false);
  const [newChapterNameInput, setNewChapterNameInput] = useState('');
  const [activeChapterForMenu, setActiveChapterForMenu] = useState<Chapter | null>(null);
  const [showRenameChapterModal, setShowRenameChapterModal] = useState(false);
  const [renameChapterInput, setRenameChapterInput] = useState('');

  // Item modals
  const [activeItemForMenu, setActiveItemForMenu] = useState<Source | null>(null);
  const [showRenameItemModal, setShowRenameItemModal] = useState(false);
  const [renameItemInput, setRenameItemInput] = useState('');

  // Move item modal
  const [showMoveItemModal, setShowMoveItemModal] = useState(false);
  const [targetMoveSubjectId, setTargetMoveSubjectId] = useState('');
  const [targetMoveChapterId, setTargetMoveChapterId] = useState<string | undefined>(undefined);
  const [targetMoveChaptersList, setTargetMoveChaptersList] = useState<Chapter[]>([]);

  // Item detail / Note viewer
  const [activePreviewSource, setActivePreviewSource] = useState<Source | null>(null);

  // Note editor modal
  const [showNoteEditor, setShowNoteEditor] = useState(false);
  const [noteTargetChapterId, setNoteTargetChapterId] = useState<string | undefined>(undefined);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteBody, setNoteBody] = useState('');

  // Add Link modal
  const [showAddLinkModal, setShowAddLinkModal] = useState(false);
  const [linkTargetChapterId, setLinkTargetChapterId] = useState<string | undefined>(undefined);
  const [linkTitle, setLinkTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');

  // Add chapter trigger picker
  const [activeAddChapterId, setActiveAddChapterId] = useState<string | null>(null);

  const loadFolderData = async () => {
    if (!course) return;
    const [chs, unsorted] = await Promise.all([
      courseService.getChaptersByCourse(course.id),
      courseService.getUnsortedSources(course.id),
    ]);
    setChapters(chs);
    setUnsortedSources(unsorted);
  };

  useEffect(() => {
    if (visible && course) {
      loadFolderData();
    }
  }, [visible, course]);

  if (!course) return null;

  const currentProgram = programs.find((p) => p.id === course.programId);
  const programName = currentProgram ? currentProgram.name : 'BS Civil Engineering';
  const masteryPct = progressService.getCourseMastery(course.id);
  const hasFlashcards = Boolean(course.cardsCount && course.cardsCount > 0);

  const toggleChapterCollapse = (chId: string) => {
    setCollapsedChapters((prev) => ({
      ...prev,
      [chId]: !prev[chId],
    }));
  };

  // Helper for source type icon
  const renderSourceIcon = (kind: SourceKind, fileExt?: string) => {
    switch (kind) {
      case 'pdf':
        return <FileTextIcon color="#DC2626" size={17} />;
      case 'file':
        if (fileExt?.toUpperCase() === 'PPTX' || fileExt?.toUpperCase() === 'PPT') {
          return <FileTextIcon color="#EA580C" size={17} />;
        }
        if (fileExt?.toUpperCase() === 'XLSX' || fileExt?.toUpperCase() === 'XLS') {
          return <FileTextIcon color="#16A34A" size={17} />;
        }
        return <FileTextIcon color={colors.blue} size={17} />;
      case 'note':
        return <FileTextIcon color="#7C3AED" size={17} />;
      case 'link':
        return <LinkIcon color={colors.roseText} size={17} />;
      case 'photo':
        return <CameraIcon color="#0D9488" size={17} />;
      default:
        return <FileTextIcon color={colors.muted} size={17} />;
    }
  };

  // Subject operations
  const handleOpenRenameSubject = () => {
    setShowSubjectMenu(false);
    setRenameSubjectInput(course.name);
    setShowRenameSubjectModal(true);
  };

  const handleSaveRenameSubject = async () => {
    const trimmed = renameSubjectInput.trim();
    if (!trimmed) return;
    try {
      await onRenameSubject(course.id, trimmed);
      setShowRenameSubjectModal(false);
      course.name = trimmed;
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to rename subject');
    }
  };

  const handleDeleteSubjectClick = () => {
    setShowSubjectMenu(false);
    Alert.alert(
      'Delete Subject Folder',
      `Are you sure you want to delete "${course.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await onDeleteSubject(course.id);
              onClose();
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to delete subject');
            }
          },
        },
      ]
    );
  };

  // Chapter operations
  const handleSaveNewChapter = async () => {
    const trimmed = newChapterNameInput.trim();
    if (!trimmed) return;
    try {
      await onAddChapter(course.id, trimmed);
      setNewChapterNameInput('');
      setShowAddChapterModal(false);
      await loadFolderData();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to add chapter');
    }
  };

  const handleSaveRenameChapter = async () => {
    if (!activeChapterForMenu) return;
    const trimmed = renameChapterInput.trim();
    if (!trimmed) return;
    try {
      await onRenameChapter(course.id, activeChapterForMenu.id, trimmed);
      setShowRenameChapterModal(false);
      setActiveChapterForMenu(null);
      await loadFolderData();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to rename chapter');
    }
  };

  const handleDeleteChapter = (ch: Chapter) => {
    setActiveChapterForMenu(null);
    Alert.alert(
      'Delete Chapter',
      `Delete "${ch.name}"? Its items will be safely moved to "Unsorted".`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await onDeleteChapter(course.id, ch.id);
              await loadFolderData();
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to delete chapter');
            }
          },
        },
      ]
    );
  };

  const handleMoveChapter = async (ch: Chapter, direction: 'up' | 'down') => {
    setActiveChapterForMenu(null);
    const index = chapters.findIndex((c) => c.id === ch.id);
    if (index === -1) return;
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= chapters.length) return;

    const list = [...chapters];
    const [moved] = list.splice(index, 1);
    list.splice(newIndex, 0, moved);
    const ids = list.map((c) => c.id);
    await onReorderChapters(course.id, ids);
    await loadFolderData();
  };

  // Item operations
  const handleTogglePin = async (item: Source) => {
    setActiveItemForMenu(null);
    try {
      await onTogglePinSource(item.id);
      await loadFolderData();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to pin/unpin item');
    }
  };

  const handleOpenRenameItem = (item: Source) => {
    setActiveItemForMenu(null);
    setRenameItemInput(item.title);
    setActiveItemForMenu(item);
    setShowRenameItemModal(true);
  };

  const handleSaveRenameItem = async () => {
    if (!activeItemForMenu) return;
    const trimmed = renameItemInput.trim();
    if (!trimmed) return;
    try {
      await onRenameSource(activeItemForMenu.id, trimmed);
      setShowRenameItemModal(false);
      setActiveItemForMenu(null);
      await loadFolderData();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to rename item');
    }
  };

  const handleDeleteItem = (item: Source) => {
    setActiveItemForMenu(null);
    Alert.alert(
      'Delete File',
      `Are you sure you want to delete "${item.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await onDeleteSource(item.id);
              await loadFolderData();
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to delete file');
            }
          },
        },
      ]
    );
  };

  // Move Item modal setup
  const handleOpenMoveModal = async (item: Source) => {
    setActiveItemForMenu(null);
    setActiveItemForMenu(item);
    setTargetMoveSubjectId(course.id);
    setTargetMoveChapterId(item.chapterId);
    const chs = await courseService.getChaptersByCourse(course.id);
    setTargetMoveChaptersList(chs);
    setShowMoveItemModal(true);
  };

  const handleSelectMoveSubject = async (subId: string) => {
    setTargetMoveSubjectId(subId);
    const chs = await courseService.getChaptersByCourse(subId);
    setTargetMoveChaptersList(chs);
    setTargetMoveChapterId(undefined); // default Unsorted
  };

  const handleConfirmMoveItem = async () => {
    if (!activeItemForMenu) return;
    try {
      await onMoveSource(
        activeItemForMenu.id,
        targetMoveSubjectId,
        targetMoveChapterId
      );
      setShowMoveItemModal(false);
      setActiveItemForMenu(null);
      await loadFolderData();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to move item');
    }
  };

  // Add Item actions
  const handleAddFilePlaceholder = async (chapterId?: string) => {
    setActiveAddChapterId(null);
    const count = (chapterId ? chapters.find((c) => c.id === chapterId)?.sources.length : unsortedSources.length) || 0;
    const name = `Lecture Handout ${count + 1}.pdf`;
    try {
      await onAddSource(
        course.id,
        {
          title: name,
          kind: 'pdf',
          fileExt: 'PDF',
          companions: { flashcardCount: 4, hasSummary: true },
        },
        chapterId
      );
      await loadFolderData();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to add file');
    }
  };

  const handleAddPhotoPlaceholder = async (chapterId?: string) => {
    setActiveAddChapterId(null);
    const name = `Board Diagram Photo ${Date.now().toString().slice(-4)}.jpg`;
    try {
      await onAddSource(
        course.id,
        {
          title: name,
          kind: 'photo',
          fileExt: 'JPG',
          companions: { flashcardCount: 3, hasSummary: false },
        },
        chapterId
      );
      await loadFolderData();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to add photo');
    }
  };

  const handleOpenAddLink = (chapterId?: string) => {
    setActiveAddChapterId(null);
    setLinkTargetChapterId(chapterId);
    setLinkTitle('');
    setLinkUrl('');
    setShowAddLinkModal(true);
  };

  const handleSaveLink = async () => {
    const title = linkTitle.trim();
    if (!title) {
      Alert.alert('Title Required', 'Please enter a name for the link.');
      return;
    }
    try {
      await onAddSource(
        course.id,
        {
          title,
          kind: 'link',
          fileExt: 'LINK',
          url: linkUrl.trim() || 'https://civilengineering.org',
          companions: { flashcardCount: 2, hasSummary: true },
        },
        linkTargetChapterId
      );
      setShowAddLinkModal(false);
      await loadFolderData();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to add link');
    }
  };

  const handleOpenAddNote = (chapterId?: string) => {
    setActiveAddChapterId(null);
    setNoteTargetChapterId(chapterId);
    setNoteTitle('');
    setNoteBody('');
    setShowNoteEditor(true);
  };

  const handleSaveNote = async () => {
    const title = noteTitle.trim();
    if (!title) {
      Alert.alert('Title Required', 'Please enter a title for your note.');
      return;
    }
    try {
      await onAddSource(
        course.id,
        {
          title,
          kind: 'note',
          fileExt: 'NOTE',
          noteBody: noteBody.trim() || 'No additional content written.',
          companions: { flashcardCount: 5, hasSummary: true },
        },
        noteTargetChapterId
      );
      setShowNoteEditor(false);
      await loadFolderData();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to save note');
    }
  };

  // Reorder items in chapter
  const handleItemReorder = async (chapterId: string, data: Source[]) => {
    const ids = data.map((d) => d.id);
    // Optimistic
    setChapters((prev) =>
      prev.map((c) => (c.id === chapterId ? { ...c, sources: data } : c))
    );
    await onReorderChapterSources(course.id, chapterId, ids);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <GestureHandlerRootView style={styles.sheetContainer}>
          {/* Grab handle */}
          <View style={styles.grabHandle} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerInfo}>
              <View style={styles.headerBadgeRow}>
                <Text style={styles.programName}>{programName}</Text>
                {course.cluster && (
                  <View style={styles.clusterBadge}>
                    <Text style={styles.clusterBadgeText}>{course.cluster}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.title}>{course.name}</Text>
              <Text style={styles.subtitle}>
                {chapters.length} chapters · {course.sourcesCount || 0} files
                {hasFlashcards ? ` · ${course.cardsCount} cards` : ''}
              </Text>
            </View>

            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.menuIconBtn}
                onPress={() => setShowSubjectMenu(true)}
                accessibilityLabel="Subject options"
              >
                <MoreVerticalIcon color={colors.ink} size={18} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={onClose}
                accessibilityLabel="Close chapter view"
              >
                <CloseIcon color={colors.muted} size={18} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Optional Mastery Card (only if flashcards exist) */}
          {hasFlashcards && (
            <View style={styles.masteryCard}>
              <View style={styles.masteryRow}>
                <Text style={styles.masteryLabel}>Coursework Retention</Text>
                <Text style={styles.masteryValue}>{masteryPct}% mastered</Text>
              </View>
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${masteryPct}%`, backgroundColor: colors.rose },
                  ]}
                />
              </View>
            </View>
          )}

          {/* Chapters and Unsorted Scroll */}
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* 1. Unsorted Section (at top) */}
            {unsortedSources.length > 0 && (
              <View style={styles.unsortedSection}>
                <TouchableOpacity
                  style={styles.unsortedHeader}
                  activeOpacity={0.8}
                  onPress={() => setUnsortedCollapsed(!unsortedCollapsed)}
                >
                  <View style={styles.sectionHeaderLeft}>
                    <ChevronRightIcon
                      color={colors.muted}
                      size={15}
                      style={{
                        transform: [{ rotate: unsortedCollapsed ? '0deg' : '90deg' }],
                      }}
                    />
                    <Text style={styles.unsortedTitle}>Unsorted</Text>
                    <View style={styles.countBadge}>
                      <Text style={styles.countBadgeText}>{unsortedSources.length}</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.addInlineBtn}
                    onPress={() => setActiveAddChapterId('unsorted')}
                  >
                    <PlusIcon color={colors.roseText} size={14} strokeWidth={2.5} />
                    <Text style={styles.addInlineText}>Add</Text>
                  </TouchableOpacity>
                </TouchableOpacity>

                {/* Inline add popup if active */}
                {activeAddChapterId === 'unsorted' && (
                  <View style={styles.inlineAddPickerCard}>
                    <Text style={styles.inlinePickerTitle}>Add to Unsorted:</Text>
                    <View style={styles.inlinePickerButtonsRow}>
                      <TouchableOpacity
                        style={styles.inlinePickerBtn}
                        onPress={() => handleAddFilePlaceholder(undefined)}
                      >
                        <FileTextIcon color={colors.blue} size={14} />
                        <Text style={styles.inlinePickerBtnText}>File</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.inlinePickerBtn}
                        onPress={() => handleAddPhotoPlaceholder(undefined)}
                      >
                        <CameraIcon color="#0D9488" size={14} />
                        <Text style={styles.inlinePickerBtnText}>Photo</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.inlinePickerBtn}
                        onPress={() => handleOpenAddLink(undefined)}
                      >
                        <LinkIcon color={colors.roseText} size={14} />
                        <Text style={styles.inlinePickerBtnText}>Link</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.inlinePickerBtn}
                        onPress={() => handleOpenAddNote(undefined)}
                      >
                        <EditIcon color="#7C3AED" size={14} />
                        <Text style={styles.inlinePickerBtnText}>Note</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.inlinePickerCancel}
                        onPress={() => setActiveAddChapterId(null)}
                      >
                        <CloseIcon color={colors.muted} size={13} />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {!unsortedCollapsed && (
                  <View style={styles.itemsListContainer}>
                    {unsortedSources.map((item) => (
                      <View key={item.id} style={styles.itemRow}>
                        <TouchableOpacity
                          style={styles.itemRowMain}
                          activeOpacity={0.7}
                          onPress={() => setActivePreviewSource(item)}
                        >
                          <View style={styles.itemIconWrap}>
                            {renderSourceIcon(item.kind, item.fileExt)}
                          </View>
                          <View style={styles.itemInfo}>
                            <View style={styles.itemTitleRow}>
                              <Text style={styles.itemTitle} numberOfLines={1}>
                                {item.title}
                              </Text>
                              {item.pinned && (
                                <PinIcon color={colors.roseText} size={12} filled />
                              )}
                            </View>
                            <Text style={styles.itemMeta}>
                              {item.fileExt || item.kind.toUpperCase()} · {item.createdAt}
                            </Text>
                          </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.itemMenuBtn}
                          onPress={() => setActiveItemForMenu(item)}
                        >
                          <MoreVerticalIcon color={colors.muted} size={16} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* 2. Chapters List */}
            <View style={styles.chaptersSection}>
              {chapters.map((ch, index) => {
                const isCollapsed = Boolean(collapsedChapters[ch.id]);
                const isAddingHere = activeAddChapterId === ch.id;

                return (
                  <View key={ch.id} style={styles.chapterCard}>
                    {/* Chapter Header */}
                    <View style={styles.chapterHeader}>
                      <TouchableOpacity
                        style={styles.chapterHeaderLeft}
                        activeOpacity={0.8}
                        onPress={() => toggleChapterCollapse(ch.id)}
                      >
                        <ChevronRightIcon
                          color={colors.muted}
                          size={15}
                          style={{
                            transform: [{ rotate: isCollapsed ? '0deg' : '90deg' }],
                          }}
                        />
                        <View style={styles.chapterTitleWrap}>
                          <Text style={styles.chapterName}>{ch.name}</Text>
                          <Text style={styles.chapterSubCount}>
                            {ch.sources.length} {ch.sources.length === 1 ? 'item' : 'items'}
                          </Text>
                        </View>
                      </TouchableOpacity>

                      <View style={styles.chapterHeaderRight}>
                        <TouchableOpacity
                          style={styles.addInlineBtn}
                          onPress={() => setActiveAddChapterId(ch.id)}
                        >
                          <PlusIcon color={colors.roseText} size={13} strokeWidth={2.5} />
                          <Text style={styles.addInlineText}>Add</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.chMenuBtn}
                          onPress={() => setActiveChapterForMenu(ch)}
                        >
                          <MoreVerticalIcon color={colors.muted} size={15} />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Inline Add Picker when open */}
                    {isAddingHere && (
                      <View style={styles.inlineAddPickerCard}>
                        <Text style={styles.inlinePickerTitle}>Add to {ch.name}:</Text>
                        <View style={styles.inlinePickerButtonsRow}>
                          <TouchableOpacity
                            style={styles.inlinePickerBtn}
                            onPress={() => handleAddFilePlaceholder(ch.id)}
                          >
                            <FileTextIcon color={colors.blue} size={14} />
                            <Text style={styles.inlinePickerBtnText}>File</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.inlinePickerBtn}
                            onPress={() => handleAddPhotoPlaceholder(ch.id)}
                          >
                            <CameraIcon color="#0D9488" size={14} />
                            <Text style={styles.inlinePickerBtnText}>Photo</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.inlinePickerBtn}
                            onPress={() => handleOpenAddLink(ch.id)}
                          >
                            <LinkIcon color={colors.roseText} size={14} />
                            <Text style={styles.inlinePickerBtnText}>Link</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.inlinePickerBtn}
                            onPress={() => handleOpenAddNote(ch.id)}
                          >
                            <EditIcon color="#7C3AED" size={14} />
                            <Text style={styles.inlinePickerBtnText}>Note</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.inlinePickerCancel}
                            onPress={() => setActiveAddChapterId(null)}
                          >
                            <CloseIcon color={colors.muted} size={13} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}

                    {/* Items List */}
                    {!isCollapsed && (
                      <View style={styles.itemsListContainer}>
                        {ch.sources.length === 0 ? (
                          <View style={styles.emptyChapterBox}>
                            <Text style={styles.emptyChapterText}>
                              No materials in this chapter yet. Tap "+ Add" above to upload or write notes.
                            </Text>
                          </View>
                        ) : (
                          ch.sources.map((item) => (
                            <View key={item.id} style={styles.itemRow}>
                              <TouchableOpacity
                                style={styles.itemRowMain}
                                activeOpacity={0.7}
                                onPress={() => setActivePreviewSource(item)}
                              >
                                <View style={styles.itemIconWrap}>
                                  {renderSourceIcon(item.kind, item.fileExt)}
                                </View>
                                <View style={styles.itemInfo}>
                                  <View style={styles.itemTitleRow}>
                                    <Text style={styles.itemTitle} numberOfLines={1}>
                                      {item.title}
                                    </Text>
                                    {item.pinned && (
                                      <PinIcon color={colors.roseText} size={12} filled />
                                    )}
                                  </View>
                                  <Text style={styles.itemMeta}>
                                    {item.fileExt || item.kind.toUpperCase()} · {item.createdAt}
                                  </Text>
                                </View>
                              </TouchableOpacity>

                              <TouchableOpacity
                                style={styles.itemMenuBtn}
                                onPress={() => setActiveItemForMenu(item)}
                              >
                                <MoreVerticalIcon color={colors.muted} size={16} />
                              </TouchableOpacity>
                            </View>
                          ))
                        )}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>

            {/* "+ Add chapter" bottom button */}
            <TouchableOpacity
              style={styles.addChapterDashedBtn}
              activeOpacity={0.8}
              onPress={() => {
                setNewChapterNameInput(`Chapter ${chapters.length + 1}`);
                setShowAddChapterModal(true);
              }}
            >
              <PlusIcon color={colors.roseText} size={16} strokeWidth={2.5} />
              <Text style={styles.addChapterDashedText}>+ Add chapter</Text>
            </TouchableOpacity>
          </ScrollView>

          {/* ================= MODALS & POPUPS ================= */}

          {/* 1. Subject "..." Menu */}
          {showSubjectMenu && (
            <Modal
              transparent
              visible={showSubjectMenu}
              animationType="fade"
              onRequestClose={() => setShowSubjectMenu(false)}
            >
              <View style={styles.modalOverlayCenter}>
                <TouchableOpacity
                  style={styles.backdrop}
                  activeOpacity={1}
                  onPress={() => setShowSubjectMenu(false)}
                />
                <View style={styles.actionMenuCard}>
                  <Text style={styles.actionMenuTitle}>{course.name}</Text>
                  <TouchableOpacity
                    style={styles.actionMenuItem}
                    onPress={handleOpenRenameSubject}
                  >
                    <EditIcon color={colors.ink} size={16} />
                    <Text style={styles.actionMenuItemText}>Rename Subject</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionMenuItem, { borderBottomWidth: 0 }]}
                    onPress={handleDeleteSubjectClick}
                  >
                    <TrashIcon color="#DC2626" size={16} />
                    <Text style={[styles.actionMenuItemText, { color: '#DC2626' }]}>
                      Delete Subject Folder
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          )}

          {/* 2. Rename Subject Modal */}
          {showRenameSubjectModal && (
            <Modal
              transparent
              visible={showRenameSubjectModal}
              animationType="fade"
              onRequestClose={() => setShowRenameSubjectModal(false)}
            >
              <View style={styles.modalOverlayCenter}>
                <TouchableOpacity
                  style={styles.backdrop}
                  activeOpacity={1}
                  onPress={() => setShowRenameSubjectModal(false)}
                />
                <View style={styles.inputDialogCard}>
                  <Text style={styles.inputDialogTitle}>Rename Subject</Text>
                  <TextInput
                    style={styles.dialogInput}
                    value={renameSubjectInput}
                    onChangeText={setRenameSubjectInput}
                    autoFocus
                  />
                  <View style={styles.dialogBtnRow}>
                    <TouchableOpacity
                      style={styles.dialogCancelBtn}
                      onPress={() => setShowRenameSubjectModal(false)}
                    >
                      <Text style={styles.dialogCancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.dialogSaveBtn}
                      onPress={handleSaveRenameSubject}
                    >
                      <Text style={styles.dialogSaveText}>Save</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
          )}

          {/* 3. Add Chapter Modal */}
          {showAddChapterModal && (
            <Modal
              transparent
              visible={showAddChapterModal}
              animationType="fade"
              onRequestClose={() => setShowAddChapterModal(false)}
            >
              <View style={styles.modalOverlayCenter}>
                <TouchableOpacity
                  style={styles.backdrop}
                  activeOpacity={1}
                  onPress={() => setShowAddChapterModal(false)}
                />
                <View style={styles.inputDialogCard}>
                  <Text style={styles.inputDialogTitle}>New Chapter</Text>
                  <TextInput
                    style={styles.dialogInput}
                    placeholder="e.g. Chapter 4 · Stresses in Beams"
                    placeholderTextColor={colors.muted}
                    value={newChapterNameInput}
                    onChangeText={setNewChapterNameInput}
                    autoFocus
                  />
                  <View style={styles.dialogBtnRow}>
                    <TouchableOpacity
                      style={styles.dialogCancelBtn}
                      onPress={() => setShowAddChapterModal(false)}
                    >
                      <Text style={styles.dialogCancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.dialogSaveBtn}
                      onPress={handleSaveNewChapter}
                    >
                      <Text style={styles.dialogSaveText}>Add</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
          )}

          {/* 4. Chapter "..." Menu */}
          {activeChapterForMenu && (
            <Modal
              transparent
              visible={Boolean(activeChapterForMenu)}
              animationType="fade"
              onRequestClose={() => setActiveChapterForMenu(null)}
            >
              <View style={styles.modalOverlayCenter}>
                <TouchableOpacity
                  style={styles.backdrop}
                  activeOpacity={1}
                  onPress={() => setActiveChapterForMenu(null)}
                />
                <View style={styles.actionMenuCard}>
                  <Text style={styles.actionMenuTitle}>{activeChapterForMenu.name}</Text>
                  <TouchableOpacity
                    style={styles.actionMenuItem}
                    onPress={() => {
                      setRenameChapterInput(activeChapterForMenu.name);
                      setShowRenameChapterModal(true);
                    }}
                  >
                    <EditIcon color={colors.ink} size={16} />
                    <Text style={styles.actionMenuItemText}>Rename Chapter</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionMenuItem}
                    onPress={() => handleMoveChapter(activeChapterForMenu, 'up')}
                  >
                    <ChevronRightIcon
                      color={colors.ink}
                      size={15}
                      style={{ transform: [{ rotate: '-90deg' }] }}
                    />
                    <Text style={styles.actionMenuItemText}>Move Up</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionMenuItem}
                    onPress={() => handleMoveChapter(activeChapterForMenu, 'down')}
                  >
                    <ChevronRightIcon
                      color={colors.ink}
                      size={15}
                      style={{ transform: [{ rotate: '90deg' }] }}
                    />
                    <Text style={styles.actionMenuItemText}>Move Down</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionMenuItem, { borderBottomWidth: 0 }]}
                    onPress={() => handleDeleteChapter(activeChapterForMenu)}
                  >
                    <TrashIcon color="#DC2626" size={16} />
                    <Text style={[styles.actionMenuItemText, { color: '#DC2626' }]}>
                      Delete Chapter
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          )}

          {/* 5. Rename Chapter Modal */}
          {showRenameChapterModal && activeChapterForMenu && (
            <Modal
              transparent
              visible={showRenameChapterModal}
              animationType="fade"
              onRequestClose={() => setShowRenameChapterModal(false)}
            >
              <View style={styles.modalOverlayCenter}>
                <TouchableOpacity
                  style={styles.backdrop}
                  activeOpacity={1}
                  onPress={() => setShowRenameChapterModal(false)}
                />
                <View style={styles.inputDialogCard}>
                  <Text style={styles.inputDialogTitle}>Rename Chapter</Text>
                  <TextInput
                    style={styles.dialogInput}
                    value={renameChapterInput}
                    onChangeText={setRenameChapterInput}
                    autoFocus
                  />
                  <View style={styles.dialogBtnRow}>
                    <TouchableOpacity
                      style={styles.dialogCancelBtn}
                      onPress={() => setShowRenameChapterModal(false)}
                    >
                      <Text style={styles.dialogCancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.dialogSaveBtn}
                      onPress={handleSaveRenameChapter}
                    >
                      <Text style={styles.dialogSaveText}>Save</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
          )}

          {/* 6. Item "..." Menu */}
          {activeItemForMenu && (
            <Modal
              transparent
              visible={Boolean(activeItemForMenu)}
              animationType="fade"
              onRequestClose={() => setActiveItemForMenu(null)}
            >
              <View style={styles.modalOverlayCenter}>
                <TouchableOpacity
                  style={styles.backdrop}
                  activeOpacity={1}
                  onPress={() => setActiveItemForMenu(null)}
                />
                <View style={styles.actionMenuCard}>
                  <Text style={styles.actionMenuTitle} numberOfLines={1}>
                    {activeItemForMenu.title}
                  </Text>
                  <TouchableOpacity
                    style={styles.actionMenuItem}
                    onPress={() => handleTogglePin(activeItemForMenu)}
                  >
                    <PinIcon
                      color={colors.roseText}
                      size={16}
                      filled={activeItemForMenu.pinned}
                    />
                    <Text style={styles.actionMenuItemText}>
                      {activeItemForMenu.pinned ? 'Unpin from Top' : 'Pin to Top'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionMenuItem}
                    onPress={() => handleOpenRenameItem(activeItemForMenu)}
                  >
                    <EditIcon color={colors.ink} size={16} />
                    <Text style={styles.actionMenuItemText}>Rename</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionMenuItem}
                    onPress={() => handleOpenMoveModal(activeItemForMenu)}
                  >
                    <ChevronRightIcon color={colors.ink} size={15} />
                    <Text style={styles.actionMenuItemText}>Move to…</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionMenuItem, { borderBottomWidth: 0 }]}
                    onPress={() => handleDeleteItem(activeItemForMenu)}
                  >
                    <TrashIcon color="#DC2626" size={16} />
                    <Text style={[styles.actionMenuItemText, { color: '#DC2626' }]}>
                      Delete
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          )}

          {/* 7. Rename Item Modal */}
          {showRenameItemModal && (
            <Modal
              transparent
              visible={showRenameItemModal}
              animationType="fade"
              onRequestClose={() => setShowRenameItemModal(false)}
            >
              <View style={styles.modalOverlayCenter}>
                <TouchableOpacity
                  style={styles.backdrop}
                  activeOpacity={1}
                  onPress={() => setShowRenameItemModal(false)}
                />
                <View style={styles.inputDialogCard}>
                  <Text style={styles.inputDialogTitle}>Rename Item</Text>
                  <TextInput
                    style={styles.dialogInput}
                    value={renameItemInput}
                    onChangeText={setRenameItemInput}
                    autoFocus
                  />
                  <View style={styles.dialogBtnRow}>
                    <TouchableOpacity
                      style={styles.dialogCancelBtn}
                      onPress={() => setShowRenameItemModal(false)}
                    >
                      <Text style={styles.dialogCancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.dialogSaveBtn}
                      onPress={handleSaveRenameItem}
                    >
                      <Text style={styles.dialogSaveText}>Save</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
          )}

          {/* 8. Move Item Modal */}
          {showMoveItemModal && activeItemForMenu && (
            <Modal
              transparent
              visible={showMoveItemModal}
              animationType="fade"
              onRequestClose={() => setShowMoveItemModal(false)}
            >
              <View style={styles.modalOverlayCenter}>
                <TouchableOpacity
                  style={styles.backdrop}
                  activeOpacity={1}
                  onPress={() => setShowMoveItemModal(false)}
                />
                <View style={[styles.inputDialogCard, { maxHeight: 420 }]}>
                  <Text style={styles.inputDialogTitle}>Move to…</Text>
                  <Text style={styles.dialogSubtitle}>
                    Moving "{activeItemForMenu.title}"
                  </Text>

                  {/* Subject selector */}
                  <Text style={styles.fieldHeading}>Select Subject:</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ maxHeight: 40, marginBottom: 8 }}
                  >
                    {allCourses.map((c) => {
                      const isSelected = c.id === targetMoveSubjectId;
                      return (
                        <TouchableOpacity
                          key={c.id}
                          style={[
                            styles.movePill,
                            isSelected && styles.movePillSelected,
                          ]}
                          onPress={() => handleSelectMoveSubject(c.id)}
                        >
                          <Text
                            style={[
                              styles.movePillText,
                              isSelected && styles.movePillTextSelected,
                            ]}
                          >
                            {c.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>

                  {/* Chapter selector */}
                  <Text style={styles.fieldHeading}>Select Chapter:</Text>
                  <ScrollView style={{ maxHeight: 150 }} showsVerticalScrollIndicator>
                    {/* Unsorted option */}
                    <TouchableOpacity
                      style={[
                        styles.targetChapterItem,
                        targetMoveChapterId === undefined &&
                          styles.targetChapterItemSelected,
                      ]}
                      onPress={() => setTargetMoveChapterId(undefined)}
                    >
                      <Text
                        style={[
                          styles.targetChapterText,
                          targetMoveChapterId === undefined &&
                            styles.targetChapterTextSelected,
                        ]}
                      >
                        Unsorted
                      </Text>
                    </TouchableOpacity>

                    {targetMoveChaptersList.map((ch) => {
                      const isSelected = ch.id === targetMoveChapterId;
                      return (
                        <TouchableOpacity
                          key={ch.id}
                          style={[
                            styles.targetChapterItem,
                            isSelected && styles.targetChapterItemSelected,
                          ]}
                          onPress={() => setTargetMoveChapterId(ch.id)}
                        >
                          <Text
                            style={[
                              styles.targetChapterText,
                              isSelected && styles.targetChapterTextSelected,
                            ]}
                          >
                            {ch.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>

                  <View style={styles.dialogBtnRow}>
                    <TouchableOpacity
                      style={styles.dialogCancelBtn}
                      onPress={() => setShowMoveItemModal(false)}
                    >
                      <Text style={styles.dialogCancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.dialogSaveBtn}
                      onPress={handleConfirmMoveItem}
                    >
                      <Text style={styles.dialogSaveText}>Move</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
          )}

          {/* 9. Note Editor Modal */}
          {showNoteEditor && (
            <Modal
              transparent
              visible={showNoteEditor}
              animationType="slide"
              onRequestClose={() => setShowNoteEditor(false)}
            >
              <View style={styles.modalOverlayCenter}>
                <TouchableOpacity
                  style={styles.backdrop}
                  activeOpacity={1}
                  onPress={() => setShowNoteEditor(false)}
                />
                <View style={[styles.inputDialogCard, { maxHeight: 480 }]}>
                  <Text style={styles.inputDialogTitle}>Create Note</Text>
                  <TextInput
                    style={styles.dialogInput}
                    placeholder="Note title (e.g. Chapter Summary & Derivations)"
                    placeholderTextColor={colors.muted}
                    value={noteTitle}
                    onChangeText={setNoteTitle}
                    autoFocus
                  />
                  <TextInput
                    style={[styles.dialogInput, { height: 160, textAlignVertical: 'top' }]}
                    placeholder="Type or paste study notes, formulas, or concepts..."
                    placeholderTextColor={colors.muted}
                    value={noteBody}
                    onChangeText={setNoteBody}
                    multiline
                  />
                  <View style={styles.dialogBtnRow}>
                    <TouchableOpacity
                      style={styles.dialogCancelBtn}
                      onPress={() => setShowNoteEditor(false)}
                    >
                      <Text style={styles.dialogCancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.dialogSaveBtn}
                      onPress={handleSaveNote}
                    >
                      <Text style={styles.dialogSaveText}>Save Note</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
          )}

          {/* 10. Add Link Modal */}
          {showAddLinkModal && (
            <Modal
              transparent
              visible={showAddLinkModal}
              animationType="fade"
              onRequestClose={() => setShowAddLinkModal(false)}
            >
              <View style={styles.modalOverlayCenter}>
                <TouchableOpacity
                  style={styles.backdrop}
                  activeOpacity={1}
                  onPress={() => setShowAddLinkModal(false)}
                />
                <View style={styles.inputDialogCard}>
                  <Text style={styles.inputDialogTitle}>Add Web Link</Text>
                  <TextInput
                    style={styles.dialogInput}
                    placeholder="Link Title (e.g. Video Lecture on Torsion)"
                    placeholderTextColor={colors.muted}
                    value={linkTitle}
                    onChangeText={setLinkTitle}
                    autoFocus
                  />
                  <TextInput
                    style={styles.dialogInput}
                    placeholder="URL (e.g. https://youtube.com/...)"
                    placeholderTextColor={colors.muted}
                    value={linkUrl}
                    onChangeText={setLinkUrl}
                    autoCapitalize="none"
                  />
                  <View style={styles.dialogBtnRow}>
                    <TouchableOpacity
                      style={styles.dialogCancelBtn}
                      onPress={() => setShowAddLinkModal(false)}
                    >
                      <Text style={styles.dialogCancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.dialogSaveBtn}
                      onPress={handleSaveLink}
                    >
                      <Text style={styles.dialogSaveText}>Add Link</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
          )}

          {/* 11. Item Preview Modal */}
          {activePreviewSource && (
            <Modal
              transparent
              visible={Boolean(activePreviewSource)}
              animationType="slide"
              onRequestClose={() => setActivePreviewSource(null)}
            >
              <View style={styles.modalOverlayCenter}>
                <TouchableOpacity
                  style={styles.backdrop}
                  activeOpacity={1}
                  onPress={() => setActivePreviewSource(null)}
                />
                <View style={[styles.inputDialogCard, { maxHeight: 480 }]}>
                  <View style={styles.previewHeader}>
                    <View style={styles.previewIconWrap}>
                      {renderSourceIcon(
                        activePreviewSource.kind,
                        activePreviewSource.fileExt
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputDialogTitle}>
                        {activePreviewSource.title}
                      </Text>
                      <Text style={styles.dialogSubtitle}>
                        {activePreviewSource.fileExt || activePreviewSource.kind.toUpperCase()} ·{' '}
                        {activePreviewSource.createdAt}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.closeBtn}
                      onPress={() => setActivePreviewSource(null)}
                    >
                      <CloseIcon color={colors.muted} size={16} />
                    </TouchableOpacity>
                  </View>

                  <ScrollView style={styles.previewContentScroll}>
                    {activePreviewSource.noteBody ? (
                      <Text style={styles.previewBodyText}>
                        {activePreviewSource.noteBody}
                      </Text>
                    ) : (
                      <View style={styles.previewPlaceholderBox}>
                        <Text style={styles.previewPlaceholderTitle}>
                          Document Preview Available
                        </Text>
                        <Text style={styles.previewPlaceholderDesc}>
                          This file ({activePreviewSource.fileExt}) is synced and ready to review.
                          You can generate flashcards and summaries from this source.
                        </Text>
                      </View>
                    )}
                  </ScrollView>

                  <View style={styles.previewFooterRow}>
                    <TouchableOpacity
                      style={styles.previewPinBtn}
                      onPress={() => handleTogglePin(activePreviewSource)}
                    >
                      <PinIcon
                        color={colors.roseText}
                        size={14}
                        filled={activePreviewSource.pinned}
                      />
                      <Text style={styles.previewPinText}>
                        {activePreviewSource.pinned ? 'Pinned' : 'Pin File'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.dialogSaveBtn}
                      onPress={() => setActivePreviewSource(null)}
                    >
                      <Text style={styles.dialogSaveText}>Done</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
          )}
        </GestureHandlerRootView>
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
    maxHeight: '92%',
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
    marginBottom: 12,
  },
  headerInfo: {
    flex: 1,
    paddingRight: 12,
  },
  headerBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  programName: {
    fontSize: 12,
    fontFamily: typography.fontFamily.medium,
    color: colors.muted,
  },
  clusterBadge: {
    backgroundColor: colors.pinkSoft,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radii.badge,
    borderWidth: 1,
    borderColor: colors.pinkLine,
  },
  clusterBadgeText: {
    fontSize: 10,
    fontFamily: typography.fontFamily.bold,
    color: colors.roseText,
  },
  title: {
    fontSize: 18,
    fontFamily: typography.fontFamily.bold,
    color: colors.ink,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: typography.fontFamily.regular,
    color: colors.muted,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  menuIconBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: colors.bg,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: colors.bg,
  },
  masteryCard: {
    backgroundColor: colors.pinkSoft,
    borderRadius: radii.cardSmall,
    padding: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: colors.pinkLine,
    marginBottom: 12,
  },
  masteryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  masteryLabel: {
    fontSize: 12,
    fontFamily: typography.fontFamily.bold,
    color: colors.roseText,
  },
  masteryValue: {
    fontSize: 12,
    fontFamily: typography.fontFamily.monoBold,
    color: colors.roseText,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: 'rgba(168, 50, 93, 0.15)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  scrollContent: {
    paddingBottom: 24,
    gap: 12,
  },
  unsortedSection: {
    backgroundColor: colors.bg,
    borderRadius: radii.cardSmall,
    borderWidth: 1,
    borderColor: colors.pinkLine,
    overflow: 'hidden',
  },
  unsortedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  unsortedTitle: {
    fontSize: 14,
    fontFamily: typography.fontFamily.bold,
    color: colors.ink,
  },
  countBadge: {
    backgroundColor: colors.surface,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.pinkLine,
  },
  countBadgeText: {
    fontSize: 11,
    fontFamily: typography.fontFamily.monoMedium,
    color: colors.muted,
  },
  addInlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: colors.pinkSoft,
  },
  addInlineText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.bold,
    color: colors.roseText,
  },
  chaptersSection: {
    gap: 10,
  },
  chapterCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.cardSmall,
    borderWidth: 1,
    borderColor: colors.pinkLine,
    overflow: 'hidden',
  },
  chapterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.bg,
  },
  chapterHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  chapterTitleWrap: {
    flex: 1,
  },
  chapterName: {
    fontSize: 14,
    fontFamily: typography.fontFamily.bold,
    color: colors.ink,
  },
  chapterSubCount: {
    fontSize: 11,
    fontFamily: typography.fontFamily.regular,
    color: colors.muted,
  },
  chapterHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chMenuBtn: {
    padding: 4,
  },
  inlineAddPickerCard: {
    backgroundColor: colors.pinkSoft,
    padding: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.pinkLine,
    gap: 8,
  },
  inlinePickerTitle: {
    fontSize: 12,
    fontFamily: typography.fontFamily.bold,
    color: colors.roseText,
  },
  inlinePickerButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inlinePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.pinkLine,
  },
  inlinePickerBtnText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.medium,
    color: colors.ink,
  },
  inlinePickerCancel: {
    marginLeft: 'auto',
    padding: 4,
  },
  itemsListContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  emptyChapterBox: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  emptyChapterText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.regular,
    color: colors.muted,
    textAlign: 'center',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.pinkLine,
  },
  itemRowMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  itemIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.pinkLine,
  },
  itemInfo: {
    flex: 1,
  },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemTitle: {
    fontSize: 13,
    fontFamily: typography.fontFamily.medium,
    color: colors.ink,
    flex: 1,
  },
  itemMeta: {
    fontSize: 11,
    fontFamily: typography.fontFamily.regular,
    color: colors.muted,
  },
  itemMenuBtn: {
    padding: 6,
  },
  addChapterDashedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: radii.cardSmall,
    borderWidth: 1.5,
    borderColor: colors.rose,
    borderStyle: 'dashed',
    backgroundColor: colors.pinkSoft,
    marginTop: 6,
  },
  addChapterDashedText: {
    fontSize: 13,
    fontFamily: typography.fontFamily.bold,
    color: colors.roseText,
  },
  modalOverlayCenter: {
    flex: 1,
    backgroundColor: 'rgba(58, 37, 48, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  actionMenuCard: {
    width: '100%',
    maxWidth: 280,
    backgroundColor: colors.surface,
    borderRadius: radii.cardSmall,
    padding: 8,
    borderWidth: 1,
    borderColor: colors.pinkLine,
    ...Platform.select({
      ios: { shadowColor: colors.ink, shadowOpacity: 0.15, shadowRadius: 10 },
      android: { elevation: 6 },
    }),
  },
  actionMenuTitle: {
    fontSize: 13,
    fontFamily: typography.fontFamily.bold,
    color: colors.muted,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.pinkLine,
  },
  actionMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.pinkLine,
  },
  actionMenuItemText: {
    fontSize: 13,
    fontFamily: typography.fontFamily.medium,
    color: colors.ink,
  },
  inputDialogCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.pinkLine,
    gap: 12,
  },
  inputDialogTitle: {
    fontSize: 16,
    fontFamily: typography.fontFamily.bold,
    color: colors.ink,
  },
  dialogSubtitle: {
    fontSize: 12,
    fontFamily: typography.fontFamily.regular,
    color: colors.muted,
  },
  dialogInput: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.pinkLine,
    borderRadius: radii.input,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    fontFamily: typography.fontFamily.regular,
    color: colors.ink,
  },
  dialogBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 4,
  },
  dialogCancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  dialogCancelText: {
    fontSize: 13,
    fontFamily: typography.fontFamily.medium,
    color: colors.muted,
  },
  dialogSaveBtn: {
    backgroundColor: colors.rose,
    borderRadius: radii.buttonSmall,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  dialogSaveText: {
    fontSize: 13,
    fontFamily: typography.fontFamily.bold,
    color: '#FFFFFF',
  },
  fieldHeading: {
    fontSize: 12,
    fontFamily: typography.fontFamily.bold,
    color: colors.ink,
  },
  movePill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.pinkLine,
    backgroundColor: colors.bg,
    marginRight: 6,
  },
  movePillSelected: {
    backgroundColor: colors.rose,
    borderColor: colors.rose,
  },
  movePillText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.medium,
    color: colors.muted,
  },
  movePillTextSelected: {
    color: '#FFFFFF',
    fontFamily: typography.fontFamily.bold,
  },
  targetChapterItem: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.pinkLine,
  },
  targetChapterItemSelected: {
    backgroundColor: colors.pinkSoft,
  },
  targetChapterText: {
    fontSize: 13,
    fontFamily: typography.fontFamily.regular,
    color: colors.ink,
  },
  targetChapterTextSelected: {
    fontFamily: typography.fontFamily.bold,
    color: colors.roseText,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  previewIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.pinkLine,
  },
  previewContentScroll: {
    maxHeight: 220,
    paddingVertical: 6,
  },
  previewBodyText: {
    fontSize: 13,
    fontFamily: typography.fontFamily.regular,
    color: colors.ink,
    lineHeight: 20,
  },
  previewPlaceholderBox: {
    backgroundColor: colors.bg,
    borderRadius: radii.cardSmall,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.pinkLine,
    gap: 6,
  },
  previewPlaceholderTitle: {
    fontSize: 13,
    fontFamily: typography.fontFamily.bold,
    color: colors.ink,
  },
  previewPlaceholderDesc: {
    fontSize: 12,
    fontFamily: typography.fontFamily.regular,
    color: colors.muted,
    lineHeight: 18,
  },
  previewFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  previewPinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.buttonSmall,
    backgroundColor: colors.pinkSoft,
  },
  previewPinText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.bold,
    color: colors.roseText,
  },
});
