
"use client";

import ProtectedPage from "@/components/auth/protected-page";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Mail, UserCircle2, Edit3, ShieldCheck, Fingerprint, CalendarDays as LucideCalendarIcon, Save, Briefcase, Globe, Phone, Diamond, MoreHorizontal, MessageSquare, MapPin, BookOpen, Home, Clock, Users, Package, Database, ThumbsUp, UserPlus, Image as ImageIcon, Settings as SettingsIcon } from "lucide-react";
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
import Image from "next/image";

const formatPhoneNumberForDisplay = (value: string): string => {
  if (!value.trim()) return "";

  const originalStartsWithPlus = value.charAt(0) === '+';
  let digitsOnly = (originalStartsWithPlus ? value.substring(1) : value).replace(/[^\d]/g, '');

  digitsOnly = digitsOnly.slice(0, 15); 
  const len = digitsOnly.length;

  if (len === 0) {
    return originalStartsWithPlus ? "+" : ""; 
  }

  let formatted = "+"; 

  if (len <= 2) { 
    formatted += digitsOnly;
  } else if (len <= 4) { 
    formatted += `${digitsOnly.slice(0, 2)} (${digitsOnly.slice(2)})`;
  } else if (len <= 9) { 
    formatted += `${digitsOnly.slice(0, 2)} (${digitsOnly.slice(2, 4)}) ${digitsOnly.slice(4)}`;
  } else { 
    formatted += `${digitsOnly.slice(0, 2)} (${digitsOnly.slice(2, 4)}) ${digitsOnly.slice(4, 9)}-${digitsOnly.slice(9)}`;
  }
  return formatted;
};

// Placeholder data for activity feed
const activityFeedItems = [
  { id: "1", icon: Users, title: "+1150 Seguidores", description: "Você está recebendo mais e mais seguidores, continue assim!", time: "10 hrs atrás", type: "follow" },
  { id: "2", icon: Package, title: "+3 Novos Produtos foram adicionados!", description: "Parabéns!", time: "2 hrs atrás", type: "product" },
  { id: "3", icon: Database, title: "Backup do banco de dados concluído!", description: "Baixe o backup mais recente.", time: "1 dia atrás", type: "system" },
  { id: "4", icon: ThumbsUp, title: "+290 Curtidas na Página", description: "Isso é ótimo, continue assim!", time: "1 dia atrás", type: "like" },
  { id: "5", icon: UserPlus, title: "+3 Pedidos de Amizade", description: "", time: "2 dias atrás", type: "friend_request", users: [{name: "User1", avatar: "https://placehold.co/32x32.png"}, {name: "User2", avatar: "https://placehold.co/32x32.png"}, {name: "User3", avatar: "https://placehold.co/32x32.png"}] },
  { id: "6", icon: ImageIcon, title: "+3 Novas fotos", description: "", time: "3 dias atrás", type: "photos", images: ["https://placehold.co/600x400.png", "https://placehold.co/600x400.png", "https://placehold.co/600x400.png"] },
  { id: "7", icon: SettingsIcon, title: "Sistema atualizado para v2.02", description: "Verifique o changelog completo na página de atividades.", time: "2 semanas atrás", type: "system_update" },
];

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
              const dateParts = currentUser.birthDate.split('-');
              if (dateParts.length === 3) {
                  const year = parseInt(dateParts[0], 10);
                  const month = parseInt(dateParts[1], 10) - 1; 
                  const day = parseInt(dateParts[2], 10);
                  if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
                    const tempDate = new Date(Date.UTC(year, month, day)); 
                    if (isValid(tempDate)) parsedDate = tempDate;
                  }
              }
              if (!parsedDate || !isValid(parsedDate)) {
                  parsedDate = parseISO(currentUser.birthDate);
              }
            } else if (currentUser.birthDate instanceof Date) { 
              parsedDate = currentUser.birthDate;
            // @ts-ignore
            } else if (currentUser.birthDate && typeof currentUser.birthDate.toDate === 'function') { 
                // @ts-ignore
                parsedDate = currentUser.birthDate.toDate();
            }
            
            if (parsedDate && isValid(parsedDate)) {
                 setEditableBirthDate(parsedDate);
            } else {
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

  const userBio = currentUser?.bio || "Breve descrição sobre você aqui. Clique em 'Editar Perfil Completo' para adicionar mais detalhes.";
  const userJobTitle = "Desempregado"; // Placeholder
  const userWorkplace = "Construindo um negócio solo de $1M"; // Placeholder
  const userUniversity = "Universidade de Ljubljana"; // Placeholder
  const userLivesIn = currentUser?.country || "Não informado";
  const userFrom = currentUser?.country || "Não informado"; // Placeholder, ideally separate field
  const userTimeZone = "Europe/Ljubljana"; // Placeholder
  const userEmail = currentUser?.email || "Não informado";
  const userDobFormatted = editableBirthDate ? format(editableBirthDate, "dd/MM/yyyy", { locale: ptBR }) : "Não informada";


  return (
    <ProtectedPage>
      <div className="space-y-6">
        {/* Profile Header */}
        <Card className="shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-start gap-4">
              <Avatar className="w-20 h-20 md:w-24 md:h-24 border-2 border-primary/30 shadow-md">
                <AvatarImage src={currentUser?.photoURL || undefined} alt={displayName} />
                <AvatarFallback className="text-3xl">{getInitials(displayName)}</AvatarFallback>
              </Avatar>
              <div className="flex-grow">
                <div className="flex flex-col sm:flex-row justify-between items-start">
                  <h1 className="text-2xl md:text-3xl font-bold">{displayName}</h1>
                  <div className="flex items-center gap-2 mt-2 sm:mt-0">
                    <Button variant="ghost" size="icon" className="text-muted-foreground">
                      <MoreHorizontal className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-muted-foreground">
                      <MessageSquare className="h-5 w-5" />
                    </Button>
                    <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
                      <Check className="mr-2 h-4 w-4" /> Seguindo
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {userJobTitle}. {userWorkplace}. Atualmente com $400k/ano.
                </p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mt-2">
                  <span className="flex items-center"><BookOpen className="mr-1.5 h-3 w-3" /> {userUniversity}</span>
                  <span className="flex items-center"><Mail className="mr-1.5 h-3 w-3" /> {userEmail}</span>
                  <span className="flex items-center"><LucideCalendarIcon className="mr-1.5 h-3 w-3" /> {userDobFormatted}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column: Activity Feed (Placeholder) */}
          <div className="md:col-span-2 space-y-4">
            {activityFeedItems.map(item => (
              <Card key={item.id} className="shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    <item.icon className={cn("h-5 w-5", 
                      item.type === 'follow' && 'text-pink-500',
                      item.type === 'product' && 'text-blue-500',
                      item.type === 'system' && 'text-green-500',
                      item.type === 'like' && 'text-red-500',
                      item.type === 'friend_request' && 'text-purple-500',
                      item.type === 'photos' && 'text-teal-500',
                      item.type === 'system_update' && 'text-indigo-500'
                    )} />
                  </div>
                  <div className="flex-grow">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-sm">{item.title}</p>
                        {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
                      </div>
                      <p className="text-xs text-muted-foreground whitespace-nowrap">{item.time}</p>
                    </div>
                    {item.type === 'friend_request' && item.users && (
                      <div className="flex -space-x-2 mt-2">
                        {item.users.map((user, idx) => (
                          <Avatar key={idx} className="h-6 w-6 border-2 border-card">
                            <AvatarImage src={user.avatar} alt={user.name} data-ai-hint="user avatar" />
                            <AvatarFallback>{user.name.substring(0,1)}</AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                    )}
                    {item.type === 'photos' && item.images && (
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        {item.images.map((imgSrc, idx) => (
                          <Image key={idx} src={imgSrc} alt={`Foto ${idx+1}`} width={200} height={150} className="rounded-md aspect-[4/3] object-cover" data-ai-hint="lifestyle content" />
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
             <Button variant="outline" className="w-full">Carregar mais atividades...</Button>
          </div>

          {/* Right Column: Basic Info & About Me */}
          <div className="space-y-6">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Informações Básicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center"><BookOpen className="mr-2 h-4 w-4 text-primary" /> <span className="text-muted-foreground mr-1">Estudou em:</span> {userUniversity}</div>
                <div className="flex items-center"><Briefcase className="mr-2 h-4 w-4 text-primary" /> <span className="text-muted-foreground mr-1">Trabalhou em:</span> {userWorkplace}</div>
                <div className="flex items-center"><Home className="mr-2 h-4 w-4 text-primary" /> <span className="text-muted-foreground mr-1">Mora em:</span> {userLivesIn}</div>
                <div className="flex items-center"><MapPin className="mr-2 h-4 w-4 text-primary" /> <span className="text-muted-foreground mr-1">De:</span> {userFrom}</div>
                <div className="flex items-center"><LucideCalendarIcon className="mr-2 h-4 w-4 text-primary" /> <span className="text-muted-foreground mr-1">Nascimento:</span> {userDobFormatted}</div>
                <div className="flex items-center"><Clock className="mr-2 h-4 w-4 text-primary" /> <span className="text-muted-foreground mr-1">Fuso horário:</span> {userTimeZone}</div>
              </CardContent>
            </Card>

            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Sobre Mim</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p>{currentUser?.bio || "Adicione uma bio para que as pessoas saibam mais sobre você."}</p>
              </CardContent>
            </Card>

             <Card className="shadow-md">
              <CardHeader>
                  <CardTitle className="text-lg font-semibold">Editar Informações</CardTitle>
                  <CardDescription>Atualize seus dados pessoais. Clique em salvar após as alterações.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                  <div className="space-y-1">
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

                  <div className="space-y-1">
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

                  <div className="space-y-1">
                    <Label htmlFor="birthdate-picker-profile" className="text-sm font-medium">Data de Nascimento</Label>
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
                  
                  <div className="space-y-1">
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
                  
                  <Button onClick={handleSaveProfile} className="w-full mt-4" disabled={isSaving}>
                    {isSaving ? <LoadingSpinner size="sm" className="mr-2"/> : <Save className="mr-2 h-4 w-4" />}
                    Salvar Alterações
                  </Button>

                  <p className="text-xs text-muted-foreground pt-1">
                    ID do Usuário: {currentUser?.uid}
                  </p>

                  <Button variant="outline" className="w-full" disabled>
                    <Edit3 className="mr-2 h-4 w-4" /> Editar Perfil Completo (Em breve)
                  </Button>

                  <Button variant="destructive" onClick={handleLogout} className="w-full">
                    <LogOut className="mr-2 h-4 w-4" /> Sair
                  </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedPage>
  );
}
