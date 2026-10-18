export const SITE = {
  name: "Aletheia",
  description: "Your AI assistant for your daily tasks, connected to GitHub, Slack and the web.",
  contactEmail: "ayushkumar2002h@gmail.com",
  address: "Bengaluru, Karnataka, India",
  url:
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000"),
};
