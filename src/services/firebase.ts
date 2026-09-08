// ─────────────────────────────────────────────────────────────────────────────
// Urban Captain Vendor App — Firebase
// Uses initializeAuth with AsyncStorage persistence so vendor sessions survive
// app restarts. The vendor won't be pushed to login every time they reopen.
// ─────────────────────────────────────────────────────────────────────────────

import { getApp, getApps, initializeApp } from "firebase/app";
import { initializeAuth, getAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey:            "AIzaSyDhkD-wS-wCc2ZlMbHSNTEp3MFxSrLIUQY",
  authDomain:        "urban-helpers-admin.firebaseapp.com",
  projectId:         "urban-helpers-admin",
  storageBucket:     "urban-helpers-admin.firebasestorage.app",
  messagingSenderId: "843343743619",
  appId:             "1:843343743619:web:a0c09ea15fa85780d6a9b6",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Use initializeAuth only once (on first init); fall back to getAuth() if already initialized
let _auth: ReturnType<typeof getAuth>;
try {
  _auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (_) {
  // Already initialized — just get the existing instance
  _auth = getAuth(app);
}

export const auth    = _auth;
export const db      = getFirestore(app);
export const storage = getStorage(app);

