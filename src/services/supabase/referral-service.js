import { supabase } from './config';

/**
 * Referral service for handling referral-related operations
 */
export const referralService = {
  /**
   * Get referrals for the current staff member
   * @param {string} staffId - Staff ID
   * @returns {Promise<Array>} - Array of referral objects
   */
  getReferralsByStaff: async (staffId) => {
    try {
      const { data, error } = await supabase
        .from('Referrals')
        .select('id, created_at, student_name, referral_type, referral_reason, referral_notes, status, student_id')
        .eq('staff_id', staffId)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching referrals:', error);
      throw error;
    }
  },

  /**
   * Create a new referral
   * @param {Object} referralData - Referral data object
   * @param {string} referralData.studentName - Student name
   * @param {string} referralData.studentId - Student ID
   * @param {string} referralData.referralType - Referral type
   * @param {string} referralData.referralReason - Referral reason
   * @param {string} referralData.referralNotes - Referral notes
   * @param {string} staffId - Staff ID creating the referral
   * @returns {Promise<Object>} - The created referral object
   */
  createReferral: async (referralData, staffId) => {
    try {
      const { data, error } = await supabase
        .from('Referrals')
        .insert([{
          student_name: referralData.studentName,
          student_id: referralData.studentId,
          referral_type: referralData.referralType,
          referral_reason: referralData.referralReason,
          referral_notes: referralData.referralNotes,
          status: 'New',
          staff_id: staffId
        }])
        .select();
        
      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('Error creating referral:', error);
      throw error;
    }
  },

  /**
   * Update a referral's status
   * @param {string} referralId - Referral ID
   * @param {string} status - New status
   * @returns {Promise<Object>} - The updated referral object
   */
  updateReferralStatus: async (referralId, status) => {
    try {
      const { data, error } = await supabase
        .from('Referrals')
        .update({ status })
        .eq('id', referralId)
        .select();
        
      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('Error updating referral status:', error);
      throw error;
    }
  },

  /**
   * Get referrals for a specific student
   * @param {string} studentId - Student ID
   * @returns {Promise<Array>} - Array of referral objects
   */
  getReferralsByStudent: async (studentId) => {
    try {
      const { data, error } = await supabase
        .from('Referrals')
        .select('id, created_at, referral_type, referral_reason, referral_notes, status, staff_id')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching student referrals:', error);
      throw error;
    }
  }
};