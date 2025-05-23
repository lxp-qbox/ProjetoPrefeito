"use client";

import type { User as FirebaseUser } from "firebase/auth";
import { onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import { createContext, useEffect, useState, type ReactNode } from "react";
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
          const firestoreData = userAccountDocSnap.data() as UserProfile;
          userProfileData = { 
            uid: firebaseUser.uid, 
            email: firebaseUser.email,
            displayName: firebaseUser.displayName, // Firebase Auth display name
            photoURL: firebaseUser.photoURL,       // Firebase Auth photo URL
            ...firestoreData,                      // Spread Firestore data, potentially overwriting displayName/photoURL
            adminLevel: firestoreData.adminLevel || null, // Ensure null if undefined/falsy
            level: firestoreData.level || 1, // Default level if not set
            currentDiamondBalance: 0, // Initialize, will be fetched below
          };

          // If showId exists on the account, try to fetch the corresponding KakoProfile
          if (userProfileData.showId && userProfileData.showId.trim() !== "") {
            const kakoProfilesRef = collection(db, "kakoProfiles");
            const q = query(kakoProfilesRef, where("showId", "==", userProfileData.showId));
            const kakoProfileQuerySnap = await getDocs(q);

            if (!kakoProfileQuerySnap.empty) {
              const kakoProfileDoc = kakoProfileQuerySnap.docs[0];
              const kakoData = kakoProfileDoc.data() as KakoProfile;
              
              userProfileData.profileName = kakoData.nickname || userProfileData.profileName; // Prefer Kako nickname
              userProfileData.photoURL = kakoData.avatarUrl || userProfileData.photoURL;       // Prefer Kako avatar
              userProfileData.level = kakoData.level || userProfileData.level;                 // Use Kako level
              userProfileData.kakoLiveId = kakoProfileDoc.id;                                  // Store/update FUID from KakoProfile
            }
          } else {
            // If no showId, ensure profileName uses a sensible default if not set
            userProfileData.profileName = userProfileData.profileName || deriveProfileNameFromEmail(firebaseUser.email);
          }
          
          // Ensure adminLevel is 'master' if showId is "10933200"
          if (userProfileData.showId === "10933200" && userProfileData.adminLevel !== 'master') {
            userProfileData.adminLevel = 'master';
            // Asynchronously update Firestore if there's a mismatch
            updateDoc(userAccountDocRef, { adminLevel: 'master', updatedAt: serverTimestamp() })
              .catch(err => console.error("Error auto-updating adminLevel for master user:", err));
          }

        } else {
          // New user, create basic account document
          const derivedProfileName = deriveProfileNameFromEmail(firebaseUser.email);
          userProfileData = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            profileName: derivedProfileName,
            displayName: firebaseUser.displayName || derivedProfileName,
            photoURL: firebaseUser.photoURL || null,
            role: 'player', 
            adminLevel: null,
            showId: "", 
            kakoLiveId: "", 
            kakoLiveRoomId: "",
            level: 1,
            hostStatus: 'pending_review',
            isVerified: firebaseUser.emailVerified,
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
           if (userProfileData.showId === "10933200") {
            userProfileData.adminLevel = 'master';
          }
          await setDoc(userAccountDocRef, userProfileData);
        }

        // Fetch diamond balance
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
  };

  const value = {
    currentUser,
    loading,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}