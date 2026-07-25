# Open-Data Student Academic & Opportunity Tracker

Aggregates scattered scholarship/hackathon/exam announcements into a searchable
dashboard with one-click Google Calendar deadline sync.

## Project structure

```
student-tracker/
├── backend/
│   ├── src/
│   │   ├── models/
│   │   │   ├── Opportunity.js      # unified schema for all scraped listings
│   │   │   └── ScrapeLog.js        # per-run logging for debugging silent scrape failures
│   │   ├── scrapers/
│   │   │   ├── sources/            # ONE FILE PER SOURCE — isolated, swappable
│   │   │   │   ├── example-rss-source.js    # still a placeholder template
│   │   │   │   └── devpost-hackathons.js    # REAL — live hackathon data, no key needed
│   │   │   ├── normalizer.js       # maps any adapter's raw output -> unified schema, upserts
│   │   │   └── runner.js           # node-cron entrypoint, orchestrates all adapters
│   │   ├── routes/
│   │   │   └── opportunities.js    # GET /api/opportunities, /search, /:id
│   │   ├── utils/
│   │   │   └── normalize.js        # dedup key generation, chrono-node date parsing
│   │   └── server.js               # Express app entrypoint
│   ├── scripts/
│   │   ├── sample-raw-data.js      # messy realistic sample data (incl. deliberate dupes)
│   │   └── dry-run-seed.js         # validates normalize/dedup logic w/o DB or network
│   ├── package.json
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── OpportunityCard.jsx # card w/ category badge + Calendar button
    │   │   └── FilterBar.jsx       # search + category filter controls
    │   ├── hooks/
    │   │   ├── useOpportunities.js          # fetches active listings once
    │   │   └── useFilteredOpportunities.js  # pure client-side filter/sort
    │   ├── utils/
    │   │   └── googleCalendar.js   # generates "quick add" GCal links (no OAuth needed)
    │   ├── App.jsx
    │   └── main.jsx
    ├── package.json
    └── .env.example
```

## Getting started

### Backend
```bash
cd backend
cp .env.example .env     # then edit MONGO_URI if not using local default
npm install
npm run dev               # starts Express API on :5000
```

Run a one-off scrape (useful while developing adapters):
```bash
npm run scrape -- --once
```

Or let it run on the daily cron schedule (default 3 AM):
```bash
npm run scrape
```

### Frontend
```bash
cd frontend
cp .env.example .env
npm install
npm run dev                # starts Vite dev server on :5173
```

### Validate the pipeline logic (no DB/network needed)

Before wiring up a real MongoDB instance, you can sanity-check the
normalize → dedup → save logic against realistic messy sample data:

```bash
cd backend
node scripts/dry-run-seed.js
```

This exercises the same dedup-key and date-parsing logic as production code
against sample data that includes a duplicate posting (same scholarship from
two "sources") and a deliberately garbled date, and prints what would be
saved, merged, or skipped. It's a fast way to confirm the pipeline behaves
correctly before you touch a real database.

> Note: this script uses a small inline fallback date parser instead of
> `chrono-node` (since that requires `npm install`). Production code
> (`src/utils/normalize.js`) uses the real `chrono-node` parser, which
> handles a much wider range of messy real-world date formats — don't copy
> the fallback into production.

## Next steps (in priority order)

1. ~~Replace the example adapters with real sources~~ — **done**: `devpost-hackathons.js`
   pulls real, live hackathon listings with no API key needed. `example-rss-source.js`
   is still a placeholder — swap it for a real scholarship/exam source next
   (e.g. a government portal's RSS feed, once you find one that's actually live).
2. Run `npm run scrape -- --once` and check Compass — you should now see real
   hackathon documents in the `opportunities` collection.
3. Add more adapters incrementally — one file + one line in `runner.js` each time.
4. Once you have real users, consider upgrading Calendar sync from the
   current "quick add" link (no auth) to full OAuth + Calendar API
   (`calendar.events.insert`) for true one-click sync without a redirect tab.
5. If your active listing count grows past what's comfortable to ship to the
   browser (~5–10k documents), switch the frontend to use the
   `/api/opportunities/search` endpoint (MongoDB text index) instead of
   client-side filtering on the full dataset.
6. Consider adding a PDF-text-extraction step (`pdf-parse`) to the ingestion
   pipeline — many government scholarship notices are PDF-only, not HTML/RSS.

## Design notes

- **Adapters stay dumb.** Each source file in `scrapers/sources/` only fetches
  and returns raw data — it never touches the database. `normalizer.js` is the
  single place that maps raw shapes to the unified schema and upserts. This
  means a broken adapter never corrupts the DB layer, and you can unit-test
  adapters in isolation.
- **Dedup, don't just insert.** The same scholarship often gets reposted
  across multiple aggregator sites. Every listing gets a `dedupKey` (hash of
  normalized title+organization+deadline) and upserts use that key.
- **Don't delete expired listings.** `isActive` flips to `false` once the
  deadline passes (see `deactivateExpired()` in `normalizer.js`). This keeps
  history for future features (e.g. "here's what was posted around this time
  last year") without needing separate archival logic.
- **Calendar sync ships without OAuth for MVP.** The Google Calendar "quick
  add" URL scheme (`calendar.google.com/calendar/render?...`) requires zero
  backend auth setup and satisfies the one-click requirement. Swap to the real
  Calendar API only once you have a concrete reason (e.g. users wanting sync
  without leaving the page).
