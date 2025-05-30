"use client";

import { ReactNode, useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/components/ui/loading-spinner";

interface ProtectedPageProps {
  children: ReactNode;
  adminRequired?: boolean;
  minAdminLevel?: 'suporte' | 'admin' | 'master';
  redirectTo?: string;
}

export default function ProtectedPage({ 
  children, 
  adminRequired = false, 
  minAdminLevel = 'suporte',
  redirectTo = "/login" 
}: ProtectedPageProps) {
  const { currentUser, loading, isOnboardingComplete } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!loading) {
      // Verificar se o usuário está autenticado
      if (!currentUser) {
        const redirectPath = redirectTo.includes('?') 
          ? `${redirectTo}&redirect=${encodeURIComponent(window.location.pathname)}`
          : `${redirectTo}?redirect=${encodeURIComponent(window.location.pathname)}`;
        router.replace(redirectPath);
        return;
      }

      // Verificar se o cadastro está completo
      if (!isOnboardingComplete(currentUser)) {
        // Determinar para qual etapa do onboarding redirecionar
        if (!currentUser.isVerified) {
          router.replace(`/auth/verify-email-notice?email=${encodeURIComponent(currentUser.email || "")}`);
        } else if (!currentUser.agreedToTermsAt) {
          router.replace("/onboarding/terms");
        } else if (!currentUser.role) {
          router.replace("/onboarding/role-selection");
        } else if (!currentUser.birthDate || !currentUser.gender || !currentUser.country) {
          router.replace("/onboarding/age-verification");
        } else if (!currentUser.phoneNumber || !currentUser.foundUsVia) {
          router.replace("/onboarding/contact-info");
        } else if (currentUser.hasCompletedOnboarding === false) {
          if (currentUser.role === 'host') {
            router.replace("/onboarding/kako-id-input");
          } else {
            router.replace("/onboarding/kako-account-check");
          }
        }
        return;
      }

      // Verificar se o usuário tem permissão de admin quando necessário
      if (adminRequired) {
        const adminLevelMap = {
          'suporte': 1,
          'admin': 2,
          'master': 3
        };
        
        const requiredLevel = adminLevelMap[minAdminLevel];
        const userLevel = currentUser.adminLevel ? adminLevelMap[currentUser.adminLevel as keyof typeof adminLevelMap] || 0 : 0;
        
        if (!currentUser.adminLevel || userLevel < requiredLevel) {
          router.replace("/unauthorized");
          return;
        }
      }

      // Se chegou até aqui, o usuário está autorizado
      setIsAuthorized(true);
      setIsChecking(false);
    }
  }, [loading, currentUser, router, adminRequired, minAdminLevel, redirectTo, isOnboardingComplete]);

  if (loading || isChecking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" message="Verificando permissões..." />
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
} 