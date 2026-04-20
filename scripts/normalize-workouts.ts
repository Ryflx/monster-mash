/**
 * Normalize Monster Mash workout data using Claude.
 *
 * Monster Mash WODs always have 3 parts with 5 min rest between. This script
 * finds workouts that don't match that shape and uses Claude to infer the
 * correct {format, description} for each part.
 *
 * Usage:
 *   # 1. See what's broken — no API calls, no file writes:
 *   ANTHROPIC_API_KEY=sk-... npx tsx scripts/normalize-workouts.ts --detect
 *
 *   # 2. Ask Claude to normalize each flagged workout. Writes one JSON per
 *   #    workout to scripts/normalized/ so you can eyeball before applying:
 *   npx tsx scripts/normalize-workouts.ts --normalize
 *   npx tsx scripts/normalize-workouts.ts --normalize --ids 2015-11-16-monster-mash
 *   npx tsx scripts/normalize-workouts.ts --normalize --limit 5
 *
 *   # 3. Merge normalized results back into workouts.json:
 *   npx tsx scripts/normalize-workouts.ts --apply
 *
 *   # 4. Push the updated JSON to Neon:
 *   npm run db:sync
 */

import { config } from 'dotenv';
config({ path: '.env.local', override: true });

import fs from 'node:fs';
import path from 'node:path';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

const WORKOUTS_PATH = path.join(process.cwd(), 'src', 'data', 'workouts.json');
const NORMALIZED_DIR = path.join(process.cwd(), 'scripts', 'normalized');
const DEFAULT_MODEL = 'claude-sonnet-4-6';

// ─── Types ──────────────────────────────────────────────────────────────

type Movement = {
  name: string;
  reps?: string;
  weightKg?: { male: number; female: number };
  weightOriginal?: string;
  equipment?: string;
};

type Segment = {
  format: string;
  description: string;
  movements: Movement[];
};

type Workout = {
  id: string;
  date: string;
  title: string;
  segments: Segment[];
  movements: string[];
  sourceUrl: string;
};

const NormalizedPart = z.object({
  format: z.string().describe('e.g. "For time", "AMRAP 8 min", "5 Rounds for time", "E2MOM 10 min"'),
  description: z.string().describe('The prescribed work for this part only. No format header line, no rest notes. Preserve original weights, reps, and movement names verbatim.'),
});

const NormalizedWorkout = z.object({
  title: z.string().describe('Short human title without the "MM #NNN — " prefix. If the original title is just "MM #NNN" with no descriptive name, infer a short descriptive name from the workout content (e.g. "Snatch & Wall Balls").'),
  parts: z.array(NormalizedPart).describe('Usually exactly 3 parts (Monster Mash WODs are 3 parts with 5 min rest between). Return fewer (1 or 2) ONLY if the source description truly contains fewer distinct workouts — do not invent parts. Never return more than 3.'),
  confidence: z.enum(['high', 'medium', 'low']).describe('high: source clearly contained 3 distinct parts with format headers. medium: some inference required. low: source incomplete or ambiguous — manual review recommended.'),
});

// ─── Detection ──────────────────────────────────────────────────────────

function isProblematic(w: Workout): { bad: boolean; reason: string } {
  const active = w.segments.filter((s) => s.format.toLowerCase() !== 'rest period');
  if (active.length !== 3) {
    return { bad: true, reason: `has ${active.length} active segment(s), expected 3` };
  }
  // Also flag when a single active segment smuggles multiple section headers in its description
  for (const s of active) {
    const blocks = s.description.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
    const sectionHeaders = blocks.filter((b) => {
      if (/^\*?\s*rest\s/i.test(b)) return false;
      return b.split('\n')[0].trim().endsWith(':');
    }).length;
    if (sectionHeaders >= 2) {
      return { bad: true, reason: 'single segment contains multiple section headers' };
    }
  }
  return { bad: false, reason: '' };
}

function loadWorkouts(): Workout[] {
  return JSON.parse(fs.readFileSync(WORKOUTS_PATH, 'utf8'));
}

function detect(workouts: Workout[]) {
  const problems = workouts
    .map((w, idx) => ({ idx, w, ...isProblematic(w) }))
    .filter((x) => x.bad);

  console.log(`Scanned ${workouts.length} workouts`);
  console.log(`Flagged ${problems.length} as needing normalization\n`);

  for (const p of problems.slice(0, 20)) {
    console.log(`- ${p.w.id.padEnd(40)} (${p.w.title}) — ${p.reason}`);
  }
  if (problems.length > 20) {
    console.log(`  ... and ${problems.length - 20} more (use --normalize to process all)`);
  }
  return problems;
}

// ─── Normalization via Claude ───────────────────────────────────────────

const SYSTEM_PROMPT = `You normalize CrossFit "Monster Mash" workout data.

BACKGROUND: Monster Mash WODs are typically THREE parts, with 5 minutes of rest between each part. Most source descriptions contain 3 distinct workouts separated by blank lines, each starting with a format header like "For time:" or "AMRAP 8 min:" or "5 Rounds for time of:".

RULE: Count the DISTINCT workouts in the source description. Return that many parts — usually 3, sometimes fewer if the source genuinely only contains 1 or 2 workouts. DO NOT invent parts to reach 3. If the source only contains "Murph", return 1 part containing Murph, and mark confidence "low".

For each part, extract:
- format: the scheme header for that part. Examples: "For time", "AMRAP 8 min", "5 Rounds for time", "E2MOM 10 min", "Descending reps for time", "21-15-9 for time", "EMOM 12 min", "For quality". Use the exact phrasing from the workout when present. Do not wrap in quotes or add trailing punctuation.
- description: the prescribed work for THAT PART ONLY. Strip the format header line (e.g. remove "For time:" from the start). Strip any trailing rest note like "*Rest 5 minutes between workouts". Preserve:
  * exact movement names (e.g. "Hang Power Cleans", "Box Jumps, 24\\"/20\\"")
  * exact rep schemes ("21-15-9", "9", "1200m")
  * exact weights ("61/43kg", "20/14")
  * any named benchmarks or nicknames ("Isabel", "Fran")
  Do not add commentary, explanations, or units that aren't in the source.

For the title: produce a short descriptive name with no "MM #NNN — " prefix. If the source title has a descriptive name after the number, use it. If the source title is bare ("MM #85"), invent a concise name based on the defining movements (e.g. "Snatch, Wall Balls & Cleans").

Return only the structured JSON — no prose, no markdown.`;

function buildUserPrompt(w: Workout): string {
  const segmentsDump = w.segments
    .map((s, i) => `[Segment ${i + 1}] format="${s.format}"\n${s.description}`)
    .join('\n\n');

  return `Source workout:

id: ${w.id}
date: ${w.date}
title: ${w.title}
segments:
${segmentsDump}

Normalize this into exactly 3 parts.`;
}

async function normalizeOne(client: Anthropic, model: string, w: Workout) {
  const response = await client.messages.parse({
    model,
    max_tokens: 4000,
    thinking: { type: 'adaptive' },
    system: [
      { type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } },
    ],
    messages: [{ role: 'user', content: buildUserPrompt(w) }],
    output_config: { format: { type: 'json_schema', schema: z.toJSONSchema(NormalizedWorkout) } },
  });
  return {
    parsed: response.parsed_output as z.infer<typeof NormalizedWorkout> | null,
    usage: response.usage,
  };
}

async function normalize(opts: { ids?: string[]; limit?: number; model: string; concurrency: number; force: boolean }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY is not set in .env.local or shell.');
    process.exit(1);
  }

  fs.mkdirSync(NORMALIZED_DIR, { recursive: true });

  const workouts = loadWorkouts();
  const problems = workouts
    .map((w) => ({ w, ...isProblematic(w) }))
    .filter((x) => x.bad);

  let targets = problems;
  if (opts.ids?.length) targets = problems.filter((p) => opts.ids!.includes(p.w.id));

  // Skip already-processed unless --force
  if (!opts.force) {
    const existing = new Set(
      fs.readdirSync(NORMALIZED_DIR).filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, '')),
    );
    const before = targets.length;
    targets = targets.filter((p) => !existing.has(p.w.id));
    if (before !== targets.length) {
      console.log(`Resuming: ${before - targets.length} already done, ${targets.length} remaining`);
    }
  }

  if (opts.limit) targets = targets.slice(0, opts.limit);

  console.log(`Normalizing ${targets.length} workouts via ${opts.model} (concurrency=${opts.concurrency})...\n`);

  const client = new Anthropic({ apiKey });
  let totalCacheRead = 0;
  let totalInput = 0;
  let totalOutput = 0;
  let completed = 0;

  async function worker(p: typeof targets[number]) {
    try {
      const { parsed, usage } = await normalizeOne(client, opts.model, p.w);
      if (!parsed) {
        console.log(`[${++completed}/${targets.length}] ${p.w.id}: FAIL (no parsed_output)`);
        return;
      }
      totalCacheRead += usage.cache_read_input_tokens ?? 0;
      totalInput += usage.input_tokens;
      totalOutput += usage.output_tokens;

      const outPath = path.join(NORMALIZED_DIR, `${p.w.id}.json`);
      fs.writeFileSync(
        outPath,
        JSON.stringify({ originalTitle: p.w.title, reason: p.reason, normalized: parsed }, null, 2),
      );
      console.log(`[${++completed}/${targets.length}] ${p.w.id}: OK (${parsed.parts.length} parts, ${parsed.confidence})`);
    } catch (err) {
      console.log(`[${++completed}/${targets.length}] ${p.w.id}: ERROR ${(err as Error).message}`);
    }
  }

  // Simple concurrency pool
  const queue = [...targets];
  async function runPool() {
    while (queue.length) {
      const next = queue.shift()!;
      await worker(next);
    }
  }
  await Promise.all(Array.from({ length: opts.concurrency }, () => runPool()));

  console.log(`\nTotals: input=${totalInput} cached=${totalCacheRead} output=${totalOutput}`);
  console.log(`Review files in ${path.relative(process.cwd(), NORMALIZED_DIR)}/ then run --apply`);
}

// ─── Apply ──────────────────────────────────────────────────────────────

function apply() {
  const workouts = loadWorkouts();
  const byId = new Map(workouts.map((w) => [w.id, w]));

  const files = fs.existsSync(NORMALIZED_DIR)
    ? fs.readdirSync(NORMALIZED_DIR).filter((f) => f.endsWith('.json'))
    : [];
  if (!files.length) {
    console.error(`No files in ${NORMALIZED_DIR}/ — run --normalize first.`);
    process.exit(1);
  }

  let applied = 0;
  const skipped: string[] = [];
  for (const file of files) {
    const id = file.replace(/\.json$/, '');
    const w = byId.get(id);
    if (!w) {
      console.warn(`Skip ${id}: not found in workouts.json`);
      continue;
    }
    const payload = JSON.parse(fs.readFileSync(path.join(NORMALIZED_DIR, file), 'utf8'));
    const n = payload.normalized as z.infer<typeof NormalizedWorkout>;

    if (n.confidence === 'low') {
      skipped.push(`${id} (low confidence — review ${path.relative(process.cwd(), path.join(NORMALIZED_DIR, file))})`);
      continue;
    }

    // Preserve "MM #NNN" prefix for searchability; append the new descriptive name
    const hashMatch = w.title.match(/^(MM #\d+)/);
    const prefix = hashMatch ? hashMatch[1] : '';
    const newTitle = prefix ? `${prefix} — ${n.title}` : n.title;

    const newSegments: Segment[] = [];
    n.parts.forEach((part, idx) => {
      newSegments.push({ format: part.format, description: part.description, movements: [] });
      if (idx < n.parts.length - 1) {
        newSegments.push({
          format: 'Rest period',
          description: '*Rest 5 minutes between workouts',
          movements: [],
        });
      }
    });

    w.title = newTitle;
    w.segments = newSegments;
    applied++;
  }

  if (skipped.length) {
    console.log(`Skipped ${skipped.length} low-confidence results:`);
    for (const s of skipped) console.log(`  - ${s}`);
  }

  fs.writeFileSync(WORKOUTS_PATH, JSON.stringify(workouts, null, 2) + '\n');
  console.log(`Applied ${applied} normalized workouts to ${path.relative(process.cwd(), WORKOUTS_PATH)}`);
  console.log(`Next: npm run db:sync`);
}

// ─── CLI ────────────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  const has = (flag: string) => args.includes(flag);
  const value = (flag: string) => {
    const i = args.indexOf(flag);
    return i === -1 ? undefined : args[i + 1];
  };
  return {
    detect: has('--detect'),
    normalize: has('--normalize'),
    apply: has('--apply'),
    limit: value('--limit') ? parseInt(value('--limit')!, 10) : undefined,
    ids: value('--ids')?.split(',').map((s) => s.trim()),
    model: value('--model') ?? DEFAULT_MODEL,
    concurrency: value('--concurrency') ? parseInt(value('--concurrency')!, 10) : 5,
    force: has('--force'),
  };
}

async function main() {
  const opts = parseArgs();

  if (opts.apply) return apply();
  if (opts.normalize) return normalize(opts);

  // Default: detect
  detect(loadWorkouts());
  console.log('\nNext: --normalize (requires ANTHROPIC_API_KEY), then --apply');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
