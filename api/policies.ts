import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      return await getPolicies(req, res);
    }

    if (req.method === 'POST' && req.url?.includes('/sync')) {
      return await syncPolicies(req, res);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Policies API error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

/**
 * GET /api/policies
 * 정책공고 목록 조회 (필터링: category, status, search)
 */
async function getPolicies(req: VercelRequest, res: VercelResponse) {
  const { category, status, search, page = '1', limit = '20' } = req.query;

  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const offset = (pageNum - 1) * limitNum;

  let query = supabase
    .from('policy_announcements')
    .select('*', { count: 'exact' });

  // 카테고리 필터
  if (category && category !== 'all') {
    query = query.eq('category', category as string);
  }

  // 상태 필터
  if (status && status !== 'all') {
    query = query.eq('status', status as string);
  }

  // 검색어 필터 (제목, 기관명, 설명에서 검색)
  if (search) {
    query = query.or(
      `title.ilike.%${search}%,organization.ilike.%${search}%,description.ilike.%${search}%`
    );
  }

  // 페이지네이션 및 정렬
  query = query
    .order('application_end', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })
    .range(offset, offset + limitNum - 1);

  const { data, error, count } = await query;

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  return res.status(200).json({
    data,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limitNum),
    },
  });
}

/**
 * POST /api/policies/sync
 * 외부 API(기업마당 등)에서 정책공고 동기화
 */
async function syncPolicies(req: VercelRequest, res: VercelResponse) {
  const { source = 'bizinfo' } = req.body || {};

  let synced = 0;
  let errors: string[] = [];

  if (source === 'bizinfo') {
    // 기업마당 API 연동 예시
    // 실제 API 키와 엔드포인트는 환경변수로 관리
    const apiKey = process.env.BIZINFO_API_KEY;
    const apiUrl = 'https://www.bizinfo.go.kr/uss/rss/bizInfoApi.do';

    if (!apiKey) {
      return res.status(400).json({
        error: 'BIZINFO_API_KEY 환경변수가 설정되지 않았습니다.',
      });
    }

    try {
      const response = await fetch(
        `${apiUrl}?crtfcKey=${apiKey}&dataType=json&pageUnit=50&pageIndex=1`
      );

      if (!response.ok) {
        throw new Error(`기업마당 API 응답 오류: ${response.status}`);
      }

      const result = await response.json();
      const items = result?.jsonArray || [];

      for (const item of items) {
        try {
          const policyData = mapBizinfoToPolicy(item);

          const { error: upsertError } = await supabase
            .from('policy_announcements')
            .upsert(policyData, {
              onConflict: 'title,organization',
              ignoreDuplicates: false,
            });

          if (upsertError) {
            errors.push(`${item.pblancNm}: ${upsertError.message}`);
          } else {
            synced++;
          }
        } catch (itemError: any) {
          errors.push(`${item.pblancNm}: ${itemError.message}`);
        }
      }
    } catch (fetchError: any) {
      return res.status(500).json({
        error: `기업마당 API 호출 실패: ${fetchError.message}`,
      });
    }
  }

  return res.status(200).json({
    message: `동기화 완료: ${synced}건 처리`,
    synced,
    errors: errors.length > 0 ? errors : undefined,
  });
}

/**
 * 기업마당 API 응답을 policy_announcements 테이블 형식으로 매핑
 */
function mapBizinfoToPolicy(item: any) {
  const now = new Date().toISOString();

  // 접수 상태 판별
  let status: 'upcoming' | 'open' | 'closed' = 'open';
  if (item.reqstBeginEndDe) {
    const endDate = new Date(item.reqstBeginEndDe);
    if (endDate < new Date()) {
      status = 'closed';
    }
  }

  // 카테고리 매핑
  const categoryMap: Record<string, string> = {
    '자금': 'funding',
    '기술': 'rnd',
    '인력': 'manpower',
    '수출': 'export',
    '내수': 'marketing',
    '창업': 'funding',
    '경영': 'consulting',
    '세제': 'tax',
    '인증': 'certification',
    '교육': 'education',
    '판로': 'marketing',
  };

  const category = categoryMap[item.pldirSportRealmLclasCodeNm] || 'other';

  return {
    title: item.pblancNm || '제목 없음',
    organization: item.jrsdInsttNm || '미상',
    category,
    target_audience: item.trgetNm || null,
    eligibility: item.sportCn || null,
    support_scale: item.sportCn || null,
    application_start: item.reqstBeginDe || null,
    application_end: item.reqstBeginEndDe || null,
    description: item.bsnsSumryCn || null,
    detail_url: item.detailPageUrl || null,
    status,
    source: 'bizinfo',
    raw_data: item,
    created_at: now,
    updated_at: now,
  };
}
