
"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Users, Eye, RefreshCw, UserCircle2, Trash2, Gift as GiftIconLucide, DatabaseZap, ChevronDown, Link as LinkIconLucide } from "lucide-react"; // Added LinkIconLucide
import NextImage from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { KakoProfile } from "@/types";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { db, doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs, writeBatch, Timestamp, updateDoc, orderBy } from "@/lib/firebase";


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
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(true); 
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  
  const [isConfirmClearProfilesDBDialogOpen, setIsConfirmClearProfilesDBDialogOpen] = useState(false); 
  const [isDeletingProfilesDB, setIsDeletingProfilesDB] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState<KakoProfile | null>(null);
  const [isConfirmDeleteSingleProfileDialogOpen, setIsConfirmDeleteSingleProfileDialogOpen] = useState(false);

  const [selectedProfileForDetails, setSelectedProfileForDetails] = useState<KakoProfile | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [linkedAccountsCount, setLinkedAccountsCount] = useState<number | string>('...');
  const [isLoadingLinkedAccounts, setIsLoadingLinkedAccounts] = useState(true);

  const fetchKakoProfilesFromDB = useCallback(async () => {
    setIsLoadingProfiles(true);
    try {
      const profilesCollectionRef = collection(db, "kakoProfiles");
      const q = query(profilesCollectionRef, orderBy("lastFetchedAt", "desc"));
      const querySnapshot = await getDocs(q);
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
          signature: data.signature,
          area: data.area,
          school: data.school,
          roomId: data.roomId,
          isLiving: data.isLiving,
          lastFetchedAt: data.lastFetchedAt,
        });
      });
      setKakoProfiles(fetchedProfiles);
    } catch (error) {
      console.error("Erro ao buscar perfis Kako do Firestore:", error);
      toast({ title: "Erro ao Carregar Perfis", description: "Não foi possível carregar a lista de perfis do banco de dados.", variant: "destructive" });
    } finally {
      setIsLoadingProfiles(false);
    }
  }, [toast]);

  const fetchLinkedAccountsCount = useCallback(async () => {
    setIsLoadingLinkedAccounts(true);
    try {
      const accountsRef = collection(db, "accounts");
      const q = query(accountsRef, where("showId", "!=", "")); // Count accounts with a non-empty showId
      const querySnapshot = await getDocs(q);
      setLinkedAccountsCount(querySnapshot.size);
    } catch (error) {
      console.error("Erro ao buscar contagem de contas vinculadas:", error);
      setLinkedAccountsCount("Erro");
      toast({ title: "Erro ao Carregar Contagem", description: "Não foi possível carregar o total de contas vinculadas.", variant: "destructive" });
    } finally {
      setIsLoadingLinkedAccounts(false);
    }
  }, [toast]);

  const refreshAllData = useCallback(() => {
    fetchKakoProfilesFromDB();
    fetchLinkedAccountsCount();
  }, [fetchKakoProfilesFromDB, fetchLinkedAccountsCount]);

  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);


  const handleConfirmClearProfilesDB = async () => {
    setIsDeletingProfilesDB(true);
    try {
      const querySnapshot = await getDocs(collection(db, "kakoProfiles"));
      if (querySnapshot.empty) {
        toast({ title: "Nada para Apagar", description: "A coleção 'kakoProfiles' já está vazia." });
        setIsConfirmClearProfilesDBDialogOpen(false);
        setIsDeletingProfilesDB(false);
        return;
      }
      const batch = writeBatch(db);
      querySnapshot.docs.forEach((docSnap) => {
        batch.delete(docSnap.ref);
      });
      await batch.commit();
      setKakoProfiles([]); 
      toast({
        title: "Perfis Apagados do DB",
        description: "Todos os perfis foram apagados da coleção 'kakoProfiles' no Firestore.",
      });
    } catch (error) {
      console.error("Erro ao apagar perfis do Firestore:", error);
      toast({ title: "Erro ao Apagar do DB", description: "Não foi possível apagar os perfis.", variant: "destructive" });
    } finally {
      setIsDeletingProfilesDB(false);
      setIsConfirmClearProfilesDBDialogOpen(false);
    }
  };

  const handleRequestDeleteSingleProfile = (profile: KakoProfile) => {
    setProfileToDelete(profile);
    setIsConfirmDeleteSingleProfileDialogOpen(true);
  };

  const handleConfirmDeleteSingleProfile = async () => {
    if (!profileToDelete) return;
    setIsDeletingProfilesDB(true); 
    try {
      await deleteDoc(doc(db, "kakoProfiles", profileToDelete.id));
      setKakoProfiles(prev => prev.filter(p => p.id !== profileToDelete!.id));
      toast({ title: "Perfil Removido", description: `Perfil de ${profileToDelete.nickname} removido do Firestore.` });
    } catch (error) {
      console.error("Erro ao remover perfil do Firestore:", error);
      toast({ title: "Erro ao Remover", description: "Não foi possível remover o perfil.", variant: "destructive" });
    } finally {
      setIsDeletingProfilesDB(false);
      setIsConfirmDeleteSingleProfileDialogOpen(false);
      setProfileToDelete(null);
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
  
  const displayLoadingProfiles = isLoadingProfiles || isLoadingLinkedAccounts;


  return (
    <>
      <div className="space-y-6 h-full flex flex-col p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Perfis Kako Live (do Banco de Dados)</h1>
            <p className="text-sm text-muted-foreground">Perfis Kako Live salvos no Firestore.</p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
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
              <Button variant="outline" onClick={refreshAllData} className="h-10" disabled={isLoadingProfiles || isLoadingLinkedAccounts}>
                 <RefreshCw className="mr-2 h-4 w-4" />
                Atualizar Lista
              </Button>
              <Button variant="destructive" onClick={() => setIsConfirmClearProfilesDBDialogOpen(true)} className="h-10" disabled={isDeletingProfilesDB || kakoProfiles.length === 0}>
                 {isDeletingProfilesDB ? <LoadingSpinner size="sm" className="mr-2"/> : <DatabaseZap className="mr-2 h-4 w-4" />}
                Zerar DB (Perfis)
              </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatCard title="Total de Perfis (DB)" count={isLoadingProfiles ? '...' : kakoProfiles.length} icon={Users} bgColorClass="bg-sky-500/10" textColorClass="text-sky-500" />
          <StatCard title="Total de Perfis Vinculados" count={isLoadingLinkedAccounts ? '...' : linkedAccountsCount} icon={LinkIconLucide} bgColorClass="bg-green-500/10" textColorClass="text-green-500" />
        </div>

        <Card className="flex-grow flex flex-col min-h-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center"><Users className="mr-2 h-5 w-5 text-primary"/> Lista de Perfis do Kako Live (Salvos)</CardTitle>
            <CardDescription>Perfis identificados e salvos na coleção 'kakoProfiles' do Firestore.</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow p-0">
            <div className="overflow-x-auto h-full">
              {displayLoadingProfiles ? (
                <div className="flex justify-center items-center h-full">
                  <LoadingSpinner size="lg" />
                  <p className="ml-2 text-muted-foreground">Carregando dados...</p>
                </div>
              ) : (
              <Table>
                <TableHeader className="bg-muted/50 sticky top-0 z-10">
                  <TableRow>
                    <TableHead className="w-[60px] px-4"></TableHead> 
                    <TableHead className="min-w-[200px]">NICKNAME / SHOW ID</TableHead>
                    <TableHead>NÍVEL</TableHead>
                    <TableHead>USER ID (FUID)</TableHead>
                    <TableHead className="text-right w-[200px]">AÇÕES</TableHead>
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
                              {profile.showId && <div className="text-xs text-muted-foreground">Show ID: {profile.showId}</div>}
                            </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">
                            Nível {profile.level || "N/A"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground font-mono">{profile.id}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                             <Button variant="outline" size="sm" className="h-8 px-2 text-xs" onClick={() => handleShowDetails(profile)}>
                                <Eye className="mr-1.5 h-3 w-3" /> Detalhes
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="h-8 px-2 text-xs">
                                  Ações <ChevronDown className="ml-1.5 h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onSelect={() => alert('Sincronizar dados do perfil: ' + profile.nickname)}>
                                  Sincronizar Dados
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                    className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                                    onClick={() => handleRequestDeleteSingleProfile(profile)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" /> Remover do DB
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              )}
            </div>
          </CardContent>
           <CardFooter className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">Mostrando {filteredProfiles.length} de {kakoProfiles.length} perfis salvos.</p>
          </CardFooter>
        </Card>
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
            <ScrollArea className="max-h-[60vh] pr-2">
                <div className="grid gap-3 py-4 text-sm">
                  <div className="grid grid-cols-[120px_1fr] items-center gap-2">
                    <span className="font-medium text-muted-foreground">User ID (FUID):</span>
                    <span className="break-all font-mono text-xs">{selectedProfileForDetails.id}</span>
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
                    <span className="font-medium text-muted-foreground">Na Live:</span>
                    <span>{selectedProfileForDetails.isLiving === true ? "Sim" : selectedProfileForDetails.isLiving === false ? "Não" : "N/A"}</span>
                  </div>
                   <div className="grid grid-cols-[120px_1fr] items-center gap-2">
                    <span className="font-medium text-muted-foreground">Room ID:</span>
                    <span>{selectedProfileForDetails.roomId || "N/A"}</span>
                  </div>
                  <div className="grid grid-cols-[120px_1fr] items-start gap-2">
                    <span className="font-medium text-muted-foreground">Assinatura (Bio):</span>
                    <span className="break-words">{selectedProfileForDetails.signature || "N/A"}</span>
                  </div>
                  <div className="grid grid-cols-[120px_1fr] items-center gap-2">
                    <span className="font-medium text-muted-foreground">Área:</span>
                    <span>{selectedProfileForDetails.area || "N/A"}</span>
                  </div>
                   <div className="grid grid-cols-[120px_1fr] items-center gap-2">
                    <span className="font-medium text-muted-foreground">Escola:</span>
                    <span>{selectedProfileForDetails.school || "N/A"}</span>
                  </div>
                  <div className="grid grid-cols-[120px_1fr] items-center gap-2">
                    <span className="font-medium text-muted-foreground">Visto pela Última Vez:</span>
                    <span>
                        {selectedProfileForDetails.lastFetchedAt instanceof Timestamp 
                          ? format(selectedProfileForDetails.lastFetchedAt.toDate(), "dd/MM/yyyy HH:mm:ss", { locale: ptBR }) 
                          : selectedProfileForDetails.lastFetchedAt instanceof Date
                            ? format(selectedProfileForDetails.lastFetchedAt, "dd/MM/yyyy HH:mm:ss", { locale: ptBR })
                            : 'N/A'
                        }
                    </span>
                  </div>
                   <div className="grid grid-cols-[120px_1fr] items-start gap-2">
                    <span className="font-medium text-muted-foreground">Avatar URL:</span>
                    <span className="break-all text-xs">{selectedProfileForDetails.avatarUrl || "N/A"}</span>
                  </div>
                </div>
            </ScrollArea>
            <DialogFooter className="mt-2 pt-4 border-t">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Fechar
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <AlertDialog open={isConfirmClearProfilesDBDialogOpen} onOpenChange={setIsConfirmClearProfilesDBDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">Confirmar Zerar Banco de Dados (Perfis)!</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem certeza que deseja apagar <strong className="text-destructive">TODOS</strong> os perfis da coleção 'kakoProfiles' no Firestore?
              <br />
              <strong className="text-destructive uppercase">Esta ação é irreversível e apagará os dados permanentemente do banco de dados.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsConfirmClearProfilesDBDialogOpen(false)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmClearProfilesDB}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              disabled={isDeletingProfilesDB}
            >
              {isDeletingProfilesDB ? <LoadingSpinner size="sm" className="mr-2"/> : null}
              Zerar Banco de Dados (Perfis)
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isConfirmDeleteSingleProfileDialogOpen} onOpenChange={setIsConfirmDeleteSingleProfileDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Remoção de Perfil</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem certeza que deseja remover o perfil de <span className="font-semibold">{profileToDelete?.nickname}</span> do banco de dados 'kakoProfiles'?
              <br />
              <strong className="text-destructive uppercase">Esta ação é irreversível.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setIsConfirmDeleteSingleProfileDialogOpen(false); setProfileToDelete(null);}}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteSingleProfile}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              disabled={isDeletingProfilesDB}
            >
              {isDeletingProfilesDB ? <LoadingSpinner size="sm" className="mr-2"/> : null}
              Remover Perfil do DB
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}


    