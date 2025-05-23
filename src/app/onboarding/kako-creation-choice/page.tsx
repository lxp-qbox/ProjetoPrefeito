
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Card as ChoiceCard } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Smartphone, ArrowLeft, DownloadCloud, XCircle, ExternalLink } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { db, doc, updateDoc, serverTimestamp } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/ui/loading-spinner";
import Link from "next/link";
import OnboardingStepper from "@/components/onboarding/onboarding-stepper";

const onboardingStepLabels = ["Termos", "Função", "Dados", "Contato", "Vínculo ID"];

export default function KakoCreationChoicePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const router = useRouter();
  const { currentUser, refreshUserProfile } = useAuth();
  const { toast } = useToast();

  const handleCompleteOnboardingWithoutId = async () => {
    if (!currentUser) {
      toast({ title: "Erro", description: "Você precisa estar logado.", variant: "destructive" });
      router.push("/login");
      return;
    }
    setLoadingAction('completeWithoutId');
    setIsLoading(true);
    try {
      const userDocRef = doc(db, "accounts", currentUser.uid);
      await updateDoc(userDocRef, {
        showId: "", // Explicitly empty if skipping
        kakoLiveId: "", // Explicitly empty
        hasCompletedOnboarding: true,
        updatedAt: serverTimestamp(),
      });
      await refreshUserProfile();
      toast({
        title: "Onboarding Concluído!",
        description: "Você pode explorar o aplicativo. Vincule seu ID Kako Live mais tarde no seu perfil, se desejar.",
        duration: 7000,
      });
      router.push("/profile");
    } catch (error) {
      console.error("Erro ao finalizar onboarding (completeWithoutId):", error);
      toast({ title: "Erro", description: "Não foi possível finalizar o onboarding. Tente novamente.", variant: "destructive" });
    } finally {
      setIsLoading(false);
      setLoadingAction(null);
    }
  };

  const handleProceedToIdInputAfterCreation = () => {
    if (isLoading) return;
    setLoadingAction('proceedToIdInput');
    setIsLoading(true); 
    router.push("/onboarding/kako-id-input");
  };


  return (
    <>
       <Button
            asChild
            variant="ghost"
            size="icon"
            className="absolute top-4 left-4 z-10 h-12 w-12 rounded-full text-muted-foreground hover:bg-muted hover:text-primary transition-colors"
            title="Voltar"
        >
            <Link href="/onboarding/kako-account-check">
                <ArrowLeft className="h-8 w-8" />
                <span className="sr-only">Voltar</span>
            </Link>
        </Button>
      <CardHeader className="h-[200px] flex flex-col justify-center items-center text-center px-6 pb-0">
        <div className="inline-block p-3 bg-primary/10 rounded-full mb-4 mx-auto mt-8">
          <Smartphone className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-2xl font-bold">Criar Conta Kako Live</CardTitle>
        <CardDescription>
          Você indicou que não tem uma conta Kako Live.<br />O que gostaria de fazer?
        </CardDescription>
      </CardHeader>
      <Separator className="my-6" />
      <CardContent className="flex-grow px-6 pt-0 pb-6 flex flex-col overflow-y-auto">
          <ChoiceCard className="shadow-md border-primary/20 mb-6">
            <CardHeader className="flex-row items-center space-x-3 pb-3 pt-4">
              <div className="p-2 bg-primary/10 rounded-full">
                <DownloadCloud className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-lg font-semibold">Baixar Aplicativo Kako Live</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-3">
              <p>
                Entre no site do Kako Live e baixe o aplicativo de acordo com a versão do seu celular. Após criar sua conta, volte aqui e informe seu ID.
              </p>
              <Button variant="link" asChild className="p-0 h-auto text-primary no-underline hover:underline">
                <a href="https://www.kako.live/index.html" target="_blank" rel="noopener noreferrer">
                  Acessar kako.live <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              </Button>
            </CardContent>
          </ChoiceCard>

          <div className="mt-auto pt-4 space-y-4">
            <Button
              onClick={handleProceedToIdInputAfterCreation}
              className="w-full"
              disabled={isLoading && loadingAction !== 'proceedToIdInput'}
            >
              {isLoading && loadingAction === 'proceedToIdInput' ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : null}
              Já baixei e criei minha conta
            </Button>
            <Button
              variant="outline"
              onClick={handleCompleteOnboardingWithoutId}
              className="w-full"
              disabled={isLoading && loadingAction !== 'completeWithoutId'}
            >
              {isLoading && loadingAction === 'completeWithoutId' ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : null}
              Prosseguir sem vincular ID Kako
            </Button>
          </div>
      </CardContent>
       <CardFooter className="p-4 border-t bg-muted">
        <OnboardingStepper steps={onboardingStepLabels} currentStep={5} />
      </CardFooter>
    </>
  );
}

    