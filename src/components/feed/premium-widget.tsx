"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function PremiumWidget() {
  return (
    <Card className="bg-muted border-none rounded-xl">
      <CardHeader className="p-4">
        <CardTitle className="text-xl font-bold">Assine o Premium</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <CardDescription className="text-sm mb-3">
          Assine para desbloquear novos recursos e, se elegível, receba uma parte da receita.
        </CardDescription>
        <Button 
          size="sm" 
          className="rounded-full font-semibold px-4 py-1.5 h-auto text-sm bg-primary text-primary-foreground hover:bg-primary/90"
          aria-label="Experimente grátis"
        >
          Experimente grátis
        </Button>
      </CardContent>
    </Card>
  );
} 