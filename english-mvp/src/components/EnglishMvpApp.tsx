"use client";

import Papa from "papaparse";
import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  Brain,
  Check,
  ChevronRight,
  Flame,
  GraduationCap,
  Headphones,
  Import,
  Loader2,
  Mic,
  PenLine,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Target,
  Upload,
  Volume2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  allDueEntries,
  averagePracticedScore,
  completeModule,
  dueStatesForSkill,
  emptyProgress,
  expectedAnswerFor,
  findActiveLesson,
  introducedCountForLesson,
  isAnswerCorrect,
  lessonAverageScore,
  lessonSkillScore,
  lessonWordLimit,
  loadProgress,
  moduleSkill,
  recordAttempt,
  recordLearn,
  recordPronunciation,
  requiredLessonModules,
  saveProgress,
  skillExerciseType,
  summarizeProgress,
  weakWordStates,
} from "@/lib/learning";
import {
  isPronunciationAutoSupported,
  recognizeSpeech,
  scorePronunciation,
} from "@/lib/pronunciation";
import { seedLessons, sourceNotes } from "@/lib/seed";
import type {
  AppProgress,
  CefrLevel,
  CustomLessonInput,
  ExerciseItem,
  ExerciseType,
  FlashcardDirection,
  Lesson,
  ModuleId,
  SkillKey,
  WordEntry,
  WordProgress,
} from "@/lib/types";

type View =
  | "home"
  | "modules"
  | "module"
  | "lessons"
  | "reviews"
  | "exercise"
  | "result"
  | "progress"
  | "admin";
type Feedback = { kind: "ok" | "bad" | "info"; text: string } | null;
type ReviewTarget = SkillKey | "all";

type SessionAnswer = { item: ExerciseItem; answer: string; correct: boolean };
type SessionLearn = { item: ExerciseItem; confident: boolean };
type SessionPronunciation = { item: ExerciseItem; passed: boolean; score: number; recognized: string };

type ModuleSession = {
  moduleId: ModuleId;
  lessonId: string;
  lessonTitle: string;
  queue: ExerciseItem[];
  index: number;
  learn: Record<string, SessionLearn>;
  answers: Record<string, SessionAnswer>;
  pronunciation: Record<string, SessionPronunciation>;
};

type ResultState = {
  moduleId: ModuleId;
  lessonTitle: string;
  total: number;
  correct: number;
};

type ModuleKind = "learn" | "verify";

type ModuleConfig = {
  id: ModuleId;
  title: string;
  subtitle: string;
  detail: string;
  icon: LucideIcon;
  accent: string;
  bg: string;
  bar: string;
  cta: string;
  minutes: number;
  kind: ModuleKind;
};

const progressLoadTimeoutMs = 8000;
const allowedCefr: CefrLevel[] = ["A2", "B1", "B2", "C1"];

const modules: ModuleConfig[] = [
  {
    id: "learn",
    title: "Nauka",
    subtitle: "Poznaj nowe słowa",
    detail: "Sesja nauki: słowo, wymowa, znaczenie i przykład. Tu się uczysz, a nie testujesz.",
    icon: GraduationCap,
    accent: "text-indigo-700",
    bg: "bg-indigo-50",
    bar: "bg-indigo-600",
    cta: "Zacznij naukę",
    minutes: 8,
    kind: "learn",
  },
  {
    id: "comprehension",
    title: "Rozumienie",
    subtitle: "EN → PL",
    detail: "Rozpoznaj znaczenie angielskiego słowa.",
    icon: Brain,
    accent: "text-emerald-700",
    bg: "bg-emerald-50",
    bar: "bg-emerald-600",
    cta: "Sprawdź rozumienie",
    minutes: 6,
    kind: "verify",
  },
  {
    id: "writing",
    title: "Pisanie",
    subtitle: "PL → EN",
    detail: "Napisz angielskie słowo bez błędu.",
    icon: PenLine,
    accent: "text-blue-700",
    bg: "bg-blue-50",
    bar: "bg-blue-600",
    cta: "Ćwicz pisanie",
    minutes: 6,
    kind: "verify",
  },
  {
    id: "listening",
    title: "Słuchanie",
    subtitle: "Dyktando",
    detail: "Posłuchaj i wpisz słowo, które słyszysz.",
    icon: Headphones,
    accent: "text-sky-700",
    bg: "bg-sky-50",
    bar: "bg-sky-600",
    cta: "Ćwicz słuchanie",
    minutes: 6,
    kind: "verify",
  },
  {
    id: "pronunciation",
    title: "Wymowa",
    subtitle: "Mów i sprawdź",
    detail: "Powiedz słowo na głos — aplikacja automatycznie oceni wymowę.",
    icon: Mic,
    accent: "text-violet-700",
    bg: "bg-violet-50",
    bar: "bg-violet-600",
    cta: "Ćwicz wymowę",
    minutes: 6,
    kind: "verify",
  },
];

const verifyModules = modules.filter((module) => module.kind === "verify");
const learnModule = modules.find((module) => module.id === "learn")!;

const skillStyles: Record<SkillKey, { bg: string; text: string; bar: string }> = {
  meaning: { bg: "bg-emerald-50", text: "text-emerald-700", bar: "bg-emerald-600" },
  spelling: { bg: "bg-blue-50", text: "text-blue-700", bar: "bg-blue-600" },
  listening: { bg: "bg-sky-50", text: "text-sky-700", bar: "bg-sky-600" },
  pronunciation: { bg: "bg-violet-50", text: "text-violet-700", bar: "bg-violet-600" },
};

const reviewSkills: { skill: SkillKey; label: string; icon: LucideIcon }[] = [
  { skill: "meaning", label: "Rozumienie", icon: Brain },
  { skill: "spelling", label: "Pisanie", icon: PenLine },
  { skill: "listening", label: "Słuchanie", icon: Headphones },
  { skill: "pronunciation", label: "Wymowa", icon: Mic },
];

const tabItems: { id: View; label: string; icon: LucideIcon }[] = [
  { id: "home", label: "Panel", icon: Target },
  { id: "modules", label: "Moduły", icon: BookOpen },
  { id: "reviews", label: "Powtórki", icon: RotateCcw },
  { id: "progress", label: "Postępy", icon: BarChart3 },
];

export function EnglishMvpApp() {
  const [progress, setProgress] = useState<AppProgress>(emptyProgress);
  const [loaded, setLoaded] = useState(false);
  const [storageWarning, setStorageWarning] = useState("");
  const [view, setView] = useState<View>("home");
  const [selectedModuleId, setSelectedModuleId] = useState<ModuleId>("learn");
  const [learnDirection, setLearnDirection] = useState<FlashcardDirection>("en-pl");
  const [session, setSession] = useState<ModuleSession | null>(null);
  const [result, setResult] = useState<ResultState | null>(null);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [assessing, setAssessing] = useState(false);
  const [pronAutoSupported, setPronAutoSupported] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [adminMessage, setAdminMessage] = useState("");
  const justLoadedRef = useRef(false);
  const storageDisabledRef = useRef(false);
  const englishVoiceRef = useRef<SpeechSynthesisVoice | null>(null);

  const allLessons = useMemo(
    () => [...seedLessons, ...progress.customLessons],
    [progress.customLessons],
  );
  const activeLesson = useMemo(() => findActiveLesson(progress, allLessons), [progress, allLessons]);
  const stats = useMemo(() => summarizeProgress(progress), [progress]);
  const weakWords = useMemo(() => weakWordStates(progress), [progress]);
  const introducedInLesson = introducedCountForLesson(progress, activeLesson);
  const lessonWordCount = Math.min(lessonWordLimit, activeLesson.words.length);
  const selectedModule = modules.find((module) => module.id === selectedModuleId) ?? modules[0];
  const currentItem = session?.queue[session.index];
  const currentDone = currentItem
    ? currentItem.type === "learn"
      ? Boolean(session?.learn[currentItem.id])
      : Boolean(session?.answers[currentItem.id] || session?.pronunciation[currentItem.id])
    : false;
  const currentAnswered = currentItem ? Boolean(session?.answers[currentItem.id]) : false;

  useEffect(() => {
    // Feature detection can only run in the browser, so we sync it after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPronAutoSupported(isPronunciationAutoSupported());
  }, []);

  useEffect(() => {
    // Pick a real English voice once the browser has loaded its voice list. On a
    // Polish system the default voice reads English with Polish phonetics, so we
    // must explicitly choose en-* — otherwise "house" gets spoken like "hołse".
    if (!("speechSynthesis" in window)) return;
    const choose = () => {
      englishVoiceRef.current = pickEnglishVoice(window.speechSynthesis.getVoices());
    };
    choose();
    window.speechSynthesis.addEventListener("voiceschanged", choose);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", choose);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let finished = false;

    const finishLoading = (nextProgress: AppProgress, warning = "", disableStorage = false) => {
      if (cancelled || finished) return;
      finished = true;
      window.clearTimeout(timeoutId);
      if (disableStorage) storageDisabledRef.current = true;
      justLoadedRef.current = true;
      setStorageWarning(warning);
      setProgress(nextProgress);
      setLoaded(true);
    };

    const timeoutId = window.setTimeout(() => {
      finishLoading(
        emptyProgress,
        "Wczytywanie zapisu trwa za długo. Włączyłem tryb tylko do nauki — żeby nie nadpisać wcześniejszych danych, postęp z tej sesji nie zostanie zapisany.",
        true,
      );
    }, progressLoadTimeoutMs);

    loadProgress()
      .then((saved) => finishLoading(saved))
      .catch(() =>
        finishLoading(
          emptyProgress,
          "Nie można odczytać zapisu offline. Aby nie nadpisać danych, zapisywanie jest w tej sesji wyłączone.",
          true,
        ),
      );

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    if (!loaded) return;
    if (storageDisabledRef.current) return;
    if (justLoadedRef.current) {
      justLoadedRef.current = false;
      return;
    }
    saveProgress(progress).catch(() => {
      setStorageWarning("Nie można zapisać postępu offline w tej przeglądarce.");
    });
  }, [loaded, progress]);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => registrations.forEach((registration) => registration.unregister()))
        .catch(() => undefined);
      if ("caches" in window) {
        window.caches
          .keys()
          .then((keys) =>
            Promise.all(
              keys
                .filter((key) => key.startsWith("english-mvp"))
                .map((key) => window.caches.delete(key)),
            ),
          )
          .catch(() => undefined);
      }
      return;
    }
    navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }, []);

  function openModule(moduleId: ModuleId) {
    if (moduleId === "reviews") {
      setFeedback(null);
      setView("reviews");
      return;
    }
    setSelectedModuleId(moduleId);
    setResult(null);
    setFeedback(null);
    setView("module");
  }

  function goHome() {
    setSession(null);
    setResult(null);
    setAnswer("");
    setFeedback(null);
    setAssessing(false);
    setView("home");
  }

  function selectLesson(lessonId: string) {
    setProgress({ ...progress, activeLessonId: lessonId });
    setView("modules");
  }

  function beginSession(
    moduleId: ModuleId,
    lessonId: string,
    lessonTitle: string,
    queue: ExerciseItem[],
  ) {
    setSelectedModuleId(moduleId);
    setSession({ moduleId, lessonId, lessonTitle, queue, index: 0, learn: {}, answers: {}, pronunciation: {} });
    setAnswer("");
    setFeedback(null);
    setAssessing(false);
    setResult(null);
    setView("exercise");
  }

  function startModule(moduleId = selectedModuleId) {
    const queue = buildModuleQueue(moduleId, activeLesson, learnDirection);
    if (!queue.length) {
      setFeedback({ kind: "info", text: "Brak słów w tej lekcji." });
      return;
    }
    beginSession(moduleId, activeLesson.id, activeLesson.title, queue);
  }

  function startReview(target: ReviewTarget) {
    const queue =
      target === "all"
        ? buildAllReviewQueue(progress, allLessons)
        : buildSkillReviewQueue(progress, allLessons, target);
    if (!queue.length) {
      setFeedback({ kind: "info", text: "Brak słów do powtórki w tej kategorii." });
      return;
    }
    beginSession("reviews", "reviews", "Powtórki", queue);
  }

  function rateLearn(confident: boolean) {
    if (!session || !currentItem) return;
    if (session.learn[currentItem.id]) return;
    const retryItem: ExerciseItem = {
      ...currentItem,
      id: `${currentItem.lessonId}-${session.moduleId}-${currentItem.word.id}-retry-${session.queue.length}-${Date.now()}`,
    };
    setSession({
      ...session,
      learn: { ...session.learn, [currentItem.id]: { item: currentItem, confident } },
      queue: confident ? session.queue : [...session.queue, retryItem],
    });
    setFeedback(
      confident
        ? { kind: "ok", text: "Zapisane jako umiem. Możesz przejść dalej." }
        : { kind: "info", text: "Wraca na koniec tej sesji. Zakończysz dopiero, gdy oznaczysz je jako umiem." },
    );
  }

  function checkTextAnswer() {
    if (!session || !currentItem) return;
    if (currentItem.type === "learn" || currentItem.type === "pronunciation") return;
    if (session.answers[currentItem.id]) return; // locked after the first check
    const expected = expectedAnswerFor(currentItem);
    const correct = isAnswerCorrect(answer, expected);
    setSession({
      ...session,
      answers: { ...session.answers, [currentItem.id]: { item: currentItem, answer, correct } },
    });
    setFeedback(
      correct
        ? { kind: "ok", text: "Dobrze. Możesz przejść dalej." }
        : { kind: "bad", text: `Do powtórki. Poprawna odpowiedź: ${expected}` },
    );
  }

  async function assessPronunciationAuto() {
    if (!session || !currentItem || assessing) return;
    const target = currentItem;
    setAssessing(true);
    setFeedback({ kind: "info", text: "Słucham... powiedz słowo wyraźnie." });
    try {
      const { transcript, confidence } = await recognizeSpeech("en-US");
      const assessment = scorePronunciation(target.word.word, transcript, confidence);
      setSession((prev) =>
        prev
          ? {
              ...prev,
              pronunciation: {
                ...prev.pronunciation,
                [target.id]: {
                  item: target,
                  passed: assessment.passed,
                  score: assessment.score,
                  recognized: assessment.recognized,
                },
              },
            }
          : prev,
      );
      setFeedback({
        kind: assessment.passed ? "ok" : "bad",
        text: `${assessment.detail} Wynik: ${assessment.score}%.`,
      });
    } catch (error) {
      const code = error instanceof Error ? error.message : "error";
      if (code === "not-allowed" || code === "service-not-allowed") {
        setFeedback({
          kind: "bad",
          text: "Brak dostępu do mikrofonu. Zezwól na mikrofon w przeglądarce i spróbuj ponownie.",
        });
      } else if (code === "no-speech" || code === "timeout") {
        setFeedback({ kind: "bad", text: "Nie usłyszałem słowa. Spróbuj jeszcze raz, mów wyraźnie." });
      } else {
        setFeedback({
          kind: "bad",
          text: "Nie udało się ocenić automatycznie. Oceń wymowę samodzielnie po odsłuchu wzorca.",
        });
        setSession((prev) =>
          prev
            ? {
                ...prev,
                pronunciation: {
                  ...prev.pronunciation,
                  [target.id]: { item: target, passed: false, score: 40, recognized: "" },
                },
              }
            : prev,
        );
      }
    } finally {
      setAssessing(false);
    }
  }

  function ratePronunciationManual(passed: boolean) {
    if (!session || !currentItem) return;
    setSession({
      ...session,
      pronunciation: {
        ...session.pronunciation,
        [currentItem.id]: { item: currentItem, passed, score: passed ? 80 : 40, recognized: "" },
      },
    });
    setFeedback(
      passed
        ? { kind: "ok", text: "Zapisane jako dobre. Możesz przejść dalej." }
        : { kind: "bad", text: "Zapisane do powtórki. Posłuchaj wzorca jeszcze raz." },
    );
  }

  function nextCard() {
    if (!session) return;
    setAnswer("");
    setFeedback(null);
    setAssessing(false);
    if (session.index + 1 >= session.queue.length) {
      finishModule(session);
      return;
    }
    setSession({ ...session, index: session.index + 1 });
  }

  function finishModule(doneSession: ModuleSession) {
    let nextProgress = progress;
    const confidentLearnByWord = new Map<string, SessionLearn>();
    Object.values(doneSession.learn).forEach((entry) => {
      if (entry.confident) confidentLearnByWord.set(entry.item.word.id, entry);
    });
    confidentLearnByWord.forEach((entry) => {
      nextProgress = recordLearn(nextProgress, entry.item);
    });
    Object.values(doneSession.answers).forEach((entry) => {
      nextProgress = recordAttempt(nextProgress, entry.item, entry.answer, entry.correct);
    });
    Object.values(doneSession.pronunciation).forEach((entry) => {
      nextProgress = recordPronunciation(
        nextProgress,
        entry.item,
        entry.passed,
        entry.score,
        entry.recognized,
      );
    });

    nextProgress = completeModule(nextProgress, doneSession.moduleId, doneSession.lessonId);
    if (
      nextProgress.completedLessonIds.includes(doneSession.lessonId) &&
      nextProgress.activeLessonId === doneSession.lessonId
    ) {
      nextProgress = { ...nextProgress, activeLessonId: "" };
    }

    const learnWordCount = new Set(doneSession.queue.map((item) => item.word.id)).size;
    const textAnswers = Object.values(doneSession.answers);
    const pronunciationAnswers = Object.values(doneSession.pronunciation);
    const correct =
      confidentLearnByWord.size +
      textAnswers.filter((entry) => entry.correct).length +
      pronunciationAnswers.filter((entry) => entry.passed).length;
    const total =
      doneSession.moduleId === "learn"
        ? learnWordCount
        : textAnswers.length + pronunciationAnswers.length;

    setProgress(nextProgress);
    setResult({
      moduleId: doneSession.moduleId,
      lessonTitle: doneSession.lessonTitle,
      total,
      correct,
    });
    setSession(null);
    setView("result");
  }

  function speak(text: string) {
    if (!("speechSynthesis" in window)) {
      setFeedback({ kind: "bad", text: "Odsłuch nie jest dostępny w tej przeglądarce." });
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    // Re-check in case voices finished loading after mount.
    const voice = englishVoiceRef.current ?? pickEnglishVoice(window.speechSynthesis.getVoices());
    englishVoiceRef.current = voice;
    if (voice) utterance.voice = voice;
    // Keep lang on en-GB even without a matched voice so the engine leans English.
    utterance.lang = voice?.lang ?? "en-GB";
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  }

  async function resetProgress() {
    if (!window.confirm("Wyzerować cały postęp nauki? Tej operacji nie można cofnąć.")) return;
    // Keep imported custom lessons; wipe everything else back to a clean slate.
    const cleared: AppProgress = { ...emptyProgress, customLessons: progress.customLessons };
    setProgress(cleared);
    try {
      await saveProgress(cleared);
    } catch {
      setStorageWarning("Nie można zapisać postępu offline w tej przeglądarce.");
    }
    setAdminMessage("Postęp wyzerowany — wszystkie lekcje zaczynają od zera.");
    setView("home");
  }

  function importCsv() {
    setAdminMessage("");
    const parsed = Papa.parse<CustomLessonInput>(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
    });
    if (parsed.errors.length) {
      setAdminMessage(`CSV ma błąd: ${parsed.errors[0].message}`);
      return;
    }
    const rows = parsed.data.filter((row) => row.word && row.translation_pl);
    if (rows.length < 4) {
      setAdminMessage("Import wymaga minimum 4 wierszy ze słowem i tłumaczeniem.");
      return;
    }
    const first = rows[0];
    const lessonCefr = (allowedCefr as string[]).includes(first.cefr ?? "")
      ? (first.cefr as CefrLevel)
      : "B1";
    const lessonId = `custom-${Date.now()}`;
    const lesson: Lesson = {
      id: lessonId,
      course: first.course || "Custom",
      unit: first.unit || "Import",
      title: first.lesson || `Lekcja własna ${progress.customLessons.length + 1}`,
      cefr: lessonCefr,
      source: "Repair",
      words: rows.map((row, index) => ({
        id: `${lessonId}-${index + 1}`,
        word: row.word.trim(),
        translationPl: row.translation_pl.trim(),
        partOfSpeech: row.part_of_speech || "słowo",
        cefr: (allowedCefr as string[]).includes(row.cefr ?? "")
          ? (row.cefr as CefrLevel)
          : lessonCefr,
        ipa: row.ipa || "",
        example: row.example || `I can use "${row.word.trim()}" in a simple English sentence.`,
        collocations: row.collocations
          ? row.collocations.split("|").map((item) => item.trim())
          : [],
        tags: row.tags ? row.tags.split("|").map((item) => item.trim()) : ["import"],
        source: "Repair",
      })),
    };
    setProgress({
      ...progress,
      customLessons: [...progress.customLessons, lesson],
      activeLessonId: lesson.id,
    });
    setCsvText("");
    setAdminMessage(
      `Dodano lekcję "${lesson.title}" (${lesson.words.length} słów) i ustawiono ją jako aktywną.`,
    );
    setView("modules");
  }

  if (!loaded) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-slate-50 px-6 text-slate-900">
        <div className="flex items-center gap-3 rounded-2xl bg-white px-5 py-4 shadow-sm">
          <Loader2 className="size-5 animate-spin text-blue-600" />
          <span className="text-sm font-medium">Ładuję postęp offline...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-[#f6f7f9] text-slate-950">
      <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col lg:grid lg:grid-cols-[440px_1fr]">
        <section className="relative flex min-h-dvh flex-col border-slate-200 bg-white lg:border-r">
          <div className="flex-1 overflow-y-auto px-4 pb-28 pt-5 sm:px-6">
            {storageWarning && view !== "exercise" && (
              <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-800">
                {storageWarning}
              </div>
            )}
            {view === "home" && (
              <HomeView
                stats={stats}
                progress={progress}
                today={todayLabel()}
                activeLesson={activeLesson}
                introducedInLesson={introducedInLesson}
                lessonWordCount={lessonWordCount}
                onStartLearn={() => openModule("learn")}
                onOpenModule={openModule}
                onOpenReviews={() => setView("reviews")}
                onChooseLesson={() => setView("lessons")}
              />
            )}
            {view === "modules" && (
              <ModulesView
                stats={stats}
                progress={progress}
                activeLesson={activeLesson}
                introducedInLesson={introducedInLesson}
                lessonWordCount={lessonWordCount}
                onOpenModule={openModule}
                onOpenReviews={() => setView("reviews")}
                onChooseLesson={() => setView("lessons")}
              />
            )}
            {view === "reviews" && (
              <ReviewsHubView stats={stats} onBack={goHome} onStart={startReview} feedback={feedback} />
            )}
            {view === "lessons" && (
              <LessonsView
                lessons={allLessons}
                progress={progress}
                activeLessonId={activeLesson.id}
                onSelect={selectLesson}
                onBack={() => setView("modules")}
              />
            )}
            {view === "module" && (
              <ModuleDetailView
                module={selectedModule}
                progress={progress}
                lesson={activeLesson}
                completedModules={progress.completedLessonModules[activeLesson.id] ?? []}
                introducedInLesson={introducedInLesson}
                lessonWordCount={lessonWordCount}
                learnDirection={learnDirection}
                pronAutoSupported={pronAutoSupported}
                onLearnDirection={setLearnDirection}
                onHome={goHome}
                onStart={() => startModule(selectedModule.id)}
              />
            )}
            {view === "exercise" && session && currentItem && (
              <ExerciseView
                module={modules.find((module) => module.id === session.moduleId) ?? selectedModule}
                isReview={session.moduleId === "reviews"}
                item={currentItem}
                index={session.index}
                total={session.queue.length}
                answer={answer}
                feedback={feedback}
                answered={currentAnswered}
                canContinue={currentDone}
                assessing={assessing}
                pronResult={session.pronunciation[currentItem.id]}
                pronAutoSupported={pronAutoSupported}
                onHome={goHome}
                onAnswer={setAnswer}
                onSpeak={speak}
                onCheck={checkTextAnswer}
                onNext={nextCard}
                onRateLearn={rateLearn}
                onAssessAuto={assessPronunciationAuto}
                onRateManual={ratePronunciationManual}
              />
            )}
            {view === "result" && result && (
              <ResultView
                result={result}
                stats={stats}
                onHome={goHome}
                onModule={() => openModule(result.moduleId)}
                onReviews={() => setView("reviews")}
                canReview={stats.dueTotal > 0}
              />
            )}
            {view === "progress" && (
              <ProgressView
                stats={stats}
                progress={progress}
                lessons={allLessons}
                onOpenReviews={() => setView("reviews")}
                onOpenAdmin={() => setView("admin")}
              />
            )}
            {view === "admin" && (
              <AdminView
                lessons={allLessons}
                stats={stats}
                weakWords={weakWords}
                csvText={csvText}
                adminMessage={adminMessage}
                onBack={() => setView("progress")}
                onCsvText={setCsvText}
                onImport={importCsv}
                onReset={resetProgress}
                onOpenModule={openModule}
              />
            )}
          </div>
          {view !== "exercise" && view !== "result" && (
            <BottomTabs active={view} onChange={(next) => setView(next)} />
          )}
        </section>
        <aside className="hidden min-h-dvh bg-[#f6f7f9] p-8 lg:block">
          <DesktopContext
            lessons={allLessons}
            progress={progress}
            activeLesson={activeLesson}
            stats={stats}
            pronAutoSupported={pronAutoSupported}
            onOpenModule={openModule}
          />
        </aside>
      </div>
    </main>
  );
}

function HomeView({
  stats,
  progress,
  today,
  activeLesson,
  introducedInLesson,
  lessonWordCount,
  onStartLearn,
  onOpenModule,
  onOpenReviews,
  onChooseLesson,
}: {
  stats: ReturnType<typeof summarizeProgress>;
  progress: AppProgress;
  today: string;
  activeLesson: Lesson;
  introducedInLesson: number;
  lessonWordCount: number;
  onStartLearn: () => void;
  onOpenModule: (moduleId: ModuleId) => void;
  onOpenReviews: () => void;
  onChooseLesson: () => void;
}) {
  const learnPercent = Math.round((introducedInLesson / Math.max(1, lessonWordCount)) * 100);
  const learnDone = introducedInLesson >= lessonWordCount;
  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-600">English MVP</p>
          <h1 className="mt-2 text-3xl font-black tracking-normal">Panel główny</h1>
          <p className="mt-1 text-sm text-slate-500">{today} · {activeLesson.title}</p>
        </div>
        <div className="rounded-2xl bg-amber-50 px-3 py-2 text-right text-amber-700">
          <Flame className="ml-auto size-4" />
          <p className="text-lg font-black">{progress.streak}</p>
        </div>
      </header>

      {stats.dueTotal > 0 && (
        <button
          onClick={onOpenReviews}
          className="flex w-full items-center gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-left"
        >
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white">
            <RotateCcw className="size-6 text-amber-700" />
          </span>
          <span className="flex-1">
            <span className="block font-bold">Powtórki na dziś</span>
            <span className="text-sm text-slate-600">{stats.dueTotal} słów czeka na utrwalenie</span>
          </span>
          <ChevronRight className="size-5 text-amber-700" />
        </button>
      )}

      <button
        onClick={onStartLearn}
        className="w-full rounded-3xl bg-indigo-600 p-5 text-left text-white shadow-sm"
      >
        <div className="flex items-center gap-3">
          <span className="grid size-12 place-items-center rounded-2xl bg-white/20">
            <GraduationCap className="size-7" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-100">Krok 1 · Sesja nauki</p>
            <p className="text-xl font-black">{learnDone ? "Powtórz naukę słów" : "Naucz się słów"}</p>
          </div>
        </div>
        <p className="mt-3 text-sm text-indigo-100">
          {introducedInLesson}/{lessonWordCount} słów poznanych w tej lekcji
        </p>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/25">
          <div className="h-full rounded-full bg-white" style={{ width: `${Math.max(4, learnPercent)}%` }} />
        </div>
      </button>

      <section>
        <p className="mb-3 text-lg font-bold">Krok 2 · Sprawdź się</p>
        <div className="grid grid-cols-2 gap-3">
          {verifyModules.map((module) => {
            const moduleStatus = moduleLessonStatus(
              module.id,
              progress,
              activeLesson,
              introducedInLesson,
              lessonWordCount,
            );
            return (
              <ModuleCard
                key={module.id}
                module={module}
                value={moduleStatus.value}
                started={moduleStatus.started}
                subtitle={module.subtitle}
                onClick={() => onOpenModule(module.id)}
              />
            );
          })}
        </div>
      </section>

      <button
        onClick={onChooseLesson}
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700"
      >
        <BookOpen className="size-4" /> Zmień lekcję
      </button>

      <section>
        <p className="mb-3 text-sm font-semibold text-slate-700">Twoje umiejętności</p>
        <div className="grid grid-cols-2 gap-3">
          <Metric label="Rozumienie" value={stats.comprehension} skill="meaning" />
          <Metric label="Pisanie" value={stats.spelling} skill="spelling" />
          <Metric label="Słuchanie" value={stats.listening} skill="listening" />
          <Metric label="Wymowa" value={stats.pronunciation} skill="pronunciation" />
        </div>
      </section>

      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
        <p className="font-bold">Seria</p>
        <p className="mt-1 text-sm text-slate-600">
          Dzisiaj zaliczone moduły: {Math.min(progress.completedToday, 2)}/2. Seria rośnie po
          ukończeniu 2 modułów jednego dnia.
        </p>
      </div>
    </div>
  );
}

function ModulesView({
  stats,
  progress,
  activeLesson,
  introducedInLesson,
  lessonWordCount,
  onOpenModule,
  onOpenReviews,
  onChooseLesson,
}: {
  stats: ReturnType<typeof summarizeProgress>;
  progress: AppProgress;
  activeLesson: Lesson;
  introducedInLesson: number;
  lessonWordCount: number;
  onOpenModule: (moduleId: ModuleId) => void;
  onOpenReviews: () => void;
  onChooseLesson: () => void;
}) {
  const completedModules = progress.completedLessonModules[activeLesson.id] ?? [];
  return (
    <div className="space-y-5">
      <ScreenTitle title="Moduły" text={`${activeLesson.title}. Najpierw nauka, potem 4 sprawdziany.`} />
      <button
        onClick={onChooseLesson}
        className="flex w-full items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700"
      >
        <span className="flex items-center gap-2">
          <BookOpen className="size-4" /> Zmień lekcję
        </span>
        <ChevronRight className="size-4 text-slate-400" />
      </button>

      <ModuleRow
        module={learnModule}
        meta={`${introducedInLesson}/${lessonWordCount} poznanych`}
        value={Math.round((introducedInLesson / Math.max(1, lessonWordCount)) * 100)}
        started={introducedInLesson > 0}
        done={introducedInLesson >= lessonWordCount}
        onClick={() => onOpenModule(learnModule.id)}
      />

      <p className="pt-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Sprawdziany</p>
      <div className="space-y-3">
        {verifyModules.map((module) => {
          const moduleStatus = moduleLessonStatus(
            module.id,
            progress,
            activeLesson,
            introducedInLesson,
            lessonWordCount,
          );
          return (
            <ModuleRow
              key={module.id}
              module={module}
              meta={`${module.subtitle} · ${moduleStatus.started ? `${moduleStatus.value}%` : "nierozpoczęte"}`}
              value={moduleStatus.value}
              started={moduleStatus.started}
              done={completedModules.includes(module.id)}
              onClick={() => onOpenModule(module.id)}
            />
          );
        })}
      </div>

      <button
        onClick={onOpenReviews}
        className="flex w-full items-center gap-4 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-left shadow-sm"
      >
        <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-white">
          <RotateCcw className="size-7 text-amber-700" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-bold">Powtórki</span>
          <span className="mt-1 block text-sm text-slate-500">
            {stats.dueTotal > 0 ? `${stats.dueTotal} słów do powtórki` : "Brak powtórek na dziś"}
          </span>
        </span>
        <ChevronRight className="size-5 text-slate-400" />
      </button>
    </div>
  );
}

function ReviewsHubView({
  stats,
  onBack,
  onStart,
  feedback,
}: {
  stats: ReturnType<typeof summarizeProgress>;
  onBack: () => void;
  onStart: (target: ReviewTarget) => void;
  feedback: Feedback;
}) {
  return (
    <div className="space-y-5">
      <BackHeader label="Powtórki" onBack={onBack} />
      <p className="text-sm leading-6 text-slate-600">
        Regularnie utrwalaj wszystkie słowa. Każda umiejętność ma własny harmonogram — słowa wracają
        coraz rzadziej, gdy je umiesz, i częściej, gdy się mylisz.
      </p>

      {feedback && (
        <div className="rounded-2xl bg-blue-50 p-4 text-sm font-semibold text-blue-800">{feedback.text}</div>
      )}

      {stats.dueTotal === 0 ? (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 text-center">
          <Check className="mx-auto size-8 text-emerald-600" />
          <p className="mt-2 font-bold text-emerald-800">Brak powtórek na dziś</p>
          <p className="mt-1 text-sm text-emerald-700">Świetnie! Wróć jutro albo poznaj nowe słowa.</p>
        </div>
      ) : (
        <>
          <button
            onClick={() => onStart("all")}
            className="flex min-h-16 w-full items-center justify-between rounded-2xl bg-amber-500 px-5 text-left font-bold text-white"
          >
            <span>
              <span className="block text-lg">Powtórz wszystko</span>
              <span className="text-sm font-semibold text-amber-50">Mieszane: {stats.dueTotal} słów</span>
            </span>
            <ChevronRight className="size-6" />
          </button>

          <p className="pt-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Albo osobno per umiejętność
          </p>
          <div className="space-y-3">
            {reviewSkills.map(({ skill, label, icon: Icon }) => {
              const count = stats.dueBySkill[skill];
              const style = skillStyles[skill];
              return (
                <button
                  key={skill}
                  onClick={() => onStart(skill)}
                  disabled={count === 0}
                  className={`flex w-full items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 text-left shadow-sm ${
                    count === 0 ? "opacity-50" : ""
                  }`}
                >
                  <span className={`grid size-12 shrink-0 place-items-center rounded-2xl ${style.bg}`}>
                    <Icon className={`size-6 ${style.text}`} />
                  </span>
                  <span className="flex-1">
                    <span className="block font-bold">{label}</span>
                    <span className="text-sm text-slate-500">
                      {count > 0 ? `${count} do powtórki` : "Nic na dziś"}
                    </span>
                  </span>
                  <ChevronRight className="size-5 text-slate-400" />
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function LessonsView({
  lessons,
  progress,
  activeLessonId,
  onSelect,
  onBack,
}: {
  lessons: Lesson[];
  progress: AppProgress;
  activeLessonId: string;
  onSelect: (lessonId: string) => void;
  onBack: () => void;
}) {
  return (
    <div className="space-y-4">
      <BackHeader label="Wybierz lekcję" onBack={onBack} />
      <p className="text-sm text-slate-600">
        Dotknij lekcji, aby ustawić ją jako aktywną. Moduły będą ćwiczyć jej słowa.
      </p>
      <div className="space-y-2">
        {lessons.map((lesson) => {
          const completed = progress.completedLessonIds.includes(lesson.id);
          const active = lesson.id === activeLessonId;
          const average = lessonAverageScore(progress, lesson);
          const status = scoreStatus(average ?? 0, average !== null);
          return (
            <button
              key={lesson.id}
              onClick={() => onSelect(lesson.id)}
              className={`flex w-full items-stretch gap-3 overflow-hidden rounded-2xl border p-3 text-left ${
                active ? "border-blue-300 bg-blue-50" : "border-slate-100 bg-white"
              }`}
            >
              <span className={`-my-3 -ml-3 w-1.5 shrink-0 rounded-l-2xl ${status.bar}`} aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{lesson.title}</span>
                <span className="text-xs text-slate-500">
                  {lesson.unit} · {lesson.cefr} · {lesson.words.length} słów
                </span>
                <span className="mt-2 flex items-center gap-2">
                  <SkillDots progress={progress} lesson={lesson} />
                  <span className={`text-xs font-bold ${average !== null ? status.text : "text-slate-400"}`}>
                    {average !== null ? `${average}%` : "nierozpoczęte"}
                  </span>
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-2">
                {completed && <Check className="size-4 text-emerald-600" />}
                {active && <span className="text-xs font-bold text-blue-700">aktywna</span>}
                <ChevronRight className="size-4 text-slate-400" />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ModuleDetailView({
  module,
  progress,
  lesson,
  completedModules,
  introducedInLesson,
  lessonWordCount,
  learnDirection,
  pronAutoSupported,
  onLearnDirection,
  onHome,
  onStart,
}: {
  module: ModuleConfig;
  progress: AppProgress;
  lesson: Lesson;
  completedModules: ModuleId[];
  introducedInLesson: number;
  lessonWordCount: number;
  learnDirection: FlashcardDirection;
  pronAutoSupported: boolean;
  onLearnDirection: (direction: FlashcardDirection) => void;
  onHome: () => void;
  onStart: () => void;
}) {
  const Icon = module.icon;
  const completed = completedModules.includes(module.id);
  const { value, started } = moduleLessonStatus(
    module.id,
    progress,
    lesson,
    introducedInLesson,
    lessonWordCount,
  );
  const status = scoreStatus(value, started);
  return (
    <div className="space-y-5">
      <BackHeader label={`Panel główny > ${module.title}`} onBack={onHome} />
      <section className="text-center">
        <div className={`mx-auto grid size-24 place-items-center rounded-full ${module.bg}`}>
          <Icon className={`size-12 ${module.accent}`} />
        </div>
        <h2 className="mt-5 text-3xl font-black tracking-normal">{module.title}</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-600">{module.detail}</p>
      </section>

      {module.id === "learn" && (
        <div className="space-y-3">
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="mb-3 text-sm font-bold text-slate-700">Kierunek fiszek</p>
            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1">
              <button
                onClick={() => onLearnDirection("en-pl")}
                className={`min-h-12 rounded-xl text-sm font-black ${
                  learnDirection === "en-pl"
                    ? "bg-white text-indigo-700 shadow-sm"
                    : "text-slate-500"
                }`}
              >
                EN -&gt; PL
              </button>
              <button
                onClick={() => onLearnDirection("pl-en")}
                className={`min-h-12 rounded-xl text-sm font-black ${
                  learnDirection === "pl-en"
                    ? "bg-white text-indigo-700 shadow-sm"
                    : "text-slate-500"
                }`}
              >
                PL -&gt; EN
              </button>
            </div>
          </div>
          <StepRow icon={Volume2} title="Posłuchaj" text="Wzorzec wymowy słowa." accent={module.accent} />
          <StepRow icon={Sparkles} title="Odwróć fiszkę" text="Najpierw widzisz tylko jedną stronę." accent={module.accent} />
          <StepRow icon={Check} title="Oceń się" text="Jeszcze raz wraca na koniec tej samej sesji." accent={module.accent} />
        </div>
      )}

      {module.id === "listening" && (
        <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
          Usłyszysz słowo po angielsku (bez napisu) i wpiszesz to, co słyszysz.
        </div>
      )}

      {module.id === "pronunciation" && (
        <div className="space-y-2">
          <StepRow icon={Volume2} title="Posłuchaj wzorca" text="Najpierw poprawne brzmienie." accent={module.accent} />
          <StepRow icon={Mic} title="Mów" text="Powiedz słowo na głos." accent={module.accent} />
          <StepRow
            icon={Sparkles}
            title={pronAutoSupported ? "Ocena automatyczna" : "Samoocena"}
            text={pronAutoSupported ? "Aplikacja rozpozna mowę i wystawi wynik." : "Ta przeglądarka nie ma rozpoznawania mowy — ocenisz samodzielnie."}
            accent={module.accent}
          />
        </div>
      )}

      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">{module.id === "learn" ? "Poznane" : "Twój progres"}</p>
            <p className={`mt-1 text-3xl font-black ${started ? status.text : "text-slate-400"}`}>
              {started ? `${value}%` : "—"}
            </p>
            <span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-bold ${status.chip}`}>
              {status.label}
            </span>
          </div>
          <div className="text-right text-sm text-slate-500">
            <p>{lessonWordCount} słów</p>
            <p>{completed ? "Zaliczone" : `Ok. ${module.minutes} min`}</p>
          </div>
        </div>
        <StatusBar value={value} started={started} />
      </div>

      <button
        onClick={onStart}
        className="min-h-14 w-full rounded-2xl bg-blue-600 px-5 text-lg font-bold text-white"
      >
        {module.cta}
      </button>
      <p className="text-center text-xs text-slate-500">{lesson.title}</p>
    </div>
  );
}

function ExerciseView({
  module,
  isReview,
  item,
  index,
  total,
  answer,
  feedback,
  answered,
  canContinue,
  assessing,
  pronResult,
  pronAutoSupported,
  onHome,
  onAnswer,
  onSpeak,
  onCheck,
  onNext,
  onRateLearn,
  onAssessAuto,
  onRateManual,
}: {
  module: ModuleConfig;
  isReview: boolean;
  item: ExerciseItem;
  index: number;
  total: number;
  answer: string;
  feedback: Feedback;
  answered: boolean;
  canContinue: boolean;
  assessing: boolean;
  pronResult: SessionPronunciation | undefined;
  pronAutoSupported: boolean;
  onHome: () => void;
  onAnswer: (value: string) => void;
  onSpeak: (text: string) => void;
  onCheck: () => void;
  onNext: () => void;
  onRateLearn: (confident: boolean) => void;
  onAssessAuto: () => void;
  onRateManual: (passed: boolean) => void;
}) {
  const isLearn = item.type === "learn";
  const isPronunciation = item.type === "pronunciation";
  const isDictation = item.type === "dictation";
  const isText = item.type === "en-pl" || item.type === "writing-pl-en" || isDictation;
  const headerTitle = isReview ? "Powtórki" : module.title;
  const headerBg = isReview ? "bg-amber-50" : module.bg;
  const headerAccent = isReview ? "text-amber-700" : module.accent;
  const headerBar = isReview ? "bg-amber-500" : module.bar;
  const lastSpokenRef = useRef("");
  const [revealedCardId, setRevealedCardId] = useState("");
  const cardRevealed = !isLearn || revealedCardId === item.id;

  // Auto-play the word once when a dictation card appears (the learner must not
  // see it, only hear it).
  useEffect(() => {
    if (isDictation && lastSpokenRef.current !== item.id) {
      lastSpokenRef.current = item.id;
      const timer = window.setTimeout(() => onSpeak(item.word.word), 250);
      return () => window.clearTimeout(timer);
    }
  });

  return (
    <div className="space-y-5">
      <BackHeader label={`${headerTitle}${directionLabel(item) ? ` · ${directionLabel(item)}` : ""}`} onBack={onHome} />
      <div className="flex items-center justify-between">
        <ProgressBar value={Math.round(((index + 1) / total) * 100)} bar={headerBar} />
        <span className="ml-4 shrink-0 text-sm font-bold">{index + 1} / {total}</span>
      </div>

      <section className="rounded-3xl bg-white p-5 shadow-sm">
        <div className="text-center">
          <span className={`inline-flex rounded-full px-3 py-1 text-sm font-bold ${headerBg} ${headerAccent}`}>
            {headerTitle}
          </span>
          <h2 className="mt-5 text-2xl font-black tracking-normal">{taskTitle(item)}</h2>
        </div>

        {isDictation ? (
          <div className="mt-5 rounded-2xl bg-sky-50 p-8 text-center">
            <button
              onClick={() => onSpeak(item.word.word)}
              className="mx-auto flex size-20 items-center justify-center rounded-full bg-white shadow-sm"
              aria-label="Odtwórz słowo"
            >
              <Volume2 className="size-9 text-sky-600" />
            </button>
            <p className="mt-3 text-sm text-slate-600">Dotknij, aby odtworzyć ponownie</p>
          </div>
        ) : isLearn ? (
          <button
            type="button"
            onClick={() =>
              setRevealedCardId((current) => (current === item.id ? "" : item.id))
            }
            className="mt-5 block h-72 w-full text-left outline-none"
            style={{ perspective: "1200px" }}
            aria-label={cardRevealed ? "Ukryj odpowiedź" : "Pokaż odpowiedź"}
          >
            <div
              className="relative h-full rounded-3xl transition-transform duration-500"
              style={{
                transformStyle: "preserve-3d",
                transform: cardRevealed ? "rotateY(180deg)" : "rotateY(0deg)",
              }}
            >
              <div
                className={`absolute inset-0 flex flex-col items-center justify-center rounded-3xl p-6 text-center ${module.bg}`}
                style={{ backfaceVisibility: "hidden" }}
              >
                <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                  {directionLabel(item)}
                </p>
                <p className="mt-5 text-4xl font-black tracking-normal">
                  {flashcardFront(item)}
                </p>
                <p className="mt-6 text-sm font-semibold text-slate-600">Dotknij, aby odwrócić</p>
              </div>
              <div
                className="absolute inset-0 flex flex-col items-center justify-center rounded-3xl bg-white p-6 text-center ring-1 ring-slate-200"
                style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
              >
                <p className="text-xs font-black uppercase tracking-[0.14em] text-indigo-600">
                  Odpowiedź
                </p>
                <p className="mt-4 text-4xl font-black tracking-normal">
                  {flashcardBack(item)}
                </p>
                {item.word.ipa && <p className="mt-2 text-sm text-slate-500">/{item.word.ipa}/</p>}
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onSpeak(item.word.word);
                  }}
                  className="mt-4 inline-flex size-11 items-center justify-center rounded-2xl bg-indigo-50 shadow-sm"
                  aria-label="Posłuchaj słowa"
                >
                  <Volume2 className="size-5 text-indigo-700" />
                </button>
              </div>
            </div>
          </button>
        ) : (
          <div className={`mt-5 rounded-2xl p-6 text-center ${isReview ? skillStyles[reviewSkillForType(item.type)].bg : module.bg}`}>
            <p className="text-4xl font-black tracking-normal">{promptWord(item)}</p>
            {item.word.ipa && <p className="mt-1 text-sm text-slate-500">/{item.word.ipa}/</p>}
            {canHearWord(item.type) && (
              <button
                onClick={() => onSpeak(item.word.word)}
                className="mt-4 inline-flex size-11 items-center justify-center rounded-2xl bg-white shadow-sm"
                aria-label="Posłuchaj słowa"
              >
                <Volume2 className="size-5 text-blue-600" />
              </button>
            )}
          </div>
        )}

        {isLearn && (
          <div className="mt-5 space-y-3">
            {cardRevealed && item.word.example && (
              <div className="rounded-2xl border border-slate-100 bg-white p-4 text-left text-sm text-slate-600">
                <span className="font-semibold text-slate-700">Przykład: </span>
                {item.word.example}
              </div>
            )}
            <p className="text-center text-sm font-semibold text-slate-700">
              {cardRevealed ? "Czy już to umiesz?" : "Najpierw odwróć fiszkę i sprawdź odpowiedź."}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => onRateLearn(true)}
                disabled={!cardRevealed || canContinue}
                className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-3 text-sm font-bold text-white disabled:bg-slate-300"
              >
                <Check className="size-5" /> Umiem
              </button>
              <button
                onClick={() => onRateLearn(false)}
                disabled={!cardRevealed || canContinue}
                className="flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-amber-300 bg-amber-50 px-3 text-sm font-bold text-amber-800 disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
              >
                <RotateCcw className="size-5" /> Jeszcze raz
              </button>
            </div>
          </div>
        )}

        {isText && (
          <>
            {item.type === "writing-pl-en" && (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                Uwaga: wpisz angielskie słowo bez błędu.
              </div>
            )}
            <textarea
              value={answer}
              onChange={(event) => onAnswer(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  if (!answered) onCheck();
                }
              }}
              disabled={answered}
              rows={1}
              className="mt-5 min-h-14 w-full resize-none rounded-2xl border border-slate-200 bg-white p-4 text-lg outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-500"
              placeholder={item.type === "en-pl" ? "Twoja odpowiedź po polsku" : "Twoja odpowiedź po angielsku"}
            />
            <button
              onClick={onCheck}
              disabled={answered}
              className="mt-4 min-h-14 w-full rounded-2xl bg-blue-600 px-5 text-lg font-bold text-white disabled:bg-slate-300"
            >
              {item.type === "writing-pl-en" ? "Sprawdź pisownię" : "Sprawdź"}
            </button>
          </>
        )}

        {isPronunciation && (
          <div className="mt-5 space-y-3">
            <SmallAction icon={Volume2} label="Posłuchaj wzorca" onClick={() => onSpeak(item.word.word)} />
            {pronAutoSupported ? (
              <button
                onClick={onAssessAuto}
                disabled={assessing}
                className="flex min-h-16 w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 text-lg font-bold text-white disabled:bg-violet-300"
              >
                {assessing ? <Loader2 className="size-5 animate-spin" /> : <Mic className="size-5" />}
                {assessing ? "Słucham..." : pronResult ? "Powiedz jeszcze raz" : "Mów i sprawdź"}
              </button>
            ) : (
              <>
                <p className="text-center text-xs text-slate-500">
                  Ta przeglądarka nie ma automatycznej oceny. Porównaj z wzorcem i oceń:
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => onRateManual(true)}
                    className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-3 text-sm font-bold text-white"
                  >
                    <Check className="size-5" /> Brzmi dobrze
                  </button>
                  <button
                    onClick={() => onRateManual(false)}
                    className="flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-amber-300 bg-amber-50 px-3 text-sm font-bold text-amber-800"
                  >
                    <RotateCcw className="size-5" /> Powtórzę
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {feedback && (
          <div
            className={`mt-4 rounded-2xl p-4 text-sm font-semibold ${
              feedback.kind === "ok"
                ? "bg-emerald-50 text-emerald-800"
                : feedback.kind === "bad"
                  ? "bg-amber-50 text-amber-800"
                  : "bg-blue-50 text-blue-800"
            }`}
          >
            {feedback.text}
          </div>
        )}
      </section>

      <button
        onClick={onNext}
        disabled={!canContinue}
        className="min-h-14 w-full rounded-2xl bg-blue-600 px-5 text-lg font-bold text-white disabled:bg-slate-300"
      >
        {index + 1 >= total ? "Zakończ" : "Dalej"}
      </button>
      <p className="text-center text-xs text-slate-500">
        Cofnięcie wraca do panelu i porzuca niezapisaną sesję.
      </p>
    </div>
  );
}

function ResultView({
  result,
  stats,
  onHome,
  onModule,
  onReviews,
  canReview,
}: {
  result: ResultState;
  stats: ReturnType<typeof summarizeProgress>;
  onHome: () => void;
  onModule: () => void;
  onReviews: () => void;
  canReview: boolean;
}) {
  const isReview = result.moduleId === "reviews";
  const isLearn = result.moduleId === "learn";
  const moduleConfig = modules.find((item) => item.id === result.moduleId);
  const accentBg = isReview ? "bg-amber-50" : moduleConfig?.bg ?? "bg-slate-100";
  const accentText = isReview ? "text-amber-700" : moduleConfig?.accent ?? "text-slate-700";
  const title = isReview ? "Powtórki" : moduleConfig?.title ?? "Moduł";
  const percent = result.total ? Math.round((result.correct / result.total) * 100) : 0;
  const heading = isLearn
    ? "Słowa poznane!"
    : percent >= 80
      ? "Świetna robota!"
      : percent >= 50
        ? "Dobra robota!"
        : "Ćwicz dalej";
  return (
    <div className="space-y-5">
      <BackHeader label="Wynik" onBack={onHome} />
      <section className="rounded-3xl bg-white p-6 text-center shadow-sm">
        <div className={`mx-auto grid size-20 place-items-center rounded-full ${accentBg}`}>
          <Sparkles className={`size-10 ${accentText}`} />
        </div>
        <h2 className="mt-5 text-3xl font-black">{heading}</h2>
        <p className="mt-2 text-sm text-slate-500">{title} · {result.lessonTitle}</p>
        <p className="mt-5 text-5xl font-black">{percent}%</p>
        <p className="mt-1 text-sm text-slate-500">
          {isLearn
            ? `${result.correct} / ${result.total} słów już znasz`
            : `${result.correct} / ${result.total} zaliczonych zadań`}
        </p>
      </section>

      <div className="space-y-3">
        <ResultBar label="Rozumienie" value={stats.comprehension} skill="meaning" />
        <ResultBar label="Pisanie" value={stats.spelling} skill="spelling" />
        <ResultBar label="Słuchanie" value={stats.listening} skill="listening" />
        <ResultBar label="Wymowa" value={stats.pronunciation} skill="pronunciation" />
      </div>

      <div className="space-y-3">
        {canReview && (
          <button onClick={onReviews} className="min-h-14 w-full rounded-2xl bg-amber-500 px-5 font-bold text-white">
            Powtórki ({stats.dueTotal})
          </button>
        )}
        <button onClick={onModule} className="min-h-14 w-full rounded-2xl bg-blue-600 px-5 font-bold text-white">
          {isReview ? "Wróć do powtórek" : "Wróć do modułu"}
        </button>
        <button onClick={onHome} className="min-h-14 w-full rounded-2xl border border-slate-200 bg-white px-5 font-bold text-slate-800">
          Panel główny
        </button>
      </div>
    </div>
  );
}

function ProgressView({
  stats,
  progress,
  lessons,
  onOpenReviews,
  onOpenAdmin,
}: {
  stats: ReturnType<typeof summarizeProgress>;
  progress: AppProgress;
  lessons: Lesson[];
  onOpenReviews: () => void;
  onOpenAdmin: () => void;
}) {
  return (
    <div className="space-y-5">
      <ScreenTitle title="Postępy" text="Każda umiejętność ma oddzielny wynik i harmonogram powtórek." />
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold text-slate-500">Poznane słowa</p>
        <p className="mt-2 text-5xl font-black text-indigo-700">{stats.learnedCount}</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <MiniNumber value={progress.attempts.filter((attempt) => attempt.correct).length} label="poprawne odpowiedzi" />
          <MiniNumber value={stats.dueTotal} label="do powtórki dziś" />
        </div>
      </div>
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <p className="font-bold">Umiejętności</p>
        <div className="mt-4 space-y-3">
          <ResultBar label="Rozumienie" value={stats.comprehension} skill="meaning" />
          <ResultBar label="Pisanie" value={stats.spelling} skill="spelling" />
          <ResultBar label="Słuchanie" value={stats.listening} skill="listening" />
          <ResultBar label="Wymowa" value={stats.pronunciation} skill="pronunciation" />
        </div>
      </div>
      {stats.dueTotal > 0 && (
        <button
          onClick={onOpenReviews}
          className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 px-5 font-bold text-white"
        >
          <RotateCcw className="size-5" /> Powtórki na dziś ({stats.dueTotal})
        </button>
      )}
      <div className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">
        Seria: {progress.streak} dni. Dzisiaj {Math.min(progress.completedToday, 2)}/2 modułów.
      </div>
      <div className="rounded-2xl bg-white p-4 text-sm text-slate-600 shadow-sm">
        Zakres: {lessons.length} lekcji, {lessons.reduce((sum, lesson) => sum + lesson.words.length, 0)} haseł.
      </div>
      <button
        onClick={onOpenAdmin}
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-600"
      >
        <ShieldCheck className="size-4" /> Panel rodzica
      </button>
    </div>
  );
}

function AdminView({
  lessons,
  stats,
  weakWords,
  csvText,
  adminMessage,
  onBack,
  onCsvText,
  onImport,
  onReset,
  onOpenModule,
}: {
  lessons: Lesson[];
  stats: ReturnType<typeof summarizeProgress>;
  weakWords: WordProgress[];
  csvText: string;
  adminMessage: string;
  onBack: () => void;
  onCsvText: (value: string) => void;
  onImport: () => void;
  onReset: () => void;
  onOpenModule: (moduleId: ModuleId) => void;
}) {
  return (
    <div className="space-y-4">
      <BackHeader label="Panel rodzica" onBack={onBack} />
      <ScreenTitle title="Uczeń: Maja" text="Podgląd umiejętności, słabych słów i import lekcji." />
      <div className="grid grid-cols-4 gap-2">
        <MetricSmall label="Rozum." value={stats.comprehension} />
        <MetricSmall label="Pisanie" value={stats.spelling} />
        <MetricSmall label="Słuch" value={stats.listening} />
        <MetricSmall label="Wymowa" value={stats.pronunciation} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <AdminPanel title="Najsłabsze słówka">
          {weakWords.slice(0, 6).map((word) => (
            <div key={word.wordId} className="flex justify-between gap-3 text-sm">
              <span className="truncate">{word.word}</span>
              <span className="text-amber-600">{averagePracticedScore(word)}%</span>
            </div>
          ))}
          {!weakWords.length && <p className="text-sm text-slate-500">Brak danych.</p>}
        </AdminPanel>
        <AdminPanel title="Sprawdziany">
          {verifyModules.map((module) => (
            <button key={module.id} onClick={() => onOpenModule(module.id)} className="flex w-full justify-between text-sm">
              <span>{module.title}</span>
              <span>{moduleValue(module.id, stats)}%</span>
            </button>
          ))}
        </AdminPanel>
      </div>
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <p className="font-bold">Dodaj lekcję przez CSV</p>
          <Upload className="size-5 text-blue-600" />
        </div>
        <textarea
          value={csvText}
          onChange={(event) => onCsvText(event.target.value)}
          className="min-h-36 w-full resize-none rounded-2xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          placeholder={"word,translation_pl,part_of_speech,cefr,example\nalthough,chociaż,conj.,B2,Although it was raining we went out."}
        />
        <button onClick={onImport} className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 font-bold text-white">
          <Import className="size-5" />
          Import CSV
        </button>
        {adminMessage && <p className="mt-3 text-sm font-semibold text-blue-700">{adminMessage}</p>}
      </div>
      <AdminPanel title="Lekcje">
        {lessons.slice(0, 8).map((lesson) => (
          <div key={lesson.id} className="flex items-center justify-between border-b border-slate-100 py-2 text-sm last:border-b-0">
            <span className="truncate pr-3">{lesson.title}</span>
            <span className="text-slate-500">{lesson.words.length}</span>
          </div>
        ))}
      </AdminPanel>
      <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4">
        <p className="font-bold text-rose-800">Strefa testowa</p>
        <p className="mt-1 text-sm text-rose-700">
          Wyzeruj cały postęp nauki, aby zacząć od czysta. Importowane lekcje zostają.
        </p>
        <button
          onClick={onReset}
          className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-rose-600 px-5 font-bold text-white"
        >
          <RotateCcw className="size-5" /> Wyzeruj postęp
        </button>
      </div>
    </div>
  );
}

function DesktopContext({
  lessons,
  progress,
  activeLesson,
  stats,
  pronAutoSupported,
  onOpenModule,
}: {
  lessons: Lesson[];
  progress: AppProgress;
  activeLesson: Lesson;
  stats: ReturnType<typeof summarizeProgress>;
  pronAutoSupported: boolean;
  onOpenModule: (moduleId: ModuleId) => void;
}) {
  return (
    <div className="sticky top-8 space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">Jak to działa</p>
        <h2 className="mt-2 text-3xl font-black tracking-normal">Nauka &gt; 4 sprawdziany &gt; powtórki</h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
          Najpierw sesja nauki, potem weryfikacja w czterech umiejętnościach: rozumienie, pisanie,
          słuchanie i wymowa. Każde słowo wraca w powtórkach osobno dla każdej umiejętności, w
          rosnących odstępach.
          {" "}
          {pronAutoSupported
            ? "Wymowa jest oceniana automatycznie."
            : "Wymowa w tej przeglądarce działa w trybie samooceny."}
        </p>
      </div>
      <div className="grid gap-3">
        {modules.map((module) => (
          <button
            key={module.id}
            onClick={() => onOpenModule(module.id)}
            className="rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-blue-200"
          >
            <p className="font-bold">{module.title}</p>
            <p className="mt-1 text-sm text-slate-500">{module.detail}</p>
          </button>
        ))}
        <button
          onClick={() => onOpenModule("reviews")}
          className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-left transition hover:border-amber-300"
        >
          <p className="font-bold">Powtórki</p>
          <p className="mt-1 text-sm text-slate-500">
            {stats.dueTotal > 0 ? `${stats.dueTotal} słów do powtórki na dziś.` : "Brak powtórek na dziś."}
          </p>
        </button>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <p className="font-bold">Aktywna lekcja</p>
        <p className="mt-1 text-sm text-slate-600">{activeLesson.title}</p>
        <p className="mt-3 text-sm text-slate-500">
          Zaliczone sprawdziany: {(progress.completedLessonModules[activeLesson.id] ?? []).filter((id) => requiredLessonModules.includes(id)).length}/
          {requiredLessonModules.length}
        </p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <p className="font-bold">Atrybucja i źródła</p>
        <div className="mt-3 space-y-3">
          {sourceNotes.map((source) => (
            <a
              key={source.name}
              href={source.url}
              target="_blank"
              rel="noreferrer"
              className="block rounded-xl bg-slate-50 p-3 text-sm text-slate-700 hover:bg-slate-100"
            >
              <span className="font-semibold text-slate-950">{source.name}</span>
              <br />
              {source.note}
            </a>
          ))}
        </div>
      </div>
      <p className="text-xs text-slate-500">{lessons.length} lekcji w bibliotece.</p>
    </div>
  );
}

function ModuleCard({
  module,
  value,
  started = true,
  subtitle,
  onClick,
}: {
  module: ModuleConfig;
  value: number;
  started?: boolean;
  subtitle: string;
  onClick: () => void;
}) {
  const Icon = module.icon;
  const status = scoreStatus(value, started);
  return (
    <button
      onClick={onClick}
      className={`min-h-36 rounded-2xl border border-slate-100 p-4 text-left shadow-sm ${module.bg}`}
    >
      <Icon className={`size-8 ${module.accent}`} />
      <p className="mt-4 text-lg font-black">{module.title}</p>
      <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
      <StatusBar value={value} started={started} />
      <div className="mt-2 flex items-center justify-between text-sm">
        <span className={`font-bold ${status.text}`}>{started ? `${value}%` : "—"}</span>
        <ChevronRight className="size-4" />
      </div>
    </button>
  );
}

function ModuleRow({
  module,
  meta,
  value,
  started = true,
  done,
  onClick,
}: {
  module: ModuleConfig;
  meta: string;
  value: number;
  started?: boolean;
  done: boolean;
  onClick: () => void;
}) {
  const Icon = module.icon;
  const status = scoreStatus(value, started);
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 text-left shadow-sm"
    >
      <span className={`grid size-14 shrink-0 place-items-center rounded-2xl ${module.bg}`}>
        <Icon className={`size-7 ${module.accent}`} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="font-bold">{module.title}</span>
          {done && <Check className="size-4 text-emerald-600" />}
          <span className={`ml-auto rounded-full px-2 py-0.5 text-xs font-bold ${status.chip}`}>
            {status.label}
          </span>
        </span>
        <span className="mt-1 block text-sm text-slate-500">{meta}</span>
        <StatusBar value={value} started={started} />
      </span>
      <ChevronRight className="size-5 text-slate-400" />
    </button>
  );
}

function BackHeader({ label, onBack }: { label: string; onBack: () => void }) {
  return (
    <header className="flex items-center gap-3">
      <button
        onClick={onBack}
        className="grid size-10 shrink-0 place-items-center rounded-full border border-slate-200 bg-white"
        aria-label="Wróć"
      >
        <ArrowLeft className="size-5" />
      </button>
      <p className="truncate text-sm font-bold text-slate-700">{label}</p>
    </header>
  );
}

function ScreenTitle({ title, text }: { title: string; text: string }) {
  return (
    <header>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-600">English MVP</p>
      <h1 className="mt-2 text-3xl font-black tracking-normal">{title}</h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
    </header>
  );
}

function Metric({ label, value, skill }: { label: string; value: number; skill: SkillKey }) {
  const style = skillStyles[skill];
  return (
    <div className={`rounded-2xl p-3 shadow-sm ${style.bg} ${style.text}`}>
      <p className="text-sm font-semibold">{label}</p>
      <p className="mt-2 text-2xl font-black">{value}%</p>
      <ProgressBar value={value} bar={style.bar} />
    </div>
  );
}

function MetricSmall({ label, value, suffix = "%" }: { label: string; value: number; suffix?: string }) {
  return (
    <div className="rounded-2xl bg-white p-3 text-center shadow-sm">
      <p className="text-lg font-black">{value}{suffix}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}

function StepRow({
  icon: Icon,
  title,
  text,
  accent,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
  accent: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <Icon className={`size-6 ${accent}`} />
      <div>
        <p className="font-bold">{title}</p>
        <p className="text-sm text-slate-500">{text}</p>
      </div>
    </div>
  );
}

function SmallAction({ icon: Icon, label, onClick }: { icon: LucideIcon; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-2 text-sm font-semibold"
    >
      <Icon className="size-6 text-violet-700" />
      {label}
    </button>
  );
}

function ResultBar({ label, value, skill }: { label: string; value: number; skill: SkillKey }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <p className="font-bold">{label}</p>
        <p className="font-black">{value}%</p>
      </div>
      <ProgressBar value={value} bar={skillStyles[skill].bar} />
    </div>
  );
}

function ProgressBar({ value, bar }: { value: number; bar: string }) {
  return (
    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
      <div className={`h-full rounded-full ${bar}`} style={{ width: `${Math.max(3, Math.min(100, value))}%` }} />
    </div>
  );
}

// Bar whose colour signals status (red/amber/green/grey) rather than module
// theme, so weak spots jump out at a glance.
function StatusBar({ value, started }: { value: number; started: boolean }) {
  const status = scoreStatus(value, started);
  return (
    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
      <div
        className={`h-full rounded-full ${status.bar}`}
        style={{ width: started ? `${Math.max(6, Math.min(100, value))}%` : "0%" }}
      />
    </div>
  );
}

// Four little dots, one per skill, coloured by that skill's status for the
// lesson — a compact health summary for the lessons list.
function SkillDots({ progress, lesson }: { progress: AppProgress; lesson: Lesson }) {
  return (
    <span className="flex items-center gap-1">
      {skillStyleOrder.map(({ skill, label }) => {
        const score = lessonSkillScore(progress, lesson, skill);
        const status = scoreStatus(score ?? 0, score !== null);
        return (
          <span
            key={skill}
            title={`${label}: ${score === null ? "—" : `${score}%`}`}
            className={`size-2.5 rounded-full ${status.bar}`}
          />
        );
      })}
    </span>
  );
}

const skillStyleOrder: { skill: SkillKey; label: string }[] = [
  { skill: "meaning", label: "Rozumienie" },
  { skill: "spelling", label: "Pisanie" },
  { skill: "listening", label: "Słuchanie" },
  { skill: "pronunciation", label: "Wymowa" },
];

function MiniNumber({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="font-black">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}

function AdminPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <p className="mb-3 font-bold">{title}</p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function BottomTabs({ active, onChange }: { active: View; onChange: (view: View) => void }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-[440px] border-t border-slate-200 bg-white/95 px-2 pb-3 pt-2 backdrop-blur lg:absolute">
      <div className="grid grid-cols-4 gap-1">
        {tabItems.map((item) => {
          const Icon = item.icon;
          const selected = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-xs font-semibold ${
                selected ? "bg-blue-50 text-blue-700" : "text-slate-500"
              }`}
            >
              <Icon className="size-5" />
              {item.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function buildModuleQueue(
  moduleId: ModuleId,
  lesson: Lesson,
  learnDirection: FlashcardDirection = "en-pl",
): ExerciseItem[] {
  const words = lesson.words.slice(0, lessonWordLimit);
  const type: ExerciseType =
    moduleId === "learn"
      ? "learn"
      : moduleId === "comprehension"
        ? "en-pl"
        : moduleId === "writing"
          ? "writing-pl-en"
          : moduleId === "listening"
            ? "dictation"
            : "pronunciation";

  return words.map((word) => ({
    id: `${lesson.id}-${moduleId}-${word.id}`,
    lessonId: lesson.id,
    lessonTitle: lesson.title,
    word,
    type,
    direction: moduleId === "learn" ? learnDirection : undefined,
  }));
}

function wordMap(lessons: Lesson[]) {
  const map = new Map<string, WordEntry>();
  lessons.forEach((lesson) => lesson.words.forEach((word) => map.set(word.id, word)));
  return map;
}

function buildSkillReviewQueue(
  progress: AppProgress,
  lessons: Lesson[],
  skill: SkillKey,
): ExerciseItem[] {
  const map = wordMap(lessons);
  return dueStatesForSkill(progress, skill)
    .slice(0, 20)
    .flatMap((state) => {
      const word = map.get(state.wordId);
      if (!word) return [];
      return [
        {
          id: `rev-${skill}-${state.wordId}`,
          lessonId: state.lessonId,
          lessonTitle: "Powtórki",
          word,
          type: skillExerciseType[skill],
        },
      ];
    });
}

function buildAllReviewQueue(progress: AppProgress, lessons: Lesson[]): ExerciseItem[] {
  const map = wordMap(lessons);
  return allDueEntries(progress)
    .slice(0, 20)
    .flatMap(({ state, skill }) => {
      const word = map.get(state.wordId);
      if (!word) return [];
      return [
        {
          id: `rev-${skill}-${state.wordId}`,
          lessonId: state.lessonId,
          lessonTitle: "Powtórki",
          word,
          type: skillExerciseType[skill],
        },
      ];
    });
}

// Choose the best available English voice. We prefer en-GB / en-US, then any
// en-* voice, and rank Google/Microsoft natural voices first because they sound
// clearest. Returns null when the browser ships no English voice at all.
function pickEnglishVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const english = voices.filter((voice) => voice.lang?.toLowerCase().startsWith("en"));
  if (!english.length) return null;
  const rank = (voice: SpeechSynthesisVoice) => {
    const lang = voice.lang?.toLowerCase() ?? "";
    const name = voice.name?.toLowerCase() ?? "";
    let score = 0;
    if (lang.startsWith("en-gb")) score += 4;
    else if (lang.startsWith("en-us")) score += 3;
    else score += 1;
    if (/google|natural|microsoft/.test(name)) score += 2;
    return score;
  };
  return english.slice().sort((a, b) => rank(b) - rank(a))[0];
}

// Coloured status tiers for the at-a-glance module/lesson bars: grey = not
// started, red = weak (needs work), amber = improving, green = solid.
function scoreStatus(value: number, started: boolean) {
  if (!started) {
    return { bar: "bg-slate-300", text: "text-slate-400", label: "Nierozpoczęte", chip: "bg-slate-100 text-slate-500" };
  }
  if (value < 40) {
    return { bar: "bg-rose-500", text: "text-rose-600", label: "Do poprawy", chip: "bg-rose-50 text-rose-700" };
  }
  if (value < 70) {
    return { bar: "bg-amber-500", text: "text-amber-600", label: "Ćwicz dalej", chip: "bg-amber-50 text-amber-700" };
  }
  return { bar: "bg-emerald-500", text: "text-emerald-600", label: "Dobrze", chip: "bg-emerald-50 text-emerald-700" };
}

// Per-active-lesson value + "started" flag for a module bar. Verify modules read
// the lesson's score for their skill; the learn module reads the introduced ratio.
function moduleLessonStatus(
  moduleId: ModuleId,
  progress: AppProgress,
  lesson: Lesson,
  introducedInLesson: number,
  lessonWordCount: number,
): { value: number; started: boolean } {
  if (moduleId === "learn") {
    return {
      value: Math.round((introducedInLesson / Math.max(1, lessonWordCount)) * 100),
      started: introducedInLesson > 0,
    };
  }
  const skill = moduleSkill[moduleId];
  const score = skill ? lessonSkillScore(progress, lesson, skill) : null;
  return { value: score ?? 0, started: score !== null };
}

function moduleValue(moduleId: ModuleId, stats: ReturnType<typeof summarizeProgress>) {
  if (moduleId === "comprehension") return stats.comprehension;
  if (moduleId === "writing") return stats.spelling;
  if (moduleId === "listening") return stats.listening;
  if (moduleId === "pronunciation") return stats.pronunciation;
  return 0;
}

function reviewSkillForType(type: ExerciseType): SkillKey {
  if (type === "writing-pl-en") return "spelling";
  if (type === "dictation") return "listening";
  if (type === "pronunciation") return "pronunciation";
  return "meaning";
}

function directionLabel(item: ExerciseItem) {
  if (item.type === "learn") return item.direction === "pl-en" ? "PL → EN" : "EN → PL";
  if (item.type === "en-pl") return "EN → PL";
  if (item.type === "writing-pl-en") return "PL → EN";
  return "";
}

function canHearWord(type: ExerciseType) {
  // Only when the prompt itself is the English word — otherwise audio would
  // reveal the answer (writing PL → EN) or defeat the task (dictation).
  return type === "learn" || type === "en-pl";
}

function taskTitle(item: ExerciseItem) {
  if (item.type === "learn") return "Poznaj słowo";
  if (item.type === "en-pl") return "Co to znaczy?";
  if (item.type === "writing-pl-en") return "Napisz po angielsku";
  if (item.type === "dictation") return "Posłuchaj i wpisz";
  return "Powiedz słowo";
}

function promptWord(item: ExerciseItem) {
  if (item.type === "writing-pl-en") return item.word.translationPl;
  return item.word.word;
}

function flashcardFront(item: ExerciseItem) {
  return item.direction === "pl-en" ? item.word.translationPl : item.word.word;
}

function flashcardBack(item: ExerciseItem) {
  return item.direction === "pl-en" ? item.word.word : item.word.translationPl;
}

function todayLabel() {
  return new Date().toLocaleDateString("pl-PL", { day: "numeric", month: "long" });
}
