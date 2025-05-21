
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Star, User, UserCog, XCircle, Database, Link as LinkIcon, RefreshCw, ServerOff,
  FileText, Info, Headphones, LogOut, ChevronRight, Ticket as TicketIcon, Globe, Bell,
  ListChecks, Settings as SettingsIconLucide, PlusCircle, BarChart3, // For original bingo admin card
  LayoutGrid, Trophy, Dice5, PlaySquare // For new bingo menu
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

interface BingoAdminMenuItem {
  id: string;
  title: string;
  icon: React.ElementType;
  link?: string; // Will be used for hash navigation within this page
  action?: () => void;
}

interface BingoAdminMenuGroup {
  groupTitle?: string;
  items: BingoAdminMenuItem[];
  isBottomSection?: boolean;
}

export default function AdminBingoAdminPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useAuth();

  const bingoSpecificMenuGroups: BingoAdminMenuGroup[] = [
    {
      groupTitle: "GESTÃO DE BINGO",
      items: [
        { id: "bingoPartidas", title: "Partidas", icon: ListChecks, link: "#partidas" },
        { id: "bingoCartelas", title: "Cartelas", icon: LayoutGrid, link: "#cartelas" },
        { id: "bingoGanhadores", title: "Ganhadores", icon: Trophy, link: "#ganhadores" },
        { id: "bingoBolasSorteadas", title: "Bolas Sorteadas", icon: Dice5, link: "#bolas" },
        { id: "bingoTelaSorteio", title: "Tela de Sorteio", icon: PlaySquare, link: "#sorteio" },
      ],
    },
    // Removed general admin links, as they are in the main app sidebar
  ];

  const [activeTab, setActiveTab] = useState<string>('bingoPartidas');

  useEffect(() => {
    const hash = window.location.hash.substring(1); // Get id from #
    const validTab = bingoSpecificMenuGroups.flatMap(g => g.items).find(item => item.id === hash);
    if (validTab) {
      setActiveTab(hash);
    } else {
      setActiveTab('bingoPartidas'); // Default tab
      if (pathname === '/admin/bingo-admin' && window.location.hash !== '#bingoPartidas' && window.location.hash !== '') {
         router.replace('/admin/bingo-admin#bingoPartidas', { scroll: false });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]); // Only run on pathname change, hash changes handled by handleMenuClick

  const handleMenuClick = (item: BingoAdminMenuItem) => {
    if (item.action) {
      item.action();
    } else if (item.link && item.link.startsWith("#")) {
      const newTabId = item.link.substring(1);
      setActiveTab(newTabId);
      router.push(`/admin/bingo-admin#${newTabId}`, { scroll: false });
    } else if (item.link) {
        router.push(item.link); // For any external links if added later
    }
  };

  const renderBingoAdminContent = () => {
    let contentTitle = "Seção de Bingo";
    let contentDescription = "Conteúdo em desenvolvimento.";

    switch (activeTab) {
      case 'bingoPartidas':
        return (
          <div className="space-y-6 p-6 bg-background h-full">
            <h1 className="text-2xl font-semibold text-foreground">Administração de Bingo</h1>
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TicketIcon className="mr-2 h-6 w-6 text-primary" />
                  Gerenciamento de Partidas e Configurações de Bingo
                </CardTitle>
                <CardDescription>
                  Aqui você poderá gerenciar todos os aspectos dos jogos de bingo ativos, futuros e passados.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4">Funcionalidades planejadas para Partidas:</p>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center"><ListChecks className="mr-2 h-4 w-4 text-primary/80" /> Visualizar todas as partidas (ativas, futuras, passadas).</li>
                  <li className="flex items-center"><PlusCircle className="mr-2 h-4 w-4 text-primary/80" /> Criar novas partidas com configurações personalizadas (tipo de bingo, preço da cartela, prêmios).</li>
                  <li className="flex items-center"><SettingsIconLucide className="mr-2 h-4 w-4 text-primary/80" /> Editar partidas existentes (data, hora, prêmios).</li>
                  <li className="flex items-center"><BarChart3 className="mr-2 h-4 w-4 text-primary/80" /> Ver estatísticas por partida (participantes, receita, vencedores).</li>
                   <li className="flex items-center"><XCircle className="mr-2 h-4 w-4 text-destructive/80" /> Cancelar ou adiar partidas.</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        );
      case 'bingoCartelas':
        contentTitle = "Gerenciamento de Cartelas de Bingo";
        break;
      case 'bingoGanhadores':
        contentTitle = "Registro de Ganhadores";
        break;
      case 'bingoBolasSorteadas':
        contentTitle = "Histórico de Bolas Sorteadas";
        break;
      case 'bingoTelaSorteio':
        contentTitle = "Interface da Tela de Sorteio";
        contentDescription = "Esta seção permitirá visualizar e controlar uma tela de sorteio em tempo real."
        break;
      default:
        // Fallback to Partidas if activeTab is somehow invalid
        return renderBingoAdminContent(); // This could cause a loop if default isn't handled carefully
    }

    // Generic placeholder for other sections
    return (
      <div className="p-6 bg-background h-full">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              {/* Dynamically choose an icon or use a generic one */}
              {activeTab === 'bingoCartelas' && <LayoutGrid className="mr-2 h-6 w-6 text-primary" />}
              {activeTab === 'bingoGanhadores' && <Trophy className="mr-2 h-6 w-6 text-primary" />}
              {activeTab === 'bingoBolasSorteadas' && <Dice5 className="mr-2 h-6 w-6 text-primary" />}
              {activeTab === 'bingoTelaSorteio' && <PlaySquare className="mr-2 h-6 w-6 text-primary" />}
              {contentTitle}
            </CardTitle>
            <CardDescription>
              {contentDescription}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Mais detalhes e funcionalidades serão adicionados aqui em breve.</p>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="flex flex-col md:flex-row h-full gap-0 overflow-hidden">
      <nav className="md:w-72 lg:w-80 flex-shrink-0 border-r bg-muted/40 h-full overflow-y-auto p-4 space-y-4">
        {bingoSpecificMenuGroups.map((group, groupIndex) => (
          <div key={group.groupTitle || `bingo-admin-group-${groupIndex}`} className={cn(group.isBottomSection && "mt-auto pt-4 border-t")}>
            {group.groupTitle && (
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
                {group.groupTitle}
              </h2>
            )}
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = activeTab === item.id;
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
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
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
