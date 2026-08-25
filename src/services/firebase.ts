// ─────────────────────────────────────────────────────────────────────────────
// Urban Captain Vendor App — Firebase
// Same project as customer app + admin dashboard: urban-helpers-admin
// ─────────────────────────────────────────────────────────────────────────────

import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey:            "AIzaSyDhkD-wS-wCc2ZlMbHSNTEp3MFxSrLIUQY",
  authDomain:        "urban-helpers-admin.firebaseapp.com",
  projectId:         "urban-helpers-admin",
  storageBucket:     "urban-helpers-admin.firebasestorage.app",
  messagingSenderId: "843343743619",
  appId:             "1:843343743619:web:a0c09ea15fa85780d6a9b6",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db   = getFirestore(app);
