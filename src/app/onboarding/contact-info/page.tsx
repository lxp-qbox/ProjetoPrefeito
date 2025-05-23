
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Phone, HelpCircle, CheckCircle, ArrowLeft } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { db, doc, updateDoc, serverTimestamp } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/ui/loading-spinner";
import Link from "next/link";
import OnboardingStepper from "@/components/onboarding/onboarding-stepper";
import type { UserProfile } from "@/types";

const onboardingStepLabels = ["Termos", "Função", "Dados", "Contato", "Vínculo ID"];

const formatPhoneNumberForDisplay = (value: string): string => {
  if (!value.trim()) return "";
  const originalStartsWithPlus = value.charAt(0) === '+';
  let digitsOnly = (originalStartsWithPlus ? value.substring(1) : value).replace(/[^\d]/g, '');
  digitsOnly = digitsOnly.slice(0, 13);
  const len = digitsOnly.length;
  if (len === 0) return originalStartsWithPlus ? "+" : "";
  let formatted = "+";
  if (len <= 2) formatted += digitsOnly;
  else if (len <= 4) formatted += `${digitsOnly.slice(0, 2)} (${digitsOnly.slice(2)})`;
  else if (len <= 8) formatted += `${digitsOnly.slice(0, 2)} (${digitsOnly.slice(2, 4)}) ${digitsOnly.slice(4)}`;
  else formatted += `${digitsOnly.slice(0, 2)} (${digitsOnly.slice(2, 4)}) ${digitsOnly.slice(4, 9)}-${digitsOnly.slice(5)}`;
  return formatted;
};

export default function ContactInfoPage() {
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [foundUsVia, setFoundUsVia] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();
  const { currentUser, refreshUserProfile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (currentUser) {
      setPhoneNumber(formatPhoneNumberForDisplay(currentUser.phoneNumber || ""));
      setFoundUsVia(currentUser.foundUsVia || "");
    }
  }, [currentUser]);

  const handleContinue = async () => {
    if (!currentUser) {
      toast({ title: "Erro", description: "Você precisa estar logado.", variant: "destructive" });
      router.push("/login");
      return;
    }
    if (!phoneNumber.trim()) {
      toast({ title: "Atenção", description: "Por favor, informe seu número de celular.", variant: "destructive" });
      return;
    }
    if (!foundUsVia) {
      toast({ title: "Atenção", description: "Por favor, selecione onde nos encontrou.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const userDocRef = doc(db, "accounts", currentUser.uid);
      const dataToUpdate: Partial<UserProfile> = {
        phoneNumber: phoneNumber.trim().replace(/(?!^\+)[^\d]/g, ''),
        foundUsVia: foundUsVia,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(userDocRef, dataToUpdate);
      await refreshUserProfile();

      toast({
        title: "Informações de Contato Salvas",
        description: "Seus dados de contato foram registrados.",
      });
      
      if (currentUser.role === 'host') {
        router.push("/onboarding/kako-id-input");
      } else if (currentUser.role === 'player') {
        router.push("/onboarding/kako-account-check");
      } else {
        router.push("/onboarding/kako-account-check"); // Fallback
      }

    } catch (error) {
      console.error("Erro ao salvar informações de contato:", error);
      toast({
        title: "Erro ao Salvar",
        description: "Não foi possível salvar suas informações. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentUser && !isLoading) { 
    return (
      <div className="flex-grow flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <>
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
        <div className="inline-block p-3 bg-primary/10 rounded-full mb-4 mx-auto mt-8">
          <Phone className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-2xl font-bold">Informações de Contato</CardTitle>
        <CardDescription>
         Ajude-nos a manter contato<br />e entender como você nos conheceu.
        </CardDescription>
      </CardHeader>
      <Separator className="my-6" />
      <CardContent className="flex-grow px-6 pt-0 pb-6 flex flex-col overflow-y-auto">
        <div className="w-full max-w-xs mx-auto space-y-4 my-auto">
          <div>
            <Label htmlFor="phone-number" className="text-sm font-medium mb-1 block text-left">
              Celular (WhatsApp)
            </Label>
            <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    id="phone-number"
                    type="tel"
                    placeholder="+00 (00) 00000-0000"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(formatPhoneNumberForDisplay(e.target.value))}
                    className="pl-10 h-12"
                />
            </div>
          </div>
          <div>
            <Label htmlFor="found-us-via-select" className="text-sm font-medium mb-1 block text-left">
              Onde nos encontrou?
            </Label>
            <Select
              value={foundUsVia}
              onValueChange={(value) => setFoundUsVia(value)}
            >
              <SelectTrigger id="found-us-via-select" className="w-full h-12 focus-visible:ring-0 focus-visible:ring-offset-0">
                <HelpCircle className="mr-2 h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Selecione uma opção" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kakolive">Kako Live</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="tiktok">TikTok</SelectItem>
                <SelectItem value="nimotv">Nimo TV</SelectItem>
                <SelectItem value="youtube">Youtube</SelectItem>
                <SelectItem value="outro">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button
          onClick={handleContinue}
          className="w-full mt-auto" 
          disabled={!phoneNumber.trim() || !foundUsVia || isLoading}
        >
          {isLoading ? (
            <LoadingSpinner size="sm" className="mr-2" />
          ) : (
            <CheckCircle className="mr-2 h-4 w-4" />
          )}
          Continuar
        </Button>
      </CardContent>
       <CardFooter className="p-4 border-t bg-muted">
        <OnboardingStepper steps={onboardingStepLabels} currentStep={4} />
      </CardFooter>
    </>
  );
}

    