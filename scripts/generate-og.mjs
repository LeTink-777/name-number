import sharp from 'sharp';

// Brand config for this project
const BG = '#050508';
const ACCENT = '#39ff14';
const SUB = '#c0c0cc';
const NAME = 'Число имени';
const SUBTITLE = 'Нумерология по имени онлайн бесплатно';

const W = 1200;
const H = 630;
const MAX_W = 1040;

const esc = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Approximate Arial advance widths so text never overflows the canvas
const widthOf = (text, size, bold) => text.length * size * (bold ? 0.62 : 0.53);

const fitSize = (text, ideal, bold) => {
  let size = ideal;
  while (size > 24 && widthOf(text, size, bold) > MAX_W) size -= 2;
  return size;
};

const wrap = (text, size, bold) => {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (widthOf(next, size, bold) > MAX_W && line) {
      lines.push(line);
      line = w;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
};

const nameSize = fitSize(NAME, 76, true);
const subSize = 32;
const subLines = wrap(SUBTITLE, subSize, false);

// Vertically center the whole text block
const nameH = nameSize * 1.15;
const ruleGap = 34;
const subH = subLines.length * (subSize * 1.4);
const blockH = nameH + ruleGap * 2 + subH;
let y = (H - blockH) / 2 + nameSize * 0.82;

const nameY = y;
const ruleY = nameY + ruleGap;
const subStartY = ruleY + ruleGap + subSize * 0.5;

const subTspans = subLines
  .map(
    (l, i) =>
      `<tspan x="${W / 2}" y="${subStartY + i * subSize * 1.4}">${esc(l)}</tspan>`
  )
  .join('');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="glow" cx="50%" cy="42%" r="62%">
      <stop offset="0%" stop-color="${ACCENT}" stop-opacity="0.16"/>
      <stop offset="100%" stop-color="${ACCENT}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="${BG}"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <rect x="0" y="0" width="${W}" height="8" fill="${ACCENT}"/>
  <text x="${W / 2}" y="${nameY}" font-family="Arial, Helvetica, sans-serif" font-size="${nameSize}" font-weight="bold" fill="${ACCENT}" text-anchor="middle">${esc(NAME)}</text>
  <rect x="${W / 2 - 70}" y="${ruleY}" width="140" height="3" rx="1.5" fill="${ACCENT}" opacity="0.55"/>
  <text font-family="Arial, Helvetica, sans-serif" font-size="${subSize}" fill="${SUB}" text-anchor="middle">${subTspans}</text>
</svg>`;

await sharp(Buffer.from(svg)).png().toFile('public/og-image.png');

console.log('✓ OG image generated (1200x630)');
