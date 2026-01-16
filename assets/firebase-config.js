// Firebase Configuration for Pramuka Kaltara CMS

const firebaseConfig = {
  apiKey: "AIzaSyCR4ASGnVYgSGmNhV9SS0jvLvY1UeMXx4Q",
  authDomain: "pramuka-kaltara.firebaseapp.com",
  projectId: "pramuka-kaltara",
  storageBucket: "pramuka-kaltara.firebasestorage.app",
  messagingSenderId: "150809477900",
  appId: "1:150809477900:web:54bcc354a87c097df67f29",
  measurementId: "G-TCPERMJ2P4"
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
