
"use client";

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/layout/header';
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarFooter, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarTrigger } from '@/components/ui/sidebar';
import { Home, Users, TicketIcon, MessageSquare, UserCircle2, Settings, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { UserProfile } from "@/types";
import { db, doc, getDoc } from "@/lib/firebase";
import { initialModuleStatuses, type SiteModule, type MinimumAccessLevel, type UserRole as AdminUserRole } from '@/app/admin/maintenance/offline/page';

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
        } else {
          setMaintenanceRules(initialModuleStatuses);
        }
      } catch (error) {
        console.error("Erro ao buscar configurações de manutenção:", error);
        setMaintenanceRules(initialModuleStatuses);
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

  useEffect(() => {
    if (authLoading || isLoadingRules) {
      setIsReadyForContent(false);
      return;
    }

    const standaloneAuthPaths = ['/login', '/signup', '/forgot-password', '/maintenance'];
    const isOnboardingPage = pathname.startsWith('/onboarding');
    const isAuthPage = standaloneAuthPaths.includes(pathname);
    
    if (isAuthPage || isOnboardingPage) {
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
    else if (pathname === '/messages') currentModuleId = 'messages';

    const moduleRule = maintenanceRules.find(rule => rule.id === currentModuleId);

    if (moduleRule && moduleRule.globallyOffline) {
      let userHasAccess = false;
      const userBaseRole = currentUser.role || 'player';
      const userAdminRole = currentUser.adminLevel;
      const userBaseLevel = roleHierarchy[userBaseRole as AdminUserRole] ?? roleHierarchy.player;
      const userAdminLevelVal = userAdminRole ? roleHierarchy[userAdminRole as AdminUserRole] : -1; // Use -1 or some other low value if no adminLevel
      const effectiveUserLevel = Math.max(userBaseLevel, userAdminLevelVal);

      switch (moduleRule.minimumAccessLevelWhenOffline) {
        case 'nobody': userHasAccess = false; break;
        case 'master': userHasAccess = effectiveUserLevel >= roleHierarchy.master; break;
        case 'admin': userHasAccess = effectiveUserLevel >= roleHierarchy.admin; break;
        case 'suporte': userHasAccess = effectiveUserLevel >= roleHierarchy.suporte; break;
        case 'host': userHasAccess = effectiveUserLevel >= roleHierarchy.host; break;
        case 'player': userHasAccess = effectiveUserLevel === roleHierarchy.player; break;
        default: userHasAccess = true; // Default to access if rule is malformed for safety
      }
      
      if (!userHasAccess && pathname !== '/maintenance') {
        router.replace('/maintenance');
        setIsReadyForContent(false);
        return;
      }
    }
    
    setIsReadyForContent(true);

  }, [authLoading, isLoadingRules, currentUser, pathname, router, maintenanceRules]);

  const standaloneAuthPaths = ['/login', '/signup', '/forgot-password'];
  const isOnboardingPage = pathname.startsWith('/onboarding');
  const isAuthPage = standaloneAuthPaths.includes(pathname);
  const isMaintenancePage = pathname === '/maintenance';

  if (authLoading || isLoadingRules) {
    if (!isAuthPage && !isOnboardingPage && !isMaintenancePage) {
      return (
        <div className="flex justify-center items-center h-screen w-screen fixed inset-0 bg-background z-50">
          <LoadingSpinner size="lg" />
        </div>
      );
    }
  }
  
  if (isAuthPage || isOnboardingPage || isMaintenancePage) {
    return (
      <>
        {children}
        <Toaster />
      </>
    );
  }

  if (!isReadyForContent) {
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
                  <span className="transition-all ease-out duration-300 whitespace-nowrap overflow-hidden opacity-100 max-w-[100px] delay-150 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:max-w-0 group-data-[collapsible=icon]:delay-0 text-xs">Início</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Hosts">
                <Link href="/hosts">
                  <Users className="transition-all duration-500 ease-in-out shrink-0 size-5 group-data-[collapsible=icon]:size-7 group-data-[collapsible=icon]:delay-200" />
                  <span className="transition-all ease-out duration-300 whitespace-nowrap overflow-hidden opacity-100 max-w-[100px] delay-150 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:max-w-0 group-data-[collapsible=icon]:delay-0 text-xs">Hosts</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Jogos">
                <Link href="/bingo">
                  <TicketIcon className="transition-all duration-500 ease-in-out shrink-0 size-5 group-data-[collapsible=icon]:size-7 group-data-[collapsible=icon]:delay-200" />
                  <span className="transition-all ease-out duration-300 whitespace-nowrap overflow-hidden opacity-100 max-w-[100px] delay-150 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:max-w-0 group-data-[collapsible=icon]:delay-0 text-xs">Jogos</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem className="relative group/menu-item"> 
              <SidebarMenuButton asChild tooltip="Mensagem">
                <Link href="/messages">
                  <MessageSquare className="transition-all duration-500 ease-in-out shrink-0 size-5 group-data-[collapsible=icon]:size-7 group-data-[collapsible=icon]:delay-200" />
                  <span className="transition-all ease-out duration-300 whitespace-nowrap overflow-hidden opacity-100 max-w-[100px] delay-150 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:max-w-0 group-data-[collapsible=icon]:delay-0 text-xs">Mensagem</span>
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
                        <span className="transition-all ease-out duration-300 whitespace-nowrap overflow-hidden opacity-100 max-w-[100px] delay-150 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:max-w-0 group-data-[collapsible=icon]:delay-0 text-xs">Painel</span>
                      </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Perfil">
                     <Link href="/profile">
                       <UserCircle2 className="transition-all duration-500 ease-in-out shrink-0 size-5 group-data-[collapsible=icon]:size-7 group-data-[collapsible=icon]:delay-200" />
                       <span className="transition-all ease-out duration-300 whitespace-nowrap overflow-hidden opacity-100 max-w-[100px] delay-150 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:max-w-0 group-data-[collapsible=icon]:delay-0 text-xs">Perfil</span>
                     </Link>
                  </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Config">
                     <Link href="/settings">
                       <Settings className="transition-all duration-500 ease-in-out shrink-0 size-5 group-data-[collapsible=icon]:size-7 group-data-[collapsible=icon]:delay-200" />
                       <span className="transition-all ease-out duration-300 whitespace-nowrap overflow-hidden opacity-100 max-w-[100px] delay-150 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:max-w-0 group-data-[collapsible=icon]:delay-0 text-xs">Config</span>
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
