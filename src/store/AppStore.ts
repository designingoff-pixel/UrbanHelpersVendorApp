// Simple reactive store — no Redux needed for this scale
import { MOCK_JOBS, MOCK_NOTIFICATIONS, MOCK_VENDOR } from '../data/mockData';
import { Job, JobStatus, Vendor, Notification } from '../data/types';

type Listener = () => void;

class AppStore {
  vendor: Vendor = { ...MOCK_VENDOR };
  jobs: Job[] = [];
  notifications: Notification[] = [];
  currentJobId: string | null = null;
  recordingSeconds: number = 0;
  isRecording: boolean = false;

  // ── Firebase identity ──────────────────────────────────────────────────
  firebaseUid: string | null = null;   // Firebase Auth UID (= vendorId in Firestore)
  vendorId: string | null = null;      // same value, explicit alias for clarity
  isFirebaseReady: boolean = false;    // true once auth + Firestore listener running

  private _listeners: Set<Listener> = new Set();

  subscribe(fn: Listener): () => void {
    this._listeners.add(fn);
    return () => { this._listeners.delete(fn); };
  }

  private notify() {
    this._listeners.forEach(fn => fn());
  }

  // ── Called by LoginScreen after Firebase Auth succeeds ─────────────────
  setFirebaseUser(uid: string, displayName: string, mobile: string) {
    this.firebaseUid    = uid;
    this.vendorId       = uid;
    this.isFirebaseReady = true;
    // Patch vendor identity fields
    this.vendor.vendorId = uid;
    if (displayName) this.vendor.name = displayName;
    if (mobile)      this.vendor.mobile = mobile;
    this.notify();
  }

  // ── Sync New Requests (clears out stale requests) ──────────────────────
  syncNewRequests(firestoreJobs: import('../services/firestoreService').FirestoreBooking[]) {
    const otherJobs = this.jobs.filter(j => j.status !== 'NEW_REQUEST');
    const mapped = this._mapFirestore(firestoreJobs);
    this.jobs = [...mapped, ...otherJobs];
    this.notify();
  }

  // ── Sync Assigned Jobs (keeps current new requests) ──────────────────────
  syncAssignedJobs(firestoreJobs: import('../services/firestoreService').FirestoreBooking[]) {
    const newReqs = this.jobs.filter(j => j.status === 'NEW_REQUEST');
    const mapped = this._mapFirestore(firestoreJobs);
    this.jobs = [...mapped, ...newReqs];
    this.notify();
  }

  private _mapFirestore(firestoreJobs: import('../services/firestoreService').FirestoreBooking[]): Job[] {
    return firestoreJobs.map(fb => {
      const existing = this.jobs.find(j => j.jobId === fb.id);
      return {
        jobId:               fb.id,
        customerId:          fb.customerId,
        customerName:        fb.customerName,
        customerPhone:       fb.customerPhone ?? '',
        serviceType:         fb.serviceCategory,
        serviceName:         fb.serviceCategory,
        assignmentType:      'CUSTOMER_REQUEST' as const,
        status:              this._mapStatus(fb.status),
        date:                new Date(fb.scheduledAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        time:                new Date(fb.scheduledAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        address:             fb.address,
        latitude:            0,
        longitude:           0,
        distance:            '–',
        estimatedDuration:   '1 hr',
        customerInstructions:'',
        bookingId:           fb.id,
        paymentStatus:       fb.paymentStatus === 'paid' ? 'PAID' : 'PENDING',
        vendorEarnings:      Math.round(fb.price * 0.8),
        otp:                 fb.otp ?? '',
        checklist:           existing?.checklist ?? [],
        checklistDone:       existing?.checklistDone ?? [],
        createdAt:           Date.now(),
      } as Job;
    });
  }

  // Map Firestore status string → vendor app JobStatus
  private _mapStatus(s: string): JobStatus {
    const map: Record<string, JobStatus> = {
      requested:   'NEW_REQUEST',
      assigned:    'ACCEPTED',
      accepted:    'ACCEPTED',
      en_route:    'NAVIGATING',
      arrived:     'ARRIVED',
      in_progress: 'SERVICE_STARTED',
      completed:   'COMPLETED',
      cancelled:   'CANCELLED',
    };
    return map[s] ?? 'NEW_REQUEST';
  }

  getJob(jobId: string): Job | undefined {
    return this.jobs.find(j => j.jobId === jobId);
  }

  getCurrentJob(): Job | undefined {
    return this.currentJobId ? this.getJob(this.currentJobId) : undefined;
  }

  setCurrentJob(jobId: string) {
    this.currentJobId = jobId;
    this.notify();
  }

  updateJobStatus(jobId: string, status: JobStatus, extra?: Partial<Job>) {
    const job = this.jobs.find(j => j.jobId === jobId);
    if (!job) return;
    Object.assign(job, { status, ...extra });
    this.notify();
  }

  toggleChecklist(jobId: string, item: string) {
    const job = this.jobs.find(j => j.jobId === jobId);
    if (!job) return;
    const idx = job.checklistDone.indexOf(item);
    if (idx > -1) job.checklistDone.splice(idx, 1);
    else job.checklistDone.push(item);
    this.notify();
  }

  toggleOnline(isOnline: boolean) {
    this.vendor.isOnline = isOnline;
    this.notify();
  }

  completeJob(jobId: string) {
    const job = this.jobs.find(j => j.jobId === jobId);
    if (!job) return;
    job.status = 'COMPLETED';
    job.completedAt = Date.now();
    job.recordingStoppedAt = Date.now();
    this.isRecording = false;
    this.recordingSeconds = 0;
    this.notify();
  }

  startRecording(jobId: string) {
    this.isRecording = true;
    this.recordingSeconds = 0;
    const job = this.jobs.find(j => j.jobId === jobId);
    if (job) {
      job.status = 'RECORDING_ACTIVE';
      job.recordingStartedAt = Date.now();
      job.serviceStartedAt = Date.now();
    }
    this.notify();
  }

  tickRecording() {
    if (this.isRecording) {
      this.recordingSeconds += 1;
      this.notify();
    }
  }

  markNotificationRead(id: string) {
    const n = this.notifications.find(n => n.id === id);
    if (n) { n.read = true; this.notify(); }
  }

  get unreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  getJobsForTab(tab: string): Job[] {
    const map: Record<string, JobStatus[]> = {
      requests: ['NEW_REQUEST'],
      upcoming: ['ACCEPTED', 'ADMIN_ASSIGNED', 'UPCOMING'],
      active: ['NAVIGATING', 'ARRIVED', 'OTP_PENDING', 'CUSTOMER_VERIFIED', 'SERVICE_STARTED', 'RECORDING_ACTIVE', 'RECORDING_STOPPED'],
      completed: ['COMPLETED', 'REJECTED', 'CANCELLED'],
    };
    return this.jobs.filter(j => (map[tab] || []).includes(j.status));
  }

  // ── Computed Stats ────────────────────────────────────────────────────────
  get completedJobsCount(): number {
    return this.jobs.filter(j => j.status === 'COMPLETED').length;
  }

  get totalEarnings(): number {
    return this.jobs.filter(j => j.status === 'COMPLETED').reduce((acc, job) => acc + job.vendorEarnings, 0);
  }
}

export const store = new AppStore();
