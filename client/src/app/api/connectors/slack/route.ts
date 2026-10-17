import { NextResponse } from "next/server";
import { randomBytes } from "crypto";

const SLACK_USER_SCOPES =
  "search:read,channels:read,groups:read,channels:history,groups:history";

export async function GET() {
  const state = randomBytes(32).toString("hex");

  const params = new URLSearchParams({
    client_id: process.env.SLACK_CONNECTOR_ID!,
    redirect_uri: process.env.SLACK_CALLBACK_URL!,
    user_scope: SLACK_USER_SCOPES,
    state,
  });

  const response = NextResponse.redirect(
    `https://slack.com/oauth/v2/authorize?${params.toString()}`
  );

  response.cookies.set("slack_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 10 * 60,
    path: "/",
  });

  return response;
}
