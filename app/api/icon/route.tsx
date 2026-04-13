import { ImageResponse } from "next/og";
import { type NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const size = Number(request.nextUrl.searchParams.get("size") || "512");
  const clamped = Math.min(Math.max(size, 48), 1024);
  const fontSize = Math.round(clamped * 0.52);

  return new ImageResponse(
    (
      <div
        style={{
          width: clamped,
          height: clamped,
          background: "#0a0a0a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: clamped * 0.2,
        }}
      >
        <span style={{ fontSize }}>🪩</span>
      </div>
    ),
    { width: clamped, height: clamped },
  );
}
