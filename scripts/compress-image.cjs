#!/usr/bin/env node
// scripts/compress-image.cjs
//
// Compress a .webp / .jpg / .png in place. Twin of rotate-image.cjs.
// Default target: max 1400 px on the long edge + quality 82 for
// webp/jpg (visually indistinguishable from source at web-tile
// display sizes) + high PNG compression. A 6 MB product photo
// typically comes out at 200-400 KB with this.
//
// USAGE:
//   node scripts/compress-image.cjs <file> [--quality N] [--width N] [--out <path>]
//
// EXAMPLES:
//   node scripts/compress-image.cjs public/home/products/blue-lotus-flower.webp
//     → default: max 1400 px, quality 82, overwrites file (backup as .original)
//
//   node scripts/compress-image.cjs public/home/products/hero.webp --quality 90 --width 1800
//     → higher-quality larger version
//
//   node scripts/compress-image.cjs img.webp --out img-small.webp
//     → keep the original untouched; write compressed to img-small.webp
//
// SAFETY: before overwriting, the original is copied to
// `<file>.original.webp` (or .original.jpg / .original.png).
// Delete the .original once you're happy — or restore by renaming
// it back.

const fs   = require('fs');
const path = require('path');
const sharp = require('sharp');
// Disable sharp's file-input cache — on Windows a cached file
// handle prevents the same-path write below and throws
// "UNKNOWN: unknown error, open" mid-batch. Cheap to disable
// for a one-shot CLI.
sharp.cache(false);

function fmtBytes(n) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
  return (n / 1024 / 1024).toFixed(2) + ' MB';
}
function argInt(args, flag, def) {
  const i = args.indexOf(flag);
  if (i < 0) return def;
  const v = parseInt(args[i + 1], 10);
  return Number.isFinite(v) ? v : def;
}
function argStr(args, flag) {
  const i = args.indexOf(flag);
  return i > -1 ? args[i + 1] : null;
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 1 || args[0].startsWith('--')) {
    console.error('Usage: node scripts/compress-image.cjs <file> [--quality 82] [--width 1400] [--out path]');
    process.exit(1);
  }
  const filePath = path.resolve(args[0]);
  const quality  = argInt(args, '--quality', 82);
  const maxWidth = argInt(args, '--width', 1400);
  const outPath  = (argStr(args, '--out') ? path.resolve(argStr(args, '--out')) : filePath);
  const overwriting = outPath === filePath;

  if (!fs.existsSync(filePath)) {
    console.error('File not found:', filePath);
    process.exit(1);
  }
  const beforeBytes = fs.statSync(filePath).size;

  // Backup once (never clobber an existing .original).
  if (overwriting) {
    const ext = path.extname(filePath);
    const bakPath = filePath.slice(0, -ext.length) + '.original' + ext;
    if (!fs.existsSync(bakPath)) {
      fs.copyFileSync(filePath, bakPath);
      console.log('Backup:', bakPath);
    } else {
      console.log('Existing backup kept:', bakPath);
    }
  }

  // Read the entire file into a Buffer FIRST, then feed sharp a
  // buffer input — belt-and-braces against Windows file-lock races
  // when we later write to the same path.
  const inputBuf = fs.readFileSync(filePath);
  const meta = await sharp(inputBuf).metadata();
  let pipe = sharp(inputBuf);
  if (meta.width && meta.width > maxWidth) {
    pipe = pipe.resize({ width: maxWidth, withoutEnlargement: true });
  }

  const ext = path.extname(filePath).toLowerCase();
  let buf;
  if (ext === '.webp') {
    buf = await pipe.webp({ quality, effort: 5 }).toBuffer();
  } else if (ext === '.jpg' || ext === '.jpeg') {
    buf = await pipe.jpeg({ quality, mozjpeg: true }).toBuffer();
  } else if (ext === '.png') {
    buf = await pipe.png({ compressionLevel: 9, palette: true }).toBuffer();
  } else {
    console.error('Unsupported extension:', ext);
    process.exit(1);
  }

  fs.writeFileSync(outPath, buf);
  const savedPct = beforeBytes > 0 ? ((1 - buf.length / beforeBytes) * 100).toFixed(1) : '0';
  console.log(
    'Compressed ' + path.basename(filePath) + ': '
    + fmtBytes(beforeBytes) + ' → ' + fmtBytes(buf.length)
    + ' (' + savedPct + '% smaller, ' + (meta.width || '?') + '×' + (meta.height || '?') + ' → '
    + (meta.width && meta.width > maxWidth ? maxWidth : (meta.width || '?')) + 'px wide)'
  );
}

main().catch(err => {
  console.error('Compression failed:', err.message);
  process.exit(1);
});
