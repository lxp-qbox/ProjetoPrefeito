
"use client";

import React, { type ReactNode, useEffect, useState, useMemo, useCallback, cloneElement, isValidElement } from 'react';
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
    useSidebar,
    SidebarSeparator
} from '@/components/ui/sidebar';
import { 
    Home, 
    Users, 
    TicketIcon as GameIcon, 
    MessageSquare, 
    UserCircle2, 
    Settings, 
    LayoutDashboard,
    Crown,
    LogOut,
    TicketIcon, // For Bingo Admin
    PlayCircle,
    BarChart2,
    Bookmark,
    Gamepad2,
    Tag,
    PanelLeft,
    type LucideIcon
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { UserProfile, SiteModule, UserRole as AdminUserRole, MinimumAccessLevel, KakoProfile, KakoGift, WebSocketConfig, LogEntry, ParsedUserData } from "@/types";
import { db, doc, getDoc, setDoc, updateDoc, serverTimestamp, collection, query, where, getDocs, Timestamp } from "@/lib/firebase";
import { initialModuleStatuses } from '@/app/admin/maintenance/offline/page'; // Assuming it's exported
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';


const roleHierarchy: Record<AdminUserRole | 'master', number> = { // Added master to ensure it's covered
  player: 0,
  host: 1,
  suporte: 2,
  admin: 3,
  master: 4,
};

interface SidebarFooterItem {
  id: string;
  label: string;
  icon: LucideIcon;
  href?: string;
  action?: () => void;
  adminOnly?: boolean;
  separatorAbove?: boolean;
}

interface MainAppLayoutProps {
  children: ReactNode;
  currentUser: UserProfile | null;
  maintenanceRules: SiteModule[];
  pathname: string;
  isReadyForContent: boolean;
  handleLogout: () => Promise<void>;
  hasUnreadMessages: boolean;
  isModuleHidden: (modulePath: string) => boolean;
  globalConnectionStatus: string;
  globalProcessedMessages: LogEntry[];
}

function MainAppLayout({ 
  children, 
  currentUser, 
  maintenanceRules, 
  pathname, 
  isReadyForContent, 
  handleLogout,
  hasUnreadMessages,
  isModuleHidden,
  globalConnectionStatus, // Added prop
  globalProcessedMessages, // Added prop
}: MainAppLayoutProps) {
  const { isMobile, open: isDesktopSidebarOpen, setOpen: setDesktopSidebarOpen, state } = useSidebar();

  const mainSidebarNavItems = useMemo(() => [
    { id: 'home', label: 'Início', icon: Home, href: '/' },
    { id: 'hosts', label: 'Hosts', icon: Users, href: '/hosts' },
    { id: 'games', label: 'Jogos', icon: Gamepad2, href: '/games' },
    { id: 'messages', label: 'Mensagem', icon: MessageSquare, href: '/messages', notification: hasUnreadMessages },
  ].filter(item => !isModuleHidden(item.href)), [hasUnreadMessages, isModuleHidden]);

  const sidebarFooterItems = useMemo(() => {
    const items: SidebarFooterItem[] = [];
    let hasRenderedAdminItem = false;

    if (currentUser?.adminLevel) {
      if (!isModuleHidden('/admin/bingo-admin')) {
        items.push({
          id: 'bingoAdmin',
          label: 'Bingo Admin',
          icon: TicketIcon,
          href: '/admin/bingo-admin',
          adminOnly: true,
          separatorAbove: true, // Separator before first admin item
        });
        hasRenderedAdminItem = true;
      }
      if (!isModuleHidden('/admin')) {
        items.push({
          id: 'adminPanel',
          label: 'Painel Admin',
          icon: LayoutDashboard,
          href: '/admin',
          adminOnly: true,
          separatorAbove: hasRenderedAdminItem, // Separator if Bingo Admin was shown
        });
        hasRenderedAdminItem = true;
      }
    }

    if (!isModuleHidden('/profile')) {
      items.push({
        id: 'profile',
        label: 'Perfil',
        icon: UserCircle2,
        href: '/profile',
        separatorAbove: hasRenderedAdminItem,
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
    return items;
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
          <SidebarHeader className="p-0 flex flex-col items-center justify-center">
            <SidebarTrigger className="h-16 w-full rounded-none border-b border-sidebar-border hover:bg-sidebar-accent focus-visible:ring-0 focus-visible:ring-offset-0" />
            <div className={cn(
                "flex items-center justify-center h-12 transition-all duration-500 ease-in-out overflow-hidden",
                state === 'collapsed' && "h-0 opacity-0 invisible"
             )}>
                <Crown className="size-6 text-primary shrink-0" />
                <span className={cn(
                    "ml-2 text-lg font-semibold text-primary whitespace-nowrap transition-all duration-500 ease-in-out",
                     state === 'collapsed' ? "opacity-0 max-w-0" : "opacity-100 max-w-[200px]"
                )}>
                  The Presidential Agency
                </span>
             </div>
          </SidebarHeader>
          <SidebarContent className="flex flex-col flex-1 pt-2">
            <SidebarMenu className="items-center mt-2">
              {mainSidebarNavItems.map((item) => (
                <SidebarMenuItem key={item.id} className="w-full">
                  <SidebarMenuButton 
                    asChild 
                    tooltip={item.label} 
                    variant="ghost"
                    isActive={pathname === item.href}
                  >
                    <Link href={item.href || '#'}>
                      <item.icon className={cn("transition-all duration-500 ease-in-out shrink-0", state === 'collapsed' ? "size-6" : "size-5")} />
                      <span className={cn(
                        "transition-all duration-500 ease-out delay-150", 
                        "whitespace-nowrap overflow-hidden text-xs",
                        state === 'collapsed' ? "opacity-0 max-w-0 delay-0" : "opacity-100 max-w-[100px]"
                      )}>
                        {item.label}
                      </span>
                      {item.id === 'messages' && item.notification && (
                        <span className={cn(
                            "absolute h-2 w-2 rounded-full bg-green-500 ring-1 ring-card pointer-events-none",
                            state === 'collapsed' ? "top-2.5 right-2.5 h-2.5 w-2.5" : "top-2 right-2"
                         )} />
                       )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
            <div className="flex-grow" /> {/* Pushes footer to bottom */}
          </SidebarContent>
          <SidebarFooter className="p-2 border-t border-sidebar-border">
             <SidebarMenu className="items-center">
              {sidebarFooterItems.map((item, index) => (
                <React.Fragment key={item.id}>
                  {item.separatorAbove && <SidebarSeparator />}
                  <SidebarMenuItem className="w-full">
                    <SidebarMenuButton 
                      asChild={!!item.href}
                      onClick={item.action}
                      tooltip={item.label} 
                      variant="ghost"
                      isActive={item.href ? pathname === item.href : false}
                    >
                      {item.href ? (
                        <Link href={item.href}>
                          <item.icon className={cn("transition-all duration-500 ease-in-out shrink-0", state === 'collapsed' ? "size-6" : "size-5")} />
                          <span className={cn(
                            "transition-all duration-500 ease-out delay-150", 
                            "whitespace-nowrap overflow-hidden text-xs",
                            state === 'collapsed' ? "opacity-0 max-w-0 delay-0" : "opacity-100 max-w-[100px]"
                          )}>
                            {item.label}
                          </span>
                        </Link>
                      ) : (
                        <>
                          <item.icon className={cn("transition-all duration-500 ease-in-out shrink-0", state === 'collapsed' ? "size-6" : "size-5")} />
                          <span className={cn(
                            "transition-all duration-500 ease-out delay-150", 
                            "whitespace-nowrap overflow-hidden text-xs",
                            state === 'collapsed' ? "opacity-0 max-w-0 delay-0" : "opacity-100 max-w-[100px]"
                          )}>
                            {item.label}
                          </span>
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

      {/* Mobile Off-Canvas Sidebar */}
      {isMobile && (
        <Sidebar className="border-r bg-muted/40">
           <SidebarHeader className="p-4 border-b">
             <div className="flex items-center gap-2 text-xl font-semibold text-primary">
                <Crown className="size-7 text-primary" />
                <span>The Presidential Agency</span>
             </div>
           </SidebarHeader>
           <SidebarContent className="p-2">
            <SidebarMenu>
              {mainSidebarNavItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton 
                    asChild 
                    variant="ghost" 
                    isActive={pathname === item.href} 
                    className="w-full justify-start"
                  >
                    <Link href={item.href || '#'}>
                      <item.icon className="mr-2 size-5" />
                      {item.label}
                      {item.id === 'messages' && item.notification && (
                        <span className="ml-auto h-2 w-2 rounded-full bg-green-500 ring-1 ring-card" />
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
           </SidebarContent>
           <SidebarFooter className="p-2 border-t">
            <SidebarMenu>
              {sidebarFooterItems.map((item) => (
                 <React.Fragment key={item.id}>
                 {item.separatorAbove && <SidebarSeparator />}
                 <SidebarMenuItem>
                    <SidebarMenuButton 
                        asChild={!!item.href} 
                        onClick={item.action} 
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
              isValidElement(child) ? cloneElement(child as React.ReactElement<any>, { globalConnectionStatus, globalProcessedMessages }) : child
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
  const { currentUser, loading: authLoading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();

  const [hasUnreadMessages, setHasUnreadMessages] = useState(true);
  const [maintenanceRules, setMaintenanceRules] = useState<SiteModule[]>(initialModuleStatuses);
  const [isLoadingRules, setIsLoadingRules] = useState(true);
  const [isReadyForContent, setIsReadyForContent] = useState(false);
  
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
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


  const addGlobalLog = useCallback((logData: Omit<LogEntry, 'id' | 'timestamp'>) => {
    setGlobalProcessedMessages(prevLogs => [{ 
        id: Date.now().toString() + Math.random().toString(36).substring(2,9), 
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits:3 }), 
        ...logData
    }, ...prevLogs.slice(0, 199)]);
  }, []);

  const upsertKakoProfileToFirestore = useCallback(async (profileData: ParsedUserData) => {
    if (!profileData.userId) {
      addGlobalLog({ message: `Tentativa de salvar perfil Kako sem FUID: ${profileData.nickname}`, type: "error", rawData: JSON.stringify(profileData) });
      return;
    }
    const profileDocRef = doc(db, "kakoProfiles", profileData.userId);
    try {
      const docSnap = await getDoc(profileDocRef);
      const dataToSave: Partial<KakoProfile> & { lastFetchedAt: any } = {
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
        await setDoc(profileDocRef, { ...dataToSave, createdAt: serverTimestamp() });
        addGlobalLog({ message: `Novo perfil Kako salvo: ${dataToSave.nickname} (FUID: ${dataToSave.id})`, type: "success" });
        setNewProfilesCount(prev => prev + 1);
      } else {
        const existingData = docSnap.data() as KakoProfile;
        let hasChanges = false;
        if (dataToSave.nickname !== existingData.nickname) hasChanges = true;
        if (dataToSave.avatarUrl !== existingData.avatarUrl) hasChanges = true;
        if (dataToSave.level !== existingData.level) hasChanges = true;
        if (dataToSave.showId !== existingData.showId) hasChanges = true;
        // numId and gender might not change often once set
        
        if (hasChanges) {
          await updateDoc(profileDocRef, dataToSave);
          addGlobalLog({ message: `Perfil Kako atualizado: ${dataToSave.nickname} (FUID: ${dataToSave.id})`, type: "info" });
        } else {
          await updateDoc(profileDocRef, { lastFetchedAt: serverTimestamp() });
        }
      }
    } catch (error) {
      console.error("AppContentWrapper: Erro ao salvar/atualizar perfil Kako no Firestore:", error);
      addGlobalLog({ message: `Erro no Firestore ao processar perfil Kako ${profileData.nickname}: ${error instanceof Error ? error.message : String(error)}`, type: "error" });
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
            const newGiftToSave: Partial<KakoGift> & { id: string; createdAt: any; display: boolean; } = {
                id: giftId.toString(),
                name: receivedName || `Presente Desconhecido (ID: ${giftId})`,
                imageUrl: receivedImageUrl || `https://placehold.co/48x48.png?text=${giftId}`,
                diamond: giftDiamondValue === undefined || isNaN(giftDiamondValue) ? null : giftDiamondValue,
                display: !!(receivedName && receivedImageUrl && !receivedImageUrl.startsWith("https://placehold.co")),
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };
            newGiftToSave.dataAiHint = (newGiftToSave.name || "").toLowerCase().split(" ").slice(0,2).join(" ") || "gift icon";
            await setDoc(giftDocRef, newGiftToSave);
            addGlobalLog({ message: `Novo presente salvo via WebSocket: '${newGiftToSave.name}' (ID: ${giftId})`, type: "success" });
            setNewGiftsCount(prev => prev + 1);
        } else {
            const existingData = docSnap.data() as KakoGift;
            const updates: Partial<KakoGift> = {};
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
            if (updates.name && updates.imageUrl && !existingData.display) {
                updates.display = true; // Auto-set display to true if we got full info
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


  const parseWebSocketMessage = useCallback((rawData: string, currentHostFUID?: string | null): LogEntry['parsedData'] & { type?: string; classification?: string; parsedUserData?: ParsedUserData; extractedRoomId?: string; giftDetails?: LogEntry['giftInfo']} => {
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
        return { data: null, originalText: rawData, isJson: false, extractedRoomId: undefined };
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
      if ('roomId' in parsedJson && 'mute' in parsedJson) {
          classification = "Dados da LIVE";
          messageType = 'systemUpdate';
          if (parsedJson.anchor && typeof parsedJson.anchor === 'object') {
            const isLive = parsedJson.anchor.isLiving !== false &&
                           (parsedJson.status === 19 || parsedJson.status === 1) &&
                           (parsedJson.stopReason === 0 || parsedJson.stopReason === undefined) &&
                           parsedJson.paused !== true;
             return { ...parsedJson, type: messageType, classification, parsedUserData: msgUserData, extractedRoomId: extractedRoomIdFromJson, anchorUserId: parsedJson.anchor.userId, online: parsedJson.online, likes: parsedJson.likes, isCurrentlyLive: isLive };
          }
      } else if ('roomId' in parsedJson && 'text' in parsedJson) {
          classification = "Mensagem de Chat";
          messageType = 'chat';
      } else if ('roomId' in parsedJson && 'giftId' in parsedJson) {
          classification = "Presentes da Sala";
          messageType = 'gift';
          const senderUserId = parsedJson.user?.userId;
          const isDonation = !!(currentHostFUID && senderUserId && senderUserId !== currentHostFUID);
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
      } else if ('game' in parsedJson) {
          classification = "Dados de Jogo";
          messageType = 'gameEvent';
      } else if ('giftId' in parsedJson && !('roomId' in parsedJson)) {
          classification = "Dados Externos";
          messageType = 'externalGift';
      } else if (parsedJson.user && parsedJson.type === 1 && parsedJson.type2 === 1 && !parsedJson.text && !parsedJson.giftId && !parsedJson.game) {
        classification = "Entrada de Usuário";
        messageType = 'userJoin';
      }
      
      if (messageType) {
        return { ...parsedJson, type: messageType, classification, parsedUserData: msgUserData, extractedRoomId: extractedRoomIdFromJson, giftDetails };
      }
    }
    return { ...parsedJson, type: 'unknown_json', classification: "JSON Não Classificado", parsedUserData: msgUserData, extractedRoomId: extractedRoomIdFromJson, isJson: isJsonMessage };
  }, [currentRoomHostFUID]);


  const connectGlobalWebSocket = useCallback((urlToConnect: string) => {
    if (!urlToConnect) {
        setGlobalConnectionStatus("URL do WebSocket não definida");
        return;
    }
    isManuallyDisconnectingRef.current = false;
    setGlobalConnectionStatus(`Conectando a ${urlToConnect}...`);
    addGlobalLog({ message: `Tentando conectar globalmente a ${urlToConnect}...`, type: "info" });

    try {
        const newSocket = new WebSocket(urlToConnect);
        socketRef.current = newSocket;

        newSocket.onopen = () => {
            setGlobalConnectionStatus(`Conectado a: ${newSocket.url}`);
            addGlobalLog({ message: `Conexão global estabelecida com ${newSocket.url}`, type: "success" });
        };

        newSocket.onmessage = async (event) => {
            let rawMessageString = "";
            if (event.data instanceof Blob) {
                try { rawMessageString = await event.data.text(); } 
                catch (e) { rawMessageString = "[Erro ao ler Blob]"; }
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
                    upsertKakoGiftData(
                        parsedEvent.giftDetails.giftId,
                        parsedEvent.data?.giftName || parsedEvent.data?.gift?.name,
                        parsedEvent.data?.giftIcon || parsedEvent.data?.gift?.imageUrl,
                        parsedEvent.data?.giftDiamondValue || parsedEvent.data?.gift?.diamond
                    );
                }
                 if(parsedEvent.type === 'systemUpdate' && parsedEvent.anchorUserId){
                    setCurrentRoomHostFUID(parsedEvent.anchorUserId);
                }
                addGlobalLog({
                    message: `Recebido (${parsedEvent.type || 'desconhecido'}): ${rawMessageString.substring(0, 70)}...`,
                    type: "received",
                    rawData: rawMessageString,
                    parsedData: parsedEvent,
                    isJson: true, // Assumes parseWebSocketMessage always returns JSON structure or null
                    classification: parsedEvent.classification,
                    parsedUserData: parsedEvent.parsedUserData,
                    giftInfo: parsedEvent.giftDetails
                });
            } else {
                addGlobalLog({ message: `Dados brutos não processados: ${rawMessageString.substring(0, 100)}...`, type: "received", rawData: rawMessageString, isJson: false });
            }
        };

        newSocket.onerror = (errorEvent) => {
            const errorMsg = `Erro na conexão WebSocket global: ${errorEvent.type || 'Tipo de erro desconhecido'}`;
            if (socketRef.current === newSocket) {
                setGlobalConnectionStatus("Erro na Conexão Global");
                addGlobalLog({ message: errorMsg, type: "error" });
                newSocket.onopen = null; newSocket.onmessage = null; newSocket.onerror = null; newSocket.onclose = null;
                if (newSocket.readyState !== WebSocket.CLOSED && newSocket.readyState !== WebSocket.CLOSING) newSocket.close();
                socketRef.current = null;
                if (!isManuallyDisconnectingRef.current && webSocketUrlToConnect) {
                    if(reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
                    reconnectTimeoutRef.current = setTimeout(() => connectGlobalWebSocket(webSocketUrlToConnect), 5000);
                }
            }
        };

        newSocket.onclose = (closeEvent) => {
            let closeMsg = `Desconectado globalmente de ${newSocket.url}.`;
            if (closeEvent.code || closeEvent.reason) {
                closeMsg += ` Código: ${closeEvent.code}, Motivo: ${closeEvent.reason || 'N/A'}`;
            }
            if (socketRef.current === newSocket) {
                if (!isManuallyDisconnectingRef.current && webSocketUrlToConnect) {
                    setGlobalConnectionStatus("Desconectado Global - Tentando Reconectar...");
                    addGlobalLog({ message: `${closeMsg} Tentando reconectar em 5 segundos.`, type: "warning" });
                    socketRef.current = null;
                    if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
                    reconnectTimeoutRef.current = setTimeout(() => connectGlobalWebSocket(webSocketUrlToConnect), 5000);
                } else {
                    setGlobalConnectionStatus("Desconectado Global");
                    addGlobalLog({ message: "WebSocket Global Desconectado Manualmente ou URL removida.", type: "info" });
                    socketRef.current = null;
                }
            }
        };
    } catch (error) {
        const errMsg = error instanceof Error ? error.message : "Erro desconhecido ao tentar conectar globalmente.";
        setGlobalConnectionStatus("Erro ao Iniciar Conexão Global");
        addGlobalLog({ message: `Falha ao Conectar WebSocket Global: ${errMsg}`, type: "error" });
        if (socketRef.current) { socketRef.current.close(); socketRef.current = null; }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addGlobalLog, parseWebSocketMessage, upsertKakoProfileToFirestore, upsertKakoGiftData]); // webSocketUrlToConnect removed to stabilize function reference


  const disconnectGlobalWebSocket = useCallback(() => {
    isManuallyDisconnectingRef.current = true;
    if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    if (socketRef.current) {
        addGlobalLog({ message: "Desconectando WebSocket global manualmente...", type: "info" });
        socketRef.current.onopen = null; socketRef.current.onmessage = null;
        socketRef.current.onerror = null; socketRef.current.onclose = null;
        socketRef.current.close();
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
            setWebSocketUrlToConnect(urls[0]); // Set the URL to connect
            console.log("AppContentWrapper: Primary WebSocket URL set from Firestore:", urls[0]);
          } else {
            setWebSocketUrlToConnect(null); // No URL to connect
            console.log("AppContentWrapper: No WebSocket URLs configured in Firestore.");
          }
        } else {
          setWebSocketUrlToConnect(null);
          console.log("AppContentWrapper: No WebSocket config document found.");
        }
      } catch (error) {
        console.error("AppContentWrapper: Erro ao buscar configuração do WebSocket:", error);
        setWebSocketUrlToConnect(null);
      } finally {
        setIsLoadingConfig(false);
      }
    };
    fetchWsConfig();
  }, []);

  useEffect(() => {
    if (webSocketUrlToConnect && !isLoadingConfig) { // Only connect if URL is set and config is loaded
        connectGlobalWebSocket(webSocketUrlToConnect);
    } else if (!webSocketUrlToConnect && !isLoadingConfig) {
        disconnectGlobalWebSocket();
    }
    return () => {
        // This cleanup is for when AppContentWrapper unmounts, or webSocketUrlToConnect changes to null
        disconnectGlobalWebSocket(); 
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [webSocketUrlToConnect, isLoadingConfig]); // connectGlobalWebSocket is memoized and stable, disconnectGlobalWebSocket is also memoized

  useEffect(() => {
    // Notification interval
    if (currentUser?.adminLevel === 'master') {
      notificationIntervalRef.current = setInterval(() => {
        if (newProfilesCount > 0 || newGiftsCount > 0) {
          let notifMessage = "Novas atualizações de dados via WebSocket: ";
          if (newProfilesCount > 0) notifMessage += `${newProfilesCount} novo(s) perfil(s)`;
          if (newProfilesCount > 0 && newGiftsCount > 0) notifMessage += " e ";
          if (newGiftsCount > 0) notifMessage += `${newGiftsCount} novo(s) presente(s)`;
          notifMessage += " foram identificados.";
          
          toast({
            title: "Atualização de Dados Kako Live",
            description: notifMessage,
            duration: 9000,
          });
          setNewProfilesCount(0);
          setNewGiftsCount(0);
        }
      }, 10 * 60 * 1000); // Every 10 minutes
    }
    return () => {
      if (notificationIntervalRef.current) clearInterval(notificationIntervalRef.current);
    };
  }, [currentUser?.adminLevel, newProfilesCount, newGiftsCount, toast]);


  const handleLogout = useCallback(async () => {
    disconnectGlobalWebSocket(); // Disconnect WebSocket before logging out
    try {
      await logout(); // logout is from useAuth()
      toast({ title: "Sessão Encerrada", description: "Você foi desconectado com sucesso." });
      router.push("/");
    } catch (error: any) {
      toast({ title: "Falha ao Sair", description: error.message, variant: "destructive" });
    }
  }, [logout, router, toast, disconnectGlobalWebSocket]);


  useEffect(() => {
    const fetchMaintenanceSettings = async () => {
      setIsLoadingRules(true);
      try {
        const maintenanceRulesDocRef = doc(db, "app_settings", "maintenance_rules");
        const docSnap = await getDoc(maintenanceRulesDocRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const fetchedRulesData = (data.rules as Partial<Omit<SiteModule, 'icon' | 'name'>>[] || []);
          
          const rehydratedRules = initialModuleStatuses.map(initialModule => {
            const defaultIcon = initialModule.icon || Home; // Fallback icon
            const fetchedModuleRule = fetchedRulesData.find(fr => fr.id === initialModule.id);
            if (fetchedModuleRule) {
              return {
                ...initialModule,
                icon: initialModule.icon || defaultIcon,
                ...fetchedModuleRule, 
                globallyOffline: fetchedModuleRule.globallyOffline ?? initialModule.globallyOffline,
                isHiddenFromMenu: fetchedModuleRule.isHiddenFromMenu ?? initialModule.isHiddenFromMenu,
                minimumAccessLevelWhenOffline: fetchedModuleRule.minimumAccessLevelWhenOffline ?? initialModule.minimumAccessLevelWhenOffline,
              } as SiteModule;
            }
            return { ...initialModule, icon: defaultIcon } as SiteModule; 
          }).filter(Boolean);

          setMaintenanceRules(rehydratedRules.length > 0 ? rehydratedRules : initialModuleStatuses.map(m => ({...m, icon: m.icon || Home})));
          // console.log("Maintenance rules fetched from Firestore:", rehydratedRules.length > 0 ? rehydratedRules : initialModuleStatuses);
        } else {
          setMaintenanceRules(initialModuleStatuses.map(m => ({...m, icon: m.icon || Home})));
          // console.log("No maintenance rules found in Firestore, using initial defaults:", initialModuleStatuses);
        }
      } catch (error) {
        console.error("Erro ao buscar configurações de manutenção:", error);
        setMaintenanceRules(initialModuleStatuses.map(m => ({...m, icon: m.icon || Home})));
        // console.log("Error fetching maintenance rules, using initial defaults:", initialModuleStatuses);
      } finally {
        setIsLoadingRules(false);
      }
    };
    fetchMaintenanceSettings();
  }, []);

  const isModuleHidden = useCallback((modulePath: string) => {
    let moduleId = '';
    if (modulePath === '/' || modulePath === '') moduleId = 'home';
    else if (modulePath.startsWith('/hosts')) moduleId = 'hosts';
    else if (modulePath.startsWith('/games') || modulePath.startsWith('/bingo')) moduleId = 'games';
    else if (modulePath.startsWith('/admin')) moduleId = 'adminPanel';
    else if (modulePath === '/profile') moduleId = 'profile';
    else if (modulePath === '/settings') moduleId = 'settings';
    
    const rule = maintenanceRules.find(r => r.id === moduleId);
    return rule?.isHiddenFromMenu || false;
  }, [maintenanceRules]);


  const standaloneAuthPaths = ['/login', '/signup', '/forgot-password', '/auth/verify-email-notice'];
  const isOnboardingPage = pathname.startsWith('/onboarding');
  const isAuthPage = standaloneAuthPaths.includes(pathname);
  const isMaintenancePage = pathname === '/maintenance';

  useEffect(() => {
    if (authLoading || isLoadingRules || isLoadingConfig) {
      setIsReadyForContent(false);
      return;
    }

    if (isAuthPage || isOnboardingPage || isMaintenancePage) {
      setIsReadyForContent(true);
      return;
    }

    if (!currentUser) {
      router.replace("/login");
      setIsReadyForContent(false);
      return;
    }

    let currentModuleId = '';
    if (pathname === '/' || pathname === '') currentModuleId = 'home';
    else if (pathname.startsWith('/hosts')) currentModuleId = 'hosts';
    else if (pathname.startsWith('/games') || pathname.startsWith('/bingo')) currentModuleId = 'games';
    else if (pathname.startsWith('/admin')) currentModuleId = 'adminPanel';
    else if (pathname === '/profile') currentModuleId = 'profile';
    else if (pathname === '/settings') currentModuleId = 'settings';
    
    const moduleRule = maintenanceRules.find(rule => rule.id === currentModuleId);

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
        router.replace('/maintenance');
        setIsReadyForContent(false);
        return;
      }
    }
    
    setIsReadyForContent(true);

  }, [authLoading, isLoadingRules, isLoadingConfig, currentUser, pathname, router, maintenanceRules, isAuthPage, isOnboardingPage, isMaintenancePage]);


  if ((authLoading || isLoadingRules || isLoadingConfig) && !isAuthPage && !isOnboardingPage && !isMaintenancePage) {
    return (
      <div className="flex justify-center items-center h-screen w-screen fixed inset-0 bg-background z-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  if (isAuthPage || isOnboardingPage || isMaintenancePage) {
     if (authLoading || isLoadingRules || isLoadingConfig) { // Keep showing main loader if essential configs are loading
        if (pathname === "/maintenance" && !isLoadingConfig && !isLoadingRules) { // If it's maintenance page and its own config is done
             // Allow maintenance page to render its content
        } else if (pathname === "/maintenance" && (isLoadingConfig || isLoadingRules)) {
            return (
                <div className="flex justify-center items-center h-screen w-screen fixed inset-0 bg-background z-50">
                    <LoadingSpinner size="lg" />
                </div>
            );
        } else if (!isMaintenancePage) { // For auth/onboarding, if they are still loading core stuff
             return (
                <div className="flex justify-center items-center h-screen w-screen fixed inset-0 bg-background z-50">
                    <LoadingSpinner size="lg" />
                </div>
            );
        }
     }
    // If auth/onboarding/maintenance pages are ready for their own content
    return (
      <>
        {
          React.Children.map(children, child =>
            isValidElement(child) ? cloneElement(child as React.ReactElement<any>, { globalConnectionStatus, globalProcessedMessages }) : child
          )
        }
        <Toaster />
      </>
    );
  }
  
  if (!isReadyForContent) { // General case for protected pages not yet ready
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
        pathname={pathname}
        isReadyForContent={isReadyForContent}
        handleLogout={handleLogout}
        hasUnreadMessages={hasUnreadMessages}
        isModuleHidden={isModuleHidden}
        globalConnectionStatus={globalConnectionStatus}
        globalProcessedMessages={globalProcessedMessages}
      >
        {children}
      </MainAppLayout>
      <Toaster />
    </SidebarProvider>
  );
}
