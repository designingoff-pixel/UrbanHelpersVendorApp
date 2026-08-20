// Simple reactive store — no Redux needed for this scale
import { MOCK_JOBS, MOCK_NOTIFICATIONS, MOCK_VENDOR } from '../data/mockData';
import { Job, JobStatus, Vendor, Notification } from '../data/types';

type Listener = () => void;

class AppStore {
  vendor: Vendor = { ...MOCK_VENDOR };
  jobs: Job[] = MOCK_JOBS.map(j => ({ ...j, checklistDone: [...j.checklistDone] }));
  notifications: Notification[] = [...MOCK_NOTIFICATIONS];
  currentJobId: string | null = null;
  recordingSeconds: number = 0;
  isRecording: boolean = false;
  private _listeners: Set<Listener> = new Set();

  subscribe(fn: Listener) {
    this._listeners.add(fn);
    return () => this._listeners.delete(fn);
  }

  private notify() {
    this._listeners.forEach(fn => fn());
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
    this.vendor.todayEarnings += job.vendorEarnings;
    this.vendor.weekEarnings += job.vendorEarnings;
    this.vendor.monthEarnings += job.vendorEarnings;
    this.vendor.completedJobs += 1;
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
}

export const store = new AppStore();
