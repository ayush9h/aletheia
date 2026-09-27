import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@/app/auth";

function connectorResult(
  status: "connected" | "error"
) {
  return new NextResponse(
    `
      <!DOCTYPE html>
      <html>
        <head>
          <title>GitHub</title>
        </head>

        <body>
          <script>
            window.opener?.postMessage(
              {
                type: "connector",
                connector: "github",
                status: "${status}"
              },
              window.location.origin
            );

            window.close();
          </script>

          <p>
            ${
              status === "connected"
                ? "GitHub connected successfully."
                : "Unable to connect GitHub."
            }
          </p>
        </body>
      </html>
    `,
    {
      headers: {
        "Content-Type": "text/html",
      },
    }
  );
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code || !state) {
    return connectorResult("error");
  }

  const cookieStore = await cookies();

  const storedState =
    cookieStore.get("github_oauth_state")?.value;

  if (!storedState || storedState !== state) {
    return connectorResult("error");
  }

  const tokenResponse = await fetch(
    "https://github.com/login/oauth/access_token",
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: process.env.GITHUB_CALLBACK_URL,
      }),
    }
  );

  const tokenData = await tokenResponse.json();

  if (!tokenResponse.ok || !tokenData.access_token) {
    console.error(
      "GitHub token exchange failed:",
      tokenData
    );

    return connectorResult("error");
  }

  const githubResponse = await fetch(
    "https://api.github.com/user",
    {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${tokenData.access_token}`,
        "X-GitHub-Api-Version": "2026-03-10",
      },
    }
  );

  if (!githubResponse.ok) {
    console.error(
      "Failed to fetch GitHub user:",
      await githubResponse.text()
    );

    return connectorResult("error");
  }

  const githubUser = await githubResponse.json();

  const session = await auth();

  if (!session?.user?.id) {
    console.error(
      "No authenticated application user found"
    );

    return connectorResult("error");
  }

  const backendResponse = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/connectors/github`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Connector-Secret":
          process.env.CONNECTOR_SECRET!,
      },
      body: JSON.stringify({
        userId: session.user.id,
        providerUserId: String(githubUser.id),
        providerUsername: githubUser.login,
        accessToken: tokenData.access_token,
      }),
    }
  );

  if (!backendResponse.ok) {
    const errorText = await backendResponse.text();

    console.error(
      "Failed to store GitHub connector:",
      errorText
    );

    return connectorResult("error");
  }

  console.log("GitHub connector stored:", {
    userId: session.user.id,
    githubUserId: githubUser.id,
    login: githubUser.login,
  });

  const response = connectorResult("connected");

  response.cookies.delete("github_oauth_state");

  return response;
}
