import { NextResponse } from "next/server";
import { auth } from "@/app/auth";

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { message: "Unauthorized" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);

  const requestedUserId =
    searchParams.get("user_id");

  if (
    !requestedUserId ||
    requestedUserId !== session.user.id
  ) {
    return NextResponse.json(
      { message: "Unauthorized" },
      { status: 401 }
    );
  }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/connectors?user_id=${encodeURIComponent(
      requestedUserId
    )}`,
    {
      headers: {
        "X-Connector-Secret":
          process.env.CONNECTOR_SECRET!,
      },
      cache: "no-store",
    }
  );

  const data = await response.json();

  return NextResponse.json(data, {
    status: response.status,
  });
}
