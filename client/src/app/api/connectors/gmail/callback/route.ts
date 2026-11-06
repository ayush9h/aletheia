import { cookies } from "next/headers";
import { auth } from "@/auth";
import { connectorResult } from "@/features/connectors/utils/connector-result";
import { GMAIL_SCOPES } from "@/features/connectors/constants/connector-data";

const result = (status: "connected" | "error") =>
  connectorResult("gmail", "Gmail", status);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code || !state) {
    return result("error");
  }

  const cookieStore = await cookies();
  const storedState = cookieStore.get("gmail_oauth_state")?.value;

  if (!storedState || storedState !== state) {
    return result("error");
  }

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      code,
      redirect_uri: process.env.GMAIL_CALLBACK_URL!,
      grant_type: "authorization_code",
    }),
  });

  const tokenData = await tokenResponse.json();
  const accessToken = tokenData.access_token;
  const granted = String(tokenData.scope ?? "").split(" ");

  if (!tokenResponse.ok || !accessToken || !GMAIL_SCOPES.every((s) => granted.includes(s))) {
    console.error("Gmail token exchange failed:", tokenData.error ?? "missing scopes");

    return result("error");
  }

  const profileResponse = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/profile",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  const profile = await profileResponse.json();

  if (!profileResponse.ok || !profile.emailAddress) {
    console.error("Failed to fetch Gmail profile:", profile.error);

    return result("error");
  }

  const session = await auth();

  if (!session?.user?.id) {
    console.error("No authenticated application user found");

    return result("error");
  }

  const backendResponse = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/connectors/gmail`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Connector-Secret": process.env.CONNECTOR_SECRET!,
      },
      body: JSON.stringify({
        userId: session.user.id,
        providerUserId: profile.emailAddress,
        providerUsername: profile.emailAddress,
        accessToken,
        refreshToken: tokenData.refresh_token,
        expiresIn: tokenData.expires_in,
      }),
    }
  );

  if (!backendResponse.ok) {
    console.error(
      "Failed to store Gmail connector:",
      await backendResponse.text()
    );

    return result("error");
  }

  const response = result("connected");

  response.cookies.delete("gmail_oauth_state");

  return response;
}
