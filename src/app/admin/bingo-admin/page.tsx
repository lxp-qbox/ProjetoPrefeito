
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Star, User, UserCog, XCircle, Database, Link as LinkIcon, RefreshCw, ServerOff,
  FileText, Info, Headphones, LogOut, ChevronRight, Ticket as TicketIcon, Globe, Bell,
  ListChecks, Settings as SettingsIconLucide, PlusCircle, BarChart3, // For original bingo admin card
  LayoutGrid, Trophy, Dice5, PlaySquare, FileJson, ShieldQuestion, AlertTriangle
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import type { GeneratedBingoCard, CardUsageInstance } from '@/types'; // Import new types

interface BingoAdminMenuItem {
  id: string;
  title: string;
  icon: React.ElementType;
  link?: string; 
  action?: () => void;
}

interface BingoAdminMenuGroup {
  groupTitle?: string;
  items: BingoAdminMenuItem[];
  isBottomSection?: boolean;
}

// Sample data for GeneratedBingoCard
const placeholderGeneratedCards: GeneratedBingoCard[] = [
  {
    id: 'card-uuid-001',
    cardNumbers: [
      [5, null, 30, null, 49, null, 61, null, 81],
      [8, 17, null, 32, null, 53, null, 89, null],
      [null, 19, 22, null, 42, null, 55, null, 84]
    ],
    createdAt: new Date(),
    generatedByIpAddress: '192.168.1.101',
    usageHistory: [
      { userId: 'player123', gameId: 'game789', timestamp: new Date(), isWinner: false },
      { userId: 'player456', gameId: 'game789', timestamp: new Date(), isWinner: true },
    ]
  },
  {
    id: 'card-uuid-002',
    cardNumbers: [
      [1, 20, null, 33, null, 50, 65, null, 88],
      [null, 15, 25, 35, 45, null, 68, null, 82],
      [7, null, 28, null, 48, 58, null, 77, null]
    ],
    createdAt: new Date(Date.now() - 86400000), // Yesterday
    generatedByIpAddress: '203.0.113.45',
    usageHistory: [
      { userId: 'player789', gameId: 'gameABC', timestamp: new Date(), isWinner: false },
    ]
  }
];


export default function AdminBingoAdminPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useAuth();

  const bingoSpecificMenuGroups: BingoAdminMenuGroup[] = [
    {
      groupTitle: "GESTÃO DE BINGO",
      items: [
        { id: "bingoPartidas", title: "Partidas", icon: ListChecks, link: "#partidas" },
        { id: "bingoCartelas", title: "Cartelas Geradas", icon: LayoutGrid, link: "#cartelas" },
        { id: "bingoGanhadores", title: "Ganhadores", icon: Trophy, link: "#ganhadores" },
        { id: "bingoBolasSorteadas", title: "Bolas Sorteadas", icon: Dice5, link: "#bolas" },
        { id: "bingoTelaSorteio", title: "Tela de Sorteio", icon: PlaySquare, link: "#sorteio" },
      ],
    },
  ];

  const [activeTab, setActiveTab] = useState<string>('bingoPartidas');
  const [generatedCards, setGeneratedCards] = useState<GeneratedBingoCard[]>(placeholderGeneratedCards);

  useEffect(() => {
    const hash = window.location.hash.substring(1); 
    const validTab = bingoSpecificMenuGroups.flatMap(g => g.items).find(item => item.id === hash);
    if (validTab) {
      setActiveTab(hash);
    } else {
      setActiveTab('bingoPartidas'); 
      if (pathname === '/admin/bingo-admin' && window.location.hash !== '#bingoPartidas' && window.location.hash !== '') {
         router.replace('/admin/bingo-admin#bingoPartidas', { scroll: false });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]); 

  const handleMenuClick = (item: BingoAdminMenuItem) => {
    if (item.action) {
      item.action();
    } else if (item.link && item.link.startsWith("#")) {
      const newTabId = item.link.substring(1);
      setActiveTab(newTabId);
      router.push(`/admin/bingo-admin#${newTabId}`, { scroll: false });
    } else if (item.link) {
        router.push(item.link); 
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
        return (
          <div className="space-y-6 p-6 bg-background h-full">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <LayoutGrid className="mr-2 h-6 w-6 text-primary" />
                  Cartelas de Bingo Geradas
                </CardTitle>
                <CardDescription>
                  Visualize informações sobre as cartelas de bingo geradas no sistema.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 p-3 border border-amber-500 bg-amber-50 rounded-md">
                    <div className="flex items-center">
                        <AlertTriangle className="h-5 w-5 text-amber-600 mr-2" />
                        <p className="text-sm text-amber-700">
                        <strong>Nota:</strong> O rastreamento de IP tem implicações de privacidade. Certifique-se de estar em conformidade com as leis aplicáveis (ex: GDPR) e de informar os usuários em sua política de privacidade.
                        </p>
                    </div>
                </div>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID da Cartela</TableHead>
                        <TableHead>Data de Criação</TableHead>
                        <TableHead>IP de Geração</TableHead>
                        <TableHead className="text-center">Usos</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {generatedCards.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center h-24">
                            Nenhuma cartela gerada encontrada.
                          </TableCell>
                        </TableRow>
                      ) : (
                        generatedCards.map((card) => (
                          <TableRow key={card.id}>
                            <TableCell className="font-mono text-xs">{card.id}</TableCell>
                            <TableCell>{card.createdAt instanceof Date ? card.createdAt.toLocaleDateString('pt-BR') : 'N/A'}</TableCell>
                            <TableCell>{card.generatedByIpAddress || 'N/A'}</TableCell>
                            <TableCell className="text-center">{card.usageHistory.length}</TableCell>
                            <TableCell>
                              <Button variant="outline" size="sm" className="h-7 text-xs">
                                <FileJson className="mr-1.5 h-3 w-3" /> Ver Detalhes
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                 <p className="mt-4 text-xs text-muted-foreground">
                  Esta tabela mostrará as cartelas conforme são registradas no sistema pelo backend. A funcionalidade de registro real e listagem do banco de dados está em desenvolvimento.
                </p>
              </CardContent>
            </Card>
          </div>
        );
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
        return (
            <div className="space-y-6 p-6 bg-background h-full">
              <h1 className="text-2xl font-semibold text-foreground">Administração de Bingo (Padrão)</h1>
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TicketIcon className="mr-2 h-6 w-6 text-primary" />
                    Gerenciamento de Partidas e Configurações de Bingo
                  </CardTitle>
                  <CardDescription>
                    Visualização padrão. Selecione uma opção no menu.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Selecione uma opção específica no menu para ver mais detalhes.</p>
                </CardContent>
              </Card>
            </div>
          );
    }

    // Generic placeholder for other sections
    return (
      <div className="p-6 bg-background h-full">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
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
