// The floor plan: three rooms, two guarded doorways, cover crates, a vault and a getaway hatch.
export const WALLS = [
  { x: 0, y: 0, w: 1280, h: 30 },
  { x: 0, y: 770, w: 1280, h: 30 },
  { x: 0, y: 0, w: 30, h: 800 },
  { x: 1250, y: 0, w: 30, h: 800 },

  // Service corridor / gallery divider, with a 170px doorway at y 300..470.
  { x: 340, y: 30, w: 22, h: 270 },
  { x: 340, y: 470, w: 22, h: 300 },

  // Gallery / vault divider, with a doorway at y 238..418.
  { x: 858, y: 30, w: 22, h: 208 },
  { x: 858, y: 418, w: 22, h: 352 },

  // Display shelf in the gallery and a short partition in the vault.
  { x: 362, y: 300, w: 338, h: 20 },
  { x: 1000, y: 470, w: 20, h: 150 },
];

export const COVERS = [
  { x: 95, y: 300, w: 80, h: 55, name: 'CRATE' },
  { x: 100, y: 560, w: 80, h: 55, name: 'CRATE' },
  { x: 430, y: 400, w: 100, h: 60, name: 'PLINTH' },
  { x: 690, y: 560, w: 110, h: 60, name: 'CART' },
  { x: 960, y: 300, w: 90, h: 55, name: 'CASE' },
  { x: 1080, y: 560, w: 90, h: 60, name: 'CASE' },
];

// Anything solid stops both the thief and a vision ray.
export const BLOCKERS = WALLS.concat(COVERS);

export const GUARD_ROUTES = [
  {
    id: 'west',
    points: [{ x: 180, y: 140 }, { x: 180, y: 650 }, { x: 270, y: 650 }, { x: 270, y: 140 }],
    speed: 58,
    fov: 1.28,
    range: 295,
  },
  {
    id: 'gallery',
    points: [{ x: 410, y: 240 }, { x: 800, y: 240 }, { x: 800, y: 660 }, { x: 410, y: 660 }],
    speed: 66,
    fov: 1.2,
    range: 320,
  },
  {
    id: 'vault',
    points: [{ x: 940, y: 180 }, { x: 1190, y: 180 }, { x: 1190, y: 430 }, { x: 940, y: 430 }],
    speed: 62,
    fov: 1.18,
    range: 300,
  },
];

export const CAMERA_MOUNTS = [
  { id: 'north', x: 630, y: 52, base: Math.PI / 2, sweep: 0.7, speed: 0.72, fov: 0.78, range: 430 },
  { id: 'vault', x: 1236, y: 112, base: 2.45, sweep: 0.55, speed: 0.58, fov: 0.8, range: 360 },
];

export const LOOT = { x: 1120, y: 315 };
export const EXIT = { x: 52, y: 688, w: 120, h: 68 };
export const SPAWN = { x: 112, y: 730 };

export function nearCover(x, y, limit = 58) {
  return COVERS.some((box) => {
    const nx = Math.max(box.x, Math.min(x, box.x + box.w));
    const ny = Math.max(box.y, Math.min(y, box.y + box.h));
    return Math.hypot(x - nx, y - ny) < limit;
  });
}
