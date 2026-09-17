import { renderBrandIcon } from "@/lib/brand-icon";

// Plain Route Handler (not the icon.tsx convention) — exists just so
// manifest.ts has a real, fixed URL to point a 512×512 icon at, which
// Android wants before it'll offer "Instalar app".
export async function GET() {
  return renderBrandIcon(512, 96);
}
