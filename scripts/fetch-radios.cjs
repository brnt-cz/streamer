const https = require('https');
const http = require('http');
const fs = require('fs');

function fetch(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('Fetching radio list...');

  // 1. Get list of radios from HTML
  const html = await fetch('https://api.play.cz/player/');
  const regex = /<li data-id="([^"]+)" data-type="([^"]*)">.*?<img src="([^"]+)" title="([^"]+)".*?<\/li>/gs;

  const radios = [];
  let match;
  while ((match = regex.exec(html)) !== null) {
    radios.push({
      id: match[1],
      name: match[4],
      logo: match[3],
      categories: match[2].split(',').filter(c => c.trim())
    });
  }

  console.log(`Found ${radios.length} radios`);

  // 2. For each radio, get available streams and their URLs
  const result = [];

  for (let i = 0; i < radios.length; i++) {
    const radio = radios[i];
    console.log(`[${i + 1}/${radios.length}] Processing ${radio.name}...`);

    try {
      // Get available streams
      const streamsData = await fetch(`https://api.play.cz/json/getAllStreams/${radio.id}`);
      const streamsJson = JSON.parse(streamsData);
      const availableStreams = streamsJson.data?.streams || {};

      const streams = {};

      // For each format and bitrate, get the actual stream URL
      for (const format of Object.keys(availableStreams)) {
        const bitrates = availableStreams[format];
        if (!bitrates || !bitrates.length) continue;

        streams[format] = {};

        for (const bitrate of bitrates) {
          try {
            const streamData = await fetch(`https://api.play.cz/json/getStream/${radio.id}/${format}/${bitrate}`);
            const streamJson = JSON.parse(streamData);

            if (streamJson.redir) {
              streams[format][bitrate] = streamJson.redir;
              console.log(`  - ${format}/${bitrate}: ${streamJson.redir}`);
            }
          } catch (e) {
            console.log(`  - ${format}/${bitrate}: ERROR`);
          }

          await sleep(100); // Rate limiting
        }
      }

      result.push({
        id: radio.id,
        name: radio.name,
        logo: radio.logo,
        categories: radio.categories,
        streams
      });

    } catch (e) {
      console.log(`  ERROR: ${e.message}`);
      result.push({
        id: radio.id,
        name: radio.name,
        logo: radio.logo,
        categories: radio.categories,
        streams: {}
      });
    }

    await sleep(200); // Rate limiting between radios
  }

  // 3. Save to JSON
  const outputPath = './src/data/radios.json';
  fs.mkdirSync('./src/data', { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));

  console.log(`\nDone! Saved ${result.length} radios to ${outputPath}`);
}

main().catch(console.error);
