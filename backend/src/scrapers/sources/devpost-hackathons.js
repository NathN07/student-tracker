import axios from 'axios';

/**
 * REAL ADAPTER — Devpost hackathon listings.
 *
 * Devpost's own website (devpost.com/hackathons) loads its listings from this
 * JSON endpoint client-side. It's not an officially documented API, but it's
 * plain JSON, requires no authentication, and is what Devpost's own frontend
 * calls — so no puppeteer/JS-rendering needed, just a normal HTTP GET.
 *
 * NOTE: being unofficial, Devpost could change this endpoint's shape without
 * notice. If this adapter starts returning 0 items or throwing, that's the
 * first thing to check — inspect the Network tab on devpost.com/hackathons
 * in a browser to see the current request shape.
 */

const CATEGORY = 'hackathon';

export async function fetchItems() {
  const { data } = await axios.get('https://devpost.com/api/hackathons', {
    params: {
      'status[]': 'open', // only currently-open hackathons — matches what a student actually wants
      order_by: 'submission-deadline',
    },
    timeout: 10000,
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; StudentTrackerBot/1.0)' },
  });

  const hackathons = data?.hackathons || [];

  return hackathons.map((h) => ({
    title: h.title,
    category: CATEGORY,
    organization: h.organization_name || '',
    // "submission_period_dates" looks like "May 05 - Jun 11, 2026" — the
    // deadline is the END of that range, i.e. the text after the last " - ".
    deadline: extractEndDate(h.submission_period_dates),
    eligibility: [], // Devpost doesn't expose structured eligibility; themes are closer to topic tags
    description: extractThemeNames(h.themes).join(', '),
    sourceUrl: h.url,
  }));
}

/**
 * Devpost's "themes" field can be an array of plain strings OR an array of
 * objects like { name: "Databases" } depending on the endpoint version.
 * Handle both shapes so we never end up with "[object Object]" in the description.
 */
function extractThemeNames(themes) {
  if (!Array.isArray(themes)) return [];
  return themes.map((t) => (typeof t === 'string' ? t : t?.name)).filter(Boolean);
}

/**
 * "May 05 - Jun 11, 2026" -> "Jun 11, 2026"
 * "Dec 28, 2025 - Jan 05, 2026" -> "Jan 05, 2026"
 * Falls back to the raw string if the format doesn't match — the normalizer's
 * date parser will attempt it and skip/log if it still can't be parsed.
 */
function extractEndDate(rangeText) {
  if (!rangeText) return null;
  const parts = rangeText.split(' - ');
  return parts[parts.length - 1].trim();
}
