import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    switch (req.method) {
      case 'GET':
        return await getCompanies(req, res);
      case 'POST':
        return await createCompany(req, res);
      case 'PUT':
        return await updateCompany(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('Companies API error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

/**
 * GET /api/companies
 * 기업 목록 조회
 */
async function getCompanies(req: VercelRequest, res: VercelResponse) {
  const { search, company_type, page = '1', limit = '20' } = req.query;

  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const offset = (pageNum - 1) * limitNum;

  let query = supabase
    .from('companies')
    .select('*', { count: 'exact' });

  // 검색어 필터
  if (search) {
    query = query.or(
      `name.ilike.%${search}%,business_number.ilike.%${search}%,ceo_name.ilike.%${search}%`
    );
  }

  // 기업 유형 필터
  if (company_type && company_type !== 'all') {
    query = query.eq('company_type', company_type as string);
  }

  query = query
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
 * POST /api/companies
 * 기업 등록
 */
async function createCompany(req: VercelRequest, res: VercelResponse) {
  const {
    name,
    business_number,
    ceo_name,
    industry,
    industry_code,
    established_date,
    employee_count,
    annual_revenue,
    location,
    company_type,
    growth_stage,
    certifications,
    technologies,
    previous_supports,
  } = req.body || {};

  // 필수 필드 검증
  if (!name || !business_number || !ceo_name) {
    return res.status(400).json({
      error: '기업명(name), 사업자번호(business_number), 대표자명(ceo_name)은 필수입니다.',
    });
  }

  // 사업자번호 중복 체크
  const { data: existing } = await supabase
    .from('companies')
    .select('id')
    .eq('business_number', business_number)
    .single();

  if (existing) {
    return res.status(409).json({ error: '이미 등록된 사업자번호입니다.' });
  }

  const { data, error } = await supabase
    .from('companies')
    .insert({
      name,
      business_number,
      ceo_name,
      industry,
      industry_code,
      established_date,
      employee_count: employee_count || 0,
      annual_revenue: annual_revenue || 0,
      location,
      company_type,
      growth_stage,
      certifications: certifications || [],
      technologies: technologies || [],
      previous_supports: previous_supports || [],
    })
    .select()
    .single();

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  return res.status(201).json({ data });
}

/**
 * PUT /api/companies/:id
 * 기업 정보 수정 (id는 query parameter로 전달)
 */
async function updateCompany(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'id는 필수입니다.' });
  }

  const updateFields = req.body || {};

  // 빈 업데이트 방지
  if (Object.keys(updateFields).length === 0) {
    return res.status(400).json({ error: '수정할 필드가 없습니다.' });
  }

  // updated_at 자동 갱신
  updateFields.updated_at = new Date().toISOString();

  // id, created_at 등 수정 불가 필드 제거
  delete updateFields.id;
  delete updateFields.created_at;

  const { data, error } = await supabase
    .from('companies')
    .update(updateFields)
    .eq('id', id as string)
    .select()
    .single();

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  if (!data) {
    return res.status(404).json({ error: '해당 기업을 찾을 수 없습니다.' });
  }

  return res.status(200).json({ data });
}
