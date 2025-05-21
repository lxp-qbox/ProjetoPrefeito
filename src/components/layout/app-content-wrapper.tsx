
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from "@/hooks/use-auth";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { Toaster } from "@/components/ui/toaster";
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
  Gamepad2, // Changed from TicketIcon for Jogos
  MessageSquare, 
  UserCircle2, 
  Settings, 
  LayoutDashboard,
  Crown,
  LogOut,
  Ticket as TicketIcon // Renamed import to avoid conflict
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { UserProfile } from "@/types";
import { db, doc, getDoc, collection, query, where, getDocs, Timestamp } from "@/lib/firebase";
import { initialModuleStatuses, type SiteModule, type UserRole as AdminUserRole, type MinimumAccessLevel } from '@/app/admin/maintenance/offline/page'; // Exported types
import { Badge } from "@/components/ui/badge"; // Added Badge import

interface SidebarNavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  href?: string;
  action?: () => void;
  adminOnly?: boolean;
  new?: boolean;
}

interface SidebarFooterItem extends SidebarNavItem {
  separatorAbove?: boolean;
}


// Define MainAppLayout as an internal component
const MainAppLayout = ({ 
  children, 
  currentUser, 
  maintenanceRules 
}: { 
  children: React.ReactNode, 
  currentUser: UserProfile | null,
  maintenanceRules: SiteModule[] 
}) => {
  const { isMobile, state: desktopSidebarState, setOpen: setDesktopSidebarOpen } = useSidebar();
  const pathname = usePathname();
  const { logout } = useAuth(); // Get logout from useAuth
  const [hasUnreadMessages, setHasUnreadMessages] = useState(true); // Placeholder

  const handleLogout = async () => {
    await logout();
    // Router will be available if MainAppLayout is rendered inside a component with router context
    // For now, this relies on AuthContext handling redirection after logout
  };

  useEffect(() => {
    if (pathname === "/messages") {
      setHasUnreadMessages(false);
    }
  }, [pathname]);

  const mainSidebarNavItems: SidebarNavItem[] = [
    { id: 'home', label: 'Início', icon: Home, href: '/' },
    { id: 'hosts', label: 'Hosts', icon: Users, href: '/hosts' },
    { id: 'games', label: 'Jogos', icon: Gamepad2, href: '/bingo' }, // Changed to /bingo
    { id: 'messages', label: 'Mensagem', icon: MessageSquare, href: '/messages' },
  ];

  const sidebarFooterItems: SidebarFooterItem[] = [];
  let hasAdminItems = false;

  if (currentUser?.adminLevel) {
    // BINGO - admin only
    sidebarFooterItems.push({
      id: 'bingoAdmin',
      label: 'Bingo Admin',
      icon: TicketIcon,
      href: '/admin/bingo-admin',
      adminOnly: true,
      separatorAbove: true, 
    });
    // PAINEL - admin only
    sidebarFooterItems.push({
      id: 'adminPanel',
      label: 'Painel Admin',
      icon: LayoutDashboard,
      href: '/admin',
      adminOnly: true,
      separatorAbove: true, 
    });
    hasAdminItems = true;
  }

  // PERFIL - general
  sidebarFooterItems.push({
    id: 'profile',
    label: 'Perfil',
    icon: UserCircle2,
    href: '/profile',
    separatorAbove: hasAdminItems, 
  });
  
  // SAIR - general
  sidebarFooterItems.push({
    id: 'logout',
    label: 'Sair',
    icon: LogOut,
    action: handleLogout,
    separatorAbove: false,
  });

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
      {/* Desktop Sidebar */}
      {!isMobile && (
         <Sidebar className="border-r" collapsible="icon"> {/* Use ShadCN Sidebar */}
           <SidebarHeader className="p-0">
             <div className={cn(
                "flex items-center border-b border-sidebar-border transition-all duration-500 ease-in-out",
                desktopSidebarState === 'collapsed' ? 'h-16 justify-center px-2' : 'h-16 px-4 justify-start'
             )}>
                <Crown className={cn(
                    "text-primary transition-all duration-500 ease-in-out",
                    desktopSidebarState === 'collapsed' ? 'size-7' : 'size-6'
                )} />
                <span className={cn(
                    "ml-2 text-lg font-semibold text-primary transition-all duration-500 ease-in-out whitespace-nowrap overflow-hidden",
                    desktopSidebarState === 'collapsed' ? 'opacity-0 max-w-0' : 'opacity-100 max-w-[150px]'
                )}>
                    The Presidential Agency
                </span>
             </div>
           </SidebarHeader>
           <SidebarContent className="flex flex-col flex-1 pt-2">
             <SidebarMenu className="items-center">
               {mainSidebarNavItems.map((item) => (
                 <SidebarMenuItem key={item.id} className="w-full">
                   <SidebarMenuButton 
                     asChild 
                     tooltip={item.label}
                     variant={pathname === item.href ? "secondary" : "ghost"}
                     isActive={pathname === item.href}
                   >
                     <Link href={item.href || '#'}>
                       <item.icon className={cn(
                         "transition-all duration-500 ease-in-out shrink-0",
                         desktopSidebarState === 'collapsed' ? "size-6" : "size-5"
                       )} />
                       <span className={cn(
                         "transition-all duration-500 ease-in-out whitespace-nowrap overflow-hidden",
                         desktopSidebarState === 'collapsed' ? 'opacity-0 max-w-0 delay-0' : 'opacity-100 max-w-[100px] delay-150'
                       )}>{item.label}</span>
                       {item.id === 'messages' && hasUnreadMessages && (
                         <span className={cn(
                            "absolute h-2 w-2 rounded-full bg-green-500 ring-1 ring-sidebar pointer-events-none",
                            desktopSidebarState === 'collapsed' ? 'top-3 right-3 h-2.5 w-2.5' : 'top-2 right-2'
                         )} />
                       )}
                     </Link>
                   </SidebarMenuButton>
                 </SidebarMenuItem>
               ))}
             </SidebarMenu>
             <div className="flex-grow" />
           </SidebarContent>
           <SidebarFooter className="p-2 border-t border-sidebar-border">
             <SidebarMenu className="items-center">
               {sidebarFooterItems.map((item) => (
                 (!item.adminOnly || (item.adminOnly && currentUser?.adminLevel)) && (
                   <React.Fragment key={item.id}>
                     {item.separatorAbove && <SidebarSeparator />}
                     <SidebarMenuItem className="w-full">
                       <SidebarMenuButton 
                         asChild={!!item.href}
                         onClick={item.action}
                         tooltip={item.label}
                         variant={pathname === item.href ? "secondary" : "ghost"}
                         isActive={pathname === item.href}
                       >
                         {item.href ? (
                           <Link href={item.href}>
                             <item.icon className={cn(
                               "transition-all duration-500 ease-in-out shrink-0",
                               desktopSidebarState === 'collapsed' ? "size-6" : "size-5"
                             )} />
                             <span className={cn(
                               "transition-all duration-500 ease-in-out whitespace-nowrap overflow-hidden",
                               desktopSidebarState === 'collapsed' ? 'opacity-0 max-w-0 delay-0' : 'opacity-100 max-w-[100px] delay-150'
                             )}>{item.label}</span>
                           </Link>
                         ) : (
                           <>
                             <item.icon className={cn(
                               "transition-all duration-500 ease-in-out shrink-0",
                               desktopSidebarState === 'collapsed' ? "size-6" : "size-5"
                             )} />
                             <span className={cn(
                               "transition-all duration-500 ease-in-out whitespace-nowrap overflow-hidden",
                               desktopSidebarState === 'collapsed' ? 'opacity-0 max-w-0 delay-0' : 'opacity-100 max-w-[100px] delay-150'
                             )}>{item.label}</span>
                           </>
                         )}
                       </SidebarMenuButton>
                     </SidebarMenuItem>
                   </React.Fragment>
                 )
               ))}
             </SidebarMenu>
           </SidebarFooter>
         </Sidebar>
      )}

      {/* Mobile Sidebar (Off-canvas) */}
      {isMobile && (
        <Sidebar side="left" collapsible="offcanvas">
          <SidebarHeader className="p-0">
             <div className="flex items-center h-16 px-4 border-b border-sidebar-border">
                <Crown className="size-6 text-primary" />
                <span className="ml-2 text-lg font-semibold text-primary">The Presidential Agency</span>
             </div>
          </SidebarHeader>
          <SidebarContent className="flex flex-col flex-1 pt-2">
             <SidebarMenu>
               {mainSidebarNavItems.map((item) => (
                 <SidebarMenuItem key={item.id}>
                   <SidebarMenuButton 
                     asChild 
                     variant={pathname === item.href ? "secondary" : "ghost"}
                     isActive={pathname === item.href}
                     onClick={() => setDesktopSidebarOpen(false)} // Close mobile menu on click
                   >
                     <Link href={item.href || '#'}>
                       <item.icon className="size-5" />
                       <span>{item.label}</span>
                        {item.id === 'messages' && hasUnreadMessages && (
                         <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-green-500 ring-1 ring-sidebar pointer-events-none" />
                       )}
                     </Link>
                   </SidebarMenuButton>
                 </SidebarMenuItem>
               ))}
             </SidebarMenu>
             <div className="flex-grow" />
           </SidebarContent>
           <SidebarFooter className="p-2 border-t border-sidebar-border">
             <SidebarMenu>
               {sidebarFooterItems.map((item) => (
                 (!item.adminOnly || (item.adminOnly && currentUser?.adminLevel)) && (
                    <React.Fragment key={item.id}>
                      {item.separatorAbove && <SidebarSeparator />}
                      <SidebarMenuItem>
                        <SidebarMenuButton 
                            asChild={!!item.href}
                            onClick={() => {
                                if(item.action) item.action();
                                setDesktopSidebarOpen(false); // Close mobile menu
                            }}
                            variant={pathname === item.href ? "secondary" : "ghost"}
                            isActive={pathname === item.href}
                        >
                        {item.href ? (
                           <Link href={item.href}>
                             <item.icon className="size-5" />
                             <span>{item.label}</span>
                           </Link>
                         ) : (
                           <>
                             <item.icon className="size-5" />
                             <span>{item.label}</span>
                           </>
                         )}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </React.Fragment>
                 )
               ))}
             </SidebarMenu>
           </SidebarFooter>
        </Sidebar>
      )}
      
      <SidebarInset className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className={cn(
          "flex-grow overflow-y-auto", // Ensure main content area can scroll
          (pathname === "/messages" || pathname.startsWith("/admin") || pathname === "/profile" || pathname === "/") ? "p-0" : "px-4 py-8",
          pathname === "/" ? "flex flex-col" : "" // For homepage's specific flex layout
        )}>
          {children}
        </main>
      </SidebarInset>
    </div>
  );
};


export default function AppContentWrapper({ children }: { children: ReactNode }) {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [maintenanceRules, setMaintenanceRules] = useState<SiteModule[]>(initialModuleStatuses);
  const [isLoadingRules, setIsLoadingRules] = useState(true);
  const [isReadyForContent, setIsReadyForContent] = useState(false);

  const roleHierarchy: Record<AdminUserRole, number> = {
    player: 0,
    host: 1,
    suporte: 2,
    admin: 3,
    master: 4,
  };
  
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


  const standaloneAuthPaths = ['/login', '/signup', '/forgot-password'];
  const isOnboardingPage = pathname.startsWith('/onboarding');
  const isMaintenancePage = pathname === '/maintenance';
  const isAuthPage = standaloneAuthPaths.includes(pathname);
  
  const showAppLayout = !(isAuthPage || isOnboardingPage);


  useEffect(() => {
    if (authLoading || isLoadingRules) {
      setIsReadyForContent(false);
      return;
    }
  
    if (isAuthPage || isOnboardingPage || isMaintenancePage) {
      if (currentUser && isAuthPage && !isOnboardingPage) {
         if (!currentUser.agreedToTermsAt) {
          router.replace("/onboarding/terms");
        } else if (!currentUser.role) {
          router.replace("/onboarding/role-selection");
        } else if (!currentUser.birthDate || !currentUser.gender || !currentUser.country || !currentUser.phoneNumber) {
          router.replace("/onboarding/age-verification");
        } else if (currentUser.hasCompletedOnboarding === false || typeof currentUser.hasCompletedOnboarding === 'undefined') {
          if (currentUser.role === 'host') {
            router.replace("/onboarding/kako-id-input");
          } else if (currentUser.role === 'player') {
            router.replace("/onboarding/kako-account-check");
          } else {
            router.replace("/profile");
          }
        } else {
          router.replace("/profile");
        }
      }
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
    // Note: '/settings' was removed, no rule needed for it now.
  
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
        const requiredLevel = roleHierarchy[moduleRule.minimumAccessLevelWhenOffline as Exclude<MinimumAccessLevel, 'nobody' | 'player'>];
        userHasAccess = effectiveUserLevel >= requiredLevel;
      }
      
      if (!userHasAccess && pathname !== "/maintenance") {
        router.replace('/maintenance');
        setIsReadyForContent(false);
        return;
      }
    }
    
    setIsReadyForContent(true);
  
  }, [authLoading, isLoadingRules, currentUser, pathname, router, maintenanceRules, isAuthPage, isOnboardingPage, isMaintenancePage]);


  if ((authLoading || isLoadingRules) && !(isAuthPage || isOnboardingPage || isMaintenancePage)) {
    return (
      <div className="flex justify-center items-center h-screen w-screen fixed inset-0 bg-background z-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!showAppLayout) {
    return (
      <>
        {children}
        <Toaster />
      </>
    );
  }

  if (!isReadyForContent && showAppLayout) {
     return (
      <div className="flex justify-center items-center h-screen w-screen fixed inset-0 bg-background z-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={false}> {/* defaultOpen controls mobile off-canvas AND desktop initial collapsed state */}
      <MainAppLayout currentUser={currentUser} maintenanceRules={maintenanceRules}>
        {children}
      </MainAppLayout>
      <Toaster />
    </SidebarProvider>
  );
}
