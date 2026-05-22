const fs = require('fs');
const path = require('path');

// Main React app → app.html, premium home → index.html
fs.renameSync('dist/index.html', 'dist/app.html');
fs.copyFileSync('public/home/index.html', 'dist/index.html');
console.log('✓ index.html → premium home design, React app → app.html');

// Foraging map → dist/foraging/index.html
const foragingDir = path.join('dist', 'foraging');
if (!fs.existsSync(foragingDir)) fs.mkdirSync(foragingDir, { recursive: true });
if (fs.existsSync('dist/foraging.html')) {
  fs.renameSync('dist/foraging.html', path.join(foragingDir, 'index.html'));
  console.log('✓ foraging.html → dist/foraging/index.html');
}
