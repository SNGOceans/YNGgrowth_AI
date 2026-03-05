import { useEffect, useState } from 'react';
import { cn, formatDate, getDaysRemaining } from '@/lib/utils';
import { usePolicyStore } from '@/stores/policyStore';
import { POLICY_CATEGORY_LABELS } from '@/types';
import type { PolicyAnnouncement, PolicyCategory } from '@/types';
import {
  Search,
  Filter,
  X,
  Calendar,
  Building,
  BarChart3,
  Clock,
  ExternalLink,
  FileText,
} from 'lucide-react';

export default function PolicyList() {
  const {
    policies,
    filters,
    selectedPolicy,
    isLoading,
    setFilters,
    setSelectedPolicy,
    fetchPolicies,
    getFilteredPolicies,
  } = usePolicyStore();

  useEffect(() => {
    if (policies.length === 0) {
      fetchPolicies();
    }
  }, []);

  const filteredPolicies = getFilteredPolicies();

  const difficultyLabel = (d: string) => {
    if (d === 'easy') return '쉬움';
    if (d === 'medium') return '보통';
    return '어려움';
  };

  const statusLabel = (s: string) => {
    if (s === 'open') return '접수중';
    if (s === 'upcoming') return '접수예정';
    return '마감';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">정책공고</h1>
        <p className="text-sm text-gray-500 mt-1">정부 정책공고를 검색하고 확인하세요.</p>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="정책명 또는 주관기관 검색..."
              value={filters.search}
              onChange={(e) => setFilters({ search: e.target.value })}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {filters.search && (
              <button
                onClick={() => setFilters({ search: '' })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Category filter */}
          <select
            value={filters.category}
            onChange={(e) => setFilters({ category: e.target.value as PolicyCategory | 'all' })}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="all">전체 카테고리</option>
            {Object.entries(POLICY_CATEGORY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={filters.status}
            onChange={(e) => setFilters({ status: e.target.value as 'all' | 'upcoming' | 'open' | 'closed' })}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="all">전체 상태</option>
            <option value="open">접수중</option>
            <option value="upcoming">접수예정</option>
            <option value="closed">마감</option>
          </select>
        </div>

        <div className="mt-3 text-xs text-gray-500">
          총 {filteredPolicies.length}건의 정책공고
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Policy Cards Grid */}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredPolicies.map((policy) => {
            const daysLeft = getDaysRemaining(policy.application_end);
            return (
              <div
                key={policy.id}
                onClick={() => setSelectedPolicy(policy)}
                className="bg-white rounded-xl border border-gray-200 p-5 cursor-pointer hover:shadow-md hover:border-blue-200 transition-all"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span
                    className={cn(
                      'shrink-0 px-2 py-0.5 rounded text-xs font-medium',
                      policy.status === 'open'
                        ? 'bg-green-100 text-green-700'
                        : policy.status === 'upcoming'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-500'
                    )}
                  >
                    {statusLabel(policy.status)}
                  </span>
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                    {POLICY_CATEGORY_LABELS[policy.category]}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-2">
                  {policy.title}
                </h3>

                {/* Organization */}
                <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
                  <Building size={12} />
                  <span>{policy.organization}</span>
                </div>

                {/* Details */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs text-gray-600">
                    <BarChart3 size={12} className="shrink-0 text-gray-400" />
                    <span className="truncate">{policy.support_scale}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-600">
                    <Calendar size={12} className="shrink-0 text-gray-400" />
                    <span>
                      {formatDate(policy.application_start)} ~ {formatDate(policy.application_end)}
                    </span>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                  <span
                    className={cn(
                      'text-xs font-medium',
                      policy.difficulty === 'easy'
                        ? 'text-green-600'
                        : policy.difficulty === 'medium'
                          ? 'text-yellow-600'
                          : 'text-red-600'
                    )}
                  >
                    난이도: {difficultyLabel(policy.difficulty)}
                  </span>
                  {daysLeft > 0 && policy.status !== 'closed' && (
                    <span
                      className={cn(
                        'text-xs font-semibold',
                        daysLeft <= 7 ? 'text-red-600' : daysLeft <= 30 ? 'text-yellow-600' : 'text-gray-500'
                      )}
                    >
                      D-{daysLeft}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!isLoading && filteredPolicies.length === 0 && (
        <div className="text-center py-12">
          <FileText size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 text-sm">검색 조건에 맞는 정책공고가 없습니다.</p>
        </div>
      )}

      {/* Detail Modal */}
      {selectedPolicy && (
        <PolicyDetailModal
          policy={selectedPolicy}
          onClose={() => setSelectedPolicy(null)}
        />
      )}
    </div>
  );
}

function PolicyDetailModal({
  policy,
  onClose,
}: {
  policy: PolicyAnnouncement;
  onClose: () => void;
}) {
  const daysLeft = getDaysRemaining(policy.application_end);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className={cn(
                  'px-2 py-0.5 rounded text-xs font-medium',
                  policy.status === 'open'
                    ? 'bg-green-100 text-green-700'
                    : policy.status === 'upcoming'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-500'
                )}
              >
                {policy.status === 'open' ? '접수중' : policy.status === 'upcoming' ? '접수예정' : '마감'}
              </span>
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                {POLICY_CATEGORY_LABELS[policy.category]}
              </span>
            </div>
            <h2 className="text-lg font-bold text-gray-900">{policy.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <InfoRow label="주관기관" value={policy.organization} />
            <InfoRow label="지원규모" value={policy.support_scale} />
            <InfoRow
              label="신청기간"
              value={`${formatDate(policy.application_start)} ~ ${formatDate(policy.application_end)}`}
            />
            <InfoRow
              label="남은 기간"
              value={daysLeft > 0 ? `D-${daysLeft}` : '마감'}
              valueClass={daysLeft <= 7 ? 'text-red-600 font-semibold' : ''}
            />
            <InfoRow label="지원대상" value={policy.target_audience} />
            <InfoRow
              label="난이도"
              value={
                policy.difficulty === 'easy'
                  ? '쉬움'
                  : policy.difficulty === 'medium'
                    ? '보통'
                    : '어려움'
              }
            />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">신청자격</h3>
            <p className="text-sm text-gray-600">{policy.eligibility}</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">사업 설명</h3>
            <p className="text-sm text-gray-600">{policy.description}</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">제출서류</h3>
            <ul className="space-y-1">
              {policy.required_documents.map((doc, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0" />
                  {doc}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <a
              href={policy.detail_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ExternalLink size={14} />
              상세보기
            </a>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className={cn('text-sm text-gray-900', valueClass)}>{value}</p>
    </div>
  );
}
