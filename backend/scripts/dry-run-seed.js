import crypto from 'crypto';
import { sampleRawItems } from './sample-raw-data.js';

/**
 * DRY-RUN / OFFLINE VALIDATION SCRIPT
 * ------------------------------------
 * This is NOT the production seeding path. It exists to prove the
 * normalize -> dedup -> save pipeline logic is correct using realistic
 * messy sample data, without requiring MongoDB or network access.
 *
 * The real seeding command is: `npm run scrape -- --once`
 * (defined in src/scrapers/runner.js), which requires:
 *   - `npm install` to succeed (network access to the npm registry)
 *   - a reachable MongoDB instance (MONGO_URI in .env)
 *   - real, network-fetchable source adapters
 *
 * Run this instead with: `node scripts/dry-run-seed.js`
 *
 * NOTE on date parsing: production code (src/utils/normalize.js) uses
 * `chrono-node` for robust natural-language date parsing. That package
 * isn't installed in this sandbox, so this script uses a small inline
 * fallback parser — good enough to prove the pipeline shape, but NOT
 * a substitute for chrono-node's real parsing power. Don't copy this
 * fallback parser into production code.
 */

// --- Minimal fallback date parser (sandbox-only substitute for chrono-node) ---
function fallbackParseDeadline(raw) {
  if (!raw) return null;

  const cleaned = raw
    .replace(/\(extended\)|\(revised\)|\(tentative\)/gi, '')
    .replace(/last date to apply:?/gi, '')
    .replace(/deadline:?/gi, '')
    .trim();

  // ISO format
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) return new Date(cleaned);

  // DD/MM/YYYY
  const slashMatch = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const [, d, m, y] = slashMatch;
    return new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`);
  }

  // "31st March, 2026" / "March 31 2026" style — strip ordinal suffixes, let Date try
  const ordinalStripped = cleaned.replace(/(\d+)(st|nd|rd|th)/gi, '$1');
  const parsed = new Date(ordinalStripped);
  if (!isNaN(parsed.getTime())) return parsed;

  return null; // genuinely unparseable — e.g. "TBD - check official notification"
}

// --- Same dedup key logic as production utils/normalize.js (pure, no deps) ---
function buildDedupKey({ title, organization, deadline }) {
  const normalizedTitle = (title || '').trim().toLowerCase().replace(/\s+/g, ' ');
  const normalizedOrg = (organization || '').trim().toLowerCase().replace(/\s+/g, ' ');
  const dateStr = deadline ? new Date(deadline).toISOString().slice(0, 10) : 'no-date';

  return crypto
    .createHash('md5')
    .update(`${normalizedTitle}|${normalizedOrg}|${dateStr}`)
    .digest('hex');
}

function normalizeEligibility(rawTags = []) {
  return rawTags
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean)
    .filter((t, i, arr) => arr.indexOf(t) === i);
}

// --- Run the dry-run pipeline ---
function runDryRun() {
  console.log(`Processing ${sampleRawItems.length} raw sample items...\n`);

  const upsertedByKey = new Map(); // simulates Mongo's upsert-by-dedupKey behavior
  const skipped = [];

  for (const raw of sampleRawItems) {
    const deadline = fallbackParseDeadline(raw.deadline);

    if (!deadline) {
      skipped.push({ title: raw.title, reason: 'unparseable deadline', raw: raw.deadline });
      continue;
    }

    const doc = {
      title: raw.title.trim(),
      category: raw.category,
      organization: raw.organization?.trim() || '',
      deadline,
      eligibility: normalizeEligibility(raw.eligibility || []),
      description: raw.description?.trim() || '',
      sourceUrl: raw.sourceUrl,
      isActive: deadline > new Date(),
    };

    doc.dedupKey = buildDedupKey(doc);

    const isUpdate = upsertedByKey.has(doc.dedupKey);
    upsertedByKey.set(doc.dedupKey, doc); // last write wins, same as findOneAndUpdate upsert

    console.log(
      `  ${isUpdate ? '↻ MERGED (dedup hit)' : '✓ NEW'} — "${doc.title}" → deadline: ${
        doc.deadline.toISOString().slice(0, 10)
      }`
    );
  }

  console.log(`\n--- Skipped (unparseable) ---`);
  if (skipped.length === 0) console.log('  (none)');
  skipped.forEach((s) => console.log(`  ✗ "${s.title}" — raw: "${s.raw}"`));

  console.log(`\n--- Final "database" state (${upsertedByKey.size} unique documents) ---`);
  for (const doc of upsertedByKey.values()) {
    console.log(JSON.stringify(doc, null, 2));
  }

  console.log(`\nSummary: ${sampleRawItems.length} raw → ${upsertedByKey.size} unique saved, ${skipped.length} skipped.`);
  console.log(
    `Dedup collapsed ${sampleRawItems.length - upsertedByKey.size - skipped.length} duplicate posting(s) as expected.`
  );
}

runDryRun();
