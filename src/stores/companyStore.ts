import { create } from 'zustand';
import type { CompanyProfile } from '@/types';
import { MOCK_COMPANIES } from '@/services/mockData';

interface CompanyState {
  companies: CompanyProfile[];
  selectedCompany: CompanyProfile | null;
  isLoading: boolean;
  setSelectedCompany: (company: CompanyProfile | null) => void;
  fetchCompanies: () => Promise<void>;
  addCompany: (company: Omit<CompanyProfile, 'id' | 'created_at' | 'updated_at'>) => void;
  updateCompany: (id: string, data: Partial<CompanyProfile>) => void;
}

export const useCompanyStore = create<CompanyState>((set, get) => ({
  companies: [],
  selectedCompany: null,
  isLoading: false,
  setSelectedCompany: (company) => set({ selectedCompany: company }),
  fetchCompanies: async () => {
    set({ isLoading: true });
    await new Promise(r => setTimeout(r, 300));
    set({ companies: MOCK_COMPANIES, isLoading: false });
  },
  addCompany: (data) => {
    const newCompany: CompanyProfile = {
      ...data,
      id: `comp_${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    set((s) => ({ companies: [...s.companies, newCompany] }));
  },
  updateCompany: (id, data) => {
    set((s) => ({
      companies: s.companies.map(c =>
        c.id === id ? { ...c, ...data, updated_at: new Date().toISOString() } : c
      ),
    }));
  },
}));
