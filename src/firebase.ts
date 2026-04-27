// ============================================================
// STEP-BY-STEP: How to connect this app to YOUR Firebase project
// ============================================================
// 1. Go to https://console.firebase.google.com/
// 2. Open YOUR project (the one you already created).
// 3. Click the gear icon ⚙️ > "Project settings"
// 4. Scroll down to "Your apps" section.
//    - If you don't see a web app yet, click the "</>" (Web) icon to add one.
//    - Give it a nickname like "RTP Monitoring Website", then click "Register app".
// 5. You will see a code block with your "firebaseConfig". Copy those values.
// 6. Replace the placeholder strings below with YOUR actual values.
// ============================================================

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// TODO: Replace each value below with YOUR Firebase project's config.
const firebaseConfig = {
  apiKey: "AIzaSyDx_owFfvzUvkpeDZmqqAJpHdn1q6rbs_w",
  authDomain: "rtp-monitoring-website.firebaseapp.com",
  projectId: "rtp-monitoring-website",
  storageBucket: "rtp-monitoring-website.firebasestorage.app",
  messagingSenderId: "700539045902",
  appId: "1:700539045902:web:d1866aba2cf32c60b5d45f",
  measurementId: "G-CYR8CVNE35",
};

// Initialize Firebase services
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);       // Used for login/signup
export const db = getFirestore(app);   // Used for storing student data & feedback
export const storage = getStorage(app); // Used for profile photo uploads
