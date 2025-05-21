
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
  Clipboard, DatabaseZap, Lock, CreditCard, Info, Share2, BadgeCheck, ChevronRight, Bell, CalendarDays as LucideCalendarIcon, Fingerprint,
  LayoutDashboard, Star, UserCog, XCircle, Link as LinkIconLucide, ServerOff, FileText, Headphones // Added icons from admin menu
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation"; // Added usePathname
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

// Define interfaces for menu structure, similar to admin layout
interface ProfileMenuItem {
  id?: string; // Added id for easier state management
  title: string;
  icon: React.ElementType;
  link?: string;
  currentValue?: string;
  subItems?: ProfileMenuItem[]; // For potential future nesting, not used by current admin menu directly
}

interface ProfileMenuGroup {
  groupTitle?: string;
  items: ProfileMenuItem[];
  isBottomSection?: boolean;
}

// Cloned and adapted adminMenuGroups for profile page context
const profileMenuGroups: ProfileMenuGroup[] = [
  {
    groupTitle: "GERAL",
    items: [
      { id: "profileDashboard", title: "Visão Geral", icon: LayoutDashboard, link: "#inicio" }, // Link to overview within profile
      { id: "profileLanguage", title: "Idioma", icon: Globe, link: "#language", currentValue: "Português(Brasil)" },
      { id: "profileNotifications", title: "Configurações de notificação", icon: Bell, link: "#notifications" },
    ],
  },
  {
    groupTitle: "MINHA CONTA", // Changed from "GESTÃO DE USUÁRIOS"
    items: [
      { id: "profileInfo", title: "Informações Pessoais", icon: UserCircle2, link: "#informacoesPessoais" },
      { id: "profileSecurity", title: "Segurança da Conta", icon: Lock, link: "#seguranca" },
      { id: "profileAppearance", title: "Aparência", icon: SettingsIcon, link: "/settings" }, // Links to actual settings page
    ],
  },
  {
    groupTitle: "SOBRE",
    items: [
      { id: "profileUserAgreement", title: "Contrato do usuário", icon: FileText, link: "#user-agreement" },
      { id: "profilePrivacyPolicy", title: "Política de privacidade", icon: FileText, link: "#privacy-policy" },
      { id: "profileHostAgreement", title: "Contrato de Host", icon: FileText, link: "#host-agreement" },
      { id: "profileAboutKako", title: "Sobre Kako Live", icon: Info, link: "#about-kako" },
    ],
  },
  {
    items: [
      { id: "profileSupport", title: "Entre em contato conosco", icon: Headphones, link: "/support" }, // Links to actual support page
    ],
    isBottomSection: true,
  },
  {
    items: [
      { id: "logout", title: "Sair", icon: LogOut, link: "#logout" },
    ],
  },
];


export default function ProfilePage() {
  const { currentUser, logout } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname(); // To determine active link based on hash

  const [editableCountry, setEditableCountry] = useState<string | undefined>(undefined);
  const [editableGender, setEditableGender] = useState<UserProfile['gender'] | undefined>(undefined);
  const [editableBirthDate, setEditableBirthDate] = useState<Date | undefined>(undefined);
  const [editablePhoneNumber, setEditablePhoneNumber] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const [activeTab, setActiveTab] = useState<string>('profileDashboard'); // Default tab

  useEffect(() => {
    // Set active tab based on URL hash if present
    if (window.location.hash) {
      const hash = window.location.hash.substring(1);
      const allItems = profileMenuGroups.flatMap(group => group.items);
      if (allItems.some(item => item.link === `#${hash}` || item.id === hash)) {
        setActiveTab(hash);
      }
    }
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
                if(isValid(isoDate)) parsedDate = isoDate;
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

  const handleMenuClick = (itemId: string, itemLink?: string) => {
    if (itemId === 'logout') {
      handleLogout();
    } else if (itemLink && itemLink.startsWith('/')) {
      router.push(itemLink);
    } else if (itemLink && itemLink.startsWith('#')) {
      setActiveTab(itemLink.substring(1));
      // Optionally update URL hash for better navigation history, but keep it client-side
      window.location.hash = itemLink;
    } else {
      setActiveTab(itemId);
      window.location.hash = itemId;
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
  const joinedDateFormatted = currentUser?.createdAt?.toDate ? formatDistanceToNow(currentUser.createdAt.toDate(), { addSuffix: true, locale: ptBR }) : "Data de entrada não disponível";


  const renderContent = () => {
    switch (activeTab) {
      case 'profileDashboard': // Mapped from 'inicio'
      case 'inicio':
        return (
          <div className="space-y-6 p-6">
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
      case 'profileInfo': // Mapped from 'informacoesPessoais'
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
      default:
        const activeItem = profileMenuGroups.flatMap(g => g.items).find(item => item.id === activeTab || item.link === `#${activeTab}`);
        return (
          <div className="p-6">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">{activeItem?.title || "Seção"}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Conteúdo para {activeItem?.title || "esta seção"} em desenvolvimento.</p>
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  return (
    <ProtectedPage>
      <div className="flex flex-col h-full">
        {/* Profile Menu and Content Area */}
        <div className="flex-grow flex flex-col md:flex-row gap-0 overflow-hidden">
          {/* Profile Menu Sidebar */}
          <nav className="md:w-80 flex-shrink-0 border-r bg-muted/40 h-full overflow-y-auto p-4 space-y-4">
            {profileMenuGroups.map((group, groupIndex) => {
              const isFirstGroup = groupIndex === 0;
              return (
                <div key={group.groupTitle || `group-${groupIndex}`} className={cn(group.isBottomSection && "mt-auto pt-4 border-t", !isFirstGroup && !group.isBottomSection && "mt-4")}>
                  {group.groupTitle && (
                    <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
                      {group.groupTitle}
                    </h2>
                  )}
                  <div className={cn("space-y-1", !group.groupTitle && group.isBottomSection && "mt-0 pt-0 border-none")}>
                    {group.items.map((item) => {
                      const isActive = activeTab === (item.link ? item.link.substring(1) : item.id);
                      return (
                        <Button
                          key={item.id || item.title}
                          variant="ghost"
                          className={cn(
                            "w-full text-left h-auto text-sm font-normal rounded-md transition-colors",
                            isActive
                              ? "bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary"
                              : "text-card-foreground hover:bg-card/80 hover:text-card-foreground bg-card shadow-sm",
                            "justify-between py-3 px-3"
                          )}
                          onClick={() => handleMenuClick(item.id || item.title, item.link)}
                        >
                          <div className="flex items-center gap-2.5">
                            <item.icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground")} />
                            <span>{item.title}</span>
                          </div>
                          <div className="flex items-center ml-auto">
                            {item.currentValue && <span className="text-xs text-muted-foreground mr-2">{item.currentValue}</span>}
                            {item.link !== "#logout" && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                          </div>
                        </Button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
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

    