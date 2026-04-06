import { useState, useCallback } from 'react';
import type { CompletedWorkout } from '../types/workout';

const STORAGE_KEY = 'monster-mash-history';

function loadHistory(): CompletedWorkout[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHistory(history: CompletedWorkout[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

export function useHistory() {
  const [history, setHistory] = useState<CompletedWorkout[]>(loadHistory);

  const markComplete = useCallback((workoutId: string) => {
    setHistory(prev => {
      if (prev.some(h => h.workoutId === workoutId)) return prev;
      const next = [...prev, { workoutId, completedAt: new Date().toISOString() }];
      saveHistory(next);
      return next;
    });
  }, []);

  const unmarkComplete = useCallback((workoutId: string) => {
    setHistory(prev => {
      const next = prev.filter(h => h.workoutId !== workoutId);
      saveHistory(next);
      return next;
    });
  }, []);

  const isCompleted = useCallback(
    (workoutId: string) => history.some(h => h.workoutId === workoutId),
    [history],
  );

  return { history, markComplete, unmarkComplete, isCompleted };
}
