
"use client";

import LoginForm from "@/components/auth/login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { LogIn, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import LoadingSpinner from "@/components/ui/loading-spinner";

export default function LoginPage() {
  const { currentUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && currentUser) {
      router.replace("/profile");
    }
  }, [currentUser, loading, router]);

  if (loading || (!loading && currentUser)) {
    // Show a loading spinner while checking auth status or if redirecting
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // If not loading and no user, show the login page
  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-200px)] py-8 px-4">
      <Card className="w-full max-w-md shadow-xl relative">
        <div className="absolute top-4 left-4">
          <Link href="/" aria-label="Go back to homepage" className="text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="h-6 w-6" />
          </Link>
        </div>
        <CardHeader className="text-center pt-12"> {/* Added padding-top to make space for back arrow */}
          <div className="inline-block p-3 bg-primary/10 rounded-full mb-4 mx-auto">
            <LogIn className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold">Entrar</CardTitle>
          <CardDescription>Acesse sua conta para continuar.</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  );
}
