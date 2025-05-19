import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/auth-context';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { SidebarProvider, Sidebar, SidebarInset, SidebarHeader, SidebarContent, SidebarFooter, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { Home, Folders, Sparkles, Shapes, Plus, MoreHorizontal, Crown } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button'; // Added Button import

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'The Presidential Agency',
  description: 'Join exciting bingo games and manage your profile with The Presidential Agency.',
  icons: {
    icon: '/favicon.ico', // Ensure you have a favicon.ico in your public folder
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} font-sans antialiased flex flex-col min-h-screen bg-background`}>
        <AuthProvider>
          <SidebarProvider defaultOpen={true}>
            <Sidebar collapsible="icon" className="border-r">
              <SidebarHeader className="p-4">
                <Link href="/" className="flex items-center gap-2 text-xl font-semibold text-primary hover:opacity-80 transition-opacity">
                  <Crown className="w-7 h-7" />
                  <span className="group-data-[collapsible=icon]:hidden">Agency</span>
                </Link>
              </SidebarHeader>
              <SidebarContent className="flex flex-col flex-1">
                <SidebarMenu> {/* Main menu items */}
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Início">
                      <Link href="/"><Home /> <span>Início</span></Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Projetos">
                      <Link href="/projects"><Folders /> <span>Projetos</span></Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Suíte IA">
                      <Link href="/ai-suite"><Sparkles /> <span>Suíte IA</span></Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Estoque">
                      <Link href="/stock"><Shapes /> <span>Estoque</span></Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
                
                {/* Spacer to push Novo and Footer down if content is short */}
                <div className="flex-grow" /> 

                {/* Section for the Plus button */}
                <SidebarMenu className="p-2"> 
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      asChild 
                      tooltip="Novo" 
                      variant="outline"
                      className="justify-center"
                    >
                      <Link href="/create">
                        <Plus />
                        <span>Novo</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarContent>
              <SidebarFooter className="p-2 border-t border-sidebar-border">
                 <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild tooltip="Mais">
                           <Link href="/more">
                             <MoreHorizontal /> 
                             <span>Mais</span>
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
          </SidebarProvider>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
