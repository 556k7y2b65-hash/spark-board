#!/usr/bin/env node
/**
 * Upserts SimilarWeb data fetched 2026-04-19 into Supabase.
 * Tables: web_traffic, traffic_sources, demographics
 */
require('dotenv').config({ path: '/Users/cameronsmacmini/projects/spark-board/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// Brand mapping
const BRANDS = {
  'werenotreallystrangers.com': 'WNRS',
  'hinge.co': 'Hinge',
  'bumble.com': 'Bumble',
  'cardsagainsthumanity.com': 'CAH',
};

// ── 1. web_traffic ──────────────────────────────────────────────────────────
const trafficRows = [
  // WNRS
  { domain: 'werenotreallystrangers.com', month: '2025-12-01', visits: 215632.77, unique_visitors: 122084.98, bounce_rate: 0.3836, avg_visit_duration: 85.95, pages_per_visit: 3.1222 },
  { domain: 'werenotreallystrangers.com', month: '2026-01-01', visits: 198466.35, unique_visitors: 110680.07, bounce_rate: 0.4229, avg_visit_duration: 76.41, pages_per_visit: 2.8468 },
  { domain: 'werenotreallystrangers.com', month: '2026-02-01', visits: 184068.69, unique_visitors: 106545.28, bounce_rate: 0.4078, avg_visit_duration: 50.34, pages_per_visit: 2.8474 },
  { domain: 'werenotreallystrangers.com', month: '2026-03-01', visits: 163180.16, unique_visitors: 88836.03,  bounce_rate: 0.4274, avg_visit_duration: 59.10, pages_per_visit: 2.9077 },
  // Hinge
  { domain: 'hinge.co', month: '2025-12-01', visits: 1810907.50, unique_visitors: 1143916.30, bounce_rate: 0.5259, avg_visit_duration: 58.05, pages_per_visit: 1.8713 },
  { domain: 'hinge.co', month: '2026-01-01', visits: 2119603.83, unique_visitors: 1328502.44, bounce_rate: 0.5257, avg_visit_duration: 57.24, pages_per_visit: 1.8929 },
  { domain: 'hinge.co', month: '2026-02-01', visits: 1840630.96, unique_visitors: 1134093.47, bounce_rate: 0.5205, avg_visit_duration: 50.87, pages_per_visit: 1.8037 },
  { domain: 'hinge.co', month: '2026-03-01', visits: 2039036.02, unique_visitors: 1265079.93, bounce_rate: 0.5334, avg_visit_duration: 51.00, pages_per_visit: 1.8713 },
  // Bumble
  { domain: 'bumble.com', month: '2025-12-01', visits: 11484127.22, unique_visitors: 3195943.75, bounce_rate: 0.3064, avg_visit_duration: 289.91, pages_per_visit: 3.1728 },
  { domain: 'bumble.com', month: '2026-01-01', visits: 11523097.55, unique_visitors: 3109194.72, bounce_rate: 0.3159, avg_visit_duration: 266.78, pages_per_visit: 3.0740 },
  { domain: 'bumble.com', month: '2026-02-01', visits: 10013781.65, unique_visitors: 2785005.93, bounce_rate: 0.3057, avg_visit_duration: 254.24, pages_per_visit: 3.0357 },
  { domain: 'bumble.com', month: '2026-03-01', visits: 11311174.04, unique_visitors: 3086319.82, bounce_rate: 0.2980, avg_visit_duration: 261.54, pages_per_visit: 3.1396 },
  // CAH
  { domain: 'cardsagainsthumanity.com', month: '2025-12-01', visits: 349060.47, unique_visitors: 220391.98, bounce_rate: 0.4792, avg_visit_duration: 47.59, pages_per_visit: 1.9793 },
  { domain: 'cardsagainsthumanity.com', month: '2026-01-01', visits: 285904.70, unique_visitors: 169406.25, bounce_rate: 0.4468, avg_visit_duration: 41.65, pages_per_visit: 2.0187 },
  { domain: 'cardsagainsthumanity.com', month: '2026-02-01', visits: 213259.67, unique_visitors: 128993.11, bounce_rate: 0.4487, avg_visit_duration: 31.69, pages_per_visit: 2.0227 },
  { domain: 'cardsagainsthumanity.com', month: '2026-03-01', visits: 197050.76, unique_visitors: 117313.15, bounce_rate: 0.4589, avg_visit_duration: 38.78, pages_per_visit: 1.9251 },
].map(r => ({ ...r, brand: BRANDS[r.domain], fetched_at: new Date().toISOString() }));

// ── 2. traffic_sources ──────────────────────────────────────────────────────
const sourcesRaw = {
  'werenotreallystrangers.com': [
    { date: '2025-12-01', source_type: 'Direct',        visits: 88817.43  },
    { date: '2025-12-01', source_type: 'Display Ads',   visits: 560.23    },
    { date: '2025-12-01', source_type: 'Mail',          visits: 130.88    },
    { date: '2025-12-01', source_type: 'Organic Search',visits: 83543.52  },
    { date: '2025-12-01', source_type: 'Paid Search',   visits: 12333.99  },
    { date: '2025-12-01', source_type: 'Referrals',     visits: 7416.97   },
    { date: '2025-12-01', source_type: 'Social',        visits: 22829.76  },
    { date: '2026-01-01', source_type: 'Direct',        visits: 91880.43  },
    { date: '2026-01-01', source_type: 'Display Ads',   visits: 575.72    },
    { date: '2026-01-01', source_type: 'Mail',          visits: 130.43    },
    { date: '2026-01-01', source_type: 'Organic Search',visits: 73802.35  },
    { date: '2026-01-01', source_type: 'Paid Search',   visits: 7477.39   },
    { date: '2026-01-01', source_type: 'Referrals',     visits: 6203.59   },
    { date: '2026-01-01', source_type: 'Social',        visits: 18396.44  },
    { date: '2026-02-01', source_type: 'Direct',        visits: 87859.01  },
    { date: '2026-02-01', source_type: 'Display Ads',   visits: 603.90    },
    { date: '2026-02-01', source_type: 'Mail',          visits: 118.92    },
    { date: '2026-02-01', source_type: 'Organic Search',visits: 66941.75  },
    { date: '2026-02-01', source_type: 'Paid Search',   visits: 6664.83   },
    { date: '2026-02-01', source_type: 'Referrals',     visits: 5787.92   },
    { date: '2026-02-01', source_type: 'Social',        visits: 16092.35  },
    { date: '2026-03-01', source_type: 'Direct',        visits: 77447.33  },
    { date: '2026-03-01', source_type: 'Display Ads',   visits: 617.98    },
    { date: '2026-03-01', source_type: 'Mail',          visits: 99.18     },
    { date: '2026-03-01', source_type: 'Organic Search',visits: 56034.92  },
    { date: '2026-03-01', source_type: 'Paid Search',   visits: 7828.07   },
    { date: '2026-03-01', source_type: 'Referrals',     visits: 5794.75   },
    { date: '2026-03-01', source_type: 'Social',        visits: 15357.91  },
  ],
  'hinge.co': [
    { date: '2025-12-01', source_type: 'Direct',        visits: 664312.08  },
    { date: '2025-12-01', source_type: 'Display Ads',   visits: 7184.79    },
    { date: '2025-12-01', source_type: 'Mail',          visits: 629.76     },
    { date: '2025-12-01', source_type: 'Organic Search',visits: 1032979.50 },
    { date: '2025-12-01', source_type: 'Paid Search',   visits: 18063.92   },
    { date: '2025-12-01', source_type: 'Referrals',     visits: 36619.84   },
    { date: '2025-12-01', source_type: 'Social',        visits: 51117.60   },
    { date: '2026-01-01', source_type: 'Direct',        visits: 781586.47  },
    { date: '2026-01-01', source_type: 'Display Ads',   visits: 7912.25    },
    { date: '2026-01-01', source_type: 'Mail',          visits: 673.90     },
    { date: '2026-01-01', source_type: 'Organic Search',visits: 1192936.70 },
    { date: '2026-01-01', source_type: 'Paid Search',   visits: 21568.59   },
    { date: '2026-01-01', source_type: 'Referrals',     visits: 45497.11   },
    { date: '2026-01-01', source_type: 'Social',        visits: 69428.82   },
    { date: '2026-02-01', source_type: 'Direct',        visits: 700024.32  },
    { date: '2026-02-01', source_type: 'Display Ads',   visits: 6051.00    },
    { date: '2026-02-01', source_type: 'Mail',          visits: 552.74     },
    { date: '2026-02-01', source_type: 'Organic Search',visits: 1008918.01 },
    { date: '2026-02-01', source_type: 'Paid Search',   visits: 20394.63   },
    { date: '2026-02-01', source_type: 'Referrals',     visits: 37830.11   },
    { date: '2026-02-01', source_type: 'Social',        visits: 66860.13   },
    { date: '2026-03-01', source_type: 'Direct',        visits: 769518.56  },
    { date: '2026-03-01', source_type: 'Display Ads',   visits: 6991.73    },
    { date: '2026-03-01', source_type: 'Mail',          visits: 592.34     },
    { date: '2026-03-01', source_type: 'Organic Search',visits: 1140577.55 },
    { date: '2026-03-01', source_type: 'Paid Search',   visits: 20976.79   },
    { date: '2026-03-01', source_type: 'Referrals',     visits: 38894.13   },
    { date: '2026-03-01', source_type: 'Social',        visits: 61484.93   },
  ],
  'bumble.com': [
    { date: '2025-12-01', source_type: 'Direct',        visits: 8268413.77  },
    { date: '2025-12-01', source_type: 'Display Ads',   visits: 6206.40     },
    { date: '2025-12-01', source_type: 'Mail',          visits: 2518.78     },
    { date: '2025-12-01', source_type: 'Organic Search',visits: 2837281.43  },
    { date: '2025-12-01', source_type: 'Paid Search',   visits: 44300.53    },
    { date: '2025-12-01', source_type: 'Referrals',     visits: 152955.10   },
    { date: '2025-12-01', source_type: 'Social',        visits: 172451.22   },
    { date: '2026-01-01', source_type: 'Direct',        visits: 8354733.37  },
    { date: '2026-01-01', source_type: 'Display Ads',   visits: 7266.35     },
    { date: '2026-01-01', source_type: 'Mail',          visits: 2730.58     },
    { date: '2026-01-01', source_type: 'Organic Search',visits: 2799136.12  },
    { date: '2026-01-01', source_type: 'Paid Search',   visits: 43026.38    },
    { date: '2026-01-01', source_type: 'Referrals',     visits: 153744.75   },
    { date: '2026-01-01', source_type: 'Social',        visits: 162460.00   },
    { date: '2026-02-01', source_type: 'Direct',        visits: 7262492.11  },
    { date: '2026-02-01', source_type: 'Display Ads',   visits: 6666.96     },
    { date: '2026-02-01', source_type: 'Mail',          visits: 2207.03     },
    { date: '2026-02-01', source_type: 'Organic Search',visits: 2417012.13  },
    { date: '2026-02-01', source_type: 'Paid Search',   visits: 38324.06    },
    { date: '2026-02-01', source_type: 'Referrals',     visits: 135626.56   },
    { date: '2026-02-01', source_type: 'Social',        visits: 151452.81   },
    { date: '2026-03-01', source_type: 'Direct',        visits: 8300996.98  },
    { date: '2026-03-01', source_type: 'Display Ads',   visits: 8149.55     },
    { date: '2026-03-01', source_type: 'Mail',          visits: 2355.58     },
    { date: '2026-03-01', source_type: 'Organic Search',visits: 2647677.07  },
    { date: '2026-03-01', source_type: 'Paid Search',   visits: 44019.83    },
    { date: '2026-03-01', source_type: 'Referrals',     visits: 152047.01   },
    { date: '2026-03-01', source_type: 'Social',        visits: 155928.02   },
  ],
  'cardsagainsthumanity.com': [
    { date: '2025-12-01', source_type: 'Direct',        visits: 78453.55  },
    { date: '2025-12-01', source_type: 'Display Ads',   visits: 822.68    },
    { date: '2025-12-01', source_type: 'Mail',          visits: 53.95     },
    { date: '2025-12-01', source_type: 'Organic Search',visits: 250118.97 },
    { date: '2025-12-01', source_type: 'Paid Search',   visits: 38.34     },
    { date: '2025-12-01', source_type: 'Referrals',     visits: 11865.79  },
    { date: '2025-12-01', source_type: 'Social',        visits: 7707.19   },
    { date: '2026-01-01', source_type: 'Direct',        visits: 65043.81  },
    { date: '2026-01-01', source_type: 'Display Ads',   visits: 621.86    },
    { date: '2026-01-01', source_type: 'Mail',          visits: 44.73     },
    { date: '2026-01-01', source_type: 'Organic Search',visits: 208364.51 },
    { date: '2026-01-01', source_type: 'Paid Search',   visits: 29.75     },
    { date: '2026-01-01', source_type: 'Referrals',     visits: 7485.31   },
    { date: '2026-01-01', source_type: 'Social',        visits: 4314.71   },
    { date: '2026-02-01', source_type: 'Direct',        visits: 47648.94  },
    { date: '2026-02-01', source_type: 'Display Ads',   visits: 486.99    },
    { date: '2026-02-01', source_type: 'Mail',          visits: 33.84     },
    { date: '2026-02-01', source_type: 'Organic Search',visits: 156439.54 },
    { date: '2026-02-01', source_type: 'Paid Search',   visits: 23.99     },
    { date: '2026-02-01', source_type: 'Referrals',     visits: 5359.87   },
    { date: '2026-02-01', source_type: 'Social',        visits: 3266.50   },
    { date: '2026-03-01', source_type: 'Direct',        visits: 46225.28  },
    { date: '2026-03-01', source_type: 'Display Ads',   visits: 498.52    },
    { date: '2026-03-01', source_type: 'Mail',          visits: 31.51     },
    { date: '2026-03-01', source_type: 'Organic Search',visits: 140741.99 },
    { date: '2026-03-01', source_type: 'Paid Search',   visits: 28.32     },
    { date: '2026-03-01', source_type: 'Referrals',     visits: 5095.39   },
    { date: '2026-03-01', source_type: 'Social',        visits: 4429.76   },
  ],
};

const sourcesRows = Object.entries(sourcesRaw).flatMap(([domain, rows]) =>
  rows.map(r => ({
    brand: BRANDS[domain],
    domain,
    month: r.date,
    source_type: r.source_type,
    visits: r.visits,
    fetched_at: new Date().toISOString(),
  }))
);

// ── 3. demographics (aggregated over period) ────────────────────────────────
const demographicsRows = [
  {
    domain: 'werenotreallystrangers.com',
    period_start: '2025-12-01',
    period_end: '2026-03-31',
    male_share: 0.4116, female_share: 0.5884,
    age_18_to_24: 0.2047, age_25_to_34: 0.3304, age_35_to_44: 0.1695,
    age_45_to_54: 0.1418, age_55_to_64: 0.0958, age_65_plus: 0.0578,
  },
  {
    domain: 'hinge.co',
    period_start: '2025-12-01',
    period_end: '2026-03-31',
    male_share: 0.5704, female_share: 0.4296,
    age_18_to_24: 0.2007, age_25_to_34: 0.3133, age_35_to_44: 0.1885,
    age_45_to_54: 0.1454, age_55_to_64: 0.0953, age_65_plus: 0.0568,
  },
  {
    domain: 'bumble.com',
    period_start: '2025-12-01',
    period_end: '2026-03-31',
    male_share: 0.6038, female_share: 0.3962,
    age_18_to_24: 0.1601, age_25_to_34: 0.3235, age_35_to_44: 0.1929,
    age_45_to_54: 0.1505, age_55_to_64: 0.1107, age_65_plus: 0.0623,
  },
  {
    domain: 'cardsagainsthumanity.com',
    period_start: '2025-12-01',
    period_end: '2026-03-31',
    male_share: 0.6325, female_share: 0.3675,
    age_18_to_24: 0.3293, age_25_to_34: 0.2941, age_35_to_44: 0.1530,
    age_45_to_54: 0.1098, age_55_to_64: 0.0674, age_65_plus: 0.0462,
  },
].map(r => ({ ...r, brand: BRANDS[r.domain], fetched_at: new Date().toISOString() }));

// ── Run upserts ──────────────────────────────────────────────────────────────
async function main() {
  console.log('Upserting web_traffic...');
  const { error: e1, count: c1 } = await sb
    .from('web_traffic')
    .upsert(trafficRows, { onConflict: 'domain,month', count: 'exact' });
  if (e1) console.error('web_traffic error:', e1.message);
  else console.log(`  web_traffic: upserted ${trafficRows.length} rows`);

  console.log('Upserting traffic_sources...');
  const { error: e2 } = await sb
    .from('traffic_sources')
    .upsert(sourcesRows, { onConflict: 'domain,month,source_type' });
  if (e2) console.error('traffic_sources error:', e2.message);
  else console.log(`  traffic_sources: upserted ${sourcesRows.length} rows`);

  console.log('Upserting demographics...');
  const { error: e3 } = await sb
    .from('demographics')
    .upsert(demographicsRows, { onConflict: 'domain,period_start' });
  if (e3) console.error('demographics error:', e3.message);
  else console.log(`  demographics: upserted ${demographicsRows.length} rows`);

  console.log('Done.');
}

main().catch(console.error);
