const fs = require('fs');
const path = require('path');

const exercises = JSON.parse(fs.readFileSync('./src/assets/exercises.json', 'utf8'));
const gifsDir = './src/assets/gifs';

const remoteUrls = exercises.filter(e => !e.gifUrl.startsWith('assets/'));
const localUrls = exercises.filter(e => e.gifUrl.startsWith('assets/'));

console.log(`Total exercises: ${exercises.length}`);
console.log(`Remote URLs: ${remoteUrls.length}`);
console.log(`Local URLs: ${localUrls.length}`);

if (remoteUrls.length > 0) {
  console.log('\nExercises with remote URLs (first 10):');
  remoteUrls.slice(0, 10).forEach(e => console.log(`  ${e.exerciseId}: ${e.gifUrl}`));
}

// Check which local GIF files are missing
const missingGifs = localUrls.filter(e => {
  const localPath = path.join(gifsDir, `${e.exerciseId}.gif`);
  return !fs.existsSync(localPath);
});

console.log(`\nMissing GIF files: ${missingGifs.length}`);
if (missingGifs.length > 0) {
  console.log('First 20 missing:');
  missingGifs.slice(0, 20).forEach(e => console.log(`  ${e.exerciseId}: ${e.name}`));

  // Save full list
  fs.writeFileSync('./missing-gifs.json', JSON.stringify(missingGifs.map(e => e.exerciseId), null, 2));
  console.log('\nFull list saved to missing-gifs.json');
}
