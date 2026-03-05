import { create } from 'zustand';
import type { PolicyAnnouncement, PolicyCategory } from '@/types';
import { MOCK_POLICIES } from '@/services/mockData';

interface PolicyFilters {
  search: string;
  category: PolicyCategory | 'all';
  status: 'all' | 'upcoming' | 'open' | 'closed';
}

interface PolicyState {
  policies: PolicyAnnouncement[];
  filters: PolicyFilters;
  selectedPolicy: PolicyAnnouncement | null;
  isLoading: boolean;
  setFilters: (filters: Partial<PolicyFilters>) => void;
  setSelectedPolicy: (policy: PolicyAnnouncement | null) => void;
  fetchPolicies: () => Promise<void>;
  getFilteredPolicies: () => PolicyAnnouncement[];
}

export const usePolicyStore = create<PolicyState>((set, get) => ({
  policies: [],
  filters: { search: '', category: 'all', status: 'all' },
  selectedPolicy: null,
  isLoading: false,
  setFilters: (newFilters) => set((s) => ({ filters: { ...s.filters, ...newFilters } })),
  setSelectedPolicy: (policy) => set({ selectedPolicy: policy }),
  fetchPolicies: async () => {
    set({ isLoading: true });
    // MVP: mock data 사용, 추후 API 연동
    await new Promise(r => setTimeout(r, 500));
    set({ policies: MOCK_POLICIES, isLoading: false });
  },
  getFilteredPolicies: () => {
    const { policies, filters } = get();
    return policies.filter(p => {
      if (filters.search && !p.title.includes(filters.search) && !p.organization.includes(filters.search)) return false;
      if (filters.category !== 'all' && p.category !== filters.category) return false;
      if (filters.status !== 'all' && p.status !== filters.status) return false;
      return true;
    });
  },
}));
