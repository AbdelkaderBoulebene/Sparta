#!/usr/bin/env node
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const API_BASE = 'https://exercisedb.dev/api/v1';
const PAGE_LIMIT = 100;
const GIFS_DIR = path.join(__dirname, 'src', 'assets', 'gifs');
const OUT_FILE = path.join(__dirname, 'src', 'assets', 'exercises.json');

function get(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return resolve(get(res.headers.location));
      }
      // Return statusCode with data so caller can handle 429
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('Timeout: ' + url)); });
  });
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(dest)) return resolve('skip');
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

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchPage(offset, retries = 8) {
  for (let attempt = 0; attempt < retries; attempt++) {
    const url = `${API_BASE}/exercises?limit=${PAGE_LIMIT}&offset=${offset}`;
    const { status, body } = await get(url);
    if (status === 429) {
      const wait = attempt < 2 ? 15000 : 90000; // 15s then 90s
      console.log(`429 rate limit, waiting ${wait / 1000}s...`);
      await sleep(wait);
      continue;
    }
    const json = JSON.parse(body);
    if (!json.success) throw new Error('API error: ' + body.slice(0, 200));
    return json;
  }
  throw new Error(`Failed after ${retries} retries at offset=${offset}`);
}

async function downloadWithRetry(url, dest, retries = 4) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await downloadFile(url, dest);
    } catch (err) {
      if (err.message === '429') {
        const wait = (attempt + 1) * 2000;
        await sleep(wait);
      } else if (attempt < retries - 1) {
        await sleep(500);
      } else {
        throw err;
      }
    }
  }
}

async function main() {
  console.log('=== Fetching exercises from ExerciseDB ===\n');

  // Load existing progress if any (for resuming)
  let allExercises = [];
  let startPage = 0;
  const tempFile = path.join(__dirname, 'exercises-temp.json');
  if (fs.existsSync(tempFile)) {
    allExercises = JSON.parse(fs.readFileSync(tempFile, 'utf8'));
    startPage = Math.floor(allExercises.length / PAGE_LIMIT);
    console.log(`Resuming from page ${startPage + 1} (${allExercises.length} already fetched)\n`);
  }

  // Fetch exercise metadata pages
  let totalPages = 15; // default, will be updated from first response
  if (startPage === 0) {
    console.log('Fetching page 1...');
    const first = await fetchPage(0);
    totalPages = first.metadata.totalPages;
    console.log(`Total: ${first.metadata.totalExercises} exercises across ${totalPages} pages\n`);
    allExercises = [...first.data];
    startPage = 1;
  }

  for (let i = startPage; i < totalPages; i++) {
    const offset = i * PAGE_LIMIT;
    process.stdout.write(`Fetching page ${i + 1}/${totalPages}... `);
    await sleep(1500); // be polite to avoid 429
    const page = await fetchPage(offset);
    allExercises = allExercises.concat(page.data);
    console.log(`OK (${page.data.length} exercises, total: ${allExercises.length})`);
    // Save temp progress
    fs.writeFileSync(tempFile, JSON.stringify(allExercises));
  }

  console.log(`\nAll ${allExercises.length} exercises fetched.\n`);

  // Step 2: Download GIFs
  console.log('=== Downloading GIFs ===\n');
  let downloaded = 0, skipped = 0, failed = 0;

  for (let i = 0; i < allExercises.length; i++) {
    const ex = allExercises[i];
    const gifFile = `${ex.exerciseId}.gif`;
    const dest = path.join(GIFS_DIR, gifFile);

    // Already updated to local path in a previous run
    if (ex.gifUrl && ex.gifUrl.startsWith('assets/')) {
      skipped++;
      continue;
    }

    const originalUrl = ex.gifUrl;
    process.stdout.write(`[${i + 1}/${allExercises.length}] ${ex.exerciseId} ... `);

    try {
      const result = await downloadWithRetry(originalUrl, dest);
      if (result === 'skip') {
        skipped++;
        process.stdout.write('skip\n');
      } else {
        downloaded++;
        process.stdout.write('OK\n');
      }
      allExercises[i] = { ...ex, gifUrl: `assets/gifs/${gifFile}` };
    } catch (err) {
      failed++;
      process.stdout.write(`FAILED (${err.message})\n`);
      // keep original URL as fallback
    }

    // Save progress every 50 GIFs
    if ((i + 1) % 50 === 0) {
      fs.writeFileSync(tempFile, JSON.stringify(allExercises));
      await sleep(800);
    }
  }

  console.log(`\nGIFs: ${downloaded} downloaded, ${skipped} skipped, ${failed} failed\n`);

  // Step 3: Save final exercises.json
  fs.writeFileSync(OUT_FILE, JSON.stringify(allExercises));
  const sizeKB = Math.round(fs.statSync(OUT_FILE).size / 1024);
  console.log(`=== Saved: ${allExercises.length} exercises, JSON size: ${sizeKB} KB ===`);

  // Cleanup temp file
  if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
  console.log('Done!');
}

main().catch(err => {
  console.error('\nFATAL:', err.message);
  process.exit(1);
});
