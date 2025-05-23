
"use client";

import SignupForm from "@/components/auth/signup-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import Link from "next/link";
import { UserPlus, ArrowLeft } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import OnboardingStepper from "@/components/onboarding/onboarding-stepper";

const onboardingStepLabels = ["Termos", "Função", "Dados", "Vínculo ID"];


export default function SignupPage() {
  const isMobile = useIsMobile();

  return (
    <div className={cn(
      "flex justify-center items-center h-screen overflow-hidden",
      !isMobile && "p-4 bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900",
      isMobile && "bg-white p-0"
    )}>
      <Card className={cn(
        "w-full max-w-md flex flex-col overflow-hidden",
        !isMobile && "shadow-xl max-h-[calc(100%-2rem)] aspect-[9/16]",
        isMobile && "h-full shadow-none rounded-none"
      )}>
        <Button
            asChild
            variant="ghost"
            size="icon"
            className="absolute top-4 left-4 z-10 h-12 w-12 rounded-full text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
            title="Voltar para Login"
        >
            <Link href="/login">
                <ArrowLeft className="h-8 w-8" />
                <span className="sr-only">Voltar</span>
            </Link>
        </Button>
        <CardHeader className="h-[200px] flex flex-col justify-center items-center text-center px-6 pb-0">
          <div className="inline-block p-3 bg-primary/10 rounded-full mb-4 mx-auto mt-8">
              <UserPlus className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Bem-vindo a White House!</CardTitle>
          <CardDescription>
            O Presidente te espera!
            </CardDescription>
        </CardHeader>
        <Separator className="my-6" />
        <CardContent className="flex-grow px-6 pt-0 pb-6 flex flex-col justify-center overflow-y-auto">
          <SignupForm />
        </CardContent>
        <CardFooter className="flex-col p-0">
          <div className="w-full border-t border-border" />
          <div className="w-full bg-muted p-6 text-center">
            <Link href="/login" className="text-sm font-medium no-underline hover:underline hover:text-primary">
              Já tem uma conta? Entrar
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
