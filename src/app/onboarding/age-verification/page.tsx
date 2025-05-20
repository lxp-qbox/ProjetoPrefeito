
"use client";

import { useState, useEffect } from "react";
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
import { countries } from "@/lib/countries";
import { CalendarIcon as LucideCalendarIcon, CheckCircle, AlertTriangle, Users as UsersIcon, MapPin } from "lucide-react"; // Added UsersIcon and MapPin for consistency
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { db, doc, updateDoc, serverTimestamp } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { format, subYears, isValid, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function AgeVerificationPage() {
  const [selectedCountry, setSelectedCountry] = useState<string | undefined>(undefined);
  const [selectedGender, setSelectedGender] = useState<UserProfile['gender'] | undefined>(undefined);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [showUnderageAlert, setShowUnderageAlert] = useState(false);
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

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (showUnderageAlert) {
      setShowUnderageAlert(false); // Reset alert when date changes
    }
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
    if (!selectedCountry) {
      toast({
        title: "Atenção",
        description: "Por favor, selecione seu país.",
        variant: "destructive",
      });
      return;
    }

    const age = calculateAge(selectedDate);
    if (age < 18) {
      setShowUnderageAlert(true);
      return;
    }
    setShowUnderageAlert(false); 

    setIsLoading(true);
    try {
      const userDocRef = doc(db, "users", currentUser.uid);
      await updateDoc(userDocRef, {
        country: selectedCountry,
        gender: selectedGender,
        birthDate: format(selectedDate, "yyyy-MM-dd"),
        updatedAt: serverTimestamp(),
      });
      toast({
        title: "Informações Salvas",
        description: "Suas informações foram registradas com sucesso.",
      });
      router.push("/onboarding/kako-account-check");
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

  const maxCalendarDate = new Date();
  const minCalendarDate = subYears(new Date(), 100);

  return (
    <Card className="w-full max-w-md shadow-xl flex flex-col max-h-[calc(100%-2rem)] aspect-[9/16] md:aspect-auto overflow-hidden">
      <CardHeader className="text-center pt-10 pb-4">
        <div className="inline-block p-3 bg-primary/10 rounded-full mb-3 mx-auto">
          <LucideCalendarIcon className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-2xl font-bold">Informações Básicas</CardTitle>
        <CardDescription>
          Para prosseguir, por favor, informe seu sexo,<br />data de nascimento e país.
        </CardDescription>
      </CardHeader>
      <Separator className="mb-6" />
      <CardContent className="flex-grow px-6 pt-0 pb-6 flex flex-col items-center overflow-y-auto">
        <div className="w-full max-w-xs space-y-6">
          <div>
            <Label htmlFor="gender-select" className="text-sm font-medium mb-2 block text-left">
              Sexo
            </Label>
            <Select
              value={selectedGender}
              onValueChange={(value) => setSelectedGender(value as UserProfile['gender'])}
            >
              <SelectTrigger id="gender-select" className="w-full h-12 focus-visible:ring-0 focus-visible:ring-offset-0">
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
                    "w-full justify-start text-left font-normal h-12 focus-visible:ring-0 focus-visible:ring-offset-0",
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
                  onSelect={handleDateSelect} 
                  initialFocus
                  locale={ptBR}
                  captionLayout="dropdown-buttons"
                  fromYear={minCalendarDate.getFullYear()}
                  toYear={maxCalendarDate.getFullYear()}
                  defaultMonth={subYears(new Date(), 18)}
                  disabled={(date) => date > maxCalendarDate || date < minCalendarDate }
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label htmlFor="country-select" className="text-sm font-medium mb-2 block text-left">
              País
            </Label>
            <Select
              value={selectedCountry}
              onValueChange={(value) => setSelectedCountry(value)}
            >
              <SelectTrigger id="country-select" className="w-full h-12 focus-visible:ring-0 focus-visible:ring-offset-0">
                <SelectValue placeholder="Selecione seu país" />
              </SelectTrigger>
              <SelectContent>
                {countries.map((country) => (
                  <SelectItem key={country.code} value={country.name}>
                    {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {showUnderageAlert && (
            <Alert variant="destructive" className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Idade Insuficiente</AlertTitle>
              <AlertDescription>
                Você precisa ter pelo menos 18 anos para usar nossos serviços.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-6 border-t mt-auto">
        <Button
          onClick={handleContinue}
          className="w-full"
          disabled={!selectedCountry || !selectedGender || !selectedDate || isLoading}
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
