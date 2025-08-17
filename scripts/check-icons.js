import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const requiredIcons = [
  'icon-72x72.png',
  'icon-96x96.png', 
  'icon-128x128.png',
  'icon-144x144.png',
  'icon-152x152.png',
  'icon-192x192.png',
  'icon-384x384.png',
  'icon-512x512.png'
];

const iconsDir = path.join(__dirname, '..', 'public', 'icons');

console.log('Checking for required app icons...\n');

let missingIcons = [];
let presentIcons = [];

requiredIcons.forEach(icon => {
  const iconPath = path.join(iconsDir, icon);
  if (fs.existsSync(iconPath)) {
    presentIcons.push(icon);
    console.log(`✅ ${icon}`);
  } else {
    missingIcons.push(icon);
    console.log(`❌ ${icon} - MISSING`);
  }
});

console.log(`\nSummary:`);
console.log(`- Present: ${presentIcons.length}/${requiredIcons.length}`);
console.log(`- Missing: ${missingIcons.length}/${requiredIcons.length}`);

if (missingIcons.length > 0) {
  console.log(`\nMissing icons: ${missingIcons.join(', ')}`);
  console.log('\nTo generate missing icons:');
  console.log('1. Open public/generate-icons.html in a web browser');
  console.log('2. Right-click on each canvas and save as PNG');
  console.log('3. Place the saved files in public/icons/ directory');
  console.log('\nOr use an online SVG to PNG converter with fire-icon.svg');
} else {
  console.log('\n🎉 All required icons are present!');
}
