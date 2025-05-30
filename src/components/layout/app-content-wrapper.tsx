"use client";

import type { ReactNode } from 'react';
import { useEffect, useState, useMemo, useCallback } from 'react'; // Added useCallback and useMemo
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
    SidebarSeparator // Added SidebarSeparator
} from '@/components/ui/sidebar';
import { 
    Home, 
    Users, 
    TicketIcon as GameIcon, // Using TicketIcon as GameIcon
    MessageSquare, 
    UserCircle2, 
    Settings, 
    LayoutDashboard,
    LogOut, // Added LogOut for completeness if needed later in a direct logout button
    Crown, // For branding, if applicable
    SettingsIcon // Added SettingsIcon for the new layout
} from 'lucide-react'; 
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { UserProfile, SiteModule, MinimumAccessLevel } from "@/types"; // SiteModule, MinimumAccessLevel might come from types now
import { db, doc, getDoc, collection, query, where, getDocs, Timestamp } from "@/lib/firebase"; // Added collection, query, where, getDocs, Timestamp for fetching rules

// Define roleHierarchy directly in this file if not imported
const roleHierarchy: Record<UserProfile['role'] | NonNullable<UserProfile['adminLevel']>, number> = {
  player: 0,
  host: 1,
  suporte: 2,
  admin: 3,
  master: 4,
};

// Assuming initialModuleStatuses is defined or fetched
// For demonstration, using a basic one. In real app, this would be from types or fetched.
const initialModuleStatuses: SiteModule[] = [
  { id: 'home', name: "Página Inicial", icon: Home, globallyOffline: false, isHiddenFromMenu: false, minimumAccessLevelWhenOffline: 'player' },
  { id: 'hosts', name: "Página de Hosts", icon: Users, globallyOffline: false, isHiddenFromMenu: false, minimumAccessLevelWhenOffline: 'player' },
  { id: 'games', name: "Página de Jogos", icon: GameIcon, globallyOffline: false, isHiddenFromMenu: false, minimumAccessLevelWhenOffline: 'player' },
  { id: 'adminPanel', name: "Painel Admin", icon: LayoutDashboard, globallyOffline: false, isHiddenFromMenu: false, minimumAccessLevelWhenOffline: 'master' },
  { id: 'profile', name: "Página de Perfil", icon: UserCircle2, globallyOffline: false, isHiddenFromMenu: false, minimumAccessLevelWhenOffline: 'player' },
  { id: 'settings', name: "Página de Configurações", icon: Settings, globallyOffline: false, isHiddenFromMenu: false, minimumAccessLevelWhenOffline: 'player' },
];


export default function AppContentWrapper({ children }: { children: ReactNode }) {
  const { currentUser, loading: authLoading, logout, isOnboardingComplete } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const [hasUnreadMessages, setHasUnreadMessages] = useState(true);
  const [maintenanceRules, setMaintenanceRules] = useState<SiteModule[]>(initialModuleStatuses);
  const [isLoadingRules, setIsLoadingRules] = useState(true);
  const [isReadyForContent, setIsReadyForContent] = useState(false);
  const [showLabels, setShowLabels] = useState(false);

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
          console.log("Maintenance rules fetched from Firestore:", rehydratedRules.length > 0 ? rehydratedRules : initialModuleStatuses);
        } else {
          setMaintenanceRules(initialModuleStatuses.map(m => ({...m, icon: m.icon || Home})));
          console.log("No maintenance rules found in Firestore, using initial defaults:", initialModuleStatuses);
        }
      } catch (error) {
        console.error("Erro ao buscar configurações de manutenção:", error);
        setMaintenanceRules(initialModuleStatuses.map(m => ({...m, icon: m.icon || Home})));
         console.log("Error fetching maintenance rules, using initial defaults:", initialModuleStatuses);
      } finally {
        setIsLoadingRules(false);
      }
    };
    fetchMaintenanceSettings();
  }, []);


  useEffect(() => {
    if (pathname === "/messages") {
      setHasUnreadMessages(false);
    }
  }, [pathname]);

  const standaloneAuthPaths = ['/login', '/signup', '/forgot-password'];
  const isOnboardingPage = pathname.startsWith('/onboarding');
  const isAuthPage = standaloneAuthPaths.includes(pathname);
  const isMaintenancePage = pathname === '/maintenance';

  useEffect(() => {
    if (authLoading || isLoadingRules) {
      setIsReadyForContent(false); 
      return;
    }

    if (isAuthPage || isOnboardingPage) {
      // Redirection logic for already logged-in users on auth pages is handled within those pages
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

    // Verificar se o onboarding está completo, caso não esteja, redirecionar para o passo correto
    if (!isOnboardingComplete(currentUser) && !isOnboardingPage) {
      if (!currentUser.isVerified && !(pathname.startsWith('/auth/verify-email'))) {
        router.replace(`/auth/verify-email-notice?email=${encodeURIComponent(currentUser.email || "")}`);
        setIsReadyForContent(false);
        return;
      }
      
      if (!currentUser.agreedToTermsAt) {
        router.replace("/onboarding/terms");
        setIsReadyForContent(false);
        return;
      } 
      
      if (!currentUser.role) {
        router.replace("/onboarding/role-selection");
        setIsReadyForContent(false);
        return;
      } 
      
      if (!currentUser.birthDate || !currentUser.gender || !currentUser.country) {
        router.replace("/onboarding/age-verification");
        setIsReadyForContent(false);
        return;
      } 
      
      if (!currentUser.phoneNumber || !currentUser.foundUsVia) {
        router.replace("/onboarding/contact-info");
        setIsReadyForContent(false);
        return;
      }
      
      // Verificar etapa específica baseada na função do usuário
      if (currentUser.hasCompletedOnboarding === false || typeof currentUser.hasCompletedOnboarding === 'undefined') {
        if (currentUser.role === 'host') {
          router.replace("/onboarding/kako-id-input");
        } else if (currentUser.role === 'player') {
          router.replace("/onboarding/kako-account-check");
        } else {
          router.replace("/profile");
        }
        setIsReadyForContent(false);
        return;
      }
    }

    // Continuar com a verificação de manutenção após confirmar que o onboarding está completo
    let currentModuleId = '';
    if (pathname === '/' || pathname === '') currentModuleId = 'home';
    else if (pathname.startsWith('/hosts')) currentModuleId = 'hosts';
    else if (pathname.startsWith('/games') || pathname.startsWith('/bingo')) currentModuleId = 'games';
    else if (pathname.startsWith('/admin')) currentModuleId = 'adminPanel';
    else if (pathname === '/profile') currentModuleId = 'profile';
    else if (pathname === '/settings') currentModuleId = 'settings';
    
    const moduleRule = maintenanceRules.find(rule => rule.id === currentModuleId);

    console.log("Maintenance Check:", { 
      pathname, 
      currentModuleId, 
      moduleRule: moduleRule ? { id: moduleRule.id, globallyOffline: moduleRule.globallyOffline, minAccess: moduleRule.minimumAccessLevelWhenOffline } : null, 
      currentUserRole: currentUser?.role, 
      currentUserAdminLevel: currentUser?.adminLevel 
    });

    if (moduleRule && moduleRule.globallyOffline) {
      let userHasAccess = false;
      const userBaseRole = currentUser.role || 'player';
      const userAdminRole = currentUser.adminLevel;
      
      const userBaseLevel = roleHierarchy[userBaseRole as keyof typeof roleHierarchy] ?? roleHierarchy.player;
      const userAdminLevelVal = userAdminRole ? roleHierarchy[userAdminRole as keyof typeof roleHierarchy] : -1; 
      const effectiveUserLevel = Math.max(userBaseLevel, userAdminLevelVal);

      if (moduleRule.minimumAccessLevelWhenOffline === 'nobody') {
        userHasAccess = false;
      } else if (moduleRule.minimumAccessLevelWhenOffline === 'player') { 
        userHasAccess = effectiveUserLevel === roleHierarchy.player;
      } else { 
        const requiredLevel = roleHierarchy[moduleRule.minimumAccessLevelWhenOffline as keyof typeof roleHierarchy];
        userHasAccess = effectiveUserLevel >= requiredLevel;
      }
      
      if (!userHasAccess) {
        console.log(`Access DENIED for module ${currentModuleId}. User level: ${effectiveUserLevel}, Required: ${moduleRule.minimumAccessLevelWhenOffline}. Redirecting to /maintenance.`);
        router.replace('/maintenance');
        setIsReadyForContent(false);
        return;
      } else {
        console.log(`Access GRANTED for module ${currentModuleId}. User level: ${effectiveUserLevel}, Required: ${moduleRule.minimumAccessLevelWhenOffline}.`);
      }
    }
    
    setIsReadyForContent(true);

  }, [authLoading, isLoadingRules, currentUser, pathname, router, maintenanceRules, isAuthPage, isOnboardingPage, isMaintenancePage, isOnboardingComplete]);


  if ((authLoading || isLoadingRules) && !isAuthPage && !isOnboardingPage && !isMaintenancePage) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex flex-col items-center justify-center">
        <div className="text-center space-y-4">
          <LoadingSpinner size="xl" />
          <p className="text-muted-foreground animate-pulse">Carregando aplicação...</p>
          <div className="w-48 h-1 bg-muted rounded-full overflow-hidden mt-2">
            <div 
              className="h-full bg-primary rounded-full animate-loading-progress" 
              style={{ width: `${Math.min((authLoading ? 0 : 50) + (isLoadingRules ? 0 : 50), 100)}%` }}
            />
          </div>
        </div>
      </div>
    );
  }
  
  if (isAuthPage || isOnboardingPage) {
    return (
      <>
        {children}
        <Toaster />
      </>
    );
  }
  
   if (isMaintenancePage) {
     if (authLoading || isLoadingRules) {
        return (
            <div className="fixed inset-0 bg-background z-50 flex items-center justify-center">
                <LoadingSpinner size="lg" message="Verificando acesso à manutenção..." />
            </div>
        );
     }
      // If not loading, render maintenance page (which might be wrapped by ProtectedPage for currentUser access)
      // The 'children' here would be the MaintenancePage component
      // The SidebarProvider and full layout will wrap it.
   }


  if (!isReadyForContent && !isAuthPage && !isOnboardingPage) {
    // This covers the case where checks are done, but content isn't ready (e.g. redirecting)
    return (
      <div className="fixed inset-0 bg-background z-50 flex items-center justify-center">
        <LoadingSpinner size="lg" message="Redirecionando..." />
      </div>
    );
  }

  // This is the main application layout
  return (
    <SidebarProvider defaultOpen={false}>
      <div className="flex h-full w-full"> {/* Ensures Sidebar and SidebarInset are flex siblings taking full height */}
        <Sidebar collapsible="icon" className="border-r bg-muted/40"> {/* Sidebar from ui/sidebar */}
          <SidebarHeader className="p-0 flex flex-col items-center justify-center">
             <button 
               className="h-16 w-full rounded-none border-b border-sidebar-border hover:bg-sidebar-accent focus-visible:ring-0 focus-visible:ring-offset-0 flex items-center justify-center"
               onClick={() => setShowLabels(!showLabels)}
             >
               {showLabels ? (
                 <SettingsIcon className="h-6 w-6 text-primary" />
               ) : (
                 <Crown className="h-6 w-6 text-primary" />
               )}
             </button>
          </SidebarHeader>
          <SidebarContent className="flex flex-col flex-1 pt-4">
            <SidebarMenu className="items-center w-full space-y-3">
              {[
                { id: 'home', label: 'Início', icon: Home, href: '/' },
                { id: 'hosts', label: 'Lives', icon: Users, href: '/hosts' },
                { id: 'games', label: 'Jogos', icon: GameIcon, href: '/bingo' }, // Using GameIcon (aliased TicketIcon)
                { id: 'messages', label: 'Mensagens', icon: MessageSquare, href: '/messages', hasNotification: hasUnreadMessages },
              ].map((item) => {
                // Verificação específica para o item de mensagens
                const isItemActive = item.id === 'messages' 
                  ? pathname === '/messages'
                  : (item.href === '/' && (pathname === '/' || pathname === '')) || 
                    (item.href !== '/' && pathname.startsWith(item.href));
                
                return (
                <SidebarMenuItem key={item.id} className="w-full">
                  <div className="flex flex-col items-center w-full">
                    <SidebarMenuButton 
                      asChild 
                      variant={pathname === item.href ? "secondary" : "ghost"} 
                      isActive={isItemActive}
                      className={showLabels ? "!h-10" : "!h-12"}
                    >
                      <Link href={item.href || '#'}>
                        <item.icon 
                          className={cn(
                            "transition-all duration-500 ease-in-out shrink-0",
                            showLabels ? "size-5" : "size-7",
                            isItemActive && "!text-primary"
                          )} 
                        />
                        {item.id === 'messages' && item.hasNotification && (
                          <span className="absolute h-2 w-2 rounded-full bg-green-500 ring-1 ring-card pointer-events-none top-2 right-2" />
                        )}
                      </Link>
                    </SidebarMenuButton>
                    {showLabels && (
                      <span className="text-xs text-muted-foreground mt-1.5">
                        {item.label}
                      </span>
                    )}
                  </div>
                </SidebarMenuItem>
              )})}
            </SidebarMenu>
            <div className="flex-grow" /> {/* Pushes footer to bottom */}
          </SidebarContent>
          <SidebarFooter className="p-2 border-t border-sidebar-border">
             <SidebarMenu className="items-center w-full space-y-3 py-3">
                {currentUser?.adminLevel && (
                  <>
                    <SidebarMenuItem className="w-full">
                      <div className="flex flex-col items-center w-full">
                        <SidebarMenuButton asChild isActive={pathname.startsWith('/admin') && !pathname.includes('bingo-admin')} className={showLabels ? "!h-10" : "!h-12"}>
                          <Link href="/admin">
                            <LayoutDashboard className={cn(
                              "transition-all duration-500 ease-in-out shrink-0",
                              showLabels ? "size-5" : "size-7",
                              (pathname.startsWith('/admin') && !pathname.includes('bingo-admin')) && "!text-primary"
                            )} />
                          </Link>
                        </SidebarMenuButton>
                        {showLabels && (
                          <span className="text-xs text-muted-foreground mt-1.5">
                            Painel
                          </span>
                        )}
                      </div>
                    </SidebarMenuItem>
                    <SidebarMenuItem className="w-full">
                      <div className="flex flex-col items-center w-full">
                        <SidebarMenuButton asChild isActive={pathname.includes('bingo-admin')} className={showLabels ? "!h-10" : "!h-12"}>
                          <Link href="/admin/bingo-admin">
                            <GameIcon className={cn(
                              "transition-all duration-500 ease-in-out shrink-0",
                              showLabels ? "size-5" : "size-7",
                              pathname.includes('bingo-admin') && "!text-primary"
                            )} />
                          </Link>
                        </SidebarMenuButton>
                        {showLabels && (
                          <span className="text-xs text-muted-foreground mt-1.5">
                            Bingo
                          </span>
                        )}
                      </div>
                    </SidebarMenuItem>
                  </>
                )}
                <SidebarMenuItem className="w-full">
                  <div className="flex flex-col items-center w-full">
                    <SidebarMenuButton asChild isActive={pathname === '/profile'} className={showLabels ? "!h-10" : "!h-12"}>
                      <Link href="/profile">
                        <UserCircle2 className={cn(
                          "transition-all duration-500 ease-in-out shrink-0",
                          showLabels ? "size-5" : "size-7",
                          pathname === '/profile' && "!text-primary"
                        )} />
                      </Link>
                    </SidebarMenuButton>
                    {showLabels && (
                      <span className="text-xs text-muted-foreground mt-1.5">
                        Perfil
                      </span>
                    )}
                  </div>
                </SidebarMenuItem>
                <SidebarMenuItem className="w-full">
                  <div className="flex flex-col items-center w-full">
                    <SidebarMenuButton asChild isActive={pathname === '/settings'} className={showLabels ? "!h-10" : "!h-12"}>
                      <Link href="/settings">
                        <Settings className={cn(
                          "transition-all duration-500 ease-in-out shrink-0",
                          showLabels ? "size-5" : "size-7",
                          pathname === '/settings' && "!text-primary"
                        )} />
                      </Link>
                    </SidebarMenuButton>
                    {showLabels && (
                      <span className="text-xs text-muted-foreground mt-1.5">
                        Config
                      </span>
                    )}
                  </div>
                </SidebarMenuItem>
                <SidebarMenuItem className="w-full">
                  <div className="flex flex-col items-center w-full">
                    <SidebarMenuButton onClick={logout} className={showLabels ? "!h-10" : "!h-12"}>
                      <LogOut className={cn(
                        "transition-all duration-500 ease-in-out shrink-0",
                        showLabels ? "size-5" : "size-7"
                      )} />
                    </SidebarMenuButton>
                    {showLabels && (
                      <span className="text-xs text-muted-foreground mt-1.5">
                        Sair
                      </span>
                    )}
                  </div>
                </SidebarMenuItem>
             </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset className="flex-1 flex flex-col overflow-hidden"> {/* Ensure SidebarInset can manage overflow */}
          <Header />
          <main className={cn(
            "flex-grow overflow-hidden", // Remove scroll entirely
            (pathname === "/messages" || pathname.startsWith("/admin") || pathname === "/profile") ? "p-0" : "px-4 py-8",
            pathname === "/" ? "flex flex-col" : "",
            "md:pb-0 pb-24" // Increased padding to account for larger navigation bar
          )}>
            {children}
          </main>
          
          {/* Mobile Bottom Navigation Bar */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border flex justify-around items-center h-16 z-50 w-full">
            <Link href="/" className="flex items-center justify-center h-full w-full">
              <Home className={cn("h-7 w-7", (pathname === '/' || pathname === '') && "text-primary")} />
            </Link>
            <Link href="/hosts" className="flex items-center justify-center h-full w-full">
              <Users className={cn("h-7 w-7", pathname.startsWith('/hosts') && "text-primary")} />
            </Link>
            <Link href="/bingo" className="flex items-center justify-center h-full w-full">
              <GameIcon className={cn("h-7 w-7", pathname.startsWith('/bingo') && "text-primary")} />
            </Link>
            <Link href="/messages" className="flex items-center justify-center h-full w-full relative">
              <MessageSquare className={cn("h-7 w-7", pathname === '/messages' && "text-primary")} />
              {hasUnreadMessages && (
                <span className="absolute h-2.5 w-2.5 rounded-full bg-green-500 -right-0.5 -top-0.5" />
              )}
            </Link>
            <Link href="/profile" className="flex items-center justify-center h-full w-full">
              <UserCircle2 className={cn("h-7 w-7", pathname === '/profile' && "text-primary")} />
            </Link>
          </div>
        </SidebarInset>
      </div>
      <Toaster />
    </SidebarProvider>
  );
}
