export type StarterPromptCategory = {
  id: string;
  label: string;
  prompts: string[];
};

export const STARTER_PROMPT_CATEGORIES: StarterPromptCategory[] = [
  {
    id: "write",
    label: "Write",
    prompts: [
      "Write a professional email for me",
      "Rewrite this to sound more professional",
      "Summarize this text clearly",
      "Help me write a concise message",
    ],
  },
  {
    id: "analyze",
    label: "Analyze",
    prompts: [
      "Analyze this and identify the key points",
      "Compare these two approaches",
      "What are the pros and cons?",
      "Find the risks or gaps in this",
    ],
  },
  {
    id: "learn",
    label: "Learn",
    prompts: [
      "Explain this concept simply",
      "Teach me this step by step",
      "Give me an example",
      "Quiz me on this topic",
    ],
  },
  {
    id: "code",
    label: "Code",
    prompts: [
      "Write production-ready code for this",
      "Debug this code",
      "Explain what this code does",
      "Improve the performance of this code",
    ],
  },
  {
    id: "brainstorm",
    label: "Brainstorm",
    prompts: [
      "Give me ideas for this",
      "Help me brainstorm possible solutions",
      "Suggest different approaches",
      "Turn this idea into an actionable plan",
    ],
  },
];
