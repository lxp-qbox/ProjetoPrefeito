
"use client";

import type { ReactNode } from 'react';
import { useAuth } from '@/hooks/use-auth';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { SidebarProvider, Sidebar, SidebarInset, SidebarHeader, SidebarContent, SidebarFooter, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarTrigger } from '@/components/ui/sidebar';
import { Home, Users, LayoutGrid, LogIn, FileText } from 'lucide-react';
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
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Início">
                <Link href="/">
                  <Home className="transition-all duration-500 ease-in-out shrink-0 size-5 group-data-[collapsible=icon]:size-7" /> 
                  <span className="transition-all delay-150 duration-300 ease-out whitespace-nowrap overflow-hidden opacity-100 max-w-[100px] group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:max-w-0 group-data-[collapsible=icon]:delay-0">Início</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Hosts">
                <Link href="/hosts">
                  <Users className="transition-all duration-500 ease-in-out shrink-0 size-5 group-data-[collapsible=icon]:size-7" /> 
                  <span className="transition-all delay-150 duration-300 ease-out whitespace-nowrap overflow-hidden opacity-100 max-w-[100px] group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:max-w-0 group-data-[collapsible=icon]:delay-0">Hosts</span>
                  </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Bingo">
                <Link href="/bingo">
                  <LayoutGrid className="transition-all duration-500 ease-in-out shrink-0 size-5 group-data-[collapsible=icon]:size-7" /> 
                  <span className="transition-all delay-150 duration-300 ease-out whitespace-nowrap overflow-hidden opacity-100 max-w-[100px] group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:max-w-0 group-data-[collapsible=icon]:delay-0">Bingo</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Login">
                <Link href="/login">
                  <LogIn className="transition-all duration-500 ease-in-out shrink-0 size-5 group-data-[collapsible=icon]:size-7" /> 
                  <span className="transition-all delay-150 duration-300 ease-out whitespace-nowrap overflow-hidden opacity-100 max-w-[100px] group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:max-w-0 group-data-[collapsible=icon]:delay-0">Login</span>
                </Link>
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
                       <FileText className="transition-all duration-500 ease-in-out shrink-0 size-5 group-data-[collapsible=icon]:size-7" /> 
                       <span className="transition-all delay-150 duration-300 ease-out whitespace-nowrap overflow-hidden opacity-100 max-w-[100px] group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:max-w-0 group-data-[collapsible=icon]:delay-0">Mais</span>
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

