// ─────────────────────────────────────────────────────────────────────────────
// Urban Captain Vendor App — Firebase
// Same project as customer app + admin dashboard: urban-helpers-admin
//
// Uses initializeAuth with AsyncStorage persistence (required for React Native).
// getAuth() uses browser localStorage which crashes on Android.
// ─────────────────────────────────────────────────────────────────────────────

import { getApp, getApps, initializeApp } from "firebase/app";
import { Auth, getAuth, initializeAuth } from "firebase/auth";
// @ts-expect-error — Metro resolves the RN implementation at runtime via
// the "react-native" package.json condition; TypeScript only sees browser types
import { getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
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

// initializeAuth throws if called more than once (e.g. Fast Refresh).
// Fall back to getAuth() in that case.
let auth: Auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  auth = getAuth(app);
}

export { auth };
export const db = getFirestore(app);
