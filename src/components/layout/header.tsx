
"use client";

import Link from "next/link";
import { Crown, LogIn, LogOut, UserCircle2, Gamepad2, LifeBuoy, TicketIcon, Maximize, Minimize } from "lucide-react";
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
import { useState, useEffect } from "react";


export default function Header() {
  const { currentUser, logout, loading } = useAuth();
  const router = useRouter();
  const { isMobile } = useSidebar();
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
        console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      }
    } else {
      if (document.exitFullscreen) {
        try {
          await document.exitFullscreen();
        } catch (err) {
          console.error(`Error attempting to exit full-screen mode: ${err.message} (${err.name})`);
        }
      }
    }
  };


  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const getInitials = (email?: string | null) => {
    if (!email) return "U";
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <header className="bg-card sticky top-0 z-40 border-b border-border h-16 flex items-center">
      <div className="px-6 w-full flex justify-between items-center">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="md:hidden" />
          <Link href="/" className="flex items-center gap-2 text-xl font-semibold text-primary hover:opacity-80 transition-opacity">
            <Crown className="w-7 h-7" />
            <span className={isMobile ? "hidden" : "md:inline"}>The Presidential Agency</span>
          </Link>
        </div>
        <nav className="flex items-center gap-1 md:gap-2"> {/* Reduced gap slightly */}
          {isMobile && (
            <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="text-muted-foreground hover:text-primary">
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              <span className="sr-only">{isFullscreen ? "Sair da Tela Cheia" : "Entrar em Tela Cheia"}</span>
            </Button>
          )}
          <Button variant="ghost" size="sm" asChild className="hidden md:inline-flex text-sm md:text-base">
            <Link href="/games">
              <TicketIcon className="w-4 h-4 mr-1 md:mr-2" /> Jogos
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild className="hidden md:inline-flex text-sm md:text-base">
            <Link href="/support">
              <LifeBuoy className="w-4 h-4 mr-1 md:mr-2" /> Suporte
            </Link>
          </Button>
          {loading ? (
            <div className="w-8 h-8 bg-muted rounded-full animate-pulse"></div>
          ) : currentUser ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={currentUser.photoURL || undefined} alt={currentUser.displayName || "User"} />
                    <AvatarFallback>{getInitials(currentUser.email)}</AvatarFallback>
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
                  <Link href="/host/games">
                    <Gamepad2 className="mr-2 h-4 w-4" />
                    Meus Jogos Criados
                  </Link>
                </DropdownMenuItem>
                <div className="md:hidden">
                  <DropdownMenuSeparator />
                   <DropdownMenuItem asChild>
                    <Link href="/games">
                      <TicketIcon className="mr-2 h-4 w-4" /> Jogos
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/support">
                      <LifeBuoy className="mr-2 h-4 w-4" /> Suporte
                    </Link>
                  </DropdownMenuItem>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="default" size="sm" asChild className="text-sm md:text-base">
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
