import {
  Course,
  Subject,
  Chapter,
  Source,
  SourceKind,
  BoardSubject,
  Cluster,
  Primer,
  Formula,
  Program,
} from '../types';
import {
  mockPrograms,
  mockCourses,
  mockChapters,
  mockPrimers,
  mockFormulas,
  mockRecentSources,
  mockFlashcards,
} from '../data/mock/courses';

let localPrograms: Program[] = [...mockPrograms];
let localCourses: Course[] = [...mockCourses];
let localChapters: Record<string, Chapter[]> = JSON.parse(JSON.stringify(mockChapters));
let localUnsortedSources: Record<string, Source[]> = {
  deformable: [
    {
      id: 'src-def-unsorted-1',
      courseId: 'deformable',
      chapterId: undefined,
      kind: 'file',
      fileExt: 'PDF',
      title: 'Course Syllabus & Board Exam Outline.pdf',
      createdAt: '3 weeks ago',
      pinned: true,
      order: 1,
    },
  ],
};
let localPrimers: Primer[] = [...mockPrimers];
let localFormulas: Formula[] = [...mockFormulas];
let localRecentSources: Source[] = [...mockRecentSources];

type CourseListener = (courses: Course[]) => void;
const listeners = new Set<CourseListener>();

function notify() {
  const current = [...localCourses];
  listeners.forEach((fn) => fn(current));
}

export const courseService = {
  // Programs
  async getPrograms(): Promise<Program[]> {
    await new Promise((resolve) => setTimeout(resolve, 30));
    return [...localPrograms];
  },

  getProgramsSync(): Program[] {
    return [...localPrograms];
  },

  async addProgram(name: string): Promise<Program> {
    await new Promise((resolve) => setTimeout(resolve, 40));
    const trimmed = name.trim();
    if (!trimmed) {
      throw new Error('Course (Program) name cannot be empty');
    }
    const exists = localPrograms.some(
      (p) => p.name.trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) {
      throw new Error('A course program with this name already exists');
    }
    const newProg: Program = {
      id: `prog-${Date.now()}`,
      name: trimmed,
    };
    localPrograms.push(newProg);
    notify();
    return newProg;
  },

  async deleteProgram(programId: string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 40));
    const hasSubjects = localCourses.some((c) => c.programId === programId);
    if (hasSubjects) {
      throw new Error('Move or delete its subjects first.');
    }
    localPrograms = localPrograms.filter((p) => p.id !== programId);
    notify();
  },

  // Subjects / Courses
  async getCourses(cluster?: string): Promise<Course[]> {
    await new Promise((resolve) => setTimeout(resolve, 30));
    if (!cluster || cluster === 'All') {
      return [...localCourses];
    }
    return localCourses.filter((c) => c.cluster === cluster);
  },

  getCoursesSync(): Course[] {
    return [...localCourses];
  },

  async getCourseById(courseId: string): Promise<Course | null> {
    await new Promise((resolve) => setTimeout(resolve, 20));
    return localCourses.find((c) => c.id === courseId) || null;
  },

  async addSubject(data: {
    name: string;
    programId?: string;
    cluster?: Cluster;
    boardSubject?: BoardSubject;
  }): Promise<Course> {
    await new Promise((resolve) => setTimeout(resolve, 40));
    const trimmed = data.name.trim();
    if (!trimmed) {
      throw new Error('Subject name cannot be empty');
    }

    const defaultProgId = localPrograms[0]?.id || 'prog-ce';
    const programId = data.programId || defaultProgId;

    const exists = localCourses.some(
      (c) =>
        c.programId === programId &&
        c.name.trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) {
      throw new Error('A subject with this name already exists in this course');
    }

    const newSubjectId = `subj-${Date.now()}`;
    const newCourse: Course = {
      id: newSubjectId,
      userId: 'user-1',
      programId,
      name: trimmed,
      boardSubject: data.boardSubject,
      cluster: data.cluster,
      chaptersCount: 3,
      sourcesCount: 0,
      cardsCount: 0,
    };

    localCourses.push(newCourse);

    // Initialize with Chapter 1, 2, 3 empty
    localChapters[newSubjectId] = [
      {
        id: `ch-${newSubjectId}-1`,
        courseId: newSubjectId,
        name: 'Chapter 1',
        order: 1,
        sourcesCount: 0,
        mastered: false,
        sources: [],
      },
      {
        id: `ch-${newSubjectId}-2`,
        courseId: newSubjectId,
        name: 'Chapter 2',
        order: 2,
        sourcesCount: 0,
        mastered: false,
        sources: [],
      },
      {
        id: `ch-${newSubjectId}-3`,
        courseId: newSubjectId,
        name: 'Chapter 3',
        order: 3,
        sourcesCount: 0,
        mastered: false,
        sources: [],
      },
    ];
    localUnsortedSources[newSubjectId] = [];

    notify();
    return newCourse;
  },

  async addCourse(data: {
    name: string;
    cluster?: Cluster;
    boardSubject?: BoardSubject;
    programId?: string;
  }): Promise<Course> {
    return this.addSubject(data);
  },

  async renameSubject(courseId: string, newName: string): Promise<Course> {
    await new Promise((resolve) => setTimeout(resolve, 40));
    const trimmed = newName.trim();
    if (!trimmed) {
      throw new Error('Subject name cannot be empty');
    }
    const target = localCourses.find((c) => c.id === courseId);
    if (!target) {
      throw new Error('Subject not found');
    }

    const exists = localCourses.some(
      (c) =>
        c.id !== courseId &&
        c.programId === target.programId &&
        c.name.trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) {
      throw new Error('A subject with this name already exists in this course');
    }

    target.name = trimmed;
    notify();
    return target;
  },

  async deleteSubject(courseIdOrName: string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 40));
    const target = courseIdOrName.trim().toLowerCase();
    const removed = localCourses.find(
      (c) => c.id === courseIdOrName || c.name.trim().toLowerCase() === target
    );
    if (removed) {
      delete localChapters[removed.id];
      delete localUnsortedSources[removed.id];
    }
    localCourses = localCourses.filter(
      (c) => c.id !== courseIdOrName && c.name.trim().toLowerCase() !== target
    );
    notify();
  },

  // Chapters
  async getChaptersByCourse(courseId: string): Promise<Chapter[]> {
    await new Promise((resolve) => setTimeout(resolve, 30));
    return localChapters[courseId] ? [...localChapters[courseId]] : [];
  },

  async addChapter(courseId: string, name: string): Promise<Chapter> {
    await new Promise((resolve) => setTimeout(resolve, 40));
    const trimmed = name.trim();
    if (!trimmed) {
      throw new Error('Chapter name cannot be empty');
    }
    if (!localChapters[courseId]) {
      localChapters[courseId] = [];
    }
    const order = localChapters[courseId].length + 1;
    const newChapter: Chapter = {
      id: `ch-${courseId}-${Date.now()}`,
      courseId,
      name: trimmed,
      order,
      sourcesCount: 0,
      mastered: false,
      sources: [],
    };
    localChapters[courseId].push(newChapter);

    const c = localCourses.find((c) => c.id === courseId);
    if (c) {
      c.chaptersCount = localChapters[courseId].length;
      notify();
    }
    return newChapter;
  },

  async renameChapter(
    courseId: string,
    chapterId: string,
    newName: string
  ): Promise<Chapter> {
    await new Promise((resolve) => setTimeout(resolve, 30));
    const trimmed = newName.trim();
    if (!trimmed) {
      throw new Error('Chapter name cannot be empty');
    }
    const chList = localChapters[courseId] || [];
    const ch = chList.find((c) => c.id === chapterId);
    if (!ch) {
      throw new Error('Chapter not found');
    }
    ch.name = trimmed;
    notify();
    return ch;
  },

  async deleteChapter(courseId: string, chapterId: string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 40));
    const chList = localChapters[courseId] || [];
    const chIndex = chList.findIndex((c) => c.id === chapterId);
    if (chIndex === -1) return;

    const [deleted] = chList.splice(chIndex, 1);

    // Move its sources to "Unsorted"
    if (deleted && deleted.sources && deleted.sources.length > 0) {
      if (!localUnsortedSources[courseId]) {
        localUnsortedSources[courseId] = [];
      }
      const moved = deleted.sources.map((s) => ({
        ...s,
        chapterId: undefined,
      }));
      localUnsortedSources[courseId].push(...moved);
    }

    const c = localCourses.find((c) => c.id === courseId);
    if (c) {
      c.chaptersCount = chList.length;
      notify();
    }
  },

  async reorderChapters(courseId: string, chapterIds: string[]): Promise<Chapter[]> {
    await new Promise((resolve) => setTimeout(resolve, 30));
    const chList = localChapters[courseId] || [];
    const ordered: Chapter[] = [];
    chapterIds.forEach((id, index) => {
      const found = chList.find((c) => c.id === id);
      if (found) {
        found.order = index + 1;
        ordered.push(found);
      }
    });
    // Append any missing
    chList.forEach((c) => {
      if (!ordered.some((o) => o.id === c.id)) {
        ordered.push(c);
      }
    });
    localChapters[courseId] = ordered;
    notify();
    return ordered;
  },

  // Sources / Files
  async getUnsortedSources(courseId: string): Promise<Source[]> {
    await new Promise((resolve) => setTimeout(resolve, 30));
    return localUnsortedSources[courseId] ? [...localUnsortedSources[courseId]] : [];
  },

  async getPinnedSources(cluster?: string): Promise<Source[]> {
    await new Promise((resolve) => setTimeout(resolve, 30));
    const allPinned: Source[] = [];

    // From chapters
    Object.values(localChapters).forEach((chs) => {
      chs.forEach((ch) => {
        ch.sources.forEach((s) => {
          if (s.pinned && !allPinned.some((item) => item.id === s.id)) {
            allPinned.push(s);
          }
        });
      });
    });

    // From unsorted
    Object.values(localUnsortedSources).forEach((sources) => {
      sources.forEach((s) => {
        if (s.pinned && !allPinned.some((item) => item.id === s.id)) {
          allPinned.push(s);
        }
      });
    });

    // Also check localRecentSources
    localRecentSources.forEach((s) => {
      if (s.pinned && !allPinned.some((item) => item.id === s.id)) {
        allPinned.push(s);
      }
    });

    if (cluster && cluster !== 'All') {
      const matchingCourseIds = new Set(
        localCourses.filter((c) => c.cluster === cluster).map((c) => c.id)
      );
      return allPinned.filter((s) => matchingCourseIds.has(s.courseId));
    }

    return allPinned;
  },

  async togglePinSource(sourceId: string): Promise<Source> {
    await new Promise((resolve) => setTimeout(resolve, 30));
    let foundSource: Source | null = null;

    // Search in chapters
    for (const chs of Object.values(localChapters)) {
      for (const ch of chs) {
        for (const s of ch.sources) {
          if (s.id === sourceId) {
            s.pinned = !s.pinned;
            foundSource = s;
            break;
          }
        }
      }
    }

    // Search in unsorted
    if (!foundSource) {
      for (const list of Object.values(localUnsortedSources)) {
        for (const s of list) {
          if (s.id === sourceId) {
            s.pinned = !s.pinned;
            foundSource = s;
            break;
          }
        }
      }
    }

    // Search in localRecentSources
    for (const s of localRecentSources) {
      if (s.id === sourceId) {
        s.pinned = foundSource ? foundSource.pinned : !s.pinned;
        if (!foundSource) foundSource = s;
      }
    }

    if (!foundSource) {
      throw new Error(`Source not found: ${sourceId}`);
    }

    notify();
    return foundSource;
  },

  async renameSource(sourceId: string, newTitle: string): Promise<Source> {
    await new Promise((resolve) => setTimeout(resolve, 30));
    const trimmed = newTitle.trim();
    if (!trimmed) {
      throw new Error('File name cannot be empty');
    }

    let foundSource: Source | null = null;

    for (const chs of Object.values(localChapters)) {
      for (const ch of chs) {
        for (const s of ch.sources) {
          if (s.id === sourceId) {
            s.title = trimmed;
            foundSource = s;
          }
        }
      }
    }

    for (const list of Object.values(localUnsortedSources)) {
      for (const s of list) {
        if (s.id === sourceId) {
          s.title = trimmed;
          foundSource = s;
        }
      }
    }

    for (const s of localRecentSources) {
      if (s.id === sourceId) {
        s.title = trimmed;
        if (!foundSource) foundSource = s;
      }
    }

    if (!foundSource) {
      throw new Error(`Source not found: ${sourceId}`);
    }

    notify();
    return foundSource;
  },

  async moveSource(
    sourceId: string,
    targetCourseId: string,
    targetChapterId?: string
  ): Promise<Source> {
    await new Promise((resolve) => setTimeout(resolve, 40));
    let sourceToMove: Source | null = null;
    let oldCourseId = '';

    // Remove from current chapter
    for (const [cId, chs] of Object.entries(localChapters)) {
      for (const ch of chs) {
        const idx = ch.sources.findIndex((s) => s.id === sourceId);
        if (idx !== -1) {
          sourceToMove = ch.sources.splice(idx, 1)[0];
          ch.sourcesCount = ch.sources.length;
          oldCourseId = cId;
          break;
        }
      }
      if (sourceToMove) break;
    }

    // Remove from unsorted if not found in chapters
    if (!sourceToMove) {
      for (const [cId, list] of Object.entries(localUnsortedSources)) {
        const idx = list.findIndex((s) => s.id === sourceId);
        if (idx !== -1) {
          sourceToMove = list.splice(idx, 1)[0];
          oldCourseId = cId;
          break;
        }
      }
    }

    if (!sourceToMove) {
      throw new Error(`Source not found: ${sourceId}`);
    }

    // Update fields
    sourceToMove.courseId = targetCourseId;
    sourceToMove.chapterId = targetChapterId;

    // Add to target
    if (targetChapterId) {
      const chList = localChapters[targetCourseId] || [];
      const ch = chList.find((c) => c.id === targetChapterId);
      if (ch) {
        ch.sources.push(sourceToMove);
        ch.sourcesCount = ch.sources.length;
      } else {
        // Fallback to unsorted if chapter not found
        if (!localUnsortedSources[targetCourseId]) {
          localUnsortedSources[targetCourseId] = [];
        }
        localUnsortedSources[targetCourseId].push(sourceToMove);
      }
    } else {
      if (!localUnsortedSources[targetCourseId]) {
        localUnsortedSources[targetCourseId] = [];
      }
      localUnsortedSources[targetCourseId].push(sourceToMove);
    }

    // Recalculate sourcesCount on old and new course
    this.recalculateSourceCounts(oldCourseId);
    this.recalculateSourceCounts(targetCourseId);

    notify();
    return sourceToMove;
  },

  async deleteSource(sourceId: string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 40));
    let courseId = '';

    for (const [cId, chs] of Object.entries(localChapters)) {
      for (const ch of chs) {
        const idx = ch.sources.findIndex((s) => s.id === sourceId);
        if (idx !== -1) {
          ch.sources.splice(idx, 1);
          ch.sourcesCount = ch.sources.length;
          courseId = cId;
          break;
        }
      }
      if (courseId) break;
    }

    if (!courseId) {
      for (const [cId, list] of Object.entries(localUnsortedSources)) {
        const idx = list.findIndex((s) => s.id === sourceId);
        if (idx !== -1) {
          list.splice(idx, 1);
          courseId = cId;
          break;
        }
      }
    }

    localRecentSources = localRecentSources.filter((s) => s.id !== sourceId);

    if (courseId) {
      this.recalculateSourceCounts(courseId);
    }

    notify();
  },

  async reorderChapterSources(
    courseId: string,
    chapterId: string | undefined,
    sourceIds: string[]
  ): Promise<Source[]> {
    await new Promise((resolve) => setTimeout(resolve, 30));
    if (chapterId) {
      const chList = localChapters[courseId] || [];
      const ch = chList.find((c) => c.id === chapterId);
      if (ch) {
        const ordered: Source[] = [];
        sourceIds.forEach((id, idx) => {
          const found = ch.sources.find((s) => s.id === id);
          if (found) {
            found.order = idx + 1;
            ordered.push(found);
          }
        });
        ch.sources.forEach((s) => {
          if (!ordered.some((o) => o.id === s.id)) {
            ordered.push(s);
          }
        });
        ch.sources = ordered;
        notify();
        return ordered;
      }
    } else {
      const list = localUnsortedSources[courseId] || [];
      const ordered: Source[] = [];
      sourceIds.forEach((id, idx) => {
        const found = list.find((s) => s.id === id);
        if (found) {
          found.order = idx + 1;
          ordered.push(found);
        }
      });
      list.forEach((s) => {
        if (!ordered.some((o) => o.id === s.id)) {
          ordered.push(s);
        }
      });
      localUnsortedSources[courseId] = ordered;
      notify();
      return ordered;
    }
    return [];
  },

  async addSourceToCourse(
    courseId: string,
    chapterId: string | undefined,
    sourceData: {
      title: string;
      kind: SourceKind;
      fileExt?: string;
      url?: string;
      noteBody?: string;
      companions?: { flashcardCount?: number; hasSummary?: boolean; formulaId?: string };
    }
  ): Promise<Source> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    const ext =
      sourceData.fileExt ||
      (sourceData.kind === 'photo'
        ? 'JPG'
        : sourceData.kind === 'pdf'
        ? 'PDF'
        : sourceData.kind === 'note'
        ? 'NOTE'
        : sourceData.kind === 'link'
        ? 'LINK'
        : 'FILE');

    const newSource: Source = {
      id: `src-${Date.now()}`,
      courseId,
      chapterId,
      kind: sourceData.kind,
      fileExt: ext,
      title: sourceData.title,
      url: sourceData.url,
      noteBody: sourceData.noteBody,
      createdAt: 'Just now',
      pinned: false,
      companions: sourceData.companions || {
        flashcardCount: 5,
        hasSummary: true,
      },
    };

    if (chapterId && localChapters[courseId]) {
      const chIndex = localChapters[courseId].findIndex((ch) => ch.id === chapterId);
      if (chIndex !== -1) {
        localChapters[courseId][chIndex].sources.push(newSource);
        localChapters[courseId][chIndex].sourcesCount += 1;
      } else {
        if (!localUnsortedSources[courseId]) localUnsortedSources[courseId] = [];
        localUnsortedSources[courseId].push(newSource);
      }
    } else {
      if (!localUnsortedSources[courseId]) localUnsortedSources[courseId] = [];
      localUnsortedSources[courseId].push(newSource);
    }

    localRecentSources.unshift(newSource);
    this.recalculateSourceCounts(courseId);
    notify();

    return newSource;
  },

  recalculateSourceCounts(courseId: string) {
    let total = 0;
    if (localChapters[courseId]) {
      localChapters[courseId].forEach((ch) => {
        total += ch.sources.length;
      });
    }
    if (localUnsortedSources[courseId]) {
      total += localUnsortedSources[courseId].length;
    }
    const c = localCourses.find((c) => c.id === courseId);
    if (c) {
      c.sourcesCount = total;
    }
  },

  // Primers
  async getPrimers(cluster?: string): Promise<Primer[]> {
    await new Promise((resolve) => setTimeout(resolve, 30));
    if (!cluster || cluster === 'All') {
      return [...localPrimers];
    }
    const matchingCourseIds = new Set(
      localCourses.filter((c) => c.cluster === cluster).map((c) => c.id)
    );
    return localPrimers.filter((p) => matchingCourseIds.has(p.courseId));
  },

  async getPrimerById(id: string): Promise<Primer | null> {
    return localPrimers.find((p) => p.id === id) || null;
  },

  // Formulas (backward-compat)
  async getFormulas(cluster?: string): Promise<Formula[]> {
    await new Promise((resolve) => setTimeout(resolve, 20));
    if (!cluster || cluster === 'All') {
      return [...localFormulas];
    }
    const matchingCourseIds = new Set(
      localCourses.filter((c) => c.cluster === cluster).map((c) => c.id)
    );
    return localFormulas.filter((f) => matchingCourseIds.has(f.courseId));
  },

  async getPinnedFormulas(cluster?: string): Promise<Formula[]> {
    const list = await this.getFormulas(cluster);
    return list.filter((f) => f.pinned);
  },

  async togglePinFormula(formulaId: string): Promise<Formula> {
    await new Promise((resolve) => setTimeout(resolve, 20));
    const index = localFormulas.findIndex((f) => f.id === formulaId);
    if (index === -1) {
      throw new Error(`Formula not found: ${formulaId}`);
    }
    const updated = {
      ...localFormulas[index],
      pinned: !localFormulas[index].pinned,
    };
    localFormulas[index] = updated;
    return updated;
  },

  async addFormula(formulaData: Omit<Formula, 'id'>): Promise<Formula> {
    await new Promise((resolve) => setTimeout(resolve, 30));
    const newFormula: Formula = {
      ...formulaData,
      id: `formula-${Date.now()}`,
    };
    localFormulas.unshift(newFormula);
    return newFormula;
  },

  // Recent Sources
  async getRecentSources(cluster?: string): Promise<Source[]> {
    await new Promise((resolve) => setTimeout(resolve, 30));
    if (!cluster || cluster === 'All') {
      return [...localRecentSources];
    }
    const matchingCourseIds = new Set(
      localCourses.filter((c) => c.cluster === cluster).map((c) => c.id)
    );
    return localRecentSources.filter((s) => matchingCourseIds.has(s.courseId));
  },

  // Retention banner card count & cluster breakdown
  getRetentionStats(cluster?: string): {
    totalDue: number;
    clusterCounts: Record<string, number>;
  } {
    const dueCards = mockFlashcards.filter((fc) => fc.dueToday);
    const clusterCounts: Record<string, number> = {};

    dueCards.forEach((c) => {
      clusterCounts[c.cluster] = (clusterCounts[c.cluster] || 0) + 1;
    });

    if (cluster && cluster !== 'All') {
      const filteredDue = dueCards.filter((fc) => fc.cluster === cluster).length;
      return {
        totalDue: filteredDue,
        clusterCounts,
      };
    }

    return {
      totalDue: dueCards.length,
      clusterCounts,
    };
  },

  subscribe(listener: CourseListener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
