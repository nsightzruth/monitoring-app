import { createContext, useContext, useState } from 'react';

// Create a context for student data
const StudentDataContext = createContext(null);

// Custom provider component
export const StudentDataProvider = ({ children }) => {
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Select a student to prefill forms
  const selectStudent = (student) => {
    setSelectedStudent(student);
  };

  // Clear the selected student
  const clearSelectedStudent = () => {
    setSelectedStudent(null);
  };

  return (
    <StudentDataContext.Provider value={{ 
      selectedStudent, 
      selectStudent, 
      clearSelectedStudent 
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