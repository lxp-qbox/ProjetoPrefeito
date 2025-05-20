
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { UserProfile } from "@/types";
import { CalendarIcon as LucideCalendarIcon, CheckCircle, AlertTriangle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { db, doc, updateDoc, serverTimestamp } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { format, subYears } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";

export default function AgeVerificationPage() {
  const [selectedGender, setSelectedGender] = useState<UserProfile['gender'] | undefined>(undefined);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [confirmedOver18, setConfirmedOver18] = useState(false);
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
    if (!selectedGender) {
      toast({
        title: "Atenção",
        description: "Por favor, selecione seu sexo.",
        variant: "destructive",
      });
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
    if (!confirmedOver18) {
      toast({
        title: "Confirmação Necessária",
        description: "Por favor, confirme que você tem 18 anos ou mais.",
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
        gender: selectedGender,
        birthDate: format(selectedDate, "yyyy-MM-dd"),
        updatedAt: serverTimestamp(),
      });
      toast({
        title: "Informações Salvas",
        description: "Suas informações foram registradas com sucesso.",
      });
      router.push("/profile"); 
    } catch (error) {
      console.error("Erro ao salvar informações:", error);
      toast({
        title: "Erro ao Salvar",
        description:
          "Não foi possível salvar suas informações. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const maxDate = new Date(); 
  const minDate = subYears(new Date(), 100); 

  return (
    <Card className="w-full max-w-md shadow-xl flex flex-col max-h-[calc(100%-2rem)] overflow-hidden">
      <CardHeader className="text-center pt-10 pb-4">
        <div className="inline-block p-3 bg-primary/10 rounded-full mb-3 mx-auto">
          <LucideCalendarIcon className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-2xl font-bold">Informações Básicas</CardTitle>
        <CardDescription>
          Para prosseguir, por favor, informe seu sexo <br /> e data de nascimento.
        </CardDescription>
      </CardHeader>
      <Separator className="mb-6" />
      <CardContent className="flex-grow px-6 py-0 flex flex-col items-center overflow-y-auto">
        <div className="w-full max-w-xs space-y-6">
          
          <div>
            <Label htmlFor="gender-select" className="text-sm font-medium mb-2 block text-left">
              Sexo
            </Label>
            <Select
              value={selectedGender}
              onValueChange={(value) => setSelectedGender(value as UserProfile['gender'])}
            >
              <SelectTrigger id="gender-select" className="w-full h-12">
                <SelectValue placeholder="Selecione seu sexo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Masculino</SelectItem>
                <SelectItem value="female">Feminino</SelectItem>
                <SelectItem value="other">Outro</SelectItem>
                <SelectItem value="preferNotToSay">Prefiro não dizer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="birthdate-picker" className="text-sm font-medium mb-2 block text-left">
              Data de Nascimento
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="birthdate-picker"
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal h-12 focus-visible:ring-0 focus-visible:ring-offset-0", // Added focus ring removal
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
                  defaultMonth={subYears(new Date(), 18)} 
                  disabled={(date) => date > new Date() || date < minDate }
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <Checkbox 
              id="confirm-age" 
              checked={confirmedOver18} 
              onCheckedChange={(checked) => setConfirmedOver18(Boolean(checked))}
            />
            <Label htmlFor="confirm-age" className="text-sm font-normal text-muted-foreground cursor-pointer">
              Confirmo que tenho 18 anos ou mais.
            </Label>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-6 border-t mt-auto">
        <Button
          onClick={handleContinue}
          className="w-full"
          disabled={!selectedGender || !selectedDate || !confirmedOver18 || isLoading}
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
