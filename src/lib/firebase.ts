
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
// import { getAuth, type Auth } from 'firebase/auth'; // For Firebase Auth later if needed

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Log the resolved config to help with debugging environment variables
console.log("Firebase Config being used by the application:", firebaseConfig);

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
// let auth: Auth; // For Firebase Auth later

if (getApps().length === 0) {
  if (firebaseConfig.apiKey && firebaseConfig.projectId) { // Only attempt init if essential config is present
    try {
      app = initializeApp(firebaseConfig);
      console.log("Firebase app initialized successfully.");
      db = getFirestore(app);
    } catch (e) {
      console.error("Error initializing Firebase app:", e);
      // app and db will remain undefined
    }
  } else {
    console.warn("Firebase app not initialized due to missing essential configuration.");
  }
} else {
  app = getApps()[0];
  if (app) { // Ensure app is defined
     db = getFirestore(app);
     console.log("Firebase app already initialized. Firestore instance obtained.");
  } else {
    console.error("Firebase app was expected to be initialized but is not. Cannot get Firestore instance.")
  }
 
}

export { app, db /*, auth*/ };
