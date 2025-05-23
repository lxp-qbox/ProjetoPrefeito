
"use client";

import LoginForm from "@/components/auth/login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import Link from "next/link";
import { LogIn } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, Suspense } from "react";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { Separator } from "@/components/ui/separator";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import type { UserProfile } from "@/types";


function LoginPageContent() {
  const { currentUser, loading } = useAuth();
  const router = useRouter();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!loading && currentUser) {
      const firebaseUser = auth.currentUser; // Get the latest Firebase Auth user object

      if (firebaseUser && !firebaseUser.emailVerified) {
        router.replace(`/auth/verify-email-notice?email=${encodeURIComponent(firebaseUser.email || "")}`);
        return;
      }
      
      // At this point, email is verified or it's a provider like Google
      const userProfile = currentUser as UserProfile; 

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
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, loading, router]); // router added to dep array

  if (loading || (!loading && currentUser)) {
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
        {/* Back button removed as per previous instruction */}
        <CardHeader className="h-[200px] flex flex-col justify-center items-center text-center px-6 pb-0">
          <div className="inline-block p-3 bg-primary/10 rounded-full mb-4 mx-auto">
            <LogIn className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Entrar</CardTitle>
          <CardDescription>
            Acesse sua conta<br />para continuar.
          </CardDescription>
        </CardHeader>
        <Separator className="my-6" />
        <CardContent className="flex-grow px-6 pt-0 pb-6 flex flex-col justify-center overflow-y-auto">
          <LoginForm />
        </CardContent>
        <CardFooter className="flex-col p-0 border-t bg-muted">
          <div className="w-full p-6 text-center">
            <Link href="/signup" className="text-sm font-medium text-primary no-underline hover:underline">
             Não tem uma conta? Cadastre-se
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

// Need to import auth for firebaseUser.emailVerified check
import { auth } from "@/lib/firebase";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen"><LoadingSpinner size="lg"/></div>}>
      <LoginPageContent />
    </Suspense>
  );
}
