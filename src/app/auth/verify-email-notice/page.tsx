
"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { MailCheck, ArrowLeft, RotateCw, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { auth } from "@/lib/firebase"; 
import { sendEmailVerification } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/ui/loading-spinner";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import type { UserProfile } from "@/types";
import OnboardingStepper from "@/components/onboarding/onboarding-stepper";
import { Progress } from "@/components/ui/progress"; // Added Progress import

const onboardingStepLabels = ["Verificar Email", "Termos", "Função", "Dados", "Vínculo ID"];


function VerifyEmailNoticeContent() {
  const [isLoadingResend, setIsLoadingResend] = useState(false);
  const [isLoadingCheck, setIsLoadingCheck] = useState(false);
  const searchParams = useSearchParams();
  const emailForDisplay = searchParams.get("email");
  const router = useRouter();
  const { toast } = useToast();
  const { currentUser: appUser, loading: authLoading, logout } = useAuth();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (auth.currentUser && auth.currentUser.emailVerified && appUser) {
      toast({ title: "Email já verificado!", description: "Prosseguindo..." });
      // Re-use the redirection logic from login form
      if (!appUser.agreedToTermsAt) router.replace("/onboarding/terms");
      else if (!appUser.role) router.replace("/onboarding/role-selection");
      else if (!appUser.birthDate || !appUser.gender || !appUser.country || !appUser.phoneNumber) router.replace("/onboarding/age-verification");
      else if (appUser.hasCompletedOnboarding === false || typeof appUser.hasCompletedOnboarding === 'undefined') {
        if (appUser.role === 'host') router.replace("/onboarding/kako-id-input");
        else if (appUser.role === 'player') router.replace("/onboarding/kako-account-check");
        else router.replace("/profile");
      }
      else router.replace("/profile");
    }
  }, [appUser, router, toast]);

  const handleResendVerificationEmail = async () => {
    if (!auth.currentUser) {
      toast({ title: "Erro", description: "Nenhum usuário logado para reenviar verificação.", variant: "destructive" });
      return;
    }
    setIsLoadingResend(true);
    try {
      await sendEmailVerification(auth.currentUser);
      toast({ title: "Email Reenviado", description: "Um novo link de verificação foi enviado para seu email." });
    } catch (error: any) {
      console.error("Erro ao reenviar email:", error);
      toast({ title: "Falha ao Reenviar", description: error.message || "Não foi possível reenviar o email.", variant: "destructive" });
    } finally {
      setIsLoadingResend(false);
    }
  };

  const handleCheckVerificationStatus = async () => {
    if (!auth.currentUser) {
      toast({ title: "Erro", description: "Nenhum usuário logado para verificar.", variant: "destructive" });
      return;
    }
    setIsLoadingCheck(true);
    try {
      await auth.currentUser.reload(); 
      if (auth.currentUser.emailVerified) {
        toast({ title: "Email Verificado!", description: "Seu email foi verificado com sucesso. Prosseguindo..." });
        router.replace("/login?verified=true"); 
      } else {
        toast({ title: "Email Ainda Não Verificado", description: "Por favor, clique no link enviado para seu email ou tente reenviar.", variant: "default" });
      }
    } catch (error: any) {
      console.error("Erro ao verificar status:", error);
      toast({ title: "Falha na Verificação", description: error.message || "Não foi possível verificar o status do email.", variant: "destructive" });
    } finally {
      setIsLoadingCheck(false);
    }
  };
  
  const handleGoToLogin = async () => {
    await logout(); 
    router.push("/login");
  };


  if (authLoading && !appUser) { 
    return (
      <div className={cn(
        "flex justify-center items-center h-screen overflow-hidden",
        !isMobile && "p-4 bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900",
        isMobile && "bg-white p-0" 
      )}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }


  return (
    <>
       <Button
            asChild
            variant="ghost"
            size="icon"
            className="absolute top-4 left-4 z-10 h-12 w-12 rounded-full text-muted-foreground hover:bg-muted hover:text-primary transition-colors"
            title="Voltar para Login"
        >
            <Link href="/login">
                <ArrowLeft className="h-8 w-8" />
                <span className="sr-only">Voltar para Login</span>
            </Link>
        </Button>
        <CardHeader className="h-[200px] flex flex-col justify-center items-center text-center px-6 pb-0">
          <div className="inline-block p-3 bg-primary/10 rounded-full mb-4 mx-auto">
            <MailCheck className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Verifique seu Email</CardTitle>
          <CardDescription>
            Enviamos um link de ativação para {emailForDisplay || "seu email"}.<br />
            Clique no link para ativar sua conta.
          </CardDescription>
        </CardHeader>
        <Separator className="my-6" />
        <CardContent className="flex-grow px-6 pt-0 pb-6 flex flex-col justify-center overflow-y-auto">
          <div className="w-full max-w-xs mx-auto space-y-4 my-auto">
            {isLoadingCheck ? (
              <div className="flex flex-col items-center space-y-3 text-center">
                <p className="text-sm text-muted-foreground">Verificando status do seu email...</p>
                <Progress value={50} className="w-full" aria-label="Verificando status do email" />
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground text-center">
                  Se não encontrar o email, verifique sua pasta de spam ou clique abaixo para reenviar.
                </p>
                <Button onClick={handleResendVerificationEmail} className="w-full h-12" disabled={isLoadingResend}>
                  {isLoadingResend ? <LoadingSpinner size="sm" className="mr-2" /> : <RotateCw className="mr-2 h-4 w-4" />}
                  Reenviar Email de Verificação
                </Button>
                <Button onClick={handleCheckVerificationStatus} variant="outline" className="w-full h-12" disabled={isLoadingResend}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Já Verifiquei, Tentar Acessar
                </Button>
                <Button variant="link" asChild className="text-sm w-full">
                    <a onClick={handleGoToLogin} className="cursor-pointer">
                       Fazer login com outra conta
                    </a>
                </Button>
              </>
            )}
          </div>
        </CardContent>
         <CardFooter className="p-4 border-t bg-muted">
            <OnboardingStepper steps={onboardingStepLabels} currentStep={1} />
        </CardFooter>
    </>
  );
}


export default function VerifyEmailNoticePage() {
  return (
    <Suspense fallback={
      <div className={cn(
          "flex justify-center items-center h-screen overflow-hidden",
          "p-4 bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900" 
        )}>
          <LoadingSpinner size="lg"/>
        </div>
    }>
      <VerifyEmailNoticeContent />
    </Suspense>
  );
}
