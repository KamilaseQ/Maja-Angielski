// Automatic pronunciation assessment built on the browser Web Speech API.
//
// Why this approach: it is free, needs no API keys or backend, and runs in the
// learner's browser (Chrome / Edge / Safari). We ask the recogniser to turn the
// spoken word into text, then score how close that text is to the target word
// (string similarity) weighted by the recogniser's own confidence. When the API
// is unavailable (e.g. Firefox) or fails, the UI falls back to manual self-check.

import { normalizeAnswer } from "./learning";

type RecognitionAlternative = {
  transcript: string;
  confidence: number;
};

type RecognitionEventLike = {
  results: ArrayLike<ArrayLike<RecognitionAlternative>>;
};

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: RecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
}

type RecognitionConstructor = new () => SpeechRecognitionLike;

export type PronunciationScore = {
  score: number;
  passed: boolean;
  recognized: string;
  detail: string;
};

function getRecognitionConstructor(): RecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const scope = window as unknown as {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  };
  return scope.SpeechRecognition ?? scope.webkitSpeechRecognition ?? null;
}

export function isPronunciationAutoSupported() {
  return getRecognitionConstructor() !== null;
}

export function recognizeSpeech(
  lang = "en-US",
  timeoutMs = 7000,
): Promise<{ transcript: string; confidence: number }> {
  const Recognition = getRecognitionConstructor();
  if (!Recognition) return Promise.reject(new Error("unsupported"));

  return new Promise((resolve, reject) => {
    const recognition = new Recognition();
    recognition.lang = lang;
    recognition.interimResults = false;
    recognition.maxAlternatives = 3;
    recognition.continuous = false;

    let settled = false;
    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      fn();
    };

    const timer = window.setTimeout(() => {
      try {
        recognition.abort();
      } catch {
        // ignore
      }
      finish(() => reject(new Error("timeout")));
    }, timeoutMs);

    recognition.onresult = (event) => {
      const alternatives = event.results?.[0];
      let best: RecognitionAlternative = { transcript: "", confidence: 0 };
      if (alternatives) {
        for (let i = 0; i < alternatives.length; i += 1) {
          const alternative = alternatives[i];
          if (alternative && (alternative.confidence ?? 0) >= best.confidence) {
            best = {
              transcript: alternative.transcript ?? "",
              confidence: alternative.confidence ?? 0,
            };
          }
        }
        if (!best.transcript && alternatives[0]) {
          best = {
            transcript: alternatives[0].transcript ?? "",
            confidence: alternatives[0].confidence ?? 0,
          };
        }
      }
      finish(() => resolve(best));
    };

    recognition.onerror = (event) => {
      finish(() => reject(new Error(event.error || "error")));
    };

    recognition.onend = () => {
      finish(() => resolve({ transcript: "", confidence: 0 }));
    };

    try {
      recognition.start();
    } catch {
      finish(() => reject(new Error("start_failed")));
    }
  });
}

function levenshtein(a: string, b: string) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 0; i < a.length; i += 1) {
    const current = [i + 1];
    for (let j = 0; j < b.length; j += 1) {
      const cost = a[i] === b[j] ? 0 : 1;
      current[j + 1] = Math.min(
        current[j] + 1,
        previous[j + 1] + 1,
        previous[j] + cost,
      );
    }
    previous = current;
  }
  return previous[b.length];
}

function similarity(a: string, b: string) {
  if (!a && !b) return 1;
  const longest = Math.max(a.length, b.length);
  if (!longest) return 1;
  return 1 - levenshtein(a, b) / longest;
}

export function scorePronunciation(
  expected: string,
  transcript: string,
  confidence: number,
): PronunciationScore {
  const expectedNorm = normalizeAnswer(expected);
  const heardNorm = normalizeAnswer(transcript);

  if (!heardNorm) {
    return {
      score: 0,
      passed: false,
      recognized: transcript,
      detail: "Nie usłyszałem słowa. Powiedz je wyraźnie i trochę głośniej.",
    };
  }

  let sim: number;
  if (expectedNorm.includes(" ")) {
    sim = similarity(expectedNorm, heardNorm);
  } else {
    const tokens = heardNorm.split(" ");
    sim = Math.max(
      similarity(expectedNorm, heardNorm),
      ...tokens.map((token) => similarity(expectedNorm, token)),
    );
  }

  const confidenceFactor = confidence > 0 ? confidence : 0.85;
  const score = Math.max(0, Math.min(100, Math.round(100 * sim * (0.7 + 0.3 * confidenceFactor))));
  const passed = sim >= 0.8;
  const detail = passed
    ? score >= 90
      ? "Bardzo czytelna wymowa!"
      : "Dobrze — drobne różnice w brzmieniu."
    : `Usłyszałem: "${transcript || "—"}". Spróbuj jeszcze raz, wolniej i wyraźniej.`;

  return { score, passed, recognized: transcript, detail };
}
