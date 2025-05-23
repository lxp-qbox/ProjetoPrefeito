
"use client";

import ProtectedPage from "@/components/auth/protected-page";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PostCard from "@/components/feed/post-card";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import {
  LogOut, UserCircle2, Save, Globe, Phone, Diamond, MoreHorizontal, MessageSquare, MapPin, Home as HomeIcon, Clock, Users, Package, Database, ThumbsUp, UserPlus, Settings as SettingsIcon, Check, Clipboard, DatabaseZap, Lock, CreditCard, Info, ChevronRight, Bell, UserCog, XCircle, Link as LinkIconLucide, ServerOff, FileText, Headphones, LayoutDashboard, Star, Share2, CalendarDays as LucideCalendarIcon, BadgeCheck, Fingerprint, Ticket as TicketIcon, RefreshCw
} from "lucide-react"; 
import NextImage from 'next/image';
import { usePathname, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import type { UserProfile, FeedPost } from "@/types";
import { countries } from "@/lib/countries";
import { format, parseISO, subYears, isValid, parse, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { db, doc, updateDoc, serverTimestamp } from "@/lib/firebase";
import LoadingSpinner from "@/components/ui/loading-spinner";

const formatPhoneNumberForDisplay = (value: string): string => {
  if (!value || !value.trim()) return "";
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
  link?: string;
  action?: () => void;
}

interface ProfileMenuGroup {
  groupTitle?: string;
  items: ProfileMenuItem[];
  isBottomSection?: boolean;
}


export default function ProfilePage() {
  const { currentUser, logout } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();

  const [activeTab, setActiveTab] = useState<string>("visaoGeral");

  const [editableProfileName, setEditableProfileName] = useState<string>("");
  const [editableBio, setEditableBio] = useState<string>("");
  const [editableShowId, setEditableShowId] = useState<string>(""); 
  const [editableCountry, setEditableCountry] = useState<string | undefined>(undefined);
  const [editableGender, setEditableGender] = useState<UserProfile['gender'] | undefined>(undefined);
  const [editableBirthDate, setEditableBirthDate] = useState<Date | undefined>(undefined);
  const [editablePhoneNumber, setEditablePhoneNumber] = useState<string>("");

  const [isSaving, setIsSaving] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  const handleLogout = async () => {
    try {
      await logout();
      toast({ title: "Sessão Encerrada", description: "Você foi desconectado com sucesso." });
      router.push("/");
    } catch (error: any) {
      toast({ title: "Falha ao Sair", description: error.message, variant: "destructive" });
    }
  };

  const profileMenuGroups: ProfileMenuGroup[] = useMemo(() => [
    {
      groupTitle: "CONTA",
      items: [
        { id: "visaoGeral", title: "Visão Geral", icon: UserCircle2, link: "/profile#visaoGeral" },
        { id: "informacoesPessoais", title: "Informações Pessoais", icon: Clipboard, link: "/profile#informacoesPessoais" },
        { id: "aparencia", title: "Aparência", icon: SettingsIcon, link: "/settings" },
        { id: "seguranca", title: "Segurança", icon: Lock, link: "/profile#seguranca" },
      ],
    },
    {
      groupTitle: "SOCIAL",
      items: [
        { id: "pessoasCompartilhamento", title: "Pessoas e Compartilhamento", icon: Users, link: "/profile#pessoas" },
        { id: "pagamentosAssinaturas", title: "Pagamentos e Assinaturas", icon: CreditCard, link: "/profile#pagamentos" },
      ],
    },
    {
      groupTitle: "SOBRE",
      items: [
        { id: "contratoUsuario", title: "Contrato do usuário", icon: FileText, link: "/profile#user-agreement" },
        { id: "politicaPrivacidade", title: "Política de privacidade", icon: FileText, link: "/profile#privacy-policy" },
        { id: "contratoHost", title: "Contrato de Host", icon: FileText, link: "/profile#host-agreement"},
        { id: "sobreKako", title: "Sobre Kako Live", icon: Info, link: "/profile#about-kako"},
      ],
    },
    {
      isBottomSection: true, 
      items: [
        { id: "suporte", title: "Suporte", icon: Headphones, link: "/support" },
      ],
    },
    {
      items: [
        { id: "sair", title: "Sair", icon: LogOut, action: handleLogout },
      ],
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [logout]); // handleLogout itself doesn't change, but its dependency `logout` does.


  const placeholderPosts: FeedPost[] = useMemo(() => {
    if (!currentUser) return [];
    const currentUserName = currentUser.profileName || currentUser.displayName || "Usuário";
    const currentUserHandle = `@${(currentUser.email?.split('@')[0] || "usuario").toLowerCase()}`;
    const currentUserAvatar = currentUser.photoURL || undefined;

    return [ 
      {
        id: "post1-profile",
        userId: currentUser.uid,
        user: { name: currentUserName, handle: currentUserHandle, avatarUrl: currentUserAvatar, dataAiHint: "user avatar" },
        content: "Primeiro post no meu perfil! 🎉 Ansioso para interagir com todos aqui.",
        timestamp: "2h",
        stats: { replies: 10, retweets: 5, likes: 20 },
      },
       {
        id: "post2-profile",
        userId: currentUser.uid,
        user: { name: currentUserName, handle: currentUserHandle, avatarUrl: currentUserAvatar, dataAiHint: "user avatar" },
        content: "Aproveitando o dia! ☀️ #abençoado #novaplataforma",
        timestamp: "5h",
        imageUrl: "https://placehold.co/600x400.png",
        imageAiHint: "sunny beach",
        stats: { replies: 15, retweets: 8, likes: 50 },
      },
    ];
  }, [currentUser]);


  useEffect(() => {
    const hash = window.location.hash.substring(1);
    const validTab = profileMenuGroups.flatMap(g => g.items).find(item => item.id === hash);
    if (validTab && validTab.id) { // Check if validTab and validTab.id exist
      setActiveTab(validTab.id);
    } else if (pathname === "/profile" && !hash) {
      setActiveTab("visaoGeral");
    }
  }, [pathname, profileMenuGroups]);


  useEffect(() => {
    if (currentUser) {
      setEditableProfileName(currentUser.profileName || currentUser.displayName || "");
      setEditableBio(currentUser.bio || "");
      setEditableShowId(currentUser.showId || ""); 
      setEditableCountry(currentUser.country || "");
      setEditableGender(currentUser.gender || undefined);
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
                if (isValid(isoDate)) {
                  parsedDate = isoDate;
                }
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
          console.error("Error parsing birthDate from currentUser:", error);
          setEditableBirthDate(undefined);
        }
      } else {
        setEditableBirthDate(undefined);
      }
    }
  }, [currentUser]);

  const handleSaveProfile = async () => {
    if (!currentUser) {
      toast({ title: "Erro", description: "Usuário não encontrado.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    const dataToUpdate: Partial<UserProfile> = {
      profileName: editableProfileName.trim() || currentUser.displayName || null,
      displayName: editableProfileName.trim() || currentUser.displayName || null, 
      bio: editableBio.trim() || null,
      showId: editableShowId.trim() || null, 
      country: editableCountry || null,
      gender: editableGender || null,
      phoneNumber: (editablePhoneNumber.trim().replace(/(?!^\+)[^\d]/g, '') || null), 
      updatedAt: serverTimestamp(),
    };

    if (editableBirthDate && isValid(editableBirthDate)) {
      dataToUpdate.birthDate = format(editableBirthDate, "yyyy-MM-dd");
    } else {
      dataToUpdate.birthDate = null;
    }

    try {
      const userDocRef = doc(db, "accounts", currentUser.uid);
      await updateDoc(userDocRef, dataToUpdate);
      toast({ title: "Perfil Atualizado", description: "Suas informações foram salvas." });
    } catch (error) {
      console.error("Erro ao salvar perfil:", error);
      toast({ title: "Erro ao Salvar", description: "Não foi possível salvar suas informações.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleMenuClick = useCallback((item: ProfileMenuItem) => {
    if (item.action) {
      item.action();
    } else if (item.link && item.link.startsWith("/") && !item.link.startsWith("/profile#")) {
      router.push(item.link);
    } else if (item.link && item.link.startsWith("/profile#")){
      setActiveTab(item.id);
      router.push(item.link, { scroll: false }); 
    } else {
      setActiveTab(item.id);
      router.push(`/profile#${item.id}`, { scroll: false });
    }
  }, [router, setActiveTab]); // Added setActiveTab as a dependency
  

  const getInitials = (name?: string | null): string => {
    if (!name) return "KI"; 
    const parts = name.split(" ");
    if (parts.length > 1 && parts[0] && parts[1]) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const currentUserNameForProfile = currentUser?.profileName || currentUser?.displayName || "Usuário";
  const userHandle = currentUser?.email?.split('@')[0]?.toLowerCase() || "usuario";


  const renderContent = () => {
    if (!currentUser) {
      return <div className="p-6 flex justify-center items-center h-full"><LoadingSpinner /></div>;
    }

    switch (activeTab) {
      case 'visaoGeral':
        return (
           <div className="w-full bg-card"> {/* Ensures white background for this section */}
            {/* Banner */}
            <div className="h-40 bg-gradient-to-r from-primary/30 to-accent/30 relative">
               <NextImage src="https://placehold.co/1200x300.png" alt="Banner do perfil" layout="fill" objectFit="cover" data-ai-hint="abstract banner" />
              <div className="absolute top-4 right-4 flex space-x-2">
                <Button variant="outline" size="icon" className="bg-white/30 backdrop-blur-sm text-white hover:bg-white/50 h-8 w-8 rounded-full">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Profile Info Section */}
            <div className="px-6 pb-6 relative">
              <div className="flex flex-col items-center -mt-16 sm:-mt-20 relative z-10"> 
                <Avatar className="h-28 w-28 md:h-32 md:w-32 border-4 border-card shadow-lg">
                  <AvatarImage src={currentUser.photoURL || undefined} alt={currentUserNameForProfile} data-ai-hint="user profile photo"/>
                  <AvatarFallback>{getInitials(currentUserNameForProfile)}</AvatarFallback>
                </Avatar>
                
                <div className="mt-4 text-center">
                    <p className="text-sm text-muted-foreground">@{userHandle}</p>
                    <div className="flex items-center justify-center mt-1">
                        <h1 className="text-2xl font-bold text-foreground">{currentUserNameForProfile}</h1>
                        {currentUser.isVerified && (
                             <BadgeCheck className="h-5 w-5 text-pink-500 ml-1.5" />
                        )}
                    </div>
                    <p className="mt-1 text-sm text-foreground/90 px-4 md:px-0 max-w-md mx-auto">{currentUser.bio || "UX/UI Designer, 4+ years of experience"}</p>
                </div>

                <div className="mt-3 text-xs text-muted-foreground flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
                    {currentUser.country && <div className="flex items-center"><MapPin className="h-3.5 w-3.5 mr-1" /> {currentUser.country}</div>}
                    <div className="flex items-center">
                        <LucideCalendarIcon className="h-3.5 w-3.5 mr-1" /> 
                        Entrou {currentUser.createdAt?.toDate ? formatDistanceToNow(currentUser.createdAt.toDate(), { addSuffix: true, locale: ptBR }) : "há pouco tempo"}
                    </div>
                   {currentUser.showId && (
                    <div className="flex items-center">
                        <Fingerprint className="h-3.5 w-3.5 mr-1" /> Show ID: {currentUser.showId}
                    </div>
                   )}
                   {currentUser.adminLevel && (
                      <div className="flex items-center">
                          <Diamond className="mr-1.5 h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                          <Badge variant="destructive" className="capitalize">
                            {currentUser.adminLevel.charAt(0).toUpperCase() + currentUser.adminLevel.slice(1)}
                          </Badge>
                      </div>
                   )}
                </div>
                
                <div className="mt-4 flex items-center text-sm text-muted-foreground space-x-4">
                    <div><span className="font-semibold text-foreground">{currentUser.followingCount || 0}</span> Seguindo</div>
                    <div><span className="font-semibold text-foreground">{currentUser.followerCount || 0}</span> Seguidores</div>
                </div>

                <div className="mt-6 flex space-x-2">
                  <Button className="bg-pink-500 hover:bg-pink-600 text-white rounded-full px-6 text-sm h-9">
                    Inscrever-se
                  </Button>
                  <Button 
                    variant="outline" 
                    className="rounded-full px-6 text-sm h-9" 
                    onClick={() => {
                        const infoItem = profileMenuGroups.flatMap(g => g.items).find(i => i.id === 'informacoesPessoais');
                        if (infoItem) handleMenuClick(infoItem);
                    }}
                  >
                    Editar perfil
                  </Button>
                </div>
              </div>
            </div>
             <Tabs defaultValue="posts" className="w-full mt-0">
              <TabsList className="grid w-full grid-cols-3 sticky top-0 z-10 bg-card border-b px-6">
                <TabsTrigger value="posts">Posts</TabsTrigger>
                <TabsTrigger value="respostas">Respostas</TabsTrigger>
                <TabsTrigger value="midia">Mídia</TabsTrigger>
              </TabsList>
              <TabsContent value="posts" className="mt-0">
                 <div className="space-y-0">
                    {placeholderPosts.map(post => (
                        <PostCard key={post.id} post={{
                            ...post,
                            user: {
                                name: currentUserNameForProfile,
                                handle: `@${userHandle}`,
                                avatarUrl: currentUser.photoURL || undefined,
                            }
                        }} />
                    ))}
                    <div className="p-6 text-center text-muted-foreground">Fim dos posts.</div>
                </div>
              </TabsContent>
              <TabsContent value="respostas" className="p-6 text-center text-muted-foreground">Conteúdo de Respostas em desenvolvimento.</TabsContent>
              <TabsContent value="midia" className="p-6 text-center text-muted-foreground">Conteúdo de Mídia em desenvolvimento.</TabsContent>
            </Tabs>
          </div>
        );
      case 'informacoesPessoais':
        return (
          <div className="p-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Editar Informações Pessoais</CardTitle>
                <CardDescription>Atualize seus dados pessoais. Clique em salvar após as alterações.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                    <Label htmlFor="profileName-profile">Nome de Perfil</Label>
                    <Input id="profileName-profile" value={editableProfileName} onChange={(e) => setEditableProfileName(e.target.value)} />
                </div>
                <div className="space-y-1">
                    <Label htmlFor="showId-profile">ID de Exibição Kako (Show ID)</Label>
                    <Input id="showId-profile" value={editableShowId} onChange={(e) => setEditableShowId(e.target.value)} placeholder="Seu ID público no Kako Live" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="phone-number-profile\">Celular (WhatsApp)</Label>
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
                  <Label htmlFor="gender-select-profile">Sexo</Label>
                  <Select
                    value={editableGender}
                    onValueChange={(value) => setEditableGender(value as UserProfile['gender'])}
                  >
                    <SelectTrigger id="gender-select-profile" className="w-full h-12">
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
                  <Label htmlFor="birthdate-picker-profile">Data de Nascimento</Label>
                  <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        id="birthdate-picker-profile"
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal h-12",
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
                        fromYear={subYears(new Date(), 100).getFullYear()}
                        toYear={new Date().getFullYear()}
                        defaultMonth={editableBirthDate || subYears(new Date(), 18)}
                        disabled={(date) => date > new Date() || date < subYears(new Date(), 100)}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="pt-2 space-y-1">
                  <Label htmlFor="country-select-profile">País</Label>
                  <Select
                    value={editableCountry}
                    onValueChange={(value) => setEditableCountry(value)}
                  >
                    <SelectTrigger id="country-select-profile" className="w-full h-12">
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
                 <div className="pt-2 space-y-1">
                  <Label htmlFor="bio-profile">Bio (Sobre Mim)</Label>
                  <Textarea id="bio-profile" value={editableBio} onChange={(e) => setEditableBio(e.target.value)} rows={4} maxLength={160} placeholder="Conte um pouco sobre você..." />
                </div>
                <Button onClick={handleSaveProfile} className="w-full mt-6" disabled={isSaving}>
                  {isSaving ? <LoadingSpinner size="sm" className="mr-2" /> : <Save className="mr-2 h-4 w-4" />}
                  Salvar Alterações
                </Button>
              </CardContent>
            </Card>
          </div>
        );
      case 'aparencia': 
      case 'suporte':
        if (activeTab === 'aparencia' && router) router.push('/settings');
        if (activeTab === 'suporte' && router) router.push('/support');
        return <div className="p-6"><Card><CardContent><p className="text-muted-foreground">Redirecionando...</p></CardContent></Card></div>;
      default:
        const activeItem = profileMenuGroups.flatMap(g => g.items).find(item => item.id === activeTab);
        return (
          <div className="p-6">
            <Card>
              <CardHeader><CardTitle>{activeItem?.title || "Seção"}</CardTitle></CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Conteúdo para {activeItem?.title || "esta seção"} em desenvolvimento.</p>
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  if (!currentUser) {
    return <div className="p-6 flex justify-center items-center h-full"><LoadingSpinner /></div>;
  }

  return (
    <ProtectedPage>
       <div className="flex flex-col md:flex-row h-full gap-0 overflow-hidden">
         <nav className="md:w-72 lg:w-80 flex-shrink-0 border-r bg-muted/40 h-full overflow-y-auto p-2 space-y-4">
            {profileMenuGroups.map((group, groupIndex) => (
              <div key={group.groupTitle || `profile-group-${groupIndex}`} className={cn(group.groupTitle ? "" : "pt-2", group.isBottomSection && "mt-auto")}>
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
                          "w-full text-left h-auto text-sm font-medium rounded-md transition-all",
                           isActive
                            ? "bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary"
                            : "text-card-foreground hover:bg-card/80 bg-card shadow-sm hover:text-card-foreground",
                           "justify-between py-3 px-3"
                        )}
                        onClick={() => handleMenuClick(item)}
                      >
                        <div className="flex items-center gap-2.5">
                            <item.icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground")} />
                            <span>{item.title}</span>
                        </div>
                        <div className="flex items-center ml-auto">
                            {/* Chevron only for items that don't navigate away or have specific actions */}
                            {(!item.link || (item.link && item.link.startsWith("/profile#"))) && !item.action && item.id !== 'aparencia' && item.id !== 'suporte' && item.id !== 'sair' ? <ChevronRight className="h-4 w-4 text-muted-foreground" /> : null }
                        </div>
                      </Button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

           <main className="flex-1 h-full overflow-y-auto"> 
            {renderContent()}
          </main>
        </div>
    </ProtectedPage>
  );
}

    