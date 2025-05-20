
"use client";

import ProtectedPage from "@/components/auth/protected-page";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Users, MailQuestion, ShieldAlert, LayoutDashboard, TicketIcon, Settings, UserCircle2, Globe, Bell, FileText, Info, LogOut, ChevronRight, Headphones, User, UserCog, PanelLeftClose, PanelRightOpen } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { ReactNode } from 'react';
import { useState } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


interface AdminMenuItem {
  title: string;
  icon: React.ElementType;
  link: string;
  currentValue?: string;
}

interface AdminMenuGroup {
  groupTitle?: string;
  items: AdminMenuItem[];
  isBottomSection?: boolean;
}

const adminMenuGroups: AdminMenuGroup[] = [
  {
    groupTitle: "Geral",
    items: [
      { title: "Dashboard", icon: LayoutDashboard, link: "/admin" },
      { title: "Idioma", icon: Globe, link: "/admin/language", currentValue: "Português(Brasil)" },
      { title: "Configurações de notificação", icon: Bell, link: "/admin/notifications" },
    ],
  },
  {
    groupTitle: "Usuários",
    items: [
      { title: "Contas de Hosts", icon: Users, link: "/admin/hosts" },
      { title: "Contas de Players", icon: User, link: "/admin/users/players" },
      { title: "Contas de Admin", icon: UserCog, link: "/admin/users/admin" },
    ],
  },
  {
    groupTitle: "Sobre",
    items: [
      { title: "Contrato do usuário", icon: FileText, link: "/admin/user-agreement" },
      { title: "Política de privacidade", icon: FileText, link: "/admin/privacy-policy" },
      { title: "Contrato de Host", icon: FileText, link: "/admin/host-agreement" },
      { title: "Sobre Kako Live", icon: Info, link: "/admin/about-kako" },
    ],
  },
  {
    items: [
      { title: "Entre em contato conosco", icon: Headphones, link: "/support" },
    ],
    isBottomSection: true,
  },
  {
    items: [
      { title: "Sair", icon: LogOut, link: "#logout" },
    ],
  },
];


export default function AdminLayout({ children }: { children: ReactNode }) {
  const { currentUser, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleAdminSidebar = () => setIsCollapsed(!isCollapsed);

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  if (!currentUser || !currentUser.adminLevel) {
    return (
      <ProtectedPage>
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center p-4">
          <ShieldAlert className="w-16 h-16 text-destructive mb-4" />
          <h1 className="text-2xl font-bold text-destructive mb-2">Acesso Negado</h1>
          <p className="text-muted-foreground">
            Você não tem permissão para acessar esta página.
          </p>
          <Button asChild variant="outline" className="mt-6">
            <Link href="/">Voltar para Início</Link>
          </Button>
        </div>
      </ProtectedPage>
    );
  }

  return (
    <ProtectedPage>
      <TooltipProvider delayDuration={0}>
        <div className="flex flex-col h-full">
          <div className={cn("flex-grow flex flex-col md:flex-row gap-0 overflow-hidden h-full")}>
            {/* Admin Navigation Sidebar */}
            <nav className={cn(
              "flex flex-col flex-shrink-0 border-r bg-muted/40 h-full overflow-y-auto transition-all duration-300 ease-in-out",
              isCollapsed ? "w-20" : "md:w-80"
            )}>
              <div className={cn("p-4 space-y-4 flex-grow")}>
                {adminMenuGroups.map((group, groupIndex) => (
                  <div key={group.groupTitle || `group-${groupIndex}`} className={cn(group.isBottomSection && "mt-6 pt-6 border-t")}>
                    {group.groupTitle && !isCollapsed && (
                      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
                        {group.groupTitle}
                      </h2>
                    )}
                     {group.groupTitle && isCollapsed && ( // Show a smaller separator or dot when collapsed
                        <div className="flex justify-center my-3">
                           <div className="w-1 h-1 bg-muted-foreground rounded-full"></div>
                        </div>
                    )}
                    <div className={cn("space-y-1", !group.groupTitle && group.isBottomSection && "mt-0 pt-0 border-none")}>
                      {group.items.map((item) => {
                        const isActiveDashboard = item.link === "/admin" && (pathname === "/admin" || pathname === "/admin/hosts");
                        const isActiveRegular = item.link !== "/admin" && pathname === item.link;
                        const isActive = isActiveDashboard || isActiveRegular;
                        const isLogout = item.link === "#logout";
                        
                        const buttonAction = isLogout ? handleLogout : () => {
                            if (item.link) router.push(item.link);
                        };

                        return (
                          <Tooltip key={item.title} disableHoverableContent={!isCollapsed}>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                className={cn(
                                  "w-full text-left h-auto text-sm font-normal rounded-md transition-all duration-300 ease-in-out",
                                  isActive
                                    ? "bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary"
                                    : "text-card-foreground hover:bg-card/80 hover:text-card-foreground bg-card shadow-sm",
                                  isCollapsed 
                                    ? "flex items-center justify-center p-3 h-14"
                                    : "justify-between py-3 px-2.5"
                                )}
                                asChild={!isLogout}
                                onClick={isLogout ? buttonAction : undefined}
                              >
                                {isLogout ? (
                                  <div className={cn("flex items-center w-full", isCollapsed ? "justify-center" : "")}> 
                                    <div className={cn("flex items-center", isCollapsed ? "" : "gap-2.5")}> 
                                      <item.icon className={cn(isActive ? "text-primary" : "text-muted-foreground", isCollapsed ? "h-6 w-6" : "h-5 w-5")} /> 
                                      {!isCollapsed && item.title}
                                    </div>
                                    {!isCollapsed && <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto" />}
                                  </div>
                                ) : (
                                  <Link href={item.link} className={cn("flex items-center w-full", isCollapsed ? "justify-center" : "")}>
                                    <div className={cn("flex items-center", isCollapsed ? "" : "gap-2.5")}> 
                                      <item.icon className={cn(isActive ? "text-primary" : "text-muted-foreground", isCollapsed ? "h-6 w-6" : "h-5 w-5")} /> 
                                      {!isCollapsed && item.title}
                                    </div>
                                    {!isCollapsed && (
                                      <div className="flex items-center ml-auto">
                                        {item.currentValue && <span className="text-xs text-muted-foreground mr-2">{item.currentValue}</span>}
                                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                      </div>
                                    )}
                                  </Link>
                                )}
                              </Button>
                            </TooltipTrigger>
                            {isCollapsed && (
                              <TooltipContent side="right" className="bg-foreground text-background">
                                <p>{item.title}</p>
                              </TooltipContent>
                            )}
                          </Tooltip>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-border">
                <Button
                  variant="ghost"
                  onClick={toggleAdminSidebar}
                  className="w-full flex items-center justify-center"
                >
                  {isCollapsed ? <PanelRightOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
                  {!isCollapsed && <span className="ml-2 text-sm">{isCollapsed ? "Expandir" : "Recolher"}</span>}
                  <span className="sr-only">{isCollapsed ? "Expandir menu" : "Recolher menu"}</span>
                </Button>
              </div>
            </nav>

            {/* Admin Content Area */}
            <main className="flex-grow overflow-y-auto p-6">
              {children}
            </main>
          </div>
        </div>
      </TooltipProvider>
    </ProtectedPage>
  );
}
