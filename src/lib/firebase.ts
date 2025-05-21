
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth, GoogleAuthProvider } from "firebase/auth"; // Import GoogleAuthProvider
import { getAnalytics, type Analytics, isSupported } from "firebase/analytics"; // Added isSupported
import { 
  getFirestore, 
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
  increment,
  Timestamp, // Imported Timestamp
  addDoc, // Imported addDoc
  onSnapshot, // Imported onSnapshot
  orderBy // Imported orderBy
} from "firebase/firestore";
import {
  getStorage,
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject as deleteFileStorage
} from "firebase/storage";


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
  isSupported().then(supported => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

const auth: Auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

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
  increment,
  Timestamp, // Exporting Timestamp
  addDoc, // Exporting addDoc
  onSnapshot, // Exporting onSnapshot
  orderBy, // Exporting orderBy
  storage, // Exporting storage
  storageRef, // Exporting storageRef
  uploadBytesResumable, // Exporting uploadBytesResumable
  getDownloadURL, // Exporting getDownloadURL
  deleteFileStorage // Exporting deleteFileStorage
};
