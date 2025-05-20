
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Fingerprint, Search, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { db, doc, updateDoc, serverTimestamp } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/ui/loading-spinner";
import Link from "next/link";
import OnboardingStepper from "@/components/onboarding/onboarding-stepper";

const onboardingStepLabels = ["Termos", "Função", "Dados", "Vínculo ID"];

export default function KakoIdInputPage() {
  const [kakoId, setKakoId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false); 
  const router = useRouter();
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const handleSearchProfile = async () => {
    if (!kakoId.trim()) {
      toast({
        title: "Atenção",
        description: "Por favor, insira seu ID do Kako Live.",
        variant: "destructive",
      });
      return;
    }
    setIsSearching(true);
    
    await new Promise(resolve => setTimeout(resolve, 1500)); 
    setIsSearching(false);
    toast({
      title: "Perfil Encontrado (Simulado)",
      description: `ID ${kakoId} verificado (simulação).`,
    });
  };

  const handleContinue = async () => {
    if (!currentUser) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado.",
        variant: "destructive",
      });
      router.push("/login");
      return;
    }
    if (!kakoId.trim()) {
      toast({
        title: "Atenção",
        description: "Por favor, insira seu ID do Kako Live.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const userDocRef = doc(db, "users", currentUser.uid);
      await updateDoc(userDocRef, {
        kakoLiveId: kakoId.trim(),
        hasCompletedOnboarding: true,
        updatedAt: serverTimestamp(),
      });
      toast({
        title: "ID do Kako Live Salvo!",
        description: "Seu onboarding foi concluído.",
      });
      router.push("/profile");
    } catch (error) {
      console.error("Erro ao salvar ID do Kako Live:", error);
      toast({
        title: "Erro ao Salvar",
        description: "Não foi possível salvar seu ID. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const determineBackLink = () => {
    if (!currentUser) return "/onboarding/kako-account-check"; // Fallback
    return currentUser.role === 'host' ? "/onboarding/age-verification" : "/onboarding/kako-account-check";
  }

  return (
    <Card className="w-full max-w-md shadow-xl flex flex-col max-h-[calc(100%-2rem)] aspect-[9/16] overflow-hidden">
      <Button
        asChild
        variant="ghost"
        size="icon"
        className="absolute top-4 left-4 z-10 h-12 w-12 rounded-full text-muted-foreground hover:bg-muted hover:text-primary transition-colors"
        title="Voltar"
      >
        <Link href={determineBackLink()}>
          <ArrowLeft className="h-8 w-8" />
          <span className="sr-only">Voltar</span>
        </Link>
      </Button>
      <CardHeader className="h-[200px] flex flex-col justify-center items-center text-center px-6 pb-0">
         <div className="inline-block p-3 bg-primary/10 rounded-full mb-4 mx-auto mt-8">
          <Fingerprint className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-2xl font-bold">Seu ID Kako Live</CardTitle>
        <CardDescription>
          Insira seu ID do aplicativo Kako Live<br />para continuar.
        </CardDescription>
      </CardHeader>
      <Separator className="my-6" />
      <CardContent className="flex-grow px-6 pt-0 pb-6 flex flex-col overflow-y-auto">
        <div className="w-full max-w-xs mx-auto space-y-6">
          <div>
            <Label htmlFor="kakoId" className="text-sm font-medium mb-2 block text-left">
              ID do Kako Live
            </Label>
            <div className="flex space-x-2">
              <Input
                id="kakoId"
                placeholder="Ex: 12345678"
                value={kakoId}
                onChange={(e) => setKakoId(e.target.value)}
                className="flex-grow"
              />
              <Button 
                variant="outline" 
                onClick={handleSearchProfile} 
                disabled={isSearching || !kakoId.trim()}
                className="shrink-0"
              >
                {isSearching ? <LoadingSpinner size="sm" /> : <Search className="h-4 w-4" />}
                <span className="sr-only sm:not-sr-only sm:ml-2">Buscar</span>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Você pode encontrar seu ID no seu perfil do aplicativo Kako Live.
            </p>
          </div>
        </div>
        <Button
          onClick={handleContinue}
          className="w-full mt-auto"
          disabled={isLoading || isSearching || !kakoId.trim()}
        >
          {isLoading ? (
            <LoadingSpinner size="sm" className="mr-2" />
          ) : (
            <CheckCircle className="mr-2 h-4 w-4" />
          )}
          Continuar e Finalizar
        </Button>
      </CardContent>
      <CardFooter className="p-4 border-t bg-muted">
        <OnboardingStepper steps={onboardingStepLabels} currentStep={4} />
      </CardFooter>
    </Card>
  );
}
