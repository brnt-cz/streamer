const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const sharp = require('sharp');

const LOGOS_DIR = path.join(__dirname, '../public/logos');
const SIZE = 100;

// Ensure logos directory exists
if (!fs.existsSync(LOGOS_DIR)) {
  fs.mkdirSync(LOGOS_DIR, { recursive: true });
}

function download(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;

    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    };

    protocol.get(url, options, (response) => {
      // Handle redirects
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        return download(response.headers.location).then(resolve).catch(reject);
      }

      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode} for ${url}`));
        return;
      }

      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    }).on('error', reject);
  });
}

async function processLogo(id, logoUrl) {
  const outputPath = path.join(LOGOS_DIR, `${id}.png`);

  // Skip if already exists
  if (fs.existsSync(outputPath)) {
    console.log(`  ✓ ${id} (cached)`);
    return true;
  }

  try {
    console.log(`  ↓ ${id}...`);
    const buffer = await download(logoUrl);

    await sharp(buffer)
      .resize(SIZE, SIZE, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .png()
      .toFile(outputPath);

    console.log(`  ✓ ${id}`);
    return true;
  } catch (error) {
    console.error(`  ✗ ${id}: ${error.message}`);
    return false;
  }
}

async function main() {
  // Load both JSON files
  const radiosPath = path.join(__dirname, '../src/data/radios.json');
  const intlPath = path.join(__dirname, '../src/data/radios-international.json');

  const radios = JSON.parse(fs.readFileSync(radiosPath, 'utf8'));
  const intlRadios = JSON.parse(fs.readFileSync(intlPath, 'utf8'));

  console.log(`\nProcessing ${radios.length} Czech radios...`);
  let czechSuccess = 0;
  for (const radio of radios) {
    if (await processLogo(radio.id, radio.logo)) {
      czechSuccess++;
    }
  }

  console.log(`\nProcessing ${intlRadios.length} international radios...`);
  let intlSuccess = 0;
  for (const radio of intlRadios) {
    if (await processLogo(radio.id, radio.logo)) {
      intlSuccess++;
    }
  }

  console.log(`\n✅ Done! Downloaded ${czechSuccess}/${radios.length} Czech + ${intlSuccess}/${intlRadios.length} international logos`);
  console.log(`📁 Saved to: ${LOGOS_DIR}`);
}

main().catch(console.error);
