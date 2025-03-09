import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import AuthPage from './pages/AuthPage';
import ReferralPage from './pages/ReferralPage';
import AdminPage from './pages/AdminPage';
import Navigation from './components/Navigation';
import './styles/App.css';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

function App() {
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('referrals');

  // Check user auth status
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
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
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  // Function to handle user logout
  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
    } catch (err) {
      console.error('Error logging out:', err);
      alert('Failed to log out. Please try again.');
    }
  };

  // Navigation handler
  const handleNavigation = (page) => {
    setCurrentPage(page);
  };

  const renderContent = () => {
    if (!user) {
      return <AuthPage onLogin={setUser} />;
    }

    switch (currentPage) {
      case 'admin':
        return <AdminPage user={user} supabase={supabase} />;
      case 'referrals':
      default:
        return <ReferralPage user={user} supabase={supabase} />;
    }
  };

  return (
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
  );
}

export default App;