import { useEffect, useState } from 'react';
import { useIncidents } from '../hooks/useIncidents';
import { useStudentData } from '../context/StudentDataContext';
import { getTodayForInput } from '../utils/dateUtils';
import IncidentNoteForm from '../components/incidents/IncidentNoteForm';
import IncidentNotesTable from '../components/incidents/IncidentNotesTable';
import VoiceNoteRecorder from '../components/incidents/VoiceNoteRecorder';
import DraftsSection from '../components/incidents/DraftsSection';
import FloatingActionButton from '../components/common/FloatingActionButton';
import '../styles/pages/IncidentNotePage.css';

/**
 * Page component for managing incidents and notes
 */
const IncidentNotePage = ({ user }) => {
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [drafts, setDrafts] = useState([]);
  const [isLoadingDrafts, setIsLoadingDrafts] = useState(false);
  const [isEditingDraft, setIsEditingDraft] = useState(false);
  
  // Use our incidents hook
  const {
    records,
    currentRecord,
    loading,
    error,
    editMode,
    addIncident,
    editIncident,
    deleteIncident,
    viewRecord,
    resetCurrentRecord,
    getDraftsByStaff
  } = useIncidents(user?.id);
  
  // Student context is used to check if a student was pre-selected
  const { selectedStudent } = useStudentData();

  // Fetch drafts when the page loads
  useEffect(() => {
    fetchDrafts();
  }, [user?.id]);

  // Scroll to form if a student was selected in another page
  useEffect(() => {
    if (selectedStudent) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [selectedStudent]);
  
  // Fetch draft notes
  const fetchDrafts = async () => {
    try {
      setIsLoadingDrafts(true);
      const draftRecords = await getDraftsByStaff();
      setDrafts(draftRecords);
    } catch (err) {
      console.error('Error fetching drafts:', err);
    } finally {
      setIsLoadingDrafts(false);
    }
  };

  // Handler for form submission (new record)
  const handleSubmitRecord = async (formData) => {
    try {
      const result = await addIncident({
        studentId: formData.studentId,
        studentName: formData.studentName,
        type: formData.type,
        date: formData.date,
        time: formData.time || null,
        location: formData.type === 'Incident' ? formData.location : null,
        offense: formData.type === 'Incident' ? formData.offense : null,
        note: formData.note,
        isDraft: false
      });
      
      // Refresh drafts in case a draft was completed
      fetchDrafts();
      
      return result;
    } catch (err) {
      console.error('Error submitting record:', err);
      throw err;
    }
  };

  // Handler for editing a record
  const handleEditRecord = async (recordId, formData) => {
    try {
      const result = await editIncident(recordId, {
        ...formData,
        isDraft: false // Mark as no longer a draft when edited and saved
      });
      
      // Refresh drafts if we're editing a draft
      if (isEditingDraft) {
        setIsEditingDraft(false);
        fetchDrafts();
      }
      
      return result;
    } catch (err) {
      console.error('Error editing record:', err);
      throw err;
    }
  };

  // Handler for viewing a record
  const handleViewRecord = (record) => {
    viewRecord(record, false);
    setIsEditingDraft(false);
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handler for editing a record
  const handleEditButtonClick = (record) => {
    viewRecord(record, true);
    setIsEditingDraft(false);
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Handler for showing the voice recorder
  const handleShowVoiceRecorder = () => {
    setShowVoiceRecorder(true);
  };
  
  // Handler for hiding the voice recorder
  const handleHideVoiceRecorder = () => {
    setShowVoiceRecorder(false);
  };
  
  // Handler for saving and transcribing a voice note
  const handleSaveVoiceNote = async (transcription) => {
    try {
      // Create a new draft with the transcription
      await addIncident({
        note: transcription,
        date: getTodayForInput(),
        type: 'Note', // Default to Note type
        isDraft: true // Mark as draft
      });
      
      // Refresh drafts
      await fetchDrafts();
    } catch (err) {
      console.error('Error saving voice note:', err);
    }
  };
  
  // Handler for editing a draft note
  const handleEditDraft = (draft) => {
    viewRecord(draft, true);
    setIsEditingDraft(true);
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Handler for deleting a draft note
  const handleDeleteDraft = async (draftId) => {
    if (window.confirm('Are you sure you want to delete this draft note?')) {
      try {
        await deleteIncident(draftId);
        // Refresh drafts
        await fetchDrafts();
      } catch (err) {
        console.error('Error deleting draft:', err);
      }
    }
  };
  
  // Handler for form reset
  const handleFormReset = () => {
    resetCurrentRecord();
    setIsEditingDraft(false);
  };

  return (
    <>
      <section className="form-section">
        <h2>{currentRecord && editMode ? 'Edit Incident/Note' : 'Submit New Incident/Note'}</h2>
        <IncidentNoteForm 
          onSubmit={handleSubmitRecord}
          onEdit={handleEditRecord}
          incidentToView={currentRecord}
          editMode={editMode}
          onReset={handleFormReset}
        />
      </section>
      
      {/* Drafts Section */}
      <DraftsSection 
        drafts={drafts} 
        onEdit={handleEditDraft}
        onDelete={handleDeleteDraft}
        loading={isLoadingDrafts}
      />
      
      <section className="table-section">
        <h2>Your Incidents & Notes</h2>
        {error ? (
          <p className="error-message">{error}</p>
        ) : (
          <IncidentNotesTable 
            records={records} 
            onView={handleViewRecord}
            onEdit={handleEditButtonClick}
            loading={loading}
          />
        )}
      </section>
      
      {/* Voice Note Recorder Modal */}
      <VoiceNoteRecorder 
        isOpen={showVoiceRecorder}
        onClose={handleHideVoiceRecorder}
        onSaveTranscription={handleSaveVoiceNote}
      />
      
      {/* Floating Action Button for Voice Recording */}
      <FloatingActionButton
        onClick={handleShowVoiceRecorder}
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
            <line x1="12" y1="19" x2="12" y2="23"></line>
            <line x1="8" y1="23" x2="16" y2="23"></line>
          </svg>
        }
        title="Record Voice Note"
        ariaLabel="Record a new voice note"
      />
    </>
  );
};

export default IncidentNotePage;