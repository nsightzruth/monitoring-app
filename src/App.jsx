import { useState, useEffect } from 'react';
import { supabase, authService } from './services/supabase';
import { StudentDataProvider } from './context/StudentDataContext';
import AuthPage from './pages/AuthPage';
import ReferralPage from './pages/ReferralPage';
import AdminPage from './pages/AdminPage';
import TeamDashboard from './pages/TeamDashboard';
import IncidentNotePage from './pages/IncidentNotePage';
import FollowupPage from './pages/FollowupPage';
import ProgressMonitoringPage from './pages/ProgressMonitoringPage';
import QuickAddPage from './pages/QuickAddPage';
import Navigation from './components/layout/Navigation';
import './styles/App.css';

function App() {
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('referrals');
  const [queryParams, setQueryParams] = useState(null);

  // Check user auth status
  useEffect(() => {
    // Setup auth state change listener
    const { data: { subscription } } = authService.onAuthStateChange(
      (event, session) => {
        if (session) {
          setUser(session.user);
        } else {
          setUser(null);
        }
      }
    );

    // Initial session check
    checkUser();

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const checkUser = async () => {
    try {
      const user = await authService.getCurrentUser();
      setUser(user); // This will be null if no user is logged in
    } catch (error) {
      console.error('Error checking user:', error);
      setUser(null);
    }
  };

  // Function to handle user logout
  const handleLogout = async () => {
    try {
      await authService.logout();
      setUser(null);
    } catch (err) {
      console.error('Error logging out:', err);
      alert('Failed to log out. Please try again.');
    }
  };

  // Navigation handler with query params support
  const handleNavigation = (page, params = null) => {
    setCurrentPage(page);
    setQueryParams(params);
  };

  const renderContent = () => {
    if (!user) {
      return <AuthPage onLogin={setUser} />;
    }

    switch (currentPage) {
      case 'admin':
        return <AdminPage user={user} supabase={supabase} />;
      case 'teams':
        return <TeamDashboard user={user} onNavigate={handleNavigation} />;
      case 'incidents':
        return <IncidentNotePage user={user} />;
      case 'followups':
        return <FollowupPage user={user} queryParams={queryParams} />;
      case 'progress':
        return <ProgressMonitoringPage user={user} />;
      case 'referrals':
        return <ReferralPage user={user} />;
      case 'quickAdd': 
      default:
        return <QuickAddPage user={user} />;
    }
  };

  return (
    <StudentDataProvider>
      <div className="app-container">
        {user && (
          <Navigation 
            user={user}
            currentPage={currentPage}
            onNavigation={handleNavigation}
            onLogout={handleLogout}
          />
        )}
        
        <main>
          {renderContent()}
        </main>
      </div>
    </StudentDataProvider>
  );
}

export default App;