const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const GIFS_DIR = path.join(__dirname, 'src', 'assets', 'gifs');

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function head(url) {
  return new Promise((resolve) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.request(url, { method: 'HEAD', headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      resolve(res.statusCode);
    });
    req.on('error', () => resolve(0));
    req.setTimeout(10000, () => { req.destroy(); resolve(0); });
    req.end();
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
  const exercises = JSON.parse(fs.readFileSync('./src/assets/exercises.json', 'utf8'));

  const toFix = exercises.filter(e => {
    const dest = path.join(GIFS_DIR, `${e.exerciseId}.gif`);
    return !isValidGif(dest);
  });

  console.log(`Total to check: ${toFix.length}`);

  let exists404 = [];
  let exists200 = [];

  // Sample first 20 to check
  const sample = toFix.slice(0, 20);
  for (const ex of sample) {
    const url = `https://static.exercisedb.dev/media/${ex.exerciseId}.gif`;
    const status = await head(url);
    if (status === 200) {
      exists200.push(ex.exerciseId);
    } else {
      exists404.push({ id: ex.exerciseId, status });
    }
    await sleep(200);
  }

  console.log(`\nSample of ${sample.length}:`);
  console.log(`  200 (available): ${exists200.length}`, exists200);
  console.log(`  404/other: ${exists404.length}`, exists404.slice(0, 10));
}

main().catch(console.error);
