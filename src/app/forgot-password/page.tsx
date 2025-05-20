
"use client";

import ForgotPasswordForm from "@/components/auth/forgot-password-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { KeyRound } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function ForgotPasswordPage() {
  return (
    <div className="flex justify-center items-center h-screen p-4 bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 overflow-hidden">
      <Card className="w-full max-w-md shadow-xl flex flex-col max-h-[calc(100%-2rem)] aspect-[9/16] overflow-hidden">
        <CardHeader className="h-[200px] flex flex-col justify-center items-center text-center px-6 pb-0">
          <div className="inline-block p-3 bg-primary/10 rounded-full mb-4 mx-auto">
            <KeyRound className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Esqueceu a Senha</CardTitle>
          <CardDescription>
            Digite seu email para receber<br />um link de redefinição.
          </CardDescription>
        </CardHeader>
        <Separator className="my-6" />
        <CardContent className="flex-grow px-6 pt-0 pb-6 overflow-y-auto">
          <ForgotPasswordForm />
          <p className="mt-6 text-center text-sm">
            Lembrou sua senha?{" "}
            <Link href="/login" className="font-medium text-primary no-underline hover:underline">
              Entrar
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
