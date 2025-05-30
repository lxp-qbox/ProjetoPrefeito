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
    Crown // For branding, if applicable
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
  const { currentUser, loading: authLoading, logout } = useAuth(); // Added logout
  const pathname = usePathname();
  const router = useRouter();

  const [hasUnreadMessages, setHasUnreadMessages] = useState(true);
  const [maintenanceRules, setMaintenanceRules] = useState<SiteModule[]>(initialModuleStatuses);
  const [isLoadingRules, setIsLoadingRules] = useState(true);
  const [isReadyForContent, setIsReadyForContent] = useState(false);

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

  }, [authLoading, isLoadingRules, currentUser, pathname, router, maintenanceRules, isAuthPage, isOnboardingPage, isMaintenancePage]);


  if ((authLoading || isLoadingRules) && !isAuthPage && !isOnboardingPage && !isMaintenancePage) {
    return (
      <div className="flex justify-center items-center h-screen w-screen fixed inset-0 bg-background z-50">
        <LoadingSpinner size="lg" />
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
     if (authLoading || isLoadingRules) { // Still show loader if auth/rules are loading for maintenance page
        return (
            <div className="flex justify-center items-center h-screen w-screen fixed inset-0 bg-background z-50">
                <LoadingSpinner size="lg" />
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
      <div className="flex justify-center items-center h-screen w-screen fixed inset-0 bg-background z-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // This is the main application layout
  return (
    <SidebarProvider defaultOpen={false}>
      <div className="flex h-full w-full"> {/* Ensures Sidebar and SidebarInset are flex siblings taking full height */}
        <Sidebar collapsible="icon" className="border-r bg-muted/40"> {/* Sidebar from ui/sidebar */}
          <SidebarHeader className="p-0 flex flex-col items-center justify-center">
             <SidebarTrigger className="h-16 w-full rounded-none border-b border-sidebar-border hover:bg-sidebar-accent focus-visible:ring-0 focus-visible:ring-offset-0" />
             {/* Branding shown when expanded */}
             <div className={cn(
                "flex items-center justify-center h-12 transition-all duration-500 ease-in-out overflow-hidden group-data-[state=collapsed]:h-0 group-data-[state=collapsed]:opacity-0 group-data-[state=collapsed]:invisible",
             )}>
                <Crown className="size-6 text-primary shrink-0" />
                <span className="ml-2 text-lg font-semibold text-primary whitespace-nowrap">
                  The Presidential Agency
                </span>
             </div>
          </SidebarHeader>
          <SidebarContent className="flex flex-col flex-1 pt-2">
            <SidebarMenu className="items-center w-full">
              {[
                { id: 'home', label: 'Início', icon: Home, href: '/' },
                { id: 'hosts', label: 'Hosts', icon: Users, href: '/hosts' },
                { id: 'games', label: 'Jogos', icon: GameIcon, href: '/bingo' }, // Using GameIcon (aliased TicketIcon)
                { id: 'messages', label: 'Mensagem', icon: MessageSquare, href: '/messages', hasNotification: hasUnreadMessages },
              ].map((item) => {
                // Verificação específica para o item de mensagens
                const isItemActive = item.id === 'messages' 
                  ? pathname === '/messages'
                  : (item.href === '/' && (pathname === '/' || pathname === '')) || 
                    (item.href !== '/' && pathname.startsWith(item.href));
                
                return (
                <SidebarMenuItem key={item.id} className="w-full">
                  <SidebarMenuButton 
                    asChild 
                    tooltip={item.label} 
                    variant={pathname === item.href ? "secondary" : "ghost"} 
                    isActive={isItemActive}
                  >
                    <Link href={item.href || '#'}>
                      <item.icon 
                        className={cn(
                          "transition-all duration-500 ease-in-out shrink-0 size-5 group-data-[state=collapsed]:size-6",
                          isItemActive && "!text-primary"
                        )} 
                      />
                      <span className={cn("transition-all ease-out duration-300 delay-150 group-data-[state=collapsed]:opacity-0 group-data-[state=collapsed]:max-w-0 group-data-[state=collapsed]:delay-0 text-xs whitespace-nowrap overflow-hidden opacity-100 max-w-[100px]")}>{item.label}</span>
                      {item.id === 'messages' && item.hasNotification && (
                        <span className={cn(
                            "absolute h-2 w-2 rounded-full bg-green-500 ring-1 ring-card pointer-events-none",
                            "top-2 right-2 group-data-[state=collapsed]:top-2.5 group-data-[state=collapsed]:right-2.5 group-data-[state=collapsed]:h-2.5 group-data-[state=collapsed]:w-2.5"
                         )} />
                       )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )})}
            </SidebarMenu>
            <div className="flex-grow" /> {/* Pushes footer to bottom */}
          </SidebarContent>
          <SidebarFooter className="p-2 border-t border-sidebar-border">
             <SidebarMenu className="items-center w-full">
                {currentUser?.adminLevel && (
                  <>
                    <SidebarMenuItem className="w-full">
                        <SidebarMenuButton asChild tooltip="Painel Admin" isActive={pathname.startsWith('/admin') && !pathname.includes('bingo-admin')}>
                          <Link href="/admin">
                            <LayoutDashboard className={cn(
                              "transition-all duration-500 ease-in-out shrink-0 size-5 group-data-[state=collapsed]:size-6",
                              (pathname.startsWith('/admin') && !pathname.includes('bingo-admin')) && "!text-primary"
                            )} />
                            <span className={cn("transition-all ease-out duration-300 delay-150 group-data-[state=collapsed]:opacity-0 group-data-[state=collapsed]:max-w-0 group-data-[state=collapsed]:delay-0 text-xs whitespace-nowrap overflow-hidden opacity-100 max-w-[100px]")}>Painel</span>
                          </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                     <SidebarMenuItem className="w-full">
                        <SidebarMenuButton asChild tooltip="Bingo Admin" isActive={pathname.includes('bingo-admin')}>
                          <Link href="/admin/bingo-admin">
                            <GameIcon className={cn(
                              "transition-all duration-500 ease-in-out shrink-0 size-5 group-data-[state=collapsed]:size-6",
                              pathname.includes('bingo-admin') && "!text-primary"
                            )} />
                            <span className={cn("transition-all ease-out duration-300 delay-150 group-data-[state=collapsed]:opacity-0 group-data-[state=collapsed]:max-w-0 group-data-[state=collapsed]:delay-0 text-xs whitespace-nowrap overflow-hidden opacity-100 max-w-[100px]")}>Bingo</span>
                          </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                  </>
                )}
                <SidebarMenuItem className="w-full">
                    <SidebarMenuButton asChild tooltip="Perfil" isActive={pathname === '/profile'}>
                       <Link href="/profile">
                         <UserCircle2 className={cn(
                           "transition-all duration-500 ease-in-out shrink-0 size-5 group-data-[state=collapsed]:size-6",
                           pathname === '/profile' && "!text-primary"
                         )} />
                         <span className={cn("transition-all ease-out duration-300 delay-150 group-data-[state=collapsed]:opacity-0 group-data-[state=collapsed]:max-w-0 group-data-[state=collapsed]:delay-0 text-xs whitespace-nowrap overflow-hidden opacity-100 max-w-[100px]")}>Perfil</span>
                       </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem className="w-full">
                    <SidebarMenuButton asChild tooltip="Config" isActive={pathname === '/settings'}>
                       <Link href="/settings">
                         <Settings className={cn(
                           "transition-all duration-500 ease-in-out shrink-0 size-5 group-data-[state=collapsed]:size-6",
                           pathname === '/settings' && "!text-primary"
                         )} />
                         <span className={cn("transition-all ease-out duration-300 delay-150 group-data-[state=collapsed]:opacity-0 group-data-[state=collapsed]:max-w-0 group-data-[state=collapsed]:delay-0 text-xs whitespace-nowrap overflow-hidden opacity-100 max-w-[100px]")}>Config</span>
                       </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem className="w-full">
                  <SidebarMenuButton tooltip="Sair" onClick={logout}>
                      <LogOut className={cn("transition-all duration-500 ease-in-out shrink-0 size-5 group-data-[state=collapsed]:size-6")} />
                      <span className={cn("transition-all ease-out duration-300 delay-150 group-data-[state=collapsed]:opacity-0 group-data-[state=collapsed]:max-w-0 group-data-[state=collapsed]:delay-0 text-xs whitespace-nowrap overflow-hidden opacity-100 max-w-[100px]")}>Sair</span>
                  </SidebarMenuButton>
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
