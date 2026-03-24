const fs = require('fs');
const path = require('path');

const gifsDir = './src/assets/gifs';
const files = fs.readdirSync(gifsDir);

const small = files
  .map(f => ({ name: f, size: fs.statSync(path.join(gifsDir, f)).size }))
  .filter(f => f.size < 1000) // less than 1KB is suspicious
  .sort((a, b) => a.size - b.size);

console.log(`Total GIF files: ${files.length}`);
console.log(`Suspiciously small (< 1KB): ${small.length}`);
small.forEach(f => console.log(`  ${f.name}: ${f.size} bytes`));

// Also check for files that are valid GIFs (start with GIF87a or GIF89a)
const invalid = files.filter(f => {
  const buf = Buffer.alloc(6);
  const fd = fs.openSync(path.join(gifsDir, f), 'r');
  fs.readSync(fd, buf, 0, 6, 0);
  fs.closeSync(fd);
  const header = buf.toString('ascii');
  return !header.startsWith('GIF');
});

console.log(`\nInvalid GIF headers: ${invalid.length}`);
if (invalid.length > 0) {
  invalid.slice(0, 20).forEach(f => console.log(`  ${f}`));
}
