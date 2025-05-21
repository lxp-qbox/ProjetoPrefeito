
"use client";

import ProtectedPage from "@/components/auth/protected-page";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Users,
  User,
  UserCog,
  ShieldAlert,
  LayoutDashboard,
  Settings,
  UserCircle2,
  Globe,
  Bell,
  FileText,
  Info,
  LogOut,
  ChevronRight,
  Headphones,
  PanelLeftClose,
  PanelRightOpen,
  Star,
  XCircle,
  Database,
  Link as LinkIcon,
  Ticket as TicketIcon,
  MailQuestion,
  ServerOff,
  RefreshCw,
  ListFilter, // Added ListFilter
  BarChart3,  // Added BarChart3
  PlusCircle, // Added PlusCircle
  ListChecks, // Added ListChecks
  Settings as SettingsIconLucide // Added SettingsIconLucide
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { ReactNode } from 'react';
import { useState, useEffect } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Page content components are no longer imported here
// They will be rendered as children by Next.js App Router

interface AdminMenuItem {
  id: string;
  title: string;
  icon: React.ElementType;
  link?: string;
  currentValue?: string; // For items like "Idioma"
  action?: () => void; // For items like "Sair"
  separatorAbove?: boolean; // To add a separator before this item
}

interface AdminMenuGroup {
  groupTitle?: string;
  items: AdminMenuItem[];
  isBottomSection?: boolean;
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { currentUser, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  // contentToRender state and its useEffect are removed

  const adminMenuGroups: AdminMenuGroup[] = [
    {
      groupTitle: "GERAL",
      items: [
        { id: "dashboard", title: "Dashboard", icon: LayoutDashboard, link: "/admin" },
        { id: "language", title: "Idioma", icon: Globe, link: "/admin/language", currentValue: "Português(Brasil)" },
        { id: "notifications", title: "Configurações de notificação", icon: Bell, link: "/admin/notifications" },
      ],
    },
    {
      groupTitle: "GESTÃO DE USUÁRIOS",
      items: [
        { id: "hosts", title: "Contas de Hosts", icon: Star, link: "/admin/hosts" },
        { id: "players", title: "Contas de Players", icon: User, link: "/admin/users/players" },
        { id: "adminAccounts", title: "Contas de Admin", icon: UserCog, link: "/admin/users/admin" },
        { id: "bans", title: "Banimentos", icon: XCircle, link: "/admin/actions/bans" },
      ],
    },
    {
      groupTitle: "KAKO LIVE",
      items: [
          { id: "kakoDataList", title: "Lista de Perfis (DB)", icon: Database, link: "/admin/kako-live/data-list" },
          { id: "kakoUpdateDataChat", title: "Atualizar Dados (Chat)", icon: RefreshCw, link: "/admin/kako-live/update-data-chat" },
          { id: "kakoLinkTester", title: "Teste de Link WebSocket", icon: LinkIcon, link: "/admin/kako-live/link-tester" },
      ]
    },
    { // New Bingo Admin Group
      groupTitle: "BINGO", 
      items: [
        { id: "bingoAdminMain", title: "Administração Bingo", icon: TicketIcon, link: "/admin/bingo-admin"},
      ]
    },
    {
      groupTitle: "MANUTENÇÃO",
      items: [
          { id: "maintenanceOffline", title: "Status Offline", icon: ServerOff, link: "/admin/maintenance/offline" },
      ]
    },
    {
      groupTitle: "SOBRE",
      items: [
        { id: "userAgreement", title: "Contrato do usuário", icon: FileText, link: "/admin/user-agreement" },
        { id: "privacyPolicy", title: "Política de privacidade", icon: FileText, link: "/admin/privacy-policy" },
        { id: "hostAgreement", title: "Contrato de Host", icon: FileText, link: "/admin/host-agreement" },
        { id: "aboutKako", title: "Sobre Kako Live", icon: Info, link: "/admin/about-kako" },
      ],
    },
    {
      items: [
        { id: "support", title: "Entre em contato conosco", icon: Headphones, link: "/support" },
      ],
      isBottomSection: true,
    },
    {
      items: [
        { id: "logout", title: "Sair", icon: LogOut, action: async () => { await logout(); router.push('/'); } },
      ],
    },
  ];

  const toggleAdminSidebar = () => setIsCollapsed(!isCollapsed);

  const handleMenuClick = (item: AdminMenuItem) => {
    if (item.action) {
      item.action();
    } else if (item.link) {
      router.push(item.link);
    }
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
          <div className="flex-grow flex flex-col md:flex-row gap-0 overflow-hidden">
            <nav className={cn(
              "flex flex-col flex-shrink-0 border-r bg-muted/40 h-full overflow-y-auto transition-all duration-300 ease-in-out",
              isCollapsed ? "w-20" : "md:w-80"
            )}>
              <div className="p-4 space-y-4 flex-grow">
                {adminMenuGroups.map((group, groupIndex) => (
                  <div key={group.groupTitle || `group-${groupIndex}`} className={cn(group.isBottomSection && "mt-auto pt-4 border-t")}>
                    {group.groupTitle && !isCollapsed && (
                      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
                        {group.groupTitle}
                      </h2>
                    )}
                     {group.groupTitle && isCollapsed && (
                        <div className="flex justify-center my-3">
                           <div className="w-1 h-1 bg-muted-foreground rounded-full"></div>
                        </div>
                    )}
                    <div className={cn("space-y-1", !group.groupTitle && group.isBottomSection && "mt-0 pt-0 border-none")}>
                      {group.items.map((item) => {
                        const isActive = (pathname === item.link) ||
                                         (item.link === "/admin" && pathname === "/admin/hosts") || 
                                         (item.id === "dashboard" && (pathname === "/admin" || pathname === "/admin/hosts")) ||
                                         (item.id === "bingoAdminMain" && pathname === "/admin/bingo-admin") ||
                                         (item.link && item.link !== "/admin" && item.link !== "/admin/hosts" && pathname.startsWith(item.link) && item.link.length > "/admin".length); 
                        
                        return (
                          <Tooltip key={item.id} disableHoverableContent={!isCollapsed}>
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
                                    : "justify-between py-3 px-3" 
                                )}
                                onClick={() => handleMenuClick(item)}
                              >
                                <div className={cn("flex items-center w-full", isCollapsed ? "justify-center" : "")}>
                                    <div className={cn("flex items-center", isCollapsed ? "" : "gap-2.5")}>
                                        <item.icon className={cn(isActive ? "text-primary" : "text-muted-foreground", isCollapsed ? "h-6 w-6" : "h-5 w-5")} />
                                        {!isCollapsed && item.title}
                                    </div>
                                    {!isCollapsed && !item.action && (
                                      <div className="flex items-center ml-auto">
                                        {item.currentValue && <span className="text-xs text-muted-foreground mr-2">{item.currentValue}</span>}
                                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                      </div>
                                    )}
                                </div>
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

            <main className="flex-grow overflow-y-auto">
              {/* Content is now rendered directly by Next.js App Router */}
              {children}
            </main>
          </div>
        </div>
      </TooltipProvider>
    </ProtectedPage>
  );
}

    