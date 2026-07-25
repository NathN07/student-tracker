import { generateGCalLink } from '../utils/googleCalendar';

const CATEGORY_STYLES = {
  scholarship: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  hackathon: 'bg-violet-100 text-violet-800 border-violet-300',
  exam: 'bg-amber-100 text-amber-800 border-amber-300',
};

function daysUntil(dateStr) {
  const diffMs = new Date(dateStr) - new Date();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export default function OpportunityCard({ item }) {
  const days = daysUntil(item.deadline);
  const urgent = days <= 7;

  return (
    <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm hover:shadow-md transition-shadow flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <span
          className={`text-xs font-medium px-2 py-1 rounded-full border ${CATEGORY_STYLES[item.category] || 'bg-slate-100 text-slate-800 border-slate-300'}`}
        >
          {item.category}
        </span>
        <span className={`text-xs font-semibold ${urgent ? 'text-red-600' : 'text-slate-500'}`}>
          {days >= 0 ? `${days}d left` : 'Expired'}
        </span>
      </div>

      <h3 className="font-semibold text-slate-900 leading-snug">{item.title}</h3>

      {item.organization && <p className="text-sm text-slate-500">{item.organization}</p>}

      {item.description && (
        <p className="text-sm text-slate-600 line-clamp-3">{item.description}</p>
      )}

      {item.eligibility?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {item.eligibility.map((tag) => (
            <span key={tag} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-auto">
        <a
          href={item.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:underline"
        >
          Official link ↗
        </a>
        <a
          href={generateGCalLink(item)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium bg-slate-900 text-white px-3 py-1.5 rounded-lg hover:bg-slate-700 transition-colors"
        >
          + Add to Calendar
        </a>
      </div>
    </div>
  );
}
