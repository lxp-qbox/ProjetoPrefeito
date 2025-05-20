
"use client";

import ProtectedPage from "@/components/auth/protected-page";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle } from "lucide-react";

export default function MessagesPage() {
  return (
    <ProtectedPage>
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <div className="inline-block p-3 bg-primary/10 rounded-full mb-4 mx-auto">
              <MessageCircle className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-3xl font-bold">Minhas Mensagens</CardTitle>
            <CardDescription>
              Veja e gerencie suas conversas aqui. (Funcionalidade em desenvolvimento)
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground">
              A caixa de entrada de mensagens e o chat em tempo real estarão disponíveis em breve!
            </p>
          </CardContent>
        </Card>
      </div>
    </ProtectedPage>
  );
}
