
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Users, Eye, RefreshCw, UserCircle2, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuChevron, // Assuming this exists for sub-menus, if not, ChevronDown
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import type { KakoProfile } from "@/types";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { db, getDocs, collection, writeBatch, query, doc, deleteDoc } from "@/lib/firebase"; // Added deleteDoc

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

export default function AdminKakoLiveDataListPageContent() {
  const [kakoProfiles, setKakoProfiles] = useState<KakoProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const [profileToRemove, setProfileToRemove] = useState<KakoProfile | null>(null); // For local remove
  const [isConfirmRemoveDialogOpen, setIsConfirmRemoveDialogOpen] = useState(false);
  const [isConfirmClearListDialogOpen, setIsConfirmClearListDialogOpen] = useState(false); // For clear local
  const [isConfirmClearDBDialogOpen, setIsConfirmClearDBDialogOpen] = useState(false); // For clear DB
  const [isDeletingDB, setIsDeletingDB] = useState(false);

  const [selectedProfileForDetails, setSelectedProfileForDetails] = useState<KakoProfile | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const fetchKakoProfiles = useCallback(async () => {
    setIsLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "kakoProfiles"));
      const fetchedProfiles: KakoProfile[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        fetchedProfiles.push({
          id: docSnap.id,
          nickname: data.nickname || "N/A",
          avatarUrl: data.avatar || data.avatarUrl || "",
          level: data.level,
          numId: data.numId,
          showId: data.showId,
          gender: data.gender,
          lastFetchedAt: data.lastFetchedAt?.toDate ? data.lastFetchedAt.toDate() : (data.lastFetchedAt || null),
        });
      });
      setKakoProfiles(fetchedProfiles);
    } catch (error) {
      console.error("Erro ao buscar perfis Kako do Firestore:", error);
      toast({ title: "Erro ao Buscar Dados", description: "Não foi possível carregar os perfis do banco de dados.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchKakoProfiles();
  }, [fetchKakoProfiles]);

  const handleRequestRemoveProfileLocal = (profile: KakoProfile) => {
    setProfileToRemove(profile);
    setIsConfirmRemoveDialogOpen(true);
  };

  const handleConfirmRemoveProfileLocal = () => {
    if (!profileToRemove) return;
    setKakoProfiles(prevProfiles => prevProfiles.filter(p => p.id !== profileToRemove.id));
    toast({
      title: "Perfil Removido da Lista",
      description: `O perfil de ${profileToRemove.nickname} foi removido da visualização atual (localmente).`,
    });
    setIsConfirmRemoveDialogOpen(false);
    setProfileToRemove(null);
  };

  const handleConfirmClearListLocal = () => {
    setKakoProfiles([]);
    toast({
      title: "Lista Limpa (Local)",
      description: "Todos os perfis foram removidos da visualização atual.",
    });
    setIsConfirmClearListDialogOpen(false);
  };

  const handleConfirmClearAllFromDB = async () => {
    setIsDeletingDB(true);
    try {
      const querySnapshot = await getDocs(collection(db, "kakoProfiles"));
      if (querySnapshot.empty) {
        toast({ title: "Nada para Apagar", description: "A coleção 'kakoProfiles' já está vazia." });
        setIsConfirmClearDBDialogOpen(false);
        setIsDeletingDB(false);
        return;
      }
      const batch = writeBatch(db);
      querySnapshot.docs.forEach((docSnap) => {
        batch.delete(docSnap.ref);
      });
      await batch.commit();
      setKakoProfiles([]); // Clear local list as well
      toast({
        title: "Perfis Apagados do DB",
        description: "Todos os perfis foram apagados da coleção 'kakoProfiles' no Firestore.",
      });
    } catch (error) {
      console.error("Erro ao apagar perfis do Firestore:", error);
      toast({ title: "Erro ao Apagar do DB", description: "Não foi possível apagar os perfis do banco de dados.", variant: "destructive" });
    } finally {
      setIsDeletingDB(false);
      setIsConfirmClearDBDialogOpen(false);
    }
  };

  const handleShowDetails = (profile: KakoProfile) => {
    setSelectedProfileForDetails(profile);
    setIsDetailModalOpen(true);
  };

  const filteredProfiles = kakoProfiles.filter(profile =>
    profile.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (profile.showId && profile.showId.toLowerCase().includes(searchTerm.toLowerCase())) || 
    (profile.numId && profile.numId.toString().includes(searchTerm)) 
  );

  if (isLoading && !isDeletingDB) {
    return (
      <div className="flex justify-center items-center h-full p-6">
        <LoadingSpinner size="lg" />
        <p className="ml-2 text-muted-foreground">Carregando perfis do banco de dados...</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6 h-full flex flex-col p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Lista de Perfis Salvos (Banco de Dados)</h1>
            <p className="text-sm text-muted-foreground">Perfis Kako Live identificados e salvos no Firestore.</p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-grow sm:flex-grow-0 sm:min-w-[280px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar perfis (Nome, ID Kako, Show ID...)"
                  className="pl-10 w-full h-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" onClick={fetchKakoProfiles} className="h-10" disabled={isLoading}>
                 <RefreshCw className="mr-2 h-4 w-4" />
                Atualizar Lista
              </Button>
              <Button variant="outline" onClick={() => setIsConfirmClearListDialogOpen(true)} className="h-10">
                 <Trash2 className="mr-2 h-4 w-4" />
                Limpar Tela
              </Button>
              <Button variant="destructive" onClick={() => setIsConfirmClearDBDialogOpen(true)} className="h-10" disabled={isDeletingDB}>
                 {isDeletingDB ? <LoadingSpinner size="sm" className="mr-2"/> : <Trash2 className="mr-2 h-4 w-4" />}
                Zerar DB
              </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-1 gap-4">
          <StatCard title="Total de Perfis Salvos no DB" count={kakoProfiles.length} icon={Users} bgColorClass="bg-sky-500/10" textColorClass="text-sky-500" />
        </div>

        <div className="flex-grow rounded-lg border overflow-hidden shadow-sm bg-card">
          <div className="overflow-x-auto h-full">
            <Table>
              <TableHeader className="bg-muted/50 sticky top-0 z-10">
                <TableRow>
                  <TableHead className="w-[60px] px-4"></TableHead> {/* Avatar */}
                  <TableHead className="min-w-[150px]">NICKNAME / SHOW ID</TableHead>
                  <TableHead>NÍVEL</TableHead>
                  <TableHead>USER ID (FUID)</TableHead>
                  <TableHead className="text-right w-[250px]">AÇÕES</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProfiles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      Nenhum perfil encontrado no banco de dados.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProfiles.map((profile) => (
                    <TableRow key={profile.id} className="hover:bg-muted/20 transition-colors">
                      <TableCell className="px-4">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={profile.avatarUrl || undefined} alt={profile.nickname} data-ai-hint="user avatar" />
                          <AvatarFallback>
                              {profile.nickname ? profile.nickname.substring(0,2).toUpperCase() : <UserCircle2 />}
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-medium">
                          <div>
                            <span className="text-foreground">{profile.nickname}</span>
                            {profile.isLiving && <span className="ml-2 h-2 w-2 rounded-full inline-block bg-green-500" title="Online"></span>}
                            {profile.showId && <div className="text-xs text-muted-foreground">Show ID: {profile.showId}</div>}
                          </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          Nível {profile.level || "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{profile.id}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="outline" size="sm" className="h-8 px-2 text-xs" onClick={() => handleShowDetails(profile)}>
                            <Eye className="h-3 w-3 mr-1" />
                            Detalhes
                          </Button>
                          {/* Placeholder for other actions if needed */}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-muted-foreground pt-2">
          <p>Mostrando 1 a {filteredProfiles.length} de {filteredProfiles.length} resultados</p>
          <div className="flex items-center gap-1 mt-2 sm:mt-0">
            <Button variant="outline" size="sm" className="px-2 h-8 w-8" disabled={true}>&lt;</Button>
            <Button variant="default" size="sm" className="px-3 h-8 w-8">1</Button>
            <Button variant="outline" size="sm" className="px-2 h-8 w-8" disabled={true}>&gt;</Button>
          </div>
        </div>
      </div>

      {selectedProfileForDetails && (
        <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Avatar className="h-10 w-10 mr-3 border">
                    <AvatarImage src={selectedProfileForDetails.avatarUrl} alt={selectedProfileForDetails.nickname} data-ai-hint="user avatar" />
                    <AvatarFallback>
                        {selectedProfileForDetails.nickname ? selectedProfileForDetails.nickname.substring(0,2).toUpperCase() : <UserCircle2 />}
                    </AvatarFallback>
                </Avatar>
                Detalhes de: {selectedProfileForDetails.nickname}
              </DialogTitle>
              <DialogDescription>
                Informações detalhadas do perfil Kako Live salvas no Firestore.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 text-sm">
              <div className="grid grid-cols-[120px_1fr] items-center gap-2">
                <span className="font-medium text-muted-foreground">User ID (FUID):</span>
                <span className="break-all">{selectedProfileForDetails.id}</span>
              </div>
              <div className="grid grid-cols-[120px_1fr] items-center gap-2">
                <span className="font-medium text-muted-foreground">Nickname:</span>
                <span>{selectedProfileForDetails.nickname}</span>
              </div>
              <div className="grid grid-cols-[120px_1fr] items-center gap-2">
                <span className="font-medium text-muted-foreground">Show ID:</span>
                <span>{selectedProfileForDetails.showId || "N/A"}</span>
              </div>
              <div className="grid grid-cols-[120px_1fr] items-center gap-2">
                <span className="font-medium text-muted-foreground">Nível:</span>
                <span>{selectedProfileForDetails.level || "N/A"}</span>
              </div>
              <div className="grid grid-cols-[120px_1fr] items-center gap-2">
                <span className="font-medium text-muted-foreground">Num ID:</span>
                <span>{selectedProfileForDetails.numId || "N/A"}</span>
              </div>
              <div className="grid grid-cols-[120px_1fr] items-center gap-2">
                <span className="font-medium text-muted-foreground">Gênero:</span>
                <span>{selectedProfileForDetails.gender === 1 ? "Masculino" : selectedProfileForDetails.gender === 2 ? "Feminino" : "N/A"}</span>
              </div>
              <div className="grid grid-cols-[120px_1fr] items-center gap-2">
                <span className="font-medium text-muted-foreground">Salvo/Atualizado em:</span>
                <span>{selectedProfileForDetails.lastFetchedAt ? format(new Date(selectedProfileForDetails.lastFetchedAt), "dd/MM/yyyy HH:mm:ss", { locale: ptBR }) : "N/A"}</span>
              </div>
               <div className="grid grid-cols-[120px_1fr] items-start gap-2">
                <span className="font-medium text-muted-foreground">Avatar URL:</span>
                <span className="break-all text-xs">{selectedProfileForDetails.avatarUrl || "N/A"}</span>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Fechar
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {profileToRemove && ( // This dialog is for removing from local list - might be less relevant now.
        <AlertDialog open={isConfirmRemoveDialogOpen} onOpenChange={setIsConfirmRemoveDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Remoção da Tela</AlertDialogTitle>
              <AlertDialogDescription>
                Você tem certeza que deseja remover o perfil de <span className="font-semibold">{profileToRemove.nickname}</span> da visualização atual? Esta ação é apenas local.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setIsConfirmRemoveDialogOpen(false)}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmRemoveProfileLocal}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              >
                Remover da Tela
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      <AlertDialog open={isConfirmClearListDialogOpen} onOpenChange={setIsConfirmClearListDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Limpar Tela</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem certeza que deseja limpar todos os perfis da visualização atual? Clique em "Atualizar Lista" para recarregar do banco de dados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsConfirmClearListDialogOpen(false)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmClearListLocal}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Limpar Tela
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isConfirmClearDBDialogOpen} onOpenChange={setIsConfirmClearDBDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">Confirmar Zerar Banco de Dados!</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem certeza que deseja apagar <strong className="text-destructive">TODOS</strong> os perfis da coleção 'kakoProfiles' no Firestore?
              <br />
              <strong className="text-destructive uppercase">Esta ação é irreversível e apagará os dados permanentemente do banco de dados.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsConfirmClearDBDialogOpen(false)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmClearAllFromDB}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              disabled={isDeletingDB}
            >
              {isDeletingDB ? <LoadingSpinner size="sm" className="mr-2"/> : null}
              Zerar Banco de Dados
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
