import { NextResponse } from "next/server";
import { SignJWT } from "jose";

import { auth } from "@/auth";

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId || userId === "undefined") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const accessToken = await new SignJWT({
    user_id: userId,
    expires: Date.now() / 1000 + 600,
  })
    .setProtectedHeader({ alg: process.env.JWT_ALGORITHM as string })
    .sign(new TextEncoder().encode(process.env.JWT_SECRET));

  return NextResponse.json(
    { access_token: accessToken },
    { headers: { "Cache-Control": "no-store" } },
  );
}
