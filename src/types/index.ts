// 정책공고 관련 타입
export interface PolicyAnnouncement {
  id: string;
  title: string;
  organization: string; // 주관기관
  category: PolicyCategory;
  target_audience: string; // 지원대상
  eligibility: string; // 신청자격
  support_scale: string; // 지원규모
  application_start: string;
  application_end: string;
  required_documents: string[]; // 제출서류
  description: string;
  detail_url: string;
  status: 'upcoming' | 'open' | 'closed';
  difficulty: 'easy' | 'medium' | 'hard';
  preparation_period: number; // 준비기간 (일)
  source: string; // 데이터 출처
  raw_data?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export type PolicyCategory =
  | 'funding' // 정책자금
  | 'rnd' // R&D
  | 'manpower' // 인력지원
  | 'marketing' // 판로/마케팅
  | 'export' // 수출지원
  | 'certification' // 인증/특허
  | 'consulting' // 컨설팅
  | 'education' // 교육/멘토링
  | 'space' // 공간/시설
  | 'tax' // 세제/세금
  | 'other';

export const POLICY_CATEGORY_LABELS: Record<PolicyCategory, string> = {
  funding: '정책자금',
  rnd: 'R&D',
  manpower: '인력지원',
  marketing: '판로/마케팅',
  export: '수출지원',
  certification: '인증/특허',
  consulting: '컨설팅',
  education: '교육/멘토링',
  space: '공간/시설',
  tax: '세제/세금',
  other: '기타',
};

// 기업 프로파일
export interface CompanyProfile {
  id: string;
  name: string;
  business_number: string; // 사업자등록번호
  ceo_name: string;
  industry: string; // 업종
  industry_code: string; // 업종코드
  established_date: string;
  employee_count: number;
  annual_revenue: number; // 연매출
  location: string; // 소재지
  company_type: CompanyType;
  growth_stage: GrowthStage;
  certifications: string[]; // 보유 인증
  technologies: string[]; // 보유 기술
  previous_supports: string[]; // 정책지원 활용 이력
  financial_data?: FinancialData;
  created_at: string;
  updated_at: string;
}

export type CompanyType =
  | 'startup' // 창업기업
  | 'small' // 소기업
  | 'medium' // 중기업
  | 'social' // 사회적기업
  | 'venture'; // 벤처기업

export type GrowthStage =
  | 'seed' // 예비/씨앗
  | 'early' // 초기 (1-3년)
  | 'growth' // 성장기 (3-7년)
  | 'expansion' // 확장기 (7년+)
  | 'mature'; // 성숙기

export const GROWTH_STAGE_LABELS: Record<GrowthStage, string> = {
  seed: '예비/씨앗 단계',
  early: '초기 성장 (1-3년)',
  growth: '성장기 (3-7년)',
  expansion: '확장기 (7년+)',
  mature: '성숙기',
};

export interface FinancialData {
  revenue: number;
  operating_profit: number;
  net_income: number;
  total_assets: number;
  total_debt: number;
  growth_rate: number; // 매출 성장률
  year: number;
}

// 매칭 결과
export interface MatchResult {
  id: string;
  company_id: string;
  policy_id: string;
  policy: PolicyAnnouncement;
  match_score: number; // 0-100
  match_reasons: string[];
  eligibility_status: 'eligible' | 'likely' | 'uncertain' | 'ineligible';
  recommended_priority: 'high' | 'medium' | 'low';
  preparation_tips: string[];
  estimated_approval_rate: number; // 예상 선정률
  created_at: string;
}

// 정책지원 사업 관리 (전주기)
export interface PolicyApplication {
  id: string;
  company_id: string;
  policy_id: string;
  policy: PolicyAnnouncement;
  status: ApplicationStatus;
  applied_date?: string;
  documents: ApplicationDocument[];
  timeline: ApplicationTimeline[];
  notes: string;
  result?: 'selected' | 'rejected' | 'pending';
  created_at: string;
  updated_at: string;
}

export type ApplicationStatus =
  | 'researching' // 조사 중
  | 'preparing' // 준비 중
  | 'documents_ready' // 서류 준비 완료
  | 'applied' // 신청 완료
  | 'reviewing' // 심사 중
  | 'presentation' // 발표심사
  | 'selected' // 선정
  | 'rejected' // 탈락
  | 'executing' // 사업수행 중
  | 'completed'; // 완료

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  researching: '조사 중',
  preparing: '준비 중',
  documents_ready: '서류 준비 완료',
  applied: '신청 완료',
  reviewing: '심사 중',
  presentation: '발표심사',
  selected: '선정',
  rejected: '탈락',
  executing: '사업수행 중',
  completed: '완료',
};

export interface ApplicationDocument {
  name: string;
  status: 'pending' | 'ready' | 'submitted';
  file_url?: string;
}

export interface ApplicationTimeline {
  date: string;
  event: string;
  description: string;
}

// 대시보드 통계
export interface DashboardStats {
  total_policies: number;
  open_policies: number;
  matched_policies: number;
  active_applications: number;
  success_rate: number;
  total_support_amount: number;
}

// 사용자
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'user';
  company_id?: string;
  created_at: string;
}
