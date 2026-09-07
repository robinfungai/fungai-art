#!/usr/bin/env node
// scripts/rotate-image.cjs
//
// Rotate a .webp / .jpg / .png in place (or write a new file).
// Windows Photos doesn't handle .webp rotation and Robin doesn't
// want to install a separate image editor for a one-off.
//
// Uses `sharp` (already a project dependency).
//
// USAGE:
//   node scripts/rotate-image.cjs <file> <degrees> [--out <output>]
//
// EXAMPLES:
//   node scripts/rotate-image.cjs public/home/products/chaga.webp 90
//     → rotates 90° clockwise, overwrites the file in place (with backup)
//
//   node scripts/rotate-image.cjs public/home/products/blue-lotus.webp -90
//     → rotates 90° counter-clockwise (or use 270)
//
//   node scripts/rotate-image.cjs public/home/products/chaga.webp 180 --out chaga-rotated.webp
//     → writes to a new file instead of overwriting
//
// SAFETY: before overwriting, the original is copied to
// `<file>.bak` so you can restore if the rotation is wrong.
// Run again with the negative angle to undo (270 to undo 90, etc.).

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: node scripts/rotate-image.cjs <file> <degrees> [--out <output>]');
    console.error('  degrees: 90, 180, 270, -90 (or any integer)');
    process.exit(1);
  }
  const filePath = path.resolve(args[0]);
  const degrees  = parseInt(args[1], 10);
  const outIdx   = args.indexOf('--out');
  const outPath  = outIdx > -1 ? path.resolve(args[outIdx + 1]) : filePath;
  const overwriting = outPath === filePath;

  if (!fs.existsSync(filePath)) {
    console.error('File not found:', filePath);
    process.exit(1);
  }
  if (!Number.isFinite(degrees)) {
    console.error('Degrees must be an integer.');
    process.exit(1);
  }

  // Backup the original before overwriting.
  if (overwriting) {
    const bakPath = filePath + '.bak';
    if (!fs.existsSync(bakPath)) {
      fs.copyFileSync(filePath, bakPath);
      console.log('Backup written:', bakPath);
    } else {
      console.log('Backup already exists, not overwriting:', bakPath);
    }
  }

  // sharp reads the file, rotates, writes. For webp we round-trip to
  // webp at quality 92 (visually indistinguishable from a fresh export
  // for typical product photography). For jpg/png we preserve format.
  const ext = path.extname(filePath).toLowerCase();
  const buf = await sharp(filePath).rotate(degrees).toBuffer();
  let finalBuf;
  if (ext === '.webp') {
    finalBuf = await sharp(buf).webp({ quality: 92 }).toBuffer();
  } else if (ext === '.jpg' || ext === '.jpeg') {
    finalBuf = await sharp(buf).jpeg({ quality: 92 }).toBuffer();
  } else if (ext === '.png') {
    finalBuf = await sharp(buf).png({ compressionLevel: 9 }).toBuffer();
  } else {
    finalBuf = buf;
  }
  fs.writeFileSync(outPath, finalBuf);
  console.log('Rotated', degrees + '°:', outPath, '(' + finalBuf.length + ' bytes)');
}

main().catch(err => {
  console.error('Rotation failed:', err.message);
  process.exit(1);
});
