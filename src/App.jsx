import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import ReferralForm from './components/ReferralForm';
import ReferralsTable from './components/ReferralsTable';
import Auth from './components/Auth';
import './App.css';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

function App() {
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [currentReferral, setCurrentReferral] = useState(null);

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

  // Fetch referrals on component mount or when user changes
  useEffect(() => {
    if (user) {
      fetchReferrals();
    }
  }, [user]);

  const fetchReferrals = async () => {
    try {
      setLoading(true);
      
      if (!user) {
        throw new Error('You must be logged in to view referrals');
      }
      
      // Get referrals for the current staff member
      const { data, error } = await supabase
        .from('Referrals')
        .select('id, created_at, student_name, referral_type, referral_reason, referral_notes, status')
        .eq('staff_id', user.id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      setReferrals(data || []);
    } catch (err) {
      console.error('Error fetching referrals:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addReferral = async (newReferral) => {
    try {
      if (!user) {
        throw new Error('You must be logged in to submit a referral');
      }
      
      // Prepare the referral data
      const referralData = {
        student_name: newReferral.studentName,
        referral_type: newReferral.referralType,
        referral_reason: newReferral.referralReason,
        referral_notes: newReferral.referralNotes,
        status: 'New',
        staff_id: user.id
      };
      
      console.log('Attempting to insert referral:', referralData);
      
      // Insert new referral
      const { data, error } = await supabase
        .from('Referrals')
        .insert([referralData])
        .select();
        
      if (error) {
        console.error('Insert error:', error);
        throw error;
      }
      
      console.log('Successfully inserted referral:', data);
      
      // Update state with the new referral
      if (data && data.length > 0) {
        setReferrals([data[0], ...referrals]);
      }
      
      return { success: true };
    } catch (err) {
      console.error('Error adding referral:', err);
      return { success: false, error: err.message };
    }
  };

  // Function to handle viewing a referral
  const handleViewReferral = (referral) => {
    console.log("Viewing referral:", referral);
    setCurrentReferral(referral);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Function to handle resetting the form
  const handleResetForm = () => {
    console.log("Resetting form");
    setCurrentReferral(null);
  };
  
  // Function to handle copying notes
  const handleCopyNote = (notes) => {
    console.log("Copying notes:", notes);
    navigator.clipboard.writeText(notes)
      .then(() => {
        alert('Notes copied to clipboard!');
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
        alert('Failed to copy notes. Please try again.');
      });
  };
  
  // Function to handle user logout
  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setReferrals([]);
      setCurrentReferral(null);
    } catch (err) {
      console.error('Error logging out:', err);
      alert('Failed to log out. Please try again.');
    }
  };

  return (
    <div className="app-container">
      <header>
        <h1>Intervention Monitoring App</h1>
        {user && (
          <div className="header-actions">
            <button onClick={handleLogout} className="logout-button">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              Logout
            </button>
          </div>
        )}
      </header>
      
      <main>
        {!user ? (
          <section className="auth-section">
            <h2>Login Here</h2>
            <p>Please log in to use the Intervention Monitoring App.</p>
            <Auth onLogin={setUser} />
          </section>
        ) : (
          <>
            <section className="form-section">
              <h2>Submit New Referral</h2>
              <ReferralForm 
                onSubmit={addReferral} 
                referralToView={currentReferral}
                onReset={handleResetForm}
              />
            </section>
            
            <section className="table-section">
              <h2>Your Referrals</h2>
              {loading ? (
                <p>Loading referrals...</p>
              ) : error ? (
                <p className="error">{error}</p>
              ) : (
                <ReferralsTable 
                  referrals={referrals} 
                  onView={handleViewReferral}
                  onCopyNote={handleCopyNote}
                />
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default App;