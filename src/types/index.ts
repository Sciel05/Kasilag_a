export type BoardSubject = 'PSAD' | 'GEOTECH' | 'HGE' | 'MATH';
export type Cluster = 'MSTE' | 'HGE' | 'PSAD' | 'Other';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
}

export interface Program {
  id: string;
  name: string;
}

export interface Subject {
  id: string;
  userId: string;
  programId: string;
  name: string;
  boardSubject?: BoardSubject;
  cluster?: Cluster;
  chaptersCount?: number;
  sourcesCount?: number;
  cardsCount?: number;
}

export type Course = Subject;

export type SourceKind = 'pdf' | 'file' | 'note' | 'link' | 'photo';

export interface SourceCompanions {
  flashcardCount?: number;
  hasSummary?: boolean;
  formulaId?: string;
}

export interface Source {
  id: string;
  chapterId?: string;
  courseId: string;
  kind: SourceKind;
  url?: string;
  title: string;
  fileExt?: string;
  noteBody?: string;
  createdAt: string;
  pinned?: boolean;
  order?: number;
  companions?: SourceCompanions;
}

export interface Primer {
  id: string;
  courseId: string;
  title: string;
  readMinutes: number;
  summary: string;
  body: string;
}

export interface FormulaVariable {
  symbol: string;
  meaning: string;
  unit: string;
}

export interface Formula {
  id: string;
  courseId: string;
  label: string;
  plainText: string;
  latex: string;
  variables: FormulaVariable[];
  derivationSteps: string[];
  pinned: boolean;
}

export interface Chapter {
  id: string;
  courseId: string;
  name: string;
  order: number;
  sourcesCount: number;
  mastered: boolean;
  statusText?: string;
  sources: Source[];
  keyFormulas?: string[];
  workedExamplesCount?: number;
  conceptQuestionsCount?: number;
}

export type PlanType = 'exam' | 'study' | 'deadline' | 'other';

export interface Plan {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD, e.g. '2026-10-19'
  time: string; // e.g. '10:30 AM' or '35 min'
  startTime: string; // 'HH:mm' (24h), e.g. '14:30'
  durationMinutes: number; // e.g. 60
  title: string;
  type: PlanType;
  courseId?: string;
  courseName?: string;
  completed: boolean;
  linkRoute?: 'Practice' | 'Solve';
  templateId?: string;
  subtitle?: string;
}

export interface Mistake {
  label: string;
  formula: string;
  explanation?: string;
}

export interface TemplateStep {
  order: number;
  prompt: string;
  formulaId: string;
  formula: string;
  answerUnit: string;
  acceptableUnits?: string[];
  tolerancePct: number;
  displayScale?: string;
  skill: string;
  uses?: Record<string, number>;
  mistakes: Mistake[];
  hints: string[];
  calculatedValue: number; // calculated server-side or mock engine
}

export type TemplateDifficulty = 'easy' | 'moderate' | 'board';

export interface Template {
  id: string;
  title: string;
  boardSubject: BoardSubject;
  cluster: Cluster;
  topic: string;
  difficulty: TemplateDifficulty;
  chapterId: string;
  chapterName: string;
  scenario: string;
  parameters: Record<string, { value?: number; min?: number; max?: number; step?: number; unit: string }>;
  constraints?: string[];
  steps: TemplateStep[];
  diagramType?: 'hollow_shaft' | 'beam_cantilever' | 'pressure_vessel';
}

export interface StepAttempt {
  id: string;
  attemptId: string;
  stepOrder: number;
  answer: number;
  unit: string;
  isCorrect: boolean;
  mistakeLabel?: string;
  hintsUsed: number;
  tries: number;
  timeMs: number;
}

export interface Attempt {
  id: string;
  userId: string;
  templateId: string;
  seed: number;
  mode: 'solve' | 'recall' | 'drill';
  stage: number;
  confidence?: number;
  startedAt: string;
  finishedAt?: string;
  assisted?: boolean;
  stepAttempts: StepAttempt[];
}

export type FlashcardType = 'concept' | 'formula' | 'missing_variable';
export type FlashcardRating = 'Again' | 'Hard' | 'Good' | 'Easy';

export interface Flashcard {
  id: string;
  courseId: string;
  cluster: Cluster;
  cardType: FlashcardType;
  prompt: string;
  answer: string;
  latexFormula?: string;
  ease: number;
  interval: number;
  dueDate: string;
  dueToday: boolean;
}

export interface SituationMCQ {
  id: string;
  order: number;
  prompt: string;
  options: { label: string; text: string }[];
  correctLabel: string;
  solutionSteps: string[];
  equationUsed?: string;
  substitution?: string;
  finalAnswer?: string;
  relatedSourceId?: string;
}

export interface Situation {
  id: string;
  cluster: Cluster;
  topic: string;
  given: string;
  diagram?: 'hollow_shaft' | 'beam_cantilever' | 'pressure_vessel' | string;
  questions: SituationMCQ[];
  relatedSourceId?: string;
}

export interface ErrorLogEntry {
  id: string;
  itemId: string;
  itemType: 'flashcard' | 'situation' | 'template';
  cluster: Cluster;
  title: string;
  mistakeType?: string;
  correctUnassistedDates: string[];
}

export interface ClusterTopic {
  id: string;
  name: string;
  cluster: Cluster;
  templateId?: string;
  unassistedAccuracyPct?: number;
  attemptsCount: number;
}

export type RecallKind = 'build' | 'pick' | 'rearrange';

export interface RecallItem {
  id: string;
  formulaId: string;
  formulaName: string;
  boardSubject: BoardSubject;
  kind: RecallKind;
  prompt: string;
  answer: string;
  tiles?: string[];
  options?: string[];
  estMinutes: number;
}

export interface MCQQuestion {
  id: string;
  order: number;
  prompt: string;
  options: { label: string; text: string }[];
  correctLabel: string;
  explanation: string;
}

export interface BoardDrill {
  id: string;
  title: string;
  boardSubject: BoardSubject;
  durationSeconds: number;
  situation: string;
  questions: MCQQuestion[];
}

export interface CourseReadiness {
  courseId: string;
  courseName: string;
  boardSubject?: BoardSubject;
  pct: number;
}

export interface FormulaMastery {
  recall: number;
  choose: number;
  apply: number;
}

export interface ProgressMetrics {
  unassistedAccuracyPct: number;
  learningInsight: string;
  courseReadiness: CourseReadiness[];
  formulaMastery: FormulaMastery;
  topMistake: {
    label: string;
    details: string;
    count: number;
  };
}
