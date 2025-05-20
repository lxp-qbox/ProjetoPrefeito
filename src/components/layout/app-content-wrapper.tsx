
"use client";

import type { ReactNode } from 'react';
import { useAuth } from '@/hooks/use-auth';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { SidebarProvider, Sidebar, SidebarInset, SidebarHeader, SidebarContent, SidebarFooter, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { Home, Users, LayoutGrid, LogIn, FileText, Crown } from 'lucide-react';
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
    <SidebarProvider defaultOpen={true}>
      <Sidebar collapsible="icon" className="border-r">
        <SidebarHeader className="p-4 flex items-center justify-center group-data-[collapsible=icon]:justify-center group-data-[state=expanded]:justify-start">
          <Link href="/" className="flex items-center gap-2 text-xl font-semibold text-primary hover:opacity-80 transition-opacity">
            <Crown className="w-7 h-7 shrink-0" />
            <span className="group-data-[collapsible=icon]:hidden">Agency</span>
          </Link>
        </SidebarHeader>
        <SidebarContent className="flex flex-col flex-1">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Início">
                <Link href="/"><Home /> <span className="group-data-[collapsible=icon]:hidden">Início</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Hosts">
                <Link href="/hosts"><Users /> <span className="group-data-[collapsible=icon]:hidden">Hosts</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Bingo">
                <Link href="/bingo"><LayoutGrid /> <span className="group-data-[collapsible=icon]:hidden">Bingo</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Login">
                <Link href="/login"><LogIn /> <span className="group-data-[collapsible=icon]:hidden">Login</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          
          <div className="flex-grow" /> 

        </SidebarContent>
        <SidebarFooter className="p-2 border-t border-sidebar-border">
           <SidebarMenu>
              <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Mais">
                     <Link href="/more">
                       <FileText /> 
                       <span className="group-data-[collapsible=icon]:hidden">Mais</span>
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
