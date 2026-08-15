import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const svgPath = 'public/favicon.svg';
if (!fs.existsSync(svgPath)) {
  console.log('No favicon.svg found, skipping');
  process.exit(0);
}

const svg = fs.readFileSync(svgPath);

await sharp(svg).resize(16, 16).png().toFile('public/favicon-16x16.png');
await sharp(svg).resize(32, 32).png().toFile('public/favicon-32x32.png');
await sharp(svg).resize(48, 48).png().toFile('public/favicon-48x48.png');
await sharp(svg).resize(180, 180).png().toFile('public/apple-touch-icon.png');
await sharp(svg).resize(192, 192).png().toFile('public/icon-192.png');
await sharp(svg).resize(512, 512).png().toFile('public/icon-512.png');

console.log('✓ Favicons generated');
