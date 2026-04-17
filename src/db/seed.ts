import { config } from 'dotenv';
config({ path: '.env.local' });

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';
import workoutsJson from '../data/workouts.json';

type WeightKg = { male: number; female: number };
type Movement = {
  name: string;
  reps?: string;
  weightKg?: WeightKg;
  weightOriginal?: string;
  equipment?: string;
};
type Segment = { format: string; description: string; movements: Movement[] };
type Workout = {
  id: string;
  date: string;
  title: string;
  segments: Segment[];
  movements: string[];
  sourceUrl: string;
};

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql, { schema });

  const data = workoutsJson as Workout[];
  console.log(`Seeding ${data.length} workouts...`);

  await db.delete(schema.movements);
  await db.delete(schema.segments);

  for (const w of data) {
    await db
      .insert(schema.workouts)
      .values({
        id: w.id,
        date: w.date,
        title: w.title,
        sourceUrl: w.sourceUrl,
      })
      .onConflictDoNothing();

    for (let si = 0; si < w.segments.length; si++) {
      const seg = w.segments[si];
      const [insertedSeg] = await db
        .insert(schema.segments)
        .values({
          workoutId: w.id,
          position: si,
          format: seg.format,
          description: seg.description,
        })
        .returning();

      for (let mi = 0; mi < seg.movements.length; mi++) {
        const mv = seg.movements[mi];
        await db.insert(schema.movements).values({
          segmentId: insertedSeg.id,
          position: mi,
          name: mv.name,
          reps: mv.reps ?? null,
          weightKgMale: mv.weightKg?.male ?? null,
          weightKgFemale: mv.weightKg?.female ?? null,
          weightOriginal: mv.weightOriginal ?? null,
          equipment: mv.equipment ?? null,
        });
      }
    }
  }

  console.log('Done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
