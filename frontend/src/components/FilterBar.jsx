const CATEGORIES = [
  { value: 'all', label: 'All' },
  { value: 'scholarship', label: 'Scholarships' },
  { value: 'hackathon', label: 'Hackathons' },
  { value: 'exam', label: 'Exams' },
];

export default function FilterBar({ category, setCategory, searchQuery, setSearchQuery }) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6">
      <input
        type="text"
        placeholder="Search by title or organization..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="flex-1 border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
      />
      <div className="flex gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            onClick={() => setCategory(c.value)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              category === c.value
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>
    </div>
  );
}
