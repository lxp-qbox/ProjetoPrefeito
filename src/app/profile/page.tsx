
"use client";

import ProtectedPage from "@/components/auth/protected-page";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import {
  LogOut, Mail, UserCircle2, Save, Briefcase, Globe, Phone, Diamond, MoreHorizontal, MessageSquare, MapPin, BookOpen, Home as HomeIcon, Clock, Users, Package, Database, ThumbsUp, UserPlus, Image as ImageIcon, Settings as SettingsIcon, Check,
  Clipboard, DatabaseZap, Lock, CreditCard, Info, Share2, BadgeCheck, ChevronRight, Bell, CalendarDays as LucideCalendarIcon, Fingerprint
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect, useMemo } from "react";
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
import { format, parseISO, subYears, isValid, parse, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { db, doc, updateDoc, serverTimestamp } from "@/lib/firebase";
import LoadingSpinner from "@/components/ui/loading-spinner";
import Image from "next/image";
import Link from "next/link";

const formatPhoneNumberForDisplay = (value: string): string => {
  if (!value.trim()) return "";
  const originalStartsWithPlus = value.charAt(0) === '+';
  let digitsOnly = (originalStartsWithPlus ? value.substring(1) : value).replace(/[^\d]/g, '');
  digitsOnly = digitsOnly.slice(0, 15);
  const len = digitsOnly.length;
  if (len === 0) return originalStartsWithPlus ? "+" : "";
  let formatted = "+";
  if (len <= 2) formatted += digitsOnly;
  else if (len <= 4) formatted += `${digitsOnly.slice(0, 2)} (${digitsOnly.slice(2)})`;
  else if (len <= 9) formatted += `${digitsOnly.slice(0, 2)} (${digitsOnly.slice(2, 4)}) ${digitsOnly.slice(4)}`;
  else formatted += `${digitsOnly.slice(0, 2)} (${digitsOnly.slice(2, 4)}) ${digitsOnly.slice(4, 9)}-${digitsOnly.slice(9)}`;
  return formatted;
};

interface ProfileMenuItem {
  id: string;
  title: string;
  icon: React.ElementType;
  currentValue?: string;
  link?: string;
}

interface ProfileMenuGroup {
  groupTitle?: string;
  items: ProfileMenuItem[];
  isBottomSection?: boolean;
}

const profileMenuGroups: ProfileMenuGroup[] = [
  {
    groupTitle: "Conta",
    items: [
      { id: 'inicio', title: 'Visão Geral', icon: UserCircle2 },
      { id: 'informacoesPessoais', title: 'Informações Pessoais', icon: Clipboard },
      { id: 'seguranca', title: 'Segurança', icon: Lock },
    ]
  },
  {
    groupTitle: "Preferências",
    items: [
      { id: 'aparencia', title: 'Aparência', icon: SettingsIcon, link: "/settings" },
      { id: 'notificacoes', title: 'Notificações', icon: Bell, currentValue: "Ativadas" },
    ]
  },
  {
    items: [
      { id: 'logout', title: 'Sair', icon: LogOut },
    ],
    isBottomSection: true,
  }
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
  const [activeTab, setActiveTab] = useState<string>('inicio');

  useEffect(() => {
    if (currentUser) {
      setEditableCountry(currentUser.country || "");
      setEditableGender(currentUser.gender || 'preferNotToSay');
      setEditablePhoneNumber(formatPhoneNumberForDisplay(currentUser.phoneNumber || ""));
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
    if (editablePhoneNumber.trim()) dataToUpdate.phoneNumber = editablePhoneNumber.trim().replace(/(?!^\+)[^\d]/g, '');

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

  const maxCalendarDate = new Date();
  const minCalendarDate = subYears(new Date(), 100);

  const handleMenuClick = (itemId: string, itemLink?: string) => {
    if (itemId === 'logout') {
      handleLogout();
    } else if (itemLink) {
      router.push(itemLink);
    } else {
      setActiveTab(itemId);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'inicio':
        return (
          <div className="space-y-6 p-6">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Sobre Mim (Visão Geral)</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p>{currentUser?.bio || "Adicione uma bio para que as pessoas saibam mais sobre você."}</p>
                <p className="mt-4">Seu e-mail: {currentUser?.email}</p>
                <p>Seu nome de perfil: {currentUser?.profileName || currentUser?.displayName}</p>
              </CardContent>
            </Card>
          </div>
        );
      case 'informacoesPessoais':
        return (
          <div className="p-6">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Editar Informações Pessoais</CardTitle>
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
                          if (date) setIsCalendarOpen(false);
                        }}
                        initialFocus
                        locale={ptBR}
                        captionLayout="dropdown-buttons"
                        fromYear={minCalendarDate.getFullYear()}
                        toYear={maxCalendarDate.getFullYear()}
                        defaultMonth={subYears(new Date(), 18)}
                        disabled={(date) => date > maxCalendarDate || date < minCalendarDate}
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
                {currentUser?.email && (
                  <div className="space-y-1">
                    <Label htmlFor="email-profile" className="text-sm font-medium">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="email-profile" type="email" value={currentUser.email} readOnly disabled className="pl-10 h-12 bg-muted/50" />
                    </div>
                  </div>
                )}
                {currentUser?.kakoLiveId && (
                  <div className="space-y-1">
                    <Label htmlFor="kako-id-profile" className="text-sm font-medium">Passaporte (ID Kako Live)</Label>
                    <div className="relative">
                      <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="kako-id-profile" type="text" value={currentUser.kakoLiveId} readOnly disabled className="pl-10 h-12 bg-muted/50" />
                    </div>
                  </div>
                )}
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Função</Label>
                  <div className="flex items-center text-sm">
                    <Briefcase className="mr-2 h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <Badge variant="outline">{currentUser?.role === 'host' ? 'Anfitrião' : 'Participante'}</Badge>
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
                <Button onClick={handleSaveProfile} className="w-full mt-4" disabled={isSaving}>
                  {isSaving ? <LoadingSpinner size="sm" className="mr-2" /> : <Save className="mr-2 h-4 w-4" />}
                  Salvar Alterações
                </Button>
                <p className="text-xs text-muted-foreground pt-1">
                  ID do Usuário: {currentUser?.uid}
                </p>
              </CardContent>
            </Card>
          </div>
        );
      case 'seguranca':
      case 'notificacoes':
        return (
          <div className="p-6">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">{profileMenuGroups.flatMap(g => g.items).find(item => item.id === activeTab)?.title || "Seção"}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Conteúdo desta seção em desenvolvimento.</p>
              </CardContent>
            </Card>
          </div>
        );
      default:
        return (
          <div className="p-6">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Visão Geral</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Bem-vindo ao seu perfil! Selecione uma opção no menu.</p>
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  return (
    <ProtectedPage>
      <div className="flex flex-col h-full">
        {/* Two-column layout for menu and content */}
        <div className="flex-grow flex flex-col md:flex-row gap-0 overflow-hidden">
          {/* Profile Menu Sidebar */}
          <nav className="md:w-72 lg:w-80 flex-shrink-0 border-r bg-muted/40 h-full overflow-y-auto p-4 space-y-4">
            {profileMenuGroups.map((group, groupIndex) => (
              <div key={group.groupTitle || `group-${groupIndex}`} className={cn(group.isBottomSection && "mt-auto pt-4 border-t")}>
                {group.groupTitle && (
                  <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
                    {group.groupTitle}
                  </h2>
                )}
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                      <Button
                        key={item.id}
                        variant={isActive ? "secondary" : "ghost"}
                        className={cn(
                          "w-full justify-start gap-2.5 py-3 px-3 text-sm font-medium rounded-md",
                          isActive ? "bg-primary/10 text-primary" : "text-card-foreground hover:bg-card/80 hover:text-card-foreground"
                        )}
                        onClick={() => handleMenuClick(item.id, item.link)}
                      >
                        <item.icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground")} />
                        <span>{item.title}</span>
                        {item.currentValue && <span className="ml-auto text-xs text-muted-foreground">{item.currentValue}</span>}
                        {!item.link && item.id !== 'logout' && <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto" />}
                      </Button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Profile Content Area */}
          <main className="flex-1 h-full overflow-y-auto">
            {renderContent()}
          </main>
        </div>
      </div>
    </ProtectedPage>
  );
}

