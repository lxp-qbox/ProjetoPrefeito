
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  LogOut, UserCircle2, Save, Globe, Phone, Diamond, Share2, CalendarDays as LucideCalendarIcon, BadgeCheck, Fingerprint, Clipboard, Settings as SettingsIcon
} from "lucide-react";
import NextImage from 'next/image';
import { usePathname, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import LoadingSpinner from "@/components/ui/loading-spinner";
import type { UserProfile, FeedPost } from "@/types";
import { countries } from "@/lib/countries";
import { format, parseISO, subYears, isValid, parse, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { db, doc, updateDoc, serverTimestamp } from "@/lib/firebase";

const formatPhoneNumberForDisplay = (value: string): string => {
  if (!value.trim()) return "";
  const originalStartsWithPlus = value.charAt(0) === '+';
  let digitsOnly = (originalStartsWithPlus ? value.substring(1) : value).replace(/[^\d]/g, '');
  digitsOnly = digitsOnly.slice(0, 13);
  const len = digitsOnly.length;

  if (len === 0) {
    return originalStartsWithPlus ? "+" : "";
  }

  let formatted = "+";
  const countryCode = digitsOnly.slice(0, 2);
  const areaCode = digitsOnly.slice(2, 4);

  if (len <= 2) {
    formatted += digitsOnly;
  } else if (len <= 4) {
    formatted += `${countryCode}${areaCode ? ` (${areaCode}` : ''}${len > 2 && len < 4 ? '' : len === 4 ? ')' : ''}`;
  } else {
    const localPart = digitsOnly.slice(4);
    formatted += `${countryCode} (${areaCode}) `;
    if (countryCode === '55' && localPart.length === 9) {
      formatted += `${localPart.slice(0, 5)}-${localPart.slice(5)}`;
    } else if (localPart.length <= 4 && localPart.length > 0) {
      formatted += localPart;
    } else if (localPart.length <= 8) {
      formatted += `${localPart.slice(0, 4)}-${localPart.slice(4)}`;
    } else {
       formatted += `${localPart.slice(0,5)}-${localPart.slice(5)}`;
    }
  }
  return formatted;
};

interface ProfileMenuItem {
  id: string;
  title: string;
  icon: React.ElementType;
  link?: string;
  action?: () => void;
}

// This interface is not strictly needed if we don't render group titles, but kept for potential structure
interface ProfileMenuGroup {
  groupTitle?: string;
  items: ProfileMenuItem[];
}


export default function ProfilePage() {
  const { currentUser, logout, refreshUserProfile } = useAuth();
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
    const userName = currentUser.profileName || currentUser.displayName || "Usuário";
    const userAvatar = currentUser.photoURL || undefined;
    const userHandleCalculated = `@${(currentUser.email?.split('@')[0] || "usuario").toLowerCase()}`;

    return [
    {
      id: "post1-profile",
      userId: currentUser.uid,
      user: { name: userName, handle: userHandleCalculated, avatarUrl: userAvatar, dataAiHint: "user avatar" },
      content: "Primeiro post no meu perfil! 🎉 Ansioso para interagir com todos aqui.",
      timestamp: "2h",
      stats: { replies: 10, retweets: 5, likes: 20 },
    },
     {
      id: "post2-profile",
      userId: currentUser.uid,
      user: { name: userName, handle: userHandleCalculated, avatarUrl: userAvatar, dataAiHint: "user avatar" },
      content: "Aproveitando o dia! ☀️ #abençoado #novaplataforma",
      timestamp: "5h",
      imageUrl: "https://placehold.co/600x400.png",
      imageAiHint: "sunny beach",
      stats: { replies: 15, retweets: 8, likes: 50 },
    },
  ];
  }, [currentUser]);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      toast({ title: "Sessão Encerrada", description: "Você foi desconectado com sucesso." });
      router.push("/");
    } catch (error: any) {
      toast({ title: "Falha ao Sair", description: error.message, variant: "destructive" });
    }
  }, [logout, router, toast]);

  const profileMenuItems: ProfileMenuItem[] = useMemo(() => [
    { id: "visaoGeral", title: "Visão Geral", icon: UserCircle2, link: "/profile#visaoGeral" },
    { id: "informacoesPessoais", title: "Informações Pessoais", icon: Clipboard, link: "/profile#informacoesPessoais" },
    { id: "sair", title: "Sair", icon: LogOut, action: handleLogout },
  ], [handleLogout]);


  useEffect(() => {
    const hash = window.location.hash.substring(1);
    const currentItem = profileMenuItems.find(item => item.id === hash);

    if (currentItem) {
      setActiveTab(hash);
    } else if (pathname === "/profile" && !hash) {
      setActiveTab("visaoGeral");
    } else {
      const defaultProfileTab = profileMenuItems.find(item => item.link === pathname || `/profile#${item.id}` === pathname);
      if (defaultProfileTab) {
        setActiveTab(defaultProfileTab.id);
      } else {
        setActiveTab("visaoGeral");
      }
    }
  }, [pathname, profileMenuItems]);


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
      profileName: editableProfileName.trim() || currentUser.displayName,
      displayName: editableProfileName.trim() || currentUser.displayName,
      bio: editableBio.trim(),
      showId: editableShowId.trim(),
      country: editableCountry || null,
      gender: editableGender || null,
      phoneNumber: editablePhoneNumber.trim().replace(/(?!^\+)[^\d]/g, '') || null,
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
      await refreshUserProfile();
      toast({ title: "Perfil Atualizado", description: "Suas informações foram salvas." });
    } catch (error) {
      console.error("Erro ao salvar perfil:", error);
      toast({ title: "Erro ao Salvar", description: "Não foi possível salvar suas informações.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleMenuClick = (item: ProfileMenuItem) => {
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
  };


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
    if (!currentUser) {
        return <div className="p-6 flex justify-center items-center h-full"><LoadingSpinner /></div>;
    }

    switch (activeTab) {
      case 'visaoGeral':
        return (
           <div className="w-full bg-card"> {/* Ensures white background for this section */}
            {/* Banner */}
            <div className="h-40 bg-gradient-to-r from-primary/30 to-primary/10 relative">
               <NextImage src="https://placehold.co/1200x400.png" alt="Banner do perfil" layout="fill" objectFit="cover" data-ai-hint="abstract banner" />
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
                        {currentUser.adminLevel === 'master' ? (
                          <svg viewBox="0 0 22 22" aria-label="Conta verificada de Administrador Master" role="img" className="ml-1.5 h-5 w-5" data-testid="icon-admin-verified">
                            <g>
                              <linearGradient gradientUnits="userSpaceOnUse" id="admin-badge-a-profile" x1="4.411" x2="18.083" y1="2.495" y2="21.508"><stop offset="0" stopColor="#f4e72a"></stop><stop offset=".539" stopColor="#cd8105"></stop><stop offset=".68" stopColor="#cb7b00"></stop><stop offset="1" stopColor="#f4ec26"></stop><stop offset="1" stopColor="#f4e72a"></stop></linearGradient>
                              <linearGradient gradientUnits="userSpaceOnUse" id="admin-badge-b-profile" x1="5.355" x2="16.361" y1="3.395" y2="19.133"><stop offset="0" stopColor="#f9e87f"></stop><stop offset=".406" stopColor="#e2b719"></stop><stop offset=".989" stopColor="#e2b719"></stop></linearGradient>
                              <g clipRule="evenodd" fillRule="evenodd"><path d="M13.324 3.848L11 1.6 8.676 3.848l-3.201-.453-.559 3.184L2.06 8.095 3.48 11l-1.42 2.904 2.856 1.516.559 3.184 3.201-.452L11 20.4l2.324-2.248 3.201.452.559-3.184 2.856-1.516L18.52 11l1.42-2.905-2.856-1.516-.559-3.184zm-7.09 7.575l3.428 3.428 5.683-6.206-1.347-1.247-4.4 4.795-2.072-2.072z" fill="url(#admin-badge-a-profile)"></path><path d="M13.101 4.533L11 2.5 8.899 4.533l-2.895-.41-.505 2.88-2.583 1.37L4.2 11l-1.284 2.627 2.583 1.37.505 2.88 2.895-.41L11 19.5l2.101-2.033 2.895.41.505-2.88 2.583-1.37L17.8 11l1.284-2.627-2.583-1.37-.505-2.88zm-6.868 6.89l3.429 3.428 5.683-6.206-1.347-1.247-4.4 4.795-2.072-2.072z" fill="url(#admin-badge-b-profile)"></path><path d="M6.233 11.423l3.429 3.428 5.65-6.17.038-.033-.005 1.398-5.683 6.206-3.429-3.429-.003-1.405.005.003z" fill="#d18800"></path></g>
                            </g>
                          </svg>
                        ) : currentUser.isPremiumVerified ? (
                          <svg viewBox="0 0 22 22" aria-label="Conta verificada" role="img" className="ml-1.5 h-5 w-5" data-testid="icon-verified">
                            <g><path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" fill="#1DA1F2"></path></g>
                          </svg>
                        ) : currentUser.isVerified ? (
                          <BadgeCheck className="h-5 w-5 text-primary ml-1.5" />
                        ) : null}
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
                   {currentUser.adminLevel && currentUser.adminLevel !== 'master' && (
                      <div className="flex items-center">
                          <Diamond className="mr-1.5 h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                          <Badge variant="secondary" className="capitalize">
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
                  <Button variant="outline" className="rounded-full px-6 text-sm h-9" onClick={() => {
                     const infoItem = profileMenuItems.find(i => i.id === 'informacoesPessoais');
                     if (infoItem) handleMenuClick(infoItem);
                  }}>
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
                                name: currentProfileName,
                                handle: `@${userHandle}`,
                                avatarUrl: currentUser.photoURL || undefined,
                                dataAiHint: "user avatar"
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
                    value={editableGender || ""}
                    onValueChange={(value) => setEditableGender(value as UserProfile['gender'] || undefined)}
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
                    value={editableCountry || ""}
                    onValueChange={(value) => setEditableCountry(value || undefined)}
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
      default:
        // Fallback for any other unhandled tabs, which are placeholders
        const activeDefaultItem = profileMenuItems.find(item => item.id === activeTab);
        return (
          <div className="p-6">
            <Card>
              <CardHeader><CardTitle>{activeDefaultItem?.title || "Seção"}</CardTitle></CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Conteúdo para {activeDefaultItem?.title || "esta seção"} em desenvolvimento.</p>
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
         <nav className="md:w-72 lg:w-80 flex-shrink-0 border-r bg-muted/40 h-full overflow-y-auto p-2 space-y-1">
            {profileMenuItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                    <Button
                    key={item.id}
                    variant="ghost"
                    className={cn(
                        "w-full text-left h-auto text-sm font-normal rounded-md transition-all",
                        isActive
                        ? "bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary"
                        : "text-muted-foreground hover:text-primary hover:bg-primary/5",
                        "justify-start py-2.5 px-3"
                    )}
                    onClick={() => handleMenuClick(item)}
                    >
                    <div className="flex items-center gap-2.5">
                        <item.icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground")} />
                        <span>{item.title}</span>
                    </div>
                    </Button>
                );
            })}
          </nav>

           <main className="flex-1 h-full overflow-y-auto">
            {renderContent()}
          </main>
        </div>
    </ProtectedPage>
  );
}

    

    