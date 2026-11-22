// Palette, timing and balance constants for the whole heist.
export const COLOR = {
  floor: '#0b1422',
  floorLine: 'rgba(87,240,224,.045)',
  wall: '#16293b',
  wallEdge: '#2b5566',
  cover: '#12333a',
  coverEdge: '#57f0e0',
  cyan: '#57f0e0',
  amber: '#ffb648',
  red: '#ff4d6d',
  gold: '#ffd166',
  green: '#66f2a8',
  white: '#e8fbff',
  dim: '#6f93a8',
};

export const SPEED = {
  walk: 196,      // pixels per second in the open
  sneak: 104,     // pixels per second while holding Shift
  playerRadius: 14,
};

export const ALARM = {
  risePerDetector: 34,  // percent per second, per guard/camera that sees you
  decay: 13,            // percent per second when nobody sees you
  caught: 100,
};

// Each tool spends one of the six starting credits. Charges are limited too.
export const TOOLS = {
  decoy: { cost: 1, charges: 3, label: 'DECOY' },
  smoke: { cost: 2, charges: 2, label: 'SMOKE' },
  pick:  { cost: 2, charges: 1, label: 'PICK' },
};

export const VIEW = { width: 1280, height: 800 };
