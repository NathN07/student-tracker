import { useState } from 'react';
import { useOpportunities } from './hooks/useOpportunities';
import { useFilteredOpportunities } from './hooks/useFilteredOpportunities';
import FilterBar from './components/FilterBar';
import OpportunityCard from './components/OpportunityCard';

export default function App() {
  const { items, loading, error } = useOpportunities();
  const [category, setCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = useFilteredOpportunities(items, { category, searchQuery });

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Opportunity Tracker</h1>
          <p className="text-slate-500 text-sm mt-1">
            Scholarships, hackathons, and exam deadlines — all in one place.
          </p>
        </header>

        <FilterBar
          category={category}
          setCategory={setCategory}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        {loading && <p className="text-slate-500">Loading opportunities...</p>}
        {error && <p className="text-red-600">Failed to load: {error}</p>}

        {!loading && !error && filtered.length === 0 && (
          <p className="text-slate-500">No opportunities match your filters.</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => (
            <OpportunityCard key={item._id} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}
