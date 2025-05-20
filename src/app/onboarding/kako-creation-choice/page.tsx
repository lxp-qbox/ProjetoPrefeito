
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
import { Smartphone, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { db, doc, updateDoc, serverTimestamp } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/ui/loading-spinner";
import Link from "next/link";
import OnboardingStepper from "@/components/onboarding/onboarding-stepper";

const onboardingStepLabels = ["Termos", "Função", "Dados", "Vínculo ID"];

export default function KakoCreationChoicePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const router = useRouter();
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const handleCompleteOnboardingWithoutId = async () => {
    if (!currentUser) {
      toast({ title: "Erro", description: "Você precisa estar logado.", variant: "destructive" });
      router.push("/login");
      return;
    }
    setLoadingAction('completeWithoutId');
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
      console.error("Erro ao finalizar onboarding (completeWithoutId):", error);
      toast({ title: "Erro", description: "Não foi possível finalizar o onboarding. Tente novamente.", variant: "destructive" });
    } finally {
      setIsLoading(false);
      setLoadingAction(null);
    }
  };

  const handleProceedToIdInput = () => {
    if (isLoading) return;
    setLoadingAction('proceedToIdInput'); // Set loading action for the specific button
    // Simulate a brief loading period if desired, or navigate directly
    router.push("/onboarding/kako-id-input");
  };


  return (
    <Card className="w-full max-w-md shadow-xl flex flex-col max-h-[calc(100%-2rem)] aspect-[9/16] overflow-hidden">
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
      <CardHeader className="h-[200px] flex flex-col justify-center items-center text-center px-6 pb-0">
        <div className="inline-block p-3 bg-primary/10 rounded-full mb-4 mx-auto">
          <Smartphone className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-2xl font-bold">Criar Conta Kako Live</CardTitle>
        <CardDescription>
          Você indicou que não tem uma conta Kako Live.<br />O que gostaria de fazer?
        </CardDescription>
      </CardHeader>
      <Separator className="my-6" />
      <CardContent className="flex-grow px-6 pt-0 pb-6 flex flex-col overflow-y-auto">
          <div className="my-auto space-y-4">
            <p className="text-sm text-center text-muted-foreground">
              Recomendamos criar sua conta primeiro no aplicativo Kako Live. Depois, volte aqui e informe seu ID.
            </p>
            <Button
              onClick={handleProceedToIdInput}
              className="w-full"
              disabled={isLoading}
            >
              {isLoading && loadingAction === 'proceedToIdInput' ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : null}
              Já baixei e criei minha conta
            </Button>
            <Button
              variant="outline"
              onClick={handleCompleteOnboardingWithoutId}
              className="w-full"
              disabled={isLoading}
            >
              {isLoading && loadingAction === 'completeWithoutId' ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : null}
              Criar conta sem ID Kako
            </Button>
          </div>
      </CardContent>
       <CardFooter className="p-4 border-t bg-muted">
        <OnboardingStepper steps={onboardingStepLabels} currentStep={4} />
      </CardFooter>
    </Card>
  );
}
