
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
import { cn } from "@/lib/utils";

const onboardingStepLabels = ["Termos", "Função", "Dados", "Contato", "Vínculo ID"];

// Local simulated data for fallback (previously more extensive, now just for master admin)
const simulatedKakoProfiles: Array<Partial<KakoProfile> & { id: string, showId: string }> = [
 {
    id: "internalMasterAdminFUID", // Placeholder FUID for the master admin
    nickname: "Sistema (Master Admin ID)",
    showId: "10933200",
    avatarUrl: null,
    level: 99,
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
  const [isLoading, setIsLoading] = useState(false); // For the main continue button
  const [isSearching, setIsSearching] = useState(false); // For the "Buscar Perfil" button
  const [foundKakoProfile, setFoundKakoProfile] = useState<(KakoProfile | (Partial<KakoProfile> & { id: string, showId: string })) | null>(null);
  const [profileSearchAttempted, setProfileSearchAttempted] = useState(false);
  const [showIdInUseError, setShowIdInUseError] = useState<string | null>(null);

  const router = useRouter();
  const { currentUser, loading: authLoading, refreshUserProfile } = useAuth(); // Correctly destructure 'loading' and alias to 'authLoading'
  const { toast } = useToast();

  useEffect(() => {
    if (currentUser?.showId) {
      setUserInputShowId(currentUser.showId);
      // Optionally, trigger a search here if you want to pre-load their Kako profile info
      // handleSearchProfile(currentUser.showId); 
    }
  }, [currentUser?.showId]);


  const handleSearchProfile = async (searchId?: string) => {
    const idToSearch = (searchId || userInputShowId).trim();
    if (!idToSearch) {
      toast({ title: "Atenção", description: "Por favor, insira seu ID de Exibição do Kako Live.", variant: "destructive" });
      return;
    }

    setIsSearching(true);
    setFoundKakoProfile(null);
    setProfileSearchAttempted(true);
    setShowIdInUseError(null);
    console.log("Searching for Show ID:", idToSearch);

    // 1. Check for uniqueness in 'accounts' (unless it's the Master Admin ID)
    if (idToSearch !== "10933200" && currentUser) {
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
          setShowIdInUseError(errorMsg);
          toast({ title: "Show ID em Uso", description: errorMsg, variant: "destructive" });
          setIsSearching(false);
          setFoundKakoProfile(null);
          return;
        }
      } catch (error) {
        console.error("Erro ao verificar unicidade do Show ID:", error);
        toast({ title: "Erro na Verificação", description: "Não foi possível verificar o Show ID. Tente novamente.", variant: "destructive" });
        setIsSearching(false);
        return;
      }
    }

    // 2. Handle Master Admin ID "10933200"
    if (idToSearch === "10933200") {
      const masterAdminSimulatedProfile = simulatedKakoProfiles.find(p => p.showId === "10933200");
      setFoundKakoProfile(masterAdminSimulatedProfile || { id: "internalMasterAdminFUID", nickname: "Master Admin (ID Especial)", showId: "10933200", avatarUrl: null, level: 99 });
      toast({ title: "ID de Master Admin Reconhecido", description: "Este ID concede privilégios de Master Admin." });
      setIsSearching(false);
      return;
    }
    
    // 3. Search in Firestore 'kakoProfiles' by showId
    let profileFromFirestore: KakoProfile | null = null;
    try {
      const profilesRef = collection(db, "kakoProfiles");
      const q = query(profilesRef, where("showId", "==", idToSearch));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const profileDoc = querySnapshot.docs[0];
        const data = profileDoc.data();
        profileFromFirestore = { 
            id: profileDoc.id, // This is the FUID
            nickname: data.nickname,
            avatarUrl: data.avatar || data.avatarUrl || null,
            level: data.level,
            showId: data.showId,
            numId: data.numId,
            gender: data.gender,
            signature: data.signature,
            // lastFetchedAt will be present if it was saved from chat updates
        };
        setFoundKakoProfile(profileFromFirestore);
        toast({ title: "Perfil Encontrado!", description: `Perfil ${profileFromFirestore.nickname} encontrado no banco de dados.` });
      } else {
        // Fallback to local simulated data if not found in Firestore
        const simulated = simulatedKakoProfiles.find(p => p.showId === idToSearch || p.id === idToSearch);
        if (simulated) {
          setFoundKakoProfile(simulated);
          toast({ title: "Perfil Encontrado (Simulado)!", description: `Perfil ${simulated.nickname} encontrado nos dados simulados.` });
        } else {
          setFoundKakoProfile(null);
          toast({ title: "Perfil Não Encontrado", description: `Não foi possível encontrar um perfil com o ID ${idToSearch}.`, variant: "destructive" });
        }
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
    const currentShowId = userInputShowId.trim();
    if (!currentShowId) {
      toast({ title: "Atenção", description: "Por favor, insira seu ID de Exibição do Kako Live.", variant: "destructive" });
      return;
    }
    if (showIdInUseError) {
      toast({ title: "Show ID em Uso", description: showIdInUseError, variant: "destructive" });
      return;
    }
    if (!profileSearchAttempted && currentShowId !== "10933200") {
      toast({ title: "Atenção", description: "Por favor, clique em 'Buscar Perfil' primeiro para verificar seu ID.", variant: "destructive" });
      return;
    }
    if (!foundKakoProfile && currentShowId !== "10933200" && profileSearchAttempted) {
      toast({ title: "Perfil Não Verificado", description: "Não é possível continuar com um ID não encontrado ou não verificado.", variant: "destructive"});
      return;
    }

    setIsLoading(true);
    try {
      const userDocRef = doc(db, "accounts", currentUser.uid);
      
      let profileNameToSave = currentUser.profileName || currentUser.displayName;
      let photoURLToSave = currentUser.photoURL || null;
      let fuidToSave = currentUser.kakoLiveId || "";
      let adminLevelToSet: UserProfile['adminLevel'] = currentUser.adminLevel || null;

      if (currentShowId === "10933200") {
        adminLevelToSet = 'master';
        // Preserve user's chosen name/avatar unless they have none, then use Master Admin defaults
        profileNameToSave = profileNameToSave || "Master Admin";
        // photoURLToSave is already currentUser.photoURL or null
        fuidToSave = foundKakoProfile?.id || "internalMasterAdminFUID"; 
      } else if (foundKakoProfile) {
        profileNameToSave = foundKakoProfile.nickname || profileNameToSave;
        photoURLToSave = foundKakoProfile.avatarUrl || photoURLToSave;
        fuidToSave = foundKakoProfile.id; // This is the FUID from KakoProfile
      } else {
        // No profile found, and not master ID - ensure user has a name
        profileNameToSave = profileNameToSave || deriveProfileNameFromEmail(currentUser.email!);
      }
      
      const dataToUpdate: Partial<UserProfile> = {
        showId: currentShowId,
        profileName: profileNameToSave,
        displayName: profileNameToSave, // Sync displayName with profileName
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
    if (!currentUser || !currentUser.role) return "/onboarding/kako-account-check"; // Fallback
    if (currentUser.role === 'host') return "/onboarding/contact-info";
    return "/onboarding/kako-account-check";
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
            <div className="min-h-[1.25rem] text-center">
              {isSearching ? (
                <p className="text-sm text-muted-foreground">Buscando...</p>
              ) : profileSearchAttempted && foundKakoProfile?.nickname ? (
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
