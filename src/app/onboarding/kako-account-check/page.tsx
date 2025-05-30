"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Card as ChoiceCard } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Phone, ArrowLeft, Smartphone } from "lucide-react";
import Link from "next/link";
import OnboardingStepper from "@/components/onboarding/onboarding-stepper";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/ui/loading-spinner";

const onboardingStepLabels = ["Termos", "Função", "Dados", "Contato", "Vínculo ID"];

export default function KakoAccountCheckPage() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [navigating, setNavigating] = useState(false);

  // Evitar dupla navegação ou recarregamento da página
  useEffect(() => {
    return () => {
      setNavigating(false);
    };
  }, []);

  const handleHasAccount = () => {
    if (isLoading || navigating) return;
    setLoadingAction('hasAccount');
    setIsLoading(true);
    setNavigating(true);
    
    // Adicionar pequeno delay para garantir que a UI mostre o estado de carregamento
    setTimeout(() => {
      router.push("/onboarding/kako-id-input");
    }, 100);
  };

  const handleNavigateToCreationChoice = () => {
    if (isLoading || navigating) return;
    setLoadingAction('needsAccount');
    setIsLoading(true);
    setNavigating(true);
    
    // Adicionar pequeno delay para garantir que a UI mostre o estado de carregamento
    setTimeout(() => {
      router.push("/onboarding/kako-creation-choice");
    }, 100);
  };
  
  return (
    <>
       <Button
            asChild
            variant="ghost"
            size="icon"
            className="absolute top-4 left-4 z-10 h-12 w-12 rounded-full text-muted-foreground hover:bg-muted hover:text-primary transition-colors"
            title="Voltar"
            disabled={isLoading || navigating}
        >
            <Link href="/onboarding/contact-info">
                <ArrowLeft className="h-8 w-8" />
                <span className="sr-only">Voltar</span>
            </Link>
        </Button>
      <CardHeader className="h-[200px] flex flex-col justify-center items-center text-center px-6 pb-0">
        <div className="inline-block p-3 bg-primary/10 rounded-full mb-4 mx-auto mt-8">
          <Smartphone className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-2xl font-bold">Conta Kako Live</CardTitle>
        <CardDescription>
          Você já possui uma conta<br />no aplicativo Kako Live?
        </CardDescription>
      </CardHeader>
      <Separator className="my-6" />
      <CardContent className="flex-grow px-6 pt-6 pb-6 flex flex-col overflow-y-auto">
        <div className="grid grid-cols-1 gap-6 w-full my-auto">
          <ChoiceCard
            className={`p-6 flex flex-col items-center text-center cursor-pointer transition-shadow transform ${(isLoading || navigating) ? '' : 'hover:shadow-lg hover:scale-105'}`}
            onClick={handleHasAccount}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleHasAccount()}
            aria-disabled={isLoading || navigating}
          >
            {isLoading && loadingAction === 'hasAccount' ? (
                <div className="h-[100px] flex items-center justify-center">
                    <LoadingSpinner size="md" />
                </div>
             ) : (
              <>
                <div className="p-3 bg-primary/10 rounded-full mb-3">
                  <CheckCircle className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-1">Sim, já tenho</h3>
                <p className="text-sm text-muted-foreground">
                  Possuo uma conta no Kako Live e sei meu ID
                </p>
              </>
            )}
          </ChoiceCard>

          <ChoiceCard
            className={`p-6 flex flex-col items-center text-center cursor-pointer transition-shadow transform ${(isLoading || navigating) ? '' : 'hover:shadow-lg hover:scale-105'}`}
            onClick={handleNavigateToCreationChoice}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleNavigateToCreationChoice()}
            aria-disabled={isLoading || navigating}
          >
             {isLoading && loadingAction === 'needsAccount' ? (
                <div className="h-[100px] flex items-center justify-center">
                    <LoadingSpinner size="md" />
                </div>
             ) : (
              <>
                <div className="p-3 bg-primary/10 rounded-full mb-3">
                  <Phone className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-1">Não, preciso criar</h3>
                <p className="text-sm text-muted-foreground">
                  Ainda não tenho uma conta no aplicativo Kako Live
                </p>
              </>
            )}
          </ChoiceCard>
        </div>
      </CardContent>
       <CardFooter className="p-4 border-t bg-muted">
        <OnboardingStepper steps={onboardingStepLabels} currentStep={5} />
      </CardFooter>
    </>
  );
}

    