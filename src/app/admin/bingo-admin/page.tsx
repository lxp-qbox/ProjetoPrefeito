
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Star, User, UserCog, XCircle, Database, Link as LinkIcon, RefreshCw, ServerOff,
  FileText, Info, Headphones, LogOut, ChevronRight, Ticket as TicketIcon, Globe, Bell,
  ListChecks, Settings as SettingsIconLucide, PlusCircle, BarChart3, AlertTriangle,
  LayoutGrid, Trophy, Dice5, PlaySquare, FileJson, ShieldQuestion, Trash2, Gift, DollarSign
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import type { GeneratedBingoCard, CardUsageInstance, AwardInstance } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';


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

// Sample data for GeneratedBingoCard (90-ball)
const placeholderGenerated90BallCards: GeneratedBingoCard[] = [
  {
    id: 'card-90-001',
    cardNumbers: [
      [5, null, 30, null, 49, null, 61, null, 81],
      [8, 17, null, 32, null, 53, null, 70, 89],
      [null, 19, 22, null, 42, null, 55, null, 84]
    ],
    creatorId: 'user-creator-123',
    createdAt: new Date(),
    usageHistory: [
      { userId: 'player123', gameId: 'game789', timestamp: new Date(), isWinner: false },
      { userId: 'player456', gameId: 'gameXYZ', timestamp: new Date(Date.now() - 3600000), isWinner: true },
    ],
    timesAwarded: 1,
    awardsHistory: [
      { gameId: 'gameXYZ', userId: 'player456', timestamp: new Date(Date.now() - 3600000) }
    ]
  },
  {
    id: 'card-90-002',
    cardNumbers: [
      [1, 20, null, 33, null, 50, 65, null, 88],
      [null, 15, 25, 35, 45, null, 68, 72, 82],
      [7, null, 28, null, 48, 58, null, 77, null]
    ],
    creatorId: 'system-generator',
    createdAt: new Date(Date.now() - 86400000), // Yesterday
    usageHistory: [
      { userId: 'player789', gameId: 'gameABC', timestamp: new Date(), isWinner: false },
    ],
    timesAwarded: 0,
    awardsHistory: []
  }
];

// Sample data for 75-ball cards
const placeholderGenerated75BallCards: GeneratedBingoCard[] = [
  {
    id: 'card-75-001',
    cardNumbers: [ // 5x5 grid
      [1, 16, 31, 46, 61],
      [5, 20, 35, 50, 65],
      [10, 25, null, 55, 70], // N column, middle is free (null)
      [12, 28, 40, 58, 72],
      [15, 30, 45, 60, 75]
    ],
    creatorId: 'user-creator-75A',
    createdAt: new Date(Date.now() - 172800000), // Two days ago
    usageHistory: [
      { userId: 'playerABC', gameId: 'game75-1', timestamp: new Date(), isWinner: false },
    ],
    timesAwarded: 0,
    awardsHistory: []
  },
  {
    id: 'card-75-002',
    cardNumbers: [
      [2, 17, 32, 47, 62],
      [6, 21, 36, 51, 66],
      [11, 26, null, 56, 71],
      [13, 29, 41, 59, 73],
      [14, 27, 44, 57, 74]
    ],
    creatorId: 'system-generator-75',
    createdAt: new Date(Date.now() - 259200000), // Three days ago
    usageHistory: [],
    timesAwarded: 0,
    awardsHistory: []
  }
];

const format90BallCardNumbersPreview = (numbers: (number | null)[][]): string => {
  const firstRowNumbers = numbers[0]?.filter(n => n !== null).slice(0, 3).join(', ');
  return firstRowNumbers ? `${firstRowNumbers}...` : 'N/A';
};

const format75BallCardNumbersPreview = (numbers: (number | null)[][]): string => {
  if (!numbers || numbers.length === 0) return 'N/A';
  // Example: Get first 3 non-null numbers from the first row for 75-ball card
  const firstRowPreview = numbers[0]?.filter(n => n !== null).slice(0,3).join(', ');
  return firstRowPreview ? `${firstRowPreview}...` : 'N/A';
};


export default function AdminBingoAdminPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useAuth();

  const bingoSpecificMenuGroups: BingoAdminMenuGroup[] = [
    {
      groupTitle: "GERENCIAMENTO DE JOGOS",
      items: [
        { id: "bingoPartidas", title: "Partidas", icon: ListChecks, link: "#bingoPartidas" },
        { id: "bingoGanhadores", title: "Ganhadores", icon: Trophy, link: "#bingoGanhadores" },
        { id: "bingoBolasSorteadas", title: "Bolas Sorteadas", icon: Dice5, link: "#bingoBolasSorteadas" },
        { id: "bingoTelaSorteio", title: "Tela de Sorteio", icon: PlaySquare, link: "#bingoTelaSorteio" },
      ],
    },
    {
      groupTitle: "CARTELAS",
      items: [
        { id: "bingoCartelas75", title: "Cartelas Bingo 75", icon: LayoutGrid, link: "#bingoCartelas75" },
        { id: "bingoCartelas90", title: "Cartelas Bingo 90", icon: LayoutGrid, link: "#bingoCartelas90" },
      ],
    },
    {
      groupTitle: "PREMIOS",
      items: [
        { id: "bingoPremiosKako", title: "Prêmios Kako Live", icon: Gift, link: "#bingoPremiosKako" },
        { id: "bingoPremiosDinheiro", title: "Prêmios em Dinheiro", icon: DollarSign, link: "#bingoPremiosDinheiro" },
      ],
    }
  ];

  const [activeTab, setActiveTab] = useState<string>('bingoPartidas');
  const [generated90BallCards, setGenerated90BallCards] = useState<GeneratedBingoCard[]>(placeholderGenerated90BallCards);
  const [generated75BallCards, setGenerated75BallCards] = useState<GeneratedBingoCard[]>(placeholderGenerated75BallCards);

  const [selectedCardForDetails, setSelectedCardForDetails] = useState<GeneratedBingoCard | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isConfirmDeleteAll90BallCardsDialogOpen, setIsConfirmDeleteAll90BallCardsDialogOpen] = useState(false);
  const [isConfirmDeleteAll75BallCardsDialogOpen, setIsConfirmDeleteAll75BallCardsDialogOpen] = useState(false);


  useEffect(() => {
    const hash = window.location.hash.substring(1); 
    const validTab = bingoSpecificMenuGroups.flatMap(g => g.items).find(item => item.id === hash);
    if (validTab) {
      setActiveTab(hash);
    } else {
      const firstItemId = bingoSpecificMenuGroups[0]?.items[0]?.id || 'bingoPartidas';
      setActiveTab(firstItemId); 
      if (pathname === '/admin/bingo-admin' && window.location.hash !== `#${firstItemId}` && window.location.hash !== '') {
         router.replace(`/admin/bingo-admin#${firstItemId}`, { scroll: false });
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

  const handleViewCardDetails = (card: GeneratedBingoCard) => {
    setSelectedCardForDetails(card);
    setIsDetailModalOpen(true);
  };

  const handleConfirmDeleteAll90BallCards = () => {
    setGenerated90BallCards([]);
    console.log("Todas as cartelas de 90 bolas foram removidas da lista (localmente).");
    setIsConfirmDeleteAll90BallCardsDialogOpen(false);
  };

  const handleConfirmDeleteAll75BallCards = () => {
    setGenerated75BallCards([]);
    console.log("Todas as cartelas de 75 bolas foram removidas da lista (localmente).");
    setIsConfirmDeleteAll75BallCardsDialogOpen(false);
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
      case 'bingoCartelas75':
        return (
          <div className="space-y-6 p-6 bg-background h-full">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <LayoutGrid className="mr-2 h-6 w-6 text-primary" />
                  Cartelas de Bingo 75 Bolas Geradas
                </CardTitle>
                <CardDescription>
                  Visualize informações sobre as cartelas de bingo de 75 bolas geradas no sistema.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex justify-end">
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => setIsConfirmDeleteAll75BallCardsDialogOpen(true)}
                    disabled={generated75BallCards.length === 0}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Apagar Todas (75 Bolas - Local)
                  </Button>
                </div>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID da Cartela</TableHead>
                        <TableHead>Números (Início)</TableHead>
                        <TableHead>ID do Criador</TableHead>
                        <TableHead>Data de Criação</TableHead>
                        <TableHead className="text-center">Usos</TableHead>
                        <TableHead className="text-center">Premiada</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {generated75BallCards.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center h-24">
                            Nenhuma cartela de 75 bolas gerada encontrada.
                          </TableCell>
                        </TableRow>
                      ) : (
                        generated75BallCards.map((card) => (
                          <TableRow key={card.id}>
                            <TableCell className="font-mono text-xs">{card.id}</TableCell>
                            <TableCell className="text-xs">{format75BallCardNumbersPreview(card.cardNumbers)}</TableCell>
                            <TableCell className="text-xs">{card.creatorId}</TableCell>
                            <TableCell>{card.createdAt instanceof Date ? format(card.createdAt, "dd/MM/yyyy HH:mm", { locale: ptBR }) : 'N/A'}</TableCell>
                            <TableCell className="text-center">{card.usageHistory.length}</TableCell>
                            <TableCell className="text-center">{card.timesAwarded > 0 ? `${card.timesAwarded}x` : 'Não'}</TableCell>
                            <TableCell>
                              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleViewCardDetails(card)}>
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
                  Esta tabela mostrará as cartelas de 75 bolas.
                </p>
              </CardContent>
            </Card>
          </div>
        );
      case 'bingoCartelas90':
        return (
          <div className="space-y-6 p-6 bg-background h-full">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <LayoutGrid className="mr-2 h-6 w-6 text-primary" />
                  Cartelas de Bingo 90 Bolas Geradas
                </CardTitle>
                <CardDescription>
                  Visualize informações sobre as cartelas de bingo de 90 bolas geradas no sistema.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex justify-end">
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => setIsConfirmDeleteAll90BallCardsDialogOpen(true)}
                    disabled={generated90BallCards.length === 0}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Apagar Todas (90 Bolas - Local)
                  </Button>
                </div>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID da Cartela</TableHead>
                        <TableHead>Números (Início)</TableHead>
                        <TableHead>ID do Criador</TableHead>
                        <TableHead>Data de Criação</TableHead>
                        <TableHead className="text-center">Usos</TableHead>
                        <TableHead className="text-center">Premiada</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {generated90BallCards.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center h-24">
                            Nenhuma cartela de 90 bolas gerada encontrada.
                          </TableCell>
                        </TableRow>
                      ) : (
                        generated90BallCards.map((card) => (
                          <TableRow key={card.id}>
                            <TableCell className="font-mono text-xs">{card.id}</TableCell>
                            <TableCell className="text-xs">{format90BallCardNumbersPreview(card.cardNumbers)}</TableCell>
                            <TableCell className="text-xs">{card.creatorId}</TableCell>
                            <TableCell>{card.createdAt instanceof Date ? format(card.createdAt, "dd/MM/yyyy HH:mm", { locale: ptBR }) : 'N/A'}</TableCell>
                            <TableCell className="text-center">{card.usageHistory.length}</TableCell>
                            <TableCell className="text-center">{card.timesAwarded > 0 ? `${card.timesAwarded}x` : 'Não'}</TableCell>
                            <TableCell>
                              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleViewCardDetails(card)}>
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
      case 'bingoPremiosKako':
        contentTitle = "Gerenciamento de Prêmios - Kako Live";
        contentDescription = "Configure e visualize prêmios virtuais do Kako Live para os jogos de bingo.";
        break;
      case 'bingoPremiosDinheiro':
        contentTitle = "Gerenciamento de Prêmios - Dinheiro";
        contentDescription = "Defina e administre prêmios em dinheiro para diferentes tipos de bingo e classificações.";
        break;
      case 'bingoGanhadores':
        contentTitle = "Registro de Ganhadores";
        contentDescription = "Gerencie e visualize o histórico de ganhadores dos jogos de bingo.";
        break;
      case 'bingoBolasSorteadas':
        contentTitle = "Histórico de Bolas Sorteadas";
        contentDescription = "Acesse o registro de todas as bolas sorteadas em cada partida.";
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
              {activeTab === 'bingoPremiosKako' && <Gift className="mr-2 h-6 w-6 text-primary" />}
              {activeTab === 'bingoPremiosDinheiro' && <DollarSign className="mr-2 h-6 w-6 text-primary" />}
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
    <>
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
    {selectedCardForDetails && (
        <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
          <DialogContent className="sm:max-w-3xl md:max-w-4xl lg:max-w-5xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="text-xl">Detalhes da Cartela: <span className="font-mono text-primary">{selectedCardForDetails.id}</span></DialogTitle>
              <DialogDescription>
                Informações completas da cartela de bingo selecionada.
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[calc(80vh-100px)] pr-4">
              <div className="space-y-6 py-4">
                
                {/* Visual Card Grid - Specific to 90-ball card structure */}
                {selectedCardForDetails.cardNumbers.length === 3 && selectedCardForDetails.cardNumbers[0].length === 9 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Visualização da Cartela (90 Bolas)</h3>
                    <div className="grid grid-cols-9 gap-px bg-primary/10 border-2 border-primary rounded-lg p-0.5 w-full max-w-md mx-auto">
                      {selectedCardForDetails.cardNumbers.map((row, rowIndex) =>
                        row.map((cell, colIndex) => (
                          <div
                            key={`detail-card-90-${rowIndex}-${colIndex}`}
                            className={cn(
                              "flex items-center justify-center h-12 text-base font-medium aspect-square",
                              cell === null ? 'bg-primary/10' : 'bg-card text-primary'
                            )}
                          >
                            {cell !== null ? cell : ""}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
                 {/* Visual Card Grid - Specific to 75-ball card structure */}
                 {selectedCardForDetails.cardNumbers.length === 5 && selectedCardForDetails.cardNumbers[0].length === 5 && (
                    <div>
                        <h3 className="text-lg font-semibold mb-2">Visualização da Cartela (75 Bolas)</h3>
                        <div className="grid grid-cols-5 gap-px bg-primary/10 border-2 border-primary rounded-lg p-0.5 w-full max-w-xs mx-auto">
                          {selectedCardForDetails.cardNumbers.map((row, rowIndex) =>
                            row.map((cell, colIndex) => (
                              <div
                                key={`detail-card-75-${rowIndex}-${colIndex}`}
                                className={cn(
                                  "flex items-center justify-center h-12 text-base font-medium aspect-square",
                                  cell === null ? 'bg-yellow-300 text-yellow-700' : 'bg-card text-primary'
                                )}
                              >
                                {cell !== null ? cell : <Star className="h-5 w-5 text-yellow-600" />}
                              </div>
                            ))
                          )}
                        </div>
                    </div>
                 )}


                {/* Basic Information */}
                <Card>
                  <CardHeader><CardTitle className="text-md">Informações Básicas</CardTitle></CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <p><strong>ID do Criador:</strong> {selectedCardForDetails.creatorId}</p>
                    <p><strong>Data de Criação:</strong> {selectedCardForDetails.createdAt instanceof Date ? format(selectedCardForDetails.createdAt, "dd/MM/yyyy HH:mm:ss", { locale: ptBR }) : 'N/A'}</p>
                    <p><strong>Total de Vezes Premiada:</strong> {selectedCardForDetails.timesAwarded}</p>
                  </CardContent>
                </Card>

                {/* Usage History */}
                <Card>
                  <CardHeader><CardTitle className="text-md">Histórico de Uso ({selectedCardForDetails.usageHistory.length})</CardTitle></CardHeader>
                  <CardContent>
                    {selectedCardForDetails.usageHistory.length > 0 ? (
                      <div className="rounded-md border overflow-x-auto max-h-60">
                        <Table className="text-xs">
                          <TableHeader>
                            <TableRow>
                              <TableHead>ID do Jogo</TableHead>
                              <TableHead>ID do Usuário</TableHead>
                              <TableHead>Data/Hora</TableHead>
                              <TableHead>Foi Ganhador?</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedCardForDetails.usageHistory.map((usage, index) => (
                              <TableRow key={`usage-${index}`}>
                                <TableCell>{usage.gameId}</TableCell>
                                <TableCell>{usage.userId}</TableCell>
                                <TableCell>{usage.timestamp instanceof Date ? format(usage.timestamp, "dd/MM/yyyy HH:mm", { locale: ptBR }) : 'N/A'}</TableCell>
                                <TableCell>{usage.isWinner ? "Sim" : "Não"}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Nenhum histórico de uso registrado.</p>
                    )}
                  </CardContent>
                </Card>

                {/* Awards History */}
                <Card>
                  <CardHeader><CardTitle className="text-md">Histórico de Prêmios ({selectedCardForDetails.awardsHistory.length})</CardTitle></CardHeader>
                  <CardContent>
                    {selectedCardForDetails.awardsHistory.length > 0 ? (
                      <div className="rounded-md border overflow-x-auto max-h-60">
                        <Table className="text-xs">
                          <TableHeader>
                            <TableRow>
                              <TableHead>ID do Jogo</TableHead>
                              <TableHead>ID do Ganhador</TableHead>
                              <TableHead>Data/Hora do Prêmio</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedCardForDetails.awardsHistory.map((award, index) => (
                              <TableRow key={`award-${index}`}>
                                <TableCell>{award.gameId}</TableCell>
                                <TableCell>{award.userId}</TableCell>
                                <TableCell>{award.timestamp instanceof Date ? format(award.timestamp, "dd/MM/yyyy HH:mm", { locale: ptBR }) : 'N/A'}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Nenhum prêmio registrado para esta cartela.</p>
                    )}
                  </CardContent>
                </Card>

              </div>
            </ScrollArea>
            <DialogFooter className="pt-4 border-t">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Fechar
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <AlertDialog open={isConfirmDeleteAll90BallCardsDialogOpen} onOpenChange={setIsConfirmDeleteAll90BallCardsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão (90 Bolas)</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem certeza que deseja apagar TODAS as cartelas de 90 bolas geradas desta lista?
              Esta ação é apenas local e não afeta o banco de dados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsConfirmDeleteAll90BallCardsDialogOpen(false)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteAll90BallCards}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Apagar Tudo (90 Bolas - Local)
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isConfirmDeleteAll75BallCardsDialogOpen} onOpenChange={setIsConfirmDeleteAll75BallCardsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão (75 Bolas)</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem certeza que deseja apagar TODAS as cartelas de 75 bolas geradas desta lista?
              Esta ação é apenas local e não afeta o banco de dados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsConfirmDeleteAll75BallCardsDialogOpen(false)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteAll75BallCards}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Apagar Tudo (75 Bolas - Local)
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
    

    
