import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { TabScreenProps } from '../navigation/types';
import { colors, typography, radii, spacing } from '../theme';
import {
  SearchIcon,
  PlusIcon,
  ChevronRightIcon,
  RefreshIcon,
  PinIcon,
  FileTextIcon,
  LinkIcon,
  CameraIcon,
  CardsIcon,
  BookOpenIcon,
  CloseIcon,
  MoreVerticalIcon,
} from '../components/Icons';
import { useCourses } from '../hooks/useCourses';
import { progressService } from '../services/progressService';
import { Course, Primer, Source, Cluster, SourceKind } from '../types';
import { PrimerReaderModal } from '../components/PrimerReaderModal';
import { StudyAddSheetModal } from '../components/StudyAddSheetModal';
import { NewCourseModal } from '../components/NewCourseModal';
import { CourseChaptersModal } from '../components/CourseChaptersModal';

export const StudyScreen: React.FC<TabScreenProps<'Study'>> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');

  const {
    programs,
    courses,
    cluster,
    setCluster,
    primers,
    pinnedSources,
    recentSources,
    retentionStats,
    loading,
    addProgram,
    deleteProgram,
    addSubject,
    renameSubject,
    deleteSubject,
    addChapter,
    renameChapter,
    deleteChapter,
    reorderChapters,
    togglePinSource,
    renameSource,
    moveSource,
    deleteSource,
    reorderChapterSources,
    addSource,
  } = useCourses(undefined, 'All');

  // Modals state
  const [activePrimer, setActivePrimer] = useState<Primer | null>(null);
  const [activeCourseFolder, setActiveCourseFolder] = useState<Course | null>(null);
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [showNewCourseModal, setShowNewCourseModal] = useState(false);
  const [showAllPrimersModal, setShowAllPrimersModal] = useState(false);
  const [activePinnedFilePreview, setActivePinnedFilePreview] = useState<Source | null>(null);

  // Available clusters: only clusters used by at least one subject, plus 'All'
  const availableClusters = useMemo(() => {
    const used = new Set<string>();
    courses.forEach((c) => {
      if (c.cluster) used.add(c.cluster);
    });
    // Keep a consistent order: PSAD, HGE, MSTE, Other if present
    const standardOrder: Cluster[] = ['PSAD', 'HGE', 'MSTE', 'Other'];
    const sortedUsed = standardOrder.filter((cl) => used.has(cl));
    return ['All', ...sortedUsed];
  }, [courses]);

  // Search filtering across courses, primers, sources by title/label
  const isSearching = searchQuery.trim().length > 0;
  const searchResults = useMemo(() => {
    if (!isSearching) return null;
    const q = searchQuery.trim().toLowerCase();

    const matchingCourses = courses.filter((c) =>
      c.name.toLowerCase().includes(q) || (c.cluster && c.cluster.toLowerCase().includes(q))
    );
    const matchingPrimers = primers.filter((p) =>
      p.title.toLowerCase().includes(q) || p.summary.toLowerCase().includes(q)
    );
    const matchingSources = recentSources.filter((s) =>
      s.title.toLowerCase().includes(q)
    );

    const totalMatches =
      matchingCourses.length +
      matchingPrimers.length +
      matchingSources.length;

    return {
      courses: matchingCourses,
      primers: matchingPrimers,
      sources: matchingSources,
      totalMatches,
    };
  }, [isSearching, searchQuery, courses, primers, recentSources]);

  // Render file icon helper
  const renderSourceIcon = (kind: SourceKind, fileExt?: string) => {
    switch (kind) {
      case 'pdf':
        return <FileTextIcon color="#DC2626" size={18} />;
      case 'file':
        if (fileExt?.toUpperCase() === 'PPTX' || fileExt?.toUpperCase() === 'PPT') {
          return <FileTextIcon color="#EA580C" size={18} />;
        }
        if (fileExt?.toUpperCase() === 'XLSX' || fileExt?.toUpperCase() === 'XLS') {
          return <FileTextIcon color="#16A34A" size={18} />;
        }
        return <FileTextIcon color={colors.blue} size={18} />;
      case 'note':
        return <FileTextIcon color="#7C3AED" size={18} />;
      case 'link':
        return <LinkIcon color={colors.roseText} size={18} />;
      case 'photo':
        return <CameraIcon color="#0D9488" size={18} />;
      default:
        return <FileTextIcon color={colors.muted} size={18} />;
    }
  };

  const getCourseName = (courseId: string) => {
    return courses.find((c) => c.id === courseId)?.name || 'General';
  };

  const getCourseCluster = (courseId: string) => {
    return courses.find((c) => c.id === courseId)?.cluster;
  };

  const handleCreateNewFolder = async (data: {
    name: string;
    programId: string;
    cluster?: Cluster;
  }) => {
    const created = await addSubject(data);
    // On create: navigate straight into the new folder's chapter view!
    setActiveCourseFolder(created);
    return created;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Header with Title and round "+" Button */}
        <View style={styles.header}>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Study</Text>
            <Text style={styles.headerSub}>Sources, materials, and course folders</Text>
          </View>
          <TouchableOpacity
            style={styles.addRoundBtn}
            activeOpacity={0.8}
            onPress={() => setShowAddSheet(true)}
            accessibilityLabel="Add study material"
          >
            <PlusIcon color="#FFFFFF" size={20} strokeWidth={2.8} />
          </TouchableOpacity>
        </View>

        {/* 2. Search Bar */}
        <View style={styles.searchBar}>
          <SearchIcon color={colors.muted} size={18} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search concepts, files, or course folders…"
            placeholderTextColor={colors.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <CloseIcon color={colors.muted} size={16} />
            </TouchableOpacity>
          )}
        </View>

        {/* ================= SEARCH RESULTS VIEW ================= */}
        {isSearching && searchResults ? (
          <View style={styles.searchSection}>
            <Text style={styles.searchCountText}>
              Found {searchResults.totalMatches} result{searchResults.totalMatches === 1 ? '' : 's'} for "{searchQuery}"
            </Text>

            {/* Matching Courses */}
            {searchResults.courses.length > 0 && (
              <View style={styles.searchGroup}>
                <Text style={styles.searchGroupTitle}>Course Folders</Text>
                {searchResults.courses.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={styles.searchResultItem}
                    onPress={() => {
                      setActiveCourseFolder(c);
                      setSearchQuery('');
                    }}
                  >
                    <View style={styles.folderMiniIcon}>
                      <BookOpenIcon color={colors.roseText} size={16} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.searchResultTitle}>{c.name}</Text>
                      <Text style={styles.searchResultSub}>
                        {c.cluster ? `${c.cluster} · ` : ''}{c.chaptersCount || 0} chapters · {c.sourcesCount || 0} files
                      </Text>
                    </View>
                    <ChevronRightIcon color={colors.muted} size={16} />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Matching Primers */}
            {searchResults.primers.length > 0 && (
              <View style={styles.searchGroup}>
                <Text style={styles.searchGroupTitle}>High-Yield Primers</Text>
                {searchResults.primers.map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    style={styles.searchResultItem}
                    onPress={() => {
                      setActivePrimer(p);
                      setSearchQuery('');
                    }}
                  >
                    <View style={styles.primerMiniIcon}>
                      <BookOpenIcon color="#0D9488" size={16} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.searchResultTitle}>{p.title}</Text>
                      <Text style={styles.searchResultSub} numberOfLines={1}>
                        {p.readMinutes} min read · {p.summary}
                      </Text>
                    </View>
                    <ChevronRightIcon color={colors.muted} size={16} />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Matching Sources / Files */}
            {searchResults.sources.length > 0 && (
              <View style={styles.searchGroup}>
                <Text style={styles.searchGroupTitle}>Files & Notes</Text>
                {searchResults.sources.map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    style={styles.searchResultItem}
                    onPress={() => {
                      setActivePinnedFilePreview(s);
                      setSearchQuery('');
                    }}
                  >
                    <View style={styles.sourceMiniIcon}>
                      {renderSourceIcon(s.kind, s.fileExt)}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.searchResultTitle}>{s.title}</Text>
                      <Text style={styles.searchResultSub}>
                        {getCourseName(s.courseId)} · {s.createdAt}
                      </Text>
                    </View>
                    <ChevronRightIcon color={colors.muted} size={16} />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {searchResults.totalMatches === 0 && (
              <View style={styles.noResultsBox}>
                <Text style={styles.noResultsText}>No materials found matching "{searchQuery}"</Text>
              </View>
            )}
          </View>
        ) : (
          /* ================= STANDARD STUDY CONTENT ================= */
          <>
            {/* 3. Cluster Filter Pills */}
            <View style={styles.clusterPillsWrap}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.clusterPillsScroll}
              >
                {availableClusters.map((cl) => {
                  const isSelected = cl === cluster;
                  return (
                    <TouchableOpacity
                      key={cl}
                      style={[
                        styles.clusterPill,
                        isSelected && styles.clusterPillSelected,
                      ]}
                      onPress={() => setCluster(cl)}
                      activeOpacity={0.75}
                    >
                      <Text
                        style={[
                          styles.clusterPillText,
                          isSelected && styles.clusterPillTextSelected,
                        ]}
                      >
                        {cl}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* 4. Retention Banner (compact, one card) */}
            <View style={styles.retentionBanner}>
              <View style={styles.retentionLeft}>
                <View style={styles.retentionHeaderRow}>
                  <View style={styles.cardsDueBadge}>
                    <Text style={styles.cardsDueBadgeText}>
                      {retentionStats.totalDue} cards due today
                    </Text>
                  </View>
                </View>
                {/* Per-cluster counts */}
                <View style={styles.retentionClusterRow}>
                  {Object.entries(retentionStats.clusterCounts).map(([cl, count]) => (
                    <Text key={cl} style={styles.retentionClusterText}>
                      <Text style={{ fontFamily: typography.fontFamily.bold }}>{count}</Text> {cl}
                    </Text>
                  ))}
                </View>
              </View>

              <TouchableOpacity
                style={styles.reviewBtn}
                activeOpacity={0.85}
                onPress={() => {
                  navigation.navigate('Practice');
                }}
              >
                <RefreshIcon color="#FFFFFF" size={13} strokeWidth={2.5} />
                <Text style={styles.reviewBtnText}>Review (~5 min)</Text>
              </TouchableOpacity>
            </View>

            {/* 5. High-Yield Primers */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>High-Yield Primers</Text>
              <TouchableOpacity onPress={() => setShowAllPrimersModal(true)}>
                <Text style={styles.sectionLink}>Browse all</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.primersScroll}
            >
              {primers.map((primer) => {
                const primerCluster = getCourseCluster(primer.courseId);
                return (
                  <TouchableOpacity
                    key={primer.id}
                    style={styles.primerCard}
                    activeOpacity={0.8}
                    onPress={() => setActivePrimer(primer)}
                  >
                    <View style={styles.primerCardHeader}>
                      {primerCluster && (
                        <View style={styles.clusterBadge}>
                          <Text style={styles.clusterBadgeText}>{primerCluster}</Text>
                        </View>
                      )}
                      <Text style={styles.readTimeText}>{primer.readMinutes} min read</Text>
                    </View>
                    <Text style={styles.primerCardTitle} numberOfLines={2}>
                      {primer.title}
                    </Text>
                    <Text style={styles.primerCardSummary} numberOfLines={2}>
                      {primer.summary}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* 6. Pinned Files Strip */}
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleWithIcon}>
                <PinIcon color={colors.roseText} size={15} filled />
                <Text style={styles.sectionTitle}>Pinned Files</Text>
              </View>
              <Text style={styles.sectionSubCount}>
                {pinnedSources.length} pinned
              </Text>
            </View>

            {pinnedSources.length === 0 ? (
              <View style={styles.emptyPinnedBox}>
                <Text style={styles.emptyPinnedText}>
                  No pinned files yet. Tap "..." on any worksheet, PPT, PDF, or note to pin it here.
                </Text>
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.pinnedFilesScroll}
              >
                {pinnedSources.map((source) => (
                  <TouchableOpacity
                    key={source.id}
                    style={styles.pinnedFileChip}
                    activeOpacity={0.8}
                    onPress={() => setActivePinnedFilePreview(source)}
                  >
                    <View style={styles.pinnedFileIconWrap}>
                      {renderSourceIcon(source.kind, source.fileExt)}
                    </View>
                    <View style={styles.pinnedFileInfo}>
                      <Text style={styles.pinnedFileName} numberOfLines={1}>
                        {source.title}
                      </Text>
                      <Text style={styles.pinnedFileSubject} numberOfLines={1}>
                        {getCourseName(source.courseId)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {/* 7. Course Folders (2-column Grid) */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Course Folders</Text>
              <Text style={styles.sectionSubCount}>
                {courses.length} {courses.length === 1 ? 'folder' : 'folders'}
              </Text>
            </View>

            <View style={styles.courseGrid}>
              {courses.map((course) => {
                const mastery = progressService.getCourseMastery(course.id);
                const hasDeck = Boolean(course.cardsCount && course.cardsCount > 0);

                return (
                  <TouchableOpacity
                    key={course.id}
                    style={styles.courseFolderCard}
                    activeOpacity={0.8}
                    onPress={() => setActiveCourseFolder(course)}
                  >
                    <View style={styles.folderCardTop}>
                      {course.cluster ? (
                        <View style={styles.clusterBadge}>
                          <Text style={styles.clusterBadgeText}>{course.cluster}</Text>
                        </View>
                      ) : (
                        <View style={{ height: 20 }} />
                      )}
                    </View>

                    <Text style={styles.folderCardName} numberOfLines={2}>
                      {course.name}
                    </Text>

                    {/* Slim mastery bar only if subject has flashcards */}
                    {hasDeck ? (
                      <View style={styles.folderMasteryWrap}>
                        <View style={styles.masteryBarBg}>
                          <View
                            style={[
                              styles.masteryBarFill,
                              { width: `${mastery}%`, backgroundColor: colors.rose },
                            ]}
                          />
                        </View>
                        <Text style={styles.masteryText}>{mastery}% mastered</Text>
                      </View>
                    ) : (
                      <View style={{ height: 18 }} />
                    )}

                    <Text style={styles.folderCardMeta}>
                      {course.chaptersCount || 3} ch · {course.sourcesCount || 0} files
                      {hasDeck ? ` · ${course.cardsCount} cards` : ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              {/* "+ New class folder" dashed card */}
              <TouchableOpacity
                style={styles.newFolderDashedCard}
                activeOpacity={0.8}
                onPress={() => setShowNewCourseModal(true)}
              >
                <View style={styles.newFolderIconCircle}>
                  <PlusIcon color={colors.roseText} size={18} strokeWidth={2.8} />
                </View>
                <Text style={styles.newFolderText}>+ New class folder</Text>
              </TouchableOpacity>
            </View>

            {/* 8. Recently Added Sources */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recently Added</Text>
              <Text style={styles.sectionSubCount}>
                {recentSources.length} items
              </Text>
            </View>

            <View style={styles.recentSourcesList}>
              {recentSources.map((source) => {
                const sCluster = getCourseCluster(source.courseId);
                return (
                  <View key={source.id} style={styles.recentSourceItem}>
                    <TouchableOpacity
                      style={styles.recentSourceMain}
                      activeOpacity={0.8}
                      onPress={() => setActivePinnedFilePreview(source)}
                    >
                      <View style={styles.sourceTypeIconCircle}>
                        {renderSourceIcon(source.kind, source.fileExt)}
                      </View>

                      <View style={styles.sourceDetails}>
                        <View style={styles.sourceTitleRow}>
                          <Text style={styles.sourceTitle} numberOfLines={1}>
                            {source.title}
                          </Text>
                          {source.pinned && (
                            <PinIcon color={colors.roseText} size={13} filled />
                          )}
                        </View>
                        <Text style={styles.sourceMeta}>
                          {sCluster ? `${sCluster} · ` : ''}{getCourseName(source.courseId)} · {source.createdAt}
                        </Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.pinToggleBtn}
                      onPress={() => togglePinSource(source.id)}
                      accessibilityLabel="Pin/unpin file"
                    >
                      <PinIcon
                        color={source.pinned ? colors.roseText : colors.muted}
                        size={15}
                        filled={source.pinned}
                      />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>

      {/* ================= MODALS ================= */}

      {/* Primer Reader Modal */}
      <PrimerReaderModal
        visible={Boolean(activePrimer)}
        primer={activePrimer}
        onClose={() => setActivePrimer(null)}
      />

      {/* Browse All Primers Modal */}
      <Modal
        visible={showAllPrimersModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAllPrimersModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={() => setShowAllPrimersModal(false)}
          />
          <View style={styles.sheetContainer}>
            <View style={styles.grabHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>All High-Yield Primers</Text>
              <TouchableOpacity onPress={() => setShowAllPrimersModal(false)}>
                <CloseIcon color={colors.muted} size={18} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ gap: 10, paddingBottom: 24 }}>
              {primers.map((p) => {
                const cl = getCourseCluster(p.courseId);
                return (
                  <TouchableOpacity
                    key={p.id}
                    style={styles.allPrimersItem}
                    onPress={() => {
                      setShowAllPrimersModal(false);
                      setActivePrimer(p);
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        {cl && (
                          <View style={styles.clusterBadge}>
                            <Text style={styles.clusterBadgeText}>{cl}</Text>
                          </View>
                        )}
                        <Text style={styles.readTimeText}>{p.readMinutes} min read</Text>
                      </View>
                      <Text style={styles.searchResultTitle}>{p.title}</Text>
                      <Text style={styles.searchResultSub} numberOfLines={2}>
                        {p.summary}
                      </Text>
                    </View>
                    <ChevronRightIcon color={colors.muted} size={16} />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Add Study Material Bottom Sheet */}
      <StudyAddSheetModal
        visible={showAddSheet}
        courses={courses}
        onClose={() => setShowAddSheet(false)}
        onAddSource={addSource}
      />

      {/* New Course Folder Modal */}
      <NewCourseModal
        visible={showNewCourseModal}
        programs={programs}
        courses={courses}
        onClose={() => setShowNewCourseModal(false)}
        onCreateSubject={handleCreateNewFolder}
        onAddProgram={addProgram}
        onDeleteProgram={deleteProgram}
      />

      {/* Course Chapters / Folder View Modal */}
      <CourseChaptersModal
        visible={Boolean(activeCourseFolder)}
        course={activeCourseFolder}
        programs={programs}
        allCourses={courses}
        onClose={() => setActiveCourseFolder(null)}
        onRenameSubject={renameSubject}
        onDeleteSubject={deleteSubject}
        onAddChapter={addChapter}
        onRenameChapter={renameChapter}
        onDeleteChapter={deleteChapter}
        onReorderChapters={reorderChapters}
        onAddSource={addSource}
        onRenameSource={renameSource}
        onMoveSource={moveSource}
        onTogglePinSource={togglePinSource}
        onDeleteSource={deleteSource}
        onReorderChapterSources={reorderChapterSources}
      />

      {/* Pinned File Direct Preview Modal */}
      {activePinnedFilePreview && (
        <Modal
          transparent
          visible={Boolean(activePinnedFilePreview)}
          animationType="slide"
          onRequestClose={() => setActivePinnedFilePreview(null)}
        >
          <View style={styles.modalOverlayCenter}>
            <TouchableOpacity
              style={styles.backdrop}
              activeOpacity={1}
              onPress={() => setActivePinnedFilePreview(null)}
            />
            <View style={styles.filePreviewCard}>
              <View style={styles.filePreviewHeader}>
                <View style={styles.filePreviewIconWrap}>
                  {renderSourceIcon(
                    activePinnedFilePreview.kind,
                    activePinnedFilePreview.fileExt
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.filePreviewTitle}>
                    {activePinnedFilePreview.title}
                  </Text>
                  <Text style={styles.filePreviewSub}>
                    {getCourseName(activePinnedFilePreview.courseId)} ·{' '}
                    {activePinnedFilePreview.fileExt || activePinnedFilePreview.kind.toUpperCase()} ·{' '}
                    {activePinnedFilePreview.createdAt}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.closeBtnSmall}
                  onPress={() => setActivePinnedFilePreview(null)}
                >
                  <CloseIcon color={colors.muted} size={16} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.filePreviewBodyScroll}>
                {activePinnedFilePreview.noteBody ? (
                  <Text style={styles.filePreviewNoteBody}>
                    {activePinnedFilePreview.noteBody}
                  </Text>
                ) : (
                  <View style={styles.filePreviewPlaceholder}>
                    <Text style={styles.previewPlaceholderTitle}>
                      Document Preview
                    </Text>
                    <Text style={styles.previewPlaceholderDesc}>
                      {activePinnedFilePreview.title} ({activePinnedFilePreview.fileExt || 'FILE'}) is pinned to your Study board.
                    </Text>
                  </View>
                )}
              </ScrollView>

              <View style={styles.filePreviewFooter}>
                <TouchableOpacity
                  style={styles.previewPinActionBtn}
                  onPress={() => {
                    togglePinSource(activePinnedFilePreview.id);
                    setActivePinnedFilePreview((prev) =>
                      prev ? { ...prev, pinned: !prev.pinned } : null
                    );
                  }}
                >
                  <PinIcon
                    color={colors.roseText}
                    size={14}
                    filled={activePinnedFilePreview.pinned}
                  />
                  <Text style={styles.previewPinActionText}>
                    {activePinnedFilePreview.pinned ? 'Pinned' : 'Pin File'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.openInFolderBtn}
                  onPress={() => {
                    const targetCourse = courses.find(
                      (c) => c.id === activePinnedFilePreview.courseId
                    );
                    setActivePinnedFilePreview(null);
                    if (targetCourse) {
                      setActiveCourseFolder(targetCourse);
                    }
                  }}
                >
                  <Text style={styles.openInFolderBtnText}>Open in Folder</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollContent: {
    paddingHorizontal: spacing.screenPaddingHorizontal,
    paddingBottom: 40,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: typography.fontFamily.bold,
    color: colors.ink,
  },
  headerSub: {
    fontSize: 12,
    fontFamily: typography.fontFamily.regular,
    color: colors.muted,
    marginTop: 2,
  },
  addRoundBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.rose,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: colors.rose,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 5,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.input,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.pinkLine,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: typography.fontFamily.regular,
    color: colors.ink,
    padding: 0,
  },
  clusterPillsWrap: {
    marginHorizontal: -spacing.screenPaddingHorizontal,
  },
  clusterPillsScroll: {
    paddingHorizontal: spacing.screenPaddingHorizontal,
    gap: 8,
  },
  clusterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.pinkLine,
  },
  clusterPillSelected: {
    backgroundColor: colors.rose,
    borderColor: colors.rose,
  },
  clusterPillText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.bold,
    color: colors.muted,
  },
  clusterPillTextSelected: {
    color: '#FFFFFF',
  },
  retentionBanner: {
    backgroundColor: colors.pinkSoft,
    borderRadius: radii.card,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.pinkLine,
    gap: 10,
  },
  retentionLeft: {
    flex: 1,
    gap: 6,
  },
  retentionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardsDueBadge: {
    backgroundColor: colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.badge,
    borderWidth: 1,
    borderColor: colors.pinkLine,
  },
  cardsDueBadgeText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.bold,
    color: colors.roseText,
  },
  retentionClusterRow: {
    flexDirection: 'row',
    gap: 10,
  },
  retentionClusterText: {
    fontSize: 11,
    fontFamily: typography.fontFamily.regular,
    color: colors.muted,
  },
  reviewBtn: {
    backgroundColor: colors.rose,
    borderRadius: radii.buttonSmall,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reviewBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: typography.fontFamily.bold,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  sectionTitleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: typography.fontFamily.bold,
    color: colors.ink,
  },
  sectionLink: {
    fontSize: 12,
    fontFamily: typography.fontFamily.bold,
    color: colors.roseText,
  },
  sectionSubCount: {
    fontSize: 11,
    fontFamily: typography.fontFamily.regular,
    color: colors.muted,
  },
  primersScroll: {
    gap: 12,
  },
  primerCard: {
    width: 220,
    backgroundColor: colors.surface,
    borderRadius: radii.cardSmall,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.pinkLine,
    gap: 6,
  },
  primerCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  readTimeText: {
    fontSize: 10,
    fontFamily: typography.fontFamily.regular,
    color: colors.muted,
  },
  primerCardTitle: {
    fontSize: 13,
    fontFamily: typography.fontFamily.bold,
    color: colors.ink,
    lineHeight: 18,
  },
  primerCardSummary: {
    fontSize: 11,
    fontFamily: typography.fontFamily.regular,
    color: colors.muted,
    lineHeight: 15,
  },
  emptyPinnedBox: {
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: radii.cardSmall,
    borderWidth: 1,
    borderColor: colors.pinkLine,
  },
  emptyPinnedText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.regular,
    color: colors.muted,
    lineHeight: 18,
  },
  pinnedFilesScroll: {
    gap: 10,
  },
  pinnedFileChip: {
    width: 170,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.cardSmall,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.pinkLine,
    gap: 10,
  },
  pinnedFileIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.pinkLine,
  },
  pinnedFileInfo: {
    flex: 1,
  },
  pinnedFileName: {
    fontSize: 12,
    fontFamily: typography.fontFamily.bold,
    color: colors.ink,
  },
  pinnedFileSubject: {
    fontSize: 10,
    fontFamily: typography.fontFamily.regular,
    color: colors.muted,
  },
  courseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  courseFolderCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.pinkLine,
    gap: 4,
  },
  folderCardTop: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 4,
  },
  folderCardName: {
    fontSize: 13,
    fontFamily: typography.fontFamily.bold,
    color: colors.ink,
    minHeight: 36,
  },
  folderMasteryWrap: {
    gap: 4,
    marginVertical: 4,
  },
  masteryBarBg: {
    height: 4,
    backgroundColor: colors.bg,
    borderRadius: 2,
    overflow: 'hidden',
  },
  masteryBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  masteryText: {
    fontSize: 10,
    fontFamily: typography.fontFamily.monoMedium,
    color: colors.roseText,
  },
  folderCardMeta: {
    fontSize: 10,
    fontFamily: typography.fontFamily.regular,
    color: colors.muted,
    marginTop: 'auto',
  },
  newFolderDashedCard: {
    width: '48%',
    minHeight: 125,
    borderRadius: radii.card,
    borderWidth: 1.5,
    borderColor: colors.rose,
    borderStyle: 'dashed',
    backgroundColor: colors.pinkSoft,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    gap: 8,
  },
  newFolderIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.pinkLine,
  },
  newFolderText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.bold,
    color: colors.roseText,
    textAlign: 'center',
  },
  recentSourcesList: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.pinkLine,
    overflow: 'hidden',
  },
  recentSourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.pinkLine,
  },
  recentSourceMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sourceTypeIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.pinkLine,
  },
  sourceDetails: {
    flex: 1,
  },
  sourceTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sourceTitle: {
    fontSize: 13,
    fontFamily: typography.fontFamily.bold,
    color: colors.ink,
    flex: 1,
  },
  sourceMeta: {
    fontSize: 11,
    fontFamily: typography.fontFamily.regular,
    color: colors.muted,
    marginTop: 2,
  },
  pinToggleBtn: {
    padding: 6,
  },
  searchSection: {
    gap: 14,
  },
  searchCountText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.medium,
    color: colors.muted,
  },
  searchGroup: {
    gap: 8,
  },
  searchGroupTitle: {
    fontSize: 13,
    fontFamily: typography.fontFamily.bold,
    color: colors.roseText,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.surface,
    borderRadius: radii.cardSmall,
    borderWidth: 1,
    borderColor: colors.pinkLine,
    gap: 10,
  },
  folderMiniIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: colors.pinkSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primerMiniIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#F0FDFA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sourceMiniIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchResultTitle: {
    fontSize: 13,
    fontFamily: typography.fontFamily.bold,
    color: colors.ink,
  },
  searchResultSub: {
    fontSize: 11,
    fontFamily: typography.fontFamily.regular,
    color: colors.muted,
  },
  noResultsBox: {
    padding: 24,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 13,
    fontFamily: typography.fontFamily.regular,
    color: colors.muted,
  },
  modalOverlay: {
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
    maxHeight: '85%',
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
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sheetTitle: {
    fontSize: 17,
    fontFamily: typography.fontFamily.bold,
    color: colors.ink,
  },
  allPrimersItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.bg,
    borderRadius: radii.cardSmall,
    borderWidth: 1,
    borderColor: colors.pinkLine,
    gap: 8,
  },
  modalOverlayCenter: {
    flex: 1,
    backgroundColor: 'rgba(58, 37, 48, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  filePreviewCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.pinkLine,
    gap: 12,
    ...Platform.select({
      ios: { shadowColor: colors.ink, shadowOpacity: 0.15, shadowRadius: 10 },
      android: { elevation: 6 },
    }),
  },
  filePreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  filePreviewIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.pinkLine,
  },
  filePreviewTitle: {
    fontSize: 14,
    fontFamily: typography.fontFamily.bold,
    color: colors.ink,
  },
  filePreviewSub: {
    fontSize: 11,
    fontFamily: typography.fontFamily.regular,
    color: colors.muted,
  },
  closeBtnSmall: {
    padding: 4,
  },
  filePreviewBodyScroll: {
    maxHeight: 200,
  },
  filePreviewNoteBody: {
    fontSize: 13,
    fontFamily: typography.fontFamily.regular,
    color: colors.ink,
    lineHeight: 20,
  },
  filePreviewPlaceholder: {
    backgroundColor: colors.bg,
    borderRadius: radii.cardSmall,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.pinkLine,
    gap: 4,
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
  },
  filePreviewFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  previewPinActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.buttonSmall,
    backgroundColor: colors.pinkSoft,
  },
  previewPinActionText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.bold,
    color: colors.roseText,
  },
  openInFolderBtn: {
    backgroundColor: colors.rose,
    borderRadius: radii.buttonSmall,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  openInFolderBtnText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.bold,
    color: '#FFFFFF',
  },
});
