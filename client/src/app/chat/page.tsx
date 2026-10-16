import { redirect } from "next/navigation";

import { auth } from "@/auth";
import ChatApp from "@/features/chat/components/chat-app";

// Server-side auth gate, so unauthenticated users never download the chat bundle
export default async function ChatPage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  return <ChatApp />;
}
