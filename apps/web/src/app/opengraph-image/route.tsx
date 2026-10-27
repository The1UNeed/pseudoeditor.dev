import { ImageResponse } from "next/og";
import { productName } from "@/lib/seo-content";

// One social card for every page and locale; metadata references it through ogImage in i18n/config.
export const dynamic = "force-static";

const keyword = "#6fd3a8";
const type = "#8ab4f8";
const text = "#f4f6f3";
const muted = "#a7b0aa";

function CodeLine({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "flex", gap: 12 }}>{children}</div>;
}

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "64px",
          background: "linear-gradient(135deg, #101714 0%, #141c18 55%, #1b221e 100%)",
          color: text,
          fontSize: 32,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 12,
              background: "#0b6e4f",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 26,
            }}
          >
            {"<-"}
          </div>
          <div style={{ fontSize: 32 }}>{productName}</div>
        </div>

        <div style={{ marginTop: 64, fontSize: 70, fontWeight: 600, letterSpacing: -1.5 }}>
          Pseudocode that actually runs.
        </div>
        <div style={{ marginTop: 18, fontSize: 28, lineHeight: 1.35, color: muted, maxWidth: 900 }}>
          Free forever and open source. Editor, compiler and runner for IGCSE, O Level and A Level Computer Science.
        </div>

        <div
          style={{
            marginTop: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 12,
            padding: "24px 30px",
            borderRadius: 16,
            border: "1px solid #303833",
            background: "#1d2420",
            fontSize: 26,
          }}
        >
          <CodeLine>
            <span style={{ color: keyword }}>DECLARE</span>
            <span>Total :</span>
            <span style={{ color: type }}>INTEGER</span>
          </CodeLine>
          <CodeLine>
            <span style={{ color: keyword }}>FOR</span>
            <span>Number</span>
            <span style={{ color: keyword }}>{"<-"}</span>
            <span>1</span>
            <span style={{ color: keyword }}>TO</span>
            <span>5</span>
          </CodeLine>
          <CodeLine>
            <span style={{ color: "#4ade80" }}>{"> Total = 15"}</span>
          </CodeLine>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
