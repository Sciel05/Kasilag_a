import { useState, useEffect, useCallback } from 'react';
import {
  Course,
  Chapter,
  Source,
  SourceKind,
  BoardSubject,
  Cluster,
  Primer,
  Formula,
  Program,
} from '../types';
import { courseService } from '../services/courseService';

export function useCourses(selectedCourseId?: string, initialCluster: string = 'All') {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [cluster, setCluster] = useState<string>(initialCluster);
  const [primers, setPrimers] = useState<Primer[]>([]);
  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [pinnedSources, setPinnedSources] = useState<Source[]>([]);
  const [recentSources, setRecentSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [progList, cList, pList, fList, pinnedList, sList] = await Promise.all([
        courseService.getPrograms(),
        courseService.getCourses(cluster),
        courseService.getPrimers(cluster),
        courseService.getFormulas(cluster),
        courseService.getPinnedSources(cluster),
        courseService.getRecentSources(cluster),
      ]);
      setPrograms(progList);
      setCourses(cList);
      setPrimers(pList);
      setFormulas(fList);
      setPinnedSources(pinnedList);
      setRecentSources(sList);

      if (selectedCourseId) {
        const [course, chList] = await Promise.all([
          courseService.getCourseById(selectedCourseId),
          courseService.getChaptersByCourse(selectedCourseId),
        ]);
        setSelectedCourse(course);
        setChapters(chList);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  }, [selectedCourseId, cluster]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Subscribe to changes in courseService
  useEffect(() => {
    const unsub = courseService.subscribe(() => {
      loadData();
    });
    return () => unsub();
  }, [loadData]);

  // Program mutations
  const addProgram = useCallback(
    async (name: string): Promise<Program> => {
      const created = await courseService.addProgram(name);
      await loadData();
      return created;
    },
    [loadData]
  );

  const deleteProgram = useCallback(
    async (id: string): Promise<void> => {
      await courseService.deleteProgram(id);
      await loadData();
    },
    [loadData]
  );

  // Subject / Course mutations
  const addSubject = useCallback(
    async (
      dataOrName:
        | { name: string; programId?: string; cluster?: Cluster; boardSubject?: BoardSubject }
        | string,
      boardSubject?: BoardSubject
    ): Promise<Course> => {
      let payload;
      if (typeof dataOrName === 'string') {
        payload = { name: dataOrName, boardSubject };
      } else {
        payload = dataOrName;
      }
      const created = await courseService.addSubject(payload);
      await loadData();
      return created;
    },
    [loadData]
  );

  const addCourse = useCallback(
    async (data: {
      name: string;
      programId?: string;
      cluster?: Cluster;
      boardSubject?: BoardSubject;
    }): Promise<Course> => {
      return addSubject(data);
    },
    [addSubject]
  );

  const renameSubject = useCallback(
    async (id: string, newName: string): Promise<Course> => {
      const updated = await courseService.renameSubject(id, newName);
      await loadData();
      return updated;
    },
    [loadData]
  );

  const deleteSubject = useCallback(
    async (courseIdOrName: string): Promise<void> => {
      await courseService.deleteSubject(courseIdOrName);
      await loadData();
    },
    [loadData]
  );

  // Chapters
  const getChaptersByCourse = useCallback(
    async (courseId: string): Promise<Chapter[]> => {
      return courseService.getChaptersByCourse(courseId);
    },
    []
  );

  const addChapter = useCallback(
    async (courseId: string, name: string): Promise<Chapter> => {
      const created = await courseService.addChapter(courseId, name);
      await loadData();
      return created;
    },
    [loadData]
  );

  const renameChapter = useCallback(
    async (courseId: string, chapterId: string, newName: string): Promise<Chapter> => {
      const updated = await courseService.renameChapter(courseId, chapterId, newName);
      await loadData();
      return updated;
    },
    [loadData]
  );

  const deleteChapter = useCallback(
    async (courseId: string, chapterId: string): Promise<void> => {
      await courseService.deleteChapter(courseId, chapterId);
      await loadData();
    },
    [loadData]
  );

  const reorderChapters = useCallback(
    async (courseId: string, chapterIds: string[]): Promise<Chapter[]> => {
      const reordered = await courseService.reorderChapters(courseId, chapterIds);
      await loadData();
      return reordered;
    },
    [loadData]
  );

  // Sources / Files
  const togglePinSource = useCallback(
    async (sourceId: string): Promise<Source> => {
      const updated = await courseService.togglePinSource(sourceId);
      await loadData();
      return updated;
    },
    [loadData]
  );

  const renameSource = useCallback(
    async (sourceId: string, newTitle: string): Promise<Source> => {
      const updated = await courseService.renameSource(sourceId, newTitle);
      await loadData();
      return updated;
    },
    [loadData]
  );

  const moveSource = useCallback(
    async (
      sourceId: string,
      targetCourseId: string,
      targetChapterId?: string
    ): Promise<Source> => {
      const moved = await courseService.moveSource(
        sourceId,
        targetCourseId,
        targetChapterId
      );
      await loadData();
      return moved;
    },
    [loadData]
  );

  const deleteSource = useCallback(
    async (sourceId: string): Promise<void> => {
      await courseService.deleteSource(sourceId);
      await loadData();
    },
    [loadData]
  );

  const reorderChapterSources = useCallback(
    async (
      courseId: string,
      chapterId: string | undefined,
      sourceIds: string[]
    ): Promise<Source[]> => {
      const reordered = await courseService.reorderChapterSources(
        courseId,
        chapterId,
        sourceIds
      );
      await loadData();
      return reordered;
    },
    [loadData]
  );

  const addSource = useCallback(
    async (
      courseId: string,
      source: {
        title: string;
        kind: SourceKind;
        fileExt?: string;
        url?: string;
        noteBody?: string;
        companions?: { flashcardCount?: number; hasSummary?: boolean; formulaId?: string };
      },
      chapterId?: string
    ): Promise<Source> => {
      const created = await courseService.addSourceToCourse(
        courseId,
        chapterId,
        source
      );
      await loadData();
      return created;
    },
    [loadData]
  );

  // Retention stats
  const retentionStats = courseService.getRetentionStats(cluster);

  // Backward-compat formulas
  const pinnedFormulas = formulas.filter((f) => f.pinned);
  const togglePinFormula = useCallback(
    async (formulaId: string): Promise<Formula> => {
      const updated = await courseService.togglePinFormula(formulaId);
      setFormulas((prev) => prev.map((f) => (f.id === formulaId ? updated : f)));
      return updated;
    },
    []
  );

  const addFormula = useCallback(
    async (data: Omit<Formula, 'id'>): Promise<Formula> => {
      const created = await courseService.addFormula(data);
      setFormulas((prev) => [created, ...prev]);
      return created;
    },
    []
  );

  return {
    programs,
    courses,
    selectedCourse,
    chapters,
    cluster,
    setCluster,
    primers,
    formulas,
    pinnedFormulas,
    pinnedSources,
    recentSources,
    retentionStats,
    loading,
    error,
    refreshCourses: loadData,
    // Mutations
    addProgram,
    deleteProgram,
    addSubject,
    addCourse,
    renameSubject,
    deleteSubject,
    // Chapters
    getChaptersByCourse,
    addChapter,
    renameChapter,
    deleteChapter,
    reorderChapters,
    // Sources
    togglePinSource,
    renameSource,
    moveSource,
    deleteSource,
    reorderChapterSources,
    addSource,
    // Backward compat
    togglePinFormula,
    addFormula,
  };
}
