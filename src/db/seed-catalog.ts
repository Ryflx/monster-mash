import { config } from 'dotenv';
config({ path: '.env.local' });

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import * as schema from './schema';
import { catalog } from '../data/movement-catalog';

function normalizeMovement(name: string): string {
  return name
    .toLowerCase()
    .replace(/,.*$/, '')
    .replace(/\(.*?\)/g, '')
    .replace(/\s*w\/.*$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildMatcher(aliases: { alias: string; canonicalId: number }[]) {
  const exact = new Map<string, number>();
  for (const a of aliases) exact.set(a.alias, a.canonicalId);

  const sorted = [...aliases].sort((a, b) => b.alias.length - a.alias.length);

  return (raw: string): number | null => {
    const needle = normalizeMovement(raw);
    if (exact.has(needle)) return exact.get(needle)!;
    for (const a of sorted) {
      if (needle.includes(a.alias)) return a.canonicalId;
    }
    return null;
  };
}

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql, { schema });

  console.log(`Seeding ${catalog.length} canonical movements...`);

  await db.delete(schema.movementAliases);
  await db.delete(schema.movementVariants);
  await db.delete(schema.canonicalMovements);

  let totalVariants = 0;
  let totalAliases = 0;

  for (const m of catalog) {
    const [canonical] = await db
      .insert(schema.canonicalMovements)
      .values({ slug: m.slug, name: m.name, category: m.category })
      .returning();

    for (const v of m.variants) {
      await db.insert(schema.movementVariants).values({
        canonicalId: canonical.id,
        name: v.name,
        tier: v.tier,
        points: v.points,
        isRx: v.isRx,
        sortOrder: v.sortOrder,
      });
      totalVariants++;
    }

    const seenAliases = new Set<string>();
    for (const alias of m.aliases) {
      const norm = alias.toLowerCase().trim();
      if (!norm || seenAliases.has(norm)) continue;
      seenAliases.add(norm);
      await db
        .insert(schema.movementAliases)
        .values({ canonicalId: canonical.id, alias: norm })
        .onConflictDoNothing();
      totalAliases++;
    }
  }

  console.log(`  ${catalog.length} movements, ${totalVariants} variants, ${totalAliases} aliases`);

  console.log('Matching existing workout movements to canonical...');

  const aliases = await db
    .select({ alias: schema.movementAliases.alias, canonicalId: schema.movementAliases.canonicalId })
    .from(schema.movementAliases);

  const match = buildMatcher(aliases);

  const allMovements = await db.select().from(schema.movements);

  let matched = 0;
  let unmatched = 0;
  const unmatchedNames = new Map<string, number>();

  for (const m of allMovements) {
    const canonicalId = match(m.name);
    if (canonicalId) {
      if (m.canonicalId !== canonicalId) {
        await db
          .update(schema.movements)
          .set({ canonicalId })
          .where(eq(schema.movements.id, m.id));
      }
      matched++;
    } else {
      unmatched++;
      const norm = normalizeMovement(m.name);
      unmatchedNames.set(norm, (unmatchedNames.get(norm) ?? 0) + 1);
    }
  }

  const unmatchedPct = ((unmatched / allMovements.length) * 100).toFixed(1);
  console.log(`  Matched: ${matched} / ${allMovements.length} (${unmatched} unmatched, ${unmatchedPct}%)`);

  if (unmatchedNames.size > 0) {
    console.log(`  Top unmatched names (by frequency):`);
    const sorted = [...unmatchedNames.entries()].sort((a, b) => b[1] - a[1]).slice(0, 30);
    for (const [name, count] of sorted) {
      console.log(`    ${count.toString().padStart(3)}  ${name}`);
    }
  }
}

main()
  .then(() => {
    console.log('Done.');
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
