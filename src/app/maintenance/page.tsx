"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import LoadingSpinner from "@/components/ui/loading-spinner";

export default function MaintenancePage() {
  const { currentUser, loading, isOnboardingComplete } = useAuth();
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!currentUser) {
        // Usuário não está logado, redirecionar para o login
        router.replace("/login?redirect=" + encodeURIComponent("/maintenance"));
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
      
      setCheckingAuth(false);
    }
  }, [loading, currentUser, router, isOnboardingComplete]);

  if (loading || checkingAuth) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" message="Verificando sua conta..." />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 flex flex-col items-center text-center">
          <Wrench className="h-12 w-12 text-primary mb-2" strokeWidth={1.5} />
          <CardTitle className="text-2xl font-bold">Área em Manutenção</CardTitle>
          <CardDescription>
            Esta área do site está temporariamente indisponível para manutenção. Agradecemos sua compreensão.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="bg-muted p-4 rounded-md text-sm text-muted-foreground">
            <p className="font-medium mb-2">Detalhes:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Nossa equipe está trabalhando para melhorar esta seção</li>
              <li>A manutenção não afeta outras partes do site</li>
              <li>Estamos implementando novos recursos e corrigindo problemas</li>
            </ul>
          </div>
          <Button asChild className="w-full">
            <Link href="/">Voltar para a Página Inicial</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
