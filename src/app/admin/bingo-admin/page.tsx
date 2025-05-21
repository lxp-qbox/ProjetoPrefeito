
"use client";

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Star, User, UserCog, XCircle, Database, Link as LinkIcon, RefreshCw, ServerOff,
  FileText, Info, Headphones, LogOut, ChevronRight, Ticket as TicketIcon,
  ListChecks, Settings as SettingsIconLucide, PlusCircle, BarChart3, Globe, Bell
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

// Define AdminMenuItem and AdminMenuGroup interfaces (copied from admin/layout.tsx or defined locally)
interface AdminMenuItem {
  id: string;
  title: string;
  icon: React.ElementType;
  link?: string;
  currentValue?: string; 
  action?: () => void; 
  separatorAbove?: boolean; 
}

interface AdminMenuGroup {
  groupTitle?: string;
  items: AdminMenuItem[];
  isBottomSection?: boolean;
}

export default function AdminBingoAdminPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useAuth(); 

  // This menu is specific to the Bingo Admin page if it has its own sub-navigation
  // Or, it could be a simplified version if the main admin layout handles most navigation
  const bingoAdminMenuGroups: AdminMenuGroup[] = [
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
    {
      groupTitle: "BINGO", 
      items: [
        // This should be the default active item if this page is loaded
        { id: "bingoAdminMain", title: "Administração Bingo", icon: TicketIcon, link: "/admin/bingo-admin"},
        // Add other bingo-specific sub-menu items here if needed
        // Example: { id: "bingoGameSettings", title: "Configurações de Partida", icon: SettingsIconLucide, link: "/admin/bingo-admin/settings"},
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

  const [activeTab, setActiveTab] = useState<string>('bingoAdminMain'); // Default to bingo main content

  useEffect(() => {
    // This effect ensures that if the user navigates directly to /admin/bingo-admin,
    // the 'bingoAdminMain' tab is correctly set as active.
    if (pathname === "/admin/bingo-admin") {
      setActiveTab("bingoAdminMain");
    } else {
      // If there were sub-routes like /admin/bingo-admin/settings, you'd match them here
      const matchingItem = bingoAdminMenuGroups.flatMap(g => g.items).find(item => item.link === pathname);
      if (matchingItem) {
        setActiveTab(matchingItem.id);
      }
    }
  }, [pathname, bingoAdminMenuGroups]);


  const handleMenuClick = (item: AdminMenuItem) => {
    if (item.action) {
      item.action();
    } else if (item.link) {
      // If navigating to a different top-level admin section, let AdminLayout handle it
      if (!item.link.startsWith("/admin/bingo-admin") && item.link.startsWith("/admin/")) {
        router.push(item.link);
      } else {
        // For internal navigation within bingo-admin or to non-admin pages
        setActiveTab(item.id);
        router.push(item.link);
      }
    } else {
      setActiveTab(item.id); // For items that only change content on this page
    }
  };

  const renderBingoAdminContent = () => {
    // Only render content if the activeTab is specifically for Bingo Administration
    if (activeTab === 'bingoAdminMain') {
      return (
        <div className="space-y-6 p-6">
          <h1 className="text-2xl font-semibold text-foreground">Administração de Bingo</h1>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TicketIcon className="mr-2 h-6 w-6 text-primary" />
                Gestão de Partidas e Configurações de Bingo
              </CardTitle>
              <CardDescription>
                Esta seção está em desenvolvimento. Aqui você poderá gerenciar todos os aspectos dos jogos de bingo.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">Funcionalidades planejadas:</p>
              <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center"><ListChecks className="mr-2 h-4 w-4 text-primary/80" /> Visualizar e gerenciar todas as partidas de bingo (ativas, futuras, passadas).</li>
                <li className="flex items-center"><SettingsIconLucide className="mr-2 h-4 w-4 text-primary/80" /> Configurar parâmetros globais de bingo (ex: custo de cartela padrão, prêmios).</li>
                <li className="flex items-center"><PlusCircle className="mr-2 h-4 w-4 text-primary/80" /> Criar novas partidas de bingo com configurações personalizadas.</li>
                <li className="flex items-center"><BarChart3 className="mr-2 h-4 w-4 text-primary/80" /> Ver estatísticas de jogos (participantes, receita, vencedores).</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      );
    }
    // For other items clicked in the *cloned* admin menu on this page, show a placeholder.
    // This indicates that those sections are accessed via the main admin layout, not from within bingo-admin.
    const activeItem = bingoAdminMenuGroups.flatMap(g => g.items).find(item => item.id === activeTab);
    return (
      <div className="p-6">
        <Card>
          <CardHeader><CardTitle>{activeItem?.title || "Seção Administrativa"}</CardTitle></CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Conteúdo para {activeItem?.title || "esta seção"} é gerenciado em outra área do painel.</p>
          </CardContent>
        </Card>
      </div>
    );
  };
  
  // This page might have its own sidebar or reuse the main admin sidebar structure.
  // For now, let's assume it might have its own internal navigation distinct from the main AdminLayout sidebar
  // if it becomes a complex section. If it's simple, just renderBingoAdminContent() directly.
  // The image provided showed a page with an internal menu, so we replicate that.
  return (
    <div className="flex flex-col md:flex-row h-full gap-0 overflow-hidden">
      {/* Internal Sidebar for Bingo Admin section - cloned from main AdminLayout */}
      <nav className="md:w-72 lg:w-80 flex-shrink-0 border-r bg-muted/40 h-full overflow-y-auto p-4 space-y-4">
        {bingoAdminMenuGroups.map((group, groupIndex) => (
          <div key={group.groupTitle || `admin-bingo-group-${groupIndex}`} className={cn(group.isBottomSection && "mt-auto pt-4 border-t")}>
            {group.groupTitle && (
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
                {group.groupTitle}
              </h2>
            )}
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = activeTab === item.id || (item.link && pathname === item.link);
                return (
                  <Button
                    key={item.id}
                    variant="ghost"
                    className={cn(
                      "w-full text-left h-auto text-sm font-normal rounded-md transition-all",
                      isActive
                        ? "bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary"
                        : "text-card-foreground hover:bg-card/80 bg-card shadow-sm hover:text-card-foreground",
                      "justify-between py-3 px-3"
                    )}
                    onClick={() => handleMenuClick(item)}
                  >
                    <div className="flex items-center gap-2.5">
                      <item.icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground")} />
                      <span>{item.title}</span>
                    </div>
                    <div className="flex items-center ml-auto">
                      {item.currentValue && <span className="text-xs text-muted-foreground mr-2">{item.currentValue}</span>}
                      {!item.action && item.id !== 'logout' ? <ChevronRight className="h-4 w-4 text-muted-foreground" /> : null}
                    </div>
                  </Button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <main className="flex-1 h-full overflow-y-auto">
        {renderBingoAdminContent()}
      </main>
    </div>
  );
}


    