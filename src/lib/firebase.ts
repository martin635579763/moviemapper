
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth'; // Import Firebase Auth

// Explicitly log what's being read from process.env to help debug .env.local issues
console.log("Attempting to read Firebase config from environment variables:");
console.log("NEXT_PUBLIC_FIREBASE_API_KEY:", process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? "found" : "NOT FOUND");
console.log("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:", process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? "found" : "NOT FOUND");
console.log("NEXT_PUBLIC_FIREBASE_PROJECT_ID:", process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? "found" : "NOT FOUND");
console.log("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:", process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ? "found" : "NOT FOUND");
console.log("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:", process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ? "found" : "NOT FOUND");
console.log("NEXT_PUBLIC_FIREBASE_APP_ID:", process.env.NEXT_PUBLIC_FIREBASE_APP_ID ? "found" : "NOT FOUND");


const firebaseConfig = {
  apiKey: "AIzaSyCZHWs3ocFmLl4CRYDsLz4389ds3n3spKY",
  authDomain: "fir-test-9b277.firebaseapp.com",
  projectId: "fir-test-9b277",
  storageBucket: "fir-test-9b277.firebasestorage.app",
  messagingSenderId: "199570559125",
  appId: "1:199570559125:web:e61e4cdee2a84867f94b9c",
  measurementId: "G-6F369V29S2"
};

// Log the resolved config to help with debugging environment variables
// console.log("Firebase Config object being used by the application:", firebaseConfig);

// Check if all essential config values are present
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error(
    "Firebase config is missing essential values (apiKey or projectId). " +
    "Please ensure your .env.local file is correctly set up with all NEXT_PUBLIC_FIREBASE_ prefixed variables " +
    "and that you have restarted your Next.js development server after creating/modifying it."
  );
}

let app: FirebaseApp | undefined = undefined;
let db: Firestore | undefined = undefined;
let auth: Auth | undefined = undefined; // For Firebase Auth

if (getApps().length === 0) {
  if (firebaseConfig.apiKey && firebaseConfig.projectId) { // Only attempt init if essential config is present
    try {
      app = initializeApp(firebaseConfig);
      console.log("[firebase.ts] Firebase app initialized successfully (new).");
      db = getFirestore(app);
      auth = getAuth(app); // Initialize Auth
      console.log("[firebase.ts] Firebase Auth instance created (new):", auth ? "Instance OK" : "Instance FAILED");
    } catch (e) {
      console.error("[firebase.ts] Error initializing Firebase app:", e);
      // app, db, and auth will remain undefined
    }
  } else {
    console.warn("[firebase.ts] Firebase app not initialized due to missing essential configuration (apiKey or projectId was falsy after reading from process.env).");
  }
} else {
  app = getApps()[0];
  if (app) { // Ensure app is defined
     db = getFirestore(app);
     auth = getAuth(app); // Get Auth instance from existing app
     console.log("[firebase.ts] Firebase app already initialized. Firestore and Auth instances obtained (existing). Auth:", auth ? "Instance OK" : "Instance FAILED");
  } else {
    console.error("[firebase.ts] Firebase app was expected to be initialized but is not. Cannot get Firestore or Auth instance.")
  }
}

export { app, db, auth };
