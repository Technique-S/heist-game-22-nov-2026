// Shadow Vault — boot, input, the frame loop and the HUD. Everything is plain ES modules.
import { render } from './render.js';
import { updatePlayer } from './player.js';
import { makeSecurity, updateSecurity } from './security.js';
import { useTool } from './tools.js';
import { BLOCKERS, LOOT, EXIT, SPAWN } from './level.js';
import { distance } from './geometry.js';

const canvas = document.getElementById('world');
const ctx = canvas.getContext('2d');
const ui = {
  alarmFill: document.getElementById('alarm-fill'),
  alarmNum: document.getElementById('alarm-num'),
  alarmState: document.getElementById('alarm-state'),
  credits: document.getElementById('credit-num'),
  banner: document.getElementById('banner'),
  toast: document.getElementById('toast'),
  steps: [1, 2, 3, 4].map((n) => document.getElementById(`step${n}`)),
  counts: [1, 2, 3].map((n) => document.getElementById(`count${n}`)),
  tools: [1, 2, 3].map((n) => document.getElementById(`tool${n}`)),
};

function newState() {
  const security = makeSecurity();
  return {
    clock: 0,
    player: { x: SPAWN.x, y: SPAWN.y, facing: -0.6, sneaking: false, moving: false },
    guards: security.guards,
    cameras: security.cameras,
    __blockersForCones: BLOCKERS,
    keys: new Set(),
    alarm: 8,
    credits: 6,
    tools: { decoy: 3, smoke: 2, pick: 1 },
    vaultOpen: false,
    hasLoot: false,
    caught: false,
    won: false,
    watchers: 0,
    decoy: null,
    smoke: null,
    lastToast: '',
    toastTimer: 0,
  };
}

const state = newState();

function toast(message) {
  ui.toast.textContent = message;
  ui.toast.classList.remove('hidden');
  state.toastTimer = 2.2;
}

function refreshHud() {
  const pct = Math.round(state.alarm);
  ui.alarmFill.style.width = `${pct}%`;
  ui.alarmNum.textContent = `${String(pct).padStart(2, '0')}%`;
  const status = state.caught ? 'CAUGHT' : pct > 72 ? 'HUNTING' : pct > 34 ? 'SEARCHING' : 'CLEAR';
  ui.alarmState.textContent = status;
  ui.alarmState.classList.toggle('hot', pct > 55 || state.caught);
  ui.credits.textContent = String(state.credits);
  const charges = [state.tools.decoy, state.tools.smoke, state.tools.pick];
  charges.forEach((n, i) => {
    ui.counts[i].textContent = `×${n}`;
    ui.tools[i].classList.toggle('empty', n === 0);
  });
  const done = [true, state.vaultOpen, state.hasLoot, state.won];
  ui.steps.forEach((el, i) => {
    el.classList.toggle('done', done[i] && (i > 0 || true));
    el.classList.toggle('active', !done[i] && (i === 0 || done[i - 1]));
  });
}

function setBanner(text, good = false) {
  ui.banner.textContent = text;
  ui.banner.classList.toggle('good', good);
  ui.banner.classList.remove('hidden');
}

function interact() {
  const p = state.player;
  if (!state.vaultOpen && distance(p.x, p.y, LOOT.x, LOOT.y) < 150) {
    toast('The case is sealed — press 3 to pick it.');
    return;
  }
  if (state.vaultOpen && !state.hasLoot && distance(p.x, p.y, LOOT.x, LOOT.y) < 70) {
    state.hasLoot = true;
    toast('MERIDIAN GEM SECURED. Get back to the hatch.');
    return;
  }
  if (state.hasLoot && p.x > EXIT.x && p.x < EXIT.x + EXIT.w && p.y > EXIT.y && p.y < EXIT.y + EXIT.h) {
    state.won = true;
    setBanner('CLEAR', true);
  }
}

window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) event.preventDefault();
  state.keys.add(key);
  if (key === 'e') interact();
  if (key === '1') toast(useTool(state, 'decoy'));
  if (key === '2') toast(useTool(state, 'smoke'));
  if (key === '3') toast(useTool(state, 'pick'));
  if (key === 'r' && (state.caught || state.won)) {
    ui.banner.classList.add('hidden');
    Object.assign(state, newState());
  }
});
window.addEventListener('keyup', (event) => state.keys.delete(event.key.toLowerCase()));
window.addEventListener('blur', () => state.keys.clear());

// Scripted viewpoints are states of this very game: the agent plays to these moments and shoots.
function applyShot(name) {
  if (name === 'play') {
    Object.assign(state.player, { x: 560, y: 428, facing: -0.5, sneaking: true });
    state.alarm = 38;
    state.credits = 4;
    state.tools = { decoy: 2, smoke: 1, pick: 1 };
    state.decoy = { x: 470, y: 512, t: 4 };
    state.smoke = { x: 556, y: 432, t: 6.5, radius: 78 };
    Object.assign(state.guards[0], { x: 250, y: 420, facing: 0.1 });
    Object.assign(state.guards[1], { x: 742, y: 258, facing: 2.5 });
    Object.assign(state.guards[2], { x: 1000, y: 400, facing: 0.2 });
    state.cameras[0].facing = 1.85;
    state.cameras[1].facing = 2.55;
  } else if (name === 'spotted') {
    Object.assign(state.player, { x: 700, y: 300, facing: 2.9, sneaking: false });
    state.alarm = 96;
    Object.assign(state.guards[0], { x: 266, y: 300, facing: 0 });
    Object.assign(state.guards[1], { x: 782, y: 300, facing: Math.PI });
    Object.assign(state.guards[2], { x: 1000, y: 400, facing: 0.1 });
    state.cameras[0].facing = 1.7;
    state.cameras[1].facing = 2.6;
    setBanner('SPOTTED');
  } else if (name === 'getaway') {
    Object.assign(state.player, { x: 112, y: 722, facing: -2.2, sneaking: false });
    state.hasLoot = true;
    state.vaultOpen = true;
    state.alarm = 44;
    state.credits = 3;
    Object.assign(state.guards[0], { x: 250, y: 620, facing: 2.4 });
    Object.assign(state.guards[1], { x: 500, y: 664, facing: -1.1 });
    Object.assign(state.guards[2], { x: 1000, y: 400, facing: 0.2 });
    state.cameras[0].facing = 2.1;
    state.cameras[1].facing = 2.5;
    setBanner('GETAWAY', true);
  }
}

const shot = new URLSearchParams(location.search).get('shot');
if (shot) {
  applyShot(shot);
  state.clock = shot === 'play' ? 12.4 : shot === 'spotted' ? 19.1 : shot === 'getaway' ? 31.7 : 2.4;
  refreshHud();
  render(ctx, state);
} else {
  let previous = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - previous) / 1000);
    previous = now;
    if (!state.caught && !state.won) {
      state.clock += dt;
      if (state.decoy) state.decoy.t -= dt;
      if (state.smoke) state.smoke.t -= dt;
      updatePlayer(state, dt);
      updateSecurity(state, dt);
      const p = state.player;
      if (state.hasLoot && p.x > EXIT.x && p.x < EXIT.x + EXIT.w &&
          p.y > EXIT.y && p.y < EXIT.y + EXIT.h) {
        state.won = true;
        setBanner('GETAWAY', true);
      }
      if (state.caught) setBanner('CAUGHT');
    }
    if (state.toastTimer > 0) {
      state.toastTimer -= dt;
      if (state.toastTimer <= 0) ui.toast.classList.add('hidden');
    }
    refreshHud();
    render(ctx, state);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
