
"use client";

import type { User as FirebaseUser } from "firebase/auth";
import { onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import { createContext, useEffect, useState, type ReactNode } from "react";
import { auth, db, doc, getDoc, setDoc, serverTimestamp } from "@/lib/firebase";
// Removed LoadingSpinner import as it's handled by AppContentWrapper now
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
            ...firestoreData,
            role: firestoreData.role || 'player',
          });
        } else {
          const newProfile: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            profileName: firebaseUser.displayName || "",
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
            setCurrentUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              role: 'player',
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

  // AuthProvider now always renders its children wrapped in the context provider.
  // The loading spinner logic is moved to AppContentWrapper.
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
