
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
        const userDocRef = doc(db, "accounts", firebaseUser.uid); // Changed 'users' to 'accounts'
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const firestoreData = userDocSnap.data() as UserProfile;
          setCurrentUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firestoreData.profileName || firebaseUser.displayName,
            photoURL: firestoreData.photoURL || firebaseUser.photoURL,
            ...firestoreData, 
            role: firestoreData.role || 'player', 
            adminLevel: firestoreData.adminLevel || null,
            kakoShowId: firestoreData.kakoShowId || "",
            kakoLiveId: firestoreData.kakoLiveId || "",
          });
        } else {
          const derivedProfileName = firebaseUser.displayName || 
                                   (firebaseUser.email ? firebaseUser.email.split('@')[0].charAt(0).toUpperCase() + firebaseUser.email.split('@')[0].slice(1) : "Usuário");
          const newProfile: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            profileName: derivedProfileName,
            photoURL: firebaseUser.photoURL,
            role: 'player', 
            adminLevel: null, 
            kakoLiveId: "",
            kakoShowId: "", // Initialize kakoShowId
            bio: '',
            level: 1,
            isVerified: firebaseUser.emailVerified,
            followerCount: 0,
            followingCount: 0,
            photos: [],
            socialLinks: {},
            themePreference: 'system',
            accentColor: '#4285F4', 
            hasCompletedOnboarding: false, 
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
