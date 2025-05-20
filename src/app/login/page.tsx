
"use client";

import LoginForm from "@/components/auth/login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import Link from "next/link";
import { LogIn } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { Separator } from "@/components/ui/separator";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const { currentUser, loading } = useAuth();
  const router = useRouter();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!loading && currentUser) {
      if (!currentUser.agreedToTermsAt) {
        router.replace("/onboarding/terms");
      } else if (!currentUser.role) {
        router.replace("/onboarding/role-selection");
      } else if (!currentUser.birthDate || !currentUser.gender || !currentUser.country || !currentUser.phoneNumber) {
        router.replace("/onboarding/age-verification");
      } else if (currentUser.hasCompletedOnboarding === false || typeof currentUser.hasCompletedOnboarding === 'undefined') {
        if (currentUser.role === 'host') {
          router.replace("/onboarding/kako-id-input");
        } else if (currentUser.role === 'player') {
          router.replace("/onboarding/kako-account-check");
        } else {
          router.replace("/profile");
        }
      } else {
        router.replace("/profile");
      }
    }
  }, [currentUser, loading, router]);

  if (loading || (!loading && currentUser)) {
    return (
      <div className={cn(
        "flex justify-center items-center h-screen overflow-hidden",
        !isMobile && "p-4 bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900",
        isMobile && "bg-card p-0"
      )}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className={cn(
      "flex justify-center items-center h-screen overflow-hidden",
      !isMobile && "p-4 bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900",
      isMobile && "bg-card p-0"
    )}>
      <Card className={cn(
        "w-full max-w-md flex flex-col overflow-hidden",
        !isMobile && "shadow-xl max-h-[calc(100%-2rem)] aspect-[9/16]",
        isMobile && "h-full shadow-none rounded-none"
      )}>
        <CardHeader className="h-[200px] flex flex-col justify-center items-center text-center px-6 pb-0">
          <div className="inline-block p-3 bg-primary/10 rounded-full mb-4 mx-auto">
            <LogIn className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Entrar</CardTitle>
          <CardDescription>
            Acesse sua conta
            <br />
            para continuar.
          </CardDescription>
        </CardHeader>
        <Separator className="my-6" />
        <CardContent className="flex-grow px-6 pt-0 pb-6 flex flex-col justify-center overflow-y-auto">
          <LoginForm />
        </CardContent>
        <CardFooter className="flex-col p-0">
          <div className="w-full border-t border-border" />
          <div className="w-full bg-muted p-6 text-center">
            <Link href="/signup" className="text-sm font-medium no-underline hover:underline hover:text-primary">
             Não tem uma conta? Cadastre-se
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
