#!/usr/bin/env node
/**
 * Fetches fresh exercise data from the API to get current gifUrls
 * for the 176 exercises whose GIFs are missing/invalid.
 * Then downloads the GIFs and updates exercises.json.
 */
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const GIFS_DIR = path.join(__dirname, 'src', 'assets', 'gifs');
const EXERCISES_FILE = path.join(__dirname, 'src', 'assets', 'exercises.json');
const API_BASE = 'https://exercisedb.dev/api/v1';
const PAGE_LIMIT = 100;

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
      res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(data).toString('utf8') }));
    });
    req.on('error', reject);
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(dest);
    const req = client.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close(); fs.unlink(dest, () => {});
        return resolve(downloadFile(res.headers.location, dest));
      }
      if (res.statusCode === 429) { file.close(); fs.unlink(dest, () => {}); return reject(new Error('429')); }
      if (res.statusCode !== 200) { file.close(); fs.unlink(dest, () => {}); return reject(new Error('HTTP ' + res.statusCode)); }
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

async function fetchPage(offset, retries = 6) {
  for (let attempt = 0; attempt < retries; attempt++) {
    const url = `${API_BASE}/exercises?limit=${PAGE_LIMIT}&offset=${offset}`;
    const { status, body } = await get(url);
    if (status === 429) {
      const wait = attempt < 2 ? 15000 : 60000;
      console.log(`  429 rate limit, waiting ${wait / 1000}s...`);
      await sleep(wait);
      continue;
    }
    if (status !== 200) throw new Error(`HTTP ${status}`);
    return JSON.parse(body);
  }
  throw new Error('Max retries reached');
}

async function main() {
  const exercises = JSON.parse(fs.readFileSync(EXERCISES_FILE, 'utf8'));

  // Find exercises with invalid/missing GIFs
  const badIds = new Set(exercises
    .filter(e => !isValidGif(path.join(GIFS_DIR, `${e.exerciseId}.gif`)))
    .map(e => e.exerciseId)
  );

  console.log(`Exercises with invalid/missing GIFs: ${badIds.size}`);

  if (badIds.size === 0) {
    console.log('All GIFs are valid!');
    return;
  }

  // Fetch all pages from API to get fresh gifUrls
  console.log('\nFetching exercise data from API to get current gifUrls...');
  const freshGifUrls = new Map(); // exerciseId -> gifUrl

  const first = await fetchPage(0);
  const totalPages = first.metadata.totalPages;
  console.log(`API has ${first.metadata.totalExercises} exercises across ${totalPages} pages`);

  // Process first page
  first.data.forEach(e => { if (badIds.has(e.exerciseId)) freshGifUrls.set(e.exerciseId, e.gifUrl); });
  console.log(`Page 1/${totalPages} - found ${freshGifUrls.size} matches so far`);

  for (let i = 1; i < totalPages; i++) {
    if (freshGifUrls.size >= badIds.size) break; // Found all we need
    await sleep(1500);
    const page = await fetchPage(i * PAGE_LIMIT);
    page.data.forEach(e => { if (badIds.has(e.exerciseId)) freshGifUrls.set(e.exerciseId, e.gifUrl); });
    process.stdout.write(`\rPage ${i + 1}/${totalPages} - found ${freshGifUrls.size}/${badIds.size} matches`);
  }
  console.log();

  console.log(`\nFound fresh gifUrls for ${freshGifUrls.size}/${badIds.size} exercises`);

  const notFound = [...badIds].filter(id => !freshGifUrls.has(id));
  if (notFound.length > 0) {
    console.log(`No longer in API: ${notFound.length} exercises`);
    notFound.slice(0, 5).forEach(id => console.log(`  ${id}`));
  }

  // Download valid GIFs
  console.log('\nDownloading GIFs...');
  let ok = 0, failed = 0;

  for (const [exerciseId, gifUrl] of freshGifUrls) {
    const dest = path.join(GIFS_DIR, `${exerciseId}.gif`);
    process.stdout.write(`  ${exerciseId} (${gifUrl.slice(0, 50)}) ... `);

    // Delete invalid file if exists
    if (fs.existsSync(dest)) fs.unlinkSync(dest);

    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        await downloadFile(gifUrl, dest);
        if (isValidGif(dest)) { ok++; console.log('OK'); break; }
        else { if (fs.existsSync(dest)) fs.unlinkSync(dest); console.log('INVALID'); break; }
      } catch (err) {
        if (err.message === '429') { await sleep((attempt + 1) * 8000); }
        else if (attempt < 3) { await sleep(1000); }
        else { failed++; console.log(`FAILED (${err.message})`); }
      }
    }
    await sleep(200);
  }

  console.log(`\nDownloads: ${ok} OK, ${failed} failed`);

  // Handle exercises not found in API - remove them from exercises.json
  if (notFound.length > 0) {
    console.log(`\nRemoving ${notFound.length} exercises not in API from exercises.json...`);
    const notFoundSet = new Set(notFound);
    const updated = exercises.filter(e => !notFoundSet.has(e.exerciseId));
    fs.writeFileSync(EXERCISES_FILE, JSON.stringify(updated));
    console.log(`exercises.json: ${exercises.length} → ${updated.length} entries`);
  }

  // Final check
  const remaining = exercises.filter(e => !isValidGif(path.join(GIFS_DIR, `${e.exerciseId}.gif`))).length;
  console.log(`\nFinal: ${remaining} exercises still have invalid/missing GIFs`);
}

main().catch(err => {
  console.error('\nFATAL:', err.message);
  process.exit(1);
});
