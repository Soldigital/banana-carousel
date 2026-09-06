import fs from "node:fs";
import path from "node:path";
import { ImageResponse } from "next/og";

// Default social-share card (OpenGraph + Twitter). Next auto-wires this for
// every page that doesn't define its own.
export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Banana Carousel — AI Prompt Generator untuk Carousel Instagram";

// Satori cannot fetch by URL here, so the lockup is inlined as a data URI. The
// card sits on #0A0A0A, hence the dark variant (white "Banana").
function wordmarkDataUri(): string {
  const file = path.join(process.cwd(), "public", "brand", "wordmark-dark.png");
  return `data:image/png;base64,${fs.readFileSync(file).toString("base64")}`;
}

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: "#0A0A0A",
          padding: 80,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", marginBottom: 40 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={wordmarkDataUri()} alt="Banana Carousel" width={428} height={120} />
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 68,
            fontWeight: 800,
            color: "#ffffff",
            lineHeight: 1.1,
            maxWidth: 980,
          }}
        >
          AI Prompt Generator untuk Carousel Instagram
        </div>
        <div style={{ display: "flex", fontSize: 34, color: "#FACC15", marginTop: 28 }}>
          Dari ide → carousel premium siap generate dalam hitungan detik
        </div>
      </div>
    ),
    { ...size },
  );
}
