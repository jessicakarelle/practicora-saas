import { ImageResponse } from "next/og";
import copy from "@/i18n/locales/fr/marketing/opengraph.json";

export const alt = copy.alt;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "#f5f8fb",
          color: "#172432",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 18,
              background: "#2f6f9f",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 30,
              fontWeight: 800,
            }}
          >
            P
          </div>
          <div style={{ fontSize: 34, fontWeight: 800 }}>Practicora</div>
        </div>
        <div style={{ maxWidth: 900, display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 66, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2 }}>
            {copy.headline}
          </div>
          <div style={{ marginTop: 28, fontSize: 26, color: "#526779" }}>
            {copy.features}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 22, color: "#2f6f9f" }}>
          {copy.tagline}
        </div>
      </div>
    ),
    size,
  );
}
