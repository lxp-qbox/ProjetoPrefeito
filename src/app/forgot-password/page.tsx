
import ForgotPasswordForm from "@/components/auth/forgot-password-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { KeyRound } from "lucide-react";

export default function ForgotPasswordPage() {
  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-200px)] py-8 px-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="inline-block p-3 bg-primary/10 rounded-full mb-4 mx-auto">
            <KeyRound className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold">Esqueceu a Senha</CardTitle>
          <CardDescription>Digite seu email para receber um link de redefinição.</CardDescription>
        </CardHeader>
        <CardContent>
          <ForgotPasswordForm />
          <p className="mt-6 text-center text-sm">
            Lembrou sua senha?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Entrar
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
