// The three tools. Every use spends credits, and each tool has a small charge count.
import { TOOLS } from './config.js';
import { LOOT } from './level.js';
import { clamp, distance } from './geometry.js';

export function useTool(state, name) {
  const spec = TOOLS[name];
  if (state.tools[name] <= 0) return 'No charges left.';
  if (state.credits < spec.cost) return 'Not enough credits.';
  const p = state.player;

  if (name === 'decoy') {
    const reach = 170;
    state.decoy = {
      x: clamp(p.x + Math.cos(p.facing) * reach, 46, 1234),
      y: clamp(p.y + Math.sin(p.facing) * reach, 46, 754),
      t: 4,
    };
  } else if (name === 'smoke') {
    state.smoke = { x: p.x, y: p.y, t: 6.5, radius: 78 };
  } else if (name === 'pick') {
    if (distance(p.x, p.y, LOOT.x, LOOT.y) > 150) return 'Get to the vault door first.';
    state.vaultOpen = true;
  }

  state.credits -= spec.cost;
  state.tools[name] -= 1;
  return `${spec.label} used.`;
}
