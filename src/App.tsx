import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import AppLayout from '@/components/layout/AppLayout';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import PolicyList from '@/pages/PolicyList';
import CompanyManagement from '@/pages/CompanyManagement';
import MatchingResult from '@/pages/MatchingResult';
import ApplicationManagement from '@/pages/ApplicationManagement';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/policies" element={<PolicyList />} />
                <Route path="/companies" element={<CompanyManagement />} />
                <Route path="/matching" element={<MatchingResult />} />
                <Route path="/applications" element={<ApplicationManagement />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AppLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
