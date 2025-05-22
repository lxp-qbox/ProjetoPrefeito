
"use client";

import Link from "next/link";
import { Crown, LogIn, LogOut, UserCircle2, Gamepad2, LifeBuoy, TicketIcon, Maximize, Minimize, Bell, Search as SearchIcon, Diamond } from "lucide-react"; // Added Diamond
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import React, { useState, useEffect } from "react"; // Added React for Fragment
import { Input } from "@/components/ui/input";
import { LayoutDashboard, Settings } from "lucide-react"; // Ensure LayoutDashboard and Settings are imported

const formatDiamonds = (amount: number | undefined | null): string => {
  if (amount === undefined || amount === null) return "0";
  if (amount >= 1000000) {
    return (amount / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (amount >= 1000) {
    return (amount / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return amount.toLocaleString('pt-BR');
};


export default function Header() {
  const { currentUser, logout, loading } = useAuth();
  const router = useRouter();
  const { isMobile, state: desktopSidebarState, setOpen: setDesktopSidebarOpen, setOpenMobile } = useSidebar();
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    function onFullscreenChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      try {
        await document.documentElement.requestFullscreen();
      } catch (err) {
        console.error(`Error attempting to enable full-screen mode: ${(err as Error).message} (${(err as Error).name})`);
      }
    } else {
      if (document.exitFullscreen) {
        try {
          await document.exitFullscreen();
        } catch (err) {
          console.error(`Error attempting to exit full-screen mode: ${(err as Error).message} (${(err as Error).name})`);
        }
      }
    }
  };

  const handleSidebarToggle = () => {
    if (isMobile) {
      setOpenMobile(true);
    } else {
      setDesktopSidebarOpen(desktopSidebarState === 'collapsed');
    }
  };

  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    const parts = name.split(" ");
    if (parts.length > 1 && parts[0] && parts[1]) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <header className="bg-card sticky top-0 z-40 border-b border-border h-16 flex items-center">
      <div className="px-6 w-full flex justify-between items-center">
        <div className="flex items-center gap-2">
          {/* Sidebar Trigger for Mobile and Desktop */}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={handleSidebarToggle}
            aria-label="Toggle Sidebar"
          >
            <SidebarTrigger className="h-5 w-5" />
          </Button>
          
          {/* Search Input - More prominent on desktop */}
          <div className="relative hidden md:block">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar..."
              className="pl-10 h-9 w-full md:w-64 lg:w-80 rounded-md bg-muted/60 border-transparent focus-visible:ring-1 focus-visible:ring-primary"
            />
          </div>
        </div>

        <nav className="flex items-center gap-1 md:gap-2">
          {isMobile && (
            <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="text-muted-foreground hover:text-primary">
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              <span className="sr-only">{isFullscreen ? "Sair da Tela Cheia" : "Entrar em Tela Cheia"}</span>
            </Button>
          )}

          {/* Diamond Balance Display */}
          {currentUser && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 h-9 rounded-md bg-primary/10 text-primary text-sm font-medium">
              <Diamond className="w-4 h-4 text-yellow-500" />
              <span>{formatDiamonds(currentUser.currentDiamondBalance)}</span>
            </div>
          )}

          {/* Notification Bell (Example) */}
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary h-9 w-9 relative">
            <Bell className="w-5 h-5" />
            <span className="sr-only">Notificações</span>
            {/* Example notification dot */}
            <span className="absolute top-2 right-2 block h-2 w-2 rounded-full bg-red-500 ring-1 ring-card" />
          </Button>
          
          {loading ? (
            <div className="w-9 h-9 bg-muted rounded-full animate-pulse"></div>
          ) : currentUser ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={currentUser.photoURL || undefined} alt={currentUser.profileName || currentUser.displayName || "User"} />
                    <AvatarFallback>{getInitials(currentUser.profileName || currentUser.displayName || currentUser.email)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {currentUser.profileName || currentUser.displayName || currentUser.email?.split('@')[0]}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {currentUser.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <UserCircle2 className="mr-2 h-4 w-4" />
                    Perfil
                  </Link>
                </DropdownMenuItem>
                 <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Configurações
                  </Link>
                </DropdownMenuItem>
                {currentUser.adminLevel && (
                  <React.Fragment>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/admin">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Painel Admin
                      </Link>
                    </DropdownMenuItem>
                     <DropdownMenuItem asChild>
                      <Link href="/admin/bingo-admin">
                        <TicketIcon className="mr-2 h-4 w-4" />
                        Bingo Admin
                      </Link>
                    </DropdownMenuItem>
                  </React.Fragment>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="default" size="sm" asChild className="text-sm h-9">
              <Link href="/login">
                <LogIn className="w-4 h-4 mr-1 md:mr-2" /> Entrar
              </Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
