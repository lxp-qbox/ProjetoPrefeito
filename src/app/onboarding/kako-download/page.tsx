"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, QrCode, DownloadCloud, ExternalLink, CheckCircle, Smartphone } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/ui/loading-spinner";
import OnboardingStepper from "@/components/onboarding/onboarding-stepper";
import Image from "next/image";

const onboardingStepLabels = ["Termos", "Função", "Dados", "Contato", "Vínculo ID"];

export default function KakoDownloadPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [navigating, setNavigating] = useState(false);

  // Limpar estado de navegação no desmonte do componente
  useEffect(() => {
    return () => {
      setNavigating(false);
    };
  }, []);

  const handleContinue = () => {
    if (isLoading || navigating) return;
    setIsLoading(true);
    setNavigating(true);
    
    // Adicionar pequeno delay para garantir feedback visual
    setTimeout(() => {
      router.push("/onboarding/kako-id-input");
    }, 100);
  };

  return (
    <>
      <Button
        asChild
        variant="ghost"
        size="icon"
        className="absolute top-4 left-4 z-10 h-12 w-12 rounded-full text-muted-foreground hover:bg-muted hover:text-primary transition-colors"
        title="Voltar"
        disabled={isLoading || navigating}
      >
        <Link href="/onboarding/kako-creation-choice">
          <ArrowLeft className="h-8 w-8" />
          <span className="sr-only">Voltar</span>
        </Link>
      </Button>
      <CardHeader className="h-[200px] flex flex-col justify-center items-center text-center px-6 pb-0">
        <div className="inline-block p-3 bg-primary/10 rounded-full mb-4 mx-auto mt-8">
          <DownloadCloud className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-2xl font-bold">Baixar Kako Live</CardTitle>
        <CardDescription>
          Baixe o aplicativo no seu celular<br />para criar sua conta
        </CardDescription>
      </CardHeader>
      <Separator className="my-6" />
      <CardContent className="flex-grow px-6 pt-0 pb-6 flex flex-col overflow-y-auto">
        <div className="bg-muted p-4 rounded-lg mb-4">
          <h3 className="text-md font-medium mb-2 flex items-center">
            <QrCode className="mr-2 h-4 w-4 text-primary" />
            Escaneie o QR Code:
          </h3>
          <div className="flex justify-center">
            <div className="bg-white p-2 rounded-md">
              <Image 
                src="/images/kako-qrcode.png"
                alt="QR Code para download do Kako Live"
                width={180}
                height={180}
                className="rounded-md"
              />
            </div>
          </div>
        </div>
        
        <div className="bg-muted p-4 rounded-lg mb-4">
          <h3 className="text-md font-medium mb-2 flex items-center">
            <Smartphone className="mr-2 h-4 w-4 text-primary" />
            Ou acesse:
          </h3>
          <Button variant="link" asChild className="p-0 h-auto text-primary no-underline hover:underline">
            <a href="https://www.kako.live/index.html" target="_blank" rel="noopener noreferrer">
              www.kako.live <ExternalLink className="ml-1 h-3 w-3" />
            </a>
          </Button>
        </div>
        
        <div className="space-y-2 text-sm text-muted-foreground mt-2">
          <p>1. Baixe o aplicativo Kako Live</p>
          <p>2. Crie sua conta com email e senha</p>
          <p>3. Anote seu ID de usuário (Show ID)</p>
          <p>4. Volte aqui para finalizar seu cadastro</p>
        </div>

        <Button
          onClick={handleContinue}
          className="w-full mt-auto"
          disabled={isLoading || navigating}
        >
          {isLoading ? (
            <LoadingSpinner size="sm" className="mr-2" />
          ) : (
            <CheckCircle className="mr-2 h-4 w-4" />
          )}
          Já criei minha conta no Kako
        </Button>
      </CardContent>
      <CardFooter className="p-4 border-t bg-muted">
        <OnboardingStepper steps={onboardingStepLabels} currentStep={5} />
      </CardFooter>
    </>
  );
} 