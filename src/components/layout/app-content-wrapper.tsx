
"use client";

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/layout/header';
import { SidebarProvider, Sidebar, SidebarInset, SidebarHeader, SidebarContent, SidebarFooter, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarTrigger } from '@/components/ui/sidebar';
import { Home, Users, TicketIcon, MessageSquare, UserCircle2, Settings, LayoutDashboard, ServerOff } from 'lucide-react'; // Added ServerOff
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { UserProfile } from '@/types';

// Import maintenance rules and types for demo
import { initialModuleStatuses, type SiteModule, type MinimumAccessLevel, type UserRole as AdminUserRole } from '@/app/admin/maintenance/offline/page';


// Simplified role hierarchy for maintenance checks
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
  const [maintenanceRules, setMaintenanceRules] = useState<SiteModule[]>(initialModuleStatuses); // Using initial for demo
  const [isLoadingRules, setIsLoadingRules] = useState(false); // Simulate no loading for demo with initialModuleStatuses


  const standaloneAuthPaths = ['/login', '/signup', '/forgot-password', '/maintenance'];
  const isStandaloneAuthPage = standaloneAuthPaths.includes(pathname) || pathname.startsWith('/onboarding');

  useEffect(() => {
    // This effect handles redirection based on authentication and maintenance rules.
    if (authLoading || isLoadingRules) {
      return; // Wait until auth and rules are loaded
    }

    // If user is not logged in and not on a public auth page, redirect to login
    if (!currentUser && !isStandaloneAuthPage) {
      router.replace("/login");
      return;
    }

    // If user is logged in, check maintenance rules
    if (currentUser && maintenanceRules.length > 0 && pathname !== '/maintenance') {
      let currentModuleId = '';
      if (pathname === '/') currentModuleId = 'home';
      else if (pathname.startsWith('/hosts')) currentModuleId = 'hosts';
      else if (pathname.startsWith('/games') || pathname.startsWith('/bingo')) currentModuleId = 'games';
      else if (pathname.startsWith('/admin')) currentModuleId = 'adminPanel';
      else if (pathname === '/profile') currentModuleId = 'profile';
      else if (pathname === '/settings') currentModuleId = 'settings';
      // Add other mappings as needed

      const moduleRule = maintenanceRules.find(rule => rule.id === currentModuleId);

      if (moduleRule && moduleRule.globallyOffline) {
        let userHasAccess = false;
        const userLevel = roleHierarchy[currentUser.role as AdminUserRole] ?? -1; // Default to -1 if role undefined
        const adminLevelVal = currentUser.adminLevel ? roleHierarchy[currentUser.adminLevel as AdminUserRole] : -1;
        const effectiveUserLevel = Math.max(userLevel, adminLevelVal);


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
          case 'player': // Means all authenticated roles
            userHasAccess = true;
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

  }, [authLoading, currentUser, isStandaloneAuthPage, pathname, router, maintenanceRules, isLoadingRules]);


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


  if (authLoading || (!isStandaloneAuthPage && isLoadingRules)) {
    return (
      <div className="flex justify-center items-center h-screen w-screen fixed inset-0 bg-background z-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }


  if (isStandaloneAuthPage && pathname !== '/maintenance') { // Allow maintenance page to render if needed
    return (
      <>
        {children}
        <Toaster />
      </>
    );
  }
  // If we are on maintenance page, render it directly
  if (pathname === '/maintenance') {
     return (
      <>
        {children}
        <Toaster />
      </>
    );
  }


  if (!currentUser && !authLoading && !isStandaloneAuthPage) {
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
                  <Home className="transition-all duration-500 ease-in-out shrink-0 size-5 group-data-[collapsible=icon]:size-7 group-data-[collapsible=icon]:delay-300" />
                  <span className="transition-all ease-out duration-200 delay-250 group-data-[collapsible=icon]:delay-0 group-data-[collapsible=icon]:duration-200 whitespace-nowrap overflow-hidden opacity-100 max-w-[100px] group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:max-w-0 text-xs">Início</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Hosts">
                <Link href="/hosts">
                  <Users className="transition-all duration-500 ease-in-out shrink-0 size-5 group-data-[collapsible=icon]:size-7 group-data-[collapsible=icon]:delay-300" />
                  <span className="transition-all ease-out duration-200 delay-250 group-data-[collapsible=icon]:delay-0 group-data-[collapsible=icon]:duration-200 whitespace-nowrap overflow-hidden opacity-100 max-w-[100px] group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:max-w-0 text-xs">Hosts</span>
                  </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Jogos">
                <Link href="/games"> 
                  <TicketIcon className="transition-all duration-500 ease-in-out shrink-0 size-5 group-data-[collapsible=icon]:size-7 group-data-[collapsible=icon]:delay-300" />
                  <span className="transition-all ease-out duration-200 delay-250 group-data-[collapsible=icon]:delay-0 group-data-[collapsible=icon]:duration-200 whitespace-nowrap overflow-hidden opacity-100 max-w-[100px] group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:max-w-0 text-xs">Jogos</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem className="relative group/menu-item"> 
              <SidebarMenuButton asChild tooltip="Mensagem">
                <Link href="/messages">
                  <MessageSquare className="transition-all duration-500 ease-in-out shrink-0 size-5 group-data-[collapsible=icon]:size-7 group-data-[collapsible=icon]:delay-300" />
                  <span className="transition-all ease-out duration-200 delay-250 group-data-[collapsible=icon]:delay-0 group-data-[collapsible=icon]:duration-200 whitespace-nowrap overflow-hidden opacity-100 max-w-[100px] group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:max-w-0 text-xs">Mensagem</span>
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
                        <LayoutDashboard className="transition-all duration-500 ease-in-out shrink-0 size-5 group-data-[collapsible=icon]:size-7 group-data-[collapsible=icon]:delay-300" />
                        <span className="transition-all ease-out duration-200 delay-250 group-data-[collapsible=icon]:delay-0 group-data-[collapsible=icon]:duration-200 whitespace-nowrap overflow-hidden opacity-100 max-w-[100px] group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:max-w-0 text-xs">Painel</span>
                      </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Perfil">
                     <Link href="/profile">
                       <UserCircle2 className="transition-all duration-500 ease-in-out shrink-0 size-5 group-data-[collapsible=icon]:size-7 group-data-[collapsible=icon]:delay-300" />
                       <span className="transition-all ease-out duration-200 delay-250 group-data-[collapsible=icon]:delay-0 group-data-[collapsible=icon]:duration-200 whitespace-nowrap overflow-hidden opacity-100 max-w-[100px] group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:max-w-0 text-xs">Perfil</span>
                     </Link>
                  </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Config">
                     <Link href="/settings">
                       <Settings className="transition-all duration-500 ease-in-out shrink-0 size-5 group-data-[collapsible=icon]:size-7 group-data-[collapsible=icon]:delay-300" />
                       <span className="transition-all ease-out duration-200 delay-250 group-data-[collapsible=icon]:delay-0 group-data-[collapsible=icon]:duration-200 whitespace-nowrap overflow-hidden opacity-100 max-w-[100px] group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:max-w-0 text-xs">Config</span>
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
          pathname === "/" ? "flex flex-col" : ""
        )}>
          {children}
        </main>
      </SidebarInset>
      <Toaster />
    </SidebarProvider>
  );
}

    