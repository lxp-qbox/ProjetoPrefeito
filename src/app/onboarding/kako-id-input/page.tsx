
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

const onboardingStepLabels = ["Verificar Email", "Termos", "Função", "Dados", "Vínculo ID"];

interface SimulatedKakoProfile extends Pick<KakoProfile, 'id' | 'nickname' | 'showId' | 'numId' | 'avatarUrl' | 'level' | 'signature' | 'roomId'> {}

const simulatedKakoProfiles: SimulatedKakoProfile[] = [
  {
    id: "0322d2dd57e74a028a9e72c2fae1fd9a",
    nickname: "PRESIDENTE",
    showId: "10763129",
    numId: 1008850234,
    avatarUrl: "https://godzilla-live-oss.kako.live/avatar/0322d2dd57e74a028a9e72c2fae1fd9a/20250516/1747436206391.jpg/200x200",
    level: 39,
    signature: "✨The Presidential Agency...",
    roomId: "67b9ed5fa4e716a084a23765",
  },
  {
    id: "e3a678daf63f4d12b8139704ca8bffaf",
    nickname: "AGÊNCIA🕊️ᵐᵈ♾️",
    showId: "10171348",
    numId: 1000686957,
    avatarUrl: "https://godzilla-live-oss.kako.live/avatar/e3a678daf63f4d12b8139704ca8bffaf/20250510/1746909590842.jpg/200x200",
    level: 36,
    signature: "Bio da Agência MD",
  },
  {
    id: "internalMasterAdminFUID", // Placeholder FUID for the master admin Show ID
    nickname: "Sistema (Master Admin ID)",
    showId: "10933200",
    avatarUrl: "https://placehold.co/96x96.png?text=ADM", // Generic admin avatar
    level: 99,
    signature: "Conta administrativa principal."
  },
];


export default function KakoIdInputPage() {
  const [userInputShowId, setUserInputShowId] = useState(""); 
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [foundKakoProfile, setFoundKakoProfile] = useState<KakoProfile | null>(null);
  const [profileSearchAttempted, setProfileSearchAttempted] = useState(false);
  const [showIdInUseError, setShowIdInUseError] = useState<string | null>(null);

  const router = useRouter();
  const { currentUser, loading: authLoading } = useAuth();
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

    const trimmedShowId = userInputShowId.trim();

    // 1. Check for uniqueness in 'accounts' collection (unless it's the master ID)
    if (trimmedShowId !== "10933200" && currentUser) {
      try {
        const accountsRef = collection(db, "accounts");
        const q = query(accountsRef, where("showId", "==", trimmedShowId));
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
          setProfileFound(false);
          return;
        }
      } catch (error) {
        console.error("Erro ao verificar unicidade do Show ID:", error);
        toast({ title: "Erro na Verificação", description: "Não foi possível verificar o Show ID. Tente novamente.", variant: "destructive" });
        setIsSearching(false);
        return;
      }
    }
    
    // 2. Search in 'kakoProfiles' (Firestore)
    let profileData: KakoProfile | null = null;
    try {
      const profilesRef = collection(db, "kakoProfiles");
      const q = query(profilesRef, where("showId", "==", trimmedShowId));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const profileDoc = querySnapshot.docs[0];
        const data = profileDoc.data();
        profileData = { 
            id: profileDoc.id, // This is the FUID
            nickname: data.nickname,
            avatarUrl: data.avatar || data.avatarUrl,
            level: data.level,
            showId: data.showId,
            numId: data.numId,
            gender: data.gender,
            signature: data.signature,
            // Add other KakoProfile fields if needed
        };
        setFoundKakoProfile(profileData);
        setProfileFound(true);
        toast({ title: "Perfil Encontrado!", description: `Perfil ${profileData.nickname} encontrado no banco de dados.` });
      }
    } catch (error) {
      console.error("Erro ao buscar perfil Kako no Firestore:", error);
      // Don't show toast yet, fallback to simulated data
    }

    // 3. Fallback to local simulated data if not found in Firestore
    if (!profileData) {
      const simulated = simulatedKakoProfiles.find(
        (p) => p.showId === trimmedShowId || p.id === trimmedShowId || (p.numId && p.numId.toString() === trimmedShowId)
      );
      if (simulated) {
        profileData = { ...simulated, avatarUrl: simulated.avatarUrl || null }; // Ensure avatarUrl can be null
        setFoundKakoProfile(profileData);
        setProfileFound(true);
        toast({ title: "Perfil Encontrado (Simulado)!", description: `Perfil ${profileData.nickname} encontrado nos dados simulados.` });
      }
    }

    if (!profileData) {
      setProfileFound(false); // Explicitly set to false if no profile found anywhere
      toast({ title: "Perfil Não Encontrado", description: `Não foi possível encontrar um perfil com o ID ${trimmedShowId}.`, variant: "destructive" });
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
        // For master admin, prioritize existing user name/photo, fallback to "Master Admin" if none
        profileNameToSave = profileNameToSave || "Master Admin";
        // photoURLToSave remains as is (user's existing or null)
        fuidToSave = foundKakoProfile?.id || "internalMasterAdminFUID"; // Use FUID if one is associated with 10933200 in kakoProfiles/simulated
      } else if (foundKakoProfile) {
        profileNameToSave = foundKakoProfile.nickname;
        photoURLToSave = foundKakoProfile.avatarUrl || null;
        fuidToSave = foundKakoProfile.id; // This is the FUID from KakoProfile
      } else {
         // No Kako profile found, and not master ID - keep existing app profile name/photo
         profileNameToSave = profileNameToSave || deriveProfileNameFromEmail(currentUser.email!);
         // photoURLToSave and fuidToSave remain as initialized from currentUser or empty
      }
      
      const dataToUpdate: Partial<UserProfile> = {
        showId: userInputShowId.trim(),
        kakoLiveId: fuidToSave,
        profileName: profileNameToSave,
        photoURL: photoURLToSave,
        adminLevel: adminLevelToSet, 
        hasCompletedOnboarding: true,
        updatedAt: serverTimestamp(),
      };
      
      await updateDoc(userDocRef, dataToUpdate);
      
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
    if (currentUser.role === 'host') return "/onboarding/age-verification";
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
        <CardTitle className="text-2xl font-bold">Seu ID de Exibição Kako</CardTitle>
        <CardDescription>
          Insira seu ID de Exibição (Show ID) do app Kako Live<br />para continuar.
        </CardDescription>
      </CardHeader>
      <Separator className="my-6" />
      <CardContent className="flex-grow px-6 pt-0 pb-6 flex flex-col overflow-y-auto">
        <div className="w-full max-w-xs mx-auto space-y-6 my-auto">
          <div className="flex flex-col items-center space-y-2 mb-6">
            <Avatar className="h-24 w-24 border-2 border-primary/30">
               <AvatarImage src={foundKakoProfile?.avatarUrl || undefined} alt={foundKakoProfile?.nickname || "Perfil"} data-ai-hint="user avatar" />
              <AvatarFallback>
                {foundKakoProfile?.nickname ? (
                  foundKakoProfile.nickname.substring(0, 2).toUpperCase()
                ) : (
                  <UserCircle2 className="h-12 w-12 text-muted-foreground" />
                )}
              </AvatarFallback>
            </Avatar>
             <div className="text-center min-h-[20px]"> {/* Ensure consistent height */}
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

