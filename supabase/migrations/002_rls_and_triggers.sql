-- =============================================
-- RLS (Row Level Security) 정책 및 트리거
-- =============================================

-- updated_at 자동 갱신 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- updated_at 트리거 적용
CREATE TRIGGER trg_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_policy_announcements_updated_at
  BEFORE UPDATE ON policy_announcements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_policy_applications_updated_at
  BEFORE UPDATE ON policy_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- RLS 활성화
-- =============================================
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_applications ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS 정책 - 정책공고 (모든 인증 사용자 읽기 가능)
-- =============================================
CREATE POLICY "정책공고 조회 - 인증 사용자"
  ON policy_announcements FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "정책공고 관리 - 관리자만"
  ON policy_announcements FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- =============================================
-- RLS 정책 - 기업 (자사 기업 데이터만 접근)
-- =============================================
CREATE POLICY "기업 조회 - 자사 또는 관리자"
  ON companies FOR SELECT
  TO authenticated
  USING (
    id IN (SELECT company_id FROM users WHERE users.id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "기업 수정 - 매니저 이상"
  ON companies FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "기업 생성 - 관리자만"
  ON companies FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- =============================================
-- RLS 정책 - 사용자
-- =============================================
CREATE POLICY "사용자 본인 조회"
  ON users FOR SELECT
  TO authenticated
  USING (
    id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'admin'
    )
  );

-- =============================================
-- RLS 정책 - 재무 데이터
-- =============================================
CREATE POLICY "재무데이터 조회 - 자사 또는 관리자"
  ON financial_data FOR SELECT
  TO authenticated
  USING (
    company_id IN (SELECT company_id FROM users WHERE users.id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "재무데이터 관리 - 매니저 이상"
  ON financial_data FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  );

-- =============================================
-- RLS 정책 - 매칭 결과
-- =============================================
CREATE POLICY "매칭결과 조회 - 자사 또는 관리자"
  ON match_results FOR SELECT
  TO authenticated
  USING (
    company_id IN (SELECT company_id FROM users WHERE users.id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "매칭결과 관리 - 시스템"
  ON match_results FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- =============================================
-- RLS 정책 - 신청 관리
-- =============================================
CREATE POLICY "신청관리 조회 - 자사 또는 관리자"
  ON policy_applications FOR SELECT
  TO authenticated
  USING (
    company_id IN (SELECT company_id FROM users WHERE users.id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "신청관리 생성 - 매니저 이상"
  ON policy_applications FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "신청관리 수정 - 매니저 이상"
  ON policy_applications FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  );

-- =============================================
-- 서비스 역할 전체 접근 (Serverless Functions용)
-- =============================================
CREATE POLICY "서비스역할 전체접근 - companies"
  ON companies FOR ALL TO service_role USING (true);

CREATE POLICY "서비스역할 전체접근 - users"
  ON users FOR ALL TO service_role USING (true);

CREATE POLICY "서비스역할 전체접근 - financial_data"
  ON financial_data FOR ALL TO service_role USING (true);

CREATE POLICY "서비스역할 전체접근 - policy_announcements"
  ON policy_announcements FOR ALL TO service_role USING (true);

CREATE POLICY "서비스역할 전체접근 - match_results"
  ON match_results FOR ALL TO service_role USING (true);

CREATE POLICY "서비스역할 전체접근 - policy_applications"
  ON policy_applications FOR ALL TO service_role USING (true);
