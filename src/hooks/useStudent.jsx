import { useStudentData } from '../context/StudentDataContext';

/**
 * DEPRECATED: This hook is now a wrapper around useStudentData for backward compatibility.
 * Please use useStudentData from context/StudentDataContext directly instead.
 * 
 * @returns {Object} student data and operations from StudentDataContext
 */
export const useStudent = () => {
  console.warn(
    'useStudent hook is deprecated and will be removed in a future version. ' +
    'Please use useStudentData from context/StudentDataContext instead.'
  );
  
  const studentData = useStudentData();
  
  // Return the StudentDataContext values with the property names that existing components expect
  return {
    loading: studentData.isSearching,
    error: studentData.searchError,
    students: studentData.searchResults,
    selectedStudent: studentData.selectedStudent,
    searchStudents: studentData.searchStudents,
    selectStudent: studentData.selectStudent,
    clearSelectedStudent: studentData.clearSelectedStudent
  };
};

export default useStudent;