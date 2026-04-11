-- Spark Board schema — competitive intelligence tables

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

CREATE TABLE IF NOT EXISTS tiktok_profiles (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  brand TEXT NOT NULL,
  username TEXT NOT NULL,
  followers INTEGER,
  total_hearts BIGINT,
  video_count INTEGER,
  fetched_at TIMESTAMPTZ DEFAULT NOW()
);

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

-- Enable RLS
ALTER TABLE web_traffic ENABLE ROW LEVEL SECURITY;
ALTER TABLE traffic_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE demographics ENABLE ROW LEVEL SECURITY;
ALTER TABLE tiktok_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tiktok_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE hashtag_trends ENABLE ROW LEVEL SECURITY;

-- Anon read policies
DO $$ BEGIN
  CREATE POLICY "anon_read" ON web_traffic FOR SELECT TO anon USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "anon_read" ON traffic_sources FOR SELECT TO anon USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "anon_read" ON demographics FOR SELECT TO anon USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "anon_read" ON tiktok_profiles FOR SELECT TO anon USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "anon_read" ON tiktok_posts FOR SELECT TO anon USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "anon_read" ON hashtag_trends FOR SELECT TO anon USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Service role write policies
DO $$ BEGIN
  CREATE POLICY "service_write" ON web_traffic FOR ALL TO service_role USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "service_write" ON traffic_sources FOR ALL TO service_role USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "service_write" ON demographics FOR ALL TO service_role USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "service_write" ON tiktok_profiles FOR ALL TO service_role USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "service_write" ON tiktok_posts FOR ALL TO service_role USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "service_write" ON hashtag_trends FOR ALL TO service_role USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
