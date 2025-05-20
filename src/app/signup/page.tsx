
"use client";

import SignupForm from "@/components/auth/signup-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import Link from "next/link";
import { UserPlus, ArrowLeft } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

export default function SignupPage() {
  return (
    <div className="flex justify-center items-center h-screen p-4 bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 overflow-hidden">
      <Card className="w-full max-w-md shadow-xl relative flex flex-col max-h-[calc(100%-2rem)] aspect-[9/16] overflow-hidden">
        <Button
            asChild
            variant="ghost"
            size="icon"
            className="absolute top-4 left-4 z-10 h-12 w-12 rounded-full text-muted-foreground hover:bg-muted hover:text-primary transition-colors"
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
          <CardTitle className="text-2xl font-bold">Criar Conta</CardTitle>
          <CardDescription>
            Junte-se à The Presidential Agency<br />hoje!
            </CardDescription>
        </CardHeader>
        <Separator className="my-6" />
        <CardContent className="flex-grow px-6 pt-0 pb-6 overflow-y-auto">
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
