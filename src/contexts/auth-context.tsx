
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
        let userAccountDocSnap;
        
        try {
          userAccountDocSnap = await getDoc(userAccountDocRef);
        } catch (error) {
          console.error("AuthContext: Error fetching user account document from Firestore:", error);
          setCurrentUser(null); // Or handle as a partial profile if critical data is missing
          setLoading(false);
          return;
        }

        let userProfileData: UserProfile;

        if (userAccountDocSnap.exists()) {
          const firestoreData = userAccountDocSnap.data() as Omit<UserProfile, 'uid' | 'email' | 'displayName' | 'photoURL' | 'currentDiamondBalance'>;
          userProfileData = { 
            uid: firebaseUser.uid, 
            email: firebaseUser.email,
            displayName: firebaseUser.displayName, // From Firebase Auth
            photoURL: firebaseUser.photoURL,     // From Firebase Auth
            isVerified: firebaseUser.emailVerified, // Source of truth from Firebase Auth
            ...firestoreData, // Spread Firestore data, which might have its own profileName, photoURL, etc.
            adminLevel: firestoreData.adminLevel || null,
            level: firestoreData.level || 1, // Default level
            currentDiamondBalance: 0, // Initialize, will be fetched next
          };

          // Ensure profileName and photoURL have fallbacks if not in Firestore
          userProfileData.profileName = firestoreData.profileName || userProfileData.displayName || deriveProfileNameFromEmail(firebaseUser.email!);
          userProfileData.photoURL = firestoreData.photoURL || userProfileData.photoURL;


          // Special handling for Master Admin based on showId
          if (userProfileData.showId === "10933200" && userProfileData.adminLevel !== 'master') {
            console.log(`AuthContext: User ${firebaseUser.uid} has showId 10933200. Setting/Confirming adminLevel to master.`);
            userProfileData.adminLevel = 'master';
            try {
              await updateDoc(userAccountDocRef, { adminLevel: 'master', updatedAt: serverTimestamp() });
            } catch (err) {
              console.error("AuthContext: Error updating adminLevel for master user in Firestore:", err);
            }
          }
          
          // Enrich with KakoProfile data if showId is present
          if (userProfileData.showId && userProfileData.showId.trim() !== "") {
            try {
              const kakoProfilesRef = collection(db, "kakoProfiles");
              const q = query(kakoProfilesRef, where("showId", "==", userProfileData.showId));
              const kakoProfileQuerySnap = await getDocs(q);

              if (!kakoProfileQuerySnap.empty) {
                const kakoProfileDoc = kakoProfileQuerySnap.docs[0];
                const kakoData = kakoProfileDoc.data() as KakoProfile;
                userProfileData.profileName = kakoData.nickname || userProfileData.profileName; // Prefer Kako nickname
                userProfileData.photoURL = kakoData.avatarUrl || userProfileData.photoURL;   // Prefer Kako avatar
                userProfileData.level = kakoData.level || userProfileData.level;             // Prefer Kako level
                userProfileData.kakoLiveId = kakoProfileDoc.id; // Store FUID
              }
            } catch (kakoError) {
              console.error("AuthContext: Error fetching KakoProfile:", kakoError);
            }
          }


        } else { // New user or Firestore document doesn't exist
          const derivedProfileName = deriveProfileNameFromEmail(firebaseUser.email!);
          userProfileData = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            profileName: derivedProfileName,
            displayName: firebaseUser.displayName || derivedProfileName,
            photoURL: firebaseUser.photoURL,
            role: null, 
            adminLevel: null,
            showId: "", 
            kakoLiveId: "", 
            level: 1,
            isVerified: firebaseUser.emailVerified, // Set from Firebase Auth
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            hasCompletedOnboarding: false, 
            agreedToTermsAt: null,
            birthDate: null,
            country: null,
            gender: null,
            phoneNumber: null,
            followerCount: 0,
            followingCount: 0,
            followingIds: [],
            bio: "",
            photos: [],
            socialLinks: {},
            themePreference: 'system',
            accentColor: '#4285F4',
            currentDiamondBalance: 0,
          };
           // Check for Master Admin ID on new profile creation
          if (userProfileData.showId === "10933200") { // Though showId would be empty here unless populated by some other means
            userProfileData.adminLevel = 'master';
          }
          try {
            await setDoc(userAccountDocRef, userProfileData);
          } catch (setDocError) {
            console.error("AuthContext: Error creating user account document in Firestore:", setDocError);
            // Handle error - maybe log out user or show error
          }
        }

        // Sync Firestore isVerified if it's different from Firebase Auth's emailVerified
        if (userProfileData.isVerified !== firebaseUser.emailVerified) {
            console.log(`AuthContext: Syncing isVerified for ${firebaseUser.uid}. Firebase Auth: ${firebaseUser.emailVerified}, Firestore was: ${userProfileData.isVerified}`);
            userProfileData.isVerified = firebaseUser.emailVerified;
            try {
                await updateDoc(userAccountDocRef, { isVerified: firebaseUser.emailVerified, updatedAt: serverTimestamp() });
            } catch (err) {
                console.error("AuthContext: Error updating isVerified in Firestore:", err);
            }
        }

        // Fetch Wallet Balance
        try {
          const walletDocRef = doc(db, "userWallets", firebaseUser.uid); 
          const walletDocSnap = await getDoc(walletDocRef);
          if (walletDocSnap.exists()) {
            userProfileData.currentDiamondBalance = (walletDocSnap.data() as UserWallet).diamonds || 0;
          } else {
            userProfileData.currentDiamondBalance = 0; 
          }
        } catch (walletError) {
          console.error("AuthContext: Error fetching user wallet:", walletError);
          userProfileData.currentDiamondBalance = 0; // Default to 0 on error
        }
        setCurrentUser(userProfileData);

      } else { // No Firebase user
        setCurrentUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
      setCurrentUser(null); // Clear user on logout
    } catch (error) {
      console.error("Error during logout:", error);
      // Optionally show a toast to the user
    }
  };

  const value = {
    currentUser,
    loading,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
