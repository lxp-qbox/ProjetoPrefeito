
import SignupForm from "@/components/auth/signup-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function SignupPage() {
  return (
    <div className="flex justify-center items-center h-screen p-4 bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 overflow-hidden">
      <Card className="w-full max-w-md shadow-xl relative flex flex-col max-h-[calc(100%-2rem)] aspect-[9/16] md:aspect-auto overflow-hidden">
        <CardHeader className="text-center pt-12 px-6 pb-0">
          <div className="inline-block p-3 bg-primary/10 rounded-full mb-4 mx-auto">
              <UserPlus className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold">Criar Conta</CardTitle>
          <CardDescription>Junte-se à The Presidential Agency hoje!</CardDescription>
        </CardHeader>
        <Separator className="my-6" />
        <CardContent className="flex-grow overflow-y-auto">
          <SignupForm />
        </CardContent>
        <CardFooter className="flex-col p-0">
          <div className="w-full border-t border-border" />
          <div className="w-full bg-muted p-6 text-center">
            <Link href="/login" className="text-sm font-medium no-underline hover:text-primary hover:underline">
              Já tem uma conta? Entrar
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
