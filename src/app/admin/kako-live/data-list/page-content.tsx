
"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Users, Eye, RefreshCw, UserCircle2, Trash2, Gift as GiftIcon } from "lucide-react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import type { KakoProfile, KakoGift } from "@/types";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { db, doc, getDoc, setDoc, updateDoc, serverTimestamp, collection, query, where, getDocs, writeBatch } from "@/lib/firebase";

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

const placeholderKakoGifts: KakoGift[] = [
  { id: "40", name: "Miau", imageUrl: "https://godzilla-live-oss.kako.live/gift/luck_maotou_250320.png", diamond: 1, display: true },
  { id: "1", name: "Amor", imageUrl: "https://godzilla-live-oss.kako.live/gift/luck_aixin.png", diamond: 1, display: true },
  { id: "26", name: "Rosas", imageUrl: "https://godzilla-live-oss.kako.live/gift/luck_meiguihua250211.png", diamond: 2, display: true },
  { id: "46", name: "Sol", imageUrl: "https://godzilla-live-oss.kako.live/gift/luck_zao_250426.png", diamond: 5, display: true },
  { id: "31", name: "Sorvete", imageUrl: "https://godzilla-live-oss.kako.live/gift/luck_bingqiling_250314.png", diamond: 5, display: true },
  { id: "23", name: "Árvore", imageUrl: "https://godzilla-live-oss.kako.live/gift/luck_shengdanshu.png", diamond: 10, display: true },
  { id: "32", name: "Música", imageUrl: "https://godzilla-live-oss.kako.live/gift/luck_yinfu_250314.png", diamond: 19, display: true },
];


export default function AdminKakoLiveDataListPageContent() {
  const [kakoProfiles, setKakoProfiles] = useState<KakoProfile[]>([]);
  const [kakoGifts, setKakoGifts] = useState<KakoGift[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  
  const [isConfirmClearListDialogOpen, setIsConfirmClearListDialogOpen] = useState(false);
  const [isConfirmClearDBDialogOpen, setIsConfirmClearDBDialogOpen] = useState(false); 
  const [isDeletingDB, setIsDeletingDB] = useState(false);

  const [selectedProfileForDetails, setSelectedProfileForDetails] = useState<KakoProfile | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const socketRef = useRef<WebSocket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<string>("Desconectado");
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const isManuallyDisconnectingRef = useRef(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [wsUrl, setWsUrl] = useState<string>("wss://h5-ws.kako.live/ws/v1?roomId=67b9ed5fa4e716a084a23765"); // Example Room ID


  const upsertKakoProfileToFirestore = useCallback(async (profileData: KakoProfile) => {
    if (!profileData.id) {
      console.error("Cannot upsert profile without an ID (FUID)", profileData);
      return;
    }
    const profileDocRef = doc(db, "kakoProfiles", profileData.id);
    try {
      const docSnap = await getDoc(profileDocRef);
      const dataToSave: KakoProfile = {
        ...profileData, // Spread incoming data first
        id: profileData.id, // Ensure id is correctly set (should be FUID)
        nickname: profileData.nickname || "N/A",
        avatarUrl: profileData.avatarUrl || "",
        level: profileData.level,
        numId: profileData.numId,
        showId: profileData.showId,
        gender: profileData.gender,
        lastFetchedAt: serverTimestamp(),
      };

      if (docSnap.exists()) {
        const existingData = docSnap.data() as KakoProfile;
        let hasChanges = false;
        const updates: Partial<KakoProfile> = { lastFetchedAt: serverTimestamp() };

        if (dataToSave.nickname !== existingData.nickname) { updates.nickname = dataToSave.nickname; hasChanges = true; }
        if (dataToSave.avatarUrl !== existingData.avatarUrl) { updates.avatarUrl = dataToSave.avatarUrl; hasChanges = true; }
        if (dataToSave.level !== existingData.level) { updates.level = dataToSave.level; hasChanges = true; }
        if (dataToSave.showId !== existingData.showId) { updates.showId = dataToSave.showId; hasChanges = true; }
        if (dataToSave.numId !== existingData.numId) { updates.numId = dataToSave.numId; hasChanges = true; }
        if (dataToSave.gender !== existingData.gender) { updates.gender = dataToSave.gender; hasChanges = true; }
        
        if (hasChanges) {
          await updateDoc(profileDocRef, updates);
          toast({ title: "Perfil Kako Atualizado", description: `Perfil de ${dataToSave.nickname} atualizado no Firestore.` });
        } else {
           await updateDoc(profileDocRef, { lastFetchedAt: serverTimestamp() });
        }
      } else {
        await setDoc(profileDocRef, dataToSave);
        toast({ title: "Novo Perfil Kako Salvo", description: `Perfil de ${dataToSave.nickname} salvo no Firestore.` });
      }
    } catch (error) {
      console.error("Erro ao salvar/atualizar perfil Kako no Firestore:", error);
      toast({ title: "Erro no Firestore", description: `Não foi possível salvar/atualizar ${profileData.nickname}.`, variant: "destructive" });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast]);


  const connectWebSocket = useCallback(() => {
     // WebSocket connection logic remains the same as in "Atualizar Dados (Chat)"
     // but instead of directly calling upsertKakoProfileToFirestore, it will update local state.
     // The upsert function will be called when "Salvar no DB" is triggered for selected items, or automatically.
      if (socketRef.current && (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING)) {
        return;
      }
      isManuallyDisconnectingRef.current = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      setConnectionStatus(`Conectando a ${wsUrl}...`);
      setErrorDetails(null);

      try {
        const newSocket = new WebSocket(wsUrl);
        socketRef.current = newSocket;

        newSocket.onopen = () => {
          setConnectionStatus(`Conectado a ${wsUrl}`);
          toast({ title: "WebSocket Conectado", description: `Conexão com ${wsUrl} estabelecida.` });
        };

        newSocket.onmessage = async (event) => {
          let messageContentString = "";
           try {
            if (event.data instanceof Blob) {
                messageContentString = await event.data.text();
            } else if (typeof event.data === 'string') {
                messageContentString = event.data;
            } else {
                messageContentString = JSON.stringify(event.data);
            }

            const firstBrace = messageContentString.indexOf('{');
            const lastBrace = messageContentString.lastIndexOf('}');
            if (firstBrace !== -1 && lastBrace > firstBrace) {
                const jsonStr = messageContentString.substring(firstBrace, lastBrace + 1);
                const parsedJson = JSON.parse(jsonStr);

                if (parsedJson.user && parsedJson.user.userId) {
                    const userData = parsedJson.user;
                    const profileData: KakoProfile = {
                        id: userData.userId,
                        nickname: userData.nickname || "N/A",
                        avatarUrl: userData.avatar || userData.avatarUrl || "",
                        level: userData.level,
                        numId: userData.numId,
                        showId: userData.showId,
                        gender: userData.gender,
                        lastFetchedAt: new Date() // For local display, update when saving to FS
                    };
                    
                    setKakoProfiles(prevProfiles => {
                        const existingProfileIndex = prevProfiles.findIndex(p => p.id === profileData.id);
                        if (existingProfileIndex !== -1) {
                            const updatedProfiles = [...prevProfiles];
                            updatedProfiles[existingProfileIndex] = { ...updatedProfiles[existingProfileIndex], ...profileData, lastFetchedAt: new Date() };
                            return updatedProfiles;
                        }
                        return [...prevProfiles, profileData];
                    });
                    await upsertKakoProfileToFirestore(profileData); 
                }
            }
          } catch (e) {
            console.error("Erro ao processar mensagem WebSocket:", e, "Dados brutos:", messageContentString);
          }
        };

        newSocket.onerror = (errorEvent) => {
          const errorMsg = `Erro na conexão WebSocket: ${errorEvent.type || 'Tipo de erro desconhecido'}`;
          setConnectionStatus("Erro na Conexão");
          setErrorDetails(errorMsg);
          toast({ title: "Erro WebSocket", description: errorMsg, variant: "destructive" });
        };

        newSocket.onclose = (closeEvent) => {
          let closeMsg = `Desconectado de ${newSocket.url}.`;
          if (closeEvent.code || closeEvent.reason) {
            closeMsg += ` Código: ${closeEvent.code}, Motivo: ${closeEvent.reason || 'N/A'}`;
          }
          
          if (socketRef.current === newSocket) { 
              if (!isManuallyDisconnectingRef.current) {
                  setConnectionStatus("Desconectado - Tentando Reconectar...");
                  toast({ title: "WebSocket Desconectado", description: "Tentando reconectar em 5 segundos."});
                  socketRef.current = null; 
                  reconnectTimeoutRef.current = setTimeout(connectWebSocket, 5000);
              } else {
                  setConnectionStatus("Desconectado");
                   toast({ title: "WebSocket Desconectado", description: "Desconexão manual."});
                  socketRef.current = null; 
              }
          }
        };
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : "Erro desconhecido ao tentar conectar.";
        setConnectionStatus("Erro ao Iniciar Conexão");
        setErrorDetails(errMsg);
        toast({ title: "Falha ao Conectar WebSocket", description: errMsg, variant: "destructive" });
      }
    };
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [wsUrl, upsertKakoProfileToFirestore, toast]);

  const disconnectWebSocket = useCallback(() => {
    isManuallyDisconnectingRef.current = true;
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (socketRef.current) {
      socketRef.current.onopen = null;
      socketRef.current.onmessage = null;
      socketRef.current.onerror = null;
      socketRef.current.onclose = null;
      socketRef.current.close();
      // socketRef.current = null; // Let onclose handle this
    }
  }, []);

  useEffect(() => {
    setKakoGifts(placeholderKakoGifts); // Load placeholder gifts
    connectWebSocket(); // Attempt to connect WebSocket on mount

    return () => {
      disconnectWebSocket();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency for mount/unmount

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
      setKakoProfiles([]); 
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
  
  // Use isLoading for initial load, not for WebSocket connecting state here
  // The page can be usable even if WebSocket is reconnecting
  const displayLoading = isLoading && kakoProfiles.length === 0;


  return (
    <>
      <div className="space-y-6 h-full flex flex-col p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Lista de Perfis (Tempo Real via Chat)</h1>
            <p className="text-sm text-muted-foreground">Perfis Kako Live identificados em tempo real via WebSocket e salvos no Firestore.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Conexão WebSocket: <span className={connectionStatus.startsWith("Conectado") ? "text-green-500" : "text-destructive"}>{connectionStatus}</span>
            </p>
            {errorDetails && <p className="text-xs text-destructive">Erro: {errorDetails}</p>}
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-grow sm:flex-grow-0 sm:min-w-[280px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar perfis (Nome, ID, Show ID...)"
                  className="pl-10 w-full h-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" onClick={() => { disconnectWebSocket(); setTimeout(connectWebSocket, 100); }} className="h-10">
                 <RefreshCw className="mr-2 h-4 w-4" />
                Reconectar WS
              </Button>
              <Button variant="outline" onClick={() => setIsConfirmClearListDialogOpen(true)} className="h-10" disabled={kakoProfiles.length === 0}>
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
          <StatCard title="Total de Perfis Identificados (Nesta Sessão)" count={kakoProfiles.length} icon={Users} bgColorClass="bg-sky-500/10" textColorClass="text-sky-500" />
        </div>

        <div className="flex-grow rounded-lg border overflow-hidden shadow-sm bg-card">
          <div className="overflow-x-auto h-full">
            {displayLoading ? (
              <div className="flex justify-center items-center h-full">
                <LoadingSpinner size="lg" />
                <p className="ml-2 text-muted-foreground">Carregando perfis do banco de dados...</p>
              </div>
            ) : (
            <Table>
              <TableHeader className="bg-muted/50 sticky top-0 z-10">
                <TableRow>
                  <TableHead className="w-[60px] px-4"></TableHead> {/* Avatar */}
                  <TableHead className="min-w-[150px]">NICKNAME / SHOW ID</TableHead>
                  <TableHead>NÍVEL</TableHead>
                  <TableHead>USER ID (FUID)</TableHead>
                  <TableHead className="text-right w-[150px]">AÇÕES</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProfiles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      Nenhum perfil encontrado ou identificado via chat ainda.
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
                            <Eye className="h-3 w-3 mr-1" />
                            Detalhes
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-muted-foreground pt-2">
          <p>Mostrando {filteredProfiles.length} de {kakoProfiles.length} perfis identificados</p>
        </div>
      </div>

      {/* Details Dialog */}
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
                Informações detalhadas do perfil Kako Live identificadas via WebSocket e salvas no Firestore.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 text-sm">
              <div className="grid grid-cols-[120px_1fr] items-center gap-2">
                <span className="font-medium text-muted-foreground">User ID (FUID):</span>
                <span className="break-all font-mono">{selectedProfileForDetails.id}</span>
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
                <span className="font-medium text-muted-foreground">Visto pela Última Vez:</span>
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

      {/* Clear List Dialog */}
      <AlertDialog open={isConfirmClearListDialogOpen} onOpenChange={setIsConfirmClearListDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Limpar Tela</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem certeza que deseja limpar todos os perfis da visualização atual? Esta ação é apenas local e não afeta o banco de dados.
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

      {/* Clear DB Dialog */}
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

