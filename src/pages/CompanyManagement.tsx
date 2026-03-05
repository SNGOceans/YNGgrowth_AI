import { useEffect, useState } from 'react';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { useCompanyStore } from '@/stores/companyStore';
import { analyzeGrowthStage } from '@/services/matchingEngine';
import { GROWTH_STAGE_LABELS } from '@/types';
import type { CompanyProfile, CompanyType, GrowthStage } from '@/types';
import {
  Building2,
  Plus,
  X,
  Users,
  TrendingUp,
  MapPin,
  Award,
  Cpu,
  Calendar,
  Edit3,
  ChevronRight,
  BarChart3,
} from 'lucide-react';

export default function CompanyManagement() {
  const {
    companies,
    selectedCompany,
    isLoading,
    setSelectedCompany,
    fetchCompanies,
    addCompany,
    updateCompany,
  } = useCompanyStore();

  const [showForm, setShowForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState<CompanyProfile | null>(null);

  useEffect(() => {
    if (companies.length === 0) {
      fetchCompanies();
    }
  }, []);

  const handleAdd = () => {
    setEditingCompany(null);
    setShowForm(true);
  };

  const handleEdit = (company: CompanyProfile) => {
    setEditingCompany(company);
    setShowForm(true);
  };

  const handleFormSubmit = (data: Omit<CompanyProfile, 'id' | 'created_at' | 'updated_at'>) => {
    if (editingCompany) {
      updateCompany(editingCompany.id, data);
    } else {
      addCompany(data);
    }
    setShowForm(false);
    setEditingCompany(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">기업관리</h1>
          <p className="text-sm text-gray-500 mt-1">관리 기업의 프로파일과 성장 분석을 확인하세요.</p>
        </div>
        <button
          onClick={handleAdd}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          기업 등록
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Company List Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200">
            <h2 className="text-base font-semibold text-gray-900">기업 목록</h2>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase">기업명</th>
                    <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase">대표자</th>
                    <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase">업종</th>
                    <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase">성장단계</th>
                    <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase">연매출</th>
                    <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase">동작</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {companies.map((company) => (
                    <tr
                      key={company.id}
                      onClick={() => setSelectedCompany(company)}
                      className={cn(
                        'cursor-pointer hover:bg-blue-50/50 transition-colors',
                        selectedCompany?.id === company.id && 'bg-blue-50'
                      )}
                    >
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-medium text-gray-900">{company.name}</span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-600">{company.ceo_name}</td>
                      <td className="px-5 py-3.5 text-sm text-gray-600">{company.industry}</td>
                      <td className="px-5 py-3.5">
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                          {GROWTH_STAGE_LABELS[company.growth_stage]}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-600">
                        {formatCurrency(company.annual_revenue)}
                      </td>
                      <td className="px-5 py-3.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(company);
                          }}
                          className="p-1.5 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                        >
                          <Edit3 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!isLoading && companies.length === 0 && (
            <div className="text-center py-12">
              <Building2 size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 text-sm">등록된 기업이 없습니다.</p>
            </div>
          )}
        </div>

        {/* Company Profile Card */}
        <div className="space-y-4">
          {selectedCompany ? (
            <>
              <CompanyProfileCard company={selectedCompany} />
              <GrowthAnalysisCard company={selectedCompany} />
            </>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <ChevronRight size={32} className="mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">기업을 선택하면 상세 정보를 확인할 수 있습니다.</p>
            </div>
          )}
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <CompanyFormModal
          company={editingCompany}
          onSubmit={handleFormSubmit}
          onClose={() => {
            setShowForm(false);
            setEditingCompany(null);
          }}
        />
      )}
    </div>
  );
}

function CompanyProfileCard({ company }: { company: CompanyProfile }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-base font-semibold text-gray-900 mb-4">{company.name}</h3>
      <div className="space-y-3">
        <InfoItem icon={<Users size={14} />} label="대표자" value={company.ceo_name} />
        <InfoItem icon={<Building2 size={14} />} label="업종" value={company.industry} />
        <InfoItem icon={<MapPin size={14} />} label="소재지" value={company.location} />
        <InfoItem icon={<Calendar size={14} />} label="설립일" value={formatDate(company.established_date)} />
        <InfoItem icon={<Users size={14} />} label="직원수" value={`${company.employee_count}명`} />
        <InfoItem icon={<TrendingUp size={14} />} label="연매출" value={formatCurrency(company.annual_revenue)} />

        {company.certifications.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
              <Award size={14} />
              <span>보유 인증</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {company.certifications.map((cert) => (
                <span key={cert} className="px-2 py-0.5 text-xs rounded bg-yellow-50 text-yellow-700">
                  {cert}
                </span>
              ))}
            </div>
          </div>
        )}

        {company.technologies.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
              <Cpu size={14} />
              <span>보유 기술</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {company.technologies.map((tech) => (
                <span key={tech} className="px-2 py-0.5 text-xs rounded bg-purple-50 text-purple-700">
                  {tech}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function GrowthAnalysisCard({ company }: { company: CompanyProfile }) {
  const analysis = analyzeGrowthStage(company);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 size={16} className="text-blue-500" />
        <h3 className="text-base font-semibold text-gray-900">성장 단계 분석</h3>
      </div>

      {/* Stage & Confidence */}
      <div className="flex items-center justify-between mb-4">
        <span className="px-3 py-1 rounded-lg text-sm font-semibold bg-blue-100 text-blue-700">
          {GROWTH_STAGE_LABELS[analysis.stage]}
        </span>
        <span className="text-xs text-gray-500">신뢰도 {analysis.confidence}%</span>
      </div>

      {/* Confidence Bar */}
      <div className="w-full h-2 rounded-full bg-gray-100 mb-4">
        <div
          className="h-2 rounded-full bg-blue-500 transition-all"
          style={{ width: `${analysis.confidence}%` }}
        />
      </div>

      {/* Factors */}
      <div className="mb-4">
        <p className="text-xs font-medium text-gray-500 mb-2">분석 근거</p>
        <ul className="space-y-1">
          {analysis.factors.map((factor, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
              <span className="w-1 h-1 rounded-full bg-gray-400 shrink-0 mt-1.5" />
              {factor}
            </li>
          ))}
        </ul>
      </div>

      {/* Recommendations */}
      <div>
        <p className="text-xs font-medium text-gray-500 mb-2">추천 사항</p>
        <ul className="space-y-1">
          {analysis.recommendations.map((rec, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-blue-600">
              <span className="w-1 h-1 rounded-full bg-blue-400 shrink-0 mt-1.5" />
              {rec}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5 text-xs text-gray-400">
        {icon}
        <span>{label}</span>
      </div>
      <span className="text-sm text-gray-900">{value}</span>
    </div>
  );
}

function CompanyFormModal({
  company,
  onSubmit,
  onClose,
}: {
  company: CompanyProfile | null;
  onSubmit: (data: Omit<CompanyProfile, 'id' | 'created_at' | 'updated_at'>) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    name: company?.name || '',
    business_number: company?.business_number || '',
    ceo_name: company?.ceo_name || '',
    industry: company?.industry || '',
    industry_code: company?.industry_code || '',
    established_date: company?.established_date || '',
    employee_count: company?.employee_count || 0,
    annual_revenue: company?.annual_revenue || 0,
    location: company?.location || '',
    company_type: (company?.company_type || 'startup') as CompanyType,
    growth_stage: (company?.growth_stage || 'seed') as GrowthStage,
    certifications: company?.certifications || [],
    technologies: company?.technologies || [],
    previous_supports: company?.previous_supports || [],
  });

  const [certInput, setCertInput] = useState('');
  const [techInput, setTechInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  const addCert = () => {
    if (certInput.trim()) {
      setForm((f) => ({ ...f, certifications: [...f.certifications, certInput.trim()] }));
      setCertInput('');
    }
  };

  const addTech = () => {
    if (techInput.trim()) {
      setForm((f) => ({ ...f, technologies: [...f.technologies, techInput.trim()] }));
      setTechInput('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">
            {company ? '기업 수정' : '기업 등록'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <FormField label="기업명" required>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="사업자등록번호">
              <input
                type="text"
                value={form.business_number}
                onChange={(e) => setForm((f) => ({ ...f, business_number: e.target.value }))}
                placeholder="000-00-00000"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </FormField>
            <FormField label="대표자명" required>
              <input
                type="text"
                value={form.ceo_name}
                onChange={(e) => setForm((f) => ({ ...f, ceo_name: e.target.value }))}
                required
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="업종">
              <input
                type="text"
                value={form.industry}
                onChange={(e) => setForm((f) => ({ ...f, industry: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </FormField>
            <FormField label="설립일">
              <input
                type="date"
                value={form.established_date}
                onChange={(e) => setForm((f) => ({ ...f, established_date: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="직원수">
              <input
                type="number"
                value={form.employee_count}
                onChange={(e) => setForm((f) => ({ ...f, employee_count: Number(e.target.value) }))}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </FormField>
            <FormField label="연매출 (원)">
              <input
                type="number"
                value={form.annual_revenue}
                onChange={(e) => setForm((f) => ({ ...f, annual_revenue: Number(e.target.value) }))}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </FormField>
          </div>

          <FormField label="소재지">
            <input
              type="text"
              value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="기업유형">
              <select
                value={form.company_type}
                onChange={(e) => setForm((f) => ({ ...f, company_type: e.target.value as CompanyType }))}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="startup">창업기업</option>
                <option value="small">소기업</option>
                <option value="medium">중기업</option>
                <option value="social">사회적기업</option>
                <option value="venture">벤처기업</option>
              </select>
            </FormField>
            <FormField label="성장단계">
              <select
                value={form.growth_stage}
                onChange={(e) => setForm((f) => ({ ...f, growth_stage: e.target.value as GrowthStage }))}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="seed">예비/씨앗</option>
                <option value="early">초기 (1-3년)</option>
                <option value="growth">성장기 (3-7년)</option>
                <option value="expansion">확장기 (7년+)</option>
                <option value="mature">성숙기</option>
              </select>
            </FormField>
          </div>

          {/* Certifications */}
          <FormField label="보유 인증">
            <div className="flex gap-2">
              <input
                type="text"
                value={certInput}
                onChange={(e) => setCertInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCert())}
                placeholder="인증명 입력 후 Enter"
                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button type="button" onClick={addCert} className="px-3 py-2 text-sm bg-gray-100 rounded-lg hover:bg-gray-200">
                추가
              </button>
            </div>
            {form.certifications.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {form.certifications.map((c, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded bg-yellow-50 text-yellow-700">
                    {c}
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, certifications: f.certifications.filter((_, j) => j !== i) }))}
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </FormField>

          {/* Technologies */}
          <FormField label="보유 기술">
            <div className="flex gap-2">
              <input
                type="text"
                value={techInput}
                onChange={(e) => setTechInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTech())}
                placeholder="기술명 입력 후 Enter"
                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button type="button" onClick={addTech} className="px-3 py-2 text-sm bg-gray-100 rounded-lg hover:bg-gray-200">
                추가
              </button>
            </div>
            {form.technologies.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {form.technologies.map((t, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded bg-purple-50 text-purple-700">
                    {t}
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, technologies: f.technologies.filter((_, j) => j !== i) }))}
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </FormField>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {company ? '수정' : '등록'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              취소
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}
