
"use client";

import LoginForm from "@/components/auth/login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import Link from "next/link";
import { LogIn, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const { currentUser, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!loading && currentUser) {
      if (!currentUser.role) {
        router.replace("/onboarding/role-selection");
      } else if (!currentUser.agreedToTermsAt) {
        router.replace("/onboarding/terms");
      } else if (!currentUser.birthDate || !currentUser.gender || !currentUser.country) {
        router.replace("/onboarding/age-verification");
      } else if (currentUser.hasCompletedOnboarding === false || typeof currentUser.hasCompletedOnboarding === 'undefined') {
        router.replace("/onboarding/kako-account-check");
      }
      else {
        router.replace("/profile");
      }
    }
  }, [currentUser, loading, router]);

  if (loading || (!loading && currentUser)) { 
    return (
      <div className="flex justify-center items-center h-screen p-4 bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 overflow-hidden">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center h-screen p-4 bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 overflow-hidden">
      <Card className="w-full max-w-md shadow-xl relative flex flex-col max-h-[calc(100%-2rem)] aspect-[9/16] md:aspect-auto overflow-hidden">
        
        <CardHeader className="text-center pt-12 px-6 pb-0">
          <div className="inline-block p-3 bg-primary/10 rounded-full mb-4 mx-auto">
            <LogIn className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold">Entrar</CardTitle>
          <CardDescription>Acesse sua conta para continuar.</CardDescription>
        </CardHeader>
        <Separator className="my-6" />
        <CardContent className="flex-grow overflow-y-auto">
          <LoginForm />
        </CardContent>
        <CardFooter className="flex-col p-0">
          <div className="w-full border-t border-border" />
          <div className="w-full bg-muted p-6 text-center">
            <Link href="/signup" className="text-sm font-medium no-underline hover:text-primary hover:underline">
             Não tem uma conta? Cadastre-se
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
