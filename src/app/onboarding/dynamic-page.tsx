"use client";

import React, { Suspense } from 'react';
import { ONBOARDING_ROUTES } from './routes';
import { useOnboardingStore } from '@/store/onboarding-store';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { ErrorBoundary } from '@/lib/error/error-boundary';

interface DynamicOnboardingPageProps {
  /**
   * Chave da etapa de onboarding a ser renderizada
   */
  step: keyof typeof ONBOARDING_ROUTES;
}

/**
 * Componente de loading para ser exibido enquanto a página está carregando
 */
function PageLoading() {
  return (
    <div className="flex-grow flex items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  );
}

/**
 * Componente que carrega dinamicamente uma página de onboarding usando code splitting
 */
export function DynamicOnboardingPage({ step }: DynamicOnboardingPageProps) {
  // Obter a etapa atual e marcar como etapa atual no estado
  const setCurrentStep = useOnboardingStore(state => state.setCurrentStep);
  
  // Efeito para atualizar a etapa atual no estado
  React.useEffect(() => {
    setCurrentStep(step as any);
  }, [step, setCurrentStep]);
  
  // Obter o componente correspondente à etapa
  const PageComponent = ONBOARDING_ROUTES[step];
  
  if (!PageComponent) {
    return <div>Página não encontrada</div>;
  }
  
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoading />}>
        <PageComponent />
      </Suspense>
    </ErrorBoundary>
  );
} 