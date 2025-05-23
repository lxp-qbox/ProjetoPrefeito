
"use client";

import type { User as FirebaseUser } from "firebase/auth";
import { onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import React, { createContext, useEffect, useState, type ReactNode, useCallback } from "react";
import { auth, db, doc, getDoc, setDoc, serverTimestamp, updateDoc, collection, query, where, getDocs, Timestamp } from "@/lib/firebase"; 
import type { UserProfile, KakoProfile, UserWallet } from "@/types";

interface AuthContextType {
  currentUser: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
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

  const fetchAndSetUserProfile = useCallback(async (firebaseUser: FirebaseUser | null) => {
    if (firebaseUser) {
      const userAccountDocRef = doc(db, "accounts", firebaseUser.uid);
      let userAccountDocSnap;
      
      try {
        userAccountDocSnap = await getDoc(userAccountDocRef);
      } catch (error) {
        console.error("AuthContext: Error fetching user account document from Firestore:", error);
        setCurrentUser(null);
        setLoading(false);
        return;
      }

      let userProfileData: UserProfile;

      if (userAccountDocSnap.exists()) {
        const firestoreData = userAccountDocSnap.data() as Omit<UserProfile, 'uid' | 'email' | 'displayName' | 'photoURL' | 'currentDiamondBalance'>;
        userProfileData = { 
          uid: firebaseUser.uid, 
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          isVerified: firebaseUser.emailVerified,
          ...firestoreData,
          adminLevel: firestoreData.adminLevel || null,
          currentDiamondBalance: firestoreData.currentDiamondBalance || 0, // Default to 0 from Firestore if not set
          level: firestoreData.level, // Will be overridden by KakoProfile if linked
        };
        
        userProfileData.profileName = firestoreData.profileName || userProfileData.displayName || deriveProfileNameFromEmail(firebaseUser.email!);
        userProfileData.photoURL = firestoreData.photoURL || userProfileData.photoURL;

      } else { 
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
          // level: 1, // Level comes from KakoProfile
          isVerified: firebaseUser.emailVerified,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          hasCompletedOnboarding: false,
          agreedToTermsAt: null,
          birthDate: null,
          country: null,
          gender: null,
          phoneNumber: null,
          currentDiamondBalance: 10000, // Award 10k for brand new account
          hostStatus: null,
          bio: "",
          followerCount: 0,
          followingCount: 0,
          followingIds: [],
          photos: [],
          socialLinks: {},
          themePreference: 'system',
          accentColor: '#4285F4',
          isBanned: false,
          banReason: null,
          bannedBy: null,
          bannedAt: null,
        };
        try {
          await setDoc(userAccountDocRef, userProfileData);
          // Also create wallet with 10k bonus if new account doc is created
          const walletDocRef = doc(db, "userWallets", firebaseUser.uid);
          const newUserWallet: UserWallet = {
            kakoId: "", // Will be updated if linked
            diamonds: 10000,
            lastUpdatedAt: serverTimestamp(),
          };
          await setDoc(walletDocRef, newUserWallet);
          userProfileData.currentDiamondBalance = 10000; // Ensure context has it
        } catch (setDocError) {
          console.error("AuthContext: Error creating user account/wallet document in Firestore:", setDocError);
        }
      }
      
      // Sync isVerified status
      if (userProfileData.isVerified !== firebaseUser.emailVerified) {
          userProfileData.isVerified = firebaseUser.emailVerified;
          try {
              await updateDoc(userAccountDocRef, { isVerified: firebaseUser.emailVerified, updatedAt: serverTimestamp() });
          } catch (err) {
              console.error("AuthContext: Error updating isVerified in Firestore:", err);
          }
      }

      // Force 'master' adminLevel if showId is "10933200"
      if (userProfileData.showId === "10933200" && userProfileData.adminLevel !== 'master') {
        console.log(`AuthContext: User ${firebaseUser.uid} has showId 10933200. Ensuring adminLevel is 'master'.`);
        userProfileData.adminLevel = 'master';
        try {
          await updateDoc(userAccountDocRef, { adminLevel: 'master', updatedAt: serverTimestamp() });
        } catch (err) {
          console.error("AuthContext: Error updating adminLevel for master user in Firestore:", err);
        }
      }
      
      // Enrich with KakoProfile data if showId is present on the account
      if (userProfileData.showId && userProfileData.showId.trim() !== "") {
        try {
          const kakoProfilesRef = collection(db, "kakoProfiles");
          const q = query(kakoProfilesRef, where("showId", "==", userProfileData.showId));
          const kakoProfileQuerySnap = await getDocs(q);

          if (!kakoProfileQuerySnap.empty) {
            const kakoProfileDoc = kakoProfileQuerySnap.docs[0];
            const kakoData = kakoProfileDoc.data() as KakoProfile;

            userProfileData.profileName = kakoData.nickname || userProfileData.profileName;
            userProfileData.photoURL = kakoData.avatarUrl || userProfileData.photoURL;
            userProfileData.level = kakoData.level;
            // If user's account.kakoLiveId (FUID) is empty or different, update it from kakoProfiles.id
            if (userProfileData.kakoLiveId !== kakoProfileDoc.id) {
              userProfileData.kakoLiveId = kakoProfileDoc.id; 
              // Potentially update this in the 'accounts' doc if desired for sync
              // await updateDoc(userAccountDocRef, { kakoLiveId: kakoProfileDoc.id });
            }
          } else {
            // No KakoProfile found for this showId, ensure level is default or from accounts doc
             userProfileData.level = (userAccountDocSnap.exists() ? userAccountDocSnap.data().level : undefined) || 1;
          }
        } catch (kakoError) {
          console.error("AuthContext: Error fetching KakoProfile based on showId:", kakoError);
          userProfileData.level = (userAccountDocSnap.exists() ? userAccountDocSnap.data().level : undefined) || 1;
        }
      } else {
         // No showId on account, ensure level is default or from accounts doc
         userProfileData.level = (userAccountDocSnap.exists() ? userAccountDocSnap.data().level : undefined) || 1;
      }

      // Fetch Wallet Balance if not already set (e.g., for existing users)
      if (userProfileData.currentDiamondBalance === undefined || userProfileData.currentDiamondBalance === 0 && !userAccountDocSnap.exists()) {
        try {
          const walletDocRef = doc(db, "userWallets", firebaseUser.uid); 
          const walletDocSnap = await getDoc(walletDocRef);
          if (walletDocSnap.exists()) {
            userProfileData.currentDiamondBalance = (walletDocSnap.data() as UserWallet).diamonds || 0;
          } else if (!userAccountDocSnap.exists()){ // Only create wallet if account was also new
             // This case handled above for brand new accounts
          } else {
             userProfileData.currentDiamondBalance = 0;
          }
        } catch (walletError) {
          console.error("AuthContext: Error fetching user wallet:", walletError);
          userProfileData.currentDiamondBalance = 0;
        }
      }
      setCurrentUser(userProfileData);

    } else { 
      setCurrentUser(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      fetchAndSetUserProfile(firebaseUser);
    });
    return () => unsubscribe();
  }, [fetchAndSetUserProfile]);

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
      // setCurrentUser(null); // Handled by onAuthStateChanged
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  const refreshUserProfile = useCallback(async () => {
    if (auth.currentUser) {
      setLoading(true); // Indicate loading during refresh
      await auth.currentUser.reload(); // Reload Firebase Auth user state
      await fetchAndSetUserProfile(auth.currentUser); // Re-fetch Firestore profile
      // setLoading(false); // fetchAndSetUserProfile will set loading to false
    }
  }, [fetchAndSetUserProfile]);

  const value = {
    currentUser,
    loading,
    logout,
    refreshUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

    