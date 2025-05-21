
"use client";

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/layout/header';
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarFooter, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { Home, Users, TicketIcon, MessageSquare, UserCircle2, Settings, LayoutDashboard, ServerOff } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { UserProfile } from '@/types';
import { db, doc, getDoc } from "@/lib/firebase";

// Import maintenance rules and types from the admin page
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


  const standaloneAuthPaths = ['/login', '/signup', '/forgot-password', '/maintenance'];
  const isStandalonePage = standaloneAuthPaths.includes(pathname) || pathname.startsWith('/onboarding');


  useEffect(() => {
    const fetchMaintenanceSettings = async () => {
      setIsLoadingRules(true);
      try {
        const maintenanceRulesDocRef = doc(db, "app_settings", "maintenance_rules");
        const docSnap = await getDoc(maintenanceRulesDocRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const fetchedRulesData = (data.rules as Partial<Omit<SiteModule, 'icon'>>[] || []);
          
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
          }).filter(Boolean) as SiteModule[]; // Ensure all items are valid SiteModule

          setMaintenanceRules(rehydratedRules.length > 0 ? rehydratedRules : initialModuleStatuses);

        } else {
          console.log("Nenhuma configuração de manutenção encontrada em Firestore, usando padrões.");
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
    if (authLoading || isLoadingRules) {
      return;
    }

    if (!currentUser && !isStandalonePage) {
      router.replace("/login");
      return;
    }
    
    if (currentUser && maintenanceRules.length > 0 && !isStandalonePage) {
      let currentModuleId = '';
      if (pathname === '/' || pathname === '') currentModuleId = 'home';
      else if (pathname.startsWith('/hosts')) currentModuleId = 'hosts';
      else if (pathname.startsWith('/games') || pathname.startsWith('/bingo')) currentModuleId = 'games';
      else if (pathname.startsWith('/admin')) currentModuleId = 'adminPanel';
      else if (pathname === '/profile') currentModuleId = 'profile';
      else if (pathname === '/settings') currentModuleId = 'settings';
      // Add /messages if it's a module to be controlled
      else if (pathname === '/messages') currentModuleId = 'messages'; // Assuming 'messages' is a module ID

      const moduleRule = maintenanceRules.find(rule => rule.id === currentModuleId);

      if (moduleRule && moduleRule.globallyOffline) {
        let userHasAccess = false;
        const userBaseLevel = currentUser.role ? roleHierarchy[currentUser.role as AdminUserRole] : -1;
        const userAdminLevel = currentUser.adminLevel ? roleHierarchy[currentUser.adminLevel as AdminUserRole] : -1;
        const effectiveUserLevel = Math.max(userBaseLevel, userAdminLevel);

        switch (moduleRule.minimumAccessLevelWhenOffline) {
          case 'nobody':
            userHasAccess = false;
            break;
          case 'master':
            userHasAccess = effectiveUserLevel >= roleHierarchy.master;
            break;
          case 'admin':
            userHasAccess = effectiveUserLevel >= roleHierarchy.admin;
            break;
          case 'suporte':
            userHasAccess = effectiveUserLevel >= roleHierarchy.suporte;
            break;
          case 'host':
            userHasAccess = effectiveUserLevel >= roleHierarchy.host;
            break;
          case 'player': 
             userHasAccess = effectiveUserLevel === roleHierarchy.player;
            break;
          default:
            userHasAccess = false;
        }
        
        if (!userHasAccess) {
          router.replace('/maintenance');
          return; 
        }
      }
    }

  }, [authLoading, currentUser, isStandalonePage, pathname, router, maintenanceRules, isLoadingRules]);


  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => console.log('Service Worker registered with scope:', registration.scope))
        .catch((error) => console.error('Service Worker registration failed:', error));
    }
  }, []);

  useEffect(() => {
    if (pathname === "/messages") {
      setHasUnreadMessages(false);
    }
  }, [pathname]);


  if (authLoading || isLoadingRules) {
    return (
      <div className="flex justify-center items-center h-screen w-screen fixed inset-0 bg-background z-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }


  if (isStandalonePage) { 
    return (
      <>
        {children}
        <Toaster />
      </>
    );
  }
 
  if (!currentUser && !authLoading && !isStandalonePage) {
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
                  <span className="transition-all duration-300 ease-out whitespace-nowrap overflow-hidden opacity-100 max-w-[100px] group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:max-w-0 group-data-[collapsible=icon]:delay-150 group-data-[collapsible=icon]:duration-0 text-xs">Início</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Hosts">
                <Link href="/hosts">
                  <Users className="transition-all duration-500 ease-in-out shrink-0 size-5 group-data-[collapsible=icon]:size-7 group-data-[collapsible=icon]:delay-200" />
                  <span className="transition-all duration-300 ease-out whitespace-nowrap overflow-hidden opacity-100 max-w-[100px] group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:max-w-0 group-data-[collapsible=icon]:delay-150 group-data-[collapsible=icon]:duration-0 text-xs">Hosts</span>
                  </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Jogos">
                <Link href="/bingo"> 
                  <TicketIcon className="transition-all duration-500 ease-in-out shrink-0 size-5 group-data-[collapsible=icon]:size-7 group-data-[collapsible=icon]:delay-200" />
                  <span className="transition-all duration-300 ease-out whitespace-nowrap overflow-hidden opacity-100 max-w-[100px] group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:max-w-0 group-data-[collapsible=icon]:delay-150 group-data-[collapsible=icon]:duration-0 text-xs">Jogos</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem className="relative group/menu-item"> 
              <SidebarMenuButton asChild tooltip="Mensagem">
                <Link href="/messages">
                  <MessageSquare className="transition-all duration-500 ease-in-out shrink-0 size-5 group-data-[collapsible=icon]:size-7 group-data-[collapsible=icon]:delay-200" />
                  <span className="transition-all duration-300 ease-out whitespace-nowrap overflow-hidden opacity-100 max-w-[100px] group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:max-w-0 group-data-[collapsible=icon]:delay-150 group-data-[collapsible=icon]:duration-0 text-xs">Mensagem</span>
                </Link>
              </SidebarMenuButton>
              {hasUnreadMessages && (
                 <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-green-500 ring-1 ring-sidebar pointer-events-none group-data-[state=expanded]:group-hover/menu-item:ring-sidebar-accent group-data-[collapsible=icon]:top-1 group-data-[collapsible=icon]:right-1 group-data-[collapsible=icon]:h-2.5 group-data-[collapsible=icon]:w-2.5" />
              )}
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
                        <span className="transition-all duration-300 ease-out whitespace-nowrap overflow-hidden opacity-100 max-w-[100px] group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:max-w-0 group-data-[collapsible=icon]:delay-150 group-data-[collapsible=icon]:duration-0 text-xs">Painel</span>
                      </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Perfil">
                     <Link href="/profile">
                       <UserCircle2 className="transition-all duration-500 ease-in-out shrink-0 size-5 group-data-[collapsible=icon]:size-7 group-data-[collapsible=icon]:delay-200" />
                       <span className="transition-all duration-300 ease-out whitespace-nowrap overflow-hidden opacity-100 max-w-[100px] group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:max-w-0 group-data-[collapsible=icon]:delay-150 group-data-[collapsible=icon]:duration-0 text-xs">Perfil</span>
                     </Link>
                  </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Config">
                     <Link href="/settings">
                       <Settings className="transition-all duration-500 ease-in-out shrink-0 size-5 group-data-[collapsible=icon]:size-7 group-data-[collapsible=icon]:delay-200" />
                       <span className="transition-all duration-300 ease-out whitespace-nowrap overflow-hidden opacity-100 max-w-[100px] group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:max-w-0 group-data-[collapsible=icon]:delay-150 group-data-[collapsible=icon]:duration-0 text-xs">Config</span>
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
          (pathname === "/messages" || pathname.startsWith("/admin")) ? "p-0" : "px-4 py-8",
          pathname === "/" ? "flex flex-col" : "" // Ensure homepage main is a flex column
        )}>
          {children}
        </main>
      </SidebarInset>
      <Toaster />
    </SidebarProvider>
  );
}
