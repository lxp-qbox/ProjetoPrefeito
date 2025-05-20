
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
import { Users, Gamepad2, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { db, doc, updateDoc, serverTimestamp } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/ui/loading-spinner";
import Link from "next/link";
import type { UserProfile } from "@/types";

export default function RoleSelectionPage() {
  const [isLoading, setIsLoading] = useState(false);
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
      router.push("/onboarding/terms");
    } catch (error) {
      console.error("Erro ao salvar função:", error);
      toast({
        title: "Erro ao Salvar",
        description: "Não foi possível salvar sua função. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-lg shadow-xl flex flex-col max-h-[calc(100%-2rem)] overflow-hidden">
      {/* No back button for the very first onboarding step based on image */}
      <CardHeader className="text-center pt-10 pb-4">
        <CardTitle className="text-3xl font-bold">Olá!</CardTitle>
        <CardDescription className="mt-2">
          Para começar, escolha como você pretende utilizar sua conta:
        </CardDescription>
      </CardHeader>
      <Separator className="mb-6" />
      <CardContent className="flex-grow px-6 pt-0 pb-6 flex flex-col items-center justify-center">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
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
            <h3 className="text-xl font-semibold mb-2">Sou host.</h3>
            <p className="text-sm text-muted-foreground">
              Faço parte da agência e quero gerenciar jogos e eventos.
            </p>
            {isLoading && <LoadingSpinner size="sm" className="mt-3" />}
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
            <h3 className="text-xl font-semibold mb-2">Sou participante.</h3>
            <p className="text-sm text-muted-foreground">
              Quero participar dos jogos e eventos da agência.
            </p>
            {isLoading && <LoadingSpinner size="sm" className="mt-3" />}
          </Card>
        </div>
      </CardContent>
      {/* Stepper UI from image omitted for now */}
    </Card>
  );
}
