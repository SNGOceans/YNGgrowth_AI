import type { CompanyProfile, PolicyAnnouncement, MatchResult, GrowthStage } from '@/types';

// 기업-정책 매칭 점수 계산 엔진
export function calculateMatchScore(company: CompanyProfile, policy: PolicyAnnouncement): MatchResult {
  let score = 0;
  const reasons: string[] = [];
  const tips: string[] = [];

  // 1. 기본 자격 요건 체크 (업종, 규모, 업력)
  const companyAge = getCompanyAge(company.established_date);

  // 업력 기반 매칭
  if (policy.eligibility.includes('3년') && companyAge >= 3) {
    score += 15;
    reasons.push(`업력 ${companyAge}년 - 자격 조건 충족`);
  } else if (policy.eligibility.includes('7년') && companyAge <= 7) {
    score += 15;
    reasons.push(`업력 ${companyAge}년 - 창업기업 조건 충족`);
  } else {
    score += 5;
  }

  // 2. 기업 유형 매칭
  if (policy.target_audience.includes('중소기업') && ['small', 'medium', 'startup', 'venture'].includes(company.company_type)) {
    score += 10;
    reasons.push('중소기업 자격 충족');
  }
  if (policy.target_audience.includes('창업') && ['startup'].includes(company.company_type)) {
    score += 10;
    reasons.push('창업기업 우대 대상');
  }
  if (policy.target_audience.includes('벤처') && company.certifications.includes('벤처기업')) {
    score += 10;
    reasons.push('벤처기업 인증 보유');
  }

  // 3. 인증 보유 가산
  if (company.certifications.length > 0) {
    score += Math.min(company.certifications.length * 5, 15);
    reasons.push(`인증 ${company.certifications.length}건 보유 (${company.certifications.join(', ')})`);
  }

  // 4. 이전 수혜 이력 분석
  if (company.previous_supports.length > 0) {
    score += 5;
    reasons.push('정책지원 활용 경험 보유');
    tips.push('이전 지원사업 성과를 사업계획서에 반영');
  } else {
    score += 3;
    tips.push('첫 정책지원 신청 - 사업의 성장 가능성 강조');
  }

  // 5. 재무 건전성 체크
  if (company.financial_data) {
    const fd = company.financial_data;
    if (fd.growth_rate > 20) {
      score += 10;
      reasons.push(`매출 성장률 ${fd.growth_rate}% - 고성장 기업`);
    }
    if (fd.operating_profit > 0) {
      score += 5;
      reasons.push('영업이익 흑자 기업');
    }
    if (fd.total_debt / fd.total_assets < 0.7) {
      score += 5;
      reasons.push('부채비율 양호');
    }
  }

  // 6. 카테고리별 특수 매칭
  score += getCategoryBonus(company, policy, reasons, tips);

  // 7. 성장 단계별 적합도
  score += getGrowthStageBonus(company.growth_stage, policy, reasons);

  // 정규화 (0-100)
  score = Math.min(Math.max(score, 0), 100);

  const eligibility = score >= 75 ? 'eligible' : score >= 50 ? 'likely' : score >= 30 ? 'uncertain' : 'ineligible';
  const priority = score >= 75 ? 'high' : score >= 50 ? 'medium' : 'low';
  const approvalRate = estimateApprovalRate(score, policy.difficulty);

  // 기본 준비 팁 추가
  tips.push(...getDefaultTips(policy));

  return {
    id: `match_${company.id}_${policy.id}`,
    company_id: company.id,
    policy_id: policy.id,
    policy,
    match_score: score,
    match_reasons: reasons,
    eligibility_status: eligibility,
    recommended_priority: priority,
    preparation_tips: tips,
    estimated_approval_rate: approvalRate,
    created_at: new Date().toISOString(),
  };
}

function getCompanyAge(established: string): number {
  const est = new Date(established);
  const now = new Date();
  return Math.floor((now.getTime() - est.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
}

function getCategoryBonus(company: CompanyProfile, policy: PolicyAnnouncement, reasons: string[], tips: string[]): number {
  let bonus = 0;
  switch (policy.category) {
    case 'rnd':
      if (company.technologies.length > 0) {
        bonus += 10;
        reasons.push(`기술 역량 보유: ${company.technologies.join(', ')}`);
        tips.push('보유 기술의 혁신성과 시장성 강조');
      }
      break;
    case 'export':
      if (company.annual_revenue >= 1000000000) {
        bonus += 10;
        reasons.push('수출 가능 규모의 매출');
        tips.push('해외시장 진출 전략 수립 필요');
      }
      break;
    case 'certification':
      if (company.certifications.length > 0) {
        bonus += 5;
      }
      tips.push('기술 및 경영혁신 실적 정리');
      break;
    case 'manpower':
      if (company.employee_count <= 30) {
        bonus += 15;
        reasons.push(`종업원 ${company.employee_count}명 - 소규모 사업장 조건 충족`);
      }
      break;
    case 'funding':
      if (company.financial_data && company.financial_data.growth_rate > 10) {
        bonus += 10;
        reasons.push('성장성 우수 기업');
      }
      break;
  }
  return bonus;
}

function getGrowthStageBonus(stage: GrowthStage, policy: PolicyAnnouncement, reasons: string[]): number {
  const stageMatch: Record<GrowthStage, string[]> = {
    seed: ['education', 'consulting'],
    early: ['funding', 'rnd', 'education', 'manpower'],
    growth: ['funding', 'rnd', 'export', 'certification'],
    expansion: ['export', 'marketing', 'certification'],
    mature: ['rnd', 'export', 'tax'],
  };

  if (stageMatch[stage]?.includes(policy.category)) {
    reasons.push(`${stage} 단계 기업에 적합한 지원 유형`);
    return 10;
  }
  return 0;
}

function estimateApprovalRate(score: number, difficulty: string): number {
  const baseRate = score * 0.5;
  const difficultyFactor = difficulty === 'easy' ? 1.3 : difficulty === 'medium' ? 1.0 : 0.7;
  return Math.min(Math.round(baseRate * difficultyFactor), 80);
}

function getDefaultTips(policy: PolicyAnnouncement): string[] {
  const tips: string[] = [];
  if (policy.required_documents.length > 0) {
    tips.push(`필수 서류 ${policy.required_documents.length}종 사전 준비`);
  }
  if (policy.preparation_period > 14) {
    tips.push(`준비기간 약 ${policy.preparation_period}일 필요 - 조기 준비 권장`);
  }
  return tips;
}

// 기업 성장단계 자동 분석
export function analyzeGrowthStage(company: CompanyProfile): {
  stage: GrowthStage;
  confidence: number;
  factors: string[];
  recommendations: string[];
} {
  const age = getCompanyAge(company.established_date);
  const factors: string[] = [];
  const recommendations: string[] = [];
  let stage: GrowthStage = 'seed';

  if (age < 1) {
    stage = 'seed';
    factors.push('업력 1년 미만');
    recommendations.push('예비창업 지원사업 및 창업교육 프로그램 활용 추천');
  } else if (age <= 3) {
    stage = 'early';
    factors.push(`업력 ${age}년 - 초기 단계`);
    recommendations.push('창업초기자금, R&D 지원, 멘토링 프로그램 우선 신청');
  } else if (age <= 7) {
    stage = 'growth';
    factors.push(`업력 ${age}년 - 성장 단계`);
    recommendations.push('정책자금, 수출지원, 인증 취득으로 사업 확대');
  } else if (age <= 15) {
    stage = 'expansion';
    factors.push(`업력 ${age}년 - 확장 단계`);
    recommendations.push('해외진출, 기술혁신, M&A 관련 지원사업 활용');
  } else {
    stage = 'mature';
    factors.push(`업력 ${age}년 - 성숙 단계`);
    recommendations.push('경영혁신, 신사업 진출, 세제 혜택 활용');
  }

  // 재무 기반 보정
  if (company.financial_data) {
    if (company.financial_data.growth_rate > 50) {
      factors.push('초고성장 기업 (성장률 50%+)');
      recommendations.push('스케일업 지원 프로그램 적극 활용');
    }
    if (company.annual_revenue > 5000000000) {
      factors.push('매출 50억 이상');
    }
  }

  if (company.certifications.length >= 2) {
    factors.push(`다수 인증 보유 (${company.certifications.length}건)`);
    recommendations.push('인증 기반 우대 혜택 최대 활용');
  }

  const confidence = calculateConfidence(company);

  return { stage, confidence, factors, recommendations };
}

function calculateConfidence(company: CompanyProfile): number {
  let confidence = 50;
  if (company.financial_data) confidence += 20;
  if (company.certifications.length > 0) confidence += 10;
  if (company.technologies.length > 0) confidence += 10;
  if (company.previous_supports.length > 0) confidence += 10;
  return Math.min(confidence, 100);
}

// 전체 기업에 대한 정책 매칭 실행
export function runMatchingForCompany(company: CompanyProfile, policies: PolicyAnnouncement[]): MatchResult[] {
  return policies
    .filter(p => p.status !== 'closed')
    .map(p => calculateMatchScore(company, p))
    .sort((a, b) => b.match_score - a.match_score);
}
