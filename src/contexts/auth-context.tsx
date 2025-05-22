
"use client";

import type { User as FirebaseUser } from "firebase/auth";
import { onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import { createContext, useEffect, useState, type ReactNode } from "react";
import { auth, db, doc, getDoc, setDoc, serverTimestamp, updateDoc, collection, query, where, getDocs } from "@/lib/firebase"; // Added updateDoc
import type { UserProfile, KakoProfile, UserWallet } from "@/types";

interface AuthContextType {
  currentUser: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

function deriveProfileNameFromEmail(email: string): string {
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
          userProfileData = { uid: firebaseUser.uid, ...userAccountDocSnap.data() } as UserProfile;

          // Set adminLevel based on showId if necessary
          if (userProfileData.showId === "10933200" && userProfileData.adminLevel !== 'master') {
            userProfileData.adminLevel = 'master';
            // Asynchronously update Firestore if there's a mismatch
            updateDoc(userAccountDocRef, { adminLevel: 'master', updatedAt: serverTimestamp() }).catch(err => console.error("Error updating adminLevel for master user:", err));
          }
          
          // Fetch and merge KakoProfile data if showId is present
          if (userProfileData.showId && userProfileData.showId.trim() !== "") {
            const kakoProfilesRef = collection(db, "kakoProfiles");
            const q = query(kakoProfilesRef, where("showId", "==", userProfileData.showId.trim()));
            const kakoProfileQuerySnap = await getDocs(q);

            if (!kakoProfileQuerySnap.empty) {
              const kakoProfileDoc = kakoProfileQuerySnap.docs[0];
              const kakoData = kakoProfileDoc.data() as KakoProfile;
              
              userProfileData.profileName = kakoData.nickname || userProfileData.profileName;
              userProfileData.photoURL = kakoData.avatarUrl || userProfileData.photoURL;
              userProfileData.level = kakoData.level;
              userProfileData.kakoLiveId = kakoProfileDoc.id; 
            } else {
              userProfileData.level = userProfileData.level || 1; 
            }
          } else {
             userProfileData.profileName = userProfileData.profileName || deriveProfileNameFromEmail(firebaseUser.email!);
             userProfileData.photoURL = userProfileData.photoURL || firebaseUser.photoURL;
             userProfileData.level = userProfileData.level || 1;
          }

          // Fetch diamond balance from userWallets
          try {
            const walletDocRef = doc(db, "userWallets", firebaseUser.uid); // Assuming wallet ID is user UID
            const walletDocSnap = await getDoc(walletDocRef);
            if (walletDocSnap.exists()) {
              userProfileData.currentDiamondBalance = (walletDocSnap.data() as UserWallet).diamonds || 0;
            } else {
              userProfileData.currentDiamondBalance = 0; // Default if no wallet found
            }
          } catch (walletError) {
            console.error("Error fetching user wallet:", walletError);
            userProfileData.currentDiamondBalance = 0; // Default on error
          }


          setCurrentUser(userProfileData);

        } else {
          // New user, create basic account document
          const derivedProfileName = deriveProfileNameFromEmail(firebaseUser.email!);
          const newProfile: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            profileName: derivedProfileName,
            displayName: firebaseUser.displayName || derivedProfileName,
            photoURL: firebaseUser.photoURL,
            role: 'player',
            adminLevel: null,
            showId: "", 
            kakoLiveId: "", 
            kakoLiveRoomId: "",
            level: 1,
            hostStatus: 'pending_review',
            isVerified: firebaseUser.emailVerified,
            hasCompletedOnboarding: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            agreedToTermsAt: null,
            birthDate: "",
            country: "",
            gender: undefined,
            phoneNumber: "",
            bio: "",
            followerCount:0,
            followingCount:0,
            currentDiamondBalance: 0,
          };
          // Special check for master admin ID during initial profile creation
          if (newProfile.showId === "10933200") { // Though showId is empty here, good to keep this pattern
            newProfile.adminLevel = 'master';
          }
          await setDoc(userAccountDocRef, newProfile);
          setCurrentUser(newProfile);
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
