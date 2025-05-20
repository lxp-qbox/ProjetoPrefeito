
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
import { Users, Gamepad2, Star, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { db, doc, updateDoc, serverTimestamp } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/ui/loading-spinner";
import Link from "next/link";
import type { UserProfile } from "@/types";
import OnboardingStepper from "@/components/onboarding/onboarding-stepper";

const onboardingStepLabels = ["Termos", "Função", "Dados", "Vínculo ID"];

export default function RoleSelectionPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingRole, setLoadingRole] = useState<UserProfile['role'] | null>(null);
  const router = useRouter();
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const handleRoleSelect = async (role: UserProfile['role']) => {
    if (!currentUser) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado.",
        variant: "destructive",
      });
      router.push("/login");
      return;
    }
    setLoadingRole(role);
    setIsLoading(true);
    try {
      const userDocRef = doc(db, "users", currentUser.uid);
      await updateDoc(userDocRef, {
        role: role,
        updatedAt: serverTimestamp(),
      });
      toast({
        title: "Função Selecionada",
        description: `Sua função foi definida como ${role === 'host' ? 'Anfitrião' : 'Participante'}.`,
      });
      router.push("/onboarding/age-verification");
    } catch (error) {
      console.error("Erro ao salvar função:", error);
      toast({
        title: "Erro ao Salvar",
        description: "Não foi possível salvar sua função. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setLoadingRole(null);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-xl flex flex-col max-h-[calc(100%-2rem)] aspect-[9/16] overflow-hidden">
       <Button
            asChild
            variant="ghost"
            size="icon"
            className="absolute top-4 left-4 z-10 h-12 w-12 rounded-full text-muted-foreground hover:bg-muted hover:text-primary transition-colors"
            title="Voltar para Termos"
        >
            <Link href="/onboarding/terms">
                <ArrowLeft className="h-8 w-8" />
                <span className="sr-only">Voltar</span>
            </Link>
        </Button>
      <CardHeader className="h-[200px] flex flex-col justify-center items-center text-center px-6 pt-[60px] pb-0">
        <div className="inline-block p-3 bg-primary/10 rounded-full mb-4 mx-auto">
          <Star className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-2xl font-bold">Olá!</CardTitle>
        <CardDescription>
          Para começar, escolha como você<br />pretende utilizar sua conta:
        </CardDescription>
      </CardHeader>
      <Separator className="my-6" />
      <CardContent className="flex-grow px-6 pt-0 pb-6 flex flex-col justify-center overflow-y-auto">
        <div className="grid grid-cols-1 gap-6 w-full">
          <Card
            className="p-6 flex flex-col items-center text-center cursor-pointer hover:shadow-lg transition-shadow transform hover:scale-105"
            onClick={() => !isLoading && handleRoleSelect('host')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleRoleSelect('host')}
            aria-disabled={isLoading}
          >
            <div className="p-3 bg-primary/10 rounded-full mb-4">
              <Users className="h-10 w-10 text-primary" />
            </div>
            {isLoading && loadingRole === 'host' ? (
              <LoadingSpinner size="md" className="my-3" />
            ) : (
              <>
                <h3 className="text-xl font-semibold mb-2">Sou host.</h3>
                <p className="text-sm text-muted-foreground">
                  Faço parte da agência do Presidente
                </p>
              </>
            )}
          </Card>

          <Card
            className="p-6 flex flex-col items-center text-center cursor-pointer hover:shadow-lg transition-shadow transform hover:scale-105"
            onClick={() => !isLoading && handleRoleSelect('player')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleRoleSelect('player')}
            aria-disabled={isLoading}
          >
            <div className="p-3 bg-primary/10 rounded-full mb-4">
              <Gamepad2 className="h-10 w-10 text-primary" />
            </div>
            {isLoading && loadingRole === 'player' ? (
              <LoadingSpinner size="md" className="my-3" />
            ) : (
              <>
                <h3 className="text-xl font-semibold mb-2">Sou participante.</h3>
                <p className="text-sm text-muted-foreground">
                  Quero participar dos jogos
                </p>
              </>
            )}
          </Card>
        </div>
      </CardContent>
       <CardFooter className="p-4 border-t bg-muted">
        <OnboardingStepper steps={onboardingStepLabels} currentStep={2} />
      </CardFooter>
    </Card>
  );
}
