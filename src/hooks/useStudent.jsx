import { useStudentData } from '../context/StudentDataContext';

/**
 * Hook for accessing student data from context
 * This is a wrapper around useStudentData for backward compatibility
 * @returns {Object} Student context with selectedStudent, selectStudent, and clearSelectedStudent
 */
export const useStudent = useStudentData;