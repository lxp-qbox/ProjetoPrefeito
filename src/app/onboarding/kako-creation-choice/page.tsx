"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Card as ChoiceCard } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Smartphone, QrCode, ArrowLeft, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/ui/loading-spinner";
import OnboardingStepper from "@/components/onboarding/onboarding-stepper";

const onboardingStepLabels = ["Termos", "Função", "Dados", "Contato", "Vínculo ID"];

export default function KakoCreationChoicePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [navigating, setNavigating] = useState(false);

  // Limpar estado de navegação no desmonte do componente
  useEffect(() => {
    return () => {
      setNavigating(false);
    };
  }, []);

  const handleMobileChoice = () => {
    if (isLoading || navigating) return;
    setLoadingAction('mobile');
    setIsLoading(true);
    setNavigating(true);
    
    // Adicionar pequeno delay para garantir feedback visual
    setTimeout(() => {
      router.push("/onboarding/kako-download");
    }, 100);
  };

  const handleAgentAssistChoice = () => {
    if (isLoading || navigating) return;
    setLoadingAction('agent');
    setIsLoading(true);
    setNavigating(true);
    
    // Adicionar pequeno delay para garantir feedback visual
    setTimeout(() => {
      router.push("/onboarding/kako-agent-assist");
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
          Como você prefere criar<br />sua conta no Kako Live?
        </CardDescription>
      </CardHeader>
      <Separator className="my-6" />
      <CardContent className="flex-grow px-6 pt-6 pb-6 flex flex-col overflow-y-auto">
        <div className="grid grid-cols-1 gap-6 w-full my-auto">
          <ChoiceCard
            className={`p-6 flex flex-col items-center text-center cursor-pointer transition-shadow transform ${(isLoading || navigating) ? '' : 'hover:shadow-lg hover:scale-105'}`}
            onClick={handleMobileChoice}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleMobileChoice()}
            aria-disabled={isLoading || navigating}
          >
            {isLoading && loadingAction === 'mobile' ? (
                <div className="h-[100px] flex items-center justify-center">
                    <LoadingSpinner size="md" />
                </div>
             ) : (
              <>
                <div className="p-3 bg-primary/10 rounded-full mb-3">
                  <QrCode className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-1">Criar no Celular</h3>
                <p className="text-sm text-muted-foreground">
                  Vou baixar o app no meu celular e criar eu mesmo(a)
                </p>
              </>
            )}
          </ChoiceCard>

          <ChoiceCard
            className={`p-6 flex flex-col items-center text-center cursor-pointer transition-shadow transform ${(isLoading || navigating) ? '' : 'hover:shadow-lg hover:scale-105'}`}
            onClick={handleAgentAssistChoice}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleAgentAssistChoice()}
            aria-disabled={isLoading || navigating}
          >
             {isLoading && loadingAction === 'agent' ? (
                <div className="h-[100px] flex items-center justify-center">
                    <LoadingSpinner size="md" />
                </div>
             ) : (
              <>
                <div className="p-3 bg-primary/10 rounded-full mb-3">
                  <MessageCircle className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-1">Suporte do Agente</h3>
                <p className="text-sm text-muted-foreground">
                  Prefiro que um agente me ajude a criar minha conta
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

    