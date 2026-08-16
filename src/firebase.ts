import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Check if we have valid non-placeholder keys
const isConfigReal = firebaseConfig.apiKey && firebaseConfig.apiKey !== 'MOCK_API_KEY_PLACEHOLDER';

let app;
let auth: any = null;
let db: any = null;
let googleProvider: any = null;

if (isConfigReal) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    
    // Validate connection to Firestore as requested by the skill
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration state.");
        }
      }
    };
    testConnection();
  } catch (error) {
    console.error("Firebase lazy initialization issue:", error);
  }
}

export { auth, db, googleProvider, isConfigReal };
