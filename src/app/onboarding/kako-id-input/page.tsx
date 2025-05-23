
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"; // Removed unused Card import
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Fingerprint, Search, CheckCircle, UserCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { db, doc, updateDoc, serverTimestamp, collection, query, where, getDocs } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/ui/loading-spinner";
import Link from "next/link";
import OnboardingStepper from "@/components/onboarding/onboarding-stepper";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { UserProfile, KakoProfile } from "@/types";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

const onboardingStepLabels = ["Termos", "Função", "Dados", "Contato", "Vínculo ID"];

// More comprehensive simulated data, including the master admin ID with a generic FUID
const simulatedKakoProfiles: Array<Partial<KakoProfile> & { id: string; showId: string; }> = [
  {
    id: "0322d2dd57e74a028a9e72c2fae1fd9a", // FUID
    nickname: "PRESIDENTE",
    showId: "10763129",
    avatarUrl: "https://godzilla-live-oss.kako.live/avatar/0322d2dd57e74a028a9e72c2fae1fd9a/20250516/1747436206391.jpg/200x200",
    level: 39,
    signature: "✨The Presidential Agency..."
  },
  {
    id: "b2f7260f233746e19ebac80d31d82908", // FUID
    nickname: "Janyᵃᵍⁿᵉˣᵘˢ✨️",
    showId: "10956360",
    avatarUrl: "https://godzilla-live-oss.kako.live/avatar/b2f7260f233746e19ebac80d31d82908/20250509/1746802335031.jpg/200x200",
    level: 24,
    signature: "Jany's bio here."
  },
  {
    id: "e3a678daf63f4d12b8139704ca8bffaf", // FUID
    nickname: "AGÊNCIA🕊️ᵐᵈ♾️",
    showId: "10171348",
    avatarUrl: "https://godzilla-live-oss.kako.live/avatar/e3a678daf63f4d12b8139704ca8bffaf/20250510/1746909590842.jpg/200x200",
    level: 36,
    signature: "Agencia MD bio."
  },
  { // Simulated entry for Master Admin ID if not found in DB, so it has a name/avatar for display
    id: "internalMasterAdminFUID",
    nickname: "Sistema (Master ID)",
    showId: "10933200",
    avatarUrl: null, // Or a generic admin avatar URL
    level: 99,
    signature: "Conta administrativa mestre."
  },
];

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


export default function KakoIdInputPage() {
  const [userInputShowId, setUserInputShowId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [foundKakoProfile, setFoundKakoProfile] = useState<(KakoProfile | (Partial<KakoProfile> & { id: string; showId: string; })) | null>(null);
  const [profileSearchAttempted, setProfileSearchAttempted] = useState(false);
  const [showIdInUseError, setShowIdInUseError] = useState<string | null>(null);


  const router = useRouter();
  const { currentUser, loading: authLoading, refreshUserProfile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (currentUser?.showId) {
      setUserInputShowId(currentUser.showId);
      // Optionally trigger search if ID exists: handleSearchProfile(currentUser.showId);
    }
  }, [currentUser?.showId]);


  const handleSearchProfile = async (searchIdOverride?: string) => {
    const idToSearch = (searchIdOverride || userInputShowId).trim();
    if (!idToSearch) {
      toast({ title: "Atenção", description: "Por favor, insira seu ID de Exibição do Kako Live.", variant: "destructive" });
      return;
    }

    setIsSearching(true);
    setFoundKakoProfile(null);
    setProfileSearchAttempted(true);
    setShowIdInUseError(null);
    console.log("Buscando Show ID:", idToSearch);

    // 1. Check for uniqueness in 'accounts'
    if (currentUser && idToSearch !== "10933200") { // Master admin ID bypasses this specific check
      try {
        const accountsRef = collection(db, "accounts");
        const q = query(accountsRef, where("showId", "==", idToSearch));
        const querySnapshot = await getDocs(q);
        
        let isTakenByOther = false;
        querySnapshot.forEach((docSnap) => {
          if (docSnap.id !== currentUser.uid) {
            isTakenByOther = true;
          }
        });

        if (isTakenByOther) {
          const errorMsg = "Este Show ID já está vinculado a outra conta.";
          console.error("Erro na busca (Show ID em uso):", errorMsg);
          setShowIdInUseError(errorMsg);
          toast({ title: "Show ID em Uso", description: errorMsg, variant: "destructive" });
          setProfileSearchAttempted(true); // Mark that a search was attempted and failed due to this
          setFoundKakoProfile(null);
          setIsSearching(false);
          return;
        }
      } catch (error) {
        console.error("Erro ao verificar unicidade do Show ID:", error);
        toast({ title: "Erro na Verificação", description: "Não foi possível verificar o Show ID. Tente novamente.", variant: "destructive" });
        setIsSearching(false);
        return;
      }
    }
    
    // 2. Search in Firestore 'kakoProfiles' by showId
    let profileFromSource: (KakoProfile | (Partial<KakoProfile> & { id: string; showId: string; })) | null = null;
    let foundIn = "";

    try {
      const profilesRef = collection(db, "kakoProfiles");
      const qFirestore = query(profilesRef, where("showId", "==", idToSearch));
      const firestoreSnapshot = await getDocs(qFirestore);

      if (!firestoreSnapshot.empty) {
        const profileDoc = firestoreSnapshot.docs[0];
        const data = profileDoc.data();
        profileFromSource = { 
            id: profileDoc.id, // This is the FUID
            nickname: data.nickname,
            avatarUrl: data.avatar || data.avatarUrl || null,
            level: data.level,
            showId: data.showId,
            numId: data.numId,
            gender: data.gender,
            signature: data.signature,
            // lastFetchedAt can be added if present in your KakoProfile type
        } as KakoProfile;
        foundIn = "Banco de Dados (Firestore)";
      } else {
        // Fallback to local simulated data if not found in Firestore
        const simulated = simulatedKakoProfiles.find(p => p.showId === idToSearch || p.id === idToSearch);
        if (simulated) {
          profileFromSource = simulated;
          foundIn = "Simulado";
        }
      }
      
      if (profileFromSource) {
        setFoundKakoProfile(profileFromSource);
        toast({ title: "Perfil Encontrado!", description: `Perfil ${profileFromSource.nickname} encontrado. (${foundIn})` });
      } else {
        setFoundKakoProfile(null);
        toast({ title: "Perfil Não Encontrado", description: `Não foi possível encontrar um perfil com o ID de exibição ${idToSearch}.`, variant: "destructive" });
      }

    } catch (error) {
      console.error("Erro ao buscar perfil Kako:", error);
      setFoundKakoProfile(null);
      toast({ title: "Erro na Busca", description: "Ocorreu um erro ao buscar o perfil.", variant: "destructive" });
    }
    setIsSearching(false);
  };


  const handleContinue = async () => {
    if (!currentUser) {
      toast({ title: "Erro", description: "Você precisa estar logado.", variant: "destructive" });
      router.push("/login");
      return;
    }
    const currentInputShowId = userInputShowId.trim();
    if (!currentInputShowId) {
      toast({ title: "Atenção", description: "Por favor, insira seu ID de Exibição do Kako Live.", variant: "destructive" });
      return;
    }
    if (showIdInUseError) {
         toast({ title: "Show ID em Uso", description: showIdInUseError, variant: "destructive" });
         return;
    }
    // Ensure profile was searched and either found, or it's the master ID
    if (!foundKakoProfile && !isSearching && profileSearchAttempted && currentInputShowId !== "10933200") {
      toast({ title: "Perfil Não Verificado", description: "Por favor, busque um perfil válido ou verifique o ID inserido.", variant: "destructive"});
      return;
    }

    setIsLoading(true);
    try {
      const userDocRef = doc(db, "accounts", currentUser.uid);
      
      let adminLevelToSet: UserProfile['adminLevel'] = currentUser.adminLevel || null;
      let profileNameToSave = currentUser.profileName || currentUser.displayName;
      let photoURLToSave: string | null = currentUser.photoURL || null;
      let fuidToSave = currentUser.kakoLiveId || ""; // FUID from Kako, if already linked

      if (currentInputShowId === "10933200") {
        adminLevelToSet = 'master';
        // For master admin, prioritize existing user name/photo if they exist
        // The 'foundKakoProfile' for "10933200" (from simulated data) provides its FUID
        profileNameToSave = profileNameToSave || (foundKakoProfile?.nickname || "Master Admin"); // Use existing or found (simulated) name
        photoURLToSave = photoURLToSave || (foundKakoProfile?.avatarUrl || null); // Use existing or found (simulated) avatar
        fuidToSave = foundKakoProfile?.id || "internalMasterAdminFUID"; 
      } else if (foundKakoProfile) {
        // For other users, if a KakoProfile was found, update with its details
        profileNameToSave = foundKakoProfile.nickname;
        photoURLToSave = foundKakoProfile.avatarUrl || null;
        fuidToSave = foundKakoProfile.id; // This is the FUID from KakoProfile
      } else {
        // No profile found and not master ID - use app's defaults or existing name
        profileNameToSave = profileNameToSave || deriveProfileNameFromEmail(currentUser.email!);
        // photoURLToSave remains currentUser.photoURL or null
        // fuidToSave remains empty or current value
      }
      
      const dataToUpdate: Partial<UserProfile> = {
        showId: currentInputShowId, // This is the Show ID the user entered
        kakoLiveId: fuidToSave,     // This is the FUID (Kako's internal userId)
        profileName: profileNameToSave,
        displayName: profileNameToSave, 
        photoURL: photoURLToSave,
        adminLevel: adminLevelToSet, 
        hasCompletedOnboarding: true,
        updatedAt: serverTimestamp(),
      };
      
      console.log("Salvando no Firestore 'accounts':", dataToUpdate);
      await updateDoc(userDocRef, dataToUpdate);
      await refreshUserProfile();
      
      toast({
        title: "ID Kako Live Vinculado!",
        description: "Seu onboarding foi concluído.",
      });
      router.push("/profile");

    } catch (error) {
      console.error("Erro ao salvar ID do Kako Live:", error);
      toast({
        title: "Erro ao Salvar",
        description: "Não foi possível salvar seu ID. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const determineBackLink = () => {
    if (!currentUser || !currentUser.role) return "/onboarding/kako-account-check";
    if (currentUser.role === 'host') return "/onboarding/contact-info"; // Hosts go from contact-info to ID input
    return "/onboarding/kako-account-check"; // Players go from account-check to ID input
  };

  if (authLoading && !currentUser) { 
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <>
      <Button
        asChild
        variant="ghost"
        size="icon"
        className="absolute top-4 left-4 z-10 h-12 w-12 rounded-full text-muted-foreground hover:bg-muted hover:text-primary transition-colors"
        title="Voltar"
      >
        <Link href={determineBackLink()}>
          <ArrowLeft className="h-8 w-8" />
          <span className="sr-only">Voltar</span>
        </Link>
      </Button>
      <CardHeader className="h-[200px] flex flex-col justify-center items-center text-center px-6 pb-0">
         <div className="inline-block p-3 bg-primary/10 rounded-full mb-4 mx-auto mt-8">
          <Fingerprint className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-2xl font-bold">Seu ID Kako Live</CardTitle>
        <CardDescription>
          Insira seu ID de Exibição (Show ID) do app Kako Live<br />para vincular sua conta.
        </CardDescription>
      </CardHeader>
      <Separator className="my-6" />
      <CardContent className="flex-grow px-6 pt-0 pb-6 flex flex-col overflow-y-auto">
        <div className="w-full max-w-xs mx-auto space-y-6 my-auto">
          <div className="flex flex-col items-center space-y-2 mb-6">
            <Avatar className="h-24 w-24 border-2 border-primary/30">
              <AvatarImage src={foundKakoProfile?.avatarUrl || undefined} alt={foundKakoProfile?.nickname || "Perfil"} />
              <AvatarFallback>
                {isSearching ? (
                  <LoadingSpinner size="md" />
                ) : foundKakoProfile?.nickname ? (
                  foundKakoProfile.nickname.substring(0, 2).toUpperCase()
                ) : (
                  <UserCircle2 className="h-12 w-12 text-muted-foreground" />
                )}
              </AvatarFallback>
            </Avatar>
             <div className="min-h-[1.5rem] text-center"> {/* Ensure space for name */}
                {isSearching ? (
                    <p className="text-sm text-muted-foreground">Buscando...</p>
                ) : profileSearchAttempted && foundKakoProfile?.nickname ? (
                    <p className="text-sm font-semibold text-primary break-words">{foundKakoProfile.nickname}</p>
                ) : profileSearchAttempted && !foundKakoProfile ? (
                    <p className="text-sm font-semibold text-muted-foreground">Anônimo</p>
                ) : (
                     <p className="text-sm font-semibold text-muted-foreground">Anônimo</p>
                )}
            </div>
          </div>

          <div>
            <Label htmlFor="kakoIdInput" className="text-sm font-medium mb-2 block text-left">
              ID de Exibição Kako (Show ID)
            </Label>
            <div className="flex space-x-2">
              <Input
                id="kakoIdInput"
                placeholder="Ex: 10763129"
                value={userInputShowId}
                onChange={(e) => {
                    setUserInputShowId(e.target.value);
                    setFoundKakoProfile(null); 
                    setProfileSearchAttempted(false);
                    setShowIdInUseError(null);
                }}
                className="flex-grow h-12"
              />
              <Button
                variant="outline"
                onClick={() => handleSearchProfile()}
                disabled={isSearching || !userInputShowId.trim()}
                className="shrink-0 h-12"
              >
                {isSearching ? <LoadingSpinner size="sm" /> : <Search className="h-4 w-4" />}
                <span className="sr-only sm:not-sr-only sm:ml-2">Buscar</span>
              </Button>
            </div>
             {showIdInUseError && (
              <Alert variant="destructive" className="mt-2">
                <AlertTitle>Erro</AlertTitle>
                <AlertDescription>{showIdInUseError}</AlertDescription>
              </Alert>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              Você pode encontrar seu ID de Exibição no seu perfil do aplicativo Kako Live.
            </p>
          </div>
        </div>
        <Button
          onClick={handleContinue}
          className="w-full mt-auto"
          disabled={
            isLoading || 
            isSearching || 
            !userInputShowId.trim() || 
            showIdInUseError !== null ||
            (!foundKakoProfile && profileSearchAttempted && userInputShowId.trim() !== "10933200")
          }
        >
          {isLoading ? (
            <LoadingSpinner size="sm" className="mr-2" />
          ) : (
            <CheckCircle className="mr-2 h-4 w-4" />
          )}
          Continuar e Finalizar
        </Button>
      </CardContent>
      <CardFooter className="p-4 border-t bg-muted">
        <OnboardingStepper steps={onboardingStepLabels} currentStep={5} />
      </CardFooter>
    </>
  );
}
