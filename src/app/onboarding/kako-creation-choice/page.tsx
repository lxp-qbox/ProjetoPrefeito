
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { XCircle, ExternalLink, ArrowLeft, Smartphone } from "lucide-react"; 
import { useAuth } from "@/hooks/use-auth";
import { db, doc, updateDoc, serverTimestamp } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/ui/loading-spinner";
import Link from "next/link";
import OnboardingStepper from "@/components/onboarding/onboarding-stepper";

const onboardingStepLabels = ["Termos", "Função", "Dados", "Vínculo ID"];

export default function KakoCreationChoicePage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const handleSkipLinking = async () => {
    if (!currentUser) {
      toast({ title: "Erro", description: "Você precisa estar logado.", variant: "destructive" });
      router.push("/login");
      return;
    }
    setIsLoading(true);
    try {
      const userDocRef = doc(db, "users", currentUser.uid);
      await updateDoc(userDocRef, {
        kakoLiveId: "", 
        hasCompletedOnboarding: true, 
        updatedAt: serverTimestamp(),
      });
      toast({
        title: "Onboarding Concluído!",
        description: "Você pode explorar o aplicativo. Vincule seu ID Kako Live mais tarde no perfil, se desejar.",
        duration: 7000,
      });
      router.push("/profile");
    } catch (error) {
      console.error("Erro ao finalizar onboarding (skip linking):", error);
      toast({ title: "Erro", description: "Não foi possível finalizar o onboarding. Tente novamente.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleWillCreateAccount = async () => {
     if (!currentUser) {
      toast({ title: "Erro", description: "Você precisa estar logado.", variant: "destructive" });
      router.push("/login");
      return;
    }
    setIsLoading(true);
    try {
      const userDocRef = doc(db, "users", currentUser.uid);
      await updateDoc(userDocRef, {
        kakoLiveId: "", 
        hasCompletedOnboarding: true, 
        updatedAt: serverTimestamp(),
      });
      toast({
        title: "Entendido!",
        description: "Crie sua conta no app Kako Live. Depois, você pode adicionar seu ID no seu perfil para acesso completo.",
        duration: 9000,
      });
      router.push("/profile"); 
    } catch (error) {
      console.error("Erro ao finalizar onboarding (will create Kako account):", error);
      toast({ title: "Erro", description: "Não foi possível finalizar o onboarding. Tente novamente.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <Card className="w-full max-w-md shadow-xl flex flex-col max-h-[calc(100%-2rem)] aspect-[9/16] md:aspect-auto overflow-hidden">
       <Button
            asChild
            variant="ghost"
            size="icon"
            className="absolute top-4 left-4 z-10 h-12 w-12 rounded-full text-muted-foreground hover:bg-muted hover:text-primary transition-colors"
            title="Voltar"
        >
            <Link href="/onboarding/kako-account-check">
                <ArrowLeft className="h-8 w-8" />
                <span className="sr-only">Voltar</span>
            </Link>
        </Button>
      <CardHeader className="text-center pt-10 pb-4">
        <div className="inline-block p-3 bg-primary/10 rounded-full mb-3 mx-auto mt-8">
          <Smartphone className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-2xl font-bold">Criar Conta Kako Live</CardTitle> {/* Changed from text-3xl */}
        <CardDescription>
          Você indicou que não tem uma conta Kako Live.<br />O que gostaria de fazer?
        </CardDescription>
      </CardHeader>
      <Separator className="mb-6" />
      <CardContent className="flex-grow px-6 pt-6 pb-6 overflow-y-auto">
        <div className="grid grid-cols-1 gap-6 w-full"> 
          <Card
            className="p-6 flex flex-col items-center text-center cursor-pointer hover:shadow-lg transition-shadow transform hover:scale-105"
            onClick={!isLoading ? handleSkipLinking : undefined}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSkipLinking()}
            aria-disabled={isLoading}
          >
            <div className="p-3 bg-primary/10 rounded-full mb-3">
              <XCircle className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Não quero criar/vincular agora</h3>
            <p className="text-sm text-muted-foreground">
              Você pode explorar o aplicativo. Algumas funcionalidades podem ser limitadas.
            </p>
            {isLoading && <LoadingSpinner size="sm" className="mt-2" />}
          </Card>

          <Card
            className="p-6 flex flex-col items-center text-center cursor-pointer hover:shadow-lg transition-shadow transform hover:scale-105"
            onClick={!isLoading ? handleWillCreateAccount : undefined}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleWillCreateAccount()}
            aria-disabled={isLoading}
          >
            <div className="p-3 bg-primary/10 rounded-full mb-3">
              <ExternalLink className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Vou criar uma conta no app Kako Live</h3>
            <p className="text-sm text-muted-foreground">
              Após criar, volte e informe seu ID para acesso completo.
            </p>
            {isLoading && <LoadingSpinner size="sm" className="mt-2" />}
          </Card>
        </div>
      </CardContent>
       <CardFooter className="p-4 border-t bg-muted">
        <OnboardingStepper steps={onboardingStepLabels} currentStep={4} />
      </CardFooter>
    </Card>
  );
}
