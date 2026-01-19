// Firebase Configuration for Pramuka Kaltara CMS

const firebaseConfig = {
  // !!! IMPORTANT !!!
  // Replace this with your own Firebase configuration from the Firebase console.
  // This is a placeholder and will not work.
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
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
