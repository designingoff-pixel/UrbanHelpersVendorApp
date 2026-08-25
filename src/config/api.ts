// ─────────────────────────────────────────────────────────────────────────────
// Urban Helpers Vendor App — Backend Config
//
// HOW TO FIND YOUR IP:
//   Windows: open cmd → type "ipconfig" → look for IPv4 Address under WiFi
//   e.g. 192.168.1.105
//
// Both phones must be on the SAME WiFi as your laptop for local testing.
// For production: replace with Railway/Render deployed URL.
// ─────────────────────────────────────────────────────────────────────────────

// ── Change this to YOUR machine's local IP address ────────────────────────
export const BACKEND_URL = "http://192.168.1.100:3001";

// ── For production (after deploying to Railway): ──────────────────────────
// export const BACKEND_URL = "https://urban-helpers-backend-xxxx.railway.app";

export const SOCKET_URL = BACKEND_URL;
export const API_URL    = `${BACKEND_URL}/api`;
