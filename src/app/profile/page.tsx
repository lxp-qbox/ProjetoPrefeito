
"use client";

import ProtectedPage from "@/components/auth/protected-page";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Mail, UserCircle2, Edit3, ShieldCheck, Fingerprint, CalendarDays as LucideCalendarIcon, Save, Briefcase, Globe, Phone, Diamond } from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import type { UserProfile } from "@/types";
import { countries } from "@/lib/countries";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO, subYears, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { db, doc, updateDoc, serverTimestamp } from "@/lib/firebase";
import LoadingSpinner from "@/components/ui/loading-spinner";

const formatPhoneNumberForDisplay = (value: string): string => {
  if (!value.trim()) return "";

  const originalStartsWithPlus = value.charAt(0) === '+';
  // Remove all non-digits, except for a leading +
  let digitsOnly = (originalStartsWithPlus ? value.substring(1) : value).replace(/[^\d]/g, '');

  digitsOnly = digitsOnly.slice(0, 15); // Max 15 digits after potential plus
  const len = digitsOnly.length;

  if (len === 0) {
    return originalStartsWithPlus ? "+" : ""; // Return "+" if user typed only that, or "" if empty
  }

  let formatted = "+"; // Always start with + if there are digits

  if (len <= 2) { // Country code part, e.g., +55
    formatted += digitsOnly;
  } else if (len <= 4) { // Area code part, e.g., +55 (19
    formatted += `${digitsOnly.slice(0, 2)} (${digitsOnly.slice(2)})`;
  } else if (len <= 9) { // First part of main number, e.g., +55 (19) 99636 (for a 9-digit local number after area code)
    formatted += `${digitsOnly.slice(0, 2)} (${digitsOnly.slice(2, 4)}) ${digitsOnly.slice(4)}`;
  } else { // Second part of main number, and allows for longer numbers
             // e.g., +55 (19) 99636-4022 for 13 digits total after +
             // or   +55 (19) 99636-40221 for 14 digits total after +
    formatted += `${digitsOnly.slice(0, 2)} (${digitsOnly.slice(2, 4)}) ${digitsOnly.slice(4, 9)}-${digitsOnly.slice(9)}`;
  }
  return formatted;
};


export default function ProfilePage() {
  const { currentUser, logout } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [editableCountry, setEditableCountry] = useState<string | undefined>(undefined);
  const [editableGender, setEditableGender] = useState<UserProfile['gender'] | undefined>(undefined);
  const [editableBirthDate, setEditableBirthDate] = useState<Date | undefined>(undefined);
  const [editablePhoneNumber, setEditablePhoneNumber] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);


  useEffect(() => {
    if (currentUser) {
      setEditableCountry(currentUser.country || undefined);
      setEditableGender(currentUser.gender || 'preferNotToSay');
      setEditablePhoneNumber(formatPhoneNumberForDisplay(currentUser.phoneNumber || ""));
      if (currentUser.birthDate) {
        try {
            let parsedDate: Date | null = null;
            if (typeof currentUser.birthDate === 'string') {
              // Try parsing YYYY-MM-DD first
              const dateParts = currentUser.birthDate.split('-');
              if (dateParts.length === 3) {
                  const year = parseInt(dateParts[0], 10);
                  const month = parseInt(dateParts[1], 10) - 1; 
                  const day = parseInt(dateParts[2], 10);
                  if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
                    const tempDate = new Date(Date.UTC(year, month, day)); // Use UTC to avoid timezone shifts
                    if (isValid(tempDate)) parsedDate = tempDate;
                  }
              }
              // If YYYY-MM-DD parsing failed or wasn't the format, try ISO parsing
              if (!parsedDate || !isValid(parsedDate)) {
                  parsedDate = parseISO(currentUser.birthDate);
              }
            } else if (currentUser.birthDate instanceof Date) { 
              parsedDate = currentUser.birthDate;
            }
            // @ts-ignore Check for Firestore Timestamp-like object
            else if (currentUser.birthDate && typeof currentUser.birthDate.toDate === 'function') { 
                // @ts-ignore
                parsedDate = currentUser.birthDate.toDate();
            }
            
            if (parsedDate && isValid(parsedDate)) {
                 setEditableBirthDate(parsedDate);
            } else {
                console.warn("Could not parse birthDate from currentUser on profile page:", currentUser.birthDate);
                setEditableBirthDate(undefined);
            }
        } catch (error) {
            console.error("Error parsing birthDate from currentUser on profile page:", error);
            setEditableBirthDate(undefined);
        }
      } else {
        setEditableBirthDate(undefined);
      }
    }
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await logout();
      toast({ title: "Sessão Encerrada", description: "Você foi desconectado com sucesso." });
      router.push("/");
    } catch (error: any) {
      toast({ title: "Falha ao Sair", description: error.message, variant: "destructive" });
    }
  };

  const handleSaveProfile = async () => {
    if (!currentUser) {
      toast({ title: "Erro", description: "Usuário não encontrado.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    const dataToUpdate: Partial<UserProfile> = {
      updatedAt: serverTimestamp(),
    };

    if (editableCountry) dataToUpdate.country = editableCountry;
    if (editableGender) dataToUpdate.gender = editableGender;
    if (editableBirthDate) dataToUpdate.birthDate = format(editableBirthDate, "yyyy-MM-dd");
    if (editablePhoneNumber.trim()) dataToUpdate.phoneNumber = editablePhoneNumber.trim();
    // adminLevel is set during onboarding and not typically editable here by the user.

    try {
      const userDocRef = doc(db, "users", currentUser.uid);
      await updateDoc(userDocRef, dataToUpdate);
      toast({ title: "Perfil Atualizado", description: "Suas informações foram salvas." });
    } catch (error) {
      console.error("Erro ao salvar perfil:", error);
      toast({ title: "Erro ao Salvar", description: "Não foi possível salvar suas informações.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };


  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    const nameParts = name.split(' ');
    if (nameParts.length > 1 && nameParts[0] && nameParts[1]) {
      return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const displayName = currentUser?.profileName || currentUser?.displayName || "Usuário";
  const maxCalendarDate = new Date();
  const minCalendarDate = subYears(new Date(), 100);

  return (
    <ProtectedPage>
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <Avatar className="w-24 h-24 mx-auto mb-4 border-4 border-primary/50 shadow-md">
              <AvatarImage src={currentUser?.photoURL || undefined} alt={displayName} />
              <AvatarFallback className="text-3xl">{getInitials(displayName)}</AvatarFallback>
            </Avatar>
            <div className="flex items-center justify-center gap-2">
              <CardTitle className="text-3xl font-bold">
                {displayName}
              </CardTitle>
              {currentUser?.isVerified && <ShieldCheck className="h-7 w-7 text-primary" />}
            </div>
            <CardDescription>Gerencie os detalhes e preferências da sua conta.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-primary flex items-center">
                <UserCircle2 className="mr-2 h-5 w-5" /> Informações da Conta
              </h3>
              <div className="p-4 border rounded-md bg-muted/50 space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  <p className="flex items-center text-sm">
                    <Mail className="mr-2 h-4 w-4 text-muted-foreground flex-shrink-0" />
                    {currentUser?.email}
                  </p>
                </div>

                {currentUser?.kakoLiveId && (
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Passaporte KakoLive</Label>
                    <p className="flex items-center text-sm">
                      <Fingerprint className="mr-2 h-4 w-4 text-muted-foreground flex-shrink-0" />
                      {currentUser.kakoLiveId}
                    </p>
                  </div>
                )}
                <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Função</Label>
                    <div className="flex items-center text-sm">
                        <Briefcase className="mr-2 h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <Badge variant={currentUser?.role === 'admin' || currentUser?.role === 'master' ? 'destructive' : 'secondary'}>
                        {currentUser?.role}
                        </Badge>
                    </div>
                </div>
                {currentUser?.adminLevel && (
                  <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Nível Administrativo</Label>
                      <div className="flex items-center text-sm">
                          <Diamond className="mr-2 h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <Badge variant="destructive">
                          {currentUser.adminLevel.charAt(0).toUpperCase() + currentUser.adminLevel.slice(1)}
                          </Badge>
                      </div>
                  </div>
                )}
                
                <div className="space-y-1 pt-2">
                  <Label htmlFor="phone-number-profile" className="text-sm font-medium">Celular (WhatsApp)</Label>
                  <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                          id="phone-number-profile"
                          type="tel"
                          placeholder="+00 (00) 00000-0000"
                          value={editablePhoneNumber}
                          onChange={(e) => setEditablePhoneNumber(formatPhoneNumberForDisplay(e.target.value))}
                          className="pl-10 h-12"
                      />
                  </div>
                </div>

                <div className="space-y-1 pt-2">
                  <Label htmlFor="gender-select-profile" className="text-sm font-medium">Sexo</Label>
                  <Select
                    value={editableGender}
                    onValueChange={(value) => setEditableGender(value as UserProfile['gender'])}
                  >
                    <SelectTrigger id="gender-select-profile" className="w-full h-12 focus-visible:ring-0 focus-visible:ring-offset-0">
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

                <div className="space-y-1 pt-2">
                  <Label htmlFor="birthdate-picker-profile" className="text-sm font-medium">
                    Data de Nascimento
                  </Label>
                  <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        id="birthdate-picker-profile"
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal h-12 focus-visible:ring-0 focus-visible:ring-offset-0",
                          !editableBirthDate && "text-muted-foreground"
                        )}
                      >
                        <LucideCalendarIcon className="mr-2 h-4 w-4" />
                        {editableBirthDate ? (
                          format(editableBirthDate, "PPP", { locale: ptBR })
                        ) : (
                          <span>Selecione uma data</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={editableBirthDate}
                        onSelect={(date) => {
                           setEditableBirthDate(date);
                           if(date) setIsCalendarOpen(false);
                        }}
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
                
                <div className="space-y-1 pt-2">
                  <Label htmlFor="country-select-profile" className="text-sm font-medium">País</Label>
                  <Select
                    value={editableCountry}
                    onValueChange={(value) => setEditableCountry(value)}
                  >
                    <SelectTrigger id="country-select-profile" className="w-full h-12 focus-visible:ring-0 focus-visible:ring-offset-0">
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

                <p className="text-xs text-muted-foreground pt-1">
                  ID do Usuário: {currentUser?.uid}
                </p>
              </div>
            </div>
            
            <Button onClick={handleSaveProfile} className="w-full" disabled={isSaving}>
              {isSaving ? <LoadingSpinner size="sm" className="mr-2"/> : <Save className="mr-2 h-4 w-4" />}
              Salvar Alterações
            </Button>

            <p className="text-sm text-muted-foreground text-center">Mais funcionalidades de perfil, como edição detalhada, temas e upload de fotos, serão adicionadas em breve!</p>
            
            <Button variant="outline" className="w-full" disabled>
              <Edit3 className="mr-2 h-4 w-4" /> Editar Perfil Completo (Em breve)
            </Button>

            <Button variant="destructive" onClick={handleLogout} className="w-full">
              <LogOut className="mr-2 h-4 w-4" /> Sair
            </Button>
          </CardContent>
        </Card>
      </div>
    </ProtectedPage>
  );
}
