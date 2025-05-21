
"use client";

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/layout/header';
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarFooter, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { Home, Users, TicketIcon as GameIcon, MessageSquare, UserCircle2, Settings, LayoutDashboard } from 'lucide-react'; // Renamed TicketIcon to GameIcon for clarity
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { UserProfile } from "@/types";
import { db, doc, getDoc } from "@/lib/firebase";
import { initialModuleStatuses, type SiteModule, type UserRole as AdminUserRole, type MinimumAccessLevel } from '@/app/admin/maintenance/offline/page';

const roleHierarchy: Record<AdminUserRole, number> = {
  player: 0,
  host: 1,
  suporte: 2,
  admin: 3,
  master: 4,
};

export default function AppContentWrapper({ children }: { children: ReactNode }) {
  const { currentUser, loading: authLoading } = useAuth();
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
            const fetchedModuleRule = fetchedRulesData.find(fr => fr.id === initialModule.id);
            if (fetchedModuleRule) {
              return {
                ...initialModule, 
                ...fetchedModuleRule, 
                globallyOffline: fetchedModuleRule.globallyOffline ?? initialModule.globallyOffline,
                isHiddenFromMenu: fetchedModuleRule.isHiddenFromMenu ?? initialModule.isHiddenFromMenu,
                minimumAccessLevelWhenOffline: fetchedModuleRule.minimumAccessLevelWhenOffline ?? initialModule.minimumAccessLevelWhenOffline,
              };
            }
            return initialModule; 
          }).filter(Boolean) as SiteModule[];

          setMaintenanceRules(rehydratedRules.length > 0 ? rehydratedRules : initialModuleStatuses);
          console.log("Maintenance rules fetched from Firestore:", rehydratedRules.length > 0 ? rehydratedRules : initialModuleStatuses);
        } else {
          setMaintenanceRules(initialModuleStatuses);
          console.log("No maintenance rules found in Firestore, using initial defaults:", initialModuleStatuses);
        }
      } catch (error) {
        console.error("Erro ao buscar configurações de manutenção:", error);
        setMaintenanceRules(initialModuleStatuses);
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
      setIsReadyForContent(false); // Content not ready if auth or rules are still loading
      return;
    }

    if (isAuthPage || isOnboardingPage) {
      if (currentUser && pathname !== '/profile' && !isOnboardingPage) { // Redirect logged-in users away from auth pages unless it's /profile or onboarding
        // (The complex redirection from auth pages is handled within those pages themselves based on onboarding status)
      }
      setIsReadyForContent(true); // Auth/Onboarding pages handle their own readiness/content
      return;
    }
    
    if (isMaintenancePage) {
        setIsReadyForContent(true); // Maintenance page itself can always be rendered if user lands on it
        return;
    }

    // --- User Authentication Check ---
    if (!currentUser) {
      router.replace("/login");
      setIsReadyForContent(false);
      return;
    }

    // --- Maintenance Mode Check ---
    let currentModuleId = '';
    if (pathname === '/' || pathname === '') currentModuleId = 'home';
    else if (pathname.startsWith('/hosts')) currentModuleId = 'hosts';
    else if (pathname.startsWith('/games') || pathname.startsWith('/bingo')) currentModuleId = 'games';
    else if (pathname.startsWith('/admin')) currentModuleId = 'adminPanel';
    else if (pathname === '/profile') currentModuleId = 'profile';
    else if (pathname === '/settings') currentModuleId = 'settings';
    // Add other path to module ID mappings here

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
     if (authLoading || isLoadingRules) {
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
      <Sidebar collapsible="icon" className="border-r">
        <SidebarHeader className="p-0">
          <SidebarTrigger className="h-16 w-full rounded-none border-b border-sidebar-border hover:bg-sidebar-accent focus-visible:ring-0 focus-visible:ring-offset-0" />
        </SidebarHeader>
        <SidebarContent className="flex flex-col flex-1 pt-2">
          <SidebarMenu className="items-center mt-2">
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Início">
                <Link href="/">
                  <Home className="transition-all duration-500 ease-in-out shrink-0 size-5 group-data-[collapsible=icon]:size-7 group-data-[collapsible=icon]:delay-200" />
                  <span className="transition-all ease-out duration-500 delay-150 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:max-w-0 group-data-[collapsible=icon]:delay-0 text-xs whitespace-nowrap overflow-hidden opacity-100 max-w-[100px]">Início</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Hosts">
                <Link href="/hosts">
                  <Users className="transition-all duration-500 ease-in-out shrink-0 size-5 group-data-[collapsible=icon]:size-7 group-data-[collapsible=icon]:delay-200" />
                  <span className="transition-all ease-out duration-500 delay-150 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:max-w-0 group-data-[collapsible=icon]:delay-0 text-xs whitespace-nowrap overflow-hidden opacity-100 max-w-[100px]">Hosts</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Jogos">
                <Link href="/bingo">
                  <GameIcon className="transition-all duration-500 ease-in-out shrink-0 size-5 group-data-[collapsible=icon]:size-7 group-data-[collapsible=icon]:delay-200" />
                  <span className="transition-all ease-out duration-500 delay-150 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:max-w-0 group-data-[collapsible=icon]:delay-0 text-xs whitespace-nowrap overflow-hidden opacity-100 max-w-[100px]">Jogos</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem className="relative group/menu-item"> 
              <SidebarMenuButton asChild tooltip="Mensagem">
                <Link href="/messages">
                  <MessageSquare className="transition-all duration-500 ease-in-out shrink-0 size-5 group-data-[collapsible=icon]:size-7 group-data-[collapsible=icon]:delay-200" />
                  <span className="transition-all ease-out duration-500 delay-150 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:max-w-0 group-data-[collapsible=icon]:delay-0 text-xs whitespace-nowrap overflow-hidden opacity-100 max-w-[100px]">Mensagem</span>
                   {hasUnreadMessages && (
                    <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-green-500 ring-1 ring-sidebar pointer-events-none group-data-[collapsible=icon]:top-3 group-data-[collapsible=icon]:right-3 group-data-[collapsible=icon]:h-2.5 group-data-[collapsible=icon]:w-2.5" />
                  )}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          <div className="flex-grow" />
        </SidebarContent>
        <SidebarFooter className="p-2 border-t border-sidebar-border">
           <SidebarMenu className="items-center">
              {currentUser?.adminLevel && (
                <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Painel Admin">
                      <Link href="/admin">
                        <LayoutDashboard className="transition-all duration-500 ease-in-out shrink-0 size-5 group-data-[collapsible=icon]:size-7 group-data-[collapsible=icon]:delay-200" />
                        <span className="transition-all ease-out duration-500 delay-150 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:max-w-0 group-data-[collapsible=icon]:delay-0 text-xs whitespace-nowrap overflow-hidden opacity-100 max-w-[100px]">Painel</span>
                      </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Perfil">
                     <Link href="/profile">
                       <UserCircle2 className="transition-all duration-500 ease-in-out shrink-0 size-5 group-data-[collapsible=icon]:size-7 group-data-[collapsible=icon]:delay-200" />
                       <span className="transition-all ease-out duration-500 delay-150 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:max-w-0 group-data-[collapsible=icon]:delay-0 text-xs whitespace-nowrap overflow-hidden opacity-100 max-w-[100px]">Perfil</span>
                     </Link>
                  </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Config">
                     <Link href="/settings">
                       <Settings className="transition-all duration-500 ease-in-out shrink-0 size-5 group-data-[collapsible=icon]:size-7 group-data-[collapsible=icon]:delay-200" />
                       <span className="transition-all ease-out duration-500 delay-150 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:max-w-0 group-data-[collapsible=icon]:delay-0 text-xs whitespace-nowrap overflow-hidden opacity-100 max-w-[100px]">Config</span>
                     </Link>
                  </SidebarMenuButton>
              </SidebarMenuItem>
           </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <Header />
        <main className={cn(
          "flex-grow",
          (pathname === "/messages" || pathname.startsWith("/admin") || pathname === "/profile") ? "p-0" : "px-4 py-8",
          pathname === "/" ? "flex flex-col" : "" 
        )}>
          {children}
        </main>
      </SidebarInset>
      <Toaster />
    </SidebarProvider>
  );
}

    