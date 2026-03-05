import { create } from 'zustand';
import type { PolicyApplication, ApplicationStatus } from '@/types';
import { MOCK_APPLICATIONS } from '@/services/mockData';

interface ApplicationState {
  applications: PolicyApplication[];
  isLoading: boolean;
  fetchApplications: () => Promise<void>;
  addApplication: (app: Omit<PolicyApplication, 'id' | 'created_at' | 'updated_at'>) => void;
  updateStatus: (id: string, status: ApplicationStatus) => void;
  getApplicationsByStatus: (status?: ApplicationStatus) => PolicyApplication[];
}

export const useApplicationStore = create<ApplicationState>((set, get) => ({
  applications: [],
  isLoading: false,
  fetchApplications: async () => {
    set({ isLoading: true });
    await new Promise(r => setTimeout(r, 300));
    set({ applications: MOCK_APPLICATIONS, isLoading: false });
  },
  addApplication: (data) => {
    const app: PolicyApplication = {
      ...data,
      id: `app_${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    set((s) => ({ applications: [...s.applications, app] }));
  },
  updateStatus: (id, status) => {
    set((s) => ({
      applications: s.applications.map(a =>
        a.id === id ? { ...a, status, updated_at: new Date().toISOString() } : a
      ),
    }));
  },
  getApplicationsByStatus: (status) => {
    const { applications } = get();
    if (!status) return applications;
    return applications.filter(a => a.status === status);
  },
}));
