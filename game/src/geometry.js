// Small geometry toolbox: angles, circle/box collision and cone raycasting.
export function clamp(value, low, high) {
  return Math.max(low, Math.min(high, value));
}

export function distance(ax, ay, bx, by) {
  return Math.hypot(bx - ax, by - ay);
}

export function angleDelta(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

// Does this circle touch this axis-aligned rectangle? Used for movement collision.
export function circleHitsBox(cx, cy, r, box) {
  const nx = clamp(cx, box.x, box.x + box.w);
  const ny = clamp(cy, box.y, box.y + box.h);
  return (cx - nx) ** 2 + (cy - ny) ** 2 < r * r;
}

// Distance from (ox,oy) along a unit ray to the first edge in a box, or Infinity.
function rayBox(ox, oy, dx, dy, box) {
  const edges = [
    [box.x, box.y, box.x + box.w, box.y],
    [box.x + box.w, box.y, box.x + box.w, box.y + box.h],
    [box.x + box.w, box.y + box.h, box.x, box.y + box.h],
    [box.x, box.y + box.h, box.x, box.y],
  ];
  let closest = Infinity;
  for (const [ax, ay, bx, by] of edges) {
    const sx = bx - ax;
    const sy = by - ay;
    const den = dx * sy - dy * sx;
    if (Math.abs(den) < 1e-9) continue;
    const t = ((ax - ox) * sy - (ay - oy) * sx) / den;
    const u = ((ax - ox) * dy - (ay - oy) * dx) / den;
    if (t >= 0 && u >= 0 && u <= 1 && t < closest) closest = t;
  }
  return closest;
}

// A vision cone is a fan of rays stopped by walls and cover crates.
export function conePolygon(originX, originY, facing, spread, range, blockers) {
  const points = [];
  const steps = 26;
  for (let i = 0; i <= steps; i++) {
    const angle = facing - spread / 2 + (spread * i) / steps;
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    let reach = range;
    for (const box of blockers) {
      const hit = rayBox(originX, originY, dx, dy, box);
      if (hit < reach) reach = hit;
    }
    points.push({ x: originX + dx * reach, y: originY + dy * reach });
  }
  return points;
}

// Line of sight from a guard's eye to the thief: no solid box in between.
export function canSee(ox, oy, tx, ty, blockers) {
  const dx = tx - ox;
  const dy = ty - oy;
  const len = Math.hypot(dx, dy);
  if (len < 1) return true;
  const ux = dx / len;
  const uy = dy / len;
  for (const box of blockers) {
    if (rayBox(ox, oy, ux, uy, box) < len - 2) return false;
  }
  return true;
}
