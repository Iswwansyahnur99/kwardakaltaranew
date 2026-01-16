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
let firebaseApp = null;
let db = null;
let auth = null;
let storage = null;

try {
  firebaseApp = firebase.initializeApp(firebaseConfig);
  console.log('Firebase App initialized successfully');

  // Initialize Firestore
  db = firebase.firestore();
  console.log('Firestore initialized');

  // Initialize Auth
  auth = firebase.auth();
  console.log('Auth initialized');

  // Initialize Storage with error handling
  try {
    storage = firebase.storage();
    // Test storage connection
    console.log('Storage initialized with bucket:', firebaseConfig.storageBucket);
  } catch (storageError) {
    console.error('Storage initialization failed:', storageError);
    storage = null;
  }
} catch (error) {
  console.error('Firebase initialization error:', error);
}

// Export for use in other files
window.firebaseDB = db;
window.firebaseAuth = auth;
window.firebaseStorage = storage;
window.firebaseConfig = firebaseConfig;

// Helper function to check if Firebase is configured
window.isFirebaseConfigured = function() {
  return firebaseConfig.apiKey !== "YOUR_API_KEY" && db !== null;
};

// Helper function to check if Storage is available
window.isStorageAvailable = function() {
  return storage !== null;
};

console.log('Firebase Status:', {
  configured: window.isFirebaseConfigured(),
  storageAvailable: window.isStorageAvailable(),
  storageBucket: firebaseConfig.storageBucket
});
