
"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { KeyRound, CheckCircle, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { db, doc, updateDoc, serverTimestamp, collection, query, where, getDocs, getDoc } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/ui/loading-spinner";
import Link from "next/link";
import OnboardingStepper from "@/components/onboarding/onboarding-stepper"; // Assuming this is still used for layout consistency

const onboardingStepLabels = ["Verificar Email", "Termos", "Função", "Dados", "Vínculo ID"]; // New first step

function VerifyEmailCodeContent() {
  const [otpCode, setOtpCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(false);
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const router = useRouter();
  const { toast } = useToast();
  const { currentUser } = useAuth(); // To get UID if needed for Firestore update based on email

  const handleVerifyCode = async () => {
    if (!email) {
      toast({ title: "Erro", description: "Email não fornecido para verificação.", variant: "destructive" });
      router.push("/login");
      return;
    }
    if (otpCode.length !== 6) {
      toast({ title: "Código Inválido", description: "Por favor, insira um código de 6 dígitos.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    // Simulate code verification
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (otpCode === "123456") { // Hardcoded verification code for simulation
      try {
        // Find user by email in 'accounts' collection to get their UID
        const accountsRef = collection(db, "accounts");
        const q = query(accountsRef, where("email", "==", email));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          toast({ title: "Erro", description: "Usuário não encontrado para este email.", variant: "destructive" });
          setIsLoading(false);
          return;
        }

        const userDoc = querySnapshot.docs[0];
        const userDocRef = doc(db, "accounts", userDoc.id);

        await updateDoc(userDocRef, {
          isVerified: true,
          updatedAt: serverTimestamp(),
        });

        toast({ title: "Email Verificado!", description: "Seu email foi verificado com sucesso." });
        router.push("/onboarding/terms"); // Proceed to next onboarding step
      } catch (error) {
        console.error("Erro ao atualizar status de verificação:", error);
        toast({ title: "Erro no Servidor", description: "Não foi possível atualizar seu status. Tente novamente.", variant: "destructive" });
      }
    } else {
      toast({ title: "Código Inválido", description: "O código inserido está incorreto. Tente novamente.", variant: "destructive" });
    }
    setIsLoading(false);
  };

  return (
    <>
      <Button
        asChild
        variant="ghost"
        size="icon"
        className="absolute top-4 left-4 z-10 h-12 w-12 rounded-full text-muted-foreground hover:bg-muted hover:text-primary transition-colors"
        title="Voltar para Login"
      >
        <Link href="/login">
          <ArrowLeft className="h-8 w-8" />
          <span className="sr-only">Voltar para Login</span>
        </Link>
      </Button>
      <CardHeader className="h-[200px] flex flex-col justify-center items-center text-center px-6 pb-0">
        <div className="inline-block p-3 bg-primary/10 rounded-full mb-4 mx-auto mt-8">
          <KeyRound className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-2xl font-bold">Verifique seu Email</CardTitle>
        <CardDescription>
          Enviamos um código de 6 dígitos para {email || "seu email"}.
          <br />
          Por favor, insira-o abaixo para continuar.
        </CardDescription>
      </CardHeader>
      <Separator className="my-6" />
      <CardContent className="flex-grow px-6 pt-0 pb-6 flex flex-col overflow-y-auto">
        <div className="w-full max-w-xs mx-auto space-y-6 my-auto">
          <InputOTP maxLength={6} value={otpCode} onChange={(value) => setOtpCode(value)}>
            <InputOTPGroup className="gap-2">
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>

          <div className="flex items-center space-x-2">
            <Checkbox id="rememberDevice" checked={rememberDevice} onCheckedChange={(checked) => setRememberDevice(Boolean(checked))} />
            <Label htmlFor="rememberDevice" className="text-sm font-normal text-muted-foreground">
              Não pedir códigos novamente neste dispositivo
            </Label>
          </div>
        </div>
        <div className="mt-auto space-y-3 pt-6">
          <Button onClick={() => router.push("/login")} variant="outline" className="w-full" disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleVerifyCode} className="w-full" disabled={isLoading || otpCode.length !== 6}>
            {isLoading ? <LoadingSpinner size="sm" className="mr-2" /> : <CheckCircle className="mr-2 h-4 w-4" />}
            Verificar
          </Button>
        </div>
      </CardContent>
      <CardFooter className="p-4 border-t bg-muted">
        {/* Assuming new onboarding flow: 1. Verify Email, 2. Terms, 3. Role, 4. Data, 5. Kako ID Link */}
        <OnboardingStepper steps={onboardingStepLabels} currentStep={1} />
      </CardFooter>
    </>
  );
}

export default function VerifyEmailCodePage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen"><LoadingSpinner size="lg"/></div>}>
      <VerifyEmailCodeContent />
    </Suspense>
  );
}
