import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { to, subject, body } = await request.json();

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/connectors/gmail/send`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Connector-Secret": process.env.CONNECTOR_SECRET!,
      },
      body: JSON.stringify({ userId: session.user.id, to, subject, body }),
    }
  );

  const data = await response.json();

  return NextResponse.json(data, { status: response.status });
}
