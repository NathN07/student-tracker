import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * One document per adapter run. Essential for debugging silent failures —
 * e.g. a source's HTML changed and the adapter now returns 0 items with no crash.
 */
const scrapeLogSchema = new Schema({
  sourceName: { type: String, required: true, index: true },
  runAt: { type: Date, default: Date.now, index: true },
  itemsFound: { type: Number, default: 0 },
  itemsUpserted: { type: Number, default: 0 },
  itemsSkipped: { type: Number, default: 0 },
  errors: [{ title: String, reason: String, raw: Schema.Types.Mixed }],
  success: { type: Boolean, default: true },
  fatalError: { type: String, default: null }, // set if the whole adapter threw
});

export default mongoose.model('ScrapeLog', scrapeLogSchema);
