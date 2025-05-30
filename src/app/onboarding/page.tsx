"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from "@/components/ui/card";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { useOnboardingStore } from '@/store/onboarding-store';
import { useAuth } from "@/hooks/use-auth";

/**
 * Página de entrada para o fluxo de onboarding
 * 
 * Esta página verifica o estado de progresso do onboarding
 * e redireciona para a próxima etapa apropriada
 */
export default function OnboardingEntryPage() {
  const router = useRouter();
  const { currentUser, loading: authLoading } = useAuth();
  
  // Obter o estado atual do onboarding
  const { currentStep, completedSteps } = useOnboardingStore(state => ({
    currentStep: state.currentStep,
    completedSteps: state.completedSteps
  }));
  
  // Calcular a próxima etapa com base nos passos já concluídos
  const determineNextStep = () => {
    // Se o usuário já concluiu todas as etapas, direcione para o dashboard
    if (currentUser?.hasCompletedOnboarding) {
      return '/dashboard';
    }
    
    // Verificar cada etapa em ordem e redirecionar para a primeira não concluída
    if (!completedSteps.includes('terms')) {
      return '/onboarding/terms';
    }
    
    if (!completedSteps.includes('role-selection')) {
      return '/onboarding/role-selection';
    }
    
    if (!completedSteps.includes('age-verification')) {
      return '/onboarding/age-verification';
    }
    
    if (!completedSteps.includes('contact-info')) {
      return '/onboarding/contact-info';
    }
    
    // Etapas específicas baseadas no papel do usuário
    if (currentUser?.role === 'host') {
      return '/onboarding/kako-id-input';
    } else {
      return '/onboarding/kako-account-check';
    }
  };
  
  useEffect(() => {
    // Aguardar o carregamento da autenticação para evitar redirecionamentos incorretos
    if (!authLoading) {
      const nextStep = determineNextStep();
      
      // Adicionar pequeno delay para garantir uma transição suave
      const redirectTimer = setTimeout(() => {
        router.push(nextStep);
      }, 100);
      
      return () => clearTimeout(redirectTimer);
    }
  }, [authLoading, router, currentStep, completedSteps, currentUser]);
  
  return (
    <Card className="flex-grow flex items-center justify-center">
      <CardContent>
        <div className="text-center">
          <LoadingSpinner size="lg" className="mb-4" />
          <p className="text-muted-foreground animate-pulse">
            Carregando seu progresso...
          </p>
        </div>
      </CardContent>
    </Card>
  );
} 