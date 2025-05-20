
"use client";

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/layout/header';
import { SidebarProvider, Sidebar, SidebarInset, SidebarHeader, SidebarContent, SidebarFooter, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarTrigger } from '@/components/ui/sidebar';
import { Home, Users, TicketIcon, MessageSquare, UserCircle2, Settings, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function AppContentWrapper({ children }: { children: ReactNode }) {
  const { currentUser, loading: authLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const [hasUnreadMessages, setHasUnreadMessages] = useState(true); // Demo state

  const standaloneAuthPaths = ['/login', '/signup', '/forgot-password'];
  const isStandaloneAuthPage = standaloneAuthPaths.includes(pathname);
  const isOnboardingPage = pathname.startsWith('/onboarding');

  const isTrulyStandalonePage = isStandaloneAuthPage || isOnboardingPage;

  useEffect(() => {
    if (!authLoading && !currentUser && !isTrulyStandalonePage) {
      router.replace("/login");
    }
  }, [authLoading, currentUser, isTrulyStandalonePage, pathname, router]);

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
    // If you want the dot to potentially reappear when navigating away from /messages
    // (e.g., simulating new messages arriving while user is elsewhere),
    // you might add an else condition here or use a more complex global state.
    // For now, once /messages is visited, the dot stays off for the session.
  }, [pathname]);

  if (authLoading && !isTrulyStandalonePage) {
    return (
      <div className="flex justify-center items-center h-screen w-screen fixed inset-0 bg-background z-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isTrulyStandalonePage) {
    return (
      <>
        {children}
        <Toaster />
      </>
    );
  }

  if (!currentUser && !authLoading) {
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
                  <span className="transition-all duration-300 ease-out delay-150 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:max-w-0 group-data-[collapsible=icon]:delay-0 group-data-[collapsible=icon]:duration-200 whitespace-nowrap overflow-hidden opacity-100 max-w-[100px]">Início</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Hosts">
                <Link href="/hosts">
                  <Users className="transition-all duration-500 ease-in-out shrink-0 size-5 group-data-[collapsible=icon]:size-7 group-data-[collapsible=icon]:delay-200" />
                  <span className="transition-all duration-300 ease-out delay-150 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:max-w-0 group-data-[collapsible=icon]:delay-0 group-data-[collapsible=icon]:duration-200 whitespace-nowrap overflow-hidden opacity-100 max-w-[100px]">Hosts</span>
                  </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Jogos">
                <Link href="/games">
                  <TicketIcon className="transition-all duration-500 ease-in-out shrink-0 size-5 group-data-[collapsible=icon]:size-7 group-data-[collapsible=icon]:delay-200" />
                  <span className="transition-all duration-300 ease-out delay-150 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:max-w-0 group-data-[collapsible=icon]:delay-0 group-data-[collapsible=icon]:duration-200 whitespace-nowrap overflow-hidden opacity-100 max-w-[100px]">Jogos</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem className="relative">
              <SidebarMenuButton asChild tooltip="Mensagens">
                <Link href="/messages">
                  <MessageSquare className="transition-all duration-500 ease-in-out shrink-0 size-5 group-data-[collapsible=icon]:size-7 group-data-[collapsible=icon]:delay-200" />
                  <span className="transition-all duration-300 ease-out delay-150 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:max-w-0 group-data-[collapsible=icon]:delay-0 group-data-[collapsible=icon]:duration-200 whitespace-nowrap overflow-hidden opacity-100 max-w-[100px]">Mensagem</span>
                </Link>
              </SidebarMenuButton>
              {hasUnreadMessages && (
                <span className="absolute top-2.5 right-2.5 h-2.5 w-2.5 rounded-full bg-green-500 ring-1 ring-sidebar group-data-[collapsible=icon]:top-2 group-data-[collapsible=icon]:right-2 pointer-events-none" />
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
                        <span className="transition-all duration-300 ease-out delay-150 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:max-w-0 group-data-[collapsible=icon]:delay-0 group-data-[collapsible=icon]:duration-200 whitespace-nowrap overflow-hidden opacity-100 max-w-[100px]">Painel</span>
                      </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Perfil">
                     <Link href="/profile">
                       <UserCircle2 className="transition-all duration-500 ease-in-out shrink-0 size-5 group-data-[collapsible=icon]:size-7 group-data-[collapsible=icon]:delay-200" />
                       <span className="transition-all duration-300 ease-out delay-150 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:max-w-0 group-data-[collapsible=icon]:delay-0 group-data-[collapsible=icon]:duration-200 whitespace-nowrap overflow-hidden opacity-100 max-w-[100px]">Perfil</span>
                     </Link>
                  </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Configurações">
                     <Link href="/settings">
                       <Settings className="transition-all duration-500 ease-in-out shrink-0 size-5 group-data-[collapsible=icon]:size-7 group-data-[collapsible=icon]:delay-200" />
                       <span className="transition-all duration-300 ease-out delay-150 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:max-w-0 group-data-[collapsible=icon]:delay-0 group-data-[collapsible=icon]:duration-200 whitespace-nowrap overflow-hidden opacity-100 max-w-[100px]">Config</span>
                     </Link>
                  </SidebarMenuButton>
              </SidebarMenuItem>
           </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <Header />
        <main className={cn("flex-grow", pathname === "/messages" ? "p-0" : "px-4 py-8")}>
          {children}
        </main>
      </SidebarInset>
      <Toaster />
    </SidebarProvider>
  );
}
