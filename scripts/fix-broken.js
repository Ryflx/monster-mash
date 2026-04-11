// Fix the 24 broken workouts by re-scraping their source pages
// and properly parsing the segment structure.
// Usage: node scripts/fix-broken.js

import { load } from 'cheerio';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_FILE = join(__dirname, '../src/data/workouts.json');
const DELAY_MS = 800;

function lbsToKg(lbs) {
  return Math.round(lbs * 0.453592 * 2) / 2;
}

function convertWeightsInText(text) {
  return text.replace(/\b(\d{2,3})'?s?\s*\/\s*(\d{2,3})'?s?(?!\d)/g, (match, m, f) => {
    const mLbs = parseInt(m);
    const fLbs = parseInt(f);
    if (mLbs > fLbs && mLbs <= 500 && fLbs >= 15 && (mLbs - fLbs) >= 5) {
      return `${lbsToKg(mLbs)}/${lbsToKg(fLbs)}kg`;
    }
    return match;
  });
}

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
  ['Pistol', 'Pistol Squat'],
  ['Thruster', 'Thruster'],
  ['Wall Ball', 'Wall Ball'],
  ['Deadlift', 'Deadlift'],
  ['Sumo Deadlift', 'Sumo Deadlift'],
  ['Bench Press', 'Bench Press'],
  ['Strict Press', 'Strict Press'],
  ['Push Press', 'Push Press'],
  ['Push Jerk', 'Push Jerk'],
  ['Split Jerk', 'Split Jerk'],
  ['Shoulder.to.Overhead', 'Shoulder-to-Overhead'],
  ['Shoulder to Overhead', 'Shoulder-to-Overhead'],
  ['S2OH', 'Shoulder-to-Overhead'],
  ['Ground.to.Overhead', 'Ground-to-Overhead'],
  ['Ground to Overhead', 'Ground-to-Overhead'],
  ['GTO', 'Ground-to-Overhead'],
  ['Snatch', 'Snatch'],
  ['Clean', 'Clean'],
  ['Jerk', 'Jerk'],
  ['Pull-up', 'Pull-Up'],
  ['Pullup', 'Pull-Up'],
  ['Chest.to.Bar', 'Chest-to-Bar Pull-Up'],
  ['C2B', 'Chest-to-Bar Pull-Up'],
  ['Muscle-up', 'Muscle-Up'],
  ['Ring Muscle', 'Ring Muscle-Up'],
  ['Bar Muscle', 'Bar Muscle-Up'],
  ['Toes.to.Bar', 'Toes-to-Bar'],
  ['T2B', 'Toes-to-Bar'],
  ['Knees.to.Elbow', 'Knees-to-Elbows'],
  ['K2E', 'Knees-to-Elbows'],
  ['GHD Sit', 'GHD Sit-Up'],
  ['Sit-up', 'Sit-Up'],
  ['V-up', 'V-Up'],
  ['Handstand Push', 'Handstand Push-Up'],
  ['HSPU', 'Handstand Push-Up'],
  ['Handstand Walk', 'Handstand Walk'],
  ['HS Walk', 'Handstand Walk'],
  ['HSW', 'Handstand Walk'],
  ['Push-up', 'Push-Up'],
  ['Pushup', 'Push-Up'],
  ['Dip', 'Dip'],
  ['Ring Dip', 'Ring Dip'],
  ['Rope Climb', 'Rope Climb'],
  ['Legless Rope', 'Legless Rope Climb'],
  ['Peg Board', 'Peg Board'],
  ['Box Jump', 'Box Jump'],
  ['Box Step', 'Box Step-Up'],
  ['Burpee', 'Burpee'],
  ['Double-under', 'Double-Under'],
  ['Double Under', 'Double-Under'],
  ['DU', 'Double-Under'],
  ['Single-under', 'Single-Under'],
  ['Jump Rope', 'Jump Rope'],
  ['Lunge', 'Lunge'],
  ['Walking Lunge', 'Walking Lunge'],
  ['Farmer', 'Farmer\'s Carry'],
  ['Kettlebell Swing', 'Kettlebell Swing'],
  ['KB Swing', 'Kettlebell Swing'],
  ['Turkish Get', 'Turkish Get-Up'],
  ['Row', 'Row'],
  ['Run', 'Run'],
  ['Bike', 'Bike'],
  ['Ski Erg', 'Ski Erg'],
  ['Sled', 'Sled'],
  ['Swim', 'Swim'],
];

function extractMovements(text) {
  const found = new Set();
  const upper = text.toUpperCase();
  for (const [pattern, canonical] of MOVEMENTS_LIST) {
    if (upper.includes(pattern.toUpperCase())) {
      found.add(canonical);
    }
  }
  return [...found];
}

// Parse the .rte HTML into proper segments
function parseRteHtml($, rteEl, workoutDate) {
  const segments = [];

  // Get the HTML, replace <br> with \n, then work with structure
  const html = $(rteEl).html() || '';

  // Strategy: walk through child elements, grouping by time markers
  // Time markers: <p><strong>Start at X:XX</strong></p> or <p><strong>Begin at X:XX</strong></p>
  // Date headers: <p><strong>Month DD, YYYY</strong></p>
  // Format lines: "X Rounds for time:", "AMRAP X min:", "For time:", etc.
  // Movement lists: <ul><li>...</li></ul>

  let currentSegmentLines = [];
  let currentFormat = 'Workout';
  let currentMovements = [];
  let skipDateHeader = true; // skip first date header

  const children = $(rteEl).children();

  function flushSegment() {
    const desc = currentSegmentLines.join('\n').trim();
    if (desc && desc.length > 2) {
      // Detect format from description
      let format = currentFormat;
      const lower = desc.toLowerCase();
      if (/amrap\s+\d+/.test(lower)) {
        const m = lower.match(/amrap\s+(\d+)/);
        format = `AMRAP ${m[1]} min`;
      } else if (/(\d+)\s+rounds?\s+for\s+time/.test(lower)) {
        const m = lower.match(/(\d+)\s+rounds?\s+for\s+time/);
        format = `${m[1]} Rounds for time`;
      } else if (/for\s+time/.test(lower)) {
        format = 'For time';
      } else if (/every\s+\d+\s+min/.test(lower) || /emom/.test(lower) || /every.*minute/.test(lower)) {
        format = 'EMOM';
      } else if (/death\s+by/.test(lower)) {
        format = 'Death by';
      } else if (/rest\s+\d+\s+min/.test(lower) || /^\*?rest\b/.test(lower)) {
        format = 'Rest period';
      }

      const converted = convertWeightsInText(desc);
      const mvs = extractMovements(converted);

      segments.push({
        format,
        description: converted,
        movements: mvs.map(name => ({ name })),
      });
    }
    currentSegmentLines = [];
    currentFormat = 'Workout';
    currentMovements = [];
  }

  children.each((i, el) => {
    const tag = el.tagName?.toLowerCase();
    const $el = $(el);

    if (tag === 'p') {
      const text = $el.text().trim();
      if (!text || text === '\u00a0' || text === '&nbsp;') return; // skip empty

      // Check if it's a date header (e.g., "Sept 15, 2014", "11.24.14 | Monster Mash")
      const isDate = /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(text) ||
                     /^\d{1,2}\.\d{1,2}\.\d{2,4}/.test(text);
      if (isDate) {
        flushSegment(); // end previous segment
        return; // skip the date line
      }

      // Check if it's a time marker (Start at/Begin at)
      const isTimeMarker = /^(start|begin)\s+at\s+\d+:\d+/i.test(text);
      if (isTimeMarker) {
        flushSegment(); // new segment starts
        return; // skip the time marker itself
      }

      // Check for pagination garbage
      if (/^←.*→$/.test(text) || /^\d+\s+…\s+\d+/.test(text)) return;

      // It's content — add to current segment
      currentSegmentLines.push(text);
    } else if (tag === 'ul' || tag === 'ol') {
      // Movement list items
      $el.find('li').each((j, li) => {
        const liText = $(li).text().trim();
        if (liText) currentSegmentLines.push(liText);
      });
    } else if (tag === 'hr') {
      flushSegment();
    }
  });

  flushSegment(); // flush last segment

  return segments;
}

async function main() {
  const data = JSON.parse(readFileSync(DATA_FILE, 'utf8'));

  // Find broken workouts
  const broken = data.filter(w => {
    const badSegs = w.segments.filter(s =>
      s.format === 'Workout' && s.movements.length === 0 && s.description.length < 30
    );
    return badSegs.length > 2;
  });

  console.log(`Found ${broken.length} broken workouts to fix`);

  for (const workout of broken) {
    console.log(`Fetching ${workout.title} from ${workout.sourceUrl}`);
    try {
      const res = await fetch(workout.sourceUrl);
      const html = await res.text();
      const $ = load(html);
      const rte = $('.rte').first();

      if (!rte.length) {
        console.log(`  WARN: No .rte element found, skipping`);
        continue;
      }

      const segments = parseRteHtml($, rte, workout.date);

      if (segments.length === 0) {
        console.log(`  WARN: Parsed 0 segments, skipping`);
        continue;
      }

      // Extract all movements
      const allMovements = new Set();
      const fullText = segments.map(s => s.description).join('\n');
      extractMovements(fullText).forEach(m => allMovements.add(m));

      // Update the workout in the data array
      const idx = data.findIndex(w => w.id === workout.id);
      data[idx].segments = segments;
      data[idx].movements = [...allMovements];

      console.log(`  Fixed: ${segments.length} segments, ${allMovements.size} movements`);
    } catch (err) {
      console.log(`  ERROR: ${err.message}`);
    }

    await new Promise(r => setTimeout(r, DELAY_MS));
  }

  writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  console.log(`\nDone. Updated ${DATA_FILE}`);
}

main();
