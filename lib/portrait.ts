// Turns the operator photo into a grid of brightness values (0 = black, 1 = white),
// used by the halftone sensor feed and the console's ASCII portrait.

export const PHOTO_SRC = "/operator/photo.jpg";
export const DEPTH_SRC = "/operator/depth.png";

const images = new Map<string, Promise<HTMLImageElement>>();

export function loadImage(src: string) {
  let p = images.get(src);
  if (!p) {
    p = new Promise((resolve, reject) => {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Could not load ${src}`));
      img.src = src;
    });
    images.set(src, p);
  }
  return p;
}

// Per cell: `tone` is brightness with a contrast lift, `mask` is 1 on the head and shoulders
// and falls to 0 towards the corners so the background drops out.
export async function loadLuma(cols: number, rows: number) {
  const img = await loadImage(PHOTO_SRC);
  const c = document.createElement("canvas");
  c.width = cols;
  c.height = rows;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.drawImage(img, 0, 0, cols, rows);
  const px = ctx.getImageData(0, 0, cols, rows).data;

  const tone = new Float32Array(cols * rows);
  const mask = new Float32Array(cols * rows);
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const i = y * cols + x;
      const l = (0.299 * px[i * 4] + 0.587 * px[i * 4 + 1] + 0.114 * px[i * 4 + 2]) / 255;
      const lifted = Math.min(1, Math.max(0, (l - 0.5) * 1.45 + 0.52));
      // Oval centred slightly above the middle: head and shoulders stay, corners fade out
      const dx = (x / cols - 0.48) / 0.44;
      const dy = (y / rows - 0.46) / 0.62;
      const d = Math.sqrt(dx * dx + dy * dy);
      const fade = Math.min(1, Math.max(0, (d - 0.74) / 0.26));
      tone[i] = lifted;
      mask[i] = 1 - fade * fade;
    }
  }
  return { tone, mask };
}

// How much "ink" a cell needs. On a light ground ink stands for shadow; on a dark ground it
// stands for light, so the portrait never turns into a negative.
export const inkAmount = (tone: number, mask: number, darkGround: boolean) => (darkGround ? tone : 1 - tone) * mask;

export function isDark(color: string) {
  const [r, g, b] = hexToRgb(color);
  return 0.299 * r + 0.587 * g + 0.114 * b < 0.5;
}

const RAMP = "@%#*+=-:. ";

export async function asciiPortrait(darkGround: boolean, cols = 46) {
  const rows = Math.round(cols * (640 / 480) * 0.5); // monospace cells are about twice as tall as wide
  const { tone, mask } = await loadLuma(cols, rows);
  let s = "";
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const ink = inkAmount(tone[y * cols + x], mask[y * cols + x], darkGround);
      s += RAMP[Math.min(RAMP.length - 1, Math.floor((1 - ink) * RAMP.length))];
    }
    s += "\n";
  }
  return s;
}

// Reads the site's colour tokens so canvas drawings follow light/dark mode
export function themeColors() {
  const cs = getComputedStyle(document.documentElement);
  const get = (name: string) => cs.getPropertyValue(name).trim();
  return { ink: get("--ink"), panel: get("--panel"), signal: get("--signal") };
}

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.replace(/./g, "$&$&") : h, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}
