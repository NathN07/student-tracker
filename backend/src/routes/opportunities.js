import express from 'express';
import Opportunity from '../models/Opportunity.js';

const router = express.Router();

/**
 * GET /api/opportunities
 * Returns active listings for the dashboard. Frontend does its own client-side
 * filtering/sorting on this payload — this endpoint just needs to hand back a
 * reasonably-sized, relevant slice (not every filter combination as a query param).
 *
 * Query params (all optional):
 *   category   - 'scholarship' | 'hackathon' | 'exam'
 *   activeOnly - 'true' (default) | 'false' — set false to include expired listings
 *   limit      - max results (default 500, caps client payload size)
 */
router.get('/', async (req, res) => {
  try {
    const { category, activeOnly = 'true', limit = 500 } = req.query;

    const query = {};
    if (activeOnly === 'true') query.isActive = true;
    if (category) query.category = category;

    const items = await Opportunity.find(query)
      .sort({ deadline: 1 })
      .limit(Math.min(Number(limit) || 500, 2000)) // hard cap regardless of what's requested
      .lean();

    res.json({ count: items.length, items });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch opportunities', details: err.message });
  }
});

/**
 * GET /api/opportunities/search?q=...
 * Server-side text search — only needed once dataset outgrows comfortable
 * client-side filtering (see MongoDB text index defined in the model).
 */
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || !q.trim()) {
      return res.status(400).json({ error: 'Query param "q" is required' });
    }

    const items = await Opportunity.find(
      { $text: { $search: q }, isActive: true },
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(100)
      .lean();

    res.json({ count: items.length, items });
  } catch (err) {
    res.status(500).json({ error: 'Search failed', details: err.message });
  }
});

/**
 * GET /api/opportunities/:id
 * Single item detail (useful if you later add a detail view/page).
 */
router.get('/:id', async (req, res) => {
  try {
    const item = await Opportunity.findById(req.params.id).lean();
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json(item);
  } catch (err) {
    res.status(400).json({ error: 'Invalid id', details: err.message });
  }
});

export default router;
