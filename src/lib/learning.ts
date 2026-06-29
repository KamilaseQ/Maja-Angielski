import { get, set } from "idb-keyval";
import type {
  AppProgress,
  AttemptRecord,
  ExerciseItem,
  ExerciseType,
  Lesson,
  ModuleId,
  PronunciationAttempt,
  SkillKey,
  SkillSrs,
  StatSummary,
  WordEntry,
  WordProgress,
} from "./types";

export const progressStorageKey = "english-mvp-progress-v1";

// The verification modules that must be completed for a lesson to count as done.
export const requiredLessonModules: ModuleId[] = [
  "comprehension",
  "writing",
  "listening",
  "pronunciation",
];

export const lessonWordLimit = 10;

// The four skills that have a real exercise behind them. Every word is tracked
// and scheduled independently in each of them.
export const skillList: SkillKey[] = ["meaning", "spelling", "listening", "pronunciation"];

// Leitner intervals in days, indexed by box. A correct answer moves the word up
// a box (longer interval); a wrong answer moves it down. The top box still
// recurs (~6 weeks) so every word keeps coming back for long-term review.
const reviewIntervals = [1, 2, 4, 8, 16, 40];

export const emptyProgress: AppProgress = {
  streak: 0,
  completedToday: 0,
  completedModuleKeysToday: [],
  lastStudyDate: "",
  activeLessonId: "",
  wordProgress: {},
  attempts: [],
  pronunciationAttempts: [],
  completedLessonIds: [],
  completedLessonModules: {},
  customLessons: [],
};

const exerciseSkillMap: Record<ExerciseType, SkillKey> = {
  learn: "meaning",
  "en-pl": "meaning",
  "writing-pl-en": "spelling",
  dictation: "listening",
  pronunciation: "pronunciation",
};

export const skillExerciseType: Record<SkillKey, ExerciseType> = {
  meaning: "en-pl",
  spelling: "writing-pl-en",
  listening: "dictation",
  pronunciation: "pronunciation",
};

// The skill each verification module trains, used to read its per-lesson score.
export const moduleSkill: Partial<Record<ModuleId, SkillKey>> = {
  comprehension: "meaning",
  writing: "spelling",
  listening: "listening",
  pronunciation: "pronunciation",
};

export async function loadProgress() {
  const saved = await get<AppProgress>(progressStorageKey);
  return saved ? normalizeProgress(saved) : emptyProgress;
}

export async function saveProgress(progress: AppProgress) {
  await set(progressStorageKey, progress);
}

// Local-time day key so "today" matches the learner's clock.
export function todayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function freshSrs(due: string): SkillSrs {
  return { box: 0, due, reps: 0, lapses: 0 };
}

function makeSrs(due: string): Record<SkillKey, SkillSrs> {
  return {
    meaning: freshSrs(due),
    spelling: freshSrs(due),
    listening: freshSrs(due),
    pronunciation: freshSrs(due),
  };
}

// Reschedule one skill after an answer: up a box on success, down on failure.
function scheduleSkill(entry: SkillSrs, correct: boolean, now: Date): SkillSrs {
  const box = correct
    ? Math.min(entry.box + 1, reviewIntervals.length - 1)
    : Math.max(0, entry.box - 1);
  const days = correct ? reviewIntervals[box] : 1;
  return {
    box,
    due: todayKey(addDays(now, days)),
    reps: entry.reps + 1,
    lapses: entry.lapses + (correct ? 0 : 1),
  };
}

// Skill scores start at 0 (nothing practised yet) and move as an exponential
// moving average towards the outcome: a correct answer pulls the score halfway
// to 100, a wrong one halfway to 0. So one clean pass through a module reads
// ~50%, repeated success climbs towards mastery, and a slip drops the score
// noticeably — which is exactly what the coloured status bars should reflect.
function blendScore(current: number, correct: boolean) {
  const target = correct ? 100 : 0;
  const next = current + (target - current) * 0.5;
  return Math.max(0, Math.min(100, Math.round(next)));
}

export function normalizeAnswer(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\p{L}0-9\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Accepts the listed synonyms. Besides , ; / we also split Polish "lub"/"albo"
// because the vocabulary data uses them to list alternatives.
export function acceptedAnswers(expected: string): string[] {
  return expected
    .split(/[,;/]| lub | albo /gi)
    .map((part) => normalizeAnswer(part))
    .filter((part) => part.length > 0);
}

export function isAnswerCorrect(answer: string, expected: string) {
  const normalizedAnswer = normalizeAnswer(answer);
  if (!normalizedAnswer) return false;
  if (normalizedAnswer === normalizeAnswer(expected)) return true;
  return acceptedAnswers(expected).some((part) => normalizedAnswer === part);
}

export function detectErrorType(answer: string, expected: string, type: ExerciseType) {
  if (!answer.trim()) return "brak odpowiedzi";
  if (type === "pronunciation") return "wymowa";
  if (type === "dictation") return "sluch";
  if (type === "writing-pl-en") {
    const cleanAnswer = normalizeAnswer(answer).replace(/\s/g, "");
    const cleanExpected = normalizeAnswer(expected).replace(/\s/g, "");
    if (Math.abs(cleanAnswer.length - cleanExpected.length) > 1) return "brakujace litery";
    if (cleanAnswer[0] === cleanExpected[0]) return "koncowki";
    return "literowki";
  }
  return "znaczenie";
}

// Learning session: mark a word as introduced and schedule its first review
// (next day) in every skill. Learning teaches, it does not test, so it does NOT
// award any skill score — every percentage shown later is genuinely earned in a
// verification module, never seeded by merely viewing the card.
export function recordLearn(progress: AppProgress, item: ExerciseItem) {
  const now = new Date();
  const tomorrow = todayKey(addDays(now, 1));
  const existing = progress.wordProgress[item.word.id] ?? makeWordProgress(item.word, item.lessonId);
  const srs = { ...existing.srs };
  skillList.forEach((skill) => {
    if (srs[skill].reps === 0) srs[skill] = { ...srs[skill], due: tomorrow };
  });
  return {
    ...progress,
    wordProgress: {
      ...progress.wordProgress,
      [item.word.id]: {
        ...existing,
        introduced: true,
        srs,
        lastPracticedAt: now.toISOString(),
        nextReviewAt: now.toISOString(),
      },
    },
  };
}

export function recordAttempt(
  progress: AppProgress,
  item: ExerciseItem,
  answer: string,
  correct: boolean,
) {
  const now = new Date();
  const skill = exerciseSkillMap[item.type];
  const expected = expectedAnswerFor(item);
  const errorType = correct ? "ok" : detectErrorType(answer, expected, item.type);
  const existing = progress.wordProgress[item.word.id] ?? makeWordProgress(item.word, item.lessonId);
  const currentScore = existing.scores[skill] ?? 0;
  const nextScore = blendScore(currentScore, correct);
  const mistakes = correct ? Math.max(0, existing.mistakes - 1) : existing.mistakes + 1;
  const nextSrs = scheduleSkill(existing.srs[skill], correct, now);
  const attempt: AttemptRecord = {
    id: crypto.randomUUID(),
    wordId: item.word.id,
    lessonId: item.lessonId,
    exerciseType: item.type,
    skill,
    prompt: promptForExercise(item),
    expected,
    answer,
    correct,
    errorType,
    createdAt: now.toISOString(),
  };

  return {
    ...progress,
    wordProgress: {
      ...progress.wordProgress,
      [item.word.id]: {
        ...existing,
        introduced: true,
        attempts: existing.attempts + 1,
        mistakes,
        scores: { ...existing.scores, [skill]: nextScore },
        srs: { ...existing.srs, [skill]: nextSrs },
        errorTypes: {
          ...existing.errorTypes,
          [errorType]: (existing.errorTypes[errorType] ?? 0) + (correct ? 0 : 1),
        },
        lastPracticedAt: now.toISOString(),
        nextReviewAt: nextSrs.due,
      },
    },
    attempts: [attempt, ...progress.attempts].slice(0, 600),
  };
}

// Pronunciation: store the measured score (automatic assessment or self-check
// fallback) and schedule the pronunciation skill like any other.
export function recordPronunciation(
  progress: AppProgress,
  item: ExerciseItem,
  passed: boolean,
  score: number,
  recognizedText = "",
) {
  const now = new Date();
  const existing = progress.wordProgress[item.word.id] ?? makeWordProgress(item.word, item.lessonId);
  const current = existing.scores.pronunciation ?? 0;
  const measured = Math.max(0, Math.min(100, Math.round(score)));
  // First spoken attempt takes the measured score outright; later ones blend so
  // the bar reacts to recent performance without throwing away history.
  const nextScore =
    existing.pronunciationAttempts === 0
      ? measured
      : Math.max(0, Math.min(100, Math.round(current * 0.4 + measured * 0.6)));
  const nextSrs = scheduleSkill(existing.srs.pronunciation, passed, now);
  const pronunciationAttempt: PronunciationAttempt = {
    id: crypto.randomUUID(),
    wordId: item.word.id,
    lessonId: item.lessonId,
    word: item.word.word,
    recognizedText,
    score: measured,
    passed,
    createdAt: now.toISOString(),
  };

  return {
    ...progress,
    wordProgress: {
      ...progress.wordProgress,
      [item.word.id]: {
        ...existing,
        introduced: true,
        pronunciationAttempts: existing.pronunciationAttempts + 1,
        mistakes: passed ? Math.max(0, existing.mistakes - 1) : existing.mistakes + 1,
        scores: { ...existing.scores, pronunciation: nextScore },
        srs: { ...existing.srs, pronunciation: nextSrs },
        errorTypes: {
          ...existing.errorTypes,
          wymowa: (existing.errorTypes.wymowa ?? 0) + (passed ? 0 : 1),
        },
        lastPracticedAt: now.toISOString(),
        nextReviewAt: nextSrs.due,
      },
    },
    pronunciationAttempts: [pronunciationAttempt, ...progress.pronunciationAttempts].slice(0, 300),
  };
}

export function completeModule(progress: AppProgress, moduleId: ModuleId, lessonId: string) {
  const today = todayKey();
  const isSameDay = progress.lastStudyDate === today;
  const previousCompletedToday = isSameDay ? progress.completedModuleKeysToday ?? [] : [];
  const moduleKey = `${today}:${lessonId}:${moduleId}`;
  const completedModuleKeysToday = Array.from(new Set([...previousCompletedToday, moduleKey]));
  const wasStreakQualified = previousCompletedToday.length >= 2;
  const isStreakQualified = completedModuleKeysToday.length >= 2;
  const shouldIncrementStreak = !wasStreakQualified && isStreakQualified;
  const baseStreak = isSameDay || wasYesterday(progress.lastStudyDate) ? progress.streak : 0;

  const streakState = {
    completedToday: completedModuleKeysToday.length,
    completedModuleKeysToday,
    lastStudyDate: today,
    streak: shouldIncrementStreak ? baseStreak + 1 : baseStreak,
  };

  // Reviews span many lessons, so they only feed the streak, not lesson completion.
  if (moduleId === "reviews") {
    return { ...progress, ...streakState };
  }

  const completedModulesForLesson = Array.from(
    new Set([...(progress.completedLessonModules[lessonId] ?? []), moduleId]),
  ) as ModuleId[];
  const lessonIsComplete = requiredLessonModules.every((required) =>
    completedModulesForLesson.includes(required),
  );

  return {
    ...progress,
    ...streakState,
    completedLessonModules: {
      ...progress.completedLessonModules,
      [lessonId]: completedModulesForLesson,
    },
    completedLessonIds: lessonIsComplete
      ? Array.from(new Set([...progress.completedLessonIds, lessonId]))
      : progress.completedLessonIds,
  };
}

export function makeWordProgress(word: WordEntry, lessonId: string): WordProgress {
  const now = new Date();
  const nowIso = now.toISOString();
  return {
    wordId: word.id,
    lessonId,
    word: word.word,
    translationPl: word.translationPl,
    introduced: false,
    scores: { meaning: 0, spelling: 0, listening: 0, pronunciation: 0 },
    srs: makeSrs(todayKey(now)),
    attempts: 0,
    mistakes: 0,
    pronunciationAttempts: 0,
    lastPracticedAt: nowIso,
    nextReviewAt: nowIso,
    errorTypes: {},
  };
}

export function expectedAnswerFor(item: ExerciseItem) {
  if (item.type === "en-pl") return item.word.translationPl;
  return item.word.word;
}

export function promptForExercise(item: ExerciseItem) {
  switch (item.type) {
    case "learn":
      return `Poznaj słowo: ${item.word.word}`;
    case "en-pl":
      return `Co znaczy "${item.word.word}"?`;
    case "writing-pl-en":
      return `Napisz po angielsku: ${item.word.translationPl}`;
    case "dictation":
      return "Posłuchaj i wpisz słowo, które słyszysz";
    case "pronunciation":
      return `Powiedz na głos: ${item.word.word}`;
  }
}

export function averagePracticedScore(state: WordProgress) {
  const values = skillList.map((skill) => state.scores[skill] ?? 0);
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

// --- Per-lesson mastery (drives the coloured status bars) ----------------------

// Average score for one skill across the words of a lesson that have actually
// been introduced. Returns null when none are introduced yet, so the UI can show
// "not started" instead of a misleading 0%.
export function lessonSkillScore(
  progress: AppProgress,
  lesson: Lesson,
  skill: SkillKey,
): number | null {
  const introduced = lesson.words
    .slice(0, lessonWordLimit)
    .map((word) => progress.wordProgress[word.id])
    .filter((state): state is WordProgress => Boolean(state?.introduced));
  if (!introduced.length) return null;
  const total = introduced.reduce((sum, state) => sum + (state.scores[skill] ?? 0), 0);
  return Math.round(total / introduced.length);
}

// Overall lesson mastery: the mean of the four skill scores, or null when the
// lesson has not been started.
export function lessonAverageScore(progress: AppProgress, lesson: Lesson): number | null {
  const perSkill = skillList
    .map((skill) => lessonSkillScore(progress, lesson, skill))
    .filter((value): value is number => value !== null);
  if (!perSkill.length) return null;
  return Math.round(perSkill.reduce((sum, value) => sum + value, 0) / perSkill.length);
}

// --- Spaced-repetition queries -------------------------------------------------

export function isSkillDue(state: WordProgress, skill: SkillKey, today = todayKey()) {
  return state.introduced && state.srs[skill].due <= today;
}

export function dueStatesForSkill(progress: AppProgress, skill: SkillKey) {
  const today = todayKey();
  return Object.values(progress.wordProgress)
    .filter((state) => isSkillDue(state, skill, today))
    .sort(
      (a, b) =>
        a.srs[skill].due.localeCompare(b.srs[skill].due) || a.srs[skill].box - b.srs[skill].box,
    );
}

export function dueCountsBySkill(progress: AppProgress): Record<SkillKey, number> {
  const today = todayKey();
  const counts: Record<SkillKey, number> = {
    meaning: 0,
    spelling: 0,
    listening: 0,
    pronunciation: 0,
  };
  Object.values(progress.wordProgress).forEach((state) => {
    skillList.forEach((skill) => {
      if (isSkillDue(state, skill, today)) counts[skill] += 1;
    });
  });
  return counts;
}

export function totalDueCount(progress: AppProgress) {
  const counts = dueCountsBySkill(progress);
  return skillList.reduce((sum, skill) => sum + counts[skill], 0);
}

// Every due (word, skill) pair, round-robined across skills so a mixed review
// session alternates exercise types instead of grouping by skill.
export function allDueEntries(progress: AppProgress): { state: WordProgress; skill: SkillKey }[] {
  const perSkill = skillList.map((skill) => ({ skill, states: dueStatesForSkill(progress, skill) }));
  const result: { state: WordProgress; skill: SkillKey }[] = [];
  let added = true;
  for (let index = 0; added; index += 1) {
    added = false;
    perSkill.forEach(({ skill, states }) => {
      if (states[index]) {
        result.push({ state: states[index], skill });
        added = true;
      }
    });
  }
  return result;
}

// Words sorted worst-first, for the parent dashboard.
export function weakWordStates(progress: AppProgress) {
  return Object.values(progress.wordProgress)
    .filter((state) => state.introduced)
    .sort(
      (a, b) =>
        averagePracticedScore(a) - averagePracticedScore(b) || b.mistakes - a.mistakes,
    );
}

export function summarizeProgress(progress: AppProgress): StatSummary {
  const states = Object.values(progress.wordProgress);
  const average = (skill: SkillKey) =>
    states.length
      ? Math.round(
          states.reduce((sum, state) => sum + (state.scores[skill] ?? 0), 0) / states.length,
        )
      : 0;
  const dueBySkill = dueCountsBySkill(progress);
  return {
    comprehension: average("meaning") || 0,
    spelling: average("spelling") || 0,
    listening: average("listening") || 0,
    pronunciation: average("pronunciation") || 0,
    learnedCount: states.filter((state) => state.introduced).length,
    dueBySkill,
    dueTotal: skillList.reduce((sum, skill) => sum + dueBySkill[skill], 0),
  };
}

export function lessonLearned(progress: AppProgress, lesson: Lesson) {
  return lesson.words
    .slice(0, lessonWordLimit)
    .every((word) => progress.wordProgress[word.id]?.introduced);
}

export function introducedCountForLesson(progress: AppProgress, lesson: Lesson) {
  return lesson.words
    .slice(0, lessonWordLimit)
    .filter((word) => progress.wordProgress[word.id]?.introduced).length;
}

export function findActiveLesson(progress: AppProgress, lessons: Lesson[]) {
  if (progress.activeLessonId) {
    const explicit = lessons.find((lesson) => lesson.id === progress.activeLessonId);
    if (explicit) return explicit;
  }
  return findNextLesson(progress, lessons);
}

export function findNextLesson(progress: AppProgress, lessons: Lesson[]) {
  return lessons.find((lesson) => !progress.completedLessonIds.includes(lesson.id)) ?? lessons[0];
}

export function nextModuleForLesson(progress: AppProgress, lesson: Lesson): ModuleId {
  if (!lessonLearned(progress, lesson)) return "learn";
  const done = progress.completedLessonModules[lesson.id] ?? [];
  return requiredLessonModules.find((module) => !done.includes(module)) ?? "comprehension";
}

export function normalizeProgress(progress: AppProgress): AppProgress {
  const isToday = progress.lastStudyDate === todayKey();
  const today = todayKey();
  const wordProgress: Record<string, WordProgress> = {};
  Object.entries(progress.wordProgress ?? {}).forEach(([key, state]) => {
    const scores = {
      meaning: state.scores?.meaning ?? 0,
      spelling: state.scores?.spelling ?? 0,
      listening: state.scores?.listening ?? 0,
      pronunciation: state.scores?.pronunciation ?? 0,
    };
    const existingSrs = state.srs ?? ({} as Partial<Record<SkillKey, SkillSrs>>);
    const srs = {} as Record<SkillKey, SkillSrs>;
    skillList.forEach((skill) => {
      srs[skill] = existingSrs[skill] ?? freshSrs(today);
    });
    wordProgress[key] = {
      ...state,
      introduced: state.introduced ?? (state.attempts ?? 0) > 0,
      scores,
      srs,
    };
  });
  return {
    ...emptyProgress,
    ...progress,
    completedToday: isToday ? progress.completedToday ?? 0 : 0,
    completedModuleKeysToday: isToday ? progress.completedModuleKeysToday ?? [] : [],
    wordProgress,
    attempts: progress.attempts ?? [],
    pronunciationAttempts: progress.pronunciationAttempts ?? [],
    completedLessonIds: progress.completedLessonIds ?? [],
    completedLessonModules: progress.completedLessonModules ?? {},
    customLessons: progress.customLessons ?? [],
  };
}

function wasYesterday(dateKey: string) {
  if (!dateKey) return false;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return todayKey(yesterday) === dateKey;
}
