import { useState, useEffect, useCallback } from 'react';
import { referralService } from '../services/supabase';

/**
 * Custom hook for managing referrals data and operations
 * 
 * @param {string} staffId - Staff ID to fetch referrals for
 * @returns {Object} - Referrals data and operations
 */
export const useReferrals = (staffId) => {
  const [referrals, setReferrals] = useState([]);
  const [currentReferral, setCurrentReferral] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitStatus, setSubmitStatus] = useState({ loading: false, error: null, success: false });

  // Fetch referrals when staffId changes
  useEffect(() => {
    if (staffId) {
      fetchReferrals();
    }
  }, [staffId]);

  /**
   * Fetch referrals for the current staff member
   */
  const fetchReferrals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await referralService.getReferralsByStaff(staffId);
      setReferrals(data);
    } catch (err) {
      console.error('Error fetching referrals:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [staffId]);

  /**
   * Add a new referral
   * @param {Object} referralData - Referral data to add
   * @returns {Promise<Object>} - Result of the operation
   */
  const addReferral = useCallback(async (referralData) => {
    try {
      setSubmitStatus({ loading: true, error: null, success: false });
      
      const newReferral = await referralService.createReferral(referralData, staffId);
      
      // Update state with the new referral
      setReferrals(prevReferrals => [newReferral, ...prevReferrals]);
      
      setSubmitStatus({ loading: false, error: null, success: true });
      return { success: true, data: newReferral };
    } catch (err) {
      console.error('Error adding referral:', err);
      setSubmitStatus({ loading: false, error: err.message, success: false });
      return { success: false, error: err.message };
    }
  }, [staffId]);

  /**
   * Update a referral's status
   * @param {string} referralId - Referral ID
   * @param {string} status - New status
   */
  const updateReferralStatus = useCallback(async (referralId, status) => {
    try {
      setLoading(true);
      setError(null);
      
      const updatedReferral = await referralService.updateReferralStatus(referralId, status);
      
      // Update state with the updated referral
      setReferrals(prevReferrals => 
        prevReferrals.map(ref => 
          ref.id === referralId ? updatedReferral : ref
        )
      );
      
      return { success: true, data: updatedReferral };
    } catch (err) {
      console.error('Error updating referral status:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Set the current referral to view
   * @param {Object} referral - Referral object to view
   */
  const viewReferral = useCallback((referral) => {
    setCurrentReferral(referral);
  }, []);

  /**
   * Reset the current referral
   */
  const resetCurrentReferral = useCallback(() => {
    setCurrentReferral(null);
  }, []);

  /**
   * Reset the submit status
   */
  const resetSubmitStatus = useCallback(() => {
    setSubmitStatus({ loading: false, error: null, success: false });
  }, []);

  return {
    referrals,
    currentReferral,
    loading,
    error,
    submitStatus,
    fetchReferrals,
    addReferral,
    updateReferralStatus,
    viewReferral,
    resetCurrentReferral,
    resetSubmitStatus
  };
};