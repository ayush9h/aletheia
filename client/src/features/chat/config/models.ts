import { BASE_PATH } from "@/lib/site";
export const MODEL_GROUPS = [
  {
    provider: "OpenAI",
    url: `${BASE_PATH}/openai.svg`,
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
];
