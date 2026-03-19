export const MODEL_GROUPS = [
  {
    provider: "OpenAI",
    url: "./openai.svg",
    models: [
      {
        label: "GPT-OSS-120B",
        value: "openai/gpt-oss-120b",
      },
      {
        label: "GPT-OSS-20B",
        value: "openai/gpt-oss-20b",
      },
    ],
  },
  {
    provider: "Meta",
    url: "./meta-color.svg",
    models: [
      {
        label: "Llama-3.1-8B",
        value: "llama-3.1-8b-instant",
      },
    ],
  },
];
