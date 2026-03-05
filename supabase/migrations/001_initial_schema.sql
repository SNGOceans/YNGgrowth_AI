-- =============================================
-- YNG Policy AI - Initial Database Schema
-- =============================================

-- 기업 프로파일 테이블 (users보다 먼저 생성 - FK 참조 대상)
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  business_number TEXT UNIQUE NOT NULL,
  ceo_name TEXT NOT NULL,
  industry TEXT,
  industry_code TEXT,
  established_date DATE,
  employee_count INTEGER DEFAULT 0,
  annual_revenue BIGINT DEFAULT 0,
  location TEXT,
  company_type TEXT CHECK (company_type IN ('startup','small','medium','social','venture')),
  growth_stage TEXT CHECK (growth_stage IN ('seed','early','growth','expansion','mature')),
  certifications TEXT[] DEFAULT '{}',
  technologies TEXT[] DEFAULT '{}',
  previous_supports TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 사용자 테이블
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT CHECK (role IN ('admin', 'manager', 'user')) DEFAULT 'user',
  company_id UUID REFERENCES companies(id),
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 재무 데이터 테이블
CREATE TABLE IF NOT EXISTS financial_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  revenue BIGINT,
  operating_profit BIGINT,
  net_income BIGINT,
  total_assets BIGINT,
  total_debt BIGINT,
  growth_rate NUMERIC(5,2),
  year INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 정책공고 테이블
CREATE TABLE IF NOT EXISTS policy_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  organization TEXT NOT NULL,
  category TEXT CHECK (category IN ('funding','rnd','manpower','marketing','export','certification','consulting','education','space','tax','other')),
  target_audience TEXT,
  eligibility TEXT,
  support_scale TEXT,
  application_start DATE,
  application_end DATE,
  required_documents TEXT[] DEFAULT '{}',
  description TEXT,
  detail_url TEXT,
  status TEXT CHECK (status IN ('upcoming','open','closed')) DEFAULT 'upcoming',
  difficulty TEXT CHECK (difficulty IN ('easy','medium','hard')) DEFAULT 'medium',
  preparation_period INTEGER DEFAULT 14,
  source TEXT,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 매칭 결과 테이블
CREATE TABLE IF NOT EXISTS match_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  policy_id UUID REFERENCES policy_announcements(id) ON DELETE CASCADE,
  match_score INTEGER CHECK (match_score BETWEEN 0 AND 100),
  match_reasons TEXT[] DEFAULT '{}',
  eligibility_status TEXT CHECK (eligibility_status IN ('eligible','likely','uncertain','ineligible')),
  recommended_priority TEXT CHECK (recommended_priority IN ('high','medium','low')),
  preparation_tips TEXT[] DEFAULT '{}',
  estimated_approval_rate INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 정책지원 신청 관리 테이블
CREATE TABLE IF NOT EXISTS policy_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  policy_id UUID REFERENCES policy_announcements(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('researching','preparing','documents_ready','applied','reviewing','presentation','selected','rejected','executing','completed')) DEFAULT 'researching',
  applied_date DATE,
  documents JSONB DEFAULT '[]',
  timeline JSONB DEFAULT '[]',
  notes TEXT,
  result TEXT CHECK (result IN ('selected','rejected','pending')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_policies_status ON policy_announcements(status);
CREATE INDEX idx_policies_category ON policy_announcements(category);
CREATE INDEX idx_policies_dates ON policy_announcements(application_start, application_end);
CREATE INDEX idx_matches_company ON match_results(company_id);
CREATE INDEX idx_matches_score ON match_results(match_score DESC);
CREATE INDEX idx_applications_company ON policy_applications(company_id);
CREATE INDEX idx_applications_status ON policy_applications(status);
