import { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Fetches the active listings ONCE per mount. All filtering/sorting after
 * that happens client-side (see useFilteredOpportunities) — no re-fetching
 * on every filter click.
 */
export function useOpportunities() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/api/opportunities?limit=2000`);
        if (!res.ok) throw new Error(`API returned ${res.status}`);
        const data = await res.json();
        if (!cancelled) setItems(data.items);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => {
      cancelled = true;
    };
  }, []);

  return { items, loading, error };
}
