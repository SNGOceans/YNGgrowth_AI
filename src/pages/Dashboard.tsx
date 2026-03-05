import { useEffect, useMemo } from 'react';
import { cn, formatDate, getDaysRemaining } from '@/lib/utils';
import { MOCK_POLICIES, MOCK_MATCH_RESULTS, MOCK_APPLICATIONS } from '@/services/mockData';
import {
  FileText,
  PlayCircle,
  Brain,
  Briefcase,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export default function Dashboard() {
  const stats = useMemo(() => {
    const openPolicies = MOCK_POLICIES.filter((p) => p.status === 'open');
    const upcomingPolicies = MOCK_POLICIES.filter((p) => p.status === 'upcoming');
    return {
      totalPolicies: MOCK_POLICIES.length,
      openPolicies: openPolicies.length + upcomingPolicies.length,
      matchedPolicies: MOCK_MATCH_RESULTS.length,
      activeApplications: MOCK_APPLICATIONS.length,
    };
  }, []);

  const urgentPolicies = useMemo(() => {
    return MOCK_POLICIES
      .filter((p) => p.status === 'open' || p.status === 'upcoming')
      .map((p) => ({ ...p, daysRemaining: getDaysRemaining(p.application_end) }))
      .filter((p) => p.daysRemaining > 0)
      .sort((a, b) => a.daysRemaining - b.daysRemaining)
      .slice(0, 5);
  }, []);

  const recentMatches = useMemo(() => {
    return MOCK_MATCH_RESULTS.slice(0, 4);
  }, []);

  const trendData = useMemo(() => {
    return [
      { month: '2025.10', 정책자금: 3, 'R&D': 2, 인력지원: 1, 기타: 2 },
      { month: '2025.11', 정책자금: 4, 'R&D': 3, 인력지원: 2, 기타: 1 },
      { month: '2025.12', 정책자금: 2, 'R&D': 4, 인력지원: 1, 기타: 3 },
      { month: '2026.01', 정책자금: 5, 'R&D': 2, 인력지원: 3, 기타: 2 },
      { month: '2026.02', 정책자금: 3, 'R&D': 5, 인력지원: 2, 기타: 4 },
      { month: '2026.03', 정책자금: 4, 'R&D': 3, 인력지원: 2, 기타: 3 },
    ];
  }, []);

  const statCards = [
    {
      title: '총 정책공고수',
      value: stats.totalPolicies,
      suffix: '건',
      icon: <FileText size={22} />,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      title: '진행중 공고',
      value: stats.openPolicies,
      suffix: '건',
      icon: <PlayCircle size={22} />,
      color: 'bg-green-50 text-green-600',
    },
    {
      title: '매칭 정책',
      value: stats.matchedPolicies,
      suffix: '건',
      icon: <Brain size={22} />,
      color: 'bg-purple-50 text-purple-600',
    },
    {
      title: '신청중 사업',
      value: stats.activeApplications,
      suffix: '건',
      icon: <Briefcase size={22} />,
      color: 'bg-orange-50 text-orange-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
        <p className="text-sm text-gray-500 mt-1">정책공고 현황 및 매칭 결과를 한눈에 확인하세요.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div
            key={card.title}
            className="bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-4"
          >
            <div className={cn('p-2.5 rounded-lg', card.color)}>{card.icon}</div>
            <div>
              <p className="text-sm text-gray-500">{card.title}</p>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">
                {card.value}
                <span className="text-sm font-normal text-gray-400 ml-1">{card.suffix}</span>
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Urgent Policies */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={18} className="text-red-500" />
            <h2 className="text-lg font-semibold text-gray-900">마감 임박 정책</h2>
          </div>
          <div className="space-y-3">
            {urgentPolicies.length === 0 && (
              <p className="text-sm text-gray-400 py-4 text-center">마감 임박 정책이 없습니다.</p>
            )}
            {urgentPolicies.map((policy) => (
              <div
                key={policy.id}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{policy.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{policy.organization}</p>
                </div>
                <span
                  className={cn(
                    'shrink-0 ml-3 px-2.5 py-1 rounded-full text-xs font-semibold',
                    policy.daysRemaining <= 7
                      ? 'bg-red-100 text-red-700'
                      : policy.daysRemaining <= 30
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-blue-100 text-blue-700'
                  )}
                >
                  D-{policy.daysRemaining}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Match Results */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-blue-500" />
            <h2 className="text-lg font-semibold text-gray-900">최근 매칭 결과</h2>
          </div>
          <div className="space-y-3">
            {recentMatches.length === 0 && (
              <p className="text-sm text-gray-400 py-4 text-center">매칭 결과가 없습니다.</p>
            )}
            {recentMatches.map((match) => (
              <div
                key={match.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div
                  className={cn(
                    'shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold',
                    match.match_score >= 80
                      ? 'bg-green-100 text-green-700'
                      : match.match_score >= 60
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-yellow-100 text-yellow-700'
                  )}
                >
                  {match.match_score}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {match.policy.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 text-xs',
                        match.eligibility_status === 'eligible'
                          ? 'text-green-600'
                          : match.eligibility_status === 'likely'
                            ? 'text-blue-600'
                            : 'text-yellow-600'
                      )}
                    >
                      {match.eligibility_status === 'eligible' ? (
                        <CheckCircle size={12} />
                      ) : (
                        <AlertTriangle size={12} />
                      )}
                      {match.eligibility_status === 'eligible'
                        ? '자격 충족'
                        : match.eligibility_status === 'likely'
                          ? '자격 가능'
                          : '확인 필요'}
                    </span>
                    <span
                      className={cn(
                        'text-xs px-1.5 py-0.5 rounded',
                        match.recommended_priority === 'high'
                          ? 'bg-red-50 text-red-600'
                          : match.recommended_priority === 'medium'
                            ? 'bg-yellow-50 text-yellow-600'
                            : 'bg-gray-50 text-gray-500'
                      )}
                    >
                      {match.recommended_priority === 'high'
                        ? '우선 추천'
                        : match.recommended_priority === 'medium'
                          ? '추천'
                          : '참고'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly Trend Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">월별 정책공고 트렌드</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="정책자금" fill="#3b82f6" radius={[2, 2, 0, 0]} />
              <Bar dataKey="R&D" fill="#8b5cf6" radius={[2, 2, 0, 0]} />
              <Bar dataKey="인력지원" fill="#10b981" radius={[2, 2, 0, 0]} />
              <Bar dataKey="기타" fill="#f59e0b" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
