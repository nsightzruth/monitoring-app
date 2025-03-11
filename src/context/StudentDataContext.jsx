import { createContext, useContext, useState, useCallback } from 'react';
import { studentService } from '../services/supabase';

// Create a context for student data
const StudentDataContext = createContext(null);

// Custom provider component
export const StudentDataProvider = ({ children }) => {
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);

  // Select a student to prefill forms
  const selectStudent = (student) => {
    setSelectedStudent(student);
  };

  // Clear the selected student
  const clearSelectedStudent = () => {
    setSelectedStudent(null);
  };

  // Search students by name
  const searchStudents = useCallback(async (query) => {
    if (!query || query.length < 3) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      setSearchError(null);
      
      const results = await studentService.searchStudents(query);
      setSearchResults(results);
    } catch (err) {
      console.error('Error searching students:', err);
      setSearchError(err.message);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  return (
    <StudentDataContext.Provider value={{ 
      selectedStudent, 
      selectStudent, 
      clearSelectedStudent,
      searchStudents,
      searchResults,
      isSearching,
      searchError
    }}>
      {children}
    </StudentDataContext.Provider>
  );
};

// Custom hook to use the student data context
export const useStudentData = () => {
  const context = useContext(StudentDataContext);
  if (!context) {
    throw new Error('useStudentData must be used within a StudentDataProvider');
  }
  return context;
};