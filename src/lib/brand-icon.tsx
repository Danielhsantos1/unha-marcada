import { ImageResponse } from "next/og";

const BRAND_VIOLET = "#8a56cb";

/**
 * One shared glyph (rounded violet square, white "U") reused by every
 * generated icon — favicon, apple touch icon, and the PWA manifest icons.
 * Renders through next/og (Satori), no image assets or extra deps needed.
 */
export function renderBrandIcon(size: number, radius: number) {
  return new ImageResponse(
    (
      <div
        style={{
          width: size,
          height: size,
          background: BRAND_VIOLET,
          borderRadius: radius,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
          fontWeight: 700,
          fontSize: size * 0.58,
          color: "white",
        }}
      >
        U
      </div>
    ),
    { width: size, height: size },
  );
}
