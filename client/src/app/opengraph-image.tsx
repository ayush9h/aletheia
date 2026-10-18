import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

import { SITE } from "@/lib/site";

export const alt = `${SITE.name}: ${SITE.description}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const logo = await readFile(join(process.cwd(), "public/logo.png"), "base64");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          gap: 64,
          padding: "0 96px",
          background: "linear-gradient(135deg, #fafaf9 0%, #f5f5f4 55%, #dbeafe 100%)",
          color: "#1c1917",
        }}
      >
        <img
          alt=""
          src={`data:image/png;base64,${logo}`}
          width={280}
          height={280}
          style={{ borderRadius: 48, boxShadow: "0 24px 60px -20px rgba(28,25,23,0.35)" }}
        />
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <div style={{ fontSize: 96, lineHeight: 1, letterSpacing: -2 }}>{SITE.name}</div>
          <div style={{ marginTop: 28, fontSize: 36, lineHeight: 1.35, color: "#57534e" }}>
            {SITE.description}
          </div>
          <div
            style={{
              marginTop: 44,
              display: "flex",
              alignSelf: "flex-start",
              padding: "10px 22px",
              borderRadius: 999,
              background: "#2563eb",
              color: "#ffffff",
              fontSize: 24,
            }}
          >
            {new URL(SITE.url).host}
          </div>
        </div>
      </div>
    ),
    size
  );
}
