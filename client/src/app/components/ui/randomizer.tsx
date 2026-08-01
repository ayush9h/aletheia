"use client";

import { useState, useEffect } from "react";

const ACTION_PHRASES = [
  "Discombobulating details",
  "Disentangling paradoxes",
  "Seeking truth",
  "Consulting the oracle",
  "Calculating trajectories",
  "Unraveling subtleties",
  "Synthesizing stardust",
  "Summoning wisdom",
  "Cogitating profoundly",
  "Pontificating possibilities",
  "Defragmenting thoughts",
  "Calibrating flux capacitors",
];

export default function ThinkingStatus() {
  const [index, setIndex] = useState(() =>
    Math.floor(Math.random() * ACTION_PHRASES.length)
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % ACTION_PHRASES.length);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="font-paragraph flex items-center gap-2 py-1 text-stone-400">
      <span className=" animate-shine bg-[size:200%_100%] bg-[linear-gradient(110deg,#a8a29e,45%,#1c1917,55%,#a8a29e)] bg-clip-text text-xs font-medium tracking-tight text-transparent transition-all duration-300 dark:bg-[linear-gradient(110deg,#78716c,45%,#f5f5f4,55%,#78716c)]">
        {ACTION_PHRASES[index]}
      </span>
    </div>
  );
}
