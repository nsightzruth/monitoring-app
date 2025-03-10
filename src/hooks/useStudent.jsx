import { useState, useCallback } from 'react';
import { studentService } from '../services/supabase';

/**
 * Custom hook for student operations
 */
export const useStudent = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);

  /**
   * Search for students by name
   * @param {string} query - Search query (minimum 3 characters)
   */
  const searchStudents = useCallback(async (query) => {
    if (!query || query.length < 3) {
      setStudents([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const results = await studentService.searchStudents(query);
      setStudents(results);
    } catch (err) {
      console.error('Error searching students:', err);
      setError(err.message);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get a student by ID
   * @param {string} id - Student ID
   */
  const getStudentById = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      const student = await studentService.getStudentById(id);
      setSelectedStudent(student);
      return student;
    } catch (err) {
      console.error('Error fetching student:', err);
      setError(err.message);
      setSelectedStudent(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Select a student (without fetching)
   * @param {Object} student - Student object
   */
  const selectStudent = useCallback((student) => {
    setSelectedStudent(student);
  }, []);

  /**
   * Clear the selected student
   */
  const clearSelectedStudent = useCallback(() => {
    setSelectedStudent(null);
  }, []);

  /**
   * Add a review for a student
   * @param {string} studentId - Student ID
   */
  const addStudentReview = useCallback(async (studentId) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await studentService.addStudentReview(studentId);
      return result;
    } catch (err) {
      console.error('Error adding student review:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    students,
    selectedStudent,
    searchStudents,
    getStudentById,
    selectStudent,
    clearSelectedStudent,
    addStudentReview
  };
};