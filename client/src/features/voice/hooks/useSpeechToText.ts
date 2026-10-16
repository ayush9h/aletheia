"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface RecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface RecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  readonly [index: number]: RecognitionAlternative;
}

interface RecognitionResultList {
  readonly length: number;
  readonly [index: number]: RecognitionResult;
}

interface RecognitionResultEvent extends Event {
  readonly resultIndex: number;
  readonly results: RecognitionResultList;
}

interface RecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;

  onstart: ((event: Event) => void) | null;
  onend: ((event: Event) => void) | null;
  onresult: ((event: RecognitionResultEvent) => void) | null;
  onerror: ((event: RecognitionErrorEvent) => void) | null;

  start(): void;
  stop(): void;
  abort(): void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

type SpeechRecognitionWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

interface UseSpeechToTextOptions {
  value: string;
  onChange: (value: string) => void;
  language?: string;
}

let cancelActiveRecognition: (() => void) | null = null;

function getRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") {
    return null;
  }

  const speechWindow = window as SpeechRecognitionWindow;

  return (
    speechWindow.SpeechRecognition ??
    speechWindow.webkitSpeechRecognition ??
    null
  );
}

function combineText(existingText: string, transcript: string): string {
  const spokenText = transcript.replace(/\s+/g, " ").trim();

  if (!spokenText) {
    return existingText;
  }

  if (!existingText) {
    return spokenText;
  }

  const separator = /\s$/.test(existingText) ? "" : " ";

  return `${existingText}${separator}${spokenText}`;
}

function getRecognitionErrorMessage(error: string): string {
  switch (error) {
    case "not-allowed":
    case "service-not-allowed":
      return "Microphone permission was denied.";

    case "audio-capture":
      return "No microphone was detected.";

    case "no-speech":
      return "No speech was detected.";

    case "network":
      return "Speech recognition encountered a network error.";

    case "language-not-supported":
      return "The selected recognition language is not supported.";

    default:
      return "Speech recognition could not be completed.";
  }
}
export function useSpeechToText({
  value,
  onChange,
  language = "en-US",
}: UseSpeechToTextOptions) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const initialValueRef = useRef("");
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    setIsSupported(Boolean(getRecognitionConstructor()));
  }, []);

  const cancel = useCallback(() => {
    const recognition = recognitionRef.current;

    if (!recognition) {
      return;
    }

    recognitionRef.current = null;

    recognition.onstart = null;
    recognition.onend = null;
    recognition.onresult = null;
    recognition.onerror = null;

    try {
      recognition.abort();
    } catch {
      // The recognition session may have already ended.
    }

    setIsListening(false);

    if (cancelActiveRecognition === cancel) {
      cancelActiveRecognition = null;
    }
  }, []);

  const stop = useCallback(() => {
    const recognition = recognitionRef.current;

    if (!recognition) {
      return;
    }

    try {
      recognition.stop();
    } catch {
      cancel();
    }
  }, [cancel]);

  const start = useCallback(() => {
    const Recognition = getRecognitionConstructor();

    if (!Recognition || recognitionRef.current) {
      return;
    }

    cancelActiveRecognition?.();

    const recognition = new Recognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;
    recognition.maxAlternatives = 1;

    initialValueRef.current = valueRef.current;
    setError(null);

    const finish = () => {
      if (recognitionRef.current !== recognition) {
        return;
      }

      recognitionRef.current = null;
      setIsListening(false);

      if (cancelActiveRecognition === cancel) {
        cancelActiveRecognition = null;
      }
    };

    recognition.onstart = () => {
      if (recognitionRef.current === recognition) {
        setIsListening(true);
      }
    };

    recognition.onresult = (event) => {
      if (recognitionRef.current !== recognition) {
        return;
      }

      const transcriptParts: string[] = [];

      for (let index = 0; index < event.results.length; index += 1) {
        const result = event.results[index];
        const alternative = result?.[0];

        if (alternative?.transcript) {
          transcriptParts.push(alternative.transcript);
        }
      }

      const transcript = transcriptParts.join(" ");

      onChangeRef.current(combineText(initialValueRef.current, transcript));
    };

    recognition.onerror = (event) => {
      if (event.error !== "aborted") {
        setError(getRecognitionErrorMessage(event.error));
      }

      finish();
    };

    recognition.onend = finish;

    recognitionRef.current = recognition;
    cancelActiveRecognition = cancel;

    try {
      recognition.start();
    } catch {
      finish();
      setError("Speech recognition could not be started.");
    }
  }, [cancel, language]);

  const toggle = useCallback(() => {
    if (isListening) {
      stop();
      return;
    }

    start();
  }, [isListening, start, stop]);

  useEffect(() => {
    return () => {
      const recognition = recognitionRef.current;

      recognitionRef.current = null;

      if (recognition) {
        recognition.onstart = null;
        recognition.onend = null;
        recognition.onresult = null;
        recognition.onerror = null;

        try {
          recognition.abort();
        } catch {}
      }

      if (cancelActiveRecognition === cancel) {
        cancelActiveRecognition = null;
      }
    };
  }, [cancel]);

  return {
    isListening,
    isSupported,
    error,
    start,
    stop,
    cancel,
    toggle,
  };
}
