"use client";

import React, { Suspense } from "react";
import { Card } from "@/components/ui/card";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { ErrorBoundary } from "@/lib/error/error-boundary";

interface OnboardingLayoutProps {
  children: React.ReactNode;
}

/**
 * Componente de fallback durante o carregamento de páginas
 */
function PageLoadingFallback() {
  return (
    <div className="flex justify-center items-center h-[80vh]">
      <LoadingSpinner size="lg" />
    </div>
  );
}

/**
 * Layout comum para todas as páginas de onboarding
 * Implementa Suspense para code splitting e ErrorBoundary para tratamento de erros
 */
export default function OnboardingLayout({ children }: OnboardingLayoutProps) {
  return (
    <div className="flex min-h-[100vh] flex-col items-center justify-center p-4 md:p-8">
      <Card className="w-full max-w-md mx-auto overflow-hidden flex flex-col min-h-[70vh]">
        <ErrorBoundary>
          <Suspense fallback={<PageLoadingFallback />}>
            {children}
          </Suspense>
        </ErrorBoundary>
      </Card>
    </div>
  );
}
