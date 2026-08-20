// ============================================================
//  Urban Captain Vendor App — Data Types
// ============================================================

export type JobStatus =
  | 'NEW_REQUEST' | 'ACCEPTED' | 'ADMIN_ASSIGNED' | 'UPCOMING'
  | 'NAVIGATING' | 'ARRIVED' | 'OTP_PENDING' | 'CUSTOMER_VERIFIED'
  | 'SERVICE_STARTED' | 'RECORDING_ACTIVE' | 'RECORDING_STOPPED'
  | 'COMPLETED' | 'REJECTED' | 'CANCELLED';

export type AssignmentType = 'CUSTOMER_REQUEST' | 'ADMIN_ASSIGNED';

export interface Job {
  jobId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  serviceType: string;
  serviceName: string;
  assignmentType: AssignmentType;
  status: JobStatus;
  date: string;
  time: string;
  address: string;
  latitude: number;
  longitude: number;
  distance: string;
  estimatedDuration: string;
  customerInstructions: string;
  bookingId: string;
  paymentStatus: 'PAID' | 'PENDING';
  vendorEarnings: number;
  otp: string;
  checklist: string[];
  checklistDone: string[];
  createdAt: number;
  acceptedAt?: number;
  arrivedAt?: number;
  serviceStartedAt?: number;
  recordingStartedAt?: number;
  recordingStoppedAt?: number;
  completedAt?: number;
}

export interface Vendor {
  vendorId: string;
  name: string;
  mobile: string;
  email: string;
  rating: number;
  completedJobs: number;
  todayEarnings: number;
  weekEarnings: number;
  monthEarnings: number;
  isOnline: boolean;
  services: string[];
  serviceArea: string;
  serviceRadius: number;
  avatar: string;
  isVerified: boolean;
}

export interface Notification {
  id: string;
  type: 'request' | 'assignment' | 'completed' | 'upcoming' | 'system' | 'safety';
  title: string;
  body: string;
  time: string;
  jobId?: string;
  read: boolean;
  icon: string;
  accentColor: string;
}

export interface AppState {
  vendor: Vendor;
  jobs: Job[];
  notifications: Notification[];
  currentJobId: string | null;
  recordingSeconds: number;
  isRecording: boolean;
}
