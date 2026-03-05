import { create } from 'zustand';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

// MVP: 데모용 로컬 인증
const DEMO_USERS: Array<User & { password: string }> = [
  { id: '1', email: 'admin@yng.co.kr', name: '관리자', role: 'admin', password: 'admin123', created_at: '2026-01-01' },
  { id: '2', email: 'manager@yng.co.kr', name: '김매니저', role: 'manager', company_id: 'comp1', password: 'manager123', created_at: '2026-01-01' },
  { id: '3', email: 'user@yng.co.kr', name: '이사용자', role: 'user', company_id: 'comp1', password: 'user123', created_at: '2026-01-01' },
];

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  login: async (email, password) => {
    const found = DEMO_USERS.find(u => u.email === email && u.password === password);
    if (found) {
      const { password: _, ...user } = found;
      set({ user, isAuthenticated: true });
      return true;
    }
    return false;
  },
  logout: () => set({ user: null, isAuthenticated: false }),
}));
