
"use client";

import React, { type ReactNode, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/layout/header';
import {
    SidebarProvider,
    Sidebar,
    SidebarHeader,
    SidebarContent,
    SidebarFooter,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarTrigger,
    SidebarInset,
    SidebarSeparator,
    useSidebar
} from '@/components/ui/sidebar';
import {
    Home,
    Users,
    Gamepad2,
    MessageSquare,
    UserCircle2,
    Settings,
    LayoutDashboard,
    LogOut,
    Crown,
    TicketIcon,
    RefreshCw,
    ListFilter,
    DatabaseZap,
    Search as SearchIconLucide,
    ExternalLink,
    DownloadCloud,
    XCircle,
    Gift as GiftIconLucide,
    RadioTower,
    Info,
    FileText,
    Headphones,
    ClipboardList,
    Bookmark,
    PlayCircle,
    BarChart2,
    Tag,
    PanelLeft,
    PlugZap,
    WifiOff,
    Eye,
    ChevronDown,
    ShieldAlert,
    ServerOff,
    WalletCards,
    Settings2 as Settings2Icon,
    Diamond,
    Share2,
    CalendarDays as LucideCalendarIcon,
    BadgeCheck,
    Fingerprint,
    Clipboard
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { UserProfile, SiteModule, UserRole as AdminUserRole, MinimumAccessLevel, LogEntry, ParsedUserData, WebSocketConfig, KakoProfile, KakoGift } from "@/types";
import { db, doc, getDoc, setDoc, updateDoc, serverTimestamp, collection, query, where, getDocs, Timestamp } from "@/lib/firebase";
import { initialModuleStatuses } from '@/app/admin/maintenance/offline/page';
import { useToast } from '@/hooks/use-toast';
import { Progress } from "@/components/ui/progress";
import { Badge } from '@/components/ui/badge';

const roleHierarchy: Record<AdminUserRole, number> = {
  player: 0,
  host: 1,
  suporte: 2,
  admin: 3,
  master: 4,
};

interface SidebarFooterItem {
  id: string;
  label: string;
  icon: React.ElementType;
  href?: string;
  action?: () => Promise<void> | void;
  separatorAbove?: boolean;
}

interface MainAppLayoutProps {
  children: ReactNode;
  currentUser: UserProfile | null;
  maintenanceRules: SiteModule[];
  isReadyForContent: boolean;
  handleLogout: () => Promise<void>;
  hasUnreadMessages: boolean;
  isModuleHidden: (modulePath: string) => boolean;
  pathname: string;
  globalConnectionStatus: string;
  globalProcessedMessages: LogEntry[]; // Added for passing down
}

function MainAppLayout({
  children,
  currentUser,
  maintenanceRules, // Received as prop
  isReadyForContent,
  handleLogout,
  hasUnreadMessages,
  isModuleHidden,
  pathname,
  globalConnectionStatus, // Received as prop
  globalProcessedMessages, // Received as prop
}: MainAppLayoutProps) {
  const { isMobile, open: isDesktopSidebarOpen, setOpen: setDesktopSidebarOpen, state, setOpenMobile } = useSidebar();

  const mainSidebarNavItems = useMemo(() => [
    { id: 'home', label: 'Início', icon: Home, href: '/' },
    { id: 'hosts', label: 'Hosts', icon: Users, href: '/hosts' },
    { id: 'games', label: 'Jogos', icon: Gamepad2, href: '/games' },
    { id: 'messages', label: 'Mensagem', icon: MessageSquare, href: '/messages', notification: hasUnreadMessages },
  ].filter(item => !isModuleHidden(item.href)), [hasUnreadMessages, isModuleHidden]);

  const finalFooterItems = useMemo(() => {
    const items: SidebarFooterItem[] = [];
    let hasRenderedAnyAdminItem = false;

    if (currentUser?.adminLevel) {
      if (!isModuleHidden('/admin/bingo-admin')) {
        items.push({
          id: 'bingoAdmin',
          label: 'Bingo Admin',
          icon: TicketIcon,
          href: '/admin/bingo-admin',
          separatorAbove: true,
        });
        hasRenderedAnyAdminItem = true;
      }
      if (!isModuleHidden('/admin')) {
        items.push({
          id: 'adminPanel',
          label: 'Painel Admin',
          icon: LayoutDashboard,
          href: '/admin',
          separatorAbove: items.some(item => item.id === 'bingoAdmin'),
        });
        hasRenderedAnyAdminItem = true;
      }
    }

    if (!isModuleHidden('/profile')) {
      items.push({
        id: 'profile',
        label: 'Perfil',
        icon: UserCircle2,
        href: '/profile',
        separatorAbove: hasRenderedAnyAdminItem,
      });
    }
    if (!isModuleHidden('/settings')) {
       items.push({
        id: 'settings',
        label: 'Config',
        icon: Settings,
        href: '/settings',
        separatorAbove: false,
      });
    }
    items.push({
      id: 'logout',
      label: 'Sair',
      icon: LogOut,
      action: handleLogout,
      separatorAbove: false,
    });
    return items.filter(item => item.href ? !isModuleHidden(item.href) : true);
  }, [currentUser?.adminLevel, handleLogout, isModuleHidden]);


  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    const nameParts = name.split(' ');
    if (nameParts.length > 1 && nameParts[0] && nameParts[1]) {
      return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="flex h-full w-full">
      {/* Desktop Sidebar - Collapsible */}
      {!isMobile && (
        <Sidebar collapsible="icon" className="border-r bg-muted/40">
          <SidebarHeader className="p-0 items-center flex-col">
             <Link href="/" className={cn(
                "flex items-center justify-center h-16 overflow-hidden w-full border-b border-sidebar-border",
                state === 'expanded' ? 'px-4' : 'px-0'
            )}>
                <Crown className={cn("transition-all duration-500 ease-in-out shrink-0 text-primary", state === 'collapsed' ? "size-7" : "size-6")} />
                <span className={cn(
                    "ml-2 text-lg font-semibold text-primary whitespace-nowrap transition-all duration-500 ease-in-out",
                     state === 'collapsed' ? "opacity-0 max-w-0 delay-0" : "opacity-100 max-w-[150px] delay-200"
                )}>
                  The Presidential Agency
                </span>
             </Link>
          </SidebarHeader>
          <SidebarContent className="flex flex-col flex-1 pt-2">
            <SidebarMenu className={cn("w-full", state === 'collapsed' && "items-center")}>
              {mainSidebarNavItems.map((item) => {
                 const isActive = pathname === item.href;
                 return (
                  <SidebarMenuItem key={item.id} className="w-full">
                    <SidebarMenuButton
                      asChild
                      tooltip={item.label}
                      variant="ghost"
                      isActive={isActive}
                    >
                      <Link href={item.href || '#'}>
                        <item.icon className={cn("transition-all duration-500 ease-in-out shrink-0", state === 'collapsed' ? "size-6" : "size-5")} />
                        <span className={cn(
                          "transition-all ease-out duration-500 delay-150 whitespace-nowrap overflow-hidden opacity-100 max-w-[100px] text-xs",
                          state === 'collapsed' ? "opacity-0 max-w-0 delay-0" : "opacity-100"
                        )}>
                          {item.label}
                        </span>
                        {item.id === 'messages' && hasUnreadMessages && (
                          <span className={cn(
                              "absolute h-2 w-2 rounded-full bg-green-500 ring-1 ring-sidebar",
                              state === 'collapsed' ? "top-3 right-3 h-2.5 w-2.5" : "top-2 right-2"
                          )} />
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                 );
                })}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-2 border-t border-sidebar-border">
             <SidebarMenu className={cn("w-full", state === 'collapsed' && "items-center")}>
              {finalFooterItems.map((item) => {
                const isActive = item.href ? pathname === item.href : false;
                return (
                <React.Fragment key={item.id}>
                  {item.separatorAbove && <SidebarSeparator />}
                  <SidebarMenuItem className="w-full">
                    <SidebarMenuButton
                      asChild={!!item.href}
                      onClick={item.action}
                      tooltip={item.label}
                      variant="ghost"
                      isActive={isActive}
                    >
                      {item.href ? (
                        <Link href={item.href}>
                          <item.icon className={cn("transition-all duration-500 ease-in-out shrink-0", state === 'collapsed' ? "size-6" : "size-5")} />
                          <span className={cn(
                            "transition-all ease-out duration-500 delay-150 whitespace-nowrap overflow-hidden opacity-100 max-w-[100px] text-xs",
                            state === 'collapsed' ? "opacity-0 max-w-0 delay-0" : "opacity-100"
                          )}>
                            {item.label}
                          </span>
                        </Link>
                      ) : (
                        <>
                          <item.icon className={cn("transition-all duration-500 ease-in-out shrink-0", state === 'collapsed' ? "size-6" : "size-5")} />
                          <span className={cn(
                            "transition-all ease-out duration-500 delay-150 whitespace-nowrap overflow-hidden opacity-100 max-w-[100px] text-xs",
                            state === 'collapsed' ? "opacity-0 max-w-0 delay-0" : "opacity-100"
                          )}>
                            {item.label}
                          </span>
                        </>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </React.Fragment>
              )})}
             </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
      )}

      {/* Mobile Off-Canvas Sidebar */}
      {isMobile && (
        <Sidebar>
           <SidebarHeader className="p-4 border-b">
             <Link href="/" className="flex items-center gap-2 text-xl font-semibold text-primary" onClick={() => setOpenMobile(false)}>
                <Crown className="size-7 text-primary" />
                <span>The Presidential Agency</span>
             </Link>
           </SidebarHeader>
           <SidebarContent className="p-2">
            <SidebarMenu>
              {mainSidebarNavItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    asChild
                    variant="ghost"
                    isActive={isActive}
                    className="w-full justify-start"
                    onClick={() => setOpenMobile(false)}
                  >
                    <Link href={item.href || '#'}>
                      <item.icon className="mr-2 size-5" />
                      {item.label}
                      {item.id === 'messages' && hasUnreadMessages && (
                        <span className="ml-auto h-2 w-2 rounded-full bg-green-500 ring-1 ring-card" />
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )})}
            </SidebarMenu>
           </SidebarContent>
           <SidebarFooter className="p-2 border-t">
            <SidebarMenu>
              {finalFooterItems.map((item) => (
                 <React.Fragment key={item.id}>
                 {item.separatorAbove && <SidebarSeparator />}
                 <SidebarMenuItem>
                    <SidebarMenuButton
                        asChild={!!item.href}
                        onClick={() => {
                          if (item.action) item.action();
                          setOpenMobile(false);
                        }}
                        variant="ghost"
                        isActive={item.href ? pathname === item.href : false}
                        className="w-full justify-start"
                    >
                       {item.href ? (
                        <Link href={item.href}>
                            <item.icon className="mr-2 size-5" />
                            {item.label}
                        </Link>
                       ) : (
                        <>
                            <item.icon className="mr-2 size-5" />
                            {item.label}
                        </>
                       )}
                    </SidebarMenuButton>
                 </SidebarMenuItem>
                 </React.Fragment>
              ))}
            </SidebarMenu>
           </SidebarFooter>
        </Sidebar>
      )}

      <SidebarInset>
        <Header />
        <main className={cn(
          "flex-grow overflow-y-auto",
          (pathname === "/messages" || pathname.startsWith("/admin") || pathname === "/profile") ? "p-0" : "px-4 py-8",
          pathname === "/" ? "flex flex-col overflow-hidden" : ""
        )}>
          {isReadyForContent ? (
             React.Children.map(children, child =>
                React.isValidElement(child) && typeof child.type !== 'string' && typeof (child.type as any).propTypes === 'object'
                ? React.cloneElement(child as React.ReactElement<any>, {
                    ...( (child.type as any).propTypes?.globalConnectionStatus ? {globalConnectionStatus} : {}),
                    ...( (child.type as any).propTypes?.globalProcessedMessages ? {globalProcessedMessages} : {}),
                    ...( (child.type as any).propTypes?.pathname ? {pathname} : {}),
                  })
                : child
            )
          ) : (
            <div className="flex justify-center items-center h-full">
              <LoadingSpinner size="lg" />
            </div>
          )}
        </main>
      </SidebarInset>
    </div>
  );
}


export default function AppContentWrapper({ children }: { children: ReactNode }) {
  const { currentUser, loading: authLoading, logout, refreshUserProfile } = useAuth();
  const { toast } = useToast();
  const pathname = usePathname();
  const router = useRouter();

  const [hasUnreadMessages, setHasUnreadMessages] = useState(true);
  const [maintenanceRules, setMaintenanceRules] = useState<SiteModule[]>(initialModuleStatuses);
  const [isLoadingRules, setIsLoadingRules] = useState(true);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [isReadyForContent, setIsReadyForContent] = useState(false);

  const [webSocketUrlToConnect, setWebSocketUrlToConnect] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const [globalConnectionStatus, setGlobalConnectionStatus] = useState<string>("Desconectado");
  const [globalProcessedMessages, setGlobalProcessedMessages] = useState<LogEntry[]>([]);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isManuallyDisconnectingRef = useRef(false);
  const [currentRoomHostFUID, setCurrentRoomHostFUID] = useState<string | null>(null);

  const [newProfilesCount, setNewProfilesCount] = useState(0);
  const [newGiftsCount, setNewGiftsCount] = useState(0);
  const notificationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const standaloneAuthPaths = ['/login', '/signup', '/forgot-password', '/auth/verify-email-notice', '/maintenance'];
  const isOnboardingPage = pathname.startsWith('/onboarding');
  const isAuthPage = standaloneAuthPaths.includes(pathname);
  const isMaintenancePage = pathname === '/maintenance';


  const addGlobalLog = useCallback((logData: Omit<LogEntry, 'id' | 'timestamp'>) => {
    setGlobalProcessedMessages(prevLogs => [{
        id: String(Date.now()) + '-' + Math.random().toString(36).substr(2, 9), // Ensure unique ID
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits:3 }),
        ...logData
    }, ...prevLogs.slice(0, 499)]);
  }, []);


  const upsertKakoProfileToFirestore = useCallback(async (profileData: ParsedUserData) => {
    if (!profileData.userId) {
      addGlobalLog({ message: `Tentativa de salvar perfil Kako sem FUID: ${profileData.nickname}`, type: "error", rawData: JSON.stringify(profileData) });
      return;
    }
    const profileDocRef = doc(db, "kakoProfiles", profileData.userId);
    try {
      const docSnap = await getDoc(profileDocRef);
      const dataToSave: Partial<KakoProfile> & { lastFetchedAt: any, createdAt?: any, avatarUrl?: string | null } = {
        id: profileData.userId,
        nickname: profileData.nickname || "Desconhecido",
        avatarUrl: profileData.avatarUrl || null,
        level: profileData.level || 0,
        showId: profileData.showId || "",
        numId: typeof profileData.numId === 'number' ? profileData.numId : null,
        gender: typeof profileData.gender === 'number' ? profileData.gender : null,
        lastFetchedAt: serverTimestamp(),
      };

      if (!docSnap.exists()) {
        dataToSave.createdAt = serverTimestamp();
        await setDoc(profileDocRef, dataToSave);
        addGlobalLog({ message: `Novo perfil Kako salvo via WS: ${dataToSave.nickname} (FUID: ${dataToSave.id})`, type: "success" });
        setNewProfilesCount(prev => prev + 1);
      } else {
        const existingData = docSnap.data() as KakoProfile;
        let hasChanges = false;
        if (dataToSave.nickname !== existingData.nickname && dataToSave.nickname !== "Desconhecido") hasChanges = true;
        if (dataToSave.avatarUrl !== existingData.avatarUrl && dataToSave.avatarUrl !== null) hasChanges = true;
        if (dataToSave.level !== existingData.level && dataToSave.level !== 0) hasChanges = true;
        if (dataToSave.showId !== existingData.showId && dataToSave.showId !== "") hasChanges = true;

        if (hasChanges) {
          await updateDoc(profileDocRef, dataToSave);
           addGlobalLog({ message: `Perfil Kako atualizado via WS: ${dataToSave.nickname} (FUID: ${dataToSave.id})`, type: "info" });
        } else {
          await updateDoc(profileDocRef, { lastFetchedAt: serverTimestamp() });
        }
      }
    } catch (error) {
      console.error("AppContentWrapper: Erro ao salvar/atualizar perfil Kako no Firestore:", error);
      addGlobalLog({ message: `Erro no Firestore ao processar perfil Kako ${profileData.nickname} via WS: ${error instanceof Error ? error.message : String(error)}`, type: "error" });
    }
  }, [addGlobalLog]);

  const upsertKakoGiftData = useCallback(async (giftId?: string, giftName?: string, giftImageUrl?: string, giftDiamondValue?: number) => {
    if (!giftId) {
        addGlobalLog({ message: "Tentativa de salvar presente sem ID (via WebSocket).", type: "warning" });
        return;
    }
    const giftDocRef = doc(db, "kakoGifts", giftId.toString());
    try {
        const docSnap = await getDoc(giftDocRef);
        const receivedName = giftName?.trim();
        const receivedImageUrl = giftImageUrl?.trim();

        if (!docSnap.exists()) {
            const newGiftToSave: Partial<KakoGift> & { id:string, name:string, imageUrl: string, createdAt:any, updatedAt:any, display:boolean } = {
                id: giftId.toString(),
                name: receivedName || `Presente Desconhecido (ID: ${giftId})`,
                imageUrl: receivedImageUrl || `https://placehold.co/48x48.png?text=${giftId}`,
                diamond: giftDiamondValue === undefined || isNaN(giftDiamondValue) ? null : giftDiamondValue,
                display: !!(receivedName && receivedImageUrl && !receivedImageUrl.startsWith("https://placehold.co")),
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                dataAiHint: (receivedName || "").toLowerCase().split(" ").slice(0,2).join(" ") || "gift icon",
            };
            await setDoc(giftDocRef, newGiftToSave);
            addGlobalLog({ message: `Novo presente salvo via WebSocket: '${newGiftToSave.name}' (ID: ${giftId})`, type: "success" });
            setNewGiftsCount(prev => prev + 1);
        } else {
            const existingData = docSnap.data() as KakoGift;
            const updates: Partial<KakoGift> & {updatedAt?: any} = {};
            let hasChanges = false;

            if (receivedName && existingData.name?.startsWith("Presente Desconhecido") && existingData.name !== receivedName) {
                updates.name = receivedName;
                updates.dataAiHint = receivedName.toLowerCase().split(" ").slice(0,2).join(" ") || "gift icon";
                hasChanges = true;
            }
            if (receivedImageUrl && (existingData.imageUrl?.startsWith("https://placehold.co") || !existingData.imageUrl) && existingData.imageUrl !== receivedImageUrl) {
                updates.imageUrl = receivedImageUrl;
                hasChanges = true;
            }
            if (giftDiamondValue !== undefined && !isNaN(giftDiamondValue) && existingData.diamond !== giftDiamondValue) {
                updates.diamond = giftDiamondValue;
                hasChanges = true;
            }
            
            let currentDisplay = existingData.display;
            if (typeof currentDisplay !== 'boolean') currentDisplay = false;
            
            const canBeDisplayed = !!(updates.name || existingData.name) &&
                                  !(updates.name || existingData.name)?.startsWith("Presente Desconhecido") &&
                                  !!(updates.imageUrl || existingData.imageUrl) &&
                                  !(updates.imageUrl || existingData.imageUrl)?.startsWith("https://placehold.co");

            if (canBeDisplayed && !currentDisplay) {
                updates.display = true;
                hasChanges = true;
            }

            if (hasChanges) {
                updates.updatedAt = serverTimestamp();
                await updateDoc(giftDocRef, updates);
                addGlobalLog({ message: `Presente atualizado via WebSocket: '${updates.name || existingData.name}' (ID: ${giftId})`, type: "info" });
            }
        }
    } catch (error) {
        console.error("AppContentWrapper: Erro ao salvar/atualizar presente Kako via WebSocket:", error);
        addGlobalLog({ message: `Erro no Firestore ao processar presente ID ${giftId} via WebSocket: ${error instanceof Error ? error.message : String(error)}`, type: "error" });
    }
  }, [addGlobalLog]);

  const parseWebSocketMessage = useCallback((rawData: string, currentHostFUIDForParsing?: string | null): { type: string, classification?: string, parsedUserData?: ParsedUserData, extractedRoomId?: string, giftDetails?: LogEntry['giftInfo'], data: any, isJson: boolean, anchorUserId?:string, online?: number, likes?: number, isCurrentlyLive?: boolean } | null => {
    let messageContentString = rawData;
    let parsedJson: any;
    let isJsonMessage = false;
    let extractedRoomIdFromJson: string | undefined = undefined;

    const firstBrace = messageContentString.indexOf('{');
    const lastBrace = messageContentString.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
        messageContentString = messageContentString.substring(firstBrace, lastBrace + 1);
    }

    try {
        parsedJson = JSON.parse(messageContentString);
        isJsonMessage = true;
        if (parsedJson && typeof parsedJson === 'object' && 'roomId' in parsedJson) {
            extractedRoomIdFromJson = parsedJson.roomId;
        }
    } catch (e) {
        return { type: 'unknown_text', data: null, isJson: false, extractedRoomId: undefined };
    }

    let msgUserData: ParsedUserData | undefined = undefined;
    if (parsedJson.user && typeof parsedJson.user === 'object') {
        msgUserData = {
            userId: parsedJson.user.userId,
            nickname: parsedJson.user.nickname,
            avatarUrl: parsedJson.user.avatar || parsedJson.user.avatarUrl || null,
            level: parsedJson.user.level,
            numId: parsedJson.user.numId,
            showId: parsedJson.user.showId,
            gender: parsedJson.user.gender,
        };
    }

    let classification: string | undefined = undefined;
    let messageType: string | undefined = undefined;
    let giftDetails: LogEntry['giftInfo'] | undefined = undefined;

    if (isJsonMessage && parsedJson && typeof parsedJson === 'object') {
      if ('roomId' in parsedJson && 'mute' in parsedJson && parsedJson.anchor) {
          classification = "Dados da LIVE";
          messageType = 'systemUpdate';
          let isLive = true;
          if(parsedJson.anchor.isLiving === false ||
             (typeof parsedJson.status === 'number' && parsedJson.status !== 19 && parsedJson.status !== 1) ||
             (typeof parsedJson.stopReason === 'number' && parsedJson.stopReason !== 0) ||
             parsedJson.paused === true
            ) {
            isLive = false;
          }
           return { type: messageType, classification, parsedUserData: msgUserData, extractedRoomId: extractedRoomIdFromJson, data: parsedJson, isJson: isJsonMessage, giftDetails, anchorUserId: parsedJson.anchor.userId, online: parsedJson.online, likes: parsedJson.likes, isCurrentlyLive: isLive };
      } else if ('roomId' in parsedJson && 'text' in parsedJson) {
          classification = "Mensagem de Chat";
          messageType = 'chat';
      } else if ('roomId' in parsedJson && 'giftId' in parsedJson) {
          classification = "Presentes da Sala";
          messageType = 'gift';
          const senderUserId = parsedJson.user?.userId;
          const isDonation = !!(currentHostFUIDForParsing && senderUserId && senderUserId !== currentHostFUIDForParsing);
          giftDetails = {
            giftId: parsedJson.giftId?.toString(),
            giftCount: parsedJson.giftCount,
            senderUserId: senderUserId,
            senderNickname: msgUserData?.nickname,
            isDonationToHost: isDonation,
          };
      } else if ('roomId' in parsedJson) {
          classification = "Dados da Sala";
          messageType = 'roomData';
      } else if (parsedJson.game && parsedJson.game.baishun2) {
          return null;
      } else if (parsedJson.user && parsedJson.type === 1 && parsedJson.type2 === 1 && !parsedJson.text && !parsedJson.giftId && !parsedJson.game) {
        classification = "Entrada de Usuário";
        messageType = 'userJoin';
      } else if ('giftId'in parsedJson && !('roomId' in parsedJson)) {
          classification = "Dados Externos";
          messageType = 'externalGift';
      }
      
      if (messageType) {
        return { type: messageType, classification, parsedUserData: msgUserData, extractedRoomId: extractedRoomIdFromJson, data: parsedJson, isJson: isJsonMessage, giftDetails, anchorUserId: parsedJson.anchor?.userId, online: parsedJson.online, likes: parsedJson.likes, isCurrentlyLive: parsedJson.anchor?.isLiving !== false };
      }
    }
    return { type: 'unknown_json', classification: "JSON Não Classificado", parsedUserData: msgUserData, extractedRoomId: extractedRoomIdFromJson, data: parsedJson, isJson: isJsonMessage };
  }, [addGlobalLog, upsertKakoProfileToFirestore, upsertKakoGiftData, currentRoomHostFUID]); // Added currentRoomHostFUID


  const connectGlobalWebSocket = useCallback((url: string) => {
    if (!url || (!url.startsWith("ws://") && !url.startsWith("wss://"))) {
        setGlobalConnectionStatus("URL do WebSocket inválida ou não definida.");
        addGlobalLog({ message: `Tentativa de conectar com URL inválida: ${url}`, type: "error" });
        return;
    }
    isManuallyDisconnectingRef.current = false;
    if (socketRef.current && (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING)) {
        if (socketRef.current.url === url) {
            addGlobalLog({ message: `Já conectado ou conectando a ${url}.`, type: "info" });
            return;
        }
        addGlobalLog({ message: `Fechando conexão existente com ${socketRef.current.url} para conectar a ${url}.`, type: "info" });
        isManuallyDisconnectingRef.current = true;
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        if(socketRef.current) {
          socketRef.current.onopen = null; socketRef.current.onmessage = null;
          socketRef.current.onerror = null; socketRef.current.onclose = null;
          socketRef.current.close();
        }
        socketRef.current = null;
        isManuallyDisconnectingRef.current = false;
    }
    setGlobalConnectionStatus(`Conectando globalmente a ${url}...`);
    addGlobalLog({ message: `Tentando conectar globalmente a ${url}...`, type: "info" });
    try {
        const newSocket = new WebSocket(url);
        socketRef.current = newSocket;
        newSocket.onopen = () => {
            setGlobalConnectionStatus(`Conectado globalmente a: ${newSocket.url}`);
            addGlobalLog({ message: `Conexão global estabelecida com ${newSocket.url}`, type: "success" });
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
                reconnectTimeoutRef.current = null;
            }
        };
        newSocket.onmessage = async (event) => {
            let rawMessageString = "";
            if (event.data instanceof Blob) {
                try { rawMessageString = await event.data.text(); }
                catch (e) { rawMessageString = "[Erro ao ler Blob]"; addGlobalLog({ message: "Erro ao ler Blob", type: "error", rawData: "[Blob Data]"}); }
            } else if (typeof event.data === 'string') {
                rawMessageString = event.data;
            } else {
                try { rawMessageString = JSON.stringify(event.data); }
                catch { rawMessageString = "[Tipo de mensagem desconhecido]"; }
            }
            const parsedEvent = parseWebSocketMessage(rawMessageString, currentRoomHostFUID);
            if (parsedEvent) {
                if (parsedEvent.parsedUserData && parsedEvent.parsedUserData.userId) {
                    upsertKakoProfileToFirestore(parsedEvent.parsedUserData);
                }
                if (parsedEvent.giftDetails && parsedEvent.giftDetails.giftId) {
                    const giftDataSource = (parsedEvent.data as any)?.gift || parsedEvent.data;
                    upsertKakoGiftData(
                        parsedEvent.giftDetails.giftId,
                        giftDataSource?.giftName || giftDataSource?.name,
                        giftDataSource?.giftIcon || giftDataSource?.imageUrl,
                        giftDataSource?.giftDiamondValue || giftDataSource?.diamond
                    );
                }
                if(parsedEvent.type === 'systemUpdate' && parsedEvent.anchorUserId){
                    setCurrentRoomHostFUID(parsedEvent.anchorUserId);
                }
                addGlobalLog({
                    message: `Recebido (${parsedEvent.type || 'desconhecido'}): ${rawMessageString.substring(0, 70)}...`,
                    type: "received",
                    rawData: rawMessageString,
                    parsedData: parsedEvent.data,
                    isJson: parsedEvent.isJson,
                    classification: parsedEvent.classification,
                    parsedUserData: parsedEvent.parsedUserData,
                    giftInfo: parsedEvent.giftDetails
                });
            }
        };
        newSocket.onerror = (errorEvent) => {
            const errorMsg = `Erro na conexão WebSocket global: ${errorEvent.type || 'Tipo de erro desconhecido'}`;
            if (socketRef.current === newSocket) {
                setGlobalConnectionStatus("Erro na Conexão Global");
                addGlobalLog({ message: errorMsg, type: "error" });
                if (newSocket.readyState !== WebSocket.CLOSED && newSocket.readyState !== WebSocket.CLOSING) {
                    newSocket.onopen = null; newSocket.onmessage = null; newSocket.onerror = null; newSocket.onclose = null;
                    newSocket.close();
                }
                socketRef.current = null;
                if (!isManuallyDisconnectingRef.current && webSocketUrlToConnect) {
                    if(reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
                    addGlobalLog({ message: `Tentando reconectar globalmente a ${webSocketUrlToConnect} em 5 segundos devido a erro...`, type: "warning" });
                    reconnectTimeoutRef.current = setTimeout(() => connectGlobalWebSocket(url), 5000);
                }
            }
        };
        newSocket.onclose = (closeEvent) => {
            let closeMsg = `Desconectado globalmente de ${newSocket.url}.`;
            if (closeEvent.code || closeEvent.reason) {
                closeMsg += ` Código: ${closeEvent.code}, Motivo: ${closeEvent.reason || 'N/A'}`;
            }
            if (socketRef.current === newSocket) {
                setGlobalConnectionStatus("Desconectado Global");
                addGlobalLog({ message: closeMsg, type: "warning" });
                socketRef.current = null;
                if (!isManuallyDisconnectingRef.current && webSocketUrlToConnect) {
                    setGlobalConnectionStatus("Desconectado Global - Tentando Reconectar...");
                    addGlobalLog({ message: `Tentando reconectar globalmente a ${webSocketUrlToConnect} em 5 segundos...`, type: "warning" });
                    if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
                    reconnectTimeoutRef.current = setTimeout(() => connectGlobalWebSocket(url), 5000);
                }
            }
        };
    } catch (error) {
        const errMsg = error instanceof Error ? error.message : "Erro desconhecido ao tentar conectar globalmente.";
        setGlobalConnectionStatus("Erro ao Iniciar Conexão Global");
        addGlobalLog({ message: `Falha ao Conectar WebSocket Global: ${errMsg}`, type: "error" });
        if (socketRef.current) {
          if (socketRef.current.readyState !== WebSocket.CLOSED && socketRef.current.readyState !== WebSocket.CLOSING) {
            socketRef.current.close();
          }
          socketRef.current = null;
        }
    }
  }, [addGlobalLog, parseWebSocketMessage, upsertKakoProfileToFirestore, upsertKakoGiftData, currentRoomHostFUID]); // Removed webSocketUrlToConnect from here


  const disconnectGlobalWebSocket = useCallback(() => {
    isManuallyDisconnectingRef.current = true;
    if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
    }
    if (socketRef.current) {
        addGlobalLog({ message: "Desconectando WebSocket global manualmente...", type: "info" });
        if (socketRef.current.readyState !== WebSocket.CLOSED && socketRef.current.readyState !== WebSocket.CLOSING) {
          socketRef.current.onopen = null; socketRef.current.onmessage = null;
          socketRef.current.onerror = null; socketRef.current.onclose = null;
          socketRef.current.close();
        }
        socketRef.current = null;
    }
    setGlobalConnectionStatus("Desconectado Global");
  }, [addGlobalLog]);


  useEffect(() => {
    const fetchWsConfig = async () => {
      setIsLoadingConfig(true);
      try {
        const configDocRef = doc(db, "app_settings", "live_data_config");
        const docSnap = await getDoc(configDocRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as WebSocketConfig;
          const urls = data?.webSocketUrlList || [];
          if (urls.length > 0 && urls[0]) {
            setWebSocketUrlToConnect(urls[0]);
            addGlobalLog({message: `URL primária do WebSocket carregada: ${urls[0]}`, type: "info"});
          } else {
            setWebSocketUrlToConnect(null);
            addGlobalLog({message: "Nenhuma URL de WebSocket configurada para conexão automática.", type: "warning"});
          }
        } else {
          setWebSocketUrlToConnect(null);
          addGlobalLog({message: "Documento de configuração de WebSocket não encontrado.", type: "warning"});
        }
      } catch (error: any) {
        console.error("AppContentWrapper: Erro ao buscar configuração do WebSocket:", error);
        setWebSocketUrlToConnect(null);
        addGlobalLog({message: `Erro ao buscar config. do WebSocket: ${error.message || String(error)}`, type: "error"});
      } finally {
        setIsLoadingConfig(false);
      }
    };
    fetchWsConfig();
  }, [addGlobalLog]);

  useEffect(() => {
    if (webSocketUrlToConnect && !isLoadingConfig) {
        connectGlobalWebSocket(webSocketUrlToConnect);
    } else if (!webSocketUrlToConnect && !isLoadingConfig && socketRef.current) {
        disconnectGlobalWebSocket();
    }
    // This effect should re-run if webSocketUrlToConnect changes.
    // The connectGlobalWebSocket function itself is memoized and should not cause loops.
    return () => {
        if (!webSocketUrlToConnect) {
            disconnectGlobalWebSocket();
        }
        // The main unmount cleanup is in the connectGlobalWebSocket's return statement or a separate effect.
    };
  }, [webSocketUrlToConnect, isLoadingConfig, connectGlobalWebSocket, disconnectGlobalWebSocket]);

  useEffect(() => {
    if (currentUser?.adminLevel === 'master' && (newProfilesCount > 0 || newGiftsCount > 0)) {
      if (notificationIntervalRef.current) clearInterval(notificationIntervalRef.current);

      notificationIntervalRef.current = setInterval(() => {
        let newItemsMessage = "";
        if (newProfilesCount > 0) {
          newItemsMessage += `${newProfilesCount} novo(s) perfil(s) `;
        }
        if (newGiftsCount > 0) {
          if (newProfilesCount > 0) newItemsMessage += "e ";
          newItemsMessage += `${newGiftsCount} novo(s) presente(s) `;
        }

        if (newItemsMessage) {
          toast({
            title: "Atualização de Dados (Coleta em Tempo Real)",
            description: `${newItemsMessage} foram identificados/atualizados no banco de dados.`,
            duration: 9000,
          });
          setNewProfilesCount(0);
          setNewGiftsCount(0);
        }
      }, 10 * 60 * 1000); // Every 10 minutes
    } else {
      if (notificationIntervalRef.current) clearInterval(notificationIntervalRef.current);
    }
    return () => {
      if (notificationIntervalRef.current) clearInterval(notificationIntervalRef.current);
    };
  }, [currentUser?.adminLevel, newProfilesCount, newGiftsCount, toast]);


  const handleLogout = useCallback(async () => {
    disconnectGlobalWebSocket();
    try {
      await logout();
      toast({ title: "Sessão Encerrada", description: "Você foi desconectado com sucesso." });
      router.push("/");
    } catch (error: any) {
      toast({ title: "Falha ao Sair", description: error.message, variant: "destructive" });
    }
  }, [logout, router, toast, disconnectGlobalWebSocket]);

  useEffect(() => {
    if (pathname === "/messages") {
      setHasUnreadMessages(false);
    }
  }, [pathname]);

 const isModuleHidden = useCallback((modulePath: string) => {
    let moduleId = '';
    if (modulePath === '/' || modulePath === '') moduleId = 'home';
    else if (pathname.startsWith('/hosts')) moduleId = 'hosts';
    else if (pathname.startsWith('/games') || pathname.startsWith('/bingo')) moduleId = 'games';
    else if (pathname.startsWith('/admin')) moduleId = 'adminPanel';
    else if (pathname === '/profile') moduleId = 'profile';
    else if (pathname === '/settings') moduleId = 'settings';

    const rule = maintenanceRules.find(r => r.id === moduleId);
    return rule?.isHiddenFromMenu || false;
  }, [maintenanceRules, pathname]);


  useEffect(() => {
    if (authLoading || isLoadingRules || isLoadingConfig) {
      setIsReadyForContent(false);
      return;
    }

    if (isAuthPage || isOnboardingPage) {
      setIsReadyForContent(true);
      return;
    }

    if (isMaintenancePage) {
        setIsReadyForContent(true);
        return;
    }

    if (!currentUser) {
      router.replace("/login");
      setIsReadyForContent(false);
      return;
    }

    if (!currentUser.isVerified && !(currentUser.email && currentUser.email.endsWith('@test.com'))) {
      if (pathname !== `/auth/verify-email-notice`) {
        router.replace(`/auth/verify-email-notice?email=${encodeURIComponent(currentUser.email || "")}`);
        setIsReadyForContent(false); return;
      }
    } else if (!currentUser.agreedToTermsAt) {
      if (pathname !== '/onboarding/terms') { router.replace("/onboarding/terms"); setIsReadyForContent(false); return; }
    } else if (!currentUser.role) {
      if (pathname !== '/onboarding/role-selection') { router.replace("/onboarding/role-selection"); setIsReadyForContent(false); return; }
    } else if (!currentUser.birthDate || !currentUser.gender || !currentUser.country || !currentUser.phoneNumber || !currentUser.foundUsVia) {
        if (pathname !== '/onboarding/age-verification' && pathname !== '/onboarding/contact-info') {
            if(!currentUser.birthDate || !currentUser.gender || !currentUser.country) router.replace("/onboarding/age-verification");
            else router.replace("/onboarding/contact-info");
            setIsReadyForContent(false); return;
        }
    } else if (currentUser.hasCompletedOnboarding === false || typeof currentUser.hasCompletedOnboarding === 'undefined') {
       if (currentUser.role === 'host' && (!currentUser.liveVerificationCompletedAt && !pathname.startsWith('/onboarding/live-verification'))) {
        if (pathname !== '/onboarding/kako-id-input' && !pathname.startsWith('/onboarding/live-verification')) {
            router.replace("/onboarding/kako-id-input"); setIsReadyForContent(false); return;
        }
      } else if (currentUser.role === 'player') {
        if (pathname !== '/onboarding/kako-account-check' && pathname !== '/onboarding/kako-creation-choice' && pathname !== '/onboarding/kako-id-input') {
          router.replace("/onboarding/kako-account-check");
          setIsReadyForContent(false); return;
        }
      }
    } else if (currentUser.role === 'host' && !currentUser.liveVerificationCompletedAt && !pathname.startsWith('/onboarding/live-verification') && pathname !== '/profile') {
       router.replace("/onboarding/live-verification");
       setIsReadyForContent(false); return;
    }


    let currentModuleId = '';
    if (pathname === '/' || pathname === '') currentModuleId = 'home';
    else if (pathname.startsWith('/hosts')) currentModuleId = 'hosts';
    else if (pathname.startsWith('/games') || pathname.startsWith('/bingo')) currentModuleId = 'games';
    else if (pathname.startsWith('/admin')) currentModuleId = 'adminPanel';
    else if (pathname === '/profile') currentModuleId = 'profile';
    else if (pathname === '/settings') currentModuleId = 'settings';

    const moduleRule = maintenanceRules.find(rule => rule.id === currentModuleId);

    console.log("AppContentWrapper - Maintenance Check:", {
      pathname,
      currentModuleId,
      moduleRule: moduleRule ? { id: moduleRule.id, globallyOffline: moduleRule.globallyOffline, minAccess: moduleRule.minimumAccessLevelWhenOffline, isHidden: moduleRule.isHiddenFromMenu } : null,
      currentUserRole: currentUser?.role,
      currentUserAdminLevel: currentUser?.adminLevel
    });


    if (moduleRule && moduleRule.globallyOffline) {
      let userHasAccess = false;
      const userBaseRole = currentUser.role || 'player';
      const userAdminRole = currentUser.adminLevel;

      const userBaseLevel = roleHierarchy[userBaseRole as AdminUserRole] ?? roleHierarchy.player;
      const userAdminLevelVal = userAdminRole ? roleHierarchy[userAdminRole as AdminUserRole] : -1;
      const effectiveUserLevel = Math.max(userBaseLevel, userAdminLevelVal);

      if (moduleRule.minimumAccessLevelWhenOffline === 'nobody') {
        userHasAccess = false;
      } else if (moduleRule.minimumAccessLevelWhenOffline === 'player') {
        userHasAccess = effectiveUserLevel === roleHierarchy.player;
      } else {
        userHasAccess = effectiveUserLevel >= roleHierarchy[moduleRule.minimumAccessLevelWhenOffline as Exclude<MinimumAccessLevel, 'nobody' | 'player'>];
      }

      if (!userHasAccess) {
        console.log(`AppContentWrapper - Access DENIED for module ${currentModuleId}. User level: ${effectiveUserLevel}, Required: ${moduleRule.minimumAccessLevelWhenOffline}. Redirecting to /maintenance.`);
        router.replace('/maintenance');
        setIsReadyForContent(false);
        return;
      } else {
        console.log(`AppContentWrapper - Access GRANTED for module ${currentModuleId}. User level: ${effectiveUserLevel}, Required: ${moduleRule.minimumAccessLevelWhenOffline}.`);
      }
    }

    setIsReadyForContent(true);

  }, [authLoading, isLoadingRules, isLoadingConfig, currentUser, pathname, router, maintenanceRules, isAuthPage, isOnboardingPage, isMaintenancePage, addGlobalLog]);


  if ((authLoading || isLoadingRules || isLoadingConfig) && !isAuthPage && !isOnboardingPage && !isMaintenancePage) {
    return (
      <div className="flex justify-center items-center h-screen w-screen fixed inset-0 bg-background z-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isAuthPage || isOnboardingPage) {
    return (
      <>
        {React.Children.map(children, child =>
            React.isValidElement(child) && typeof (child.type as any).propTypes === 'object'
            ? React.cloneElement(child as React.ReactElement<any>, {
                ...( (child.type as any).propTypes?.globalConnectionStatus ? {globalConnectionStatus} : {}),
                ...( (child.type as any).propTypes?.globalProcessedMessages ? {globalProcessedMessages} : {}),
                ...( (child.type as any).propTypes?.pathname ? {pathname} : {}),
              })
            : child
        )}
        <Toaster />
      </>
    );
  }

  if (isMaintenancePage) {
     if (authLoading || isLoadingRules || isLoadingConfig) {
        return (
            <div className="flex justify-center items-center h-screen w-screen fixed inset-0 bg-background z-50">
                <LoadingSpinner size="lg" />
            </div>
        );
     }
  }


  if (!isReadyForContent && !isAuthPage && !isOnboardingPage) {
    return (
      <div className="flex justify-center items-center h-screen w-screen fixed inset-0 bg-background z-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }


  return (
    <SidebarProvider defaultOpen={false}>
      <MainAppLayout
        currentUser={currentUser}
        maintenanceRules={maintenanceRules}
        isReadyForContent={isReadyForContent}
        handleLogout={handleLogout}
        hasUnreadMessages={hasUnreadMessages}
        isModuleHidden={isModuleHidden}
        pathname={pathname}
        globalConnectionStatus={globalConnectionStatus}
        globalProcessedMessages={globalProcessedMessages}
      >
        {children}
      </MainAppLayout>
      <Toaster />
    </SidebarProvider>
  );
}
