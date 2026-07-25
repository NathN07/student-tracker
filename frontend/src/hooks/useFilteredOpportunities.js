import { useMemo } from 'react';

/**
 * Pure client-side filter + sort — instant, no network round-trip per click.
 * Keep this the single source of truth for "what does the dashboard show"
 * so category/tag/search logic doesn't get duplicated across components.
 */
export function useFilteredOpportunities(items, { category, eligibilityTag, searchQuery }) {
  return useMemo(() => {
    let result = items;

    if (category && category !== 'all') {
      result = result.filter((item) => item.category === category);
    }

    if (eligibilityTag) {
      result = result.filter((item) => item.eligibility?.includes(eligibilityTag.toLowerCase()));
    }

    if (searchQuery?.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (item) =>
          item.title.toLowerCase().includes(q) || item.organization?.toLowerCase().includes(q)
      );
    }

    // Always sort by approaching deadline — soonest first
    return [...result].sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
  }, [items, category, eligibilityTag, searchQuery]);
}
