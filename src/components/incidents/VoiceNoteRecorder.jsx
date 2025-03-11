import React, { useState, useRef } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { audioService } from '../../services/audio-service';
import '../../styles/components/VoiceNoteRecorder.css';

/**
 * Modal component for recording voice notes
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Function to close the modal
 * @param {Function} props.onSaveTranscription - Function to save the transcription as a draft note
 */
const VoiceNoteRecorder = ({ isOpen, onClose, onSaveTranscription }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState('');
  const [transcription, setTranscription] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState('');
  const [stage, setStage] = useState('initial'); // initial, recorded, transcribing, transcribed
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  
  // Start recording audio
  const startRecording = async () => {
    try {
      setError('');
      const stream = await audioService.requestMicrophoneAccess();
      
      mediaRecorderRef.current = audioService.createRecorder(stream);
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        setAudioBlob(audioBlob);
        setAudioUrl(audioUrl);
        setIsRecording(false);
        setStage('recorded');
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error starting recording:', err);
      setError(err.message || 'Could not access microphone. Please check browser permissions.');
      setIsRecording(false);
    }
  };
  
  // Stop recording audio
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      
      // Stop all audio tracks
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };
  
  // Transcribe audio using our audio service
  const transcribeAndSave = async () => {
    if (!audioBlob) return;
    
    try {
      setIsTranscribing(true);
      setStage('transcribing');
      setError('');
      
      // Use the audio service to transcribe the audio
      const transcribedText = await audioService.transcribeAudio(audioBlob);
      
      setTranscription(transcribedText);
      setStage('transcribed');
      
      // Call the save callback with the transcription
      if (onSaveTranscription) {
        onSaveTranscription(transcribedText);
      }
    } catch (err) {
      console.error('Error transcribing audio:', err);
      setError(err.message || 'Failed to transcribe audio. Please try again.');
      setStage('recorded'); // Go back to recorded stage on error
    } finally {
      setIsTranscribing(false);
    }
  };
  
  // Handle closing the modal
  const handleClose = () => {
    // Clean up resources
    resetRecorder();
    onClose();
  };
  
  // Reset the recorder
  const resetRecorder = () => {
    setAudioBlob(null);
    setAudioUrl('');
    setTranscription('');
    setError('');
    setStage('initial');
    
    // Revoke object URL to avoid memory leaks
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
  };
  
  // Discard recording and start over
  const handleDiscard = () => {
    resetRecorder();
  };
  
    // Render different content based on the current stage
    const renderContent = () => {
        switch (stage) {
        case 'initial':
            return (
            <div className="voice-note-stage">
                <div className="voice-note-recorder-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                        <line x1="12" y1="19" x2="12" y2="23"></line>
                        <line x1="8" y1="23" x2="16" y2="23"></line>
                    </svg>
                    {isRecording && <div className="recording-indicator"></div>}
                </div>
                <p>
                {isRecording 
                    ? "Recording in progress... Click \"Stop Recording\" when finished."
                    : "Click \"Start Recording\" to begin recording your voice note."}
                </p>
                {!isRecording && (
                <Button 
                    variant="primary" 
                    onClick={startRecording}
                    icon={
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="6" fill="currentColor"></circle>
                    </svg>
                    }
                >
                    Start Recording
                </Button>
                )}
            </div>
            );
      
      case 'recorded':
        return (
          <div className="voice-note-stage">
            <div className="voice-note-audio-preview">
              <audio src={audioUrl} controls className="voice-note-audio-player" />
            </div>
            <p>Review your recording. You can save and transcribe it or discard and try again.</p>
            <div className="voice-note-actions">
              <Button variant="secondary" onClick={handleDiscard}>
                Discard
              </Button>
              <Button variant="primary" onClick={transcribeAndSave}>
                Save & Transcribe
              </Button>
            </div>
          </div>
        );
        
      case 'transcribing':
        return (
          <div className="voice-note-stage voice-note-transcribing">
            <div className="voice-note-loading">
              <svg className="spinner" viewBox="0 0 50 50">
                <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5"></circle>
              </svg>
            </div>
            <p>Transcribing your recording...</p>
          </div>
        );
        
      case 'transcribed':
        return (
          <div className="voice-note-stage">
            <div className="voice-note-success">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <h3>Voice Note Saved!</h3>
            <p>Your voice note has been transcribed and saved as a draft. You can edit it from the drafts section.</p>
            <Button variant="primary" onClick={handleClose}>
              Done
            </Button>
          </div>
        );
      
      default:
        return null;
    }
  };
  
    // Create the modal footer based on the current stage
    const renderFooter = () => {
        // Show stop recording button only when recording is in progress
        if (stage === 'initial' && isRecording) {
        return (
            <Button 
            variant="danger" 
            onClick={stopRecording}
            icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="6" y="6" width="12" height="12" />
                </svg>
            }
            >
            Stop Recording
            </Button>
        );
    }
    
        return null;
    };
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Record Voice Note"
      size="sm"
      closeOnOutsideClick={!isRecording && stage !== 'transcribing'}
      footer={renderFooter()}
    >
      {error && <div className="voice-note-error">{error}</div>}
      {renderContent()}
    </Modal>
  );
};

export default VoiceNoteRecorder;