import { useState, useEffect } from 'react';
import { useStudentData } from '../context/StudentDataContext';
import IncidentNoteForm from '../components/IncidentNoteForm';
import IncidentNotesTable from '../components/IncidentNotesTable';
import '../styles/IncidentNotePage.css';

const IncidentNotePage = ({ user, supabase }) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentRecord, setCurrentRecord] = useState(null);
  
  // Student context is used to check if a student was pre-selected
  const { selectedStudent } = useStudentData();

  // Scroll to form if a student was selected in another page
  useEffect(() => {
    if (selectedStudent) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [selectedStudent]);

  // Fetch records on component mount
  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      
      // Get incidents/notes for the current staff member
      const { data, error } = await supabase
        .from('IncidentsNotes')
        .select(`
          id, date, time, type, location, offense, note, 
          draft_status, created_at, student_id, staff_id,
          Student:student_id (name, grade)
        `)
        .eq('staff_id', user.id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      // Format the data to include student name and grade
      const formattedData = data.map(record => ({
        ...record,
        student_name: record.Student?.name || 'Unknown Student',
        grade: record.Student?.grade || '',
      }));
      
      setRecords(formattedData || []);
    } catch (err) {
      console.error('Error fetching records:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addRecord = async (newRecord) => {
    try {
      // Prepare the record data
      const recordData = {
        student_id: newRecord.studentId,
        student_name: newRecord.studentName, 
        type: newRecord.type,
        date: newRecord.date,
        time: newRecord.time || null,
        location: newRecord.type === 'Incident' ? newRecord.location : null,
        offense: newRecord.type === 'Incident' ? newRecord.offense : null,
        note: newRecord.note,
        draft_status: false,
        staff_id: user.id
      };
      
      // Insert new record
      const { data, error } = await supabase
        .from('IncidentsNotes')
        .insert([recordData])
        .select(`
            id, date, time, type, location, offense, note, 
            draft_status, created_at, student_id, student_name, staff_id,
            Student:student_id (name, grade)
          `);
        
      if (error) {
        throw error;
      }
      
      // Update state with the new record
      if (data && data.length > 0) {
        const formattedRecord = {
          ...data[0],
          student_name: data[0].student_name || data[0].Student?.name || 'Unknown Student',
          grade: data[0].Student?.grade || '',
        };
        
        setRecords([formattedRecord, ...records]);
      }
      
      return { success: true };
    } catch (err) {
      console.error('Error adding record:', err);
      return { success: false, error: err.message };
    }
  };

  // Function to handle viewing a record
  const handleViewRecord = (record) => {
    setCurrentRecord(record);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Function to handle resetting the form
  const handleResetForm = () => {
    setCurrentRecord(null);
  };

  return (
    <>
      <section className="form-section">
        <h2>Submit New Incident/Note</h2>
        <IncidentNoteForm 
          onSubmit={addRecord} 
          incidentToView={currentRecord}
          onReset={handleResetForm}
        />
      </section>
      
      <section className="table-section">
        <h2>Your Incidents & Notes</h2>
        {loading ? (
          <p>Loading records...</p>
        ) : error ? (
          <p className="error">{error}</p>
        ) : (
          <IncidentNotesTable 
            records={records} 
            onView={handleViewRecord}
          />
        )}
      </section>
    </>
  );
};

export default IncidentNotePage;