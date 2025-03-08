import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import ReferralForm from './components/ReferralForm';
import ReferralsTable from './components/ReferralsTable';
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

  return (
    <div className="app-container">
      <header>
        <h1>Student Referral System</h1>
      </header>
      
      <main>
        {!user ? (
          <section>
            <h2>Login Required</h2>
            <p>Please log in to use the referral system.</p>
            {/* Add your Auth component here */}
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