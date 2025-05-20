
"use client";

import type { User as FirebaseUser } from "firebase/auth";
import { onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import { createContext, useEffect, useState, type ReactNode } from "react";
import { auth, db, doc, getDoc, setDoc, serverTimestamp } from "@/lib/firebase";
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
          const firestoreData = userDocSnap.data() as UserProfile;
          setCurrentUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firestoreData.profileName || firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            ...firestoreData, // This will include role, adminLevel, etc.
            role: firestoreData.role || 'player', // Ensure role has a default
            adminLevel: firestoreData.adminLevel || null, // Ensure adminLevel has a default
          });
        } else {
          // Create a new profile if one doesn't exist (e.g., first Google sign-in)
          const derivedProfileName = firebaseUser.displayName || 
                                   (firebaseUser.email ? firebaseUser.email.split('@')[0].charAt(0).toUpperCase() + firebaseUser.email.split('@')[0].slice(1) : "Usuário");
          const newProfile: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            profileName: derivedProfileName,
            photoURL: firebaseUser.photoURL,
            role: 'player', // Default role
            adminLevel: null, // Default adminLevel
            isVerified: firebaseUser.emailVerified,
            kakoLiveId: '',
            bio: '',
            level: 1,
            followerCount: 0,
            followingCount: 0,
            photos: [],
            socialLinks: {},
            themePreference: 'system',
            accentColor: '#4285F4',
            hasCompletedOnboarding: false, // Start onboarding
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          try {
            await setDoc(userDocRef, newProfile);
            setCurrentUser(newProfile);
          } catch (error) {
            console.error("Error creating Firestore document for new user:", error);
            // Fallback to a basic profile if Firestore write fails
            setCurrentUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              role: 'player',
              adminLevel: null,
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
    setCurrentUser(null);
  };

  const value = {
    currentUser,
    loading,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

