// ============================================================
//  🔥 Firebase Configuration — KenGSL Portfolio
// ============================================================
//
//  HOW TO SET UP YOUR FIREBASE PROJECT:
//
//  1. Go to https://console.firebase.google.com/
//  2. Click "Create a project" → name it (e.g. "kengsl-portfolio")
//  3. Disable Google Analytics (optional) → Create project
//  4. In the project dashboard, click the Web icon (</>) to add a web app
//  5. Register app name (e.g. "kengsl-web") → Register app
//  6. Copy the firebaseConfig object below and replace the placeholders
//
//  ENABLE AUTHENTICATION:
//  7. Go to Build → Authentication → Get started
//  8. Click "Google" provider → Enable it → Set project support email → Save
//
//  ENABLE FIRESTORE:
//  9. Go to Build → Firestore Database → Create database
//  10. Start in "production mode" → Choose a region (e.g. asia-south1) → Create
//  11. Go to Rules tab and paste the security rules from below
//
// ============================================================


// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyABUuoODoo5C4Gn9TZ9szqRqvH2jwODyX8",
  authDomain: "keng-website.firebaseapp.com",
  projectId: "keng-website",
  storageBucket: "keng-website.firebasestorage.app",
  messagingSenderId: "604759215203",
  appId: "1:604759215203:web:ec3663c7a6ccf1d66afc56",
  measurementId: "G-57ZCZDH8KM"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// ============================================================
//  FIRESTORE SECURITY RULES — Paste in Firebase Console → Firestore → Rules
// ============================================================
//
//  rules_version = '2';
//  service cloud.firestore {
//    match /databases/{database}/documents {
//
//      function isAdmin() {
//        return request.auth != null && (
//          get(/databases/$(database)/documents/settings/admin).data.uid == request.auth.uid ||
//          exists(/databases/$(database)/documents/admins/$(request.auth.uid))
//        );
//      }
//
//      function isPrimaryAdmin() {
//        return request.auth != null && 
//          get(/databases/$(database)/documents/settings/admin).data.uid == request.auth.uid;
//      }
//
//      // Portfolio & Testimonials: public read, any admin write
//      match /portfolio/{itemId} {
//        allow read: if true;
//        allow write: if isAdmin();
//      }
//      match /testimonials/{itemId} {
//        allow read: if true;
//        allow write: if isAdmin();
//      }
//
//      // Settings: any logged-in user can read to check admin status, first user can create
//      match /settings/admin {
//        allow read: if request.auth != null;
//        allow create: if request.auth != null && !exists(/databases/$(database)/documents/settings/admin);
//        allow update, delete: if isPrimaryAdmin();
//      }
//
//      // Granted Admins: primary admin controls
//      match /admins/{uid} {
//        allow read: if isPrimaryAdmin() || request.auth.uid == uid;
//        allow write: if isPrimaryAdmin();
//      }
//
//      // Pending Users: users can create their own request, primary admin can read/delete
//      match /pendingUsers/{uid} {
//        allow read: if isPrimaryAdmin();
//        allow create: if request.auth != null && request.auth.uid == uid;
//        allow update, delete: if isPrimaryAdmin() || request.auth.uid == uid;
//      }
//    }
//  }
//
// ============================================================
