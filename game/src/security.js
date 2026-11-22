// Guards, cameras and the alarm: patrols sweep, cones search, and a fair spotted moment.
import { ALARM } from './config.js';
import { GUARD_ROUTES, CAMERA_MOUNTS, BLOCKERS, nearCover } from './level.js';
import { angleDelta, canSee, clamp, distance } from './geometry.js';

export function makeSecurity() {
  const guards = GUARD_ROUTES.map((route, index) => ({
    ...route,
    x: route.points[0].x,
    y: route.points[0].y,
    facing: 0,
    leg: 0,
    progress: index * 0.27,
  }));
  const cameras = CAMERA_MOUNTS.map((mount) => ({ ...mount, facing: mount.base }));
  return { guards, cameras };
}

export function updateSecurity(state, dt) {
  const p = state.player;
  const decoy = state.decoy;

  for (const guard of state.guards) {
    const from = guard.points[guard.leg];
    const to = guard.points[(guard.leg + 1) % guard.points.length];
    const span = distance(from.x, from.y, to.x, to.y);
    const distracted = decoy && decoy.t > 0 && distance(guard.x, guard.y, decoy.x, decoy.y) < 380;
    guard.progress += (guard.speed * (distracted ? 0.28 : 1) * dt) / span;
    if (guard.progress >= 1) {
      guard.progress -= 1;
      guard.leg = (guard.leg + 1) % guard.points.length;
    }
    const a = guard.points[guard.leg];
    const b = guard.points[(guard.leg + 1) % guard.points.length];
    guard.x = a.x + (b.x - a.x) * guard.progress;
    guard.y = a.y + (b.y - a.y) * guard.progress;
    guard.facing = distracted
      ? Math.atan2(decoy.y - guard.y, decoy.x - guard.x)
      : Math.atan2(b.y - a.y, b.x - a.x);
    guard.distracted = Boolean(distracted);
  }

  for (const camera of state.cameras) {
    camera.facing = camera.base + Math.sin(state.clock * camera.speed) * camera.sweep;
  }

  const hiddenBySmoke = state.smoke && state.smoke.t > 0 &&
    distance(p.x, p.y, state.smoke.x, state.smoke.y) < state.smoke.radius;
  const hiddenByCover = p.sneaking && nearCover(p.x, p.y);

  let watchers = 0;
  const eyes = state.guards.concat(state.cameras);
  for (const eye of eyes) {
    const d = distance(eye.x, eye.y, p.x, p.y);
    if (d > eye.range) continue;
    const toward = Math.atan2(p.y - eye.y, p.x - eye.x);
    if (Math.abs(angleDelta(toward, eye.facing)) > eye.fov / 2) continue;
    if (!canSee(eye.x, eye.y, p.x, p.y, BLOCKERS)) continue;
    if (hiddenBySmoke || hiddenByCover) continue;
    watchers += 1;
  }

  state.watchers = watchers;
  state.alarm = watchers > 0
    ? clamp(state.alarm + watchers * ALARM.risePerDetector * dt, 0, 100)
    : clamp(state.alarm - ALARM.decay * dt, 0, 100);
  if (state.alarm >= ALARM.caught && !state.won) state.caught = true;
}
