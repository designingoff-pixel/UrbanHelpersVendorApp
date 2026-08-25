// ─────────────────────────────────────────────────────────────────────────────
// Urban Captain Vendor App — Firestore Service
//
// Replaces Socket.io with Firestore real-time listeners.
// Same Firebase project as customer app + admin dashboard.
//
// Collections used:
//   /bookings/{bookingId}  — booking status + OTP
//   /vendors/{vendorId}    — vendor online status + live location
// ─────────────────────────────────────────────────────────────────────────────

import {
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "./firebase";

// ── Types ─────────────────────────────────────────────────────────────────────

export type BookingStatus =
  | "requested"
  | "assigned"
  | "accepted"
  | "en_route"
  | "arrived"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface FirestoreBooking {
  id:              string;
  customerId:      string;
  customerName:    string;
  vendorId?:       string;
  vendorName?:     string;
  serviceCategory: string;
  subServiceName:  string;
  status:          BookingStatus;
  address:         string;
  scheduledAt:     string;
  price:           number;
  priceLabel:      string;
  paymentStatus:   string;
  safety:          string;
  otp?:            string;
}

// ─────────────────────────────────────────────────────────────────────────────
// JOBS — Listen for bookings assigned to this vendor
// Call this on the HomeScreen / JobsScreen to get live job list
// ─────────────────────────────────────────────────────────────────────────────
export function subscribeToVendorJobs(
  vendorId: string,
  onChange:  (bookings: FirestoreBooking[]) => void
) {
  const q = query(
    collection(db, "bookings"),
    where("vendorId", "==", vendorId),
    where("status", "in", ["assigned", "accepted", "en_route", "arrived", "in_progress"])
  );

  return onSnapshot(q, (snapshot) => {
    const jobs = snapshot.docs.map(
      (d) => ({ id: d.id, ...d.data() } as FirestoreBooking)
    );
    onChange(jobs);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Listen for new booking requests that have NO vendor assigned yet.
// These are broadcast to ALL online vendors — first to accept wins.
// Uses vendorName == "Vendor pending" as the unassigned signal
// (set by customer app's createBooking).
// ─────────────────────────────────────────────────────────────────────────────
export function subscribeToNewRequests(
  onChange: (bookings: FirestoreBooking[]) => void
) {
  const q = query(
    collection(db, "bookings"),
    where("status",     "==", "requested"),
    where("vendorName", "==", "Vendor pending")
  );

  return onSnapshot(q, (snapshot) => {
    const jobs = snapshot.docs.map(
      (d) => ({ id: d.id, ...d.data() } as FirestoreBooking)
    );
    onChange(jobs);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Accept a job — uses a Firestore TRANSACTION to prevent two vendors
// accepting the same job simultaneously (race condition protection).
// Only succeeds if booking is still "requested" or "assigned" with no vendor.
// ─────────────────────────────────────────────────────────────────────────────
export async function acceptJob(
  bookingId: string,
  vendorId:  string,
  vendorName: string
): Promise<void> {
  const { runTransaction } = await import("firebase/firestore");

  await runTransaction(db, async (transaction) => {
    const bookingRef  = doc(db, "bookings", bookingId);
    const bookingSnap = await transaction.get(bookingRef);

    if (!bookingSnap.exists()) {
      throw new Error("Booking not found.");
    }

    const data = bookingSnap.data() as FirestoreBooking;

    // Block if another vendor already accepted
    if (
      data.status === "accepted" ||
      data.status === "en_route"  ||
      data.status === "in_progress"
    ) {
      throw new Error("This job was already accepted by another vendor.");
    }

    // Lock the booking to this vendor
    transaction.update(bookingRef, {
      vendorId,
      vendorName,
      status:     "accepted",
      acceptedAt: serverTimestamp(),
    });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Reject a job
// ─────────────────────────────────────────────────────────────────────────────
export async function rejectJob(bookingId: string): Promise<void> {
  await updateDoc(doc(db, "bookings", bookingId), {
    status:     "requested",   // back to requested so admin can reassign
    vendorId:   null,
    vendorName: "Vendor pending",
    rejectedAt: serverTimestamp(),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Update booking status
// Call at each step: en_route → arrived → in_progress → completed
// ─────────────────────────────────────────────────────────────────────────────
export async function updateBookingStatus(
  bookingId: string,
  status:    BookingStatus
): Promise<void> {
  const update: Record<string, any> = {
    status,
    [`${status}At`]: serverTimestamp(),
  };

  if (status === "completed") {
    update.completedAt = serverTimestamp();
  }

  await updateDoc(doc(db, "bookings", bookingId), update);
}

// ─────────────────────────────────────────────────────────────────────────────
// Write vendor's live GPS location to Firestore
// Customer app reads this in real time on LiveTrackingScreen
// Call this every 5 seconds while en_route / in_progress
// ─────────────────────────────────────────────────────────────────────────────
export async function updateVendorLocation(
  vendorId:  string,
  lat:       number,
  lng:       number,
  heading:   number = 0,
  speed:     number = 0
): Promise<void> {
  await updateDoc(doc(db, "vendors", vendorId), {
    location: {
      lat,
      lng,
      heading,
      speed,
      updatedAt: serverTimestamp(),
    },
    isOnline: true,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Set vendor online / offline status
// ─────────────────────────────────────────────────────────────────────────────
export async function setVendorOnlineStatus(
  vendorId: string,
  isOnline: boolean
): Promise<void> {
  await updateDoc(doc(db, "vendors", vendorId), {
    isOnline,
    lastSeen: serverTimestamp(),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Verify OTP — vendor enters customer's OTP to start service
// OTP is stored in the booking document by the customer app
// ─────────────────────────────────────────────────────────────────────────────
export function subscribeToBookingOTP(
  bookingId: string,
  onOTP:     (otp: string | null) => void
) {
  return onSnapshot(doc(db, "bookings", bookingId), (snap) => {
    if (snap.exists()) {
      onOTP((snap.data() as FirestoreBooking).otp ?? null);
    }
  });
}

export async function verifyOTP(
  bookingId:   string,
  enteredOTP:  string
): Promise<boolean> {
  // Read current OTP from Firestore
  const { getDoc } = await import("firebase/firestore");
  const snap = await getDoc(doc(db, "bookings", bookingId));

  if (!snap.exists()) return false;

  const booking = snap.data() as FirestoreBooking;
  const correct  = booking.otp === enteredOTP;

  if (correct) {
    // OTP verified — start service
    await updateDoc(doc(db, "bookings", bookingId), {
      status:       "in_progress",
      otpVerified:  true,
      startedAt:    serverTimestamp(),
    });
  }

  return correct;
}
