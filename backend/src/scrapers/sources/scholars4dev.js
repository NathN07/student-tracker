import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * REAL ADAPTER — Scholars4Dev scholarship listings (RSS feed).
 *
 * Scholars4Dev is a genuinely live, publicly accessible WordPress RSS feed
 * listing international scholarships — many explicitly open to students from
 * developing countries, including India. Confirmed real feed at:
 * https://www.scholars4dev.com/feed/
 *
 * This is broader than India-only, but not blocked by robots.txt (unlike the
 * India-specific government portals we tried first, which either require
 * login/Aadhaar registration to browse or explicitly disallow automated
 * access). It's a reasonable stand-in for real, live scholarship data until
 * a genuinely open India-specific source is found.
 *
 * NOTE: RSS feeds like this rarely have a clean, separate "deadline" field —
 * the deadline (if mentioned at all) is usually buried in the description
 * text. This adapter tries a few common phrasings; anything it can't extract
 * gets skipped and logged by the normalizer rather than guessed at.
 */

const FEED_URL = 'https://www.scholars4dev.com/feed/';
const CATEGORY = 'scholarship';

export async function fetchItems() {
  const { data: xml } = await axios.get(FEED_URL, {
    timeout: 10000,
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; StudentTrackerBot/1.0)' },
  });

  const $ = cheerio.load(xml, { xmlMode: true });
  const items = [];

  $('item').each((_, el) => {
    const title = $(el).find('title').text().trim();
    const link = $(el).find('link').text().trim();
    const pubDate = $(el).find('pubDate').text().trim();
    const rawDescription = $(el).find('description').text();
    const cleanDescription = rawDescription.replace(/<[^>]+>/g, '').trim();

    const deadline = extractDeadline(cleanDescription) || extractDeadline(title);

    // Skip items with no extractable deadline at all rather than guessing —
    // pubDate is when it was POSTED, not the application deadline, so it's
    // not a safe fallback here.
    if (!deadline) return;

    items.push({
      title,
      category: CATEGORY,
      organization: '', // not reliably present in the feed text
      deadline,
      eligibility: [],
      description: cleanDescription.slice(0, 300),
      sourceUrl: link,
    });
  });

  return items;
}

/**
 * Looks for common "deadline: <date>" phrasings in scholarship listing text.
 * Returns the raw matched date string (normalizer parses it via chrono-node),
 * or null if nothing matched.
 */
function extractDeadline(text) {
  if (!text) return null;

  const patterns = [
    /deadline\s*(?:is|:)?\s*([A-Za-z]+ \d{1,2},? \d{4})/i,
    /deadline\s*(?:is|:)?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i,
    /due\s*(?:is|:)?\s*([A-Za-z]+ \d{1,2},? \d{4})/i,
    /closes?\s*(?:is|:)?\s*([A-Za-z]+ \d{1,2},? \d{4})/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1];
  }

  return null;
}
