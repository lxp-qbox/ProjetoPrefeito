
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
import { CheckCircle, Phone } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { db, doc, updateDoc, serverTimestamp } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/ui/loading-spinner";

export default function KakoAccountCheckPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const handleHasAccount = () => {
    // For now, this step doesn't save anything specific yet, just navigates.
    // The kakoLiveId will be collected on the next page.
    router.push("/onboarding/kako-id-input"); // We'll create this next
  };

  const handleNeedsAccount = async () => {
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
        kakoLiveId: "", // Explicitly set to empty as they don't have one
        hasCompletedOnboarding: true, // Mark onboarding as complete for this path
        updatedAt: serverTimestamp(),
      });
      toast({
        title: "Onboarding Concluído",
        description: "Você pode explorar o aplicativo agora!",
      });
      router.push("/profile");
    } catch (error) {
      console.error("Erro ao finalizar onboarding:", error);
      toast({
        title: "Erro",
        description: "Não foi possível finalizar o onboarding. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-lg shadow-xl flex flex-col max-h-[calc(100%-2rem)] overflow-hidden">
      <CardHeader className="text-center pt-10 pb-4">
        <CardTitle className="text-2xl font-bold">Conta Kako Live</CardTitle>
        <CardDescription>
          Você já possui uma conta no aplicativo Kako Live?
        </CardDescription>
      </CardHeader>
      <Separator className="mb-6" />
      <CardContent className="flex-grow px-6 pt-0 pb-6 flex flex-col items-center justify-center">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          <Card
            className="p-6 flex flex-col items-center text-center cursor-pointer hover:shadow-lg transition-shadow"
            onClick={handleHasAccount}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleHasAccount()}
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
            className="p-6 flex flex-col items-center text-center cursor-pointer hover:shadow-lg transition-shadow"
            onClick={handleNeedsAccount}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleNeedsAccount()}
            disabled={isLoading}
          >
            <div className="p-3 bg-primary/10 rounded-full mb-3">
              <Phone className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Não, preciso criar</h3>
            <p className="text-sm text-muted-foreground">
              Ainda não tenho uma conta no aplicativo Kako Live
            </p>
            {isLoading && <LoadingSpinner size="sm" className="mt-2" />}
          </Card>
        </div>
      </CardContent>
      {/* No explicit footer button needed as choices are the main actions */}
    </Card>
  );
}
