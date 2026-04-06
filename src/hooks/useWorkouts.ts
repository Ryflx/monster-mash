import { useMemo, useState } from 'react';
import type { Workout } from '../types/workout';
import workoutsData from '../data/workouts.json';

const allWorkouts = workoutsData as Workout[];

export function useWorkouts() {
  const [search, setSearch] = useState('');
  const [selectedMovements, setSelectedMovements] = useState<string[]>([]);
  const [hideCompleted, setHideCompleted] = useState(false);

  const allMovements = useMemo(() => {
    const set = new Set<string>();
    allWorkouts.forEach(w => w.movements.forEach(m => set.add(m)));
    return Array.from(set).sort();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return allWorkouts.filter(w => {
      if (q) {
        const inTitle = w.title.toLowerCase().includes(q);
        const inSegments = w.segments.some(s =>
          s.description.toLowerCase().includes(q),
        );
        if (!inTitle && !inSegments) return false;
      }
      if (selectedMovements.length > 0) {
        const wMovements = w.movements.map(m => m.toLowerCase());
        const allMatch = selectedMovements.every(m =>
          wMovements.some(wm => wm.includes(m.toLowerCase())),
        );
        if (!allMatch) return false;
      }
      return true;
    });
  }, [search, selectedMovements]);

  const toggleMovement = (movement: string) => {
    setSelectedMovements(prev =>
      prev.includes(movement)
        ? prev.filter(m => m !== movement)
        : [...prev, movement],
    );
  };

  return {
    workouts: filtered,
    allWorkouts,
    allMovements,
    search,
    setSearch,
    selectedMovements,
    toggleMovement,
    clearMovements: () => setSelectedMovements([]),
    hideCompleted,
    setHideCompleted,
  };
}
