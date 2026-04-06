import { useState } from 'react';
import Header from './components/Header';
import SearchBar from './components/SearchBar';
import MovementFilter from './components/MovementFilter';
import WorkoutList from './components/WorkoutList';
import SpinWheel from './components/SpinWheel';
import HistoryLog from './components/HistoryLog';
import { useWorkouts } from './hooks/useWorkouts';
import { useHistory } from './hooks/useHistory';

type Tab = 'Workouts' | 'Spin' | 'History';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('Workouts');

  const {
    workouts,
    allWorkouts,
    allMovements,
    search,
    setSearch,
    selectedMovements,
    toggleMovement,
    clearMovements,
  } = useWorkouts();

  const { history, markComplete, unmarkComplete, isCompleted } = useHistory();

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <Header activeTab={activeTab} onTabChange={(t) => setActiveTab(t as Tab)} />

      <main className="px-4 py-5 max-w-2xl mx-auto">
        {/* Workouts tab */}
        {activeTab === 'Workouts' && (
          <div className="space-y-4">
            <SearchBar value={search} onChange={setSearch} />
            {allMovements.length > 0 && (
              <MovementFilter
                movements={allMovements}
                selected={selectedMovements}
                onToggle={toggleMovement}
                onClear={clearMovements}
              />
            )}
            <WorkoutList
              workouts={workouts}
              isCompleted={isCompleted}
              onMarkComplete={markComplete}
              onUnmark={unmarkComplete}
            />
          </div>
        )}

        {/* Spin tab */}
        {activeTab === 'Spin' && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="font-display text-2xl font-900 uppercase tracking-widest text-white mb-1">
                Spin the Wheel
              </h2>
              <p className="text-sm text-[#555]">
                {allWorkouts.length > 0
                  ? `${allWorkouts.length} workouts in the pool`
                  : 'Load some workouts first'}
              </p>
            </div>
            <SpinWheel
              workouts={allWorkouts}
              onSelect={() => {}}
              isCompleted={isCompleted}
              onMarkComplete={markComplete}
              onUnmark={unmarkComplete}
            />
          </div>
        )}

        {/* History tab */}
        {activeTab === 'History' && (
          <HistoryLog
            history={history}
            allWorkouts={allWorkouts}
            onUnmark={unmarkComplete}
          />
        )}
      </main>
    </div>
  );
}

export default App;
