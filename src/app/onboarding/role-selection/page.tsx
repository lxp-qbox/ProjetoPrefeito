"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CardContent, CardFooter } from "@/components/ui/card";
import { Users, Gamepad2, Star } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { db, doc, updateDoc, serverTimestamp } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/ui/loading-spinner";
import Link from "next/link";
import type { UserProfile } from "@/types";
import OnboardingStepper from "@/components/onboarding/onboarding-stepper";
import { SectionHeader } from "@/components/onboarding/section-header";
import { BackButton } from "@/components/onboarding/back-button";
import { ChoiceCard } from "@/components/onboarding/choice-card";
import { useOnboardingStore } from "@/store/onboarding-store";
import { ErrorBoundary } from "@/lib/error/error-boundary";
import { logger, withErrorLogging } from "@/lib/error/error-logger";

const onboardingStepLabels = ["Termos", "Função", "Dados", "Contato", "Vínculo ID"];

/**
 * Função assíncrona para salvar a função do usuário
 */
const saveUserRole = withErrorLogging(async (userId: string, role: UserProfile['role']) => {
  const userDocRef = doc(db, "accounts", userId);
  await updateDoc(userDocRef, {
    role: role,
    updatedAt: serverTimestamp(),
  });
}, "Erro ao salvar função do usuário");

function RoleSelectionContent() {
  const router = useRouter();
  const { currentUser, refreshUserProfile } = useAuth();
  const { toast } = useToast();
  
  // Use o estado da store Zustand
  const { 
    role,
    setRole,
    isLoading, 
    isNavigating,
    loadingAction,
    startNavigation,
    resetNavigation,
    setCurrentStep,
    markStepCompleted
  } = useOnboardingStore(state => ({
    role: state.role,
    setRole: state.setRole,
    isLoading: state.isLoading,
    isNavigating: state.isNavigating,
    loadingAction: state.loadingAction,
    startNavigation: state.startNavigation,
    resetNavigation: state.resetNavigation,
    setCurrentStep: state.setCurrentStep,
    markStepCompleted: state.markStepCompleted
  }));

  // Limpar estado de navegação no desmonte do componente
  useEffect(() => {
    // Definir passo atual
    setCurrentStep('role-selection');
    
    return () => {
      resetNavigation();
    };
  }, [resetNavigation, setCurrentStep]);

  const handleRoleSelect = async (selectedRole: UserProfile['role']) => {
    if (isLoading || isNavigating) return; 

    if (!currentUser) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado.",
        variant: "destructive",
      });
      router.push("/login");
      return;
    }
    
    // Armazenar a função selecionada no estado
    setRole(selectedRole);
    
    // Iniciar navegação com ação específica
    startNavigation(selectedRole);
    
    try {
      await saveUserRole(currentUser.uid, selectedRole);
      await refreshUserProfile();
      
      // Marcar etapa como concluída
      markStepCompleted('role-selection');
      
      toast({
        title: "Função Selecionada",
        description: `Sua função foi definida como ${selectedRole === 'host' ? 'Anfitrião' : 'Participante'}.`,
      });
      
      // Adicionar pequeno delay para garantir feedback visual
      setTimeout(() => {
        router.push("/onboarding/age-verification");
      }, 100);
    } catch (error) {
      logger.error("Falha ao processar seleção de função", error instanceof Error ? error : undefined);
      toast({
        title: "Erro ao Salvar",
        description: "Não foi possível salvar sua função. Tente novamente.",
        variant: "destructive",
      });
      resetNavigation();
    }
  };

  return (
    <>
      <BackButton 
        href="/onboarding/terms" 
        disabled={isLoading || isNavigating} 
      />
      
      <SectionHeader
        title="Olá!"
        description={<>Para começar, escolha como você<br />pretende utilizar sua conta:</>}
        icon={Star}
      />
      
      <CardContent className="flex-grow px-6 pt-6 pb-6 flex flex-col overflow-y-auto">
        <div className="grid grid-cols-1 gap-6 w-full my-auto">
          <ChoiceCard
            title="Sou host."
            description="Faço parte da agência do Presidente"
            icon={Users}
            onClick={() => handleRoleSelect('host')}
            isLoading={isLoading && loadingAction === 'host'}
            disabled={isLoading || isNavigating}
          />

          <ChoiceCard
            title="Sou participante."
            description="Quero participar dos jogos"
            icon={Gamepad2}
            onClick={() => handleRoleSelect('player')}
            isLoading={isLoading && loadingAction === 'player'}
            disabled={isLoading || isNavigating}
          />
        </div>
      </CardContent>
      
      <CardFooter className="p-4 border-t bg-muted">
        <OnboardingStepper steps={onboardingStepLabels} currentStep={2} />
      </CardFooter>
    </>
  );
}

export default function RoleSelectionPage() {
  return (
    <ErrorBoundary>
      <RoleSelectionContent />
    </ErrorBoundary>
  );
}

    