import { redirect } from "next/navigation";

import { auth } from "@/auth";
import LoginPage from "@/features/auth/components/login";

// Logged-in users go straight to chat
export default async function HomePage() {
  const session = await auth();
  if (session?.user) redirect("/chat");

  return <LoginPage />;
}
