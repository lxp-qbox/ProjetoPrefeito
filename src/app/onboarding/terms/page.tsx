
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { db, doc, updateDoc, serverTimestamp } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { FileText, CheckCircle } from "lucide-react";
import LoadingSpinner from "@/components/ui/loading-spinner";

export default function TermsPage() {
  const [agreed, setAgreed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const placeholderTerms = `
Bem-vindo à The Presidential Agency!
Estes termos e condições descrevem as regras e regulamentos para o uso do website da The Presidential Agency.
Ao acessar este website, presumimos que você aceita estes termos e condições na íntegra. Não continue a usar o website da The Presidential Agency se você não aceitar todos os termos e condições declarados nesta página.

Cookies:
O website usa cookies para ajudar a personalizar sua experiência online. Ao usar o website da The Presidential Agency, você concorda com o uso dos cookies necessários.

Licença:
Salvo indicação em contrário, The Presidential Agency e/ou seus licenciadores detêm os direitos de propriedade intelectual de todo o material no The Presidential Agency. Todos os direitos de propriedade intelectual são reservados. Você pode visualizar e/ou imprimir páginas de https://presidential.agency para seu uso pessoal, sujeito às restrições estabelecidas nestes termos e condições.

Você não deve:
Republicar material de https://presidential.agency
Vender, alugar ou sublicenciar material de https://presidential.agency
Reproduzir, duplicar ou copiar material de https://presidential.agency
Redistribuir conteúdo da The Presidential Agency (a menos que o conteúdo seja especificamente feito para redistribuição).

Política de Privacidade:
Nossa Política de Privacidade rege o uso de informações pessoais que coletamos de você ou que você nos fornece. Ao usar nosso website, você concorda com tal processamento e garante que todos os dados fornecidos por você são precisos.

Este é um texto de placeholder. Em uma aplicação real, este seria substituído pelos termos de uso e política de privacidade completos.
É crucial que você leia e entenda nossos termos completos antes de prosseguir.
Obrigado por se juntar à The Presidential Agency! Esperamos que você aproveite nossos serviços.
  `.trim().repeat(3); // Repeat for scrollability

  const handleContinue = async () => {
    if (!currentUser) {
      toast({ title: "Erro", description: "Você precisa estar logado.", variant: "destructive" });
      router.push("/login");
      return;
    }
    if (!agreed) {
      toast({ title: "Atenção", description: "Você precisa concordar com os termos para continuar.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const userDocRef = doc(db, "users", currentUser.uid);
      await updateDoc(userDocRef, {
        agreedToTermsAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast({ title: "Termos Aceitos", description: "Obrigado por aceitar os termos." });
      // For now, redirect to profile. The next onboarding step (age verification) isn't built.
      // router.push("/onboarding/age-verification"); 
      router.push("/profile"); 
    } catch (error) {
      console.error("Erro ao salvar aceite dos termos:", error);
      toast({ title: "Erro ao Salvar", description: "Não foi possível salvar sua concordância. Tente novamente.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-xl flex flex-col max-h-[calc(100%-2rem)] overflow-hidden">
      <CardHeader className="text-center pt-10 pb-4">
        <div className="inline-block p-3 bg-primary/10 rounded-full mb-3 mx-auto">
          <FileText className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-2xl font-bold">Termos de Uso e Privacidade</CardTitle>
        <CardDescription>Por favor, leia e aceite nossos termos para continuar.</CardDescription>
      </CardHeader>
      <Separator className="mb-4" />
      <CardContent className="flex-grow px-6 py-0 flex flex-col"> {/* Ensure CardContent is flex-col if ScrollArea is not h-full */}
        <ScrollArea className="w-full rounded-md border p-4 text-sm text-muted-foreground bg-background/30 h-[300px]"> {/* Changed h-full to h-[300px] */}
          <pre className="whitespace-pre-wrap break-words font-sans">{placeholderTerms}</pre>
        </ScrollArea>
        <div className="flex items-center space-x-2 mt-4 mb-2"> {/* Added margin for spacing */}
          <Checkbox id="terms" checked={agreed} onCheckedChange={(checked) => setAgreed(Boolean(checked))} />
          <Label htmlFor="terms" className="text-sm font-normal text-muted-foreground cursor-pointer">
            Li e concordo com os Termos de Uso e Política de Privacidade.
          </Label>
        </div>
      </CardContent>
      <CardFooter className="p-6 border-t mt-auto">
        <Button onClick={handleContinue} className="w-full" disabled={!agreed || isLoading}>
          {isLoading ? <LoadingSpinner size="sm" className="mr-2" /> : <CheckCircle className="mr-2 h-4 w-4" />}
          Continuar
        </Button>
      </CardFooter>
    </Card>
  );
}
