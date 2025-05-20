
"use client";

import type { User as FirebaseUser } from "firebase/auth";
import { onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import { createContext, useEffect, useState, type ReactNode } from "react";
import { auth, db, doc, getDoc, setDoc, serverTimestamp } from "@/lib/firebase";
import LoadingSpinner from "@/components/ui/loading-spinner";
import type { UserProfile } from "@/types";

interface AuthContextType {
  currentUser: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const firestoreData = userDocSnap.data() as UserProfile; // Assume UserProfile structure
          setCurrentUser({
            // Explicitly map Firebase Auth properties and then Firestore data
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firestoreData.profileName || firebaseUser.displayName, // Prioritize Firestore profileName
            photoURL: firebaseUser.photoURL, // Use Firebase Auth photoURL as base
            ...firestoreData, // Spread the rest from Firestore, potentially overwriting displayName/photoURL if they exist there
            role: firestoreData.role || 'player', // Ensure role has a default
          });
        } else {
          // User exists in Auth, but not in Firestore. Create a basic profile.
          // This can happen if Firestore doc creation failed during signup or for legacy users.
          const newProfile: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            profileName: firebaseUser.displayName || "", // Initialize profileName
            photoURL: firebaseUser.photoURL,
            role: 'player',
            isVerified: false,
            kakoLiveId: '',
            bio: '',
            level: 1,
            followerCount: 0,
            followingCount: 0,
            photos: [],
            socialLinks: {},
            themePreference: 'system',
            accentColor: '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          try {
            await setDoc(userDocRef, newProfile);
            setCurrentUser(newProfile);
          } catch (error) {
            console.error("Error creating Firestore document for new user:", error);
            // Fallback to a more basic profile if Firestore write fails
            setCurrentUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              role: 'player', // Minimal fallback
            });
          }
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await firebaseSignOut(auth);
    setCurrentUser(null); // Clear the UserProfile object
  };

  const value = {
    currentUser,
    loading,
    logout,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
