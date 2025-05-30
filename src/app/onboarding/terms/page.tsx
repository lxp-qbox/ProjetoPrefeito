"use client";

import React, { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { CardContent, CardFooter } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/use-auth";
import { db, doc, updateDoc, serverTimestamp } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { FileText, CheckCircle } from "lucide-react";
import OnboardingStepper from "@/components/onboarding/onboarding-stepper";
import { SectionHeader } from "@/components/onboarding/section-header";
import { ActionButton } from "@/components/onboarding/action-button";
import { useMemoizedSelector } from "@/hooks/use-memoized-selector";
import { useOnboardingStore } from "@/store/onboarding-store";
import { ErrorBoundary } from "@/lib/error/error-boundary";
import { logger, withErrorLogging } from "@/lib/error/error-logger";
import { useSafeEffect } from "@/hooks/use-safe-effect";
import { measurePerformance } from "@/utils/performance";

// Memoizado para evitar recriação em cada renderização
const placeholderTerms = React.memo(() => {
  const termsText = `
Bem-vindo à The Presidential Agency!
Estes termos e condições descrevem as regras e regulamentos para o uso do website da The Presidential Agency.
Ao acessar este website, presumimos que você aceita estes termos e condições na íntegra. Não continue a usar o website da The Presidential Agency se você não aceitar todos os termos e condições declarados nesta página.

Cookies:
O website usa cookies para ajudar a personalizar sua experiência online. Ao usar o website da The Presidential Agency, você concorda com o uso dos cookies necessários.

Licença:
Salvo indicação em contrário, The Presidential Agency e/ou seus licenciadores detêm os direitos de propriedade intelectual de todo o material no The Presidential Agency. Todos os direitos de propriedade intelectual são reservados. Você pode visualizar e/ou imprimir páginas de https://presidential.agency para seu uso pessoal, sujeito às restrições estabelecidas nestes termos e condições.

Você não deve:
Republicar material de https://presidential.agency
Vender, alugar ou sublicenciar material de https://presidential.agency
Reproduzir, duplicar ou copiar material de https://presidential.agency
Redistribuir conteúdo da The Presidential Agency (a menos que o conteúdo seja especificamente feito para redistribuição).

Política de Privacidade:
Nossa Política de Privacidade rege o uso de informações pessoais que coletamos de você ou que você nos fornece. Ao usar nosso website, você concorda com tal processamento e garante que todos os dados fornecidos por você são precisos.

Este é um texto de placeholder. Em uma aplicação real, este seria substituído pelos termos de uso e política de privacidade completos.
É crucial que você leia e entenda nossos termos completos antes de prosseguir.
Obrigado por se juntar à The Presidential Agency! Esperamos que você aproveite nossos serviços.
  `.trim().repeat(3);
  
  return (
    <pre className="whitespace-pre-wrap break-words font-sans">{termsText}</pre>
  );
});

placeholderTerms.displayName = 'PlaceholderTerms';

const onboardingStepLabels = ["Termos", "Função", "Dados", "Contato", "Vínculo ID"];

/**
 * Função assíncrona para salvar o aceite dos termos
 */
const saveTermsAgreement = withErrorLogging(async (userId: string) => {
  const userDocRef = doc(db, "accounts", userId);
  await updateDoc(userDocRef, {
    agreedToTermsAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}, "Erro ao salvar aceite dos termos");

function TermsContent() {
  const router = useRouter();
  const { currentUser, refreshUserProfile } = useAuth();
  const { toast } = useToast();
  
  // Use seletores memoizados para evitar renderizações desnecessárias
  const { agreed, setAgreed } = useMemoizedSelector(state => ({
    agreed: state.agreed,
    setAgreed: state.setAgreed
  }));
  
  const { 
    isLoading, 
    isNavigating,
    startNavigation,
    resetNavigation
  } = useMemoizedSelector(state => ({
    isLoading: state.isLoading,
    isNavigating: state.isNavigating,
    startNavigation: state.startNavigation,
    resetNavigation: state.resetNavigation
  }));
  
  const setCurrentStep = useOnboardingStore(state => state.setCurrentStep);
  const markStepCompleted = useOnboardingStore(state => state.markStepCompleted);
  
  // Limpar estado de navegação no desmonte do componente
  useSafeEffect(() => {
    // Definir passo atual
    setCurrentStep('terms');
    
    return () => {
      resetNavigation();
    };
  }, [resetNavigation, setCurrentStep]);

  // Memoizado para evitar recriação em cada renderização
  const handleContinue = useCallback(async () => {
    if (!currentUser) {
      toast({ title: "Erro", description: "Você precisa estar logado.", variant: "destructive" });
      router.push("/login");
      return;
    }
    if (!agreed) {
      toast({ title: "Atenção", description: "Você precisa concordar com os termos para continuar.", variant: "destructive" });
      return;
    }
    
    if (isLoading || isNavigating) return;

    startNavigation();
    
    try {
      // Medir performance da operação
      await measurePerformance('saveTermsAgreement', async () => {
        await saveTermsAgreement(currentUser.uid);
        await refreshUserProfile();
      });
      
      // Marcar etapa como concluída
      markStepCompleted('terms');
      
      toast({ title: "Termos Aceitos", description: "Obrigado por aceitar os termos." });
      
      // Adicionar pequeno delay para garantir feedback visual
      setTimeout(() => {
        router.push("/onboarding/role-selection");
      }, 100);
    } catch (error) {
      logger.error("Falha ao processar aceite dos termos", error instanceof Error ? error : undefined);
      toast({ title: "Erro ao Salvar", description: "Não foi possível salvar sua concordância. Tente novamente.", variant: "destructive" });
      resetNavigation();
    }
  }, [agreed, currentUser, isLoading, isNavigating, router, markStepCompleted, refreshUserProfile, resetNavigation, startNavigation, toast]);

  // Memoizar elementos do formulário para evitar recriações desnecessárias
  const termsForm = useMemo(() => (
    <>
      <ScrollArea className="w-full rounded-md border p-4 text-sm text-muted-foreground bg-muted h-[300px]">
        <placeholderTerms />
      </ScrollArea>
      <div className="flex justify-center items-center space-x-2 mt-6 mb-4">
        <Checkbox 
          id="terms" 
          checked={agreed} 
          onCheckedChange={(checked) => setAgreed(Boolean(checked))} 
          disabled={isLoading || isNavigating}
        />
        <Label htmlFor="terms" className="text-sm font-normal text-muted-foreground cursor-pointer">
          Li e estou de acordo
        </Label>
      </div>
    </>
  ), [agreed, isLoading, isNavigating, setAgreed]);

  return (
    <>
      <SectionHeader
        title="Termos de Uso e Privacidade"
        description={<>Por favor, leia e aceite nossos termos<br />para continuar.</>}
        icon={FileText}
      />
      
      <CardContent className="flex-grow px-6 pt-0 pb-6 flex flex-col overflow-y-auto">
        {termsForm}
        
        <ActionButton 
          onClick={handleContinue} 
          disabled={!agreed || isLoading || isNavigating}
          isLoading={isLoading}
          icon={CheckCircle}
        >
          Continuar
        </ActionButton>
      </CardContent>
      
      <CardFooter className="p-4 border-t bg-muted">
        <OnboardingStepper steps={onboardingStepLabels} currentStep={1} />
      </CardFooter>
    </>
  );
}

// Componente principal com ErrorBoundary
export default function TermsPage() {
  return (
    <ErrorBoundary>
      <TermsContent />
    </ErrorBoundary>
  );
}

    