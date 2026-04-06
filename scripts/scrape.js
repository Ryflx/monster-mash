// Monster Mash workout scraper
// Usage: node scripts/scrape.js
// Output: src/data/workouts.json
// Structure: h2 > a (date/title) | div.rte (content) | hr.hr--clear (separator)

import { load } from 'cheerio';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE_URL = 'https://crossfitlinchpin.com/blogs/monster-mash';
const TOTAL_PAGES = 126;
const OUTPUT = join(__dirname, '../src/data/workouts.json');
const DELAY_MS = 700;

// ─── Weight conversion ────────────────────────────────────────────────────────

function lbsToKg(lbs) {
  return Math.round(lbs * 0.453592 * 2) / 2;
}

// Convert "275/185" → "125/84kg", "50's/35's" → "23/16kg"
// Only converts plausible lb pairs (heavier/lighter, both in range)
function convertWeightsInText(text) {
  // \b(\d{2,3}) — word-boundary + 2-3 digit number
  // (?!\d) — ensure second number isn't followed by more digits (avoids "55400" greedy match)
  return text.replace(/\b(\d{2,3})'?s?\s*\/\s*(\d{2,3})'?s?(?!\d)/g, (match, m, f) => {
    const mLbs = parseInt(m);
    const fLbs = parseInt(f);
    if (mLbs > fLbs && mLbs <= 500 && fLbs >= 15 && (mLbs - fLbs) >= 5) {
      return `${lbsToKg(mLbs)}/${lbsToKg(fLbs)}kg`;
    }
    return match;
  });
}

// ─── Movement extraction ──────────────────────────────────────────────────────

// Order matters: longer/more-specific first
const MOVEMENTS_LIST = [
  ['Hang Power Clean', 'Hang Power Clean'],
  ['Hang Squat Clean', 'Hang Squat Clean'],
  ['Power Clean', 'Power Clean'],
  ['Squat Clean', 'Squat Clean'],
  ['Clean & Jerk', 'Clean & Jerk'],
  ['Clean and Jerk', 'Clean & Jerk'],
  ['Squat Snatch', 'Squat Snatch'],
  ['Power Snatch', 'Power Snatch'],
  ['Overhead Squat', 'Overhead Squat'],
  ['Front Squat', 'Front Squat'],
  ['Back Squat', 'Back Squat'],
  ['Air Squat', 'Air Squat'],
  ['Romanian Deadlift', 'Romanian Deadlift'],
  ['Sumo Deadlift', 'Sumo Deadlift'],
  ['Deadlift', 'Deadlift'],
  ['Shoulder-to-Overhead', 'Shoulder-to-Overhead'],
  ['Shoulder to Overhead', 'Shoulder-to-Overhead'],
  ['S2OH', 'Shoulder-to-Overhead'],
  ['Handstand Push-Up', 'Handstand Push-Up'],
  ['Handstand Push Up', 'Handstand Push-Up'],
  ['HSPU', 'Handstand Push-Up'],
  ['Handstand Walk', 'Handstand Walk'],
  ['Push Jerk', 'Push Jerk'],
  ['Split Jerk', 'Split Jerk'],
  ['Push Press', 'Push Press'],
  ['Strict Press', 'Strict Press'],
  ['Thruster', 'Thruster'],
  ['Bench Press', 'Bench Press'],
  ['Ring Muscle-Up', 'Ring Muscle-Up'],
  ['Ring Muscle Up', 'Ring Muscle-Up'],
  ['Bar Muscle-Up', 'Bar Muscle-Up'],
  ['Bar Muscle Up', 'Bar Muscle-Up'],
  ['Muscle-Up', 'Muscle-Up'],
  ['Muscle Up', 'Muscle-Up'],
  ['Chest-to-Bar', 'Chest-to-Bar'],
  ['Chest to Bar', 'Chest-to-Bar'],
  ['Strict Pull-Up', 'Strict Pull-Up'],
  ['Pull-Up', 'Pull-Up'],
  ['Pull Up', 'Pull-Up'],
  ['Ring Dip', 'Ring Dip'],
  ['Ring Row', 'Ring Row'],
  ['Toes-to-Bar', 'Toes-to-Bar'],
  ['Toes to Bar', 'Toes-to-Bar'],
  ['GHD Sit-Up', 'GHD Sit-Up'],
  ['GHD Situp', 'GHD Sit-Up'],
  ['Sit-Up', 'Sit-Up'],
  ['Situp', 'Sit-Up'],
  ['V-Up', 'V-Up'],
  ['Push-Up', 'Push-Up'],
  ['Push Up', 'Push-Up'],
  ['L-Sit', 'L-Sit'],
  ['L-sit', 'L-Sit'],
  ['Legless Rope Climb', 'Legless Rope Climb'],
  ['Rope Climb', 'Rope Climb'],
  ['Lateral Burpee', 'Lateral Burpee'],
  ['Burpee', 'Burpee'],
  ['Double-Under', 'Double-Under'],
  ['Double Under', 'Double-Under'],
  ['Russian Kettlebell Swing', 'Russian KB Swing'],
  ['American Kettlebell Swing', 'American KB Swing'],
  ['Kettlebell Swing', 'KB Swing'],
  ['Wall Ball', 'Wall Ball'],
  ['Wallball', 'Wall Ball'],
  ['Box Jump', 'Box Jump'],
  ['Assault Bike', 'Assault Bike'],
  ['Echo Bike', 'Echo Bike'],
  ['Air Bike', 'Air Bike'],
  ['Ski Erg', 'Ski Erg'],
  ['Walking Lunge', 'Walking Lunge'],
  ['Front Rack Lunge', 'Front Rack Lunge'],
  ['Lunge', 'Lunge'],
  ["Farmer's Carry", "Farmer's Carry"],
  ['Farmer Carry', "Farmer's Carry"],
  ['Suitcase Carry', 'Suitcase Carry'],
  ['Pistol Squat', 'Pistol'],
  ['Pistol', 'Pistol'],
  ['Sprint', 'Sprint'],
  ['Run', 'Run'],
  ['Row', 'Row'],
  ['Dip', 'Dip'],
  ['Snatch', 'Snatch'],
  ['Clean', 'Clean'],
  ['Jerk', 'Jerk'],
];

function extractMovements(text) {
  const lower = text.toLowerCase();
  const found = new Map();
  for (const [keyword, canonical] of MOVEMENTS_LIST) {
    if (lower.includes(keyword.toLowerCase())) {
      found.set(canonical, canonical);
    }
  }
  return Array.from(found.values());
}

// ─── Date / title parsing ─────────────────────────────────────────────────────

function parseDate(raw) {
  const m = raw.match(/(\d{2})\.(\d{2})\.(\d{2,4})/);
  if (!m) return null;
  let [, month, day, year] = m;
  if (year.length === 2) year = parseInt(year) > 50 ? `19${year}` : `20${year}`;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

function parseTitle(rteText) {
  // First line is often the workout name: "Linchpin Test 10", "Nasty Girls", etc.
  const firstLine = rteText.split('\n')[0]?.trim() || '';
  // Named workouts in quotes
  const quoted = rteText.match(/[""']([^""'\n]{3,35})[""']/);
  if (quoted) return quoted[1];
  // Linchpin Test N
  const linchpin = firstLine.match(/Linchpin\s+Test\s+\d+/i);
  if (linchpin) return linchpin[0];
  // First meaningful non-empty line (not a rep scheme)
  const lines = rteText.split('\n').map(l => l.trim()).filter(Boolean);
  const named = lines.find(l =>
    l.length > 3 && l.length < 40 &&
    !/^\d/.test(l) &&
    !/for time|amrap|rounds|rest|dumbbell/i.test(l)
  );
  if (named) return named;
  return 'Monster Mash';
}

function detectFormat(text) {
  const amrap = text.match(/amrap\s+(\d+)/i);
  if (amrap) return `AMRAP ${amrap[1]} min`;
  const rounds = text.match(/(\d+)\s+rounds?\s+for\s+time/i);
  if (rounds) return `${rounds[1]} Rounds for time`;
  const descending = text.match(/(\d+)-(\d+)-(\d+)\s+reps?\s+for\s+time/i);
  if (descending) return 'Descending reps for time';
  if (/for\s+time/i.test(text)) return 'For time';
  if (/rest/i.test(text)) return 'Rest period';
  return 'Workout';
}

// ─── Fetch ────────────────────────────────────────────────────────────────────

async function fetchUrl(url, retries = 3) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
      redirect: 'follow',
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } catch (err) {
    if (retries > 0) { await sleep(2000); return fetchUrl(url, retries - 1); }
    throw err;
  }
}

// ─── Parse page ───────────────────────────────────────────────────────────────

function parsePage(html, pageNum) {
  const $ = load(html);
  const container = $('.page-width.page-container, .main-content');
  const workouts = [];

  // Each workout: h2 (with date) + div.rte (content), separated by hr
  const h2s = container.find('h2');

  h2s.each((_, h2el) => {
    try {
      const h2 = $(h2el);
      const linkEl = h2.find('a');
      const dateText = linkEl.text().trim() || h2.text().trim();
      const dateStr = parseDate(dateText);
      if (!dateStr) return;

      const href = linkEl.attr('href') || '';
      const sourceUrl = href
        ? `https://crossfitlinchpin.com${href}`
        : `https://crossfitlinchpin.com/blogs/monster-mash?page=${pageNum}`;

      // The rte div immediately follows the h2
      const rteDiv = h2.next('div.rte, div[class*="rte"]');
      if (!rteDiv.length) return;

      const fullText = (rteDiv.html() || '')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
      if (!fullText || fullText.length < 20) return;

      // Split barbell / dumbbell sections
      const dbMatch = fullText.search(/or,?\s+for\s+a\s+dumbbell\s+version/i);
      const barbellText = dbMatch > -1 ? fullText.slice(0, dbMatch) : fullText;
      const dumbbellText = dbMatch > -1 ? fullText.slice(dbMatch) : null;

      // Build segments from paragraphs in the rte div
      const segments = [];
      const dumbbellSegments = [];
      let inDumbbell = false;

      rteDiv.find('p').each((_, p) => {
        // Preserve <br> as newlines before stripping other tags
        const pHtml = $(p).html() || '';
        const raw = pHtml
          .replace(/<br\s*\/?>/gi, '\n')
          .replace(/<[^>]+>/g, '')
          .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
          .trim();
        if (!raw || raw.length < 10) return;
        if (/or,?\s+for\s+a\s+dumbbell\s+version/i.test(raw)) { inDumbbell = true; return; }
        // Skip promo text
        if (/private\s+track|30-day\s+free\s+trial|want\s+a\s+|linchpin\.com|@linchpin|warm-?up|post\s+your\s+time/i.test(raw)) return;

        const converted = convertWeightsInText(raw);
        const seg = { format: detectFormat(raw), description: converted, movements: [] };
        if (inDumbbell) dumbbellSegments.push(seg);
        else segments.push(seg);
      });

      if (segments.length === 0 && dumbbellSegments.length === 0) {
        // Fallback: use raw text split by blank lines
        const blocks = barbellText.split(/\n{2,}/).map(b => b.trim()).filter(b => b.length > 10);
        for (const b of blocks) {
          if (/private\s+track|warm-?up|post\s+your/i.test(b)) continue;
          segments.push({ format: detectFormat(b), description: convertWeightsInText(b), movements: [] });
        }
      }

      const title = parseTitle(barbellText);
      const movements = extractMovements(barbellText + (dumbbellText || ''));
      const safeTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 24);
      const id = `${dateStr}-${safeTitle}`;

      workouts.push({
        id,
        date: dateStr,
        title,
        segments: segments.filter(s => s.description.length > 5),
        dumbbell: dumbbellSegments.length > 0 ? dumbbellSegments.filter(s => s.description.length > 5) : undefined,
        movements,
        sourceUrl,
      });
    } catch {
      // skip malformed
    }
  });

  return workouts;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function scrape() {
  console.log(`Monster Mash Scraper — ${TOTAL_PAGES} pages\n`);
  const all = [];
  const seen = new Set();
  let errors = 0;

  for (let page = 1; page <= TOTAL_PAGES; page++) {
    const url = page === 1 ? BASE_URL : `${BASE_URL}?page=${page}`;
    process.stdout.write(`\rPage ${page}/${TOTAL_PAGES} | Found: ${all.length} workouts  `);

    try {
      const html = await fetchUrl(url);
      const workouts = parsePage(html, page);
      for (const w of workouts) {
        if (!seen.has(w.id)) { seen.add(w.id); all.push(w); }
      }
    } catch (err) {
      errors++;
      process.stdout.write(` [ERR p${page}: ${err.message.slice(0, 30)}]`);
    }

    if (page < TOTAL_PAGES) await sleep(DELAY_MS);
  }

  all.sort((a, b) => b.date.localeCompare(a.date));
  writeFileSync(OUTPUT, JSON.stringify(all, null, 2));
  console.log(`\n\n✓ Done: ${all.length} workouts saved → src/data/workouts.json`);
  if (errors) console.log(`  ${errors} pages had errors`);
}

scrape().catch(err => { console.error('Fatal:', err); process.exit(1); });
