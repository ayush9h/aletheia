'use client'
/**
 * GreetingWindow
 *
 * Greeting shown when there are no messages yet.
 */
import { useEffect, useState } from "react";
import { motion } from "motion/react";

const EMPTY_STATE_MESSAGES = (userName: string) => [
  `Hello ${userName}, ready when you are.`,
  `${userName} returns, back to thinking.`,
  `Alright ${userName}, what are we solving today?`,
  `${userName}'s here. Let's get into it.`,
  `Good to see you, ${userName}. What's on your mind?`,
  `${userName}, the blank page awaits.`,
  `${userName} returns!`,
];

export default function GreetingWindow({ userName }: { userName: string }) {
  const [greeting, setGreeting] = useState<string | null>(null);

  useEffect(() => {
    const options = EMPTY_STATE_MESSAGES(userName);
    setGreeting(options[Math.floor(Math.random() * options.length)]);
  }, [userName]);

  return (
    <div className="flex h-9 items-center justify-center">
      {greeting && (
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="font-paragraph text-center text-2xl text-stone-800"
        >
          {greeting}
        </motion.h1>
      )}
    </div>
  );
}
