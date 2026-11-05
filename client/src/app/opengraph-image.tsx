import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

import { BASE_PATH, SITE } from "@/lib/site";

export const alt = `${SITE.name}: ${SITE.description}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const cwd = process.cwd();
  const [logo, art] = await Promise.all([
    readFile(join(cwd, "public/logo.png"), "base64"),
    readFile(join(cwd, "src/features/auth/assets/login-art.png"), "base64"),
  ]);
  const link = `${new URL(SITE.url).host}${BASE_PATH}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: "#082f49",
          color: "#ffffff",
        }}
      >
        <img
          alt=""
          src={`data:image/png;base64,${art}`}
          width={1200}
          height={630}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            objectFit: "cover",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            background:
              "linear-gradient(90deg, rgba(8,47,73,0.96) 0%, rgba(8,47,73,0.85) 45%, rgba(8,47,73,0.2) 100%)",
          }}
        />

        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            padding: "72px 80px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <img
              alt=""
              src={`data:image/png;base64,${logo}`}
              width={64}
              height={64}
              style={{ borderRadius: 14 }}
            />
            <div style={{ fontSize: 40, letterSpacing: -0.5 }}>{SITE.name}</div>
          </div>

          <div
            style={{ display: "flex", flexDirection: "column", maxWidth: 720 }}
          >
            <div style={{ fontSize: 64, lineHeight: 1.1, letterSpacing: -1.5 }}>
              Your AI assistant for daily work.
            </div>
            <div
              style={{
                marginTop: 24,
                fontSize: 28,
                lineHeight: 1.4,
                color: "#bae6fd",
              }}
            >
              Connected to GitHub, Slack and the web.
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              fontSize: 24,
              color: "#e0f2fe",
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: 999,
                background: "#38bdf8",
              }}
            />
            {link}
          </div>
        </div>
      </div>
    ),
    size
  );
}
