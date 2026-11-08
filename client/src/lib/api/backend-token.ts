import { BASE_PATH } from "@/lib/site";

const REUSE_MS = 9 * 60 * 1000;

let cached: { token: string; fetchedAt: number } | null = null;

export async function getBackendToken(): Promise<string> {
  if (cached && Date.now() - cached.fetchedAt < REUSE_MS) return cached.token;

  const res = await fetch(`${BASE_PATH}/api/backend-token`, { cache: "no-store" });
  if (!res.ok) {
    throw Object.assign(new Error(`Token request failed: ${res.status}`), {
      status: res.status,
    });
  }

  const { access_token } = await res.json();
  cached = { token: access_token, fetchedAt: Date.now() };
  return access_token;
}
