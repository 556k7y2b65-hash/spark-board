#!/usr/bin/env node
/**
 * Creates Supabase tables for Spark Board competitive intelligence.
 * Run once: node scripts/setup-db.js
 */
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const SCHEMA_SQL = `
-- Web traffic data from SimilarWeb
CREATE TABLE IF NOT EXISTS web_traffic (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  brand TEXT NOT NULL,
  domain TEXT NOT NULL,
  month DATE NOT NULL,
  visits NUMERIC,
  unique_visitors NUMERIC,
  bounce_rate NUMERIC,
  avg_visit_duration NUMERIC,
  pages_per_visit NUMERIC,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(domain, month)
);

-- Traffic sources from SimilarWeb
CREATE TABLE IF NOT EXISTS traffic_sources (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  brand TEXT NOT NULL,
  domain TEXT NOT NULL,
  month DATE NOT NULL,
  source_type TEXT NOT NULL,
  visits NUMERIC,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(domain, month, source_type)
);

-- Demographics from SimilarWeb
CREATE TABLE IF NOT EXISTS demographics (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  brand TEXT NOT NULL,
  domain TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  male_share NUMERIC,
  female_share NUMERIC,
  age_18_to_24 NUMERIC,
  age_25_to_34 NUMERIC,
  age_35_to_44 NUMERIC,
  age_45_to_54 NUMERIC,
  age_55_to_64 NUMERIC,
  age_65_plus NUMERIC,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(domain, period_start)
);

-- TikTok profile data from Apify
CREATE TABLE IF NOT EXISTS tiktok_profiles (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  brand TEXT NOT NULL,
  username TEXT NOT NULL,
  followers INTEGER,
  total_hearts BIGINT,
  video_count INTEGER,
  fetched_at TIMESTAMPTZ DEFAULT NOW()
);

-- TikTok top posts from Apify
CREATE TABLE IF NOT EXISTS tiktok_posts (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  brand TEXT NOT NULL,
  username TEXT NOT NULL,
  description TEXT,
  play_count BIGINT,
  like_count INTEGER,
  share_count INTEGER,
  comment_count INTEGER,
  fetched_at TIMESTAMPTZ DEFAULT NOW()
);

-- TikTok hashtag trends from Apify
CREATE TABLE IF NOT EXISTS hashtag_trends (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  hashtag TEXT NOT NULL,
  top_author TEXT,
  top_post_description TEXT,
  play_count BIGINT,
  like_count INTEGER,
  share_count INTEGER,
  fetched_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security but allow anon read access
ALTER TABLE web_traffic ENABLE ROW LEVEL SECURITY;
ALTER TABLE traffic_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE demographics ENABLE ROW LEVEL SECURITY;
ALTER TABLE tiktok_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tiktok_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE hashtag_trends ENABLE ROW LEVEL SECURITY;

-- Anon can read all tables (dashboard)
CREATE POLICY IF NOT EXISTS "anon_read_web_traffic" ON web_traffic FOR SELECT TO anon USING (true);
CREATE POLICY IF NOT EXISTS "anon_read_traffic_sources" ON traffic_sources FOR SELECT TO anon USING (true);
CREATE POLICY IF NOT EXISTS "anon_read_demographics" ON demographics FOR SELECT TO anon USING (true);
CREATE POLICY IF NOT EXISTS "anon_read_tiktok_profiles" ON tiktok_profiles FOR SELECT TO anon USING (true);
CREATE POLICY IF NOT EXISTS "anon_read_tiktok_posts" ON tiktok_posts FOR SELECT TO anon USING (true);
CREATE POLICY IF NOT EXISTS "anon_read_hashtag_trends" ON hashtag_trends FOR SELECT TO anon USING (true);

-- Service role can write (fetch script)
CREATE POLICY IF NOT EXISTS "service_write_web_traffic" ON web_traffic FOR ALL TO service_role USING (true);
CREATE POLICY IF NOT EXISTS "service_write_traffic_sources" ON traffic_sources FOR ALL TO service_role USING (true);
CREATE POLICY IF NOT EXISTS "service_write_demographics" ON demographics FOR ALL TO service_role USING (true);
CREATE POLICY IF NOT EXISTS "service_write_tiktok_profiles" ON tiktok_profiles FOR ALL TO service_role USING (true);
CREATE POLICY IF NOT EXISTS "service_write_tiktok_posts" ON tiktok_posts FOR ALL TO service_role USING (true);
CREATE POLICY IF NOT EXISTS "service_write_hashtag_trends" ON hashtag_trends FOR ALL TO service_role USING (true);
`;

async function setup() {
  console.log('Creating tables...');

  // Split SQL into individual statements and execute via rpc
  // Since we can't run raw SQL via REST, we'll create tables via the client
  const statements = SCHEMA_SQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  // We need to use the SQL endpoint - let's try the pg endpoint
  const response = await fetch(`${process.env.SUPABASE_URL}/pg`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`
    },
    body: JSON.stringify({ query: SCHEMA_SQL })
  });

  if (!response.ok) {
    // Fallback: try creating tables by inserting into each one
    console.log('SQL endpoint not available, using REST API approach...');
    await createTablesViaRest();
  } else {
    const result = await response.json();
    console.log('Tables created:', result);
  }
}

async function createTablesViaRest() {
  // Test if tables already exist by trying to select from them
  const tables = ['web_traffic', 'traffic_sources', 'demographics', 'tiktok_profiles', 'tiktok_posts', 'hashtag_trends'];

  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('id').limit(1);
    if (error) {
      console.log(`Table '${table}' doesn't exist yet - needs manual creation`);
    } else {
      console.log(`Table '${table}' ✓ exists`);
    }
  }

  console.log('\n⚠️  Tables need to be created via SQL Editor in Supabase dashboard.');
  console.log('Copy the SQL below and paste it into: Supabase > SQL Editor > New Query\n');
  console.log(SCHEMA_SQL);
}

setup().catch(console.error);
