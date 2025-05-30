"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Headset, MessageCircle, CheckCircle, PhoneCall } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/ui/loading-spinner";
import OnboardingStepper from "@/components/onboarding/onboarding-stepper";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const onboardingStepLabels = ["Termos", "Função", "Dados", "Contato", "Vínculo ID"];

export default function KakoAgentAssistPage() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const [message, setMessage] = useState("");

  // Limpar estado de navegação no desmonte do componente
  useEffect(() => {
    return () => {
      setNavigating(false);
    };
  }, []);

  const handleSubmitRequest = () => {
    if (isLoading || navigating) return;
    
    if (!message.trim()) {
      toast({
        title: "Mensagem Vazia",
        description: "Por favor, escreva uma mensagem para nossos agentes.",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    setNavigating(true);
    
    // Simulando envio da solicitação
    setTimeout(() => {
      toast({
        title: "Solicitação Enviada",
        description: "Um agente entrará em contato em breve para ajudar com sua conta.",
      });
      
      // Adicionar pequeno delay para garantir feedback visual
      setTimeout(() => {
        router.push("/dashboard");
      }, 100);
    }, 1500);
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
          <Headset className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-2xl font-bold">Assistência de Agente</CardTitle>
        <CardDescription>
          Um agente irá ajudar você<br />a criar sua conta no Kako Live
        </CardDescription>
      </CardHeader>
      <Separator className="my-6" />
      <CardContent className="flex-grow px-6 pt-0 pb-6 flex flex-col overflow-y-auto">
        <div className="bg-muted p-4 rounded-lg mb-6">
          <h3 className="text-md font-medium mb-2 flex items-center">
            <MessageCircle className="mr-2 h-4 w-4 text-primary" />
            Como funciona:
          </h3>
          <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
            <li>Nossos agentes são especialistas no aplicativo Kako Live</li>
            <li>Eles vão te guiar passo a passo na criação da conta</li>
            <li>Você receberá uma mensagem com instruções</li>
            <li>Após criar a conta, você poderá voltar e informar seu ID</li>
          </ul>
        </div>
        
        <div className="space-y-3 mb-6">
          <Label htmlFor="message" className="text-sm font-medium">
            Deixe uma mensagem para o agente:
          </Label>
          <Textarea 
            id="message"
            placeholder="Olá, preciso de ajuda para criar minha conta no Kako Live..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="min-h-[120px]"
            disabled={isLoading || navigating}
          />
        </div>

        <div className="flex flex-col space-y-2">
          <Button
            onClick={handleSubmitRequest}
            className="w-full"
            disabled={isLoading || navigating}
          >
            {isLoading ? (
              <LoadingSpinner size="sm" className="mr-2" />
            ) : (
              <CheckCircle className="mr-2 h-4 w-4" />
            )}
            Enviar Solicitação
          </Button>
          
          <div className="text-center text-sm text-muted-foreground mt-2">
            <p className="flex items-center justify-center">
              <PhoneCall className="h-3 w-3 mr-1" />
              Ou entre em contato pelo WhatsApp: (11) 99999-9999
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 border-t bg-muted">
        <OnboardingStepper steps={onboardingStepLabels} currentStep={5} />
      </CardFooter>
    </>
  );
} 