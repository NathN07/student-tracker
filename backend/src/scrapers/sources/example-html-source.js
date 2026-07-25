import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * TEMPLATE ADAPTER — static HTML listing page (most government sites).
 * Replace URL + selectors once you've picked a real target and inspected its markup.
 *
 * IMPORTANT: this pattern is brittle by design — sites change their HTML without
 * notice. That's exactly why each source gets its own isolated file: when this
 * one breaks, only this file needs fixing, nothing else in the pipeline.
 */

const LISTING_URL = 'https://example.gov/notices/exams'; // placeholder
const CATEGORY = 'exam';

export async function fetchItems() {
  const { data: html } = await axios.get(LISTING_URL, {
    timeout: 10000,
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; StudentTrackerBot/1.0)' },
  });

  const $ = cheerio.load(html);
  const items = [];

  // Adjust selectors to match the real target site's structure
  $('.notice-row').each((_, el) => {
    const title = $(el).find('.notice-title').text().trim();
    const relativeLink = $(el).find('a').attr('href');
    const deadlineText = $(el).find('.notice-date').text().trim();
    const org = $(el).find('.notice-org').text().trim();

    if (!title) return; // skip empty/malformed rows rather than crashing the whole run

    items.push({
      title,
      category: CATEGORY,
      organization: org,
      deadline: deadlineText, // raw string, normalizer will parse via chrono-node
      eligibility: [],
      description: '',
      sourceUrl: relativeLink?.startsWith('http')
        ? relativeLink
        : new URL(relativeLink, LISTING_URL).toString(),
    });
  });

  return items;
}

/**
 * NOTE: If this site renders listings via JavaScript (check by viewing page
 * source vs. rendered DOM), swap axios+cheerio for puppeteer instead:
 *
 *   import puppeteer from 'puppeteer';
 *   const browser = await puppeteer.launch();
 *   const page = await browser.newPage();
 *   await page.goto(LISTING_URL, { waitUntil: 'networkidle2' });
 *   const html = await page.content();
 *   await browser.close();
 *   // then load `html` into cheerio as above
 *
 * Puppeteer is much slower and heavier — only reach for it when cheerio
 * genuinely returns empty/incomplete data on a JS-rendered page.
 */
