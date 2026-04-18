import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import * as schema from '../src/db/schema';

type Workout = {
  id: string;
  date: string;
  title: string;
  sourceUrl: string;
  segments: {
    format: string;
    description: string;
    movements: {
      name: string;
      reps?: string;
      weightKg?: { male: number; female: number };
      weightOriginal?: string;
      equipment?: string;
    }[];
  }[];
};

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;
function getDb() {
  if (_db) return _db;
  const sql = neon(process.env.DATABASE_URL!);
  _db = drizzle(sql, { schema });
  return _db;
}

export async function upsertWorkout(w: Workout) {
  const db = getDb();
  await db
    .insert(schema.workouts)
    .values({ id: w.id, date: w.date, title: w.title, sourceUrl: w.sourceUrl })
    .onConflictDoUpdate({
      target: schema.workouts.id,
      set: { date: w.date, title: w.title, sourceUrl: w.sourceUrl },
    });

  await db.delete(schema.segments).where(eq(schema.segments.workoutId, w.id));

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
