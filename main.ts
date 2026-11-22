// Hand-in program for Shadow Vault (Node 22, standard library only).
// The game lives in ./game as plain static files. This program copies the game and the
// maker's own screenshots into the output directory, then writes the dossier the judge
// reads, using the kit's unchanged vendored builder. No build step and no network.
import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function handIn() {
  mkdirSync(out, { recursive: true });

  cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });

  mkdirSync(join(out, 'screenshots'), { recursive: true });
  if (existsSync(join(here, 'screenshots'))) {
    cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
  }

  const caps = {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  };

  // Fail loudly here rather than hand in an empty image set the scorer would reject.
  const shots = readdirSync(join(out, 'screenshots')).filter((name) => !name.startsWith('.'));
  if (shots.length < 3 || shots.length > 4) {
    throw new Error(`expected 3 or 4 screenshots, found ${shots.length}`);
  }
  for (const shot of shots) {
    if (statSync(join(out, 'screenshots', shot)).size > caps.screenshots.max_bytes) {
      throw new Error(`screenshot over the size cap: ${shot}`);
    }
  }

  writeFileSync(join(out, 'dossier.json'), buildDossier(out, caps));
}

handIn();
