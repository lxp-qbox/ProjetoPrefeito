
"use client";

import LoginForm from "@/components/auth/login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import Link from "next/link";
import { LogIn, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const { currentUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && currentUser) {
      const queryParams = new URLSearchParams(window.location.search);
      const redirectPath = queryParams.get("redirect");
      if (redirectPath) {
        router.replace(redirectPath);
      } else {
        router.replace("/profile"); // Default redirect to profile
      }
    }
  }, [currentUser, loading, router]);

  if (loading || (!loading && currentUser)) {
    // Show a loading spinner while checking auth status or if redirecting
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // If not loading and no user, show the login page
  return (
    <div className="flex justify-center items-center h-screen p-4 bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 overflow-hidden">
      <Card className="w-full max-w-md shadow-xl relative flex flex-col max-h-[calc(100%-2rem)]">
        <div className="absolute top-4 left-4">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full text-muted-foreground hover:bg-muted hover:text-primary p-0" // Ensure padding doesn't add to size if icon itself is large
            asChild
          >
            <Link href="/" aria-label="Voltar para página inicial">
              <ArrowLeft className="h-10 w-10" />
            </Link>
          </Button>
        </div>
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
