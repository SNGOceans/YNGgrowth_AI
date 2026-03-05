-- =============================================
-- 유틸리티 함수 및 뷰
-- =============================================

-- 정책공고 상태 자동 갱신 함수 (스케줄러에서 호출)
CREATE OR REPLACE FUNCTION update_policy_status()
RETURNS void AS $$
BEGIN
  -- 접수 시작일이 지나면 'open'으로 변경
  UPDATE policy_announcements
  SET status = 'open'
  WHERE status = 'upcoming'
    AND application_start <= CURRENT_DATE
    AND application_end >= CURRENT_DATE;

  -- 접수 종료일이 지나면 'closed'로 변경
  UPDATE policy_announcements
  SET status = 'closed'
  WHERE status IN ('upcoming', 'open')
    AND application_end < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- 기업별 매칭 통계 뷰
CREATE OR REPLACE VIEW company_match_summary AS
SELECT
  c.id AS company_id,
  c.name AS company_name,
  c.growth_stage,
  COUNT(mr.id) AS total_matches,
  COUNT(CASE WHEN mr.eligibility_status = 'eligible' THEN 1 END) AS eligible_count,
  ROUND(AVG(mr.match_score), 1) AS avg_match_score,
  MAX(mr.match_score) AS max_match_score
FROM companies c
LEFT JOIN match_results mr ON c.id = mr.company_id
GROUP BY c.id, c.name, c.growth_stage;

-- 정책공고 대시보드 통계 뷰
CREATE OR REPLACE VIEW policy_dashboard_stats AS
SELECT
  COUNT(*) AS total_policies,
  COUNT(CASE WHEN status = 'open' THEN 1 END) AS open_policies,
  COUNT(CASE WHEN status = 'upcoming' THEN 1 END) AS upcoming_policies,
  COUNT(CASE WHEN status = 'closed' THEN 1 END) AS closed_policies,
  COUNT(DISTINCT category) AS category_count
FROM policy_announcements;

-- 신청 현황 대시보드 뷰
CREATE OR REPLACE VIEW application_dashboard_stats AS
SELECT
  COUNT(*) AS total_applications,
  COUNT(CASE WHEN status IN ('researching','preparing','documents_ready') THEN 1 END) AS preparing_count,
  COUNT(CASE WHEN status IN ('applied','reviewing','presentation') THEN 1 END) AS in_review_count,
  COUNT(CASE WHEN status = 'selected' THEN 1 END) AS selected_count,
  COUNT(CASE WHEN status = 'rejected' THEN 1 END) AS rejected_count,
  COUNT(CASE WHEN status IN ('executing','completed') THEN 1 END) AS executing_count,
  CASE
    WHEN COUNT(CASE WHEN result IS NOT NULL THEN 1 END) > 0
    THEN ROUND(
      COUNT(CASE WHEN result = 'selected' THEN 1 END)::NUMERIC /
      COUNT(CASE WHEN result IS NOT NULL THEN 1 END) * 100, 1
    )
    ELSE 0
  END AS success_rate
FROM policy_applications;

-- 마감 임박 정책 조회 함수 (D-day 기준 정렬)
CREATE OR REPLACE FUNCTION get_urgent_policies(limit_count INTEGER DEFAULT 5)
RETURNS TABLE (
  id UUID,
  title TEXT,
  organization TEXT,
  category TEXT,
  application_end DATE,
  days_remaining INTEGER,
  support_scale TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pa.id,
    pa.title,
    pa.organization,
    pa.category,
    pa.application_end,
    (pa.application_end - CURRENT_DATE)::INTEGER AS days_remaining,
    pa.support_scale
  FROM policy_announcements pa
  WHERE pa.status = 'open'
    AND pa.application_end >= CURRENT_DATE
  ORDER BY pa.application_end ASC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- 기업별 추천 정책 조회 함수
CREATE OR REPLACE FUNCTION get_recommended_policies(p_company_id UUID, limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  policy_id UUID,
  policy_title TEXT,
  match_score INTEGER,
  eligibility_status TEXT,
  recommended_priority TEXT,
  days_remaining INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    mr.policy_id,
    pa.title AS policy_title,
    mr.match_score,
    mr.eligibility_status,
    mr.recommended_priority,
    (pa.application_end - CURRENT_DATE)::INTEGER AS days_remaining
  FROM match_results mr
  JOIN policy_announcements pa ON mr.policy_id = pa.id
  WHERE mr.company_id = p_company_id
    AND pa.status IN ('open', 'upcoming')
  ORDER BY mr.match_score DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- 카테고리별 정책 수 집계 함수
CREATE OR REPLACE FUNCTION get_policy_count_by_category()
RETURNS TABLE (
  category TEXT,
  count BIGINT,
  open_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pa.category,
    COUNT(*)::BIGINT AS count,
    COUNT(CASE WHEN pa.status = 'open' THEN 1 END)::BIGINT AS open_count
  FROM policy_announcements pa
  GROUP BY pa.category
  ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql;
