
"use client";

import type { ReactNode } from 'react';
import { useAuth } from '@/hooks/use-auth';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { SidebarProvider, Sidebar, SidebarInset, SidebarHeader, SidebarContent, SidebarFooter, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarTrigger } from '@/components/ui/sidebar';
import { Home, Users, TicketIcon, MessageSquare, UserCircle2, Settings } from 'lucide-react';
import Link from 'next/link';

export default function AppContentWrapper({ children }: { children: ReactNode }) {
  const { loading: authLoading } = useAuth();

  if (authLoading) {
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
                  <Home className="transition-all ease-in-out duration-200 shrink-0 size-5 group-data-[collapsible=icon]:size-7 group-data-[collapsible=icon]:delay-300" />
                  <span className="whitespace-nowrap overflow-hidden opacity-100 max-w-[100px] transition-all ease-out duration-200 delay-250 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:max-w-0 group-data-[collapsible=icon]:delay-0 group-data-[collapsible=icon]:duration-200">Início</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Hosts">
                <Link href="/hosts">
                  <Users className="transition-all ease-in-out duration-200 shrink-0 size-5 group-data-[collapsible=icon]:size-7 group-data-[collapsible=icon]:delay-300" />
                  <span className="whitespace-nowrap overflow-hidden opacity-100 max-w-[100px] transition-all ease-out duration-200 delay-250 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:max-w-0 group-data-[collapsible=icon]:delay-0 group-data-[collapsible=icon]:duration-200">Hosts</span>
                  </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Jogos">
                <Link href="/games">
                  <TicketIcon className="transition-all ease-in-out duration-200 shrink-0 size-5 group-data-[collapsible=icon]:size-7 group-data-[collapsible=icon]:delay-300" />
                  <span className="whitespace-nowrap overflow-hidden opacity-100 max-w-[100px] transition-all ease-out duration-200 delay-250 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:max-w-0 group-data-[collapsible=icon]:delay-0 group-data-[collapsible=icon]:duration-200">Jogos</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Mensagem">
                <Link href="/messages">
                  <MessageSquare className="transition-all ease-in-out duration-200 shrink-0 size-5 group-data-[collapsible=icon]:size-7 group-data-[collapsible=icon]:delay-300" />
                  <span className="whitespace-nowrap overflow-hidden opacity-100 max-w-[100px] transition-all ease-out duration-200 delay-250 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:max-w-0 group-data-[collapsible=icon]:delay-0 group-data-[collapsible=icon]:duration-200">Mensagem</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>

          <div className="flex-grow" />

        </SidebarContent>
        <SidebarFooter className="p-2 border-t border-sidebar-border">
           <SidebarMenu className="items-center">
              <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Perfil">
                     <Link href="/profile">
                       <UserCircle2 className="transition-all ease-in-out duration-200 shrink-0 size-5 group-data-[collapsible=icon]:size-7 group-data-[collapsible=icon]:delay-300" />
                       <span className="whitespace-nowrap overflow-hidden opacity-100 max-w-[100px] transition-all ease-out duration-200 delay-250 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:max-w-0 group-data-[collapsible=icon]:delay-0 group-data-[collapsible=icon]:duration-200">Perfil</span>
                     </Link>
                  </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Config">
                     <Link href="/settings">
                       <Settings className="transition-all ease-in-out duration-200 shrink-0 size-5 group-data-[collapsible=icon]:size-7 group-data-[collapsible=icon]:delay-300" />
                       <span className="whitespace-nowrap overflow-hidden opacity-100 max-w-[100px] transition-all ease-out duration-200 delay-250 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:max-w-0 group-data-[collapsible=icon]:delay-0 group-data-[collapsible=icon]:duration-200">Config</span>
                     </Link>
                  </SidebarMenuButton>
              </SidebarMenuItem>
           </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          {children}
        </main>
        <Footer />
      </SidebarInset>
      <Toaster />
    </SidebarProvider>
  );
}
