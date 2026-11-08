import { useEffect } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { useRouter, navigate } from '@/router';
import { AuthPage } from '@/pages/AuthPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { JobSearchPage } from '@/pages/JobSearchPage';
import { JobDetailsPage } from '@/pages/JobDetailsPage';
import { CVAnalysisPage } from '@/pages/CVAnalysisPage';
import { SkillsPage } from '@/pages/SkillsPage';
import { ApplicationsPage } from '@/pages/ApplicationsPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { LoadingState } from '@/components/ui/States';

const publicRoutes = ['/login', '/register'];

function Routes() {
  const route = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      const isPublic = publicRoutes.includes(route.path);
      if (!user && !isPublic) navigate('/login');
      if (user && isPublic) navigate('/dashboard');
    }
  }, [user, loading, route.path]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingState label="Chargement…" />
      </div>
    );
  }

  if (!user) {
    return <AuthPage mode={route.path === '/register' ? 'register' : 'login'} />;
  }

  switch (route.path) {
    case '/dashboard':
      return <DashboardPage />;
    case '/jobs':
      return <JobSearchPage />;
    default:
      if (route.path.startsWith('/jobs/')) return <JobDetailsPage />;
      if (route.path === '/cv') return <CVAnalysisPage />;
      if (route.path === '/skills') return <SkillsPage />;
      if (route.path === '/applications') return <ApplicationsPage />;
      if (route.path === '/profile') return <ProfilePage />;
      return <DashboardPage />;
  }
}

function App() {
  return (
    <AuthProvider>
      <Routes />
    </AuthProvider>
  );
}

export default App;
