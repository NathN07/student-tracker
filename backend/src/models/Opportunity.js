import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * Unified schema — every scraper adapter's output gets normalized into this shape
 * before it's saved. This is the contract between ingestion and the API/frontend.
 */
const opportunitySchema = new Schema(
  {
    title: { type: String, required: true, trim: true },

    category: {
      type: String,
      required: true,
      enum: ['scholarship', 'hackathon', 'exam'],
      index: true,
    },

    organization: { type: String, trim: true },

    deadline: { type: Date, required: true, index: true },

    eligibility: [{ type: String, trim: true, lowercase: true }], // tags e.g. 'undergrad', 'class-12', 'women'

    description: { type: String, default: '' },

    sourceUrl: { type: String, required: true },
    sourceName: { type: String, required: true }, // which adapter/site this came from

    // Dedup key: normalized hash of title+organization+deadline
    // Prevents the same scholarship reposted across aggregators from duplicating
    dedupKey: { type: String, required: true, unique: true, index: true },

    isActive: { type: Boolean, default: true, index: true }, // flip false once deadline passes; don't delete

    scrapedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Compound index for the dashboard's default query pattern (active items sorted by deadline)
opportunitySchema.index({ isActive: 1, deadline: 1 });

// Text index for server-side search once client-side filtering isn't enough
opportunitySchema.index({ title: 'text', description: 'text', organization: 'text' });

export default mongoose.model('Opportunity', opportunitySchema);
