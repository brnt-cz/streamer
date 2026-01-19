const fs = require('fs');
const path = require('path');

function updateLogoPaths(jsonPath) {
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  for (const radio of data) {
    radio.logo = `/logos/${radio.id}.png`;
  }

  fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2) + '\n');
  console.log(`Updated ${data.length} entries in ${path.basename(jsonPath)}`);
}

const radiosPath = path.join(__dirname, '../src/data/radios.json');
const intlPath = path.join(__dirname, '../src/data/radios-international.json');

updateLogoPaths(radiosPath);
updateLogoPaths(intlPath);

console.log('Done!');
