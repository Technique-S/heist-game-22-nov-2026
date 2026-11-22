// Thief movement: eight-way walking, a slow sneak, and honest collision with solid geometry.
import { SPEED } from './config.js';
import { BLOCKERS } from './level.js';
import { circleHitsBox } from './geometry.js';

export function updatePlayer(state, dt) {
  const p = state.player;
  const keys = state.keys;
  let vx = 0;
  let vy = 0;
  if (keys.has('arrowleft') || keys.has('a')) vx -= 1;
  if (keys.has('arrowright') || keys.has('d')) vx += 1;
  if (keys.has('arrowup') || keys.has('w')) vy -= 1;
  if (keys.has('arrowdown') || keys.has('s')) vy += 1;

  const length = Math.hypot(vx, vy);
  p.sneaking = keys.has('shift');
  if (length > 0) {
    vx /= length;
    vy /= length;
    const speed = p.sneaking ? SPEED.sneak : SPEED.walk;
    const r = SPEED.playerRadius;

    // Resolve each axis separately so the thief slides along walls instead of sticking.
    const nextX = p.x + vx * speed * dt;
    if (!BLOCKERS.some((box) => circleHitsBox(nextX, p.y, r, box))) p.x = nextX;
    const nextY = p.y + vy * speed * dt;
    if (!BLOCKERS.some((box) => circleHitsBox(p.x, nextY, r, box))) p.y = nextY;

    p.facing = Math.atan2(vy, vx);
    p.moving = true;
  } else {
    p.moving = false;
  }
}
