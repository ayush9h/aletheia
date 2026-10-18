import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import LoginPage from "@/features/auth/components/login";

export async function generateMetadata(): Promise<Metadata> {
  const session = await auth();
  return { title: session?.user ? "Chat" : "Sign in" };
}

// Logged-in users go straight to chat
export default async function HomePage() {
  const session = await auth();
  if (session?.user) redirect("/chat");

  return <LoginPage />;
}
