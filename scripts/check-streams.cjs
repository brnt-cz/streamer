/**
 * Ověří, že streamy v src/data/*.json ještě hrají.
 *
 * Stanice odcházejí průběžně — při jedné aktualizaci dat jich 6 najednou
 * přestalo existovat. Tenhle skript je najde dřív než uživatel.
 *
 *   node scripts/check-streams.cjs             # report do konzole
 *   node scripts/check-streams.cjs --json out.json
 *   node scripts/check-streams.cjs --only-intl
 *
 * Návratový kód 1, když je něco mrtvé — ať se to dá pověsit do CI.
 */
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const UA = 'brnt-streamer/1.0 (stream checker)';
const NEED_BYTES = 32000;      // dost na to, aby bylo jisté, že data opravdu tečou
const TIMEOUT_MS = 10000;
const CONCURRENCY = 5;
const MAX_REDIRECTS = 4;

const DATA_FILES = [
  path.join(__dirname, '../src/data/radios.json'),
  path.join(__dirname, '../src/data/radios-international.json')
];

function probe(url, redirects = 0) {
  return new Promise((resolve) => {
    if (redirects > MAX_REDIRECTS) return resolve({ ok: false, why: 'too-many-redirects' });

    const client = url.startsWith('https') ? https : http;
    let req;
    const done = (result) => {
      try { req.destroy(); } catch { /* už zavřené */ }
      resolve(result);
    };

    try {
      req = client.get(url, { headers: { 'User-Agent': UA }, timeout: TIMEOUT_MS }, (res) => {
        const location = res.headers.location;
        if (res.statusCode >= 300 && res.statusCode < 400 && location) {
          res.destroy();
          return resolve(probe(new URL(location, url).href, redirects + 1));
        }
        if (res.statusCode !== 200) return done({ ok: false, why: `http-${res.statusCode}` });

        // Redirect z https na http rozbije stránku běžící přes https
        if (!url.startsWith('https')) return done({ ok: false, why: 'insecure-redirect' });

        let bytes = 0;
        res.on('data', (chunk) => {
          bytes += chunk.length;
          if (bytes >= NEED_BYTES) done({ ok: true, contentType: res.headers['content-type'] || '' });
        });
        res.on('end', () => done({ ok: false, why: `stream skončil po ${bytes} B` }));
        res.on('error', () => done({ ok: false, why: 'stream-error' }));
      });
      req.on('timeout', () => done({ ok: false, why: 'timeout' }));
      req.on('error', (e) => done({ ok: false, why: e.code || e.message }));
    } catch {
      resolve({ ok: false, why: 'bad-url' });
    }
  });
}

function collectJobs(onlyIntl) {
  const files = onlyIntl ? DATA_FILES.slice(1) : DATA_FILES;
  const jobs = [];

  files.forEach((file) => {
    JSON.parse(fs.readFileSync(file, 'utf8')).forEach((radio) => {
      Object.entries(radio.streams).forEach(([format, bitrates]) => {
        Object.entries(bitrates).forEach(([bitrate, url]) => {
          jobs.push({ file: path.basename(file), radio, format, bitrate, url });
        });
      });
    });
  });

  return jobs;
}

async function runPool(jobs, worker) {
  let index = 0;
  const runners = Array.from({ length: CONCURRENCY }, async () => {
    while (index < jobs.length) {
      await worker(jobs[index++]);
    }
  });
  await Promise.all(runners);
}

async function main() {
  const onlyIntl = process.argv.includes('--only-intl');
  const jsonIndex = process.argv.indexOf('--json');
  const jsonPath = jsonIndex !== -1 ? process.argv[jsonIndex + 1] : null;

  const jobs = collectJobs(onlyIntl);
  const stations = new Set(jobs.map((j) => j.radio.id));
  console.log(`Ověřuji ${jobs.length} streamů u ${stations.size} stanic...\n`);

  const results = [];
  await runPool(jobs, async (job) => {
    const result = await probe(job.url);
    results.push({ ...job, ...result });
    process.stdout.write(result.ok ? '.' : 'x');
  });
  console.log('\n');

  const dead = results.filter((r) => !r.ok);
  const deadByStation = new Map();
  dead.forEach((r) => {
    if (!deadByStation.has(r.radio.id)) deadByStation.set(r.radio.id, []);
    deadByStation.get(r.radio.id).push(r);
  });

  // stanice, které nemají ani jeden živý stream, jsou pro uživatele mrtvé
  const totallyDead = [...deadByStation.entries()].filter(([id]) => {
    const all = results.filter((r) => r.radio.id === id);
    return all.every((r) => !r.ok);
  });

  if (!dead.length) {
    console.log(`✅ Všech ${jobs.length} streamů hraje.`);
  } else {
    console.log(`Mrtvých streamů: ${dead.length} / ${jobs.length}`);
    dead.forEach((r) => console.log(`  ${r.radio.id.padEnd(24)} ${r.format}/${r.bitrate.padStart(3)}  ${r.why}`));

    if (totallyDead.length) {
      console.log(`\n⚠️  Stanic bez jediného živého streamu: ${totallyDead.length}`);
      totallyDead.forEach(([id, entries]) => console.log(`  ${id} — ${entries[0].radio.name} (${entries[0].file})`));
    }
  }

  if (jsonPath) {
    const report = results.map(({ radio, file, format, bitrate, url, ok, why }) => ({
      id: radio.id, name: radio.name, file, format, bitrate, url, ok, why: why || null
    }));
    fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
    console.log(`\nReport uložen do ${jsonPath}`);
  }

  process.exitCode = dead.length ? 1 : 0;
}

main();
