import { useEffect, useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { MOCK_MATCH_RESULTS, MOCK_COMPANIES, MOCK_POLICIES } from '@/services/mockData';
import { runMatchingForCompany } from '@/services/matchingEngine';
import type { MatchResult, CompanyProfile } from '@/types';
import {
  Brain,
  ChevronDown,
  Play,
  CheckCircle,
  AlertTriangle,
  HelpCircle,
  XCircle,
  Lightbulb,
  Target,
  Star,
  Loader2,
} from 'lucide-react';

export default function MatchingResult() {
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [matchResults, setMatchResults] = useState<MatchResult[]>(MOCK_MATCH_RESULTS);
  const [isRunning, setIsRunning] = useState(false);

  const filteredResults = useMemo(() => {
    if (!selectedCompanyId) return matchResults;
    return matchResults.filter((r) => r.company_id === selectedCompanyId);
  }, [matchResults, selectedCompanyId]);

  const sortedResults = useMemo(() => {
    return [...filteredResults].sort((a, b) => b.match_score - a.match_score);
  }, [filteredResults]);

  const handleRunMatching = async () => {
    if (!selectedCompanyId) return;
    setIsRunning(true);

    // Simulate async operation
    await new Promise((r) => setTimeout(r, 1500));

    const company = MOCK_COMPANIES.find((c) => c.id === selectedCompanyId);
    if (company) {
      const results = runMatchingForCompany(company, MOCK_POLICIES);
      // Replace existing results for this company
      setMatchResults((prev) => [
        ...prev.filter((r) => r.company_id !== selectedCompanyId),
        ...results,
      ]);
    }

    setIsRunning(false);
  };

  const handleRunAll = async () => {
    setIsRunning(true);
    await new Promise((r) => setTimeout(r, 2000));

    const allResults: MatchResult[] = [];
    MOCK_COMPANIES.forEach((company) => {
      const results = runMatchingForCompany(company, MOCK_POLICIES);
      allResults.push(...results);
    });

    setMatchResults(allResults);
    setIsRunning(false);
  };

  const eligibilityConfig = {
    eligible: { label: '자격 충족', icon: <CheckCircle size={14} />, color: 'text-green-600' },
    likely: { label: '자격 가능', icon: <AlertTriangle size={14} />, color: 'text-blue-600' },
    uncertain: { label: '확인 필요', icon: <HelpCircle size={14} />, color: 'text-yellow-600' },
    ineligible: { label: '자격 미달', icon: <XCircle size={14} />, color: 'text-red-600' },
  };

  const priorityConfig = {
    high: { label: '우선 추천', color: 'bg-red-50 text-red-700' },
    medium: { label: '추천', color: 'bg-yellow-50 text-yellow-700' },
    low: { label: '참고', color: 'bg-gray-50 text-gray-600' },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">AI 매칭 결과</h1>
        <p className="text-sm text-gray-500 mt-1">
          기업과 정책공고의 AI 매칭 결과를 확인하고 최적의 정책을 찾으세요.
        </p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <select
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white appearance-none pr-8"
            >
              <option value="">전체 기업</option>
              {MOCK_COMPANIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
          </div>

          <button
            onClick={handleRunMatching}
            disabled={!selectedCompanyId || isRunning}
            className={cn(
              'inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors',
              selectedCompanyId && !isRunning
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            )}
          >
            {isRunning ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
            매칭 실행
          </button>

          <button
            onClick={handleRunAll}
            disabled={isRunning}
            className={cn(
              'inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors',
              !isRunning
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            )}
          >
            {isRunning ? <Loader2 size={16} className="animate-spin" /> : <Brain size={16} />}
            일괄 매칭
          </button>
        </div>

        <div className="mt-3 text-xs text-gray-500">
          총 {sortedResults.length}건의 매칭 결과
        </div>
      </div>

      {/* Results */}
      {isRunning && (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">AI 매칭 분석 중...</p>
        </div>
      )}

      {!isRunning && sortedResults.length === 0 && (
        <div className="text-center py-12">
          <Brain size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 text-sm">매칭 결과가 없습니다. 매칭을 실행해주세요.</p>
        </div>
      )}

      {!isRunning && (
        <div className="space-y-4">
          {sortedResults.map((result) => {
            const company = MOCK_COMPANIES.find((c) => c.id === result.company_id);
            const elig = eligibilityConfig[result.eligibility_status];
            const prio = priorityConfig[result.recommended_priority];

            return (
              <div
                key={result.id}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow"
              >
                <div className="flex flex-col lg:flex-row gap-4">
                  {/* Score Circle */}
                  <div className="flex items-start gap-4 lg:gap-5">
                    <div className="relative shrink-0">
                      <svg className="w-16 h-16" viewBox="0 0 64 64">
                        <circle
                          cx="32"
                          cy="32"
                          r="28"
                          fill="none"
                          stroke="#f3f4f6"
                          strokeWidth="4"
                        />
                        <circle
                          cx="32"
                          cy="32"
                          r="28"
                          fill="none"
                          stroke={
                            result.match_score >= 80
                              ? '#22c55e'
                              : result.match_score >= 60
                                ? '#3b82f6'
                                : '#eab308'
                          }
                          strokeWidth="4"
                          strokeLinecap="round"
                          strokeDasharray={`${(result.match_score / 100) * 175.9} 175.9`}
                          transform="rotate(-90 32 32)"
                        />
                      </svg>
                      <span
                        className={cn(
                          'absolute inset-0 flex items-center justify-center text-lg font-bold',
                          result.match_score >= 80
                            ? 'text-green-600'
                            : result.match_score >= 60
                              ? 'text-blue-600'
                              : 'text-yellow-600'
                        )}
                      >
                        {result.match_score}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className={cn('inline-flex items-center gap-1 text-xs font-medium', elig.color)}>
                          {elig.icon}
                          {elig.label}
                        </span>
                        <span className={cn('px-2 py-0.5 rounded text-xs font-medium', prio.color)}>
                          {prio.label}
                        </span>
                        {company && (
                          <span className="text-xs text-gray-400">{company.name}</span>
                        )}
                      </div>

                      <h3 className="text-sm font-semibold text-gray-900 mb-1">
                        {result.policy.title}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {result.policy.organization} / 예상 선정률 {result.estimated_approval_rate}%
                      </p>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 lg:border-l lg:border-gray-100 lg:pl-5">
                    {/* Match Reasons */}
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-1.5">
                        <Target size={12} />
                        매칭 사유
                      </div>
                      <ul className="space-y-1">
                        {result.match_reasons.slice(0, 3).map((reason, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-xs text-gray-600">
                            <Star size={10} className="shrink-0 mt-0.5 text-yellow-500" />
                            {reason}
                          </li>
                        ))}
                        {result.match_reasons.length > 3 && (
                          <li className="text-xs text-gray-400">
                            +{result.match_reasons.length - 3}건 더보기
                          </li>
                        )}
                      </ul>
                    </div>

                    {/* Tips */}
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-1.5">
                        <Lightbulb size={12} />
                        준비 팁
                      </div>
                      <ul className="space-y-1">
                        {result.preparation_tips.slice(0, 3).map((tip, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-xs text-gray-600">
                            <span className="w-1 h-1 rounded-full bg-blue-400 shrink-0 mt-1.5" />
                            {tip}
                          </li>
                        ))}
                        {result.preparation_tips.length > 3 && (
                          <li className="text-xs text-gray-400">
                            +{result.preparation_tips.length - 3}건 더보기
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
