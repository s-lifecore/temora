import { OG_SIZE, renderOgImage } from "./og-image";
import { OG_TEXT } from "./og-text";

export const alt = OG_TEXT.alt;
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return renderOgImage();
}
