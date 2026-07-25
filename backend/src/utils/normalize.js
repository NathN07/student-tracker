import crypto from 'crypto';
import * as chrono from 'chrono-node';

/**
 * Builds a stable dedup key from title + organization + deadline.
 * Same scholarship posted on 3 different aggregator sites should collapse to one record.
 */
export function buildDedupKey({ title, organization, deadline }) {
  const normalizedTitle = (title || '').trim().toLowerCase().replace(/\s+/g, ' ');
  const normalizedOrg = (organization || '').trim().toLowerCase().replace(/\s+/g, ' ');
  const dateStr = deadline ? new Date(deadline).toISOString().slice(0, 10) : 'no-date';

  return crypto
    .createHash('md5')
    .update(`${normalizedTitle}|${normalizedOrg}|${dateStr}`)
    .digest('hex');
}

/**
 * Parses messy real-world date strings from government/hackathon sites.
 * Handles: "31st March, 2026", "31/03/2026", "March 31 2026 (extended)", etc.
 * Returns null if nothing parseable is found — caller should decide how to handle that
 * (e.g. flag for manual review rather than silently dropping the listing).
 */
export function parseDeadline(rawDateString) {
  if (!rawDateString) return null;

  // Strip common noise words that confuse the parser
  const cleaned = rawDateString
    .replace(/\(extended\)|\(revised\)|\(tentative\)/gi, '')
    .replace(/last date to apply:?/gi, '')
    .replace(/deadline:?/gi, '')
    .trim();

  const results = chrono.parse(cleaned, new Date(), { forwardDate: true });
  if (!results.length) return null;

  return results[0].start.date();
}

/**
 * Normalizes eligibility text into consistent lowercase tags.
 * Adapters may pass free text ("Undergraduate students", "UG") — this doesn't
 * do full NLP tagging, just basic cleanup. Tag taxonomy can be tightened later.
 */
export function normalizeEligibility(rawTags = []) {
  return rawTags
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean)
    .filter((t, i, arr) => arr.indexOf(t) === i); // dedupe
}
