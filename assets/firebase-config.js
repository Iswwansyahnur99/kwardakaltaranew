// Firebase Configuration
// PENTING: Ganti dengan config dari Firebase Console Anda
// Langkah: Firebase Console > Project Settings > Your Apps > Config

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firestore
const db = firebase.firestore();

// Initialize Auth
const auth = firebase.auth();

// Export for use in other files
window.firebaseDB = db;
window.firebaseAuth = auth;

// Helper function to check if Firebase is configured
window.isFirebaseConfigured = function() {
  return firebaseConfig.apiKey !== "YOUR_API_KEY";
};

console.log('Firebase initialized:', window.isFirebaseConfigured() ? 'Configured' : 'Not configured - using localStorage fallback');
