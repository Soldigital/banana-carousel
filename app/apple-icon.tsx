import { ImageResponse } from "next/og";

// iOS home-screen icon. iOS applies its own rounded mask, so we keep a full
// banana-gradient square with the "BC" monogram.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #FDE047, #F59E0B)",
          fontSize: 96,
          fontWeight: 900,
          color: "#0A0A0A",
          fontFamily: "Arial, sans-serif",
        }}
      >
        BC
      </div>
    ),
    { ...size },
  );
}
