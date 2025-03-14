import { supabase } from './config';
import { authService } from './auth-service';
import { studentService } from './student-service';
import { referralService } from './referral-service';
import { teamService } from './team-service';
import { incidentService } from './incident-service';
import { adminService } from './admin-service';
import { followupService } from './followup-service';
import { progressService } from './progress-service';
import { quickAddService } from './quick-add-service';

// Export all services
export {
  supabase,
  authService,
  studentService,
  referralService,
  teamService,
  incidentService,
  adminService,
  followupService,
  progressService,
  quickAddService
};