
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
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  // measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID // Optional
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
      console.log("Firebase app initialized successfully.");
      db = getFirestore(app);
      auth = getAuth(app); // Initialize Auth
    } catch (e) {
      console.error("Error initializing Firebase app:", e);
      // app, db, and auth will remain undefined
    }
  } else {
    console.warn("Firebase app not initialized due to missing essential configuration (apiKey or projectId was falsy after reading from process.env).");
  }
} else {
  app = getApps()[0];
  if (app) { // Ensure app is defined
     db = getFirestore(app);
     auth = getAuth(app); // Get Auth instance from existing app
     console.log("Firebase app already initialized. Firestore and Auth instances obtained.");
  } else {
    console.error("Firebase app was expected to be initialized but is not. Cannot get Firestore or Auth instance.")
  }
}

export { app, db, auth };
