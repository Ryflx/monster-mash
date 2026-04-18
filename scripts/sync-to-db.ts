import { config } from 'dotenv';
config({ path: '.env.local' });

import fs from 'node:fs';
import path from 'node:path';
import { upsertWorkout } from './upsert-workout';

async function main() {
  const raw = fs.readFileSync(
    path.join(process.cwd(), 'src', 'data', 'workouts.json'),
    'utf8',
  );
  const workouts = JSON.parse(raw);
  console.log(`Syncing ${workouts.length} workouts to Neon...`);
  for (const w of workouts) {
    await upsertWorkout(w);
  }
  console.log('Done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
