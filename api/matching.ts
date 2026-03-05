import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'POST' && req.url?.includes('/run')) {
      return await runMatching(req, res);
    }

    if (req.method === 'GET' && req.url?.includes('/results')) {
      return await getMatchResults(req, res);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Matching API error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

/**
 * POST /api/matching/run
 * 특정 기업에 대한 정책 매칭 실행
 */
async function runMatching(req: VercelRequest, res: VercelResponse) {
  const { company_id } = req.body || {};

  if (!company_id) {
    return res.status(400).json({ error: 'company_id는 필수입니다.' });
  }

  // 1. 기업 정보 조회
  const { data: company, error: companyError } = await supabase
    .from('companies')
    .select('*')
    .eq('id', company_id)
    .single();

  if (companyError || !company) {
    return res.status(404).json({ error: '기업 정보를 찾을 수 없습니다.' });
  }

  // 2. 재무 데이터 조회 (최신 연도)
  const { data: financials } = await supabase
    .from('financial_data')
    .select('*')
    .eq('company_id', company_id)
    .order('year', { ascending: false })
    .limit(1);

  const latestFinancial = financials?.[0] || null;

  // 3. 현재 공개 중인 정책공고 조회
  const { data: policies, error: policiesError } = await supabase
    .from('policy_announcements')
    .select('*')
    .in('status', ['upcoming', 'open']);

  if (policiesError) {
    return res.status(500).json({ error: '정책 목록 조회 실패' });
  }

  // 4. 각 정책에 대해 매칭 스코어 계산
  const matchResults = [];

  for (const policy of policies || []) {
    const result = calculateMatchScore(company, latestFinancial, policy);

    if (result.match_score >= 30) {
      matchResults.push({
        company_id,
        policy_id: policy.id,
        ...result,
      });
    }
  }

  // 5. 기존 매칭 결과 삭제 후 새로 저장
  await supabase
    .from('match_results')
    .delete()
    .eq('company_id', company_id);

  if (matchResults.length > 0) {
    const { error: insertError } = await supabase
      .from('match_results')
      .insert(matchResults);

    if (insertError) {
      return res.status(500).json({ error: `매칭 결과 저장 실패: ${insertError.message}` });
    }
  }

  return res.status(200).json({
    message: `매칭 완료: ${matchResults.length}건의 정책이 매칭되었습니다.`,
    total_policies: policies?.length || 0,
    matched: matchResults.length,
    results: matchResults.sort((a, b) => b.match_score - a.match_score),
  });
}

/**
 * GET /api/matching/results?company_id=xxx
 * 매칭 결과 조회
 */
async function getMatchResults(req: VercelRequest, res: VercelResponse) {
  const { company_id, min_score = '0' } = req.query;

  if (!company_id) {
    return res.status(400).json({ error: 'company_id는 필수입니다.' });
  }

  let query = supabase
    .from('match_results')
    .select(`
      *,
      policy:policy_announcements(*)
    `)
    .eq('company_id', company_id as string)
    .gte('match_score', parseInt(min_score as string, 10))
    .order('match_score', { ascending: false });

  const { data, error } = await query;

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  return res.status(200).json({ data });
}

/**
 * 기업-정책 매칭 스코어 계산
 * 룰 기반 매칭 (MVP) - 추후 AI 기반으로 고도화
 */
function calculateMatchScore(
  company: any,
  financial: any,
  policy: any
): {
  match_score: number;
  match_reasons: string[];
  eligibility_status: string;
  recommended_priority: string;
  preparation_tips: string[];
  estimated_approval_rate: number;
} {
  let score = 0;
  const reasons: string[] = [];
  const tips: string[] = [];

  // 1. 기업 유형 매칭 (최대 20점)
  if (policy.target_audience) {
    const target = policy.target_audience.toLowerCase();
    const typeMap: Record<string, string[]> = {
      startup: ['창업', '스타트업', '예비창업'],
      small: ['소기업', '중소기업', '소상공인'],
      medium: ['중기업', '중소기업', '중견기업'],
      social: ['사회적기업', '사회적경제'],
      venture: ['벤처', '혁신기업', '기술기업'],
    };
    const keywords = typeMap[company.company_type] || [];
    if (keywords.some((kw) => target.includes(kw))) {
      score += 20;
      reasons.push(`기업 유형(${company.company_type})이 지원 대상과 일치`);
    }
  }

  // 2. 업종 매칭 (최대 15점)
  if (policy.target_audience && company.industry) {
    const target = policy.target_audience.toLowerCase();
    if (target.includes(company.industry.toLowerCase())) {
      score += 15;
      reasons.push(`업종(${company.industry})이 지원 대상 업종과 일치`);
    }
  }

  // 3. 기업 규모 매칭 (최대 15점)
  if (company.employee_count) {
    if (policy.eligibility?.includes('소기업') && company.employee_count <= 50) {
      score += 15;
      reasons.push('소기업 규모 조건 충족');
    } else if (policy.eligibility?.includes('중소기업') && company.employee_count <= 300) {
      score += 15;
      reasons.push('중소기업 규모 조건 충족');
    }
  }

  // 4. 성장 단계 매칭 (최대 10점)
  if (company.growth_stage) {
    const stageScore: Record<string, string[]> = {
      seed: ['예비창업', '창업초기', '시드'],
      early: ['초기', '창업', '3년이내'],
      growth: ['성장', '스케일업', '도약'],
      expansion: ['확장', '해외진출', '수출'],
      mature: ['성숙', '재도약', '혁신'],
    };
    const keywords = stageScore[company.growth_stage] || [];
    if (policy.target_audience && keywords.some((kw) => policy.target_audience.includes(kw))) {
      score += 10;
      reasons.push(`성장 단계(${company.growth_stage})가 정책 대상과 부합`);
    }
  }

  // 5. 인증 보유 매칭 (최대 10점)
  if (company.certifications?.length > 0) {
    const certKeywords = ['벤처인증', '이노비즈', '메인비즈', '기업부설연구소', 'ISO'];
    const matched = company.certifications.filter((cert: string) =>
      certKeywords.some((kw) => cert.includes(kw))
    );
    if (matched.length > 0) {
      score += Math.min(matched.length * 5, 10);
      reasons.push(`보유 인증(${matched.join(', ')})이 가점 요소`);
    }
  }

  // 6. 재무 건전성 (최대 10점)
  if (financial) {
    if (financial.growth_rate > 0) {
      score += 5;
      reasons.push(`매출 성장률 양호 (${financial.growth_rate}%)`);
    }
    if (financial.revenue > 0 && financial.operating_profit > 0) {
      score += 5;
      reasons.push('영업이익 흑자 기업');
    }
  }

  // 7. 지역 매칭 (최대 10점)
  if (company.location && policy.target_audience) {
    const regions = ['서울', '경기', '인천', '부산', '대구', '대전', '광주', '울산', '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'];
    for (const region of regions) {
      if (company.location.includes(region) && policy.target_audience.includes(region)) {
        score += 10;
        reasons.push(`소재지(${region})가 지원 대상 지역과 일치`);
        break;
      }
    }
  }

  // 8. 기존 수혜 이력 (최대 10점 - 감점 가능)
  if (company.previous_supports?.length > 0) {
    if (company.previous_supports.some((s: string) => s.includes(policy.organization))) {
      score -= 5;
      reasons.push('동일 기관 기수혜 이력 있음 (감점)');
      tips.push('기수혜 이력이 있으므로 차별화된 사업계획 필요');
    }
  }

  // 스코어 범위 조정
  score = Math.max(0, Math.min(100, score));

  // 자격 상태 판별
  let eligibility_status = 'uncertain';
  if (score >= 70) eligibility_status = 'eligible';
  else if (score >= 50) eligibility_status = 'likely';
  else if (score < 30) eligibility_status = 'ineligible';

  // 우선순위 결정
  let recommended_priority = 'low';
  if (score >= 70) recommended_priority = 'high';
  else if (score >= 50) recommended_priority = 'medium';

  // 준비 팁 추가
  if (policy.difficulty === 'hard') {
    tips.push('난이도 높은 공고 - 전문 컨설팅 검토 권장');
  }
  if (policy.preparation_period && policy.preparation_period > 30) {
    tips.push(`준비 기간이 ${policy.preparation_period}일 이상 필요 - 조기 준비 권장`);
  }
  if (!company.certifications?.length) {
    tips.push('관련 인증 취득 시 가점 획득 가능');
  }

  // 예상 선정률 (간이 추정)
  const estimated_approval_rate = Math.min(Math.round(score * 0.6), 80);

  return {
    match_score: score,
    match_reasons: reasons,
    eligibility_status,
    recommended_priority,
    preparation_tips: tips,
    estimated_approval_rate,
  };
}
