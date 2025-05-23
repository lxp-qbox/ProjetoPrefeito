
"use client";

import type { User as FirebaseUser } from "firebase/auth";
import { onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import React, { createContext, useEffect, useState, type ReactNode } from "react";
import { auth, db, doc, getDoc, setDoc, serverTimestamp, updateDoc, collection, query, where, getDocs, Timestamp } from "@/lib/firebase"; 
import type { UserProfile, KakoProfile, UserWallet } from "@/types";

interface AuthContextType {
  currentUser: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

function deriveProfileNameFromEmail(email: string | null | undefined): string {
  if (!email) return "Usuário";
  const atIndex = email.indexOf('@');
  if (atIndex !== -1) {
    let profileName = email.substring(0, atIndex);
    profileName = profileName.charAt(0).toUpperCase() + profileName.slice(1);
    return profileName.length > 30 ? profileName.substring(0, 30) : profileName;
  }
  return "Usuário";
}


export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userAccountDocRef = doc(db, "accounts", firebaseUser.uid);
        const userAccountDocSnap = await getDoc(userAccountDocRef);
        let userProfileData: UserProfile;

        if (userAccountDocSnap.exists()) {
          const firestoreData = userAccountDocSnap.data() as Omit<UserProfile, 'uid' | 'email' | 'displayName' | 'photoURL' | 'currentDiamondBalance'>;
          userProfileData = { 
            uid: firebaseUser.uid, 
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            ...firestoreData,
            isVerified: firestoreData.isVerified === undefined ? (firebaseUser.providerData.some(p => p.providerId === "google.com")) : firestoreData.isVerified, // Default to true if Google, else use Firestore or false
            adminLevel: firestoreData.adminLevel || null,
            level: firestoreData.level || 1,
            currentDiamondBalance: 0,
          };
          
          if (userProfileData.showId === "10933200" && userProfileData.adminLevel !== 'master') {
            console.log(`AuthContext: User ${firebaseUser.uid} has showId 10933200. Setting adminLevel to master.`);
            userProfileData.adminLevel = 'master';
            try {
              await updateDoc(userAccountDocRef, { adminLevel: 'master', updatedAt: serverTimestamp() });
            } catch (err) {
              console.error("AuthContext: Error updating adminLevel for master user in Firestore:", err);
            }
          } else if (userProfileData.showId !== "10933200" && userProfileData.adminLevel === 'master') {
            // Optional: Demote if showId is no longer the master ID but adminLevel is still master
            // console.log(`AuthContext: User ${firebaseUser.uid} no longer has master showId but adminLevel is master. Demoting.`);
            // userProfileData.adminLevel = null; // Or their previous non-master level
            // await updateDoc(userAccountDocRef, { adminLevel: null, updatedAt: serverTimestamp() });
          }

          if (userProfileData.showId && userProfileData.showId.trim() !== "") {
            const kakoProfilesRef = collection(db, "kakoProfiles");
            const q = query(kakoProfilesRef, where("showId", "==", userProfileData.showId));
            const kakoProfileQuerySnap = await getDocs(q);

            if (!kakoProfileQuerySnap.empty) {
              const kakoProfileDoc = kakoProfileQuerySnap.docs[0];
              const kakoData = kakoProfileDoc.data() as KakoProfile;
              userProfileData.profileName = kakoData.nickname || userProfileData.profileName;
              userProfileData.photoURL = kakoData.avatarUrl || userProfileData.photoURL;
              userProfileData.level = kakoData.level || userProfileData.level;
              userProfileData.kakoLiveId = kakoProfileDoc.id; 
            }
          }
           userProfileData.profileName = userProfileData.profileName || deriveProfileNameFromEmail(firebaseUser.email!);


        } else {
          const derivedProfileName = deriveProfileNameFromEmail(firebaseUser.email!);
          userProfileData = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            profileName: derivedProfileName,
            displayName: firebaseUser.displayName || derivedProfileName,
            photoURL: firebaseUser.photoURL || null,
            role: null, // Role is set during onboarding
            adminLevel: null,
            showId: "", 
            kakoLiveId: "", 
            level: 1,
            isVerified: firebaseUser.providerData.some(p => p.providerId === "google.com"), // Verified if Google Sign-In
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            hasCompletedOnboarding: false, 
            agreedToTermsAt: null,
            birthDate: null,
            country: null,
            gender: null,
            phoneNumber: null,
            bio: "",
            followerCount:0,
            followingCount:0,
            followingIds: [],
            photos: [],
            socialLinks: null,
            themePreference: 'system',
            accentColor: '#4285F4',
            currentDiamondBalance: 0,
          };
           if (userProfileData.showId === "10933200") { // Check for master ID on new profile (less likely here unless showId is pre-populated)
            userProfileData.adminLevel = 'master';
          }
          await setDoc(userAccountDocRef, userProfileData);
        }

        try {
          const walletDocRef = doc(db, "userWallets", firebaseUser.uid); 
          const walletDocSnap = await getDoc(walletDocRef);
          if (walletDocSnap.exists()) {
            userProfileData.currentDiamondBalance = (walletDocSnap.data() as UserWallet).diamonds || 0;
          } else {
            userProfileData.currentDiamondBalance = 0; 
          }
        } catch (walletError) {
          console.error("Error fetching user wallet:", walletError);
          userProfileData.currentDiamondBalance = 0;
        }
        setCurrentUser(userProfileData);

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
    // Optionally redirect to login page after logout
    // window.location.href = '/login'; 
  };

  const value = {
    currentUser,
    loading,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
