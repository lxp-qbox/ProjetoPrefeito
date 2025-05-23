
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
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

const onboardingStepLabels = ["Termos", "Função", "Dados", "Contato", "Vínculo ID"];

// Simulated Kako Profiles - In a real scenario, this would be a Firestore call if not already cached
const simulatedKakoProfiles: Array<Partial<KakoProfile> & { id: string }> = [
  {
    id: "0322d2dd57e74a028a9e72c2fae1fd9a", // FUID
    nickname: "PRESIDENTE",
    showId: "10763129",
    avatarUrl: "https://godzilla-live-oss.kako.live/avatar/0322d2dd57e74a028a9e72c2fae1fd9a/20250516/1747436206391.jpg/200x200",
    level: 39,
    signature: "✨The Presidential Agency...",
    roomId: "67b9ed5fa4e716a084a23765",
  },
  {
    id: "b2f7260f233746e19ebac80d31d82908", // FUID
    nickname: "Janyᵃᵍⁿᵉˣᵘˢ✨️",
    showId: "10956360",
    avatarUrl: "https://godzilla-live-oss.kako.live/avatar/b2f7260f233746e19ebac80d31d82908/20250509/1746802335031.jpg/200x200",
    level: 24,
  },
  {
    id: "internalMasterAdminFUID", // Placeholder FUID for Master Admin
    nickname: "Sistema (Master Admin ID)",
    showId: "10933200",
    avatarUrl: null, // Or a generic admin icon URL
    level: 99,
  },
];


export default function KakoIdInputPage() {
  const [userInputShowId, setUserInputShowId] = useState(""); 
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [foundKakoProfile, setFoundKakoProfile] = useState<(KakoProfile | (Partial<KakoProfile> & { id: string })) | null>(null);
  const [profileSearchAttempted, setProfileSearchAttempted] = useState(false);
  const [showIdInUseError, setShowIdInUseError] = useState<string | null>(null);

  const router = useRouter();
  const { currentUser, refreshUserProfile } = useAuth();
  const { toast } = useToast();

  const deriveProfileNameFromEmail = (email: string): string => {
    if (!email) return "Usuário";
    const atIndex = email.indexOf('@');
    if (atIndex !== -1) {
      let profileName = email.substring(0, atIndex);
      profileName = profileName.charAt(0).toUpperCase() + profileName.slice(1);
      return profileName.length > 30 ? profileName.substring(0, 30) : profileName;
    }
    return "Usuário";
  };

  const handleSearchProfile = async () => {
    if (!userInputShowId.trim()) {
      toast({ title: "Atenção", description: "Por favor, insira seu ID de Exibição do Kako Live.", variant: "destructive" });
      return;
    }
    setIsSearching(true);
    setFoundKakoProfile(null);
    setProfileSearchAttempted(true);
    setShowIdInUseError(null);
    console.log("Searching for Show ID:", userInputShowId.trim());

    const currentInputShowId = userInputShowId.trim();

    if (currentInputShowId !== "10933200" && currentUser) {
      try {
        const accountsRef = collection(db, "accounts");
        const q = query(accountsRef, where("showId", "==", currentInputShowId));
        const querySnapshot = await getDocs(q);
        
        let isTakenByOther = false;
        querySnapshot.forEach((docSnap) => {
          if (docSnap.id !== currentUser.uid) {
            isTakenByOther = true;
          }
        });

        if (isTakenByOther) {
          const errorMsg = "Este Show ID já está vinculado a outra conta.";
          setShowIdInUseError(errorMsg);
          toast({ title: "Show ID em Uso", description: errorMsg, variant: "destructive" });
          setIsSearching(false);
          setFoundKakoProfile(null); // Explicitly nullify if error
          return;
        }
      } catch (error) {
        console.error("Erro ao verificar unicidade do Show ID:", error);
        toast({ title: "Erro na Verificação", description: "Não foi possível verificar o Show ID. Tente novamente.", variant: "destructive" });
        setIsSearching(false);
        return;
      }
    }
    
    // Search in Firestore 'kakoProfiles'
    let profileFromFirestore: KakoProfile | null = null;
    try {
      console.log("Querying Firestore kakoProfiles for showId:", currentInputShowId);
      const profilesRef = collection(db, "kakoProfiles");
      const q = query(profilesRef, where("showId", "==", currentInputShowId));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const profileDoc = querySnapshot.docs[0];
        const data = profileDoc.data();
        profileFromFirestore = { 
            id: profileDoc.id, // FUID
            nickname: data.nickname,
            avatarUrl: data.avatarUrl || data.avatar || null, // Prioritize avatarUrl, then avatar
            level: data.level,
            showId: data.showId,
            numId: data.numId,
            gender: data.gender,
            signature: data.signature,
        };
        console.log("Profile found in Firestore:", profileFromFirestore);
        setFoundKakoProfile(profileFromFirestore);
        toast({ title: "Perfil Encontrado!", description: `Perfil ${profileFromFirestore.nickname} encontrado no banco de dados.` });
      } else {
        console.log("No profile found in Firestore for showId:", currentInputShowId);
      }
    } catch (error) {
      console.error("Erro ao buscar perfil Kako no Firestore:", error);
      // Don't toast yet, will fall back to simulated
    }

    // Fallback to local simulated data if not found in Firestore
    if (!profileFromFirestore) {
      const simulated = simulatedKakoProfiles.find(
        (p) => p.showId === currentInputShowId || p.id === currentInputShowId || (p.numId && p.numId.toString() === currentInputShowId)
      );
      if (simulated) {
        console.log("Profile found in local simulation:", simulated);
        setFoundKakoProfile(simulated);
        toast({ title: "Perfil Encontrado (Simulado)!", description: `Perfil ${simulated.nickname} encontrado nos dados simulados.` });
      }
    }

    if (!profileFromFirestore && !simulatedKakoProfiles.find(p => p.showId === currentInputShowId || p.id === currentInputShowId)) {
      console.log("Profile not found in Firestore or simulation for:", currentInputShowId);
      setFoundKakoProfile(null); // Ensure it's null if nothing found
      toast({ title: "Perfil Não Encontrado", description: `Não foi possível encontrar um perfil com o ID ${currentInputShowId}.`, variant: "destructive" });
    }
    
    setIsSearching(false);
  };

  const handleContinue = async () => {
    if (!currentUser) {
      toast({ title: "Erro", description: "Você precisa estar logado.", variant: "destructive" });
      router.push("/login");
      return;
    }
    if (!userInputShowId.trim()) {
      toast({ title: "Atenção", description: "Por favor, insira e busque seu ID de Exibição do Kako Live.", variant: "destructive" });
      return;
    }
    if (showIdInUseError) {
      toast({ title: "Show ID em Uso", description: showIdInUseError, variant: "destructive" });
      return;
    }
     if (!profileSearchAttempted && userInputShowId.trim() !== "10933200") {
      toast({ title: "Atenção", description: "Por favor, clique em 'Buscar Perfil' primeiro para verificar seu ID.", variant: "destructive" });
      return;
    }
    if (!foundKakoProfile && userInputShowId.trim() !== "10933200" && profileSearchAttempted) {
      toast({ title: "Perfil Não Verificado", description: "Não é possível continuar sem um perfil Kako Live encontrado e verificado, ou use o ID de Master Admin.", variant: "destructive"});
      return;
    }

    setIsLoading(true);
    try {
      const userDocRef = doc(db, "accounts", currentUser.uid);
      
      let adminLevelToSet: UserProfile['adminLevel'] = currentUser.adminLevel || null;
      let profileNameToSave = currentUser.profileName || currentUser.displayName;
      let photoURLToSave = currentUser.photoURL || null;
      let fuidToSave = currentUser.kakoLiveId || "";

      if (userInputShowId.trim() === "10933200") {
        adminLevelToSet = 'master';
        profileNameToSave = profileNameToSave || "Master Admin"; 
        // photoURLToSave remains currentUser.photoURL
        fuidToSave = foundKakoProfile?.id || "internalMasterAdminFUID"; 
      } else if (foundKakoProfile) {
        profileNameToSave = foundKakoProfile.nickname || profileNameToSave; // Prioritize found profile name
        photoURLToSave = foundKakoProfile.avatarUrl || photoURLToSave; // Prioritize found avatar
        fuidToSave = foundKakoProfile.id; // This is the FUID from KakoProfile
      } else {
         profileNameToSave = profileNameToSave || deriveProfileNameFromEmail(currentUser.email!);
      }
      
      const dataToUpdate: Partial<UserProfile> = {
        showId: userInputShowId.trim(),
        profileName: profileNameToSave,
        displayName: profileNameToSave,
        photoURL: photoURLToSave,
        kakoLiveId: fuidToSave, 
        adminLevel: adminLevelToSet, 
        hasCompletedOnboarding: true,
        updatedAt: serverTimestamp(),
      };
      
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
    if (currentUser.role === 'host') return "/onboarding/contact-info"; // Host goes from contact to ID input
    return "/onboarding/kako-account-check"; // Player goes from account check to ID input
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
          Insira seu ID de Exibição (Show ID) do app Kako Live<br />para continuar.
        </CardDescription>
      </CardHeader>
      <Separator className="my-6" />
      <CardContent className="flex-grow px-6 pt-0 pb-6 flex flex-col overflow-y-auto">
        <div className="w-full max-w-xs mx-auto space-y-6 my-auto">
          <div className="flex flex-col items-center space-y-2 mb-6">
            <Avatar className="h-24 w-24 border-2 border-primary/30">
               <AvatarImage src={foundKakoProfile?.avatarUrl || undefined} alt={foundKakoProfile?.nickname || "Perfil"} />
              <AvatarFallback>
                {isSearching ? <LoadingSpinner size="md" /> : (foundKakoProfile?.nickname ? foundKakoProfile.nickname.substring(0, 2).toUpperCase() : <UserCircle2 className="h-12 w-12 text-muted-foreground" />)}
              </AvatarFallback>
            </Avatar>
             <div className="text-center min-h-[1.25rem]"> {/* Approx height of text-sm */}
              {isSearching ? (
                <p className="text-sm text-muted-foreground">Buscando...</p>
              ) : foundKakoProfile?.nickname ? (
                <p className="text-sm font-semibold text-primary break-words">{foundKakoProfile.nickname}</p>
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
                onClick={handleSearchProfile}
                disabled={isSearching || !userInputShowId.trim()}
                className="shrink-0 h-12"
              >
                {isSearching ? <LoadingSpinner size="sm" /> : <Search className="h-4 w-4" />}
                <span className="sr-only sm:not-sr-only sm:ml-2">Buscar Perfil</span>
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

    