const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const src = path.join(root, 'src');
const dist = path.join(root, 'dist');

const jsFiles = [
  'core/state.js',
  'core/overlay.js',
  'core/lifecycle.js',
  'animations/fade.js',
  'loader/loader.js',
  'transitions/page-transition.js',
  'core/init.js'
];

const cssFiles = [
  'styles/main.css'
];

// ─── Build ────────────────────────────────────────────────────────────────────

function build() {
  const jsParts = jsFiles.map(file => {
    const content = fs.readFileSync(path.join(src, file), 'utf8').trim();
    return `// ── ${file} ──\n${content}`;
  });

  const jsBundle =
    `/* Webflow Motion v1.0.0 | MIT License */\n` +
    `(function (gsap) {\n` +
    `  'use strict';\n\n` +
    `  if (!gsap) {\n` +
    `    console.error('[WebflowMotion] GSAP not found. Load GSAP before this script.');\n` +
    `    return;\n` +
    `  }\n\n` +
    jsParts.join('\n\n') + '\n\n' +
    `})(window.gsap);\n`;

  const cssBundle =
    `/* Webflow Motion v1.0.0 | MIT License */\n` +
    cssFiles.map(file => fs.readFileSync(path.join(src, file), 'utf8').trim()).join('\n\n') + '\n';

  if (!fs.existsSync(dist)) fs.mkdirSync(dist);

  fs.writeFileSync(path.join(dist, 'webflow-motion.js'), jsBundle);
  fs.writeFileSync(path.join(dist, 'webflow-motion.css'), cssBundle);

  const time = new Date().toLocaleTimeString();
  console.log(`[${time}] ✓ dist/webflow-motion.js`);
  console.log(`[${time}] ✓ dist/webflow-motion.css`);
}

// ─── Watch ────────────────────────────────────────────────────────────────────

if (process.argv.includes('--watch')) {
  build(); // initial build
  console.log('\nWatching src/ for changes...\n');

  fs.watch(src, { recursive: true }, (event, filename) => {
    if (!filename) return;
    if (!filename.endsWith('.js') && !filename.endsWith('.css')) return;
    console.log(`Changed: ${filename}`);
    build();
  });
} else {
  build();
}
