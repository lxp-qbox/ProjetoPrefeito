
"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Users, Wifi, Edit, ChevronDown, Eye, RefreshCw, UserCircle2, Trash2, PlugZap, XCircle } from "lucide-react";
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

const WS_URL = "wss://h5-ws.kako.live/ws/v1?roomId=67b9ed5fa4e716a084a23765"; // Hardcoded for example

export default function AdminKakoLiveDataListPageContent() {
  const [kakoProfiles, setKakoProfiles] = useState<KakoProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false); // Used for connect/disconnect
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const [profileToRemove, setProfileToRemove] = useState<KakoProfile | null>(null);
  const [isConfirmRemoveDialogOpen, setIsConfirmRemoveDialogOpen] = useState(false);
  const [isConfirmClearListDialogOpen, setIsConfirmClearListDialogOpen] = useState(false);

  const [selectedProfileForDetails, setSelectedProfileForDetails] = useState<KakoProfile | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const socketRef = useRef<WebSocket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<string>("Desconectado");
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  const connectWebSocket = useCallback(() => {
    if (socketRef.current && (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING)) {
      toast({ title: "Conexão Existente", description: "Já conectado ou conectando ao WebSocket.", variant: "default" });
      return;
    }
    setIsLoading(true);
    setConnectionStatus(`Conectando a ${WS_URL}...`);
    setErrorDetails(null);

    try {
      const newSocket = new WebSocket(WS_URL);
      socketRef.current = newSocket;

      newSocket.onopen = () => {
        setIsLoading(false);
        setConnectionStatus(`Conectado a ${WS_URL}`);
        toast({ title: "WebSocket Conectado!", description: `Conexão com ${WS_URL} estabelecida.` });
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
              const newProfile: KakoProfile = {
                id: userData.userId, // This is the FUID
                nickname: userData.nickname || "N/A",
                avatarUrl: userData.avatar || userData.avatarUrl || "",
                level: userData.level,
                numId: userData.numId,
                showId: userData.showId, // Capture showId
                gender: userData.gender,
                lastFetchedAt: new Date(), // Indicate when this user was "seen"
              };

              setKakoProfiles(prevProfiles => {
                const existingProfileIndex = prevProfiles.findIndex(p => p.id === newProfile.id);
                if (existingProfileIndex > -1) {
                  const updatedProfiles = [...prevProfiles];
                  updatedProfiles[existingProfileIndex] = {
                    ...updatedProfiles[existingProfileIndex],
                    ...newProfile, // Update with latest info
                  };
                  return updatedProfiles;
                } else {
                  return [...prevProfiles, newProfile];
                }
              });
            }
          }
        } catch (e) {
          console.error("Erro ao processar mensagem WebSocket:", e, "Dados brutos:", messageContentString);
        }
      };

      newSocket.onerror = (errorEvent) => {
        setIsLoading(false);
        const errorMsg = `Erro na conexão WebSocket: ${errorEvent.type || 'Tipo de erro desconhecido'}`;
        setConnectionStatus("Erro na Conexão");
        setErrorDetails(errorMsg);
        toast({ title: "Erro de Conexão WebSocket", description: errorMsg, variant: "destructive" });
      };

      newSocket.onclose = (closeEvent) => {
        setIsLoading(false);
        let closeMsg = `Desconectado de ${newSocket.url}.`;
        if (closeEvent.code || closeEvent.reason) {
          closeMsg += ` Código: ${closeEvent.code}, Motivo: ${closeEvent.reason || 'N/A'}`;
        }
        setConnectionStatus("Desconectado");
        if (socketRef.current === newSocket) { // Only show toast if this is the active socket closing
            toast({ title: "WebSocket Desconectado", description: closeMsg });
            socketRef.current = null;
        }
      };
    } catch (error) {
      setIsLoading(false);
      const errMsg = error instanceof Error ? error.message : "Erro desconhecido ao tentar conectar.";
      setConnectionStatus("Erro ao Iniciar Conexão");
      setErrorDetails(errMsg);
      toast({ title: "Falha ao Conectar WebSocket", description: errMsg, variant: "destructive" });
    }
  }, [toast]);

  const disconnectWebSocket = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.onopen = null;
      socketRef.current.onmessage = null;
      socketRef.current.onerror = null;
      socketRef.current.onclose = null;
      socketRef.current.close();
      socketRef.current = null;
      setConnectionStatus("Desconectado");
      toast({ title: "WebSocket Desconectado Manualmente" });
    } else {
      toast({ title: "Já Desconectado", description: "Nenhuma conexão WebSocket ativa para desconectar." });
    }
  }, [toast]);

  useEffect(() => {
    connectWebSocket(); // Connect on mount
    return () => {
      disconnectWebSocket(); // Disconnect on unmount
    };
  }, [connectWebSocket, disconnectWebSocket]);

  const handleRequestRemoveProfile = (profile: KakoProfile) => {
    setProfileToRemove(profile);
    setIsConfirmRemoveDialogOpen(true);
  };

  const handleConfirmRemoveProfile = () => {
    if (!profileToRemove) return;
    setKakoProfiles(prevProfiles => prevProfiles.filter(p => p.id !== profileToRemove.id));
    toast({
      title: "Perfil Removido",
      description: `O perfil de ${profileToRemove.nickname} foi removido da lista atual.`,
    });
    setIsConfirmRemoveDialogOpen(false);
    setProfileToRemove(null);
  };

  const handleConfirmClearListLocal = () => {
    setKakoProfiles([]);
    toast({
      title: "Lista Limpa",
      description: "Todos os perfis foram removidos da visualização atual.",
    });
    setIsConfirmClearListDialogOpen(false);
  };

  const handleShowDetails = (profile: KakoProfile) => {
    setSelectedProfileForDetails(profile);
    setIsDetailModalOpen(true);
  };

  const filteredProfiles = kakoProfiles.filter(profile =>
    profile.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.id.toLowerCase().includes(searchTerm.toLowerCase()) || // FUID search
    (profile.showId && profile.showId.toLowerCase().includes(searchTerm.toLowerCase())) || // showId search
    (profile.numId && profile.numId.toString().includes(searchTerm)) // numId search
  );

  return (
    <>
      <div className="space-y-6 h-full flex flex-col p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Lista de Perfis (Tempo Real via Chat)</h1>
            <p className="text-sm text-muted-foreground">Usuários identificados nas mensagens do chat do RoomID: {WS_URL.split('roomId=')[1]}.</p>
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
              <Button variant="outline" onClick={() => setIsConfirmClearListDialogOpen(true)} className="h-10">
                 <Trash2 className="mr-2 h-4 w-4" />
                Limpar Lista (Local)
              </Button>
          </div>
        </div>

        <div className="space-y-2">
            <div className="flex items-center gap-2">
                 <Button onClick={connectWebSocket} disabled={isLoading || (socketRef.current?.readyState === WebSocket.OPEN)}>
                    <PlugZap className="mr-2 h-4 w-4"/> {socketRef.current?.readyState === WebSocket.OPEN ? 'Conectado' : 'Conectar WebSocket'}
                 </Button>
                 <Button onClick={disconnectWebSocket} variant="outline" disabled={!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN}>
                    <XCircle className="mr-2 h-4 w-4"/> Desconectar
                 </Button>
            </div>
            <p className="text-xs p-2 bg-muted rounded-md">Status: <span className={connectionStatus.startsWith("Conectado") ? "text-green-600" : connectionStatus.startsWith("Erro") ? "text-destructive" : "text-muted-foreground"}>{connectionStatus}</span></p>
            {errorDetails && <p className="text-xs text-destructive p-2 bg-destructive/10 rounded-md">Detalhes do Erro: {errorDetails}</p>}
        </div>


        <div className="grid grid-cols-1 sm:grid-cols-1 gap-4">
          <StatCard title="Total de Perfis Identificados" count={kakoProfiles.length} icon={Users} bgColorClass="bg-sky-500/10" textColorClass="text-sky-500" />
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
                  <TableHead className="text-right w-[250px]">AÇÕES</TableHead> {/* Increased width */}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProfiles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      Nenhum perfil identificado nas mensagens do chat ainda...
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
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm" className="h-8 px-2 text-xs">
                                Ações
                                <ChevronDown className="h-3 w-3 ml-1" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onSelect={() => toast({title: "Sincronizar Dados", description:"Funcionalidade em desenvolvimento."})}>
                                 <RefreshCw className="mr-2 h-4 w-4" />
                                 Sincronizar Dados
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                                onSelect={() => handleRequestRemoveProfile(profile)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Remover da Lista (Local)
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
                Informações detalhadas do perfil identificado no Kako Live.
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

      {profileToRemove && (
        <AlertDialog open={isConfirmRemoveDialogOpen} onOpenChange={setIsConfirmRemoveDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Remoção</AlertDialogTitle>
              <AlertDialogDescription>
                Você tem certeza que deseja remover o perfil de <span className="font-semibold">{profileToRemove.nickname}</span> da lista atual? Esta ação é apenas local.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setIsConfirmRemoveDialogOpen(false)}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmRemoveProfile}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              >
                Remover
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      <AlertDialog open={isConfirmClearListDialogOpen} onOpenChange={setIsConfirmClearListDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Limpar Lista Local</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem certeza que deseja limpar todos os perfis identificados nesta sessão? Eles serão recarregados se novas mensagens de chat chegarem.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsConfirmClearListDialogOpen(false)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmClearListLocal}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Limpar Lista
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
