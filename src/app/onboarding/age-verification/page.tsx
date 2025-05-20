
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon as LucideCalendarIcon, CheckCircle, AlertTriangle } from "lucide-react"; // Renamed to avoid conflict
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { db, doc, updateDoc, serverTimestamp } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { format, subYears } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default function AgeVerificationPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const calculateAge = (birthDate: Date): number => {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleContinue = async () => {
    if (!currentUser) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado.",
        variant: "destructive",
      });
      router.push("/login");
      return;
    }
    if (!selectedDate) {
      toast({
        title: "Atenção",
        description: "Por favor, selecione sua data de nascimento.",
        variant: "destructive",
      });
      return;
    }

    const age = calculateAge(selectedDate);
    if (age < 18) {
      toast({
        title: "Verificação de Idade Falhou",
        description: "Você precisa ter pelo menos 18 anos para usar nossos serviços.",
        variant: "destructive",
        icon: <AlertTriangle className="h-5 w-5" />,
      });
      return;
    }

    setIsLoading(true);
    try {
      const userDocRef = doc(db, "users", currentUser.uid);
      await updateDoc(userDocRef, {
        birthDate: format(selectedDate, "yyyy-MM-dd"),
        updatedAt: serverTimestamp(),
        // Note: hasCompletedOnboarding is NOT set to true here.
        // It will be set at the end of the entire onboarding flow.
      });
      toast({
        title: "Data de Nascimento Salva",
        description: "Sua data de nascimento foi registrada com sucesso.",
      });
      // For now, redirect to profile. In a full flow, this would go to the next onboarding step.
      router.push("/profile");
    } catch (error) {
      console.error("Erro ao salvar data de nascimento:", error);
      toast({
        title: "Erro ao Salvar",
        description:
          "Não foi possível salvar sua data de nascimento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const maxDate = new Date(); // Today
  const minDate = subYears(new Date(), 100); // 100 years ago

  return (
    <Card className="w-full max-w-md shadow-xl flex flex-col max-h-[calc(100%-2rem)] overflow-hidden">
      <CardHeader className="text-center pt-10 pb-4">
        <div className="inline-block p-3 bg-primary/10 rounded-full mb-3 mx-auto">
          <LucideCalendarIcon className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-2xl font-bold">Data de Nascimento</CardTitle>
        <CardDescription>
          Para prosseguir, por favor, informe sua data de nascimento.
        </CardDescription>
      </CardHeader>
      <Separator className="mb-6" />
      <CardContent className="flex-grow px-6 py-0 flex flex-col items-center">
        <div className="w-full max-w-xs">
          <Label htmlFor="birthdate-picker" className="text-sm font-medium mb-2 block text-left">
            Selecione sua data
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="birthdate-picker"
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal h-12",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <LucideCalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? (
                  format(selectedDate, "PPP", { locale: ptBR })
                ) : (
                  <span>Selecione uma data</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                initialFocus
                locale={ptBR}
                captionLayout="dropdown-buttons"
                fromYear={minDate.getFullYear()}
                toYear={maxDate.getFullYear()}
                defaultMonth={subYears(new Date(), 18)} // Default to 18 years ago
                disabled={(date) => date > new Date() || date < minDate } // Disable future dates and dates too far in past
              />
            </PopoverContent>
          </Popover>
        </div>
      </CardContent>
      <CardFooter className="p-6 border-t mt-auto">
        <Button
          onClick={handleContinue}
          className="w-full"
          disabled={!selectedDate || isLoading}
        >
          {isLoading ? (
            <LoadingSpinner size="sm" className="mr-2" />
          ) : (
            <CheckCircle className="mr-2 h-4 w-4" />
          )}
          Continuar
        </Button>
      </CardFooter>
    </Card>
  );
}
