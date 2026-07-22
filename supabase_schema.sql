-- ================================================
-- AlumniInsight — Schema Upgrade Script
-- Run this in Supabase Dashboard → SQL Editor
-- ================================================

-- 1. Add location and company_name columns to alumni table
ALTER TABLE alumni ADD COLUMN IF NOT EXISTS location text;
ALTER TABLE alumni ADD COLUMN IF NOT EXISTS company_name text;

-- 2. Create student_feedbacks table
CREATE TABLE IF NOT EXISTS student_feedbacks (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name text NOT NULL,
    program text,
    type text NOT NULL,
    company text,
    role text,
    duration text,
    rating integer CHECK (rating >= 1 AND rating <= 5),
    experience text,
    skills_learned text,
    recommendations text,
    requirements text,
    advice text,
    created_at timestamptz DEFAULT now()
);

-- 3. Create community_posts table
CREATE TABLE IF NOT EXISTS community_posts (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    category text NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    company text,
    location text,
    contact text,
    author text NOT NULL,
    program text,
    likes integer DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

-- 4. Enable RLS on new tables
ALTER TABLE student_feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;

-- 5. Allow anonymous read/write for new tables
CREATE POLICY "anon_read_feedbacks" ON student_feedbacks FOR SELECT USING (true);
CREATE POLICY "anon_insert_feedbacks" ON student_feedbacks FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_read_posts" ON community_posts FOR SELECT USING (true);
CREATE POLICY "anon_insert_posts" ON community_posts FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update_posts" ON community_posts FOR UPDATE USING (true);
