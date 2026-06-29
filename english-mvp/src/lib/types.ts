// One skill per verification module so the learner sees an honest, separate
// score for each ability they practise.
export type SkillKey = "meaning" | "spelling" | "listening" | "pronunciation";

export type ExerciseType =
  | "learn" // learning session card (teach, not test)
  | "en-pl" // comprehension: recognise meaning EN -> PL
  | "writing-pl-en" // writing: produce + spell EN
  | "dictation" // listening: hear audio, type the word
  | "pronunciation"; // pronunciation: speak, auto-scored

export type FlashcardDirection = "en-pl" | "pl-en";

export type ModuleId =
  | "learn"
  | "comprehension"
  | "writing"
  | "listening"
  | "pronunciation"
  | "reviews";

export type CefrLevel = "A2" | "B1" | "B2" | "C1";

export type LessonSource =
  | "NGSL 1.2"
  | "NAWL 1.2"
  | "B2 First"
  | "C1 Advanced"
  | "In the Loop"
  | "Repair";

export type WordEntry = {
  id: string;
  word: string;
  translationPl: string;
  partOfSpeech: string;
  cefr: CefrLevel;
  ipa: string;
  example: string;
  collocations: string[];
  tags: string[];
  source: LessonSource;
};

export type Lesson = {
  id: string;
  course: string;
  unit: string;
  title: string;
  cefr: CefrLevel;
  source: LessonSource;
  words: WordEntry[];
};

// Per-skill spaced-repetition state (Leitner box + the day it is next due).
// Each skill is scheduled independently so every word comes back for review in
// every form (meaning, spelling, listening, pronunciation), not just one.
export type SkillSrs = {
  box: number;
  due: string; // YYYY-MM-DD, the day the word becomes due in this skill
  reps: number;
  lapses: number;
};

export type WordProgress = {
  wordId: string;
  lessonId: string;
  word: string;
  translationPl: string;
  introduced: boolean;
  scores: Record<SkillKey, number>;
  srs: Record<SkillKey, SkillSrs>;
  attempts: number;
  mistakes: number;
  pronunciationAttempts: number;
  lastPracticedAt: string;
  nextReviewAt: string;
  errorTypes: Record<string, number>;
};

export type AttemptRecord = {
  id: string;
  wordId: string;
  lessonId: string;
  exerciseType: ExerciseType;
  skill: SkillKey;
  prompt: string;
  expected: string;
  answer: string;
  correct: boolean;
  errorType: string;
  createdAt: string;
};

export type PronunciationAttempt = {
  id: string;
  wordId: string;
  lessonId: string;
  word: string;
  recognizedText: string;
  score: number;
  passed: boolean;
  createdAt: string;
};

export type CustomLessonInput = {
  course: string;
  unit: string;
  lesson: string;
  word: string;
  translation_pl: string;
  part_of_speech?: string;
  cefr?: string;
  example?: string;
  collocations?: string;
  ipa?: string;
  tags?: string;
  source?: string;
};

export type AppProgress = {
  streak: number;
  completedToday: number;
  completedModuleKeysToday: string[];
  lastStudyDate: string;
  activeLessonId: string;
  wordProgress: Record<string, WordProgress>;
  attempts: AttemptRecord[];
  pronunciationAttempts: PronunciationAttempt[];
  completedLessonIds: string[];
  completedLessonModules: Record<string, ModuleId[]>;
  customLessons: Lesson[];
};

export type ExerciseItem = {
  id: string;
  word: WordEntry;
  lessonId: string;
  lessonTitle: string;
  type: ExerciseType;
  direction?: FlashcardDirection;
};

export type StatSummary = {
  comprehension: number;
  spelling: number;
  listening: number;
  pronunciation: number;
  learnedCount: number;
  dueTotal: number;
  dueBySkill: Record<SkillKey, number>;
};
