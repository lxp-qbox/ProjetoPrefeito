
"use client";

import React from "react"; // Ensure React is imported for JSX
import ProtectedPage from "@/components/auth/protected-page";
import { useAuth } from "@/hooks/use-auth";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { Button } from "@/components/ui/button"; // Keep button for logout
import { LogOut } from "lucide-react"; // Keep for logout
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { currentUser, logout } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      toast({ title: "Sessão Encerrada", description: "Você foi desconectado com sucesso." });
      router.push("/");
    } catch (error: any) {
      toast({ title: "Falha ao Sair", description: error.message, variant: "destructive" });
    }
  };

  if (!currentUser) {
    return (
      <div className="p-6 flex justify-center items-center h-full">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <ProtectedPage>
      <div className="flex flex-col h-full p-6 items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">Página de Perfil (Simplificada)</h1>
        <p className="mb-2">Nome: {currentUser.profileName || currentUser.displayName || "N/A"}</p>
        <p className="mb-4">Email: {currentUser.email || "N/A"}</p>
        <Button onClick={handleLogout} variant="outline">
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </Button>
        <p className="mt-6 text-sm text-muted-foreground">
          Esta é uma versão simplificada para depuração.
        </p>
      </div>
    </ProtectedPage>
  );
}
