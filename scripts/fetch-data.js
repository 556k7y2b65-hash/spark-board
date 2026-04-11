#!/usr/bin/env node
/**
 * Spark Board — Weekly Data Fetcher
 * Pulls competitor intelligence from SimilarWeb (via MCP) and Apify, stores in Supabase.
 * Run: node scripts/fetch-data.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env.local') });

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const APIFY_TOKEN = process.env.APIFY_API_TOKEN;

// Competitors to track
const COMPETITORS = [
  { brand: 'WNRS', domain: 'werenotreallystrangers.com', tiktok: 'werenotreallystrangers' },
  { brand: 'Hinge', domain: 'hinge.co', tiktok: 'hinge' },
  { brand: 'Bumble', domain: 'bumble.com', tiktok: 'bumble' },
  { brand: 'CAH', domain: 'cardsagainsthumanity.com', tiktok: 'cardsagainsthumanity' },
  { brand: 'The And', domain: 'theand.us', tiktok: null },
  { brand: 'Vertellis', domain: 'vertellis.com', tiktok: null },
];

const HASHTAGS = ['conversationstarters', 'friendshipbreakup', 'lonelinessepidemic', 'deepconversations', '36questions'];

// ─── APIFY HELPERS ───

async function runApifyActor(actorId, input) {
  const res = await fetch(
    `https://api.apify.com/v2/acts/${actorId}/runs?token=${APIFY_TOKEN}&waitForFinish=180`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) }
  );
  const data = await res.json();
  const datasetId = data?.data?.defaultDatasetId;
  if (!datasetId) throw new Error(`Actor ${actorId} failed: ${JSON.stringify(data)}`);

  const items = await fetch(
    `https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_TOKEN}&limit=50`
  ).then(r => r.json());
  return items;
}

// ─── TIKTOK FETCH ───

async function fetchTikTokProfiles() {
  const profiles = COMPETITORS.filter(c => c.tiktok).map(c => c.tiktok);
  console.log(`  Fetching TikTok profiles: ${profiles.join(', ')}`);

  const items = await runApifyActor('OtzYfK1ndEGdwWFKQ', {
    profiles,
    resultsPerPage: 5,
    shouldDownloadVideos: false,
    shouldDownloadCovers: false,
  });

  // Group by author
  const byAuthor = {};
  for (const item of items) {
    const username = item.authorMeta?.name;
    if (!username) continue;
    if (!byAuthor[username]) byAuthor[username] = { meta: item.authorMeta, posts: [] };
    byAuthor[username].posts.push(item);
  }

  // Upsert profiles
  for (const [username, data] of Object.entries(byAuthor)) {
    const comp = COMPETITORS.find(c => c.tiktok === username);
    const brand = comp?.brand || username;

    const { error: profileErr } = await supabase.from('tiktok_profiles').insert({
      brand,
      username,
      followers: data.meta.fans || 0,
      total_hearts: data.meta.heart || 0,
      video_count: data.meta.video || 0,
    });
    if (profileErr) console.error(`  Profile insert error (${username}):`, profileErr.message);
    else console.log(`  ✓ ${username}: ${(data.meta.fans || 0).toLocaleString()} followers`);

    // Insert top posts
    for (const post of data.posts) {
      const { error: postErr } = await supabase.from('tiktok_posts').insert({
        brand,
        username,
        description: (post.text || '').slice(0, 500),
        play_count: post.playCount || 0,
        like_count: post.diggCount || 0,
        share_count: post.shareCount || 0,
        comment_count: post.commentCount || 0,
      });
      if (postErr) console.error(`  Post insert error:`, postErr.message);
    }
  }
}

async function fetchTikTokHashtags() {
  console.log(`  Fetching hashtags: ${HASHTAGS.join(', ')}`);

  const items = await runApifyActor('f1ZeP0K58iwlqG2pY', {
    hashtags: HASHTAGS,
    resultsPerPage: 5,
    shouldDownloadVideos: false,
    shouldDownloadCovers: false,
  });

  for (const item of items) {
    const author = item.authorMeta?.name || '?';
    const desc = (item.text || '').slice(0, 500);
    // Try to extract hashtag from challenges
    let hashtag = '?';
    if (item.challenges?.length) {
      hashtag = item.challenges[0]?.title || '?';
    }

    const { error } = await supabase.from('hashtag_trends').insert({
      hashtag,
      top_author: author,
      top_post_description: desc,
      play_count: item.playCount || 0,
      like_count: item.diggCount || 0,
      share_count: item.shareCount || 0,
    });
    if (error) console.error(`  Hashtag insert error:`, error.message);
  }
  console.log(`  ✓ ${items.length} hashtag posts stored`);
}

// ─── SEED SIMILARWEB DATA ───
// SimilarWeb data is fetched via MCP tools in Claude Code conversations.
// This function seeds the latest data we have.

async function seedSimilarWebData() {
  console.log('  Seeding SimilarWeb data...');

  // Web traffic — March 2026 (latest from our API calls)
  const trafficData = [
    { brand: 'WNRS', domain: 'werenotreallystrangers.com', month: '2025-12-01', visits: 215633, unique_visitors: 122085, bounce_rate: 0.384, avg_visit_duration: 85.9, pages_per_visit: 3.12 },
    { brand: 'WNRS', domain: 'werenotreallystrangers.com', month: '2026-01-01', visits: 198466, unique_visitors: 110680, bounce_rate: 0.423, avg_visit_duration: 76.4, pages_per_visit: 2.85 },
    { brand: 'WNRS', domain: 'werenotreallystrangers.com', month: '2026-02-01', visits: 184069, unique_visitors: 106545, bounce_rate: 0.408, avg_visit_duration: 50.3, pages_per_visit: 2.85 },
    { brand: 'WNRS', domain: 'werenotreallystrangers.com', month: '2026-03-01', visits: 163180, unique_visitors: 88836, bounce_rate: 0.427, avg_visit_duration: 59.1, pages_per_visit: 2.91 },
    { brand: 'Hinge', domain: 'hinge.co', month: '2025-12-01', visits: 1810907, unique_visitors: 1143916, bounce_rate: 0.526, avg_visit_duration: 58.1, pages_per_visit: 1.87 },
    { brand: 'Hinge', domain: 'hinge.co', month: '2026-01-01', visits: 2119604, unique_visitors: 1328502, bounce_rate: 0.526, avg_visit_duration: 57.2, pages_per_visit: 1.89 },
    { brand: 'Hinge', domain: 'hinge.co', month: '2026-02-01', visits: 1840631, unique_visitors: 1134093, bounce_rate: 0.520, avg_visit_duration: 50.9, pages_per_visit: 1.80 },
    { brand: 'Hinge', domain: 'hinge.co', month: '2026-03-01', visits: 2039036, unique_visitors: 1265080, bounce_rate: 0.533, avg_visit_duration: 51.0, pages_per_visit: 1.87 },
    { brand: 'Bumble', domain: 'bumble.com', month: '2025-12-01', visits: 11484127, unique_visitors: 3195944, bounce_rate: 0.306, avg_visit_duration: 289.9, pages_per_visit: 3.17 },
    { brand: 'Bumble', domain: 'bumble.com', month: '2026-01-01', visits: 11523098, unique_visitors: 3109195, bounce_rate: 0.316, avg_visit_duration: 266.8, pages_per_visit: 3.07 },
    { brand: 'Bumble', domain: 'bumble.com', month: '2026-02-01', visits: 10013782, unique_visitors: 2785006, bounce_rate: 0.306, avg_visit_duration: 254.2, pages_per_visit: 3.04 },
    { brand: 'Bumble', domain: 'bumble.com', month: '2026-03-01', visits: 11311174, unique_visitors: 3086320, bounce_rate: 0.298, avg_visit_duration: 261.5, pages_per_visit: 3.14 },
    { brand: 'CAH', domain: 'cardsagainsthumanity.com', month: '2025-12-01', visits: 349060, unique_visitors: 220392, bounce_rate: 0.479, avg_visit_duration: 47.6, pages_per_visit: 1.98 },
    { brand: 'CAH', domain: 'cardsagainsthumanity.com', month: '2026-01-01', visits: 285905, unique_visitors: 169406, bounce_rate: 0.447, avg_visit_duration: 41.7, pages_per_visit: 2.02 },
    { brand: 'CAH', domain: 'cardsagainsthumanity.com', month: '2026-02-01', visits: 213260, unique_visitors: 128993, bounce_rate: 0.449, avg_visit_duration: 31.7, pages_per_visit: 2.02 },
    { brand: 'CAH', domain: 'cardsagainsthumanity.com', month: '2026-03-01', visits: 197051, unique_visitors: 117313, bounce_rate: 0.459, avg_visit_duration: 38.8, pages_per_visit: 1.93 },
  ];

  const { error: tErr } = await supabase.from('web_traffic').upsert(trafficData, { onConflict: 'domain,month' });
  if (tErr) console.error('  Traffic upsert error:', tErr.message);
  else console.log(`  ✓ ${trafficData.length} web traffic rows`);

  // Traffic sources — March 2026
  const sourceData = [
    // WNRS
    { brand: 'WNRS', domain: 'werenotreallystrangers.com', month: '2026-03-01', source_type: 'Direct', visits: 77447 },
    { brand: 'WNRS', domain: 'werenotreallystrangers.com', month: '2026-03-01', source_type: 'Organic Search', visits: 56035 },
    { brand: 'WNRS', domain: 'werenotreallystrangers.com', month: '2026-03-01', source_type: 'Social', visits: 15358 },
    { brand: 'WNRS', domain: 'werenotreallystrangers.com', month: '2026-03-01', source_type: 'Paid Search', visits: 7828 },
    { brand: 'WNRS', domain: 'werenotreallystrangers.com', month: '2026-03-01', source_type: 'Referrals', visits: 5795 },
    // Hinge
    { brand: 'Hinge', domain: 'hinge.co', month: '2026-03-01', source_type: 'Organic Search', visits: 1140578 },
    { brand: 'Hinge', domain: 'hinge.co', month: '2026-03-01', source_type: 'Direct', visits: 769519 },
    { brand: 'Hinge', domain: 'hinge.co', month: '2026-03-01', source_type: 'Social', visits: 61485 },
    { brand: 'Hinge', domain: 'hinge.co', month: '2026-03-01', source_type: 'Referrals', visits: 38894 },
    { brand: 'Hinge', domain: 'hinge.co', month: '2026-03-01', source_type: 'Paid Search', visits: 20977 },
    // Bumble
    { brand: 'Bumble', domain: 'bumble.com', month: '2026-03-01', source_type: 'Direct', visits: 8300997 },
    { brand: 'Bumble', domain: 'bumble.com', month: '2026-03-01', source_type: 'Organic Search', visits: 2647677 },
    { brand: 'Bumble', domain: 'bumble.com', month: '2026-03-01', source_type: 'Social', visits: 155928 },
    { brand: 'Bumble', domain: 'bumble.com', month: '2026-03-01', source_type: 'Referrals', visits: 152047 },
    { brand: 'Bumble', domain: 'bumble.com', month: '2026-03-01', source_type: 'Paid Search', visits: 44020 },
    // CAH
    { brand: 'CAH', domain: 'cardsagainsthumanity.com', month: '2026-03-01', source_type: 'Organic Search', visits: 140742 },
    { brand: 'CAH', domain: 'cardsagainsthumanity.com', month: '2026-03-01', source_type: 'Direct', visits: 46225 },
    { brand: 'CAH', domain: 'cardsagainsthumanity.com', month: '2026-03-01', source_type: 'Referrals', visits: 5095 },
    { brand: 'CAH', domain: 'cardsagainsthumanity.com', month: '2026-03-01', source_type: 'Social', visits: 4430 },
  ];

  const { error: sErr } = await supabase.from('traffic_sources').upsert(sourceData, { onConflict: 'domain,month,source_type' });
  if (sErr) console.error('  Sources upsert error:', sErr.message);
  else console.log(`  ✓ ${sourceData.length} traffic source rows`);

  // Demographics
  const demoData = [
    { brand: 'WNRS', domain: 'werenotreallystrangers.com', period_start: '2025-12-01', period_end: '2026-03-31', male_share: 0.412, female_share: 0.588, age_18_to_24: 0.205, age_25_to_34: 0.330, age_35_to_44: 0.169, age_45_to_54: 0.142, age_55_to_64: 0.096, age_65_plus: 0.058 },
    { brand: 'Hinge', domain: 'hinge.co', period_start: '2025-12-01', period_end: '2026-03-31', male_share: 0.570, female_share: 0.430, age_18_to_24: 0.201, age_25_to_34: 0.313, age_35_to_44: 0.189, age_45_to_54: 0.145, age_55_to_64: 0.095, age_65_plus: 0.057 },
    { brand: 'Bumble', domain: 'bumble.com', period_start: '2025-12-01', period_end: '2026-03-31', male_share: 0.604, female_share: 0.396, age_18_to_24: 0.160, age_25_to_34: 0.324, age_35_to_44: 0.193, age_45_to_54: 0.151, age_55_to_64: 0.111, age_65_plus: 0.062 },
    { brand: 'CAH', domain: 'cardsagainsthumanity.com', period_start: '2025-12-01', period_end: '2026-03-31', male_share: 0.633, female_share: 0.367, age_18_to_24: 0.329, age_25_to_34: 0.294, age_35_to_44: 0.153, age_45_to_54: 0.110, age_55_to_64: 0.067, age_65_plus: 0.046 },
  ];

  const { error: dErr } = await supabase.from('demographics').upsert(demoData, { onConflict: 'domain,period_start' });
  if (dErr) console.error('  Demographics upsert error:', dErr.message);
  else console.log(`  ✓ ${demoData.length} demographics rows`);
}

// ─── MAIN ───

async function main() {
  console.log('🔥 Spark Board — Data Fetch\n');

  console.log('[1/3] SimilarWeb data...');
  await seedSimilarWebData();

  console.log('\n[2/3] TikTok profiles & posts...');
  await fetchTikTokProfiles();

  console.log('\n[3/3] TikTok hashtag trends...');
  await fetchTikTokHashtags();

  // Verify counts
  console.log('\n--- Final counts ---');
  for (const table of ['web_traffic', 'traffic_sources', 'demographics', 'tiktok_profiles', 'tiktok_posts', 'hashtag_trends']) {
    const { count } = await supabase.from(table).select('*', { count: 'exact', head: true });
    console.log(`  ${table}: ${count} rows`);
  }

  console.log('\n✅ Done! Data stored in Supabase.');
}

main().catch(console.error);
