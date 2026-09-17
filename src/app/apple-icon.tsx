import { renderBrandIcon } from "@/lib/brand-icon";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// No rounding here on purpose — iOS applies its own rounded-square mask
// on top of whatever the home screen icon image is.
export default function AppleIcon() {
  return renderBrandIcon(180, 0);
}
