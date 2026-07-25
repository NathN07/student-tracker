/**
 * Realistic sample of what adapters actually hand back in the wild —
 * messy dates, inconsistent org naming, and deliberate duplicates across
 * "sources" to exercise the dedup logic. Used only by scripts/dry-run-seed.js
 * to validate the pipeline without needing network/DB access.
 */
export const sampleRawItems = [
  // A scholarship posted on two different aggregator sites with slightly
  // different formatting — should collapse to ONE record via dedup.
  {
    title: '  National Means-cum-Merit Scholarship 2026  ',
    category: 'scholarship',
    organization: 'Ministry of Education',
    deadline: '31st March, 2026',
    eligibility: ['Class 8', 'Below poverty line'],
    description: 'Scholarship for meritorious students from economically weaker sections.',
    sourceUrl: 'https://scholarships.gov.in/nmms-2026',
  },
  {
    title: 'National Means-Cum-Merit Scholarship 2026',
    category: 'scholarship',
    organization: 'ministry of education',
    deadline: '31/03/2026',
    eligibility: ['class-8'],
    description: 'NMMS scholarship — reposted on aggregator site.',
    sourceUrl: 'https://scholarshipaggregator.example.com/nmms',
  },

  // A hackathon with a relative-ish/annotated date string
  {
    title: 'Smart India Hackathon 2026',
    category: 'hackathon',
    organization: 'AICTE',
    deadline: 'Last date to apply: August 15, 2026 (extended)',
    eligibility: ['undergrad', 'postgrad'],
    description: 'National hackathon for tech innovation across problem statements.',
    sourceUrl: 'https://sih.gov.in/2026',
  },

  // An exam notice with a genuinely unparseable/garbled date — should be
  // skipped and logged, not silently dropped or crash the whole run.
  {
    title: 'UPSC Civil Services Preliminary Exam',
    category: 'exam',
    organization: 'UPSC',
    deadline: 'TBD - check official notification',
    eligibility: ['graduate'],
    description: 'Preliminary exam for civil services recruitment.',
    sourceUrl: 'https://upsc.gov.in/cse-2026',
  },

  // A clean, well-formed item — the easy case
  {
    title: 'Google Summer of Code 2026',
    category: 'hackathon',
    organization: 'Google',
    deadline: '2026-04-02',
    eligibility: ['student', '18+'],
    description: 'Open source contribution program for students.',
    sourceUrl: 'https://summerofcode.withgoogle.com',
  },

  // Real shape from the Devpost adapter (src/scrapers/sources/devpost-hackathons.js) —
  // date range string already reduced to just the end date by extractEndDate()
  {
    title: 'Google Cloud Rapid Agent Hackathon',
    category: 'hackathon',
    organization: 'Google',
    deadline: 'Jun 11, 2026', // extracted from "May 05 - Jun 11, 2026"
    eligibility: [],
    description: 'Databases, Machine Learning/AI, Open Ended',
    sourceUrl: 'https://rapid-agent.devpost.com/',
  },
];
