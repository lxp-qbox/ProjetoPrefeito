
"use client";

import React, { useState, useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { MailCheck, ArrowLeft, RotateCw, CheckCircle, KeyRound } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { auth, db, doc, getDoc, updateDoc, serverTimestamp } from "@/lib/firebase"; 
import { sendEmailVerification } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/ui/loading-spinner";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import OnboardingStepper from "@/components/onboarding/onboarding-stepper";
import { Progress } from "@/components/ui/progress";
import type { UserProfile } from "@/types";

const onboardingStepLabels = ["Verificar Email", "Termos", "Função", "Dados", "Vínculo ID"];
const RESEND_COOLDOWN_SECONDS = 5 * 60; // 5 minutes
const RESEND_TIMESTAMP_KEY = 'resendVerificationEmailCooldownEnd';

const formatCooldownTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

function VerifyEmailNoticeContent() {
  const [isLoadingResend, setIsLoadingResend] = useState(false);
  const [isLoadingCheck, setIsLoadingCheck] = useState(false);
  const searchParams = useSearchParams();
  const emailForDisplay = searchParams.get("email");
  const router = useRouter();
  const { toast } = useToast();
  const { currentUser: appUser, loading: authLoading, logout } = useAuth();
  const [isLoadingPage, setIsLoadingPage] = useState(true);

  const [resendCooldown, setResendCooldown] = useState(0);
  const [canResendEmail, setCanResendEmail] = useState(true);
  const cooldownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const storedCooldownEnd = localStorage.getItem(RESEND_TIMESTAMP_KEY);
    if (storedCooldownEnd) {
      const endTime = parseInt(storedCooldownEnd, 10);
      const now = Date.now();
      if (endTime > now) {
        const remainingSeconds = Math.ceil((endTime - now) / 1000);
        setResendCooldown(remainingSeconds);
        setCanResendEmail(false);
      } else {
        localStorage.removeItem(RESEND_TIMESTAMP_KEY);
      }
    }
  }, []);

  useEffect(() => {
    if (resendCooldown > 0 && !canResendEmail) {
      if (cooldownIntervalRef.current) {
        clearInterval(cooldownIntervalRef.current);
      }
      cooldownIntervalRef.current = setInterval(() => {
        setResendCooldown((prevCooldown) => {
          if (prevCooldown <= 1) {
            if(cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current!);
            cooldownIntervalRef.current = null;
            setCanResendEmail(true);
            localStorage.removeItem(RESEND_TIMESTAMP_KEY);
            return 0;
          }
          return prevCooldown - 1;
        });
      }, 1000);
    } else if (resendCooldown === 0 && !canResendEmail && localStorage.getItem(RESEND_TIMESTAMP_KEY)) {
      // If cooldown finished but state not yet updated (e.g. due to interval clear before final tick)
      setCanResendEmail(true);
      localStorage.removeItem(RESEND_TIMESTAMP_KEY);
    }
  
    return () => {
      if (cooldownIntervalRef.current) {
        clearInterval(cooldownIntervalRef.current);
      }
    };
  }, [resendCooldown, canResendEmail]);


  useEffect(() => {
    if (authLoading) {
      setIsLoadingPage(true);
      return;
    }

    const performInitialCheck = async () => {
      if (auth.currentUser) {
        await auth.currentUser.reload(); 
        if (auth.currentUser.emailVerified) {
          const userDocRef = doc(db, "accounts", auth.currentUser.uid);
          try {
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
              const userProfile = { uid: auth.currentUser.uid, ...userDocSnap.data() } as UserProfile;
              if (!userProfile.agreedToTermsAt) {
                router.replace("/onboarding/terms");
              } else if (!userProfile.role) {
                router.replace("/onboarding/role-selection");
              } else if (!userProfile.birthDate || !userProfile.gender || !userProfile.country || !userProfile.phoneNumber) {
                router.replace("/onboarding/age-verification");
              } else if (userProfile.hasCompletedOnboarding === false || typeof userProfile.hasCompletedOnboarding === 'undefined') {
                if (userProfile.role === 'host') {
                  router.replace("/onboarding/kako-id-input");
                } else if (userProfile.role === 'player') {
                  router.replace("/onboarding/kako-account-check");
                } else {
                  router.replace("/profile");
                }
              } else {
                router.replace("/profile");
              }
            } else { 
              router.replace("/onboarding/terms");
            }
          } catch (error) {
            console.error("Error fetching user profile for redirect:", error);
            toast({ title: "Erro de Redirecionamento", description: "Não foi possível verificar seu status de onboarding.", variant: "destructive" });
            router.replace("/profile"); 
          }
        } else {
          setIsLoadingPage(false);
        }
      } else {
        router.replace("/login"); 
      }
    };
    performInitialCheck();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, appUser, router, toast]); 

  const handleResendVerificationEmail = async () => {
    if (!auth.currentUser) {
      toast({ title: "Erro", description: "Nenhum usuário logado para reenviar verificação.", variant: "destructive" });
      return;
    }
    if (!canResendEmail) {
      toast({ title: "Aguarde", description: `Você poderá reenviar o email em ${formatCooldownTime(resendCooldown)}.`, variant: "default" });
      return;
    }
    setIsLoadingResend(true);
    try {
      await sendEmailVerification(auth.currentUser);
      toast({ title: "Email Reenviado", description: "Um novo link de verificação foi enviado para seu email." });
      const endTime = Date.now() + RESEND_COOLDOWN_SECONDS * 1000;
      localStorage.setItem(RESEND_TIMESTAMP_KEY, endTime.toString());
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      setCanResendEmail(false);
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
        
        const userDocRef = doc(db, "accounts", auth.currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
            const userProfile = userDocSnap.data() as UserProfile;
            if (!userProfile.isVerified) { // Update Firestore if it was false
                await updateDoc(userDocRef, { isVerified: true, updatedAt: serverTimestamp() });
            }
            // Onboarding redirection logic
            if (!userProfile.agreedToTermsAt) {
              router.replace("/onboarding/terms");
            } else if (!userProfile.role) {
              router.replace("/onboarding/role-selection");
            } else if (!userProfile.birthDate || !userProfile.gender || !userProfile.country || !userProfile.phoneNumber) {
              router.replace("/onboarding/age-verification");
            } else if (userProfile.hasCompletedOnboarding === false || typeof userProfile.hasCompletedOnboarding === 'undefined') {
              if (userProfile.role === 'host') {
                router.replace("/onboarding/kako-id-input");
              } else if (userProfile.role === 'player') {
                router.replace("/onboarding/kako-account-check");
              } else { 
                router.replace("/profile"); 
              }
            } else { 
              router.replace("/profile");
            }
        } else { 
            router.replace("/onboarding/terms"); 
        }
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
    if(auth.currentUser){ 
      await logout();
    }
    router.push("/login");
  };

  if (authLoading || isLoadingPage) { 
    return <div className="flex-grow flex justify-center items-center h-full"><LoadingSpinner size="lg"/></div>;
  }

  return (
    <>
      <Button
          asChild
          variant="ghost"
          size="icon"
          className="absolute top-4 left-4 z-10 h-12 w-12 rounded-full text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
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
      <CardContent className="flex-grow px-6 pt-0 pb-6 flex flex-col overflow-y-auto">
        <div className="w-full max-w-xs mx-auto space-y-4 mt-auto">
          {isLoadingCheck ? (
            <div className="flex flex-col items-center space-y-3 text-center">
              <p className="text-sm text-muted-foreground">Verificando status do seu email...</p>
              <Progress value={50} className="w-full h-1.5" aria-label="Verificando status do email" />
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground text-center">
                Se não encontrar o email, verifique sua pasta de spam ou clique abaixo para reenviar.
              </p>
              <Button 
                onClick={handleResendVerificationEmail} 
                className="w-full h-12" 
                disabled={isLoadingResend || isLoadingCheck || !canResendEmail}
              >
                {isLoadingResend ? (
                  <LoadingSpinner size="sm" className="mr-2" />
                ) : !canResendEmail && resendCooldown > 0 ? (
                  `Reenviar em ${formatCooldownTime(resendCooldown)}`
                ) : (
                  <>
                    <RotateCw className="mr-2 h-4 w-4" />
                    Reenviar Email de Verificação
                  </>
                )}
              </Button>
              <Button 
                onClick={handleCheckVerificationStatus} 
                variant="outline" 
                className="w-full h-12" 
                disabled={isLoadingResend || isLoadingCheck}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Já Verifiquei, Tentar Acessar
              </Button>
              <Button variant="link" onClick={handleGoToLogin} className="text-sm w-full text-primary no-underline hover:underline h-auto">
                 Fazer login com outra conta
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
  const isMobile = useIsMobile();
  
  return (
    <Suspense fallback={
      <div className={cn(
          "flex justify-center items-center h-screen overflow-hidden",
          !isMobile && "bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900",
          isMobile && "bg-white" 
        )}><LoadingSpinner size="lg"/>
      </div>
    }>
      <div className={cn(
        "flex justify-center items-center h-screen overflow-hidden",
        !isMobile && "p-4 bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900",
        isMobile && "bg-white p-0" 
      )}>
        <Card className={cn(
          "w-full max-w-md flex flex-col overflow-hidden",
          !isMobile && "shadow-xl max-h-[calc(100%-2rem)] aspect-[9/16]",
          isMobile && "h-full shadow-none rounded-none"
        )}>
            <VerifyEmailNoticeContent />
        </Card>
      </div>
    </Suspense>
  );
}

    