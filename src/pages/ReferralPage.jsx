import { useReferrals } from '../hooks/useReferrals';
import ReferralForm from '../components/referrals/ReferralForm';
import ReferralsTable from '../components/referrals/ReferralsTable';
import '../styles/pages/ReferralPage.css';

/**
 * Page component for managing referrals
 */
const ReferralPage = ({ user }) => {
  // Use our referrals hook
  const {
    referrals,
    currentReferral,
    loading,
    error,
    addReferral,
    viewReferral,
    resetCurrentReferral
  } = useReferrals(user?.id);

  // Handler for form submission
  const handleSubmitReferral = async (formData) => {
    return await addReferral({
      studentName: formData.studentName,
      studentId: formData.studentId,
      referralType: formData.referralType,
      referralReason: formData.referralReason,
      referralNotes: formData.referralNotes
    });
  };

  // Handler for copying notes to clipboard
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
          onSubmit={handleSubmitReferral} 
          referralToView={currentReferral}
          onReset={resetCurrentReferral}
        />
      </section>
      
      <section className="table-section">
        <h2>Your Referrals</h2>
        {error ? (
          <p className="error-message">{error}</p>
        ) : (
          <ReferralsTable 
            referrals={referrals} 
            onView={viewReferral}
            onCopyNote={handleCopyNote}
            loading={loading}
          />
        )}
      </section>
    </>
  );
};

export default ReferralPage;