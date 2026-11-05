export const BASE_PATH = "/aletheia";

export const SITE = {
  name: "Aletheia",
  description:
    "Your AI assistant for your daily tasks, connected to GitHub, Slack and the web.",
  contactEmail: "ayushkumar2002h@gmail.com",
  address: "Bengaluru, Karnataka, India",
  // Origin only; BASE_PATH is appended where needed.
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.ayuar.dev",
};
