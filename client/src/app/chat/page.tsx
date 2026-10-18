import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import ChatApp from "@/features/chat/components/chat-app";

export async function generateMetadata(): Promise<Metadata> {
  const session = await auth();
  const firstName = session?.user?.name?.split(" ")[0];
  return {
    title: firstName ? `${firstName}'s chat` : "Chat",
    robots: { index: false, follow: false },
  };
}

// Server-side auth gate, so unauthenticated users never download the chat bundle
export default async function ChatPage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  return <ChatApp />;
}
