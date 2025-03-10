import { useState, useEffect } from 'react';
import ReferralForm from '../components/ReferralForm';
import ReferralsTable from '../components/ReferralsTable';
import '../styles/ReferralPage.css';

const ReferralPage = ({ user, supabase }) => {
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentReferral, setCurrentReferral] = useState(null);

  // Fetch referrals on component mount
  useEffect(() => {
    fetchReferrals();
  }, []);

  const fetchReferrals = async () => {
    try {
      setLoading(true);
      
      // Get referrals for the current staff member
      const { data, error } = await supabase
        .from('Referrals')
        .select('id, created_at, student_name, referral_type, referral_reason, referral_notes, status, student_id')
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
      // Prepare the referral data
      const referralData = {
        student_name: newReferral.studentName,
        student_id: newReferral.studentId, // Added student_id field
        referral_type: newReferral.referralType,
        referral_reason: newReferral.referralReason,
        referral_notes: newReferral.referralNotes,
        status: 'New',
        staff_id: user.id
      };
      
      // Insert new referral
      const { data, error } = await supabase
        .from('Referrals')
        .insert([referralData])
        .select();
        
      if (error) {
        throw error;
      }
      
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
    setCurrentReferral(referral);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Function to handle resetting the form
  const handleResetForm = () => {
    setCurrentReferral(null);
  };
  
  // Function to handle copying notes
  const handleCopyNote = (notes) => {
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
  );
};

export default ReferralPage;