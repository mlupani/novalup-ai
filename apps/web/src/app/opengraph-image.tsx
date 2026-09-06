import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
          backgroundColor: "#0B0B0D",
        }}
      >
        <div style={{ display: "flex", fontSize: 96, fontWeight: 800, letterSpacing: -2 }}>
          <span style={{ color: "#ffffff" }}>Novalup</span>
          <span style={{ color: "#e11d48" }}>AI</span>
        </div>
        <div style={{ display: "flex", fontSize: 32, color: "#a3a3a3" }}>
          AI tools that actually do something.
        </div>
      </div>
    ),
    { ...size }
  );
}
