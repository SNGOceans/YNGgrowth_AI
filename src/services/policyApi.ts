import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ==========================================
// 타입 정의
// ==========================================

export interface Policy {
  id: string;
  title: string;
  organization: string;
  category: string;
  target_audience: string | null;
  eligibility: string | null;
  support_scale: string | null;
  application_start: string | null;
  application_end: string | null;
  required_documents: string[];
  description: string | null;
  detail_url: string | null;
  status: 'upcoming' | 'open' | 'closed';
  difficulty: 'easy' | 'medium' | 'hard';
  preparation_period: number;
  source: string | null;
  raw_data: any;
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: string;
  name: string;
  business_number: string;
  ceo_name: string;
  industry: string | null;
  industry_code: string | null;
  established_date: string | null;
  employee_count: number;
  annual_revenue: number;
  location: string | null;
  company_type: string | null;
  growth_stage: string | null;
  certifications: string[];
  technologies: string[];
  previous_supports: string[];
  created_at: string;
  updated_at: string;
}

export interface MatchResult {
  id: string;
  company_id: string;
  policy_id: string;
  match_score: number;
  match_reasons: string[];
  eligibility_status: string;
  recommended_priority: string;
  preparation_tips: string[];
  estimated_approval_rate: number;
  created_at: string;
  policy?: Policy;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ==========================================
// 정책공고 API
// ==========================================

export async function fetchPolicies(params?: {
  category?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<Policy>> {
  const { category, status, search, page = 1, limit = 20 } = params || {};
  const offset = (page - 1) * limit;

  let query = supabase
    .from('policy_announcements')
    .select('*', { count: 'exact' });

  if (category && category !== 'all') {
    query = query.eq('category', category);
  }
  if (status && status !== 'all') {
    query = query.eq('status', status);
  }
  if (search) {
    query = query.or(
      `title.ilike.%${search}%,organization.ilike.%${search}%,description.ilike.%${search}%`
    );
  }

  query = query
    .order('application_end', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) throw new Error(error.message);

  return {
    data: data || [],
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    },
  };
}

export async function fetchPolicyById(id: string): Promise<Policy> {
  const { data, error } = await supabase
    .from('policy_announcements')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function syncPolicies(source: string = 'bizinfo'): Promise<{
  message: string;
  synced: number;
  errors?: string[];
}> {
  const response = await fetch('/api/policies/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ source }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || '동기화 실패');
  }

  return response.json();
}

// ==========================================
// 매칭 API
// ==========================================

export async function runMatching(companyId: string): Promise<{
  message: string;
  total_policies: number;
  matched: number;
  results: MatchResult[];
}> {
  const response = await fetch('/api/matching/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ company_id: companyId }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || '매칭 실행 실패');
  }

  return response.json();
}

export async function fetchMatchResults(
  companyId: string,
  minScore?: number
): Promise<MatchResult[]> {
  let query = supabase
    .from('match_results')
    .select(`
      *,
      policy:policy_announcements(*)
    `)
    .eq('company_id', companyId)
    .order('match_score', { ascending: false });

  if (minScore !== undefined) {
    query = query.gte('match_score', minScore);
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message);
  return data || [];
}

// ==========================================
// 기업 관리 API
// ==========================================

export async function fetchCompanies(params?: {
  search?: string;
  company_type?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<Company>> {
  const { search, company_type, page = 1, limit = 20 } = params || {};
  const offset = (page - 1) * limit;

  let query = supabase
    .from('companies')
    .select('*', { count: 'exact' });

  if (search) {
    query = query.or(
      `name.ilike.%${search}%,business_number.ilike.%${search}%,ceo_name.ilike.%${search}%`
    );
  }
  if (company_type && company_type !== 'all') {
    query = query.eq('company_type', company_type);
  }

  query = query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) throw new Error(error.message);

  return {
    data: data || [],
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    },
  };
}

export async function fetchCompanyById(id: string): Promise<Company> {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function createCompany(
  company: Omit<Company, 'id' | 'created_at' | 'updated_at'>
): Promise<Company> {
  const { data, error } = await supabase
    .from('companies')
    .insert(company)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateCompany(
  id: string,
  updates: Partial<Company>
): Promise<Company> {
  const { data, error } = await supabase
    .from('companies')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// ==========================================
// 신청 관리 API
// ==========================================

export interface PolicyApplication {
  id: string;
  company_id: string;
  policy_id: string;
  status: string;
  applied_date: string | null;
  documents: any[];
  timeline: any[];
  notes: string | null;
  result: string | null;
  created_at: string;
  updated_at: string;
}

export async function fetchApplications(companyId: string): Promise<PolicyApplication[]> {
  const { data, error } = await supabase
    .from('policy_applications')
    .select(`
      *,
      policy:policy_announcements(id, title, organization, category, status)
    `)
    .eq('company_id', companyId)
    .order('updated_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function createApplication(
  companyId: string,
  policyId: string
): Promise<PolicyApplication> {
  const { data, error } = await supabase
    .from('policy_applications')
    .insert({
      company_id: companyId,
      policy_id: policyId,
      status: 'researching',
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateApplicationStatus(
  id: string,
  status: string,
  notes?: string
): Promise<PolicyApplication> {
  const updates: any = {
    status,
    updated_at: new Date().toISOString(),
  };
  if (notes !== undefined) updates.notes = notes;
  if (status === 'applied') updates.applied_date = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('policy_applications')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}
