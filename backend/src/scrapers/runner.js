import 'dotenv/config';
import mongoose from 'mongoose';
import cron from 'node-cron';
import { normalizeAndSave, deactivateExpired } from './normalizer.js';
import ScrapeLog from '../models/ScrapeLog.js';

// Register every adapter here. Adding a new source = one import + one line.
import * as devpostHackathons from './sources/devpost-hackathons.js';
// import * as scholars4dev from './sources/scholars4dev.js';
// ^ Disabled for now: this feed silently returns 0 items when fetched from
// cloud/datacenter IPs (like GitHub Actions runners) even though it serves
// real content normally — a common anti-bot pattern. The adapter file is
// left in place in case a workaround (e.g. a different fetch method, or a
// genuinely open India-specific source) is found later.

const SOURCES = [
  { name: 'devpost-hackathons', adapter: devpostHackathons }, // real, live data
];

async function runAllSources() {
  console.log(`[${new Date().toISOString()}] Starting scrape run for ${SOURCES.length} sources...`);

  for (const { name, adapter } of SOURCES) {
    try {
      const rawItems = await adapter.fetchItems();
      const summary = await normalizeAndSave(rawItems, name);

      await ScrapeLog.create({
        sourceName: name,
        itemsFound: summary.found,
        itemsUpserted: summary.upserted,
        itemsSkipped: summary.skipped,
        errors: summary.errors,
        success: true,
      });

      console.log(
        `  ✓ ${name}: found ${summary.found}, upserted ${summary.upserted}, skipped ${summary.skipped}`
      );
    } catch (err) {
      // One source failing should never take down the whole run
      await ScrapeLog.create({
        sourceName: name,
        success: false,
        fatalError: err.message,
      });
      console.error(`  ✗ ${name} FAILED: ${err.message}`);
    }
  }

  const deactivatedCount = await deactivateExpired();
  console.log(`Deactivated ${deactivatedCount} expired listings.`);
  console.log(`[${new Date().toISOString()}] Scrape run complete.\n`);
}

async function main() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/student-tracker');
  console.log('Connected to MongoDB for scraper runner.');

  // Run once immediately on startup, useful for local testing / manual `npm run scrape`
  await runAllSources();

  // If invoked with --once, exit after the single run (useful for `npm run scrape`)
  if (process.argv.includes('--once')) {
    await mongoose.disconnect();
    process.exit(0);
  }

  // Otherwise, schedule daily via node-cron
  const schedule = process.env.CRON_SCHEDULE || '0 3 * * *'; // 3 AM daily by default
  cron.schedule(schedule, runAllSources);
  console.log(`Cron scheduled: "${schedule}"`);
}

main().catch((err) => {
  console.error('Fatal error in scraper runner:', err);
  process.exit(1);
});
