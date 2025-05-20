
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench } from "lucide-react";
import Link from "next/link";

export default function MaintenancePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
            <div className="inline-block p-4 bg-primary/10 rounded-full mb-4 mx-auto">
                <Wrench className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-3xl font-bold">Em Manutenção</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <CardDescription className="text-lg text-muted-foreground">
            Desculpe, esta área do site está temporariamente indisponível.
            <br />
            Estamos trabalhando para melhorá-la!
          </CardDescription>
          <p className="text-sm text-muted-foreground">
            Por favor, tente novamente mais tarde.
          </p>
          <Button asChild className="mt-6">
            <Link href="/">Voltar para Início</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
