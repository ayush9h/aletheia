"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// stops the global active speech, when another sound icon clicked while speec is active
let stopActiveSpeech: (() => void) | null = null;

export function useReadAloud(text: string) {
  const [isReading, setIsReading] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const isSupported =
    typeof window !== "undefined" && "speechSynthesis" in window;

  const stop = useCallback(() => {
    if (!isSupported || !utteranceRef.current) {
      return;
    }

    window.speechSynthesis.cancel();
    utteranceRef.current = null;
    setIsReading(false);

    if (stopActiveSpeech === stop) {
      stopActiveSpeech = null;
    }
  }, [isSupported]);

  const toggle = useCallback(() => {
    const content = text.trim();

    if (!isSupported || !content) {
      return;
    }

    if (isReading) {
      stop();
      return;
    }

    // Stop another message currently being read.
    stopActiveSpeech?.();

    const utterance = new SpeechSynthesisUtterance(content);

    utterance.rate = 1;
    utterance.pitch = 1;

    const finish = () => {
      if (utteranceRef.current !== utterance) {
        return;
      }

      utteranceRef.current = null;
      setIsReading(false);

      if (stopActiveSpeech === stop) {
        stopActiveSpeech = null;
      }
    };

    utterance.onend = finish;
    utterance.onerror = finish;

    utteranceRef.current = utterance;
    stopActiveSpeech = stop;

    setIsReading(true);
    window.speechSynthesis.speak(utterance);
  }, [isReading, isSupported, stop, text]);

  useEffect(() => stop, [stop]);

  return {
    isReading,
    isSupported,
    toggle,
  };
}
