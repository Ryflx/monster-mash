import 'server-only';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/db';
import {
  personalCompletions,
  teamCompletions,
  users,
  workouts,
} from '@/db/schema';

export type LeaderboardEntry = {
  completionId: number;
  userId: number | null;
  userDisplayName: string;
  scorePct: number | null;
  rx: boolean;
  timeSeconds: number | null;
  rounds: number | null;
  extraReps: number | null;
  completedAt: string;
};

export type WorkoutBoard = {
  workoutId: string;
  workoutTitle: string;
  workoutDate: string;
  entries: LeaderboardEntry[]; // sorted best first
  isAmrap: boolean;
};

function compareEntries(a: LeaderboardEntry, b: LeaderboardEntry, isAmrap: boolean): number {
  const sa = a.scorePct ?? -1;
  const sb = b.scorePct ?? -1;
  if (sa !== sb) return sb - sa;

  if (isAmrap) {
    const ra = (a.rounds ?? -1) * 1_000_000 + (a.extraReps ?? 0);
    const rb = (b.rounds ?? -1) * 1_000_000 + (b.extraReps ?? 0);
    if (ra !== rb) return rb - ra;
  } else {
    const ta = a.timeSeconds ?? Number.POSITIVE_INFINITY;
    const tb = b.timeSeconds ?? Number.POSITIVE_INFINITY;
    if (ta !== tb) return ta - tb;
  }

  return new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime();
}

function isAmrapBoard(entries: LeaderboardEntry[]): boolean {
  return entries.some((e) => e.rounds != null);
}

export async function getTeamLeaderboard(teamId: number): Promise<WorkoutBoard[]> {
  const rows = await db
    .select({
      id: teamCompletions.id,
      workoutId: teamCompletions.workoutId,
      workoutTitle: workouts.title,
      workoutDate: workouts.date,
      loggedBy: teamCompletions.loggedBy,
      userName: users.displayName,
      scorePct: teamCompletions.scorePct,
      rx: teamCompletions.rx,
      timeSeconds: teamCompletions.timeSeconds,
      rounds: teamCompletions.rounds,
      extraReps: teamCompletions.extraReps,
      completedAt: teamCompletions.completedAt,
    })
    .from(teamCompletions)
    .innerJoin(workouts, eq(workouts.id, teamCompletions.workoutId))
    .leftJoin(users, eq(users.id, teamCompletions.loggedBy))
    .where(eq(teamCompletions.teamId, teamId))
    .orderBy(desc(teamCompletions.completedAt));

  return groupIntoBoards(
    rows.map((r) => ({
      completionId: r.id,
      workoutId: r.workoutId,
      workoutTitle: r.workoutTitle,
      workoutDate: r.workoutDate,
      userId: r.loggedBy,
      userDisplayName: r.userName ?? 'Team',
      scorePct: r.scorePct,
      rx: r.rx,
      timeSeconds: r.timeSeconds,
      rounds: r.rounds,
      extraReps: r.extraReps,
      completedAt: r.completedAt.toISOString(),
    })),
  );
}

export async function getPersonalLeaderboard(userId: number): Promise<WorkoutBoard[]> {
  const rows = await db
    .select({
      id: personalCompletions.id,
      workoutId: personalCompletions.workoutId,
      workoutTitle: workouts.title,
      workoutDate: workouts.date,
      userName: users.displayName,
      scorePct: personalCompletions.scorePct,
      rx: personalCompletions.rx,
      timeSeconds: personalCompletions.timeSeconds,
      rounds: personalCompletions.rounds,
      extraReps: personalCompletions.extraReps,
      completedAt: personalCompletions.completedAt,
    })
    .from(personalCompletions)
    .innerJoin(workouts, eq(workouts.id, personalCompletions.workoutId))
    .innerJoin(users, eq(users.id, personalCompletions.userId))
    .where(eq(personalCompletions.userId, userId))
    .orderBy(desc(personalCompletions.completedAt));

  return groupIntoBoards(
    rows.map((r) => ({
      completionId: r.id,
      workoutId: r.workoutId,
      workoutTitle: r.workoutTitle,
      workoutDate: r.workoutDate,
      userId,
      userDisplayName: r.userName,
      scorePct: r.scorePct,
      rx: r.rx,
      timeSeconds: r.timeSeconds,
      rounds: r.rounds,
      extraReps: r.extraReps,
      completedAt: r.completedAt.toISOString(),
    })),
  );
}

function groupIntoBoards(
  rows: (LeaderboardEntry & { workoutId: string; workoutTitle: string; workoutDate: string })[],
): WorkoutBoard[] {
  const byWorkout = new Map<string, WorkoutBoard>();
  for (const r of rows) {
    let board = byWorkout.get(r.workoutId);
    if (!board) {
      board = {
        workoutId: r.workoutId,
        workoutTitle: r.workoutTitle,
        workoutDate: r.workoutDate,
        entries: [],
        isAmrap: false,
      };
      byWorkout.set(r.workoutId, board);
    }
    board.entries.push({
      completionId: r.completionId,
      userId: r.userId,
      userDisplayName: r.userDisplayName,
      scorePct: r.scorePct,
      rx: r.rx,
      timeSeconds: r.timeSeconds,
      rounds: r.rounds,
      extraReps: r.extraReps,
      completedAt: r.completedAt,
    });
  }

  const boards = Array.from(byWorkout.values());
  for (const b of boards) {
    b.isAmrap = isAmrapBoard(b.entries);
    b.entries.sort((a, z) => compareEntries(a, z, b.isAmrap));
  }

  boards.sort((a, b) => {
    const aAt = a.entries[0]?.completedAt ?? '';
    const bAt = b.entries[0]?.completedAt ?? '';
    return new Date(bAt).getTime() - new Date(aAt).getTime();
  });

  return boards;
}
