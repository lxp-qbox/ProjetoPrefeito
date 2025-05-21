
"use client";

import ProtectedPage from "@/components/auth/protected-page";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  LogOut, UserCircle2, Save, Globe, Phone, Diamond, MoreHorizontal, MessageSquare, MapPin, Home as HomeIcon, Clock, Users, Package, Database, ThumbsUp, UserPlus, Image as ImageIcon, Settings as SettingsIcon, Check, Clipboard, DatabaseZap, Lock, CreditCard, Info, ChevronRight, Bell, UserCog, XCircle, Link as LinkIconLucide, ServerOff, FileText, Headphones, LayoutDashboard, Star, Share2, CalendarDays as LucideCalendarIcon, BadgeCheck, Fingerprint
} from "lucide-react";
import Link from "next/link";
import Image from 'next/image';
import { useRouter, usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect, useCallback, useMemo } from "react";
import type { UserProfile, FeedPost } from "@/types";
import { countries } from "@/lib/countries";
import { format, parseISO, subYears, isValid, parse, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { db, doc, updateDoc, serverTimestamp } from "@/lib/firebase";
import LoadingSpinner from "@/components/ui/loading-spinner";

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
  link?: string;
  currentValue?: string;
  action?: () => void;
}

interface ProfileMenuGroup {
  groupTitle?: string;
  items: ProfileMenuItem[];
}


export default function ProfilePage() {
  const { currentUser, logout } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();

  const [activeTab, setActiveTab] = useState<string>("/admin/hosts"); // Default tab

  // Profile editing states
  const [editableProfileName, setEditableProfileName] = useState<string>("");
  const [editableBio, setEditableBio] = useState<string>("");
  const [editableKakoShowId, setEditableKakoShowId] = useState<string>("");
  const [editableCountry, setEditableCountry] = useState<string | undefined>(undefined);
  const [editableGender, setEditableGender] = useState<UserProfile['gender'] | undefined>(undefined);
  const [editableBirthDate, setEditableBirthDate] = useState<Date | undefined>(undefined);
  const [editablePhoneNumber, setEditablePhoneNumber] = useState<string>("");

  const [isSaving, setIsSaving] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  const placeholderPosts: FeedPost[] = [ 
    {
      id: "post1",
      user: { name: currentUser?.profileName || "Usuário", handle: `@${currentUser?.email?.split('@')[0] || 'usuario'}`, avatarUrl: currentUser?.photoURL || "https://placehold.co/48x48.png" },
      content: "Primeiro post no meu perfil!",
      timestamp: "2h",
      stats: { replies: 10, retweets: 5, likes: 20 },
    },
     {
      id: "post2",
      user: { name: currentUser?.profileName || "Usuário", handle: `@${currentUser?.email?.split('@')[0] || 'usuario'}`, avatarUrl: currentUser?.photoURL || "https://placehold.co/48x48.png" },
      content: "Aproveitando o dia! ☀️ #blessed",
      timestamp: "5h",
      imageUrl: "https://placehold.co/600x400.png",
      imageAiHint: "sunny beach",
      stats: { replies: 15, retweets: 8, likes: 50 },
    },
  ];

  const profileMenuGroups: ProfileMenuGroup[] = useMemo(() => [
    {
      groupTitle: "GERAL",
      items: [
        { id: "visaoGeral", title: "Visão Geral", icon: UserCircle2, link: "/profile/overview" },
        { id: "informacoesPessoais", title: "Informações Pessoais", icon: Clipboard, link: "/profile/edit" },
        { id: "aparencia", title: "Aparência", icon: SettingsIcon, link: "/settings" },
      ],
    },
    {
      groupTitle: "CONTA",
      items: [
          { id: "seguranca", title: "Segurança", icon: Lock, link: "/profile/security" },
          { id: "notificacoes", title: "Notificações", icon: Bell, link: "/profile/notifications" },
      ]
    },
    {
      groupTitle: "SOBRE",
      items: [
        { id: "user-agreement", title: "Contrato do usuário", icon: FileText, link: "/profile/user-agreement" },
        { id: "privacy-policy", title: "Política de privacidade", icon: FileText, link: "/profile/privacy-policy" },
      ],
    },
    {
      items: [
        { id: "suporte", title: "Suporte", icon: Headphones, link: "/support" },
      ],
    },
     {
      items: [
        { id: "sair", title: "Sair", icon: LogOut, action: () => handleLogout() },
      ],
    },
  ], []);


  useEffect(() => {
    // Initialize activeTab based on the current path or a default
    const initialTab = profileMenuGroups.flatMap(g => g.items).find(item => item.link === pathname)?.id || "visaoGeral";
    setActiveTab(initialTab);
  }, [pathname, profileMenuGroups]);


  useEffect(() => {
    if (currentUser) {
      setEditableProfileName(currentUser.profileName || currentUser.displayName || "");
      setEditableBio(currentUser.bio || "");
      setEditableKakoShowId(currentUser.kakoShowId || ""); 
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
      profileName: editableProfileName.trim() || currentUser.displayName,
      displayName: editableProfileName.trim() || currentUser.displayName, 
      bio: editableBio.trim(),
      kakoShowId: editableKakoShowId.trim(), 
      country: editableCountry,
      gender: editableGender,
      phoneNumber: editablePhoneNumber.trim().replace(/(?!^\+)[^\d]/g, ''), 
      updatedAt: serverTimestamp(),
    };

    if (editableBirthDate && isValid(editableBirthDate)) {
      dataToUpdate.birthDate = format(editableBirthDate, "yyyy-MM-dd");
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

  const maxCalendarDate = new Date();
  const minCalendarDate = subYears(new Date(), 100);

  const handleMenuClick = (item: ProfileMenuItem) => {
    if (item.action) {
      item.action();
    } else if (item.link) {
      router.push(item.link);
    } else {
      // For items that change content within the profile page
      // This might need to be adjusted if some items should navigate instead of just setting tab
      setActiveTab(item.id);
    }
  };

  const getInitials = (name?: string | null): string => {
    if (!name) return "KI"; 
    const parts = name.split(" ");
    if (parts.length > 1 && parts[0] && parts[1]) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const userHandle = currentUser?.email?.split('@')[0] || "usuario";
  const profileName = currentUser?.profileName || currentUser?.displayName || "Usuário";


  const renderContent = () => {
    if (!currentUser) return <div className="p-6"><LoadingSpinner /></div>;

    switch (activeTab) {
      case 'visaoGeral':
      case '/profile/overview':
        return (
          <div className="w-full">
            {/* Banner */}
            <div className="h-40 bg-gradient-to-r from-primary/30 to-accent/30 relative">
               <Image src="https://placehold.co/1200x400.png" alt="Banner do perfil" layout="fill" objectFit="cover" data-ai-hint="abstract banner" />
              <div className="absolute top-4 right-4 flex space-x-2">
                <Button variant="outline" size="icon" className="bg-white/30 backdrop-blur-sm text-white hover:bg-white/50 h-8 w-8 rounded-full">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Profile Info Section */}
            <div className="bg-card px-6 pb-6">
              <div className="flex flex-col items-center -mt-16 sm:-mt-20 relative z-10">
                <Avatar className="h-28 w-28 md:h-32 md:w-32 border-4 border-card shadow-lg">
                  <AvatarImage src={currentUser.photoURL || undefined} alt={profileName} data-ai-hint="user profile" />
                  <AvatarFallback>{getInitials(profileName)}</AvatarFallback>
                </Avatar>
                
                <div className="mt-4 text-center">
                    <p className="text-sm text-muted-foreground">@{userHandle}</p>
                    <div className="flex items-center justify-center mt-1">
                        <h1 className="text-2xl font-bold text-foreground">{profileName}</h1>
                        {currentUser.isVerified && (
                             <BadgeCheck className="h-5 w-5 text-pink-500 ml-1.5" />
                        )}
                    </div>
                    <p className="mt-1 text-sm text-foreground/90">{currentUser.bio || "UX/UI Designer, 4+ years of experience"}</p>
                </div>

                <div className="mt-3 text-xs text-muted-foreground flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
                    <div className="flex items-center">
                    <MapPin className="h-3.5 w-3.5 mr-1" /> {currentUser.country || "Luxemburgo"}
                    </div>
                    <div className="flex items-center">
                    <LucideCalendarIcon className="h-3.5 w-3.5 mr-1" /> 
                    Entrou {currentUser.createdAt?.toDate ? formatDistanceToNow(currentUser.createdAt.toDate(), { addSuffix: true, locale: ptBR }) : "há cerca de 2 horas"}
                    </div>
                   {currentUser.kakoShowId && (
                    <div className="flex items-center">
                        <Fingerprint className="h-3.5 w-3.5 mr-1" /> Show ID: {currentUser.kakoShowId}
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
                  <Button variant="outline" className="rounded-full px-6 text-sm h-9" onClick={() => setActiveTab('informacoesPessoais')}>
                    Editar perfil
                  </Button>
                </div>
              </div>
            </div>
             <Tabs defaultValue="posts" className="w-full mt-0">
              <TabsList className="grid w-full grid-cols-3 sticky top-0 z-10 bg-card border-b">
                <TabsTrigger value="posts">Posts</TabsTrigger>
                <TabsTrigger value="respostas">Respostas</TabsTrigger>
                <TabsTrigger value="midia">Mídia</TabsTrigger>
              </TabsList>
              <TabsContent value="posts" className="mt-0">
                 <div className="space-y-0 border-x border-border">
                    {placeholderPosts.map(post => (
                        <PostCard key={post.id} post={{
                            ...post,
                            user: {
                                name: profileName,
                                handle: `@${userHandle}`,
                                avatarUrl: currentUser.photoURL || "https://placehold.co/48x48.png",
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
      case '/profile/edit':
        return (
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
                  <Label htmlFor="kakoShowId-profile">ID de Exibição Kako (Show ID)</Label>
                  <Input id="kakoShowId-profile" value={editableKakoShowId} onChange={(e) => setEditableKakoShowId(e.target.value)} placeholder="Seu ID público no Kako Live" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="phone-number-profile">Celular (WhatsApp)</Label>
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
                <Label htmlFor="birthdate-picker-profile">Data de Nascimento</Label>
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
                      defaultMonth={editableBirthDate || subYears(new Date(), 18)}
                      disabled={(date) => date > maxCalendarDate || date < minCalendarDate}
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
        );
      // Add cases for other activeTab values (seguranca, notificacoes, etc.)
      default:
        const activeMenuItem = profileMenuGroups.flatMap(g => g.items).find(item => item.id === activeTab);
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">{activeMenuItem?.title || "Seção"}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Conteúdo para {activeMenuItem?.title || "esta seção"} em desenvolvimento.</p>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <ProtectedPage>
       <div className="flex flex-col h-full"> {/* Main container for full height */}
         <div className="flex-grow flex flex-col md:flex-row gap-0 overflow-hidden"> {/* Two-column layout */}
           {/* Left Navigation Sidebar */}
           <nav className="md:w-72 lg:w-80 flex-shrink-0 border-r bg-muted/40 h-full overflow-y-auto p-2 space-y-4">
            {profileMenuGroups.map((group, groupIndex) => (
              <div key={group.groupTitle || `group-${groupIndex}`} className={cn(groupIndex > 0 && "pt-4")}>
                {group.groupTitle && (
                  <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
                    {group.groupTitle}
                  </h2>
                )}
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const isActive = activeTab === item.id || (item.link && pathname === item.link);
                    const isAction = !!item.action;

                    const buttonContent = (
                        <>
                          <div className="flex items-center gap-2.5">
                            <item.icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground")} />
                            <span>{item.title}</span>
                          </div>
                          <div className="flex items-center ml-auto">
                            {item.currentValue && <span className="text-xs text-muted-foreground mr-2">{item.currentValue}</span>}
                            {!isAction && item.link !== "/settings" && item.link !== "/support" && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                          </div>
                        </>
                    );
                    
                    return (
                       <Button
                        key={item.id}
                        variant="ghost"
                        className={cn(
                          "w-full text-left h-auto text-sm font-medium rounded-md transition-colors",
                           isActive
                            ? "bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary"
                            : "text-card-foreground hover:bg-card/80 bg-card shadow-sm hover:text-card-foreground",
                           "justify-between py-3 px-3"
                        )}
                        onClick={() => handleMenuClick(item)}
                      >
                        {buttonContent}
                      </Button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Right Content Area */}
           <main className="flex-1 h-full overflow-y-auto p-6">
            {renderContent()}
          </main>
        </div>
      </div>
    </ProtectedPage>
  );
}
