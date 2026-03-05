import { useEffect, useState } from 'react';
import { cn, formatDate } from '@/lib/utils';
import { useApplicationStore } from '@/stores/applicationStore';
import { APPLICATION_STATUS_LABELS } from '@/types';
import type { PolicyApplication, ApplicationStatus } from '@/types';
import { MOCK_COMPANIES } from '@/services/mockData';
import {
  Briefcase,
  ChevronDown,
  FileCheck,
  Clock,
  CheckCircle,
  XCircle,
  Play,
  FileText,
  ArrowRight,
} from 'lucide-react';

const KANBAN_COLUMNS: { status: ApplicationStatus; label: string; color: string }[] = [
  { status: 'researching', label: '조사 중', color: 'border-gray-300' },
  { status: 'preparing', label: '준비 중', color: 'border-yellow-400' },
  { status: 'documents_ready', label: '서류 준비 완료', color: 'border-blue-400' },
  { status: 'applied', label: '신청 완료', color: 'border-purple-400' },
  { status: 'reviewing', label: '심사 중', color: 'border-orange-400' },
  { status: 'presentation', label: '발표심사', color: 'border-pink-400' },
  { status: 'selected', label: '선정', color: 'border-green-400' },
  { status: 'rejected', label: '탈락', color: 'border-red-400' },
  { status: 'executing', label: '사업수행 중', color: 'border-teal-400' },
  { status: 'completed', label: '완료', color: 'border-emerald-400' },
];

const STATUS_ICON: Record<string, React.ReactNode> = {
  researching: <FileText size={14} />,
  preparing: <Clock size={14} />,
  documents_ready: <FileCheck size={14} />,
  applied: <Play size={14} />,
  reviewing: <Clock size={14} />,
  presentation: <Briefcase size={14} />,
  selected: <CheckCircle size={14} />,
  rejected: <XCircle size={14} />,
  executing: <ArrowRight size={14} />,
  completed: <CheckCircle size={14} />,
};

export default function ApplicationManagement() {
  const { applications, isLoading, fetchApplications, updateStatus } = useApplicationStore();
  const [selectedApp, setSelectedApp] = useState<PolicyApplication | null>(null);

  useEffect(() => {
    if (applications.length === 0) {
      fetchApplications();
    }
  }, []);

  // Group applications by status
  const groupedApps = KANBAN_COLUMNS.reduce<Record<ApplicationStatus, PolicyApplication[]>>(
    (acc, col) => {
      acc[col.status] = applications.filter((a) => a.status === col.status);
      return acc;
    },
    {} as Record<ApplicationStatus, PolicyApplication[]>
  );

  // Only show columns that have apps or are common workflow steps
  const activeColumns = KANBAN_COLUMNS.filter(
    (col) =>
      (groupedApps[col.status]?.length > 0) ||
      ['researching', 'preparing', 'applied', 'reviewing', 'selected'].includes(col.status)
  );

  const handleStatusChange = (appId: string, newStatus: ApplicationStatus) => {
    updateStatus(appId, newStatus);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">사업관리</h1>
        <p className="text-sm text-gray-500 mt-1">
          정책사업 신청의 전 주기를 관리하세요.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Kanban Board */}
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-4 min-w-max">
              {activeColumns.map((col) => {
                const apps = groupedApps[col.status] || [];
                return (
                  <div
                    key={col.status}
                    className={cn(
                      'w-72 shrink-0 bg-gray-50 rounded-xl border-t-2',
                      col.color
                    )}
                  >
                    {/* Column Header */}
                    <div className="px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-700">{col.label}</span>
                        <span className="w-5 h-5 rounded-full bg-gray-200 text-xs font-medium text-gray-600 flex items-center justify-center">
                          {apps.length}
                        </span>
                      </div>
                    </div>

                    {/* Cards */}
                    <div className="px-3 pb-3 space-y-2 min-h-[120px]">
                      {apps.map((app) => {
                        const company = MOCK_COMPANIES.find((c) => c.id === app.company_id);
                        const readyDocs = app.documents.filter((d) => d.status === 'ready' || d.status === 'submitted').length;
                        const totalDocs = app.documents.length;
                        const docProgress = totalDocs > 0 ? Math.round((readyDocs / totalDocs) * 100) : 0;

                        return (
                          <div
                            key={app.id}
                            onClick={() => setSelectedApp(app)}
                            className="bg-white rounded-lg border border-gray-200 p-3 cursor-pointer hover:shadow-sm hover:border-blue-200 transition-all"
                          >
                            <p className="text-sm font-medium text-gray-900 line-clamp-2 mb-1.5">
                              {app.policy.title}
                            </p>
                            {company && (
                              <p className="text-xs text-gray-500 mb-2">{company.name}</p>
                            )}

                            {/* Document Progress */}
                            <div className="mb-2">
                              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                                <span>서류 진행률</span>
                                <span>{docProgress}%</span>
                              </div>
                              <div className="w-full h-1.5 rounded-full bg-gray-100">
                                <div
                                  className={cn(
                                    'h-1.5 rounded-full transition-all',
                                    docProgress === 100 ? 'bg-green-500' : docProgress >= 50 ? 'bg-blue-500' : 'bg-yellow-500'
                                  )}
                                  style={{ width: `${docProgress}%` }}
                                />
                              </div>
                            </div>

                            {/* Status Dropdown */}
                            <div className="relative" onClick={(e) => e.stopPropagation()}>
                              <select
                                value={app.status}
                                onChange={(e) => handleStatusChange(app.id, e.target.value as ApplicationStatus)}
                                className="w-full px-2 py-1 text-xs border border-gray-200 rounded bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none pr-6"
                              >
                                {KANBAN_COLUMNS.map((c) => (
                                  <option key={c.status} value={c.status}>
                                    {c.label}
                                  </option>
                                ))}
                              </select>
                              <ChevronDown
                                size={10}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                              />
                            </div>
                          </div>
                        );
                      })}

                      {apps.length === 0 && (
                        <div className="text-center py-6">
                          <p className="text-xs text-gray-400">항목 없음</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detail Panel */}
          {selectedApp && (
            <ApplicationDetailPanel
              application={selectedApp}
              onClose={() => setSelectedApp(null)}
            />
          )}
        </>
      )}

      {!isLoading && applications.length === 0 && (
        <div className="text-center py-12">
          <Briefcase size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 text-sm">진행중인 사업이 없습니다.</p>
        </div>
      )}
    </div>
  );
}

function ApplicationDetailPanel({
  application,
  onClose,
}: {
  application: PolicyApplication;
  onClose: () => void;
}) {
  const company = MOCK_COMPANIES.find((c) => c.id === application.company_id);

  const docStatusLabel = (status: string) => {
    if (status === 'submitted') return '제출됨';
    if (status === 'ready') return '준비됨';
    return '미준비';
  };

  const docStatusColor = (status: string) => {
    if (status === 'submitted') return 'text-green-600 bg-green-50';
    if (status === 'ready') return 'text-blue-600 bg-blue-50';
    return 'text-gray-500 bg-gray-50';
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-gray-900">{application.policy.title}</h3>
          <p className="text-sm text-gray-500 mt-0.5">
            {company?.name || '기업 미상'} / {APPLICATION_STATUS_LABELS[application.status]}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-sm text-gray-400 hover:text-gray-600"
        >
          닫기
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Documents */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">제출 서류</h4>
          <div className="space-y-2">
            {application.documents.map((doc, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50"
              >
                <div className="flex items-center gap-2">
                  {doc.status === 'submitted' ? (
                    <CheckCircle size={14} className="text-green-500" />
                  ) : doc.status === 'ready' ? (
                    <FileCheck size={14} className="text-blue-500" />
                  ) : (
                    <Clock size={14} className="text-gray-400" />
                  )}
                  <span className="text-sm text-gray-700">{doc.name}</span>
                </div>
                <span
                  className={cn(
                    'px-2 py-0.5 rounded text-xs font-medium',
                    docStatusColor(doc.status)
                  )}
                >
                  {docStatusLabel(doc.status)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">타임라인</h4>
          <div className="relative">
            {application.timeline.map((event, i) => (
              <div key={i} className="flex gap-3 pb-4 last:pb-0">
                <div className="flex flex-col items-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0 mt-1" />
                  {i < application.timeline.length - 1 && (
                    <div className="w-px flex-1 bg-gray-200 mt-1" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">{formatDate(event.date)}</span>
                    <span className="text-sm font-medium text-gray-900">{event.event}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{event.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Notes */}
      {application.notes && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <h4 className="text-sm font-semibold text-gray-700 mb-1">메모</h4>
          <p className="text-sm text-gray-600">{application.notes}</p>
        </div>
      )}
    </div>
  );
}
