
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
import { CalendarDays, CheckCircle, ArrowLeft, AlertTriangle, Phone } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { db, doc, updateDoc, serverTimestamp } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { format, subYears, isValid, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";
import OnboardingStepper from "@/components/onboarding/onboarding-stepper";

const onboardingStepLabels = ["Termos", "Função", "Dados", "Vínculo ID"];

export default function AgeVerificationPage() {
  const [selectedCountry, setSelectedCountry] = useState<string | undefined>("Brasil");
  const [selectedGender, setSelectedGender] = useState<UserProfile['gender'] | undefined>(undefined);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [showUnderageAlert, setShowUnderageAlert] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
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
      setShowUnderageAlert(false); 
    }
    if (date) {
      setIsCalendarOpen(false);
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
    if (!phoneNumber.trim()) {
      toast({
        title: "Atenção",
        description: "Por favor, informe seu número de celular.",
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
      const dataToUpdate: Partial<UserProfile> = {
        country: selectedCountry,
        gender: selectedGender,
        birthDate: format(selectedDate, "yyyy-MM-dd"),
        phoneNumber: phoneNumber.trim(),
        updatedAt: serverTimestamp(),
      };

      await updateDoc(userDocRef, dataToUpdate);
      toast({
        title: "Informações Salvas",
        description: "Suas informações foram registradas com sucesso.",
      });

      if (currentUser.role === 'host') {
        router.push("/onboarding/kako-id-input");
      } else if (currentUser.role === 'player') {
        router.push("/onboarding/kako-account-check");
      } else {
        router.push("/profile"); 
      }
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
    <Card className="w-full max-w-md shadow-xl flex flex-col max-h-[calc(100%-2rem)] aspect-[9/16] overflow-hidden">
      <Button
        asChild
        variant="ghost"
        size="icon"
        className="absolute top-4 left-4 z-10 h-12 w-12 rounded-full text-muted-foreground hover:bg-muted hover:text-primary transition-colors"
        title="Voltar"
      >
        <Link href="/onboarding/role-selection">
          <ArrowLeft className="h-8 w-8" />
          <span className="sr-only">Voltar</span>
        </Link>
      </Button>
      <CardHeader className="h-[200px] flex flex-col justify-center items-center text-center px-6 pb-0">
        <div className="inline-block p-3 bg-primary/10 rounded-full mb-4 mx-auto mt-8">
          <CalendarDays className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-2xl font-bold">Informações Básicas</CardTitle>
        <CardDescription>
          Para prosseguir, por favor, informe seu sexo,
          <br />
          data de nascimento, país e celular.
        </CardDescription>
      </CardHeader>
      <Separator className="my-6" />
      <CardContent className="flex-grow px-6 pt-0 pb-6 flex flex-col overflow-y-auto">
        <div className="w-full max-w-xs mx-auto space-y-4">
          <div>
            <Label htmlFor="gender-select" className="text-sm font-medium mb-1 block text-left">
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
            <Label htmlFor="birthdate-picker" className="text-sm font-medium mb-1 block text-left">
              Data de Nascimento
            </Label>
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  id="birthdate-picker"
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal h-12 focus-visible:ring-0 focus-visible:ring-offset-0",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarDays className="mr-2 h-4 w-4" />
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
            <Label htmlFor="country-select" className="text-sm font-medium mb-1 block text-left">
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

          <div>
            <Label htmlFor="phone-number" className="text-sm font-medium mb-1 block text-left">
              Celular (WhatsApp)
            </Label>
            <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    id="phone-number"
                    type="tel"
                    placeholder="+55 11 91234-5678"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="pl-10"
                />
            </div>
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
         <Button
          onClick={handleContinue}
          className="w-full mt-auto"
          disabled={!selectedCountry || !selectedGender || !selectedDate || !phoneNumber.trim() || isLoading}
        >
          {isLoading ? (
            <LoadingSpinner size="sm" className="mr-2" />
          ) : (
            <CheckCircle className="mr-2 h-4 w-4" />
          )}
          Continuar
        </Button>
      </CardContent>
      <CardFooter className="p-4 border-t bg-muted">
        <OnboardingStepper steps={onboardingStepLabels} currentStep={3} />
      </CardFooter>
    </Card>
  );
}
