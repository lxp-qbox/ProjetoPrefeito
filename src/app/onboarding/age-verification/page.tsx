
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Card as ChoiceCard } from "@/components/ui/card";
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
import { CalendarDays, UserCheck, ArrowLeft, AlertTriangle, User as UserIcon, UserRound, CheckCircle, Phone, HelpCircle, Globe } from "lucide-react"; // Added Globe
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { db, doc, updateDoc, serverTimestamp } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { format, subYears, isValid, parse, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import OnboardingStepper from "@/components/onboarding/onboarding-stepper";

const onboardingStepLabels = ["Termos", "Função", "Dados", "Contato", "Vínculo ID"];

export default function AgeVerificationPage() {
  const [username, setUsername] = useState<string>("");
  const [selectedCountry, setSelectedCountry] = useState<string>("Brasil"); // Default to Brasil
  const [selectedGender, setSelectedGender] = useState<UserProfile['gender'] | undefined>(undefined);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  
  const [isLoading, setIsLoading] = useState(false);
  const [showUnderageAlert, setShowUnderageAlert] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  const router = useRouter();
  const { currentUser, refreshUserProfile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (currentUser) {
      setUsername(currentUser.profileName || currentUser.displayName || "");
      setSelectedCountry(currentUser.country || "Brasil");
      setSelectedGender(currentUser.gender || undefined);

      if (currentUser.birthDate) {
        try {
          let parsedDate: Date | null = null;
          if (typeof currentUser.birthDate === 'string') {
             if (currentUser.birthDate.includes('-') && currentUser.birthDate.length === 10) { 
                parsedDate = parse(currentUser.birthDate, "yyyy-MM-dd", new Date());
            } else if (currentUser.birthDate.includes('/') && currentUser.birthDate.length === 10) { 
                parsedDate = parse(currentUser.birthDate, "dd/MM/yyyy", new Date());
            }
             if (!parsedDate || !isValid(parsedDate)) { 
                const isoDate = parseISO(currentUser.birthDate);
                if (isValid(isoDate)) parsedDate = isoDate;
            }
          } else if ((currentUser.birthDate as any)?.toDate) { 
            parsedDate = (currentUser.birthDate as any).toDate();
          } else if (currentUser.birthDate instanceof Date) {
            parsedDate = currentUser.birthDate;
          }
          
          if (parsedDate && isValid(parsedDate)) {
            setSelectedDate(parsedDate);
          }
        } catch (error) {
          console.error("Error parsing birthDate from currentUser:", error);
        }
      }
    }
  }, [currentUser]);

  console.log("AgeVerificationPage RENDER. States:", {
    username: username,
    trimmedUsernameIsEmpty: !username.trim(),
    selectedGender: selectedGender,
    isGenderFalsy: !selectedGender,
    selectedDate: selectedDate,
    isDateFalsy: !selectedDate,
    selectedCountry: selectedCountry,
    isCountryFalsy: !selectedCountry,
    isLoading: isLoading,
    buttonDisabled: !username.trim() || !selectedGender || !selectedDate || !selectedCountry || isLoading
  });


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
      toast({ title: "Erro", description: "Você precisa estar logado.", variant: "destructive" });
      router.push("/login");
      return;
    }
    if (!username.trim()) {
      toast({ title: "Atenção", description: "Por favor, informe seu nome de usuário.", variant: "destructive" });
      return;
    }
    if (!selectedGender) {
      toast({ title: "Atenção", description: "Por favor, selecione seu sexo.", variant: "destructive" });
      return;
    }
    if (!selectedDate) {
      toast({ title: "Atenção", description: "Por favor, selecione sua data de nascimento.", variant: "destructive" });
      return;
    }
    if (!selectedCountry) {
      toast({ title: "Atenção", description: "Por favor, selecione seu país.", variant: "destructive" });
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
      const userDocRef = doc(db, "accounts", currentUser.uid);
      const dataToUpdate: Partial<UserProfile> = {
        profileName: username.trim(),
        displayName: username.trim(),
        country: selectedCountry,
        gender: selectedGender,
        birthDate: format(selectedDate, "yyyy-MM-dd"),
        updatedAt: serverTimestamp(),
      };

      await updateDoc(userDocRef, dataToUpdate);
      await refreshUserProfile(); // Refresh context

      toast({
        title: "Informações Salvas",
        description: "Seus dados foram registrados com sucesso.",
      });
      
      // Navigate to next step (Contact Info)
      router.push("/onboarding/contact-info");

    } catch (error) {
      console.error("Erro ao salvar informações:", error);
      toast({
        title: "Erro ao Salvar",
        description: "Não foi possível salvar suas informações. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const maxCalendarDate = new Date();
  const minCalendarDate = subYears(new Date(), 100);

  if (!currentUser && !isLoading) { 
    return (
      <div className="flex-grow flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <>
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
          <UserCheck className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-2xl font-bold">Informações Básicas</CardTitle>
        <CardDescription>
         Para prosseguir, preencha<br />as informacoes abaixo
        </CardDescription>
      </CardHeader>
      <Separator className="my-6" />
      <CardContent className="flex-grow px-6 pt-0 pb-6 flex flex-col overflow-y-auto">
        <div className="w-full max-w-xs mx-auto space-y-4 my-auto">
          
          <div className="space-y-1">
            <Label htmlFor="username" className="text-sm font-medium mb-1 block text-left">
              Nome de Usuário
            </Label>
            <Input
              id="username"
              placeholder="Seu nome de usuário"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="h-12"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-sm font-medium mb-1 block text-left">
              Sexo
            </Label>
            <div className="flex items-center space-x-2">
              <Button
                type="button"
                variant={selectedGender === 'male' ? 'default' : 'outline'}
                onClick={() => setSelectedGender('male')}
                className={cn("flex-1 h-12", selectedGender === 'male' && "border-2 border-primary ring-2 ring-primary/30")}
              >
                <UserIcon className="mr-2 h-5 w-5" /> Masculino
              </Button>
              <Button
                type="button"
                variant={selectedGender === 'female' ? 'default' : 'outline'}
                onClick={() => setSelectedGender('female')}
                className={cn("flex-1 h-12", selectedGender === 'female' && "border-2 border-primary ring-2 ring-primary/30")}
              >
                <UserRound className="mr-2 h-5 w-5" /> Feminino
              </Button>
            </div>
          </div>

          <div className="space-y-1">
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
                  defaultMonth={selectedDate || subYears(new Date(), 18)}
                  disabled={(date) => date > maxCalendarDate || date < minCalendarDate }
                />
              </PopoverContent>
            </Popover>
          </div>

           <div className="space-y-1">
            <Label htmlFor="country-select" className="text-sm font-medium mb-1 block text-left">
              País
            </Label>
            <Select
              value={selectedCountry}
              onValueChange={(value) => setSelectedCountry(value)}
            >
              <SelectTrigger id="country-select" className="w-full h-12 focus-visible:ring-0 focus-visible:ring-offset-0">
                 <Globe className="mr-2 h-4 w-4 text-muted-foreground" />
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
        </div>
         
        {showUnderageAlert && (
          <Alert variant="destructive" className="mt-4 max-w-xs mx-auto">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Idade Insuficiente</AlertTitle>
            <AlertDescription>
              Você precisa ter pelo menos 18 anos para usar nossos serviços.
            </AlertDescription>
          </Alert>
        )}

        <Button
          onClick={handleContinue}
          className="w-full mt-4" 
          disabled={!username.trim() || !selectedGender || !selectedDate || !selectedCountry || isLoading}
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
    </>
  );
}


    