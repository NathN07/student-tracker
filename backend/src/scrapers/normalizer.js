import Opportunity from '../models/Opportunity.js';
import { buildDedupKey, parseDeadline, normalizeEligibility } from '../utils/normalize.js';

/**
 * Takes raw items from a single source adapter and upserts them into the DB
 * as unified Opportunity documents. This is the ONLY place that talks to the
 * DB during ingestion — adapters stay dumb (fetch + return raw shape).
 *
 * @param {Array<Object>} rawItems - loosely-shaped objects from an adapter
 * @param {string} sourceName - identifies which adapter this came from (for logs/dedup)
 * @returns {Object} summary of the run: { found, upserted, skipped, errors }
 */
export async function normalizeAndSave(rawItems, sourceName) {
  const summary = { found: rawItems.length, upserted: 0, skipped: 0, errors: [] };

  for (const raw of rawItems) {
    try {
      const deadline = raw.deadline instanceof Date ? raw.deadline : parseDeadline(raw.deadline);

      if (!deadline) {
        summary.skipped += 1;
        summary.errors.push({ title: raw.title, reason: 'unparseable deadline', raw: raw.deadline });
        continue;
      }

      const doc = {
        title: raw.title?.trim(),
        category: raw.category, // adapter must set this ('scholarship' | 'hackathon' | 'exam')
        organization: raw.organization?.trim() || '',
        deadline,
        eligibility: normalizeEligibility(raw.eligibility || []),
        description: raw.description?.trim() || '',
        sourceUrl: raw.sourceUrl,
        sourceName,
        isActive: deadline > new Date(),
        scrapedAt: new Date(),
      };

      doc.dedupKey = buildDedupKey(doc);

      // Upsert: if this exact title+org+deadline combo already exists (even from
      // a different source), update it rather than creating a duplicate card.
      await Opportunity.findOneAndUpdate(
        { dedupKey: doc.dedupKey },
        { $set: doc },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      summary.upserted += 1;
    } catch (err) {
      summary.errors.push({ title: raw.title, reason: err.message });
    }
  }

  return summary;
}

/**
 * Call this daily (or on-demand) to flip isActive=false on anything whose
 * deadline has passed. Keeps the "active" query fast without deleting history.
 */
export async function deactivateExpired() {
  const result = await Opportunity.updateMany(
    { deadline: { $lt: new Date() }, isActive: true },
    { $set: { isActive: false } }
  );
  return result.modifiedCount;
}
