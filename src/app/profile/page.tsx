
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
  LogOut, UserCircle2, Save, Globe, Phone, Diamond, MoreHorizontal, MessageSquare, MapPin, Home as HomeIcon, Clock, Users, Package, Database, ThumbsUp, UserPlus, Image as ImageIcon, Settings as SettingsIcon, Check, Clipboard, DatabaseZap, Lock, CreditCard, Info, ChevronRight, Bell, UserCog, XCircle, Link as LinkIconLucide, ServerOff, FileText, Headphones, LayoutDashboard, Star, Share2, CalendarDays as LucideCalendarIcon, BadgeCheck, Fingerprint, Ticket as TicketIcon, RefreshCw
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
  if (!value.trim()) return ""; // Return empty if input is cleared or only whitespace

  const originalStartsWithPlus = value.charAt(0) === '+';
  // Remove all non-digits, except for a leading + if it was originally there
  let digitsOnly = (originalStartsWithPlus ? value.substring(1) : value).replace(/[^\d]/g, '');

  // Limit to a common international length, e.g., 13 digits after the plus
  // (e.g., +CC (AA) 9XXXX-YYYY = 2 + 2 + 5 + 4 = 13 digits)
  digitsOnly = digitsOnly.slice(0, 13);
  const len = digitsOnly.length;

  if (len === 0) {
    return originalStartsWithPlus ? "+" : ""; // If user typed only '+', keep it. Otherwise, empty.
  }

  let formatted = "+"; // Always start with + if there are digits

  if (len <= 2) { // Country code part, e.g., +55
    formatted += digitsOnly;
  } else if (len <= 4) { // Country + Area code part, e.g., +55 (19)
    formatted += `${digitsOnly.slice(0, 2)} (${digitsOnly.slice(2)})`;
  } else { // Country + Area code + Local number part
    const countryCode = digitsOnly.slice(0, 2);
    const areaCode = digitsOnly.slice(2, 4);
    const localPart = digitsOnly.slice(4);
    
    formatted += `${countryCode} (${areaCode}) `;

    if (localPart.length <= 4) { // e.g., +55 (19) 1234
      formatted += localPart;
    } else if (localPart.length <= 8 && localPart.length >= 5 && localPart[0] !== '9') { // e.g., +55 (19) 1234-5678 (for an 8-digit local landline)
      formatted += `${localPart.slice(0, 4)}-${localPart.slice(4)}`;
    } else { // Handles 9-digit local numbers like +55 (19) 91234-5678, or other 5-8 digit local parts starting with 9
      formatted += `${localPart.slice(0, 5)}-${localPart.slice(5)}`;
    }
  }
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
        { id: "sair", title: "Sair", icon: LogOut, action: () => handleLogout() },
      ],
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [logout]); 


  useEffect(() => {
    const hash = window.location.hash.substring(1);
    if (hash && profileMenuGroups.flatMap(g => g.items).some(item => item.id === hash)) {
      setActiveTab(hash);
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]); 
  

  const getInitials = (name?: string | null): string => {
    if (!name) return "KI"; 
    const parts = name.split(" ");
    if (parts.length > 1 && parts[0] && parts[1]) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const currentProfileName = currentUser?.profileName || currentUser?.displayName || "Usuário";
  const userHandle = currentUser?.email?.split('@')[0]?.toLowerCase() || "usuario";


  const renderContent = () => {
    if (!currentUser) return <div className="p-6 flex justify-center items-center h-full"><LoadingSpinner /></div>;

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
                  <AvatarImage src={currentUser.photoURL || undefined} alt={currentProfileName} data-ai-hint="user profile photo"/>
                  <AvatarFallback>{getInitials(currentProfileName)}</AvatarFallback>
                </Avatar>
                
                <div className="mt-4 text-center">
                    <p className="text-sm text-muted-foreground">@{userHandle}</p>
                    <div className="flex items-center justify-center mt-1">
                        <h1 className="text-2xl font-bold text-foreground">{currentProfileName}</h1>
                        {currentUser.isVerified && (
                             <BadgeCheck className="h-5 w-5 text-pink-500 ml-1.5" />
                        )}
                    </div>
                    <p className="mt-1 text-sm text-foreground/90 px-4 md:px-0 max-w-md mx-auto">{currentUser.bio || "UX/UI Designer, 4+ years of experience"}</p>
                </div>

                <div className="mt-3 text-xs text-muted-foreground flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
                    {currentUser.country && <div className="flex items-center\"><MapPin className=\"h-3.5 w-3.5 mr-1\" /> {currentUser.country}</div>}
                    <div className=\"flex items-center\">
                        <LucideCalendarIcon className=\"h-3.5 w-3.5 mr-1\" /> 
                        Entrou {currentUser.createdAt?.toDate ? formatDistanceToNow(currentUser.createdAt.toDate(), { addSuffix: true, locale: ptBR }) : \"há pouco tempo\"}
                    </div>
                   {currentUser.showId && (
                    <div className=\"flex items-center\">
                        <Fingerprint className=\"h-3.5 w-3.5 mr-1\" /> Show ID: {currentUser.showId}
                    </div>
                   )}
                   {currentUser.adminLevel && (
                      <div className=\"flex items-center\">
                          <Diamond className=\"mr-1.5 h-3.5 w-3.5 text-muted-foreground flex-shrink-0\" />
                          <Badge variant=\"destructive\" className=\"capitalize\">
                            {currentUser.adminLevel.charAt(0).toUpperCase() + currentUser.adminLevel.slice(1)}
                          </Badge>
                      </div>
                   )}
                </div>
                
                <div className=\"mt-4 flex items-center text-sm text-muted-foreground space-x-4\">
                    <div><span className=\"font-semibold text-foreground\">{currentUser.followingCount || 0}</span> Seguindo</div>
                    <div><span className=\"font-semibold text-foreground\">{currentUser.followerCount || 0}</span> Seguidores</div>
                </div>

                <div className=\"mt-6 flex space-x-2\">
                  <Button className=\"bg-pink-500 hover:bg-pink-600 text-white rounded-full px-6 text-sm h-9\">
                    Inscrever-se
                  </Button>
                  <Button 
                    variant=\"outline\" 
                    className=\"rounded-full px-6 text-sm h-9\" 
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
             <Tabs defaultValue=\"posts\" className=\"w-full mt-0\">
              <TabsList className=\"grid w-full grid-cols-3 sticky top-0 z-10 bg-card border-b px-6\">
                <TabsTrigger value=\"posts\">Posts</TabsTrigger>
                <TabsTrigger value=\"respostas\">Respostas</TabsTrigger>
                <TabsTrigger value=\"midia\">Mídia</TabsTrigger>
              </TabsList>
              <TabsContent value=\"posts\" className=\"mt-0\">
                 <div className=\"space-y-0\">
                    {placeholderPosts.map(post => (
                        <PostCard key={post.id} post={{\n                            ...post,\n                            user: {\n                                name: currentProfileName,\n                                handle: `@${userHandle}`,\n                                avatarUrl: currentUser.photoURL || undefined,\n                            }\n                        }} />
                    ))}\n                    <div className=\"p-6 text-center text-muted-foreground\">Fim dos posts.</div>\n                </div>\n              </TabsContent>\n              <TabsContent value=\"respostas\" className=\"p-6 text-center text-muted-foreground\">Conteúdo de Respostas em desenvolvimento.</TabsContent>\n              <TabsContent value=\"midia\" className=\"p-6 text-center text-muted-foreground\">Conteúdo de Mídia em desenvolvimento.</TabsContent>\n            </Tabs>\n          </div>\n        );\n      case 'informacoesPessoais':\n        return (\n          <div className=\"p-6\">\n            <Card>\n              <CardHeader>\n                <CardTitle className=\"text-lg font-semibold\">Editar Informações Pessoais</CardTitle>\n                <CardDescription>Atualize seus dados pessoais. Clique em salvar após as alterações.</CardDescription>\n              </CardHeader>\n              <CardContent className=\"space-y-4\">\n                <div className=\"space-y-1\">\n                    <Label htmlFor=\"profileName-profile\">Nome de Perfil</Label>\n                    <Input id=\"profileName-profile\" value={editableProfileName} onChange={(e) => setEditableProfileName(e.target.value)} />\n                </div>\n                <div className=\"space-y-1\">\n                    <Label htmlFor=\"showId-profile\">ID de Exibição Kako (Show ID)</Label>\n                    <Input id=\"showId-profile\" value={editableShowId} onChange={(e) => setEditableShowId(e.target.value)} placeholder=\"Seu ID público no Kako Live\" />\n                </div>\n                <div className=\"space-y-1\">\n                  <Label htmlFor=\"phone-number-profile\">Celular (WhatsApp)</Label>\n                  <div className=\"relative\">\n                    <Phone className=\"absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground\" />\n                    <Input\n                      id=\"phone-number-profile\"\n                      type=\"tel\"\n                      placeholder=\"+00 (00) 00000-0000\"\n                      value={editablePhoneNumber}\n                      onChange={(e) => setEditablePhoneNumber(formatPhoneNumberForDisplay(e.target.value))}\n                      className=\"pl-10 h-12\"\n                    />\n                  </div>\n                </div>\n                <div className=\"pt-2 space-y-1\">\n                  <Label htmlFor=\"gender-select-profile\">Sexo</Label>\n                  <Select\n                    value={editableGender}\n                    onValueChange={(value) => setEditableGender(value as UserProfile['gender'])}\n                  >\n                    <SelectTrigger id=\"gender-select-profile\" className=\"w-full h-12\">\n                      <SelectValue placeholder=\"Selecione seu sexo\" />\n                    </SelectTrigger>\n                    <SelectContent>\n                      <SelectItem value=\"male\">Masculino</SelectItem>\n                      <SelectItem value=\"female\">Feminino</SelectItem>\n                      <SelectItem value=\"other\">Outro</SelectItem>\n                      <SelectItem value=\"preferNotToSay\">Prefiro não dizer</SelectItem>\n                    </SelectContent>\n                  </Select>\n                </div>\n                <div className=\"pt-2 space-y-1\">\n                  <Label htmlFor=\"birthdate-picker-profile\">Data de Nascimento</Label>\n                  <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>\n                    <PopoverTrigger asChild>\n                      <Button\n                        id=\"birthdate-picker-profile\"\n                        variant={\"outline\"}\n                        className={cn(\n                          \"w-full justify-start text-left font-normal h-12\",\n                          !editableBirthDate && \"text-muted-foreground\"\n                        )}\n                      >\n                        <LucideCalendarIcon className=\"mr-2 h-4 w-4\" />\n                        {editableBirthDate ? (\n                          format(editableBirthDate, \"PPP\", { locale: ptBR })\n                        ) : (\n                          <span>Selecione uma data</span>\n                        )}\n                      </Button>\n                    </PopoverTrigger>\n                    <PopoverContent className=\"w-auto p-0\">\n                      <Calendar\n                        mode=\"single\"\n                        selected={editableBirthDate}\n                        onSelect={(date) => {\n                          setEditableBirthDate(date);\n                          if (date) setIsCalendarOpen(false);\n                        }}\n                        initialFocus\n                        locale={ptBR}\n                        captionLayout=\"dropdown-buttons\"\n                        fromYear={subYears(new Date(), 100).getFullYear()}\n                        toYear={new Date().getFullYear()}\n                        defaultMonth={editableBirthDate || subYears(new Date(), 18)}\n                        disabled={(date) => date > new Date() || date < subYears(new Date(), 100)}\n                      />\n                    </PopoverContent>\n                  </Popover>\n                </div>\n                <div className=\"pt-2 space-y-1\">\n                  <Label htmlFor=\"country-select-profile\">País</Label>\n                  <Select\n                    value={editableCountry}\n                    onValueChange={(value) => setEditableCountry(value)}\n                  >\n                    <SelectTrigger id=\"country-select-profile\" className=\"w-full h-12\">\n                      <Globe className=\"mr-2 h-4 w-4 text-muted-foreground\" />\n                      <SelectValue placeholder=\"Selecione seu país\" />\n                    </SelectTrigger>\n                    <SelectContent>\n                      {countries.map((country) => (\n                        <SelectItem key={country.code} value={country.name}>\n                          {country.name}\n                        </SelectItem>\n                      ))}\n                    </SelectContent>\n                  </Select>\n                </div>\n                 <div className=\"pt-2 space-y-1\">\n                  <Label htmlFor=\"bio-profile\">Bio (Sobre Mim)</Label>\n                  <Textarea id=\"bio-profile\" value={editableBio} onChange={(e) => setEditableBio(e.target.value)} rows={4} maxLength={160} placeholder=\"Conte um pouco sobre você...\" />\n                </div>\n                <Button onClick={handleSaveProfile} className=\"w-full mt-6\" disabled={isSaving}>\n                  {isSaving ? <LoadingSpinner size=\"sm\" className=\"mr-2\" /> : <Save className=\"mr-2 h-4 w-4\" />}\n                  Salvar Alterações\n                </Button>\n              </CardContent>\n            </Card>\n          </div>\n        );\n      case 'aparencia': \n      case 'suporte':\n        return <div className=\"p-6\"><Card><CardContent><p className=\"text-muted-foreground\">Redirecionando...</p></CardContent></Card></div>;\n      default:\n        const activeItem = profileMenuGroups.flatMap(g => g.items).find(item => item.id === activeTab);\n        return (\n          <div className=\"p-6\">\n            <Card>\n              <CardHeader><CardTitle>{activeItem?.title || \"Seção\"}</CardTitle></CardHeader>\n              <CardContent>\n                <p className=\"text-muted-foreground\">Conteúdo para {activeItem?.title || \"esta seção\"} em desenvolvimento.</p>\n              </CardContent>\n            </Card>\n          </div>\n        );\n    }\n  };\n\n  if (!currentUser) {\n    return <div className=\"p-6 flex justify-center items-center h-full\"><LoadingSpinner /></div>;\n  }\n\n  return (\n    <ProtectedPage>\n       <div className=\"flex flex-col md:flex-row h-full gap-0 overflow-hidden\">\n         <nav className=\"md:w-72 lg:w-80 flex-shrink-0 border-r bg-muted/40 h-full overflow-y-auto p-2 space-y-4\">\n            {profileMenuGroups.map((group, groupIndex) => (\n              <div key={group.groupTitle || `profile-group-${groupIndex}`} className={cn(group.groupTitle ? \"\" : \"pt-2\", group.isBottomSection && \"mt-auto\")}>\n                {group.groupTitle && (\n                  <h2 className=\"text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2\">\n                    {group.groupTitle}\n                  </h2>\n                )}\n                <div className=\"space-y-1\">\n                  {group.items.map((item) => {\n                    const isActive = activeTab === item.id;\n                    \n                    return (\n                       <Button\n                        key={item.id}\n                        variant=\"ghost\"\n                        className={cn(\n                          \"w-full text-left h-auto text-sm font-normal rounded-md transition-all\",\n                           isActive\n                            ? \"bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary\"\n                            : \"text-card-foreground hover:bg-card/80 bg-card shadow-sm hover:text-card-foreground\",\n                           \"justify-between py-3 px-3\"\n                        )}\n                        onClick={() => handleMenuClick(item)}\n                      >\n                        <div className=\"flex items-center gap-2.5\">\n                            <item.icon className={cn(\"h-5 w-5\", isActive ? \"text-primary\" : \"text-muted-foreground\")} />\n                            <span>{item.title}</span>\n                        </div>\n                        <div className=\"flex items-center ml-auto\">\n                            {item.currentValue && <span className=\"text-xs text-muted-foreground mr-2\">{item.currentValue}</span>}\n                            {(!item.link || (item.link && item.link.startsWith(\"/profile#\"))) && !item.action && item.id !== 'aparencia' && item.id !== 'suporte' && item.id !== 'sair' ? <ChevronRight className=\"h-4 w-4 text-muted-foreground\" /> : null }\n                        </div>\n                      </Button>\n                    );\n                  })}\n                </div>\n              </div>\n            ))}\n          </nav>\n\n           <main className=\"flex-1 h-full overflow-y-auto\"> \n            {renderContent()}\n          </main>\n        </div>\n    </ProtectedPage>\n  );\n}\n",
      "description": "Fixed the syntax error in `/src/app/profile/page.tsx` caused by an extraneous backslash in a className string. Replaced `font-semibold\\` with `font-semibold`."
    }
  ]
}
```