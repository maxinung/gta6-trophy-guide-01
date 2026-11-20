import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });

// Copy app/ directory to output
const appSrc = join(here, 'app');
const appDst = join(out, 'app');

if (existsSync(appSrc)) {
  cpSync(appSrc, appDst, { recursive: true });
}

// Copy screenshots/ directory to output
const screenshotsSrc = join(here, 'screenshots');
const screenshotsDst = join(out, 'screenshots');

if (existsSync(screenshotsSrc)) {
  cpSync(screenshotsSrc, screenshotsDst, { recursive: true });
}

// Build dossier.json
try {
  const dossier = buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  });
  const dossierPath = join(out, 'dossier.json');
  const writeFolder = process.env.MAKEFUN_OUTPUT_DIR ? join(process.env.MAKEFUN_OUTPUT_DIR, '..') : '/output';
  mkdirSync(writeFolder, { recursive: true });
  writeFileSync(dossierPath, dossier);
  console.log('Dossier built successfully');
} catch (e) {
  console.error('Dossier build error:', e.message);
  process.exit(1);
}