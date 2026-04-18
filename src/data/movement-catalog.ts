export type Variant = {
  name: string;
  tier: number;
  points: number;
  isRx: boolean;
  sortOrder: number;
};

export type CanonicalMovement = {
  name: string;
  slug: string;
  category: "gymnastics" | "weightlifting" | "monostructural" | "other";
  aliases: string[];
  variants: Variant[];
};

export const catalog: CanonicalMovement[] = [
  // ─── GYMNASTICS ──────────────────────────────────────────────────────────────

  {
    name: "Pull-up",
    slug: "pull-up",
    category: "gymnastics",
    aliases: ["pull-up", "pull ups", "pullups", "pu", "pull up"],
    variants: [
      { name: "Strict Pull-up", tier: 4, points: 4, isRx: false, sortOrder: 0 },
      { name: "Kipping Pull-up", tier: 3, points: 3, isRx: true, sortOrder: 1 },
      { name: "Banded Pull-up", tier: 2, points: 2, isRx: false, sortOrder: 2 },
      { name: "Ring Row", tier: 1, points: 1, isRx: false, sortOrder: 3 },
    ],
  },

  {
    name: "Chest-to-Bar Pull-up",
    slug: "chest-to-bar-pull-up",
    category: "gymnastics",
    aliases: [
      "chest-to-bar",
      "chest to bar",
      "c2b",
      "c2b pull-up",
      "c2b pull up",
      "chest-to-bar pull-up",
      "chest to bar pull up",
    ],
    variants: [
      { name: "Chest-to-Bar Pull-up", tier: 4, points: 4, isRx: true, sortOrder: 0 },
      { name: "Kipping Pull-up", tier: 3, points: 3, isRx: false, sortOrder: 1 },
      { name: "Banded Pull-up", tier: 2, points: 2, isRx: false, sortOrder: 2 },
      { name: "Ring Row", tier: 1, points: 1, isRx: false, sortOrder: 3 },
    ],
  },

  {
    name: "Bar Muscle-up",
    slug: "bar-muscle-up",
    category: "gymnastics",
    aliases: [
      "bar muscle-up",
      "bar muscle up",
      "bar mu",
      "bmu",
      "bar muscleup",
    ],
    variants: [
      { name: "Bar Muscle-up", tier: 4, points: 4, isRx: true, sortOrder: 0 },
      { name: "Chest-to-Bar Pull-up", tier: 3, points: 3, isRx: false, sortOrder: 1 },
      { name: "Kipping Pull-up", tier: 2, points: 2, isRx: false, sortOrder: 2 },
      { name: "Ring Row", tier: 1, points: 1, isRx: false, sortOrder: 3 },
    ],
  },

  {
    name: "Ring Muscle-up",
    slug: "ring-muscle-up",
    category: "gymnastics",
    aliases: [
      "ring muscle-up",
      "ring muscle up",
      "ring mu",
      "rmu",
      "ring muscleup",
      "muscle-up",
      "muscle up",
      "muscleup",
      "mu",
      "muscle-ups",
      "muscle ups",
    ],
    variants: [
      { name: "Ring Muscle-up", tier: 4, points: 4, isRx: true, sortOrder: 0 },
      { name: "Bar Muscle-up", tier: 3, points: 3, isRx: false, sortOrder: 1 },
      { name: "Jumping Ring Muscle-up", tier: 2, points: 2, isRx: false, sortOrder: 2 },
      { name: "C2B Pull-up + Ring Dip", tier: 1, points: 1, isRx: false, sortOrder: 3 },
    ],
  },

  {
    name: "Toes-to-Bar",
    slug: "toes-to-bar",
    category: "gymnastics",
    aliases: [
      "toes-to-bar",
      "toes to bar",
      "t2b",
      "ttb",
      "toes to bars",
      "knees-to-elbows",
      "knees to elbows",
      "k2e",
      "kte",
    ],
    variants: [
      { name: "Toes-to-Bar", tier: 4, points: 4, isRx: true, sortOrder: 0 },
      { name: "Knees-to-Elbows", tier: 3, points: 3, isRx: false, sortOrder: 1 },
      { name: "Hanging Knee Raises", tier: 2, points: 2, isRx: false, sortOrder: 2 },
      { name: "Sit-up", tier: 1, points: 1, isRx: false, sortOrder: 3 },
    ],
  },

  {
    name: "Handstand Push-up",
    slug: "handstand-push-up",
    category: "gymnastics",
    aliases: [
      "handstand push-up",
      "handstand push up",
      "hspu",
      "handstand pushup",
      "handstand push-ups",
    ],
    variants: [
      { name: "Strict HSPU", tier: 4, points: 4, isRx: false, sortOrder: 0 },
      { name: "Kipping HSPU", tier: 3, points: 3, isRx: true, sortOrder: 1 },
      { name: "HSPU with AbMat / Plates", tier: 2, points: 2, isRx: false, sortOrder: 2 },
      { name: "Pike Push-up off Box", tier: 1, points: 1, isRx: false, sortOrder: 3 },
    ],
  },

  {
    name: "Handstand Walk",
    slug: "handstand-walk",
    category: "gymnastics",
    aliases: [
      "handstand walk",
      "handstand walking",
      "hsw",
      "hs walk",
    ],
    variants: [
      { name: "Handstand Walk", tier: 4, points: 4, isRx: true, sortOrder: 0 },
      { name: "Handstand Hold (Wall)", tier: 3, points: 3, isRx: false, sortOrder: 1 },
      { name: "Bear Crawl", tier: 2, points: 2, isRx: false, sortOrder: 2 },
      { name: "Inchworm", tier: 1, points: 1, isRx: false, sortOrder: 3 },
    ],
  },

  {
    name: "Ring Dip",
    slug: "ring-dip",
    category: "gymnastics",
    aliases: [
      "ring dip",
      "ring dips",
      "rd",
    ],
    variants: [
      { name: "Ring Dip", tier: 4, points: 4, isRx: true, sortOrder: 0 },
      { name: "Bar / Box Dip", tier: 3, points: 3, isRx: false, sortOrder: 1 },
      { name: "Banded Ring Dip", tier: 2, points: 2, isRx: false, sortOrder: 2 },
      { name: "Push-up", tier: 1, points: 1, isRx: false, sortOrder: 3 },
    ],
  },

  {
    name: "Push-up",
    slug: "push-up",
    category: "gymnastics",
    aliases: [
      "push-up",
      "push up",
      "pushup",
      "push-ups",
      "push ups",
      "pu",
    ],
    variants: [
      { name: "Push-up", tier: 3, points: 3, isRx: true, sortOrder: 0 },
      { name: "Hand-release Push-up", tier: 3, points: 3, isRx: false, sortOrder: 1 },
      { name: "Incline Push-up (on box)", tier: 2, points: 2, isRx: false, sortOrder: 2 },
      { name: "Knee Push-up", tier: 1, points: 1, isRx: false, sortOrder: 3 },
    ],
  },

  {
    name: "Air Squat",
    slug: "air-squat",
    category: "gymnastics",
    aliases: [
      "air squat",
      "air squats",
      "bodyweight squat",
      "bw squat",
    ],
    variants: [
      { name: "Air Squat", tier: 3, points: 3, isRx: true, sortOrder: 0 },
      { name: "Assisted Air Squat (TRX / rig)", tier: 2, points: 2, isRx: false, sortOrder: 1 },
      { name: "Box Squat", tier: 1, points: 1, isRx: false, sortOrder: 2 },
    ],
  },

  {
    name: "Pistol Squat",
    slug: "pistol-squat",
    category: "gymnastics",
    aliases: [
      "pistol squat",
      "pistol squats",
      "pistols",
      "single leg squat",
      "one leg squat",
    ],
    variants: [
      { name: "Pistol Squat", tier: 4, points: 5, isRx: true, sortOrder: 0 },
      { name: "Assisted Pistol (TRX / rig)", tier: 3, points: 3, isRx: false, sortOrder: 1 },
      { name: "Elevated Heel Pistol", tier: 2, points: 2, isRx: false, sortOrder: 2 },
      { name: "Single-leg Box Squat", tier: 1, points: 1, isRx: false, sortOrder: 3 },
    ],
  },

  {
    name: "Rope Climb",
    slug: "rope-climb",
    category: "gymnastics",
    aliases: [
      "rope climb",
      "rope climbs",
      "legless rope climb",
      "rope",
    ],
    variants: [
      { name: "Legless Rope Climb", tier: 4, points: 4, isRx: false, sortOrder: 0 },
      { name: "Rope Climb (with legs)", tier: 3, points: 3, isRx: true, sortOrder: 1 },
      { name: "Rope Climb (standing start / L-sit hold)", tier: 2, points: 2, isRx: false, sortOrder: 2 },
      { name: "Rope Pull (lying)", tier: 1, points: 1, isRx: false, sortOrder: 3 },
    ],
  },

  {
    name: "GHD Sit-up",
    slug: "ghd-sit-up",
    category: "gymnastics",
    aliases: [
      "ghd sit-up",
      "ghd sit up",
      "ghd situp",
      "ghd",
      "glute ham developer sit-up",
    ],
    variants: [
      { name: "GHD Sit-up", tier: 3, points: 3, isRx: true, sortOrder: 0 },
      { name: "AbMat Sit-up", tier: 2, points: 2, isRx: false, sortOrder: 1 },
      { name: "Hollow Rock", tier: 1, points: 1, isRx: false, sortOrder: 2 },
    ],
  },

  {
    name: "Sit-up",
    slug: "sit-up",
    category: "gymnastics",
    aliases: [
      "sit-up",
      "sit up",
      "situp",
      "abmat sit-up",
      "sit-ups",
      "abmat",
    ],
    variants: [
      { name: "AbMat Sit-up", tier: 3, points: 3, isRx: true, sortOrder: 0 },
      { name: "Feet-anchored Sit-up", tier: 2, points: 2, isRx: false, sortOrder: 1 },
      { name: "Crunch", tier: 1, points: 1, isRx: false, sortOrder: 2 },
    ],
  },

  {
    name: "L-sit",
    slug: "l-sit",
    category: "gymnastics",
    aliases: [
      "l-sit",
      "l sit",
      "lsit",
    ],
    variants: [
      { name: "L-sit (parallel bars / rings)", tier: 4, points: 4, isRx: true, sortOrder: 0 },
      { name: "L-sit on floor", tier: 3, points: 3, isRx: false, sortOrder: 1 },
      { name: "Tuck L-sit", tier: 2, points: 2, isRx: false, sortOrder: 2 },
      { name: "Seated leg raise hold", tier: 1, points: 1, isRx: false, sortOrder: 3 },
    ],
  },

  // ─── WEIGHTLIFTING ────────────────────────────────────────────────────────────

  {
    name: "Shoulder-to-Overhead",
    slug: "shoulder-to-overhead",
    category: "weightlifting",
    aliases: [
      "shoulder-to-overhead",
      "shoulder to overhead",
      "sto",
      "jerk",
      "jerks",
      "split jerk",
      "split jerks",
      "push jerk",
      "push jerks",
      "squat jerk",
    ],
    variants: [
      { name: "Split Jerk at Rx weight", tier: 4, points: 4, isRx: true, sortOrder: 0 },
      { name: "Push Jerk at Rx weight", tier: 3, points: 3, isRx: false, sortOrder: 1 },
      { name: "Push Press at Rx weight", tier: 2, points: 2, isRx: false, sortOrder: 2 },
      { name: "Strict Press (lighter)", tier: 1, points: 1, isRx: false, sortOrder: 3 },
    ],
  },

  {
    name: "Bench Press",
    slug: "bench-press",
    category: "weightlifting",
    aliases: [
      "bench press",
      "bench",
      "bp",
      "bench presses",
    ],
    variants: [
      { name: "Bench Press at Rx weight", tier: 4, points: 4, isRx: true, sortOrder: 0 },
      { name: "Lighter Bench Press", tier: 3, points: 3, isRx: false, sortOrder: 1 },
      { name: "DB Bench Press", tier: 2, points: 2, isRx: false, sortOrder: 2 },
      { name: "Push-up", tier: 1, points: 1, isRx: false, sortOrder: 3 },
    ],
  },

  {
    name: "Clean & Jerk",
    slug: "clean-and-jerk",
    category: "weightlifting",
    aliases: [
      "clean and jerk",
      "clean & jerk",
      "c&j",
      "cnj",
      "clean jerk",
    ],
    variants: [
      { name: "Clean & Jerk at Rx weight", tier: 4, points: 4, isRx: true, sortOrder: 0 },
      { name: "Hang Clean & Jerk at Rx weight", tier: 3, points: 3, isRx: false, sortOrder: 1 },
      { name: "Power Clean + Push Press (lighter)", tier: 2, points: 2, isRx: false, sortOrder: 2 },
      { name: "DB Clean & Press", tier: 1, points: 1, isRx: false, sortOrder: 3 },
    ],
  },

  {
    name: "Power Clean",
    slug: "power-clean",
    category: "weightlifting",
    aliases: [
      "power clean",
      "power cleans",
      "pc",
      "pcs",
    ],
    variants: [
      { name: "Power Clean at Rx weight", tier: 4, points: 4, isRx: true, sortOrder: 0 },
      { name: "Hang Power Clean at Rx weight", tier: 3, points: 3, isRx: false, sortOrder: 1 },
      { name: "Power Clean at lighter weight", tier: 2, points: 2, isRx: false, sortOrder: 2 },
      { name: "DB Power Clean", tier: 1, points: 1, isRx: false, sortOrder: 3 },
    ],
  },

  {
    name: "Squat Clean",
    slug: "squat-clean",
    category: "weightlifting",
    aliases: [
      "squat clean",
      "squat cleans",
      "full clean",
      "clean",
      "cleans",
    ],
    variants: [
      { name: "Squat Clean at Rx weight", tier: 4, points: 4, isRx: true, sortOrder: 0 },
      { name: "Power Clean at Rx weight", tier: 3, points: 3, isRx: false, sortOrder: 1 },
      { name: "Deadlift + Front Squat (Rx weight)", tier: 2, points: 2, isRx: false, sortOrder: 2 },
      { name: "DB Squat Clean", tier: 1, points: 1, isRx: false, sortOrder: 3 },
    ],
  },

  {
    name: "Hang Power Clean",
    slug: "hang-power-clean",
    category: "weightlifting",
    aliases: [
      "hang power clean",
      "hang power cleans",
      "hpc",
    ],
    variants: [
      { name: "Hang Power Clean at Rx weight", tier: 4, points: 4, isRx: true, sortOrder: 0 },
      { name: "Hang Power Clean at lighter weight", tier: 3, points: 3, isRx: false, sortOrder: 1 },
      { name: "DB Hang Power Clean", tier: 2, points: 2, isRx: false, sortOrder: 2 },
    ],
  },

  {
    name: "Snatch",
    slug: "snatch",
    category: "weightlifting",
    aliases: [
      "snatch",
      "squat snatch",
      "full snatch",
      "snatches",
    ],
    variants: [
      { name: "Squat Snatch at Rx weight", tier: 4, points: 4, isRx: true, sortOrder: 0 },
      { name: "Power Snatch at Rx weight", tier: 3, points: 3, isRx: false, sortOrder: 1 },
      { name: "Overhead Squat (lighter)", tier: 2, points: 2, isRx: false, sortOrder: 2 },
      { name: "DB Snatch", tier: 1, points: 1, isRx: false, sortOrder: 3 },
    ],
  },

  {
    name: "Power Snatch",
    slug: "power-snatch",
    category: "weightlifting",
    aliases: [
      "power snatch",
      "power snatches",
      "ps",
    ],
    variants: [
      { name: "Power Snatch at Rx weight", tier: 4, points: 4, isRx: true, sortOrder: 0 },
      { name: "Hang Power Snatch at Rx weight", tier: 3, points: 3, isRx: false, sortOrder: 1 },
      { name: "Power Snatch at lighter weight", tier: 2, points: 2, isRx: false, sortOrder: 2 },
      { name: "DB Power Snatch", tier: 1, points: 1, isRx: false, sortOrder: 3 },
    ],
  },

  {
    name: "Hang Power Snatch",
    slug: "hang-power-snatch",
    category: "weightlifting",
    aliases: [
      "hang power snatch",
      "hang power snatches",
      "hps",
    ],
    variants: [
      { name: "Hang Power Snatch at Rx weight", tier: 4, points: 4, isRx: true, sortOrder: 0 },
      { name: "Hang Power Snatch at lighter weight", tier: 3, points: 3, isRx: false, sortOrder: 1 },
      { name: "DB Hang Power Snatch", tier: 2, points: 2, isRx: false, sortOrder: 2 },
    ],
  },

  {
    name: "Front Squat",
    slug: "front-squat",
    category: "weightlifting",
    aliases: [
      "front squat",
      "front squats",
      "fs",
    ],
    variants: [
      { name: "Front Squat at Rx weight", tier: 4, points: 4, isRx: true, sortOrder: 0 },
      { name: "Front Squat at lighter weight", tier: 3, points: 3, isRx: false, sortOrder: 1 },
      { name: "Goblet Squat", tier: 2, points: 2, isRx: false, sortOrder: 2 },
      { name: "Air Squat", tier: 1, points: 1, isRx: false, sortOrder: 3 },
    ],
  },

  {
    name: "Back Squat",
    slug: "back-squat",
    category: "weightlifting",
    aliases: [
      "back squat",
      "back squats",
      "bs",
      "squat",
      "squats",
    ],
    variants: [
      { name: "Back Squat at Rx weight", tier: 4, points: 4, isRx: true, sortOrder: 0 },
      { name: "Back Squat at lighter weight", tier: 3, points: 3, isRx: false, sortOrder: 1 },
      { name: "Goblet Squat", tier: 2, points: 2, isRx: false, sortOrder: 2 },
      { name: "Air Squat", tier: 1, points: 1, isRx: false, sortOrder: 3 },
    ],
  },

  {
    name: "Overhead Squat",
    slug: "overhead-squat",
    category: "weightlifting",
    aliases: [
      "overhead squat",
      "overhead squats",
      "ohs",
    ],
    variants: [
      { name: "Overhead Squat at Rx weight", tier: 4, points: 4, isRx: true, sortOrder: 0 },
      { name: "Overhead Squat at lighter weight", tier: 3, points: 3, isRx: false, sortOrder: 1 },
      { name: "Front Squat", tier: 2, points: 2, isRx: false, sortOrder: 2 },
      { name: "Air Squat with PVC overhead", tier: 1, points: 1, isRx: false, sortOrder: 3 },
    ],
  },

  {
    name: "Deadlift",
    slug: "deadlift",
    category: "weightlifting",
    aliases: [
      "deadlift",
      "deadlifts",
      "dl",
    ],
    variants: [
      { name: "Deadlift at Rx weight", tier: 4, points: 4, isRx: true, sortOrder: 0 },
      { name: "Deadlift at lighter weight", tier: 3, points: 3, isRx: false, sortOrder: 1 },
      { name: "Romanian Deadlift (RDL)", tier: 2, points: 2, isRx: false, sortOrder: 2 },
      { name: "KB Deadlift", tier: 1, points: 1, isRx: false, sortOrder: 3 },
    ],
  },

  {
    name: "Sumo Deadlift High Pull",
    slug: "sumo-deadlift-high-pull",
    category: "weightlifting",
    aliases: [
      "sumo deadlift high pull",
      "sdhp",
      "sumo dl high pull",
    ],
    variants: [
      { name: "SDHP at Rx weight", tier: 4, points: 4, isRx: true, sortOrder: 0 },
      { name: "SDHP at lighter weight", tier: 3, points: 3, isRx: false, sortOrder: 1 },
      { name: "KB SDHP", tier: 2, points: 2, isRx: false, sortOrder: 2 },
    ],
  },

  {
    name: "Thruster",
    slug: "thruster",
    category: "weightlifting",
    aliases: [
      "thruster",
      "thrusters",
    ],
    variants: [
      { name: "Thruster at Rx weight", tier: 4, points: 4, isRx: true, sortOrder: 0 },
      { name: "Thruster at lighter weight", tier: 3, points: 3, isRx: false, sortOrder: 1 },
      { name: "Push Press + Front Squat (separate)", tier: 2, points: 2, isRx: false, sortOrder: 2 },
      { name: "Goblet Squat + Push (DB)", tier: 1, points: 1, isRx: false, sortOrder: 3 },
    ],
  },

  {
    name: "Wall Ball",
    slug: "wall-ball",
    category: "weightlifting",
    aliases: [
      "wall ball",
      "wallball",
      "wallballs",
      "wb",
      "wall balls",
      "wall ball shot",
      "wall ball shots",
    ],
    variants: [
      { name: "Wall Ball at Rx weight (20/14 lb)", tier: 4, points: 4, isRx: true, sortOrder: 0 },
      { name: "Wall Ball at lighter weight", tier: 3, points: 3, isRx: false, sortOrder: 1 },
      { name: "Air Squat + Med-ball Throw (seated)", tier: 2, points: 2, isRx: false, sortOrder: 2 },
      { name: "Air Squat", tier: 1, points: 1, isRx: false, sortOrder: 3 },
    ],
  },

  {
    name: "Kettlebell Swing",
    slug: "kettlebell-swing",
    category: "weightlifting",
    aliases: [
      "kettlebell swing",
      "kb swing",
      "kbs",
      "kb swings",
      "kettlebell swings",
      "russian swing",
      "american swing",
      "american kettlebell swing",
    ],
    variants: [
      { name: "American KB Swing at Rx weight", tier: 4, points: 4, isRx: true, sortOrder: 0 },
      { name: "Russian KB Swing at Rx weight", tier: 3, points: 3, isRx: false, sortOrder: 1 },
      { name: "Russian KB Swing at lighter weight", tier: 2, points: 2, isRx: false, sortOrder: 2 },
      { name: "DB Swing", tier: 1, points: 1, isRx: false, sortOrder: 3 },
    ],
  },

  {
    name: "Turkish Get-up",
    slug: "turkish-get-up",
    category: "weightlifting",
    aliases: [
      "turkish get-up",
      "turkish get up",
      "tgu",
      "get-up",
    ],
    variants: [
      { name: "Turkish Get-up at Rx weight", tier: 4, points: 4, isRx: true, sortOrder: 0 },
      { name: "Turkish Get-up at lighter weight", tier: 3, points: 3, isRx: false, sortOrder: 1 },
      { name: "Turkish Get-up with shoe (no weight)", tier: 2, points: 2, isRx: false, sortOrder: 2 },
    ],
  },

  {
    name: "Dumbbell Snatch",
    slug: "dumbbell-snatch",
    category: "weightlifting",
    aliases: [
      "dumbbell snatch",
      "db snatch",
      "single arm db snatch",
      "one arm db snatch",
    ],
    variants: [
      { name: "DB Snatch at Rx weight", tier: 4, points: 4, isRx: true, sortOrder: 0 },
      { name: "DB Snatch at lighter weight", tier: 3, points: 3, isRx: false, sortOrder: 1 },
      { name: "DB High Pull", tier: 2, points: 2, isRx: false, sortOrder: 2 },
    ],
  },

  {
    name: "Dumbbell Clean",
    slug: "dumbbell-clean",
    category: "weightlifting",
    aliases: [
      "dumbbell clean",
      "db clean",
      "db cleans",
      "dumbbell cleans",
    ],
    variants: [
      { name: "DB Clean at Rx weight", tier: 4, points: 4, isRx: true, sortOrder: 0 },
      { name: "DB Hang Clean at Rx weight", tier: 3, points: 3, isRx: false, sortOrder: 1 },
      { name: "DB Clean at lighter weight", tier: 2, points: 2, isRx: false, sortOrder: 2 },
    ],
  },

  {
    name: "Dumbbell Thruster",
    slug: "dumbbell-thruster",
    category: "weightlifting",
    aliases: [
      "dumbbell thruster",
      "db thruster",
      "db thrusters",
      "dumbbell thrusters",
    ],
    variants: [
      { name: "DB Thruster at Rx weight", tier: 4, points: 4, isRx: true, sortOrder: 0 },
      { name: "DB Thruster at lighter weight", tier: 3, points: 3, isRx: false, sortOrder: 1 },
      { name: "DB Front Squat + Push Press (separate)", tier: 2, points: 2, isRx: false, sortOrder: 2 },
    ],
  },

  // ─── MONOSTRUCTURAL ───────────────────────────────────────────────────────────

  {
    name: "Row",
    slug: "row",
    category: "monostructural",
    aliases: [
      "row",
      "rowing",
      "cal row",
      "calorie row",
      "meter row",
      "erg",
      "concept2",
      "c2 row",
    ],
    variants: [
      { name: "Concept 2 Row (Rx cals / meters)", tier: 4, points: 4, isRx: true, sortOrder: 0 },
      { name: "Bike (equivalent cals)", tier: 3, points: 3, isRx: false, sortOrder: 1 },
      { name: "SkiErg (equivalent cals)", tier: 3, points: 3, isRx: false, sortOrder: 2 },
      { name: "Run equivalent distance", tier: 2, points: 2, isRx: false, sortOrder: 3 },
    ],
  },

  {
    name: "Run",
    slug: "run",
    category: "monostructural",
    aliases: [
      "run",
      "running",
      "400m run",
      "800m run",
      "1 mile run",
      "200m run",
    ],
    variants: [
      { name: "Run (Rx distance)", tier: 4, points: 4, isRx: true, sortOrder: 0 },
      { name: "Row (equivalent cals / meters)", tier: 3, points: 3, isRx: false, sortOrder: 1 },
      { name: "Bike (equivalent cals)", tier: 2, points: 2, isRx: false, sortOrder: 2 },
      { name: "Reduced distance run", tier: 1, points: 1, isRx: false, sortOrder: 3 },
    ],
  },

  {
    name: "Bike",
    slug: "bike",
    category: "monostructural",
    aliases: [
      "bike",
      "assault bike",
      "echo bike",
      "air bike",
      "cal bike",
      "calorie bike",
      "ab",
    ],
    variants: [
      { name: "Air/Assault Bike (Rx cals)", tier: 4, points: 4, isRx: true, sortOrder: 0 },
      { name: "Row (equivalent cals)", tier: 3, points: 3, isRx: false, sortOrder: 1 },
      { name: "SkiErg (equivalent cals)", tier: 3, points: 3, isRx: false, sortOrder: 2 },
      { name: "Reduced cals / arms-only bike", tier: 2, points: 2, isRx: false, sortOrder: 3 },
    ],
  },

  {
    name: "SkiErg",
    slug: "skierg",
    category: "monostructural",
    aliases: [
      "skierg",
      "ski erg",
      "ski",
      "ski cals",
      "ski calories",
    ],
    variants: [
      { name: "SkiErg (Rx cals)", tier: 4, points: 4, isRx: true, sortOrder: 0 },
      { name: "Row (equivalent cals)", tier: 3, points: 3, isRx: false, sortOrder: 1 },
      { name: "Bike (equivalent cals)", tier: 2, points: 2, isRx: false, sortOrder: 2 },
    ],
  },

  {
    name: "Double Under",
    slug: "double-under",
    category: "monostructural",
    aliases: [
      "double under",
      "double-under",
      "double unders",
      "du",
      "dus",
      "dubs",
    ],
    variants: [
      { name: "Double Under", tier: 4, points: 4, isRx: true, sortOrder: 0 },
      { name: "DU + Single Under mix (1 DU : 3 SU)", tier: 3, points: 3, isRx: false, sortOrder: 1 },
      { name: "Single Under ×2", tier: 2, points: 2, isRx: false, sortOrder: 2 },
      { name: "Line jumps / jump in place", tier: 1, points: 1, isRx: false, sortOrder: 3 },
    ],
  },

  {
    name: "Box Jump",
    slug: "box-jump",
    category: "monostructural",
    aliases: [
      "box jump",
      "box jumps",
      "bj",
      "box jump over",
      "bjo",
    ],
    variants: [
      { name: "Box Jump at Rx height (24/20 in)", tier: 4, points: 4, isRx: true, sortOrder: 0 },
      { name: "Box Jump at lower height", tier: 3, points: 3, isRx: false, sortOrder: 1 },
      { name: "Step-up at Rx height", tier: 2, points: 2, isRx: false, sortOrder: 2 },
      { name: "Step-up at lower height", tier: 1, points: 1, isRx: false, sortOrder: 3 },
    ],
  },

  {
    name: "Burpee",
    slug: "burpee",
    category: "monostructural",
    aliases: [
      "burpee",
      "burpees",
    ],
    variants: [
      { name: "Burpee", tier: 3, points: 3, isRx: true, sortOrder: 0 },
      { name: "No-push-up Burpee", tier: 2, points: 2, isRx: false, sortOrder: 1 },
      { name: "Squat Thrust (no jump)", tier: 1, points: 1, isRx: false, sortOrder: 2 },
    ],
  },

  {
    name: "Burpee Box Jump Over",
    slug: "burpee-box-jump-over",
    category: "monostructural",
    aliases: [
      "burpee box jump over",
      "bbjo",
      "burpee over box",
      "burpee box over",
    ],
    variants: [
      { name: "Burpee Box Jump Over (Rx height)", tier: 4, points: 4, isRx: true, sortOrder: 0 },
      { name: "Burpee Box Jump Over (lower box)", tier: 3, points: 3, isRx: false, sortOrder: 1 },
      { name: "Burpee Step Over", tier: 2, points: 2, isRx: false, sortOrder: 2 },
      { name: "Burpee (no box)", tier: 1, points: 1, isRx: false, sortOrder: 3 },
    ],
  },
];

/** Total canonical movement count */
export const CATALOG_COUNT = catalog.length;

/** Flat list of all variants across the catalog (useful for seed scripts) */
export const allVariants = catalog.flatMap((m) =>
  m.variants.map((v) => ({ ...v, movementSlug: m.slug, movementName: m.name }))
);
