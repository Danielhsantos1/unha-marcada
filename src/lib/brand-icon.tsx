import { ImageResponse } from "next/og";

const GRADIENT = "linear-gradient(135deg, #b18ae0 0%, #8a56cb 55%, #5f3690 100%)";

// A closed nail-polish-drop silhouette — reads as "Unha Marcada" at a
// glance instead of a generic letter mark.
const DROP_PATH = "M12 2C12 2 4.5 11.2 4.5 15.5a7.5 7.5 0 0 0 15 0C19.5 11.2 12 2 12 2Z";

// Same sparkle glyph used for the in-app brand badge (see /comecar) —
// kept as an accent so the app icon and the product UI read as one mark.
const SPARKLE_PATH =
  "M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z";

/**
 * One shared glyph (violet gradient square, white nail-polish drop) reused
 * by every generated icon — favicon, apple touch icon, and the PWA
 * manifest icons. Renders through next/og (Satori), no image assets or
 * extra deps needed.
 *
 * The sparkle accent and glow only render above ~96px: at favicon size
 * (16–32px) that extra detail just turns into noise, so small icons stay
 * a single bold silhouette instead.
 */
export function renderBrandIcon(size: number, radius: number) {
  const showFlourish = size >= 96;
  const glyph = size * 0.52;
  const sparkle = size * 0.17;

  return new ImageResponse(
    (
      <div
        style={{
          width: size,
          height: size,
          background: GRADIENT,
          borderRadius: radius,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {showFlourish && (
          <div
            style={{
              position: "absolute",
              width: size * 0.68,
              height: size * 0.68,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.16)",
              display: "flex",
            }}
          />
        )}

        <svg width={glyph} height={glyph} viewBox="0 0 24 24" fill="white" style={{ position: "relative" }}>
          <path d={DROP_PATH} />
        </svg>

        {showFlourish && (
          <svg
            width={sparkle}
            height={sparkle}
            viewBox="0 0 24 24"
            fill="white"
            style={{ position: "absolute", top: size * 0.14, right: size * 0.16 }}
          >
            <path d={SPARKLE_PATH} />
          </svg>
        )}
      </div>
    ),
    { width: size, height: size },
  );
}
