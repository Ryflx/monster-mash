import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  date,
  real,
  primaryKey,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  clerkUserId: text('clerk_user_id').notNull().unique(),
  displayName: text('display_name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const teams = pgTable('teams', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  inviteCode: text('invite_code').notNull().unique(),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const teamMembers = pgTable(
  'team_members',
  {
    teamId: integer('team_id')
      .notNull()
      .references(() => teams.id, { onDelete: 'cascade' }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: text('role').notNull().default('member'),
    joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({ pk: primaryKey({ columns: [t.teamId, t.userId] }) }),
);

export const workouts = pgTable('workouts', {
  id: text('id').primaryKey(),
  date: date('date').notNull(),
  title: text('title').notNull(),
  sourceUrl: text('source_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const segments = pgTable('segments', {
  id: serial('id').primaryKey(),
  workoutId: text('workout_id')
    .notNull()
    .references(() => workouts.id, { onDelete: 'cascade' }),
  position: integer('position').notNull(),
  format: text('format').notNull(),
  description: text('description').notNull(),
});

export const movements = pgTable('movements', {
  id: serial('id').primaryKey(),
  segmentId: integer('segment_id')
    .notNull()
    .references(() => segments.id, { onDelete: 'cascade' }),
  position: integer('position').notNull(),
  name: text('name').notNull(),
  reps: text('reps'),
  weightKgMale: real('weight_kg_male'),
  weightKgFemale: real('weight_kg_female'),
  weightOriginal: text('weight_original'),
  equipment: text('equipment'),
});

export const personalCompletions = pgTable('personal_completions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  workoutId: text('workout_id')
    .notNull()
    .references(() => workouts.id, { onDelete: 'cascade' }),
  completedAt: timestamp('completed_at', { withTimezone: true }).defaultNow().notNull(),
});

export const teamCompletions = pgTable('team_completions', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id, { onDelete: 'cascade' }),
  workoutId: text('workout_id')
    .notNull()
    .references(() => workouts.id, { onDelete: 'cascade' }),
  loggedBy: integer('logged_by').references(() => users.id),
  completedAt: timestamp('completed_at', { withTimezone: true }).defaultNow().notNull(),
  notes: text('notes'),
});
