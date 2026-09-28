"use client";

import { useEffect, useRef } from "react";

const PLAYED_KEY = "kranti-visit-audio-played";
const AUDIO_SRC = "/azadi.mp3";
const AUDIO_VOLUME = 0.03;

export function VisitAudio() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || startedRef.current) {
      return;
    }

    if (window.sessionStorage.getItem(PLAYED_KEY) === "1") {
      return;
    }

    const cleanupFallbackListeners = () => {
      window.removeEventListener("pointerdown", handleUserGesture);
      window.removeEventListener("keydown", handleUserGesture);
      window.removeEventListener("touchstart", handleUserGesture);
    };

    const markPlayed = () => {
      window.sessionStorage.setItem(PLAYED_KEY, "1");
      startedRef.current = true;
      cleanupFallbackListeners();
    };

    const tryPlay = () => {
      audio.volume = AUDIO_VOLUME;
      const playPromise = audio.play();

      if (playPromise) {
        playPromise
          .then(() => {
            markPlayed();
          })
          .catch(() => {
            // Autoplay can be blocked until the first user interaction.
          });
      }
    };

    function handleUserGesture() {
      if (startedRef.current) {
        cleanupFallbackListeners();
        return;
      }

      tryPlay();
    }

    audio.addEventListener("ended", markPlayed, { once: true });
    window.addEventListener("pointerdown", handleUserGesture, { passive: true });
    window.addEventListener("keydown", handleUserGesture);
    window.addEventListener("touchstart", handleUserGesture, { passive: true });

    tryPlay();

    return () => {
      cleanupFallbackListeners();
      audio.removeEventListener("ended", markPlayed);
    };
  }, []);

  return (
    <audio
      ref={audioRef}
      src={AUDIO_SRC}
      preload="auto"
      playsInline
      aria-hidden="true"
      tabIndex={-1}
    />
  );
}