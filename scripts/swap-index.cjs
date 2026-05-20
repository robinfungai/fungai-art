const fs = require('fs');

fs.renameSync('dist/index.html', 'dist/app.html');
fs.copyFileSync('public/home/index.html', 'dist/index.html');
console.log('✓ index.html → premium home design, React app → app.html');
