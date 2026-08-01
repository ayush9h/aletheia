import { auth } from "./auth";
import { redirect } from "next/navigation";
import LoginPage from "./components/auth/login";

export default async function HomePage() {
  const session = await auth();

  // Checks if the user logged in
  if (session?.user) {
    // if logged in, redirect to chat
    redirect("/chat");
  }

  // Returns to LoginPage for login
  return <LoginPage />;
}
