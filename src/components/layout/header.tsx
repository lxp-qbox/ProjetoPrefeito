
"use client";

import Link from "next/link";
import { Crown, LogIn, LogOut, UserCircle2, Gamepad2, LifeBuoy, TicketIcon } from "lucide-react";
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


export default function Header() {
  const { currentUser, logout, loading } = useAuth();
  const router = useRouter();
  const { isMobile } = useSidebar();


  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const getInitials = (email?: string | null) => {
    if (!email) return "U";
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <header className="bg-card sticky top-0 z-40 border-b border-border"> {/* Removed shadow-md */}
      <div className="px-6 h-16 flex justify-between items-center">
        <div className="flex items-center gap-2">
          {/* This trigger is for mobile when the main sidebar is collapsed. The main sidebar has its own trigger. */}
          <SidebarTrigger className="md:hidden" />
          <Link href="/" className="flex items-center gap-2 text-xl font-semibold text-primary hover:opacity-80 transition-opacity">
            <Crown className="w-7 h-7" />
            {/* Conditionally hide text on mobile if sidebar is also icon-only, or always show on larger screens */}
            <span className={isMobile ? "hidden" : "md:inline"}>The Presidential Agency</span>
          </Link>
        </div>
        <nav className="flex items-center gap-3 md:gap-4">
          <Button variant="ghost" size="sm" asChild className="hidden md:inline-flex text-sm md:text-base">
            <Link href="/games">
              <TicketIcon className="w-4 h-4 mr-1 md:mr-2" /> Games
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild className="hidden md:inline-flex text-sm md:text-base">
            <Link href="/support">
              <LifeBuoy className="w-4 h-4 mr-1 md:mr-2" /> Support
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
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/host/games">
                    <Gamepad2 className="mr-2 h-4 w-4" />
                    My Hosted Games
                  </Link>
                </DropdownMenuItem>
                {/* Mobile only links from sidebar */}
                <div className="md:hidden">
                  <DropdownMenuSeparator />
                   <DropdownMenuItem asChild>
                    <Link href="/games">
                      <TicketIcon className="mr-2 h-4 w-4" /> Games
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/support">
                      <LifeBuoy className="mr-2 h-4 w-4" /> Support
                    </Link>
                  </DropdownMenuItem>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="default" size="sm" asChild className="text-sm md:text-base">
              <Link href="/login">
                <LogIn className="w-4 h-4 mr-1 md:mr-2" /> Login
              </Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
