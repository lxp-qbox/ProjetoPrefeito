
"use client";

import ProtectedPage from "@/components/auth/protected-page";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import {
  LogOut, Mail, UserCircle2, Edit3, ShieldCheck, Fingerprint, CalendarDays as LucideCalendarIcon, Save, Briefcase, Globe, Phone, Diamond, MoreHorizontal, MessageSquare, MapPin, BookOpen, Home as HomeIcon, Clock, Users, Package, Database, ThumbsUp, UserPlus, Image as ImageIcon, Settings as SettingsIcon, Check,
  Clipboard, DatabaseZap, Lock, CreditCard, Info, ChevronRight, Bell, UserCog, XCircle, Link as LinkIconLucide, ServerOff, FileText, Headphones, LayoutDashboard, Star, Share2
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect, useMemo, useCallback } from "react";
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

interface ProfileMenuItem {
  id: string;
  title: string;
  icon: React.ElementType;
  link?: string;
  currentValue?: string;
  action?: () => void;
}

interface ProfileMenuGroup {
  groupTitle?: string;
  items: ProfileMenuItem[];
  isBottomSection?: boolean;
}


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


export default function ProfilePage() {
  const { currentUser, logout } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();

  const [editableCountry, setEditableCountry] = useState<string | undefined>(undefined);
  const [editableGender, setEditableGender] = useState<UserProfile['gender'] | undefined>(undefined);
  const [editableBirthDate, setEditableBirthDate] = useState<Date | undefined>(undefined);
  const [editablePhoneNumber, setEditablePhoneNumber] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const [activeTab, setActiveTab] = useState<string>('visaoGeral'); 


  const profileMenuGroups: ProfileMenuGroup[] = [
    {
      groupTitle: "GERAL",
      items: [
        { id: "visaoGeral", title: "Visão Geral", icon: LayoutDashboard, link: "/profile#visaoGeral" },
        { id: "aparencia", title: "Aparência", icon: SettingsIcon, link: "/settings" },
        { id: "notificacoes", title: "Notificações", icon: Bell, link: "/profile#notificacoes" },
      ],
    },
    {
      groupTitle: "MINHA CONTA",
      items: [
        { id: "informacoesPessoais", title: "Informações Pessoais", icon: Clipboard, link: "/profile#informacoesPessoais" },
        { id: "seguranca", title: "Segurança da Conta", icon: Lock, link: "/profile#seguranca" },
      ],
    },
    {
      groupTitle: "SOBRE",
      items: [
        { id: "user-agreement", title: "Contrato do usuário", icon: FileText, link: "/profile#user-agreement" },
        { id: "privacy-policy", title: "Política de privacidade", icon: FileText, link: "/profile#privacy-policy" },
      ],
    },
    {
      items: [
        { id: "support", title: "Entre em contato conosco", icon: Headphones, link: "/support" },
      ],
      isBottomSection: true,
    },
    {
      items: [
        { id: "logout", title: "Sair", icon: LogOut, action: () => handleLogout() },
      ],
    },
  ];

  useEffect(() => {
    const hash = window.location.hash.substring(1);
    const allItems = profileMenuGroups.flatMap(group => group.items);
    const matchingItem = allItems.find(item => item.id === hash);
    
    if (matchingItem) {
      setActiveTab(matchingItem.id);
    } else if (profileMenuGroups.length > 0 && profileMenuGroups[0].items.length > 0) {
      setActiveTab(profileMenuGroups[0].items[0].id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

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
            console.warn("Failed to parse birthDate from currentUser:", currentUser.birthDate);
            setEditableBirthDate(undefined);
          }
        } catch (error) {
          console.error("Error parsing birthDate:", error);
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

  const handleMenuClick = (item: ProfileMenuItem) => {
    if (item.action) {
      item.action();
    } else if (item.link) {
      if (item.link.startsWith('/') && !item.link.includes('#')) { 
        router.push(item.link);
      } else if (item.link.includes('#')) { 
        const newTabId = item.id;
        setActiveTab(newTabId);
        window.location.hash = newTabId; 
      } else {
        setActiveTab(item.id);
        window.location.hash = item.id;
      }
    } else {
      setActiveTab(item.id);
      window.location.hash = item.id;
    }
  };
  
  const getInitials = (name?: string | null): string => {
    if (!name) return "U";
    const parts = name.split(" ");
    if (parts.length > 1 && parts[0] && parts[1]) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const userHandle = currentUser?.email?.split('@')[0] || "usuário";
  const userShortBio = currentUser?.bio || "Edite seu perfil para adicionar uma bio.";
  const userLocation = currentUser?.country || "Localização não definida";
  const joinedDateFormatted = currentUser?.createdAt?.toDate ? formatDistanceToNow(currentUser.createdAt.toDate(), { addSuffix: true, locale: ptBR }) : "Data de entrada não disponível";


  const renderContent = () => {
    switch (activeTab) {
      case 'visaoGeral':
        return (
          <div className="space-y-6">
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
                <CardTitle className="text-lg font-semibold">Informações de Contato</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center">
                  <Mail className="mr-2 h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span>{currentUser?.email}</span>
                </div>
                {currentUser?.phoneNumber && (
                  <div className="flex items-center">
                    <Phone className="mr-2 h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span>{formatPhoneNumberForDisplay(currentUser.phoneNumber)}</span>
                  </div>
                )}
                 {currentUser?.country && (
                  <div className="flex items-center">
                    <Globe className="mr-2 h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span>{currentUser.country}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );
      case 'informacoesPessoais':
        return (
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
              <div className="pt-2 space-y-1">
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
              <div className="pt-2 space-y-1">
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
              <div className="pt-2 space-y-1">
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
                <div className="pt-2 space-y-1">
                  <Label htmlFor="email-profile" className="text-sm font-medium">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="email-profile" type="email" value={currentUser.email} readOnly disabled className="pl-10 h-12 bg-muted/50" />
                  </div>
                </div>
              )}
              {currentUser?.kakoLiveId && (
                <div className="pt-2 space-y-1">
                  <Label htmlFor="kako-id-profile" className="text-sm font-medium">Passaporte (ID Kako Live)</Label>
                  <div className="relative">
                    <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="kako-id-profile" type="text" value={currentUser.kakoLiveId} readOnly disabled className="pl-10 h-12 bg-muted/50" />
                  </div>
                </div>
              )}
               <div className="pt-2 space-y-1">
                  <Label className="text-xs text-muted-foreground">Função</Label>
                  <div className="flex items-center text-sm">
                      <Briefcase className="mr-2 h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <Badge variant="outline">{currentUser?.role === 'host' ? 'Anfitrião' : 'Participante'}</Badge>
                  </div>
              </div>
              {currentUser?.adminLevel && (
                <div className="pt-2 space-y-1">
                  <Label className="text-xs text-muted-foreground">Nível Administrativo</Label>
                  <div className="flex items-center text-sm">
                    <Diamond className="mr-2 h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <Badge variant="destructive">
                      {currentUser.adminLevel.charAt(0).toUpperCase() + currentUser.adminLevel.slice(1)}
                    </Badge>
                  </div>
                </div>
              )}
              <Button onClick={handleSaveProfile} className="w-full mt-6" disabled={isSaving}>
                {isSaving ? <LoadingSpinner size="sm" className="mr-2" /> : <Save className="mr-2 h-4 w-4" />}
                Salvar Alterações
              </Button>
              <p className="text-xs text-muted-foreground pt-1">
                ID do Usuário: {currentUser?.uid}
              </p>
            </CardContent>
          </Card>
        );
      default:
        const activeItem = profileMenuGroups.flatMap(g => g.items).find(item => item.id === activeTab);
        return (
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">{activeItem?.title || "Seção"}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Conteúdo para {activeItem?.title || "esta seção"} em desenvolvimento.</p>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <ProtectedPage>
      <div className="flex flex-col md:flex-row h-full"> {/* Changed to two-column layout */}
        {/* Left Navigation Menu */}
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
                      variant="ghost"
                      className={cn(
                        "w-full text-left h-auto text-sm font-medium rounded-md transition-colors",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-card-foreground hover:bg-card/80 hover:text-card-foreground bg-card shadow-sm",
                        "justify-between py-3 px-3"
                      )}
                      onClick={() => handleMenuClick(item)}
                    >
                      <div className="flex items-center gap-2.5">
                        <item.icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground")} />
                        <span>{item.title}</span>
                      </div>
                      <div className="flex items-center ml-auto">
                        {item.currentValue && <span className="text-xs text-muted-foreground mr-2">{item.currentValue}</span>}
                        {!item.action && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                      </div>
                    </Button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Right Content Area */}
        <main className="flex-1 h-full overflow-y-auto flex flex-col">
          {/* Profile Header Section */}
          <div className="bg-card border-b">
            <div className="relative">
              <div className="h-40 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 relative">
                <Image 
                    src="https://placehold.co/1200x400.png" 
                    alt="Banner do Perfil" 
                    layout="fill" 
                    objectFit="cover" 
                    className="opacity-75"
                    data-ai-hint="abstract banner"
                />
                <div className="absolute inset-0 bg-black/20"></div> {/* Subtle overlay */}
                <div className="absolute top-4 right-4 flex space-x-2 z-10">
                  <Button variant="outline" size="icon" className="bg-white/30 backdrop-blur-sm text-white hover:bg-white/50 h-8 w-8 rounded-full">
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="bg-white/30 backdrop-blur-sm text-white hover:bg-white/50 h-8 w-8 rounded-full">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="px-6">
                <div className="flex flex-col sm:flex-row items-center sm:items-end -mt-16 relative z-10">
                  <Avatar className="h-28 w-28 md:h-32 md:w-32 border-4 border-card shadow-lg">
                    <AvatarImage src={currentUser?.photoURL || undefined} alt={currentUser?.displayName || "Usuário"} data-ai-hint="user avatar" />
                    <AvatarFallback>{getInitials(currentUser?.displayName)}</AvatarFallback>
                  </Avatar>
                  <div className="sm:ml-6 mt-4 sm:mt-0 text-center sm:text-left flex-grow">
                    <div className="flex items-center justify-center sm:justify-start">
                      <h1 className="text-2xl font-bold text-foreground">{currentUser?.profileName || currentUser?.displayName || "Usuário"}</h1>
                      {currentUser?.isVerified && 
                        <Badge variant="default" className="ml-2 bg-pink-500 hover:bg-pink-600 text-white text-xs px-1.5 py-0.5">
                           <Check className="h-3 w-3 mr-0.5" /> Verificado
                        </Badge>
                      }
                    </div>
                    <p className="text-sm text-muted-foreground">@{userHandle}</p>
                    <p className="text-sm text-muted-foreground mt-1">{userShortBio}</p>
                  </div>
                  <div className="mt-4 sm:mt-0 sm:ml-auto flex space-x-2 flex-shrink-0">
                    <Button className="bg-pink-500 hover:bg-pink-600 text-white rounded-full px-4 text-sm h-9">Seguir</Button>
                    <Button variant="outline" className="rounded-full px-4 text-sm h-9">Mensagem</Button>
                  </div>
                </div>
                <div className="mt-4 text-xs text-muted-foreground text-center sm:text-left pb-4">
                  <div className="flex items-center justify-center sm:justify-start space-x-3">
                    <div className="flex items-center">
                      <MapPin className="h-3.5 w-3.5 mr-1" /> {userLocation}
                    </div>
                    <div className="flex items-center">
                      <LucideCalendarIcon className="h-3.5 w-3.5 mr-1" /> Entrou {joinedDateFormatted}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Specific Content */}
          <div className="flex-1 p-6">
            {renderContent()}
          </div>
        </main>
      </div>
    </ProtectedPage>
  );
}
