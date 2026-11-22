// Every pixel of the game is drawn here from the live state — no image assets, no network.
import { COLOR, VIEW } from './config.js';
import { WALLS, COVERS, LOOT, EXIT } from './level.js';
import { conePolygon } from './geometry.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function label(ctx, text, x, y, color, size = 11, align = 'center') {
  ctx.font = `700 ${size}px "Trebuchet MS", sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

export function render(ctx, state) {
  const t = state.clock;
  ctx.clearRect(0, 0, VIEW.width, VIEW.height);
  drawFloor(ctx, t);

  // Cones sit under the figures but over the floor.
  for (const guard of state.guards) drawCone(ctx, guard, COLOR.amber, 0.2, state);
  for (const camera of state.cameras) drawCone(ctx, camera, COLOR.red, 0.17, state);

  drawWalls(ctx);
  drawCovers(ctx, t);
  drawExit(ctx, state, t);
  drawLoot(ctx, state, t);

  for (const camera of state.cameras) drawCamera(ctx, camera);
  for (const guard of state.guards) drawGuard(ctx, guard, t);

  if (state.decoy && state.decoy.t > 0) drawDecoy(ctx, state.decoy, t);
  if (state.smoke && state.smoke.t > 0) drawSmoke(ctx, state.smoke, t);

  drawThief(ctx, state, t);
  drawVignette(ctx, state);
}

function drawFloor(ctx, t) {
  const g = ctx.createRadialGradient(640, 390, 60, 640, 400, 760);
  g.addColorStop(0, '#101e30');
  g.addColorStop(1, '#060c16');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);

  ctx.strokeStyle = COLOR.floorLine;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 30; x <= 1250; x += 40) { ctx.moveTo(x, 30); ctx.lineTo(x, 770); }
  for (let y = 30; y <= 770; y += 40) { ctx.moveTo(30, y); ctx.lineTo(1250, y); }
  ctx.stroke();

  ctx.fillStyle = 'rgba(111,147,168,.30)';
  label(ctx, 'SERVICE CORRIDOR', 185, 96, 'rgba(111,147,168,.5)', 12);
  label(ctx, 'THE GALLERY', 600, 96, 'rgba(111,147,168,.5)', 12);
  label(ctx, 'VAULT CHAMBER', 1055, 96, 'rgba(111,147,168,.5)', 12);

  // Doorway markers: the two routes between rooms.
  ctx.setLineDash([6, 8]);
  ctx.strokeStyle = 'rgba(87,240,224,.30)';
  ctx.strokeRect(350, 300, 2, 170);
  ctx.strokeRect(868, 238, 2, 180);
  ctx.setLineDash([]);

  // Caution stripes in front of the vault door.
  ctx.save();
  ctx.beginPath();
  ctx.rect(882, 238, 54, 180);
  ctx.clip();
  ctx.strokeStyle = 'rgba(255,182,72,.11)';
  ctx.lineWidth = 8;
  for (let i = -260; i < 260; i += 18) {
    ctx.beginPath();
    ctx.moveTo(882 + i, 238);
    ctx.lineTo(882 + i + 180, 418);
    ctx.stroke();
  }
  ctx.restore();

  // A faint scanning line adds life without changing the layout.
  const scanY = 120 + ((t * 34) % 540);
  ctx.fillStyle = 'rgba(87,240,224,.025)';
  ctx.fillRect(30, scanY, 1220, 2);
}

function drawWalls(ctx) {
  for (const wall of WALLS) {
    const g = ctx.createLinearGradient(wall.x, wall.y, wall.x, wall.y + wall.h);
    g.addColorStop(0, '#1d3446');
    g.addColorStop(1, '#101f2e');
    ctx.fillStyle = g;
    ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
    ctx.strokeStyle = COLOR.wallEdge;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(wall.x + 0.5, wall.y + 0.5, wall.w - 1, wall.h - 1);
    ctx.fillStyle = 'rgba(87,240,224,.22)';
    ctx.fillRect(wall.x, wall.y, wall.w, 2);
  }
}

function drawCovers(ctx, t) {
  for (const box of COVERS) {
    ctx.save();
    roundRect(ctx, box.x, box.y, box.w, box.h, 5);
    ctx.fillStyle = COLOR.cover;
    ctx.shadowColor = 'rgba(87,240,224,.25)';
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.clip();
    ctx.strokeStyle = 'rgba(87,240,224,.16)';
    ctx.lineWidth = 2;
    for (let i = -box.h; i < box.w; i += 12) {
      ctx.beginPath();
      ctx.moveTo(box.x + i, box.y + box.h);
      ctx.lineTo(box.x + i + box.h, box.y);
      ctx.stroke();
    }
    ctx.restore();
    ctx.strokeStyle = COLOR.coverEdge;
    ctx.lineWidth = 1.5;
    roundRect(ctx, box.x, box.y, box.w, box.h, 5);
    ctx.stroke();
    label(ctx, box.name, box.x + box.w / 2, box.y + box.h / 2, 'rgba(87,240,224,.7)', 10);
  }
}

function drawCone(ctx, eye, color, alpha, state) {
  const points = conePolygon(eye.x, eye.y, eye.facing, eye.fov, eye.range,
    state.__blockersForCones);
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(eye.x, eye.y);
  for (const p of points) ctx.lineTo(p.x, p.y);
  ctx.closePath();
  // Solid translucent wash keeps the cones readable when the sheet is shrunk.
  ctx.fillStyle = hexFade(color, alpha + 0.12);
  ctx.fill();
  ctx.strokeStyle = hexFade(color, alpha + 0.3);
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

function hexFade(hex, alpha) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

function drawCamera(ctx, cam) {
  ctx.save();
  ctx.translate(cam.x, cam.y);
  ctx.rotate(cam.facing);
  ctx.fillStyle = '#1b2d3c';
  ctx.fillRect(-16, -9, 30, 18);
  ctx.strokeStyle = COLOR.red;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(-16, -9, 30, 18);
  ctx.fillStyle = COLOR.red;
  ctx.beginPath();
  ctx.arc(16, 0, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowColor = COLOR.red;
  ctx.shadowBlur = 14;
  ctx.fill();
  ctx.restore();
  label(ctx, 'CAM', cam.x, cam.y - 20, COLOR.red, 9);
}

function drawGuard(ctx, guard, t) {
  ctx.save();
  ctx.translate(guard.x, guard.y);
  ctx.fillStyle = 'rgba(0,0,0,.4)';
  ctx.beginPath();
  ctx.ellipse(3, 13, 16, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.rotate(guard.facing + Math.PI / 2);
  ctx.fillStyle = '#3a2d1d';
  ctx.strokeStyle = COLOR.amber;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, 4, 11, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffdca2';
  ctx.beginPath();
  ctx.arc(0, -10, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = COLOR.amber;
  ctx.fillRect(-2, -24, 4, 9);
  ctx.restore();

  label(ctx, guard.distracted ? '?' : '●', guard.x, guard.y - 34,
    guard.distracted ? COLOR.gold : COLOR.amber, 15);
}

function drawExit(ctx, state, t) {
  const e = EXIT;
  const ready = state.hasLoot;
  ctx.save();
  ctx.setLineDash([10, 7]);
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = ready ? COLOR.green : 'rgba(102,242,168,.45)';
  roundRect(ctx, e.x, e.y, e.w, e.h, 6);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = ready ? 'rgba(102,242,168,.10)' : 'rgba(102,242,168,.04)';
  ctx.fill();
  const pulse = ready ? 1 + Math.sin(t * 5) * 0.06 : 1;
  ctx.translate(e.x + e.w / 2, e.y + e.h / 2);
  ctx.scale(pulse, pulse);
  label(ctx, 'GETAWAY', 0, -12, ready ? COLOR.green : 'rgba(102,242,168,.6)', 13);
  label(ctx, '⇧ EXIT', 0, 10, ready ? COLOR.green : 'rgba(102,242,168,.5)', 11);
  ctx.restore();
}

function drawLoot(ctx, state, t) {
  const { x, y } = LOOT;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = 'rgba(0,0,0,.45)';
  ctx.beginPath();
  ctx.ellipse(0, 32, 44, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = state.vaultOpen ? '#203c4b' : '#16232f';
  ctx.strokeStyle = state.vaultOpen ? COLOR.gold : COLOR.dim;
  ctx.lineWidth = 2;
  roundRect(ctx, -44, 14, 88, 24, 4);
  ctx.fill();
  ctx.stroke();

  ctx.rotate(Math.sin(t * 1.3) * 0.12);
  ctx.shadowColor = COLOR.gold;
  ctx.shadowBlur = state.hasLoot ? 0 : 26;
  ctx.fillStyle = state.hasLoot ? '#5b5a3c' : COLOR.gold;
  ctx.beginPath();
  ctx.moveTo(0, -34);
  ctx.lineTo(22, -8);
  ctx.lineTo(0, 18);
  ctx.lineTo(-22, -8);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#fff4c8';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();

  label(ctx, state.hasLoot ? 'GEM TAKEN' : (state.vaultOpen ? 'MERIDIAN GEM' : 'VAULT SEALED'),
    x, y + 54, state.vaultOpen ? COLOR.gold : COLOR.dim, 11);
  if (!state.vaultOpen) {
    label(ctx, '⌑', x, y - 48, COLOR.amber, 18);
  }
}

function drawDecoy(ctx, decoy, t) {
  ctx.save();
  ctx.translate(decoy.x, decoy.y);
  const rings = 3;
  for (let i = 0; i < rings; i++) {
    const phase = (t * 1.8 + i / rings) % 1;
    ctx.strokeStyle = `rgba(255,209,102,${0.4 * (1 - phase)})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 12 + phase * 76, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.rotate(t * 6);
  ctx.fillStyle = COLOR.gold;
  ctx.shadowColor = COLOR.gold;
  ctx.shadowBlur = 12;
  ctx.fillRect(-6, -6, 12, 12);
  ctx.restore();
}

function drawSmoke(ctx, smoke, t) {
  ctx.save();
  ctx.translate(smoke.x, smoke.y);
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + t * 0.35;
    const r = 26 + (i % 3) * 12;
    const px = Math.cos(a) * r;
    const py = Math.sin(a) * r;
    const g = ctx.createRadialGradient(px, py, 2, px, py, 46);
    g.addColorStop(0, 'rgba(190,225,235,.30)');
    g.addColorStop(1, 'rgba(120,160,180,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(px, py, 46, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawThief(ctx, state, t) {
  const p = state.player;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.fillStyle = 'rgba(0,0,0,.45)';
  ctx.beginPath();
  ctx.ellipse(3, 12, 15, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  if (p.sneaking) {
    ctx.setLineDash([3, 4]);
    ctx.strokeStyle = 'rgba(87,240,224,.55)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, 23, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.rotate(p.facing + Math.PI / 2);
  ctx.fillStyle = '#0d3b42';
  ctx.strokeStyle = COLOR.cyan;
  ctx.lineWidth = 2.2;
  ctx.shadowColor = COLOR.cyan;
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.moveTo(0, -18);
  ctx.quadraticCurveTo(13, -12, 12, 8);
  ctx.lineTo(-12, 8);
  ctx.quadraticCurveTo(-13, -12, 0, -18);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#021014';
  ctx.fillRect(-7, -9, 14, 5);
  ctx.fillStyle = COLOR.cyan;
  ctx.fillRect(-2, -22, 4, 5);
  ctx.restore();

  if (state.hasLoot) {
    ctx.fillStyle = COLOR.gold;
    ctx.beginPath();
    ctx.arc(p.x + 13, p.y - 12, 4 + Math.sin(t * 6) * 0.7, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawVignette(ctx, state) {
  const heat = Math.max(0, state.alarm - 25) / 75;
  if (heat <= 0.01) return;
  const g = ctx.createRadialGradient(640, 400, 240, 640, 400, 760);
  g.addColorStop(0, 'rgba(255,77,109,0)');
  g.addColorStop(1, `rgba(255,77,109,${0.36 * heat})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
}
