// ─────────────────────────────────────────────────────────────────────────────
// Urban Captain Vendor App — Socket Service (disabled)
// Socket.io is replaced by Firestore real-time listeners.
// This file is kept to prevent import errors elsewhere.
// All functions are no-ops — real logic is in firestoreService.ts
// ─────────────────────────────────────────────────────────────────────────────

// DO NOT import io() or socket.io-client here — it crashes on Android
// when SOCKET_URL is empty (io("") throws a connection error at module level)

export function connectVendorSocket(
  _bookingId:  string,
  _vendorId:   string,
  _vendorName: string,
  _callbacks:  Record<string, unknown> = {}
): void {
  // no-op — use firestoreService instead
}

export function startLocationBroadcast(_bookingId: string): Promise<boolean> {
  return Promise.resolve(false);
}

export function updateBookingStatus(
  _bookingId: string,
  _status:    string
): void {
  // no-op — use firestoreService.updateBookingStatus instead
}

export function sendETAUpdate(
  _bookingId:   string,
  _etaMinutes:  number,
  _distanceKm:  number
): void {
  // no-op
}

export function stopLocationBroadcast(): void {
  // no-op
}

export function disconnectVendorSocket(): void {
  // no-op
}

export function calculateETA(distanceKm: number): number {
  return Math.max(1, Math.round((distanceKm / 25) * 60));
}

export function getDistanceKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R    = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
