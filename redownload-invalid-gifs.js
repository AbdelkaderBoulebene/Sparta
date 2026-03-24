#!/usr/bin/env node
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const GIFS_DIR = path.join(__dirname, 'src', 'assets', 'gifs');
const API_BASE = 'https://exercisedb.dev/api/v1';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function get(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return resolve(get(res.headers.location));
      }
      let data = [];
      res.on('data', chunk => data.push(chunk));
      res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(data) }));
    });
    req.on('error', reject);
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('Timeout: ' + url)); });
  });
}

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
      res.pipe(file);
      file.on('finish', () => file.close(() => resolve('ok')));
    });
    req.on('error', (err) => { file.close(); fs.unlink(dest, () => {}); reject(err); });
    req.setTimeout(30000, () => { req.destroy(); file.close(); fs.unlink(dest, () => {}); reject(new Error('Timeout')); });
  });
}

// Find all invalid GIF files (not starting with GIF header)
function findInvalidGifs() {
  const files = fs.readdirSync(GIFS_DIR);
  return files.filter(f => {
    const buf = Buffer.alloc(3);
    const fd = fs.openSync(path.join(GIFS_DIR, f), 'r');
    fs.readSync(fd, buf, 0, 3, 0);
    fs.closeSync(fd);
    return buf.toString('ascii') !== 'GIF';
  });
}

async function getExerciseGifUrl(exerciseId, retries = 5) {
  for (let attempt = 0; attempt < retries; attempt++) {
    const url = `${API_BASE}/exercises/exercise/${exerciseId}`;
    const { status, body } = await get(url);
    if (status === 429) {
      const wait = (attempt + 1) * 10000;
      console.log(`  429 rate limit, waiting ${wait / 1000}s...`);
      await sleep(wait);
      continue;
    }
    if (status !== 200) {
      console.log(`  API error: ${status}`);
      return null;
    }
    const json = JSON.parse(body.toString('utf8'));
    return json.gifUrl || null;
  }
  return null;
}

async function main() {
  console.log('=== Finding invalid GIF files ===');
  const invalid = findInvalidGifs();
  console.log(`Found ${invalid.length} invalid GIFs\n`);

  if (invalid.length === 0) {
    console.log('No invalid GIFs found!');
    return;
  }

  let ok = 0, failed = 0;

  for (let i = 0; i < invalid.length; i++) {
    const filename = invalid[i];
    const exerciseId = filename.replace('.gif', '');
    const dest = path.join(GIFS_DIR, filename);

    process.stdout.write(`[${i + 1}/${invalid.length}] ${exerciseId} ... `);

    // Delete the invalid file
    fs.unlinkSync(dest);

    // Get original URL from API
    const gifUrl = await getExerciseGifUrl(exerciseId);
    if (!gifUrl) {
      failed++;
      console.log('FAILED (could not get URL)');
      continue;
    }

    // Download the GIF
    try {
      for (let attempt = 0; attempt < 4; attempt++) {
        try {
          await downloadFile(gifUrl, dest);
          break;
        } catch (err) {
          if (err.message === '429') {
            const wait = (attempt + 1) * 5000;
            await sleep(wait);
          } else if (attempt < 3) {
            await sleep(1000);
          } else {
            throw err;
          }
        }
      }

      // Verify it's a valid GIF now
      const buf = Buffer.alloc(3);
      const fd = fs.openSync(dest, 'r');
      fs.readSync(fd, buf, 0, 3, 0);
      fs.closeSync(fd);
      if (buf.toString('ascii') === 'GIF') {
        ok++;
        console.log('OK');
      } else {
        failed++;
        console.log('FAILED (still invalid after download)');
        fs.unlinkSync(dest);
      }
    } catch (err) {
      failed++;
      console.log(`FAILED (${err.message})`);
    }

    // Small delay to be polite
    await sleep(300);

    // Progress save every 25
    if ((i + 1) % 25 === 0) {
      console.log(`\n--- Progress: ${ok} OK, ${failed} failed so far ---\n`);
      await sleep(2000);
    }
  }

  console.log(`\n=== Done: ${ok} re-downloaded, ${failed} failed ===`);

  // Final verification
  const stillInvalid = findInvalidGifs();
  console.log(`Remaining invalid GIFs: ${stillInvalid.length}`);
}

main().catch(err => {
  console.error('\nFATAL:', err.message);
  process.exit(1);
});
