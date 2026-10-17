import { cookies } from "next/headers";
import { auth } from "@/auth";
import { connectorResult } from "@/features/connectors/utils/connector-result";

const result = (status: "connected" | "error") =>
  connectorResult("slack", "Slack", status);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code || !state) {
    return result("error");
  }

  const cookieStore = await cookies();

  const storedState =
    cookieStore.get("slack_oauth_state")?.value;

  if (!storedState || storedState !== state) {
    return result("error");
  }

  const tokenResponse = await fetch(
    "https://slack.com/api/oauth.v2.access",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.SLACK_CONNECTOR_ID!,
        client_secret: process.env.SLACK_CONNECTOR_SECRET!,
        code,
        redirect_uri: process.env.SLACK_CALLBACK_URL!,
      }),
    }
  );

  const tokenData = await tokenResponse.json();
  const accessToken = tokenData.authed_user?.access_token;

  if (!tokenData.ok || !accessToken) {
    console.error("Slack token exchange failed:", tokenData);

    return result("error");
  }

  const identityResponse = await fetch(
    "https://slack.com/api/auth.test",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  const identity = await identityResponse.json();

  if (!identity.ok) {
    console.error("Failed to fetch Slack user:", identity);

    return result("error");
  }

  const session = await auth();

  if (!session?.user?.id) {
    console.error(
      "No authenticated application user found"
    );

    return result("error");
  }

  const backendResponse = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/connectors/slack`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Connector-Secret":
          process.env.CONNECTOR_SECRET!,
      },
      body: JSON.stringify({
        userId: session.user.id,
        providerUserId: identity.user_id,
        providerUsername: identity.user,
        accessToken,
      }),
    }
  );

  if (!backendResponse.ok) {
    console.error(
      "Failed to store Slack connector:",
      await backendResponse.text()
    );

    return result("error");
  }

  const response = result("connected");

  response.cookies.delete("slack_oauth_state");

  return response;
}
