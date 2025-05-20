
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth, GoogleAuthProvider } from "firebase/auth"; // Import GoogleAuthProvider
import { getAnalytics, type Analytics } from "firebase/analytics";
import { getFirestore, doc, setDoc, getDoc, serverTimestamp, collection, writeBatch, query, where, getDocs, deleteDoc, updateDoc, arrayUnion, arrayRemove, increment  } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC2q1UTbiF9gz7_9r3oWlmf22f30S-zCOY",
  authDomain: "agency-3852d.firebaseapp.com",
  projectId: "agency-3852d",
  storageBucket: "agency-3852d.firebasestorage.app",
  messagingSenderId: "547405510107",
  appId: "1:547405510107:web:d097ed51d383f8ea91e3fe",
  measurementId: "G-JWZ2Z0X3CG"
};

// Initialize Firebase
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

let analytics: Analytics | null = null;

// Initialize Firebase Analytics only on the client-side
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

const auth: Auth = getAuth(app);
const db = getFirestore(app);

export { 
  app, 
  auth, 
  analytics, 
  GoogleAuthProvider, 
  db, 
  doc, 
  setDoc, 
  getDoc, 
  serverTimestamp,
  collection,
  writeBatch,
  query,
  where,
  getDocs,
  deleteDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  increment
};
