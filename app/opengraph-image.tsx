import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/lib/seo/site";

// Default social-share card (OpenGraph + Twitter). Next auto-wires this for
// every page that doesn't define its own.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Banana Carousel — AI Prompt Generator untuk Carousel Instagram";

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
          <div
            style={{
              width: 104,
              height: 104,
              borderRadius: 26,
              background: "linear-gradient(135deg, #FDE047, #F59E0B)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 56,
              fontWeight: 900,
              color: "#0A0A0A",
              marginRight: 28,
            }}
          >
            BC
          </div>
          <div style={{ fontSize: 44, fontWeight: 700, color: "#ffffff" }}>
            {SITE_NAME}
          </div>
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
