
"use client";

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
import { CheckCircle, Phone, ArrowLeft, Smartphone } from "lucide-react"; 
import Link from "next/link";
import OnboardingStepper from "@/components/onboarding/onboarding-stepper";
import { useAuth } from "@/hooks/use-auth"; 
import { db, doc, updateDoc, serverTimestamp } from "@/lib/firebase"; 
import { useToast } from "@/hooks/use-toast"; 
import { useState } from "react";
import LoadingSpinner from "@/components/ui/loading-spinner";


const onboardingStepLabels = ["Termos", "Função", "Dados", "Vínculo ID"];

export default function KakoAccountCheckPage() {
  const router = useRouter();
  const { currentUser } = useAuth(); 
  const { toast } = useToast(); 
  const [isLoading, setIsLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);


  const handleHasAccount = () => {
    if (isLoading) return;
    router.push("/onboarding/kako-id-input"); 
  };

  const handleNeedsAccount = () => {
    if (isLoading) return;
     router.push("/onboarding/kako-creation-choice");
  };

  const handleCreateAccountWithoutId = async () => {
    if (!currentUser) {
      toast({ title: "Erro", description: "Você precisa estar logado.", variant: "destructive" });
      router.push("/login");
      return;
    }
    setLoadingAction('createWithoutId');
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
        description: "Você pode explorar o aplicativo.",
        duration: 5000,
      });
      router.push("/profile");
    } catch (error) {
      console.error("Erro ao finalizar onboarding (createWithoutId):", error);
      toast({ title: "Erro", description: "Não foi possível finalizar o onboarding. Tente novamente.", variant: "destructive" });
    } finally {
      setIsLoading(false);
      setLoadingAction(null);
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
            <Link href="/onboarding/age-verification">
                <ArrowLeft className="h-8 w-8" />
                <span className="sr-only">Voltar</span>
            </Link>
        </Button>
      <CardHeader className="h-[200px] flex flex-col justify-center items-center text-center px-6 pb-0">
        <div className="inline-block p-3 bg-primary/10 rounded-full mb-4 mx-auto">
          <Smartphone className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-2xl font-bold">Conta Kako Live</CardTitle>
        <CardDescription>
          Você já possui uma conta
          <br />
          no aplicativo Kako Live?
        </CardDescription>
      </CardHeader>
      <Separator className="my-6" />
      <CardContent className="flex-grow px-6 pt-0 pb-6 flex flex-col overflow-y-auto">
        <div className="grid grid-cols-1 gap-6 w-full my-auto"> 
          <Card
            className="p-6 flex flex-col items-center text-center cursor-pointer hover:shadow-lg transition-shadow transform hover:scale-105"
            onClick={handleHasAccount}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleHasAccount()}
            aria-disabled={isLoading}
          >
            <div className="p-3 bg-primary/10 rounded-full mb-3">
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Sim, já tenho</h3>
            <p className="text-sm text-muted-foreground">
              Possuo uma conta no Kako Live e sei meu ID
            </p>
          </Card>

          <Card
            className="p-6 flex flex-col items-center text-center cursor-pointer hover:shadow-lg transition-shadow transform hover:scale-105"
            onClick={handleNeedsAccount}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleNeedsAccount()}
            aria-disabled={isLoading}
          >
            <div className="p-3 bg-primary/10 rounded-full mb-3">
              <Phone className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Não, preciso criar</h3>
            <p className="text-sm text-muted-foreground">
              Ainda não tenho uma conta no aplicativo Kako Live
            </p>
          </Card>
          
          <Button 
            onClick={handleCreateAccountWithoutId} 
            className="w-full mt-4" 
            disabled={isLoading}
            variant="outline"
          >
            {isLoading && loadingAction === 'createWithoutId' ? (
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
