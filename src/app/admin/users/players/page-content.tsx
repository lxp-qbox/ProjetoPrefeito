
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Users, CheckCircle, XCircle, Edit, ChevronDown, Eye, KeyRound, Trash2 } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import React, { useState, useEffect, useCallback } from "react";
import { db, doc, updateDoc, serverTimestamp, getDocs, collection, query, where, type UserProfile, deleteDoc } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/ui/loading-spinner";

interface StatCardProps {
  title: string;
  count: string | number;
  icon: React.ElementType;
  iconColor?: string;
  bgColorClass?: string;
  textColorClass?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, count, icon: Icon, iconColor = "text-primary", bgColorClass = "bg-primary/10", textColorClass="text-primary" }) => (
  <Card className="shadow-md">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <div className={`p-2 rounded-lg ${bgColorClass}`}>
        <Icon className={`h-5 w-5 ${textColorClass}`} />
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold text-foreground">{count}</div>
    </CardContent>
  </Card>
);

interface AdminPlayer {
  id: string; // User UID
  avatarUrl?: string | null;
  appUserId: string; // User UID (same as id)
  name: string;
  email?: string;
  kakoShowId?: string; // Added kakoShowId
  status: 'Ativo' | 'Banido';
}

const getStatusStyles = (status: AdminPlayer['status']) => {
  switch (status) {
    case 'Ativo':
      return { text: 'Ativo', className: 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200' };
    case 'Banido':
      return { text: 'Banido', className: 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200' };
    default:
      return { text: status, className: 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200' };
  }
};

export default function AdminPlayersPageContent() {
  const [players, setPlayers] = useState<AdminPlayer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const [playerToDelete, setPlayerToDelete] = useState<AdminPlayer | null>(null);
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);

  const fetchPlayers = useCallback(async () => {
    setIsLoading(true);
    try {
      const accountsRef = collection(db, "accounts"); // Changed 'users' to 'accounts'
      const q = query(accountsRef, where("role", "==", "player"));
      const querySnapshot = await getDocs(q);
      const fetchedPlayers: AdminPlayer[] = [];
      querySnapshot.forEach((docSnap) => {
        const userData = docSnap.data() as UserProfile;
        fetchedPlayers.push({
          id: docSnap.id,
          appUserId: docSnap.id,
          name: userData.profileName || userData.displayName || "N/A",
          avatarUrl: userData.photoURL,
          email: userData.email || "N/A",
          kakoShowId: userData.kakoShowId, // Added kakoShowId
          status: userData.isBanned ? 'Banido' : 'Ativo',
        });
      });
      setPlayers(fetchedPlayers);
    } catch (error) {
      console.error("Error fetching players:", error);
      toast({
        title: "Erro ao buscar players",
        description: "Não foi possível carregar a lista de players.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  const handleBanPlayer = async (playerId: string) => {
    console.log("Solicitado banir player:", playerId);
     try {
        const userDocRef = doc(db, "accounts", playerId); // Changed 'users' to 'accounts'
        await updateDoc(userDocRef, {
            isBanned: true,
            bannedAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        toast({ title: "Player Banido", description: "O status do player foi atualizado para banido."});
        fetchPlayers(); 
    } catch (error) {
        console.error("Erro ao banir player:", error);
        toast({ title: "Erro ao Banir", description: "Não foi possível banir o player.", variant: "destructive"});
    }
  };

  const handleRequestDeleteAccount = (player: AdminPlayer) => {
    setPlayerToDelete(player);
    setIsConfirmDeleteDialogOpen(true);
  };

  const handleConfirmDeleteAccount = async () => {
    if (!playerToDelete) return;
    try {
      await deleteDoc(doc(db, "accounts", playerToDelete.id)); // Changed 'users' to 'accounts'
      setPlayers(prevPlayers => prevPlayers.filter(p => p.id !== playerToDelete.id));
      toast({
        title: "Conta Excluída (Firestore)",
        description: `O perfil de ${playerToDelete.name} foi excluído do banco de dados. ATENÇÃO: A conta de autenticação do Firebase ainda existe e precisa ser removida manualmente no Firebase Console.`,
        variant: "default",
        duration: 9000,
      });
    } catch (error) {
      console.error("Erro ao excluir conta do Firestore:", error);
      toast({
        title: "Erro ao Excluir",
        description: "Não foi possível excluir o perfil do player do Firestore.",
        variant: "destructive",
      });
    } finally {
      setIsConfirmDeleteDialogOpen(false);
      setPlayerToDelete(null);
    }
  };


  const filteredPlayers = players.filter(player =>
    player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    player.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    player.appUserId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    player.kakoShowId?.toLowerCase().includes(searchTerm.toLowerCase()) // Search by kakoShowId
  );

  const activePlayersCount = players.filter(p => p.status === 'Ativo').length;
  const bannedPlayersCount = players.filter(p => p.status === 'Banido').length;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full p-6">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6 h-full flex flex-col p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Gerenciamento de Players</h1>
            <p className="text-sm text-muted-foreground">Visualize e gerencie os players da plataforma.</p>
          </div>
          <div className="relative flex-grow sm:flex-grow-0 sm:min-w-[280px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                type="search" 
                placeholder="Buscar players (Nome, ID, Show ID...)" 
                className="pl-10 w-full h-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard title="Total de Players" count={players.length} icon={Users} bgColorClass="bg-blue-500/10" textColorClass="text-blue-500" />
          <StatCard title="Players Ativos" count={activePlayersCount} icon={CheckCircle} bgColorClass="bg-green-500/10" textColorClass="text-green-500" />
          <StatCard title="Players Banidos" count={bannedPlayersCount} icon={XCircle} bgColorClass="bg-red-500/10" textColorClass="text-red-500" />
        </div>

        <div className="flex-grow rounded-lg border overflow-hidden shadow-sm bg-card">
          <div className="overflow-x-auto h-full">
            <Table>
              <TableHeader className="bg-muted/50 sticky top-0 z-10">
                <TableRow>
                  <TableHead className="min-w-[200px]">NOME</TableHead>
                  <TableHead>STATUS</TableHead>
                  <TableHead>EMAIL</TableHead>
                  <TableHead className="text-right w-[200px]">AÇÕES</TableHead> 
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPlayers.length === 0 ? (
                   <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                        Nenhum player encontrado.
                      </TableCell>
                    </TableRow>
                ) : (
                  filteredPlayers.map((player) => {
                    const statusInfo = getStatusStyles(player.status);
                    return (
                      <TableRow key={player.id} className="hover:bg-muted/20 transition-colors">
                        <TableCell className="font-medium">
                          <Link href={`/profile/${player.appUserId}`} className="flex items-center gap-3 group">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={player.avatarUrl || undefined} alt={player.name} data-ai-hint="player avatar" />
                              <AvatarFallback>{player.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                              <span className="group-hover:text-primary group-hover:underline">{player.name}</span>
                              <div className="text-xs text-muted-foreground">
                                App ID: {player.appUserId} <br />
                                Show ID: {player.kakoShowId || "N/A"}
                              </div>
                            </div>
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-xs ${statusInfo.className}`}>
                            {statusInfo.text}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <a 
                            href={`mailto:${player.email}`}
                            className="text-primary hover:underline"
                          >
                            {player.email}
                          </a>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="outline" size="sm" className="h-8 px-2 text-xs">
                              <Edit className="h-3 w-3 mr-1" />
                              Editar
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="h-8 px-2 text-xs">
                                  Ações
                                  <ChevronDown className="h-3 w-3 ml-1" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem 
                                  className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                                  onSelect={() => handleBanPlayer(player.id)}
                                  disabled={player.status === 'Banido'}
                                >
                                   <XCircle className="mr-2 h-4 w-4" />
                                  Banir Player
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onSelect={() => console.log("Ver detalhes do player", player.id)}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    Ver Detalhes
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => console.log("Resetar senha do player", player.id)}>
                                    <KeyRound className="mr-2 h-4 w-4" />
                                    Resetar Senha
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                                  onSelect={() => handleRequestDeleteAccount(player)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Excluir Conta (Firestore)
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-muted-foreground pt-2">
          <p>Mostrando 1 a {filteredPlayers.length} de {filteredPlayers.length} resultados</p>
          <div className="flex items-center gap-1 mt-2 sm:mt-0">
            <Button variant="outline" size="sm" className="px-2 h-8 w-8" disabled={true}>&lt;</Button>
            <Button variant="default" size="sm" className="px-3 h-8 w-8">1</Button>
            <Button variant="outline" size="sm" className="px-2 h-8 w-8" disabled={true}>&gt;</Button>
          </div>
        </div>
      </div>

      {playerToDelete && (
        <AlertDialog open={isConfirmDeleteDialogOpen} onOpenChange={setIsConfirmDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Você tem certeza que deseja excluir o perfil de <span className="font-semibold">{playerToDelete.name}</span> do Firestore?
                <br />
                <strong className="text-destructive">Esta ação não pode ser desfeita.</strong>
                <br />
                A conta de autenticação do Firebase ainda precisará ser removida manualmente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setIsConfirmDeleteDialogOpen(false)}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDeleteAccount}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              >
                Excluir Perfil (Firestore)
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
