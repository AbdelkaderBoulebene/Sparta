#!/usr/bin/env node
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const GIFS_DIR = path.join(__dirname, 'src', 'assets', 'gifs');
const EXERCISES_FILE = path.join(__dirname, 'src', 'assets', 'exercises.json');
const GIF_BASE = 'https://static.exercisedb.dev/media/';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(dest);
    const req = client.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        fs.unlink(dest, () => {});
        return resolve(downloadFile(res.headers.location, dest));
      }
      if (res.statusCode === 429) {
        file.close();
        fs.unlink(dest, () => {});
        return reject(new Error('429'));
      }
      if (res.statusCode !== 200) {
        file.close();
        fs.unlink(dest, () => {});
        return reject(new Error('HTTP ' + res.statusCode));
      }
      res.pipe(file);
      file.on('finish', () => file.close(() => resolve('ok')));
    });
    req.on('error', (err) => { file.close(); fs.unlink(dest, () => {}); reject(err); });
    req.setTimeout(30000, () => { req.destroy(); file.close(); fs.unlink(dest, () => {}); reject(new Error('Timeout')); });
  });
}

function isValidGif(filePath) {
  if (!fs.existsSync(filePath)) return false;
  const buf = Buffer.alloc(3);
  const fd = fs.openSync(filePath, 'r');
  fs.readSync(fd, buf, 0, 3, 0);
  fs.closeSync(fd);
  return buf.toString('ascii') === 'GIF';
}

async function main() {
  const exercises = JSON.parse(fs.readFileSync(EXERCISES_FILE, 'utf8'));

  // Find exercises with invalid or missing GIFs
  const toFix = exercises.filter(e => {
    const dest = path.join(GIFS_DIR, `${e.exerciseId}.gif`);
    return !isValidGif(dest);
  });

  console.log(`Found ${toFix.length} exercises with missing/invalid GIFs\n`);

  if (toFix.length === 0) {
    console.log('All GIFs are valid!');
    return;
  }

  let ok = 0, failed = 0;

  for (let i = 0; i < toFix.length; i++) {
    const ex = toFix[i];
    const dest = path.join(GIFS_DIR, `${ex.exerciseId}.gif`);
    const url = `${GIF_BASE}${ex.exerciseId}.gif`;

    process.stdout.write(`[${i + 1}/${toFix.length}] ${ex.exerciseId} ... `);

    // Delete invalid file if it exists
    if (fs.existsSync(dest)) {
      fs.unlinkSync(dest);
    }

    let success = false;
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        await downloadFile(url, dest);
        if (isValidGif(dest)) {
          success = true;
          break;
        } else {
          // Got a non-GIF response
          if (fs.existsSync(dest)) fs.unlinkSync(dest);
          console.log('INVALID (non-GIF response)');
          break;
        }
      } catch (err) {
        if (err.message === '429') {
          const wait = (attempt + 1) * 8000;
          process.stdout.write(`(429, wait ${wait/1000}s) `);
          await sleep(wait);
        } else {
          process.stdout.write(`(${err.message}) `);
          if (attempt < 4) await sleep(1000);
        }
      }
    }

    if (success) {
      ok++;
      console.log('OK');
    } else {
      failed++;
      if (success === false && !fs.existsSync(dest)) {
        console.log('FAILED');
      }
    }

    await sleep(200);

    if ((i + 1) % 25 === 0) {
      console.log(`\n--- Progress: ${ok} OK, ${failed} failed ---\n`);
      await sleep(1500);
    }
  }

  console.log(`\n=== Done: ${ok} fixed, ${failed} failed ===`);

  const remaining = exercises.filter(e => !isValidGif(path.join(GIFS_DIR, `${e.exerciseId}.gif`))).length;
  console.log(`Remaining invalid/missing: ${remaining}`);
}

main().catch(err => {
  console.error('\nFATAL:', err.message);
  process.exit(1);
});
