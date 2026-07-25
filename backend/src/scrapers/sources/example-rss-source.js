import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * TEMPLATE ADAPTER — RSS/Atom feed source.
 * Replace the URL and field mapping with a real feed once you've picked sources.
 *
 * Contract: every adapter exports a single async `fetchItems()` that returns
 * an array of loosely-shaped raw objects. Don't touch the DB here — that's
 * the normalizer's job. This keeps adapters swappable and easy to test in isolation.
 */

const FEED_URL = 'https://example.com/scholarships/rss'; // placeholder — replace with real feed
const CATEGORY = 'scholarship'; // this adapter always produces one category

export async function fetchItems() {
  const { data: xml } = await axios.get(FEED_URL, { timeout: 10000 });
  const $ = cheerio.load(xml, { xmlMode: true });

  const items = [];

  $('item').each((_, el) => {
    const title = $(el).find('title').text();
    const link = $(el).find('link').text();
    const description = $(el).find('description').text();
    const pubDate = $(el).find('pubDate').text();

    // RSS feeds rarely have a clean "deadline" field — you'll often need to
    // extract it from the description text itself. This is a naive example;
    // real feeds will need per-source regex/parsing tweaks.
    const deadlineMatch = description.match(/last date[:\s]*([^\n<]+)/i);

    items.push({
      title,
      category: CATEGORY,
      organization: '', // fill in if the feed provides it
      deadline: deadlineMatch ? deadlineMatch[1].trim() : pubDate, // raw string — normalizer parses it
      eligibility: [], // RSS feeds rarely have structured eligibility; often needs manual tagging
      description: description.replace(/<[^>]+>/g, '').trim(),
      sourceUrl: link,
    });
  });

  return items;
}
