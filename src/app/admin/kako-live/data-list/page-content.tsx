
"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Users, Eye, RefreshCw, UserCircle2, Trash2, Gift as GiftIconLucide, DatabaseZap, PlusCircle, Save, FileJson } from "lucide-react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { KakoProfile, KakoGift } from "@/types";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { db, doc, getDoc, setDoc, updateDoc, serverTimestamp, collection, query, where, getDocs, writeBatch, Timestamp } from "@/lib/firebase";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormDescription as FormDesc, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";


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

const newGiftSchema = z.object({
  id: z.string().min(1, "ID do presente é obrigatório.").max(50, "ID muito longo."),
  name: z.string().min(1, "Nome do presente é obrigatório.").max(100, "Nome muito longo."),
  imageUrl: z.string().url({ message: "URL da imagem inválida." }).min(1, "URL da imagem é obrigatória."),
  diamond: z.preprocess(
    (val) => (val === "" || val === null || val === undefined) ? undefined : Number(val),
    z.number({ invalid_type_error: "Diamantes deve ser um número" }).int("Diamantes deve ser um número inteiro.").positive("Diamantes deve ser um número positivo.").optional()
  ),
  display: z.boolean().default(true),
});
type NewGiftFormValues = z.infer<typeof newGiftSchema>;


export default function AdminKakoLiveDataListPageContent() {
  const [kakoProfiles, setKakoProfiles] = useState<KakoProfile[]>([]);
  const [kakoGifts, setKakoGifts] = useState<KakoGift[]>([]);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(true);
  const [isLoadingGifts, setIsLoadingGifts] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  
  const [isConfirmClearProfilesDBDialogOpen, setIsConfirmClearProfilesDBDialogOpen] = useState(false); 
  const [isConfirmClearProfilesListLocalDialogOpen, setIsConfirmClearProfilesListLocalDialogOpen] = useState(false);
  const [isDeletingProfilesDB, setIsDeletingProfilesDB] = useState(false);

  const [isConfirmClearGiftsDBDialogOpen, setIsConfirmClearGiftsDBDialogOpen] = useState(false);
  const [isConfirmClearGiftsListLocalDialogOpen, setIsConfirmClearGiftsListLocalDialogOpen] = useState(false);
  const [isDeletingGiftsDB, setIsDeletingGiftsDB] = useState(false);
  const [isAddGiftDialogOpen, setIsAddGiftDialogOpen] = useState(false);


  const [selectedProfileForDetails, setSelectedProfileForDetails] = useState<KakoProfile | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const socketRef = useRef<WebSocket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<string>("Desconectado");
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const isManuallyDisconnectingRef = useRef(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [wsUrl, setWsUrl] = useState<string>("wss://h5-ws.kako.live/ws/v1?roomId=67b9ed5fa4e716a084a23765"); 


  const addLog = useCallback((message: string, type: "success" | "error" | "info") => {
    if (type === "error") console.error(message);
    else if (type === "info") console.info(message);
    else console.log(message);
  }, []);


  const upsertKakoProfileToFirestore = useCallback(async (profileData: KakoProfile) => {
    if (!profileData.id) {
      console.error("Cannot upsert profile without an ID (FUID)", profileData);
      return;
    }
    const profileDocRef = doc(db, "kakoProfiles", profileData.id);
    try {
      const docSnap = await getDoc(profileDocRef);
      const dataToSave: KakoProfile = {
        id: profileData.id,
        nickname: profileData.nickname || "N/A",
        avatarUrl: profileData.avatarUrl || "",
        level: profileData.level,
        numId: profileData.numId,
        showId: profileData.showId,
        gender: profileData.gender,
        lastFetchedAt: serverTimestamp(),
        isLiving: profileData.isLiving,
        signature: profileData.signature,
        area: profileData.area,
        school: profileData.school,
        roomId: profileData.roomId,
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
        if (dataToSave.isLiving !== existingData.isLiving) { updates.isLiving = dataToSave.isLiving; hasChanges = true; }
        if (dataToSave.signature !== existingData.signature) { updates.signature = dataToSave.signature; hasChanges = true; }
        if (dataToSave.area !== existingData.area) { updates.area = dataToSave.area; hasChanges = true; }
        if (dataToSave.school !== existingData.school) { updates.school = dataToSave.school; hasChanges = true; }
        if (dataToSave.roomId !== existingData.roomId) { updates.roomId = dataToSave.roomId; hasChanges = true; }
        
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
  }, [toast]);


  const connectWebSocket = useCallback(() => {
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
                        signature: userData.signature,
                        area: userData.area,
                        school: userData.school,
                        roomId: parsedJson.roomId, // Include roomId from the message context
                        isLiving: 'isLiving' in userData ? userData.isLiving : (parsedJson.anchor?.isLiving), // Prefer user.isLiving, fallback to anchor.isLiving
                        lastFetchedAt: new Date() 
                    };
                    
                    setKakoProfiles(prevProfiles => {
                        const existingProfileIndex = prevProfiles.findIndex(p => p.id === profileData.id);
                        if (existingProfileIndex !== -1) {
                            const updatedProfiles = [...prevProfiles];
                            updatedProfiles[existingProfileIndex] = { ...updatedProfiles[existingProfileIndex], ...profileData, lastFetchedAt: new Date() };
                            return updatedProfiles.sort((a, b) => ((b.lastFetchedAt instanceof Date ? b.lastFetchedAt.getTime() : 0) - (a.lastFetchedAt instanceof Date ? a.lastFetchedAt.getTime() : 0)));
                        }
                        const newProfiles = [...prevProfiles, profileData];
                        return newProfiles.sort((a, b) => ((b.lastFetchedAt instanceof Date ? b.lastFetchedAt.getTime() : 0) - (a.lastFetchedAt instanceof Date ? a.lastFetchedAt.getTime() : 0)));
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
          if (socketRef.current === newSocket) {
            socketRef.current.onopen = null;
            socketRef.current.onmessage = null;
            socketRef.current.onerror = null;
            socketRef.current.onclose = null;
            socketRef.current = null;
          }
        };

        newSocket.onclose = (closeEvent) => {
          let closeMsg = `Desconectado de ${newSocket.url}.`;
          if (closeEvent.code || closeEvent.reason) {
            closeMsg += ` Código: ${closeEvent.code}, Motivo: ${closeEvent.reason || 'N/A'}`;
          }
          
          if (socketRef.current === newSocket) { 
              if (!isManuallyDisconnectingRef.current) {
                  setConnectionStatus("Desconectado - Tentando Reconectar...");
                  socketRef.current = null; 
                  reconnectTimeoutRef.current = setTimeout(connectWebSocket, 5000);
              } else {
                  setConnectionStatus("Desconectado");
                  socketRef.current = null; 
              }
          }
        };
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : "Erro desconhecido ao tentar conectar.";
        setConnectionStatus("Erro ao Iniciar Conexão");
        setErrorDetails(errMsg);
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [wsUrl, upsertKakoProfileToFirestore]);

  const disconnectManually = useCallback(() => {
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
    } else {
      addLog("Nenhuma conexão WebSocket ativa para desconectar.", "info");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // addLog dependency removed as it's stable

  useEffect(() => {
    connectWebSocket(); 
    return () => {
      disconnectManually();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectWebSocket, disconnectManually]);

  const fetchKakoGifts = useCallback(async () => {
    setIsLoadingGifts(true);
    try {
      const giftsCollectionRef = collection(db, "kakoGifts");
      const querySnapshot = await getDocs(giftsCollectionRef);
      const fetchedGifts: KakoGift[] = [];
      querySnapshot.forEach((docSnap) => {
        fetchedGifts.push({ id: docSnap.id, ...docSnap.data() } as KakoGift);
      });
      setKakoGifts(fetchedGifts.sort((a, b) => parseInt(a.id) - parseInt(b.id)));
    } catch (error) {
      console.error("Erro ao buscar presentes do Firestore:", error);
      toast({ title: "Erro ao Carregar Presentes", description: "Não foi possível carregar a lista de presentes.", variant: "destructive" });
    } finally {
      setIsLoadingGifts(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchKakoGifts();
  }, [fetchKakoGifts]);

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

  const handleConfirmClearProfilesListLocal = () => {
    setKakoProfiles([]);
    toast({
      title: "Lista Limpa (Local)",
      description: "Todos os perfis foram removidos da visualização atual (localmente).",
    });
    setIsConfirmClearProfilesListLocalDialogOpen(false);
  };

  const handleConfirmClearAllGiftsFromDB = async () => {
    setIsDeletingGiftsDB(true);
    try {
      const querySnapshot = await getDocs(collection(db, "kakoGifts"));
      if (querySnapshot.empty) {
        toast({ title: "Nada para Apagar", description: "A coleção 'kakoGifts' já está vazia." });
        setIsConfirmClearGiftsDBDialogOpen(false);
        setIsDeletingGiftsDB(false);
        return;
      }
      const batch = writeBatch(db);
      querySnapshot.docs.forEach((docSnap) => {
        batch.delete(docSnap.ref);
      });
      await batch.commit();
      setKakoGifts([]); 
      toast({
        title: "Presentes Apagados do DB",
        description: "Todos os presentes foram apagados da coleção 'kakoGifts' no Firestore.",
      });
    } catch (error) {
      console.error("Erro ao apagar presentes do Firestore:", error);
      toast({ title: "Erro ao Apagar Presentes do DB", description: "Não foi possível apagar os presentes.", variant: "destructive" });
    } finally {
      setIsDeletingGiftsDB(false);
      setIsConfirmClearGiftsDBDialogOpen(false);
    }
  };

  const handleConfirmClearGiftsListLocal = () => {
    setKakoGifts([]);
    toast({
      title: "Lista de Presentes Limpa (Local)",
      description: "Todos os presentes foram removidos da visualização atual (localmente).",
    });
    setIsConfirmClearGiftsListLocalDialogOpen(false);
  };

  const handleShowDetails = (profile: KakoProfile) => {
    setSelectedProfileForDetails(profile);
    setIsDetailModalOpen(true);
  };

  const giftForm = useForm<NewGiftFormValues>({
    resolver: zodResolver(newGiftSchema),
    defaultValues: {
      id: "",
      name: "",
      imageUrl: "",
      diamond: undefined,
      display: true,
    },
  });

  const onSubmitNewGift = async (values: NewGiftFormValues) => {
    try {
      const giftDocRef = doc(db, "kakoGifts", values.id);
      const docSnap = await getDoc(giftDocRef);

      if (docSnap.exists()) {
        toast({
          title: "ID de Presente já Existe",
          description: `O ID '${values.id}' já está em uso. Por favor, use um ID diferente.`,
          variant: "destructive",
        });
        return;
      }

      const newGiftData: Omit<KakoGift, 'diamond'> & {diamond?: number | null} = {
        id: values.id,
        name: values.name,
        imageUrl: values.imageUrl,
        display: values.display,
        diamond: values.diamond === undefined ? null : values.diamond, // Store undefined as null
        // Add other fields as needed, e.g., createdAt
      };
      await setDoc(giftDocRef, newGiftData);
      toast({
        title: "Presente Cadastrado!",
        description: `O presente '${values.name}' foi salvo com sucesso.`,
      });
      setIsAddGiftDialogOpen(false);
      giftForm.reset();
      fetchKakoGifts(); // Refresh the list
    } catch (error) {
      console.error("Erro ao cadastrar presente:", error);
      toast({
        title: "Erro ao Cadastrar",
        description: "Não foi possível salvar o presente. Tente novamente.",
        variant: "destructive",
      });
    }
  };


  const filteredProfiles = kakoProfiles.filter(profile =>
    profile.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (profile.showId && profile.showId.toLowerCase().includes(searchTerm.toLowerCase())) || 
    (profile.numId && profile.numId.toString().includes(searchTerm)) 
  );
  
  const displayLoading = isLoadingProfiles && kakoProfiles.length === 0;

  return (
    <>
      <div className="space-y-6 h-full flex flex-col p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Lista de Perfis do Kako Live (via Chat)</h1>
            <p className="text-sm text-muted-foreground">Perfis Kako Live identificados em tempo real via WebSocket e salvos/atualizados no Firestore.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Conexão WebSocket: <span className={connectionStatus.startsWith("Conectado") ? "text-green-500" : "text-destructive"}>{connectionStatus}</span>
            </p>
            {errorDetails && <p className="text-xs text-destructive">Erro: {errorDetails}</p>}
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
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
              <Button variant="outline" onClick={() => { disconnectManually(); setTimeout(connectWebSocket, 100); }} className="h-10">
                 <RefreshCw className="mr-2 h-4 w-4" />
                Reconectar WS
              </Button>
              <Button variant="outline" onClick={() => setIsConfirmClearProfilesListLocalDialogOpen(true)} className="h-10" disabled={kakoProfiles.length === 0}>
                 <Trash2 className="mr-2 h-4 w-4" />
                Limpar Tela (Perfis)
              </Button>
              <Button variant="destructive" onClick={() => setIsConfirmClearProfilesDBDialogOpen(true)} className="h-10" disabled={isDeletingProfilesDB}>
                 {isDeletingProfilesDB ? <LoadingSpinner size="sm" className="mr-2"/> : <Trash2 className="mr-2 h-4 w-4" />}
                Zerar DB (Perfis)
              </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatCard title="Total de Perfis Identificados (Sessão)" count={kakoProfiles.length} icon={Users} bgColorClass="bg-sky-500/10" textColorClass="text-sky-500" />
          <StatCard title="Total de Presentes (DB)" count={kakoGifts.length} icon={GiftIconLucide} bgColorClass="bg-orange-500/10" textColorClass="text-orange-500" />
        </div>

        <Card className="flex-grow flex flex-col min-h-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center"><Users className="mr-2 h-5 w-5 text-primary"/> Lista de Perfis do Kako Live</CardTitle>
            <CardDescription>Perfis identificados via WebSocket e salvos no Firestore.</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow p-0">
            <div className="overflow-x-auto h-full">
              {displayLoading ? (
                <div className="flex justify-center items-center h-full">
                  <LoadingSpinner size="lg" />
                  <p className="ml-2 text-muted-foreground">Carregando perfis...</p>
                </div>
              ) : (
              <Table>
                <TableHeader className="bg-muted/50 sticky top-0 z-10">
                  <TableRow>
                    <TableHead className="w-[60px] px-4"></TableHead> 
                    <TableHead className="min-w-[200px]">NICKNAME / SHOW ID</TableHead>
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
                              <FileJson className="h-3 w-3 mr-1" /> {/* Changed icon */}
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
          </CardContent>
           <CardFooter className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">Mostrando {filteredProfiles.length} de {kakoProfiles.length} perfis identificados.</p>
          </CardFooter>
        </Card>

        {/* Kako Gifts List */}
        <Card className="flex-grow flex flex-col min-h-0 shadow-lg mt-6">
            <CardHeader className="flex flex-row justify-between items-center">
                <div>
                    <CardTitle className="flex items-center"><GiftIconLucide className="mr-2 h-5 w-5 text-primary"/> Lista de Presentes Cadastrados</CardTitle>
                    <CardDescription>Presentes recuperados do banco de dados 'kakoGifts'.</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    <Dialog open={isAddGiftDialogOpen} onOpenChange={setIsAddGiftDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="h-9">
                                <PlusCircle className="mr-2 h-4 w-4" /> Novo Presente
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>Cadastrar Novo Presente</DialogTitle>
                                <DialogDescription>
                                    Preencha os detalhes do novo presente para adicioná-lo ao sistema.
                                </DialogDescription>
                            </DialogHeader>
                            <Form {...giftForm}>
                                <form onSubmit={giftForm.handleSubmit(onSubmitNewGift)} className="space-y-4 py-4">
                                    <FormField
                                        control={giftForm.control}
                                        name="id"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>ID do Presente</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Ex: 40" {...field} />
                                                </FormControl>
                                                <FormDesc>ID numérico ou string única do Kako Live.</FormDesc>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={giftForm.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Nome do Presente</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Ex: Miau" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={giftForm.control}
                                        name="imageUrl"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>URL da Imagem</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="https://..." {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={giftForm.control}
                                        name="diamond"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Valor em Diamantes (Opcional)</FormLabel>
                                                <FormControl>
                                                    <Input type="number" placeholder="Ex: 100" {...field} onChange={event => field.onChange(event.target.value === '' ? undefined : Number(event.target.value))} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={giftForm.control}
                                        name="display"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-3 shadow-sm">
                                                <FormControl>
                                                    <Checkbox
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                                <div className="space-y-1 leading-none">
                                                    <FormLabel>Visível na Loja?</FormLabel>
                                                    <FormDesc>
                                                        Marque se este presente deve ser exibido na loja do Kako Live.
                                                    </FormDesc>
                                                </div>
                                            </FormItem>
                                        )}
                                    />
                                    <DialogFooter>
                                        <DialogClose asChild>
                                            <Button type="button" variant="outline">Cancelar</Button>
                                        </DialogClose>
                                        <Button type="submit" disabled={giftForm.formState.isSubmitting}>
                                            {giftForm.formState.isSubmitting ? <LoadingSpinner size="sm" className="mr-2" /> : <Save className="mr-2 h-4 w-4" />}
                                            Salvar Presente
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                    <Button variant="outline" size="sm" onClick={fetchKakoGifts} disabled={isLoadingGifts} className="h-9">
                        <RefreshCw className="mr-2 h-4 w-4" /> Atualizar
                    </Button>
                     <Button variant="outline" size="sm" onClick={() => setIsConfirmClearGiftsListLocalDialogOpen(true)} className="h-9" disabled={kakoGifts.length === 0}>
                        <Trash2 className="mr-2 h-4 w-4" /> Limpar Tela
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => setIsConfirmClearGiftsDBDialogOpen(true)} className="h-9" disabled={isDeletingGiftsDB || kakoGifts.length === 0}>
                        {isDeletingGiftsDB ? <LoadingSpinner size="sm" className="mr-2"/> : <Trash2 className="mr-2 h-4 w-4" />} Zerar DB
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="flex-grow p-0">
                <div className="overflow-x-auto h-full">
                    {isLoadingGifts ? (
                        <div className="flex justify-center items-center h-full">
                            <LoadingSpinner size="lg" />
                            <p className="ml-2 text-muted-foreground">Carregando presentes...</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader className="bg-muted/50 sticky top-0 z-10">
                                <TableRow>
                                    <TableHead className="w-[80px]">ID</TableHead>
                                    <TableHead>Nome do Presente</TableHead>
                                    <TableHead className="w-[100px]">Imagem</TableHead>
                                    <TableHead>URL da Imagem</TableHead>
                                    <TableHead className="text-right w-[100px]">Diamantes</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {kakoGifts.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                            Nenhum presente encontrado no banco de dados.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    kakoGifts.map((gift) => (
                                        <TableRow key={gift.id} className="hover:bg-muted/20 transition-colors">
                                            <TableCell className="font-mono text-xs">{gift.id}</TableCell>
                                            <TableCell className="font-medium">{gift.name}</TableCell>
                                            <TableCell>
                                                {gift.imageUrl && (
                                                    <NextImage
                                                        src={gift.imageUrl}
                                                        alt={gift.name}
                                                        width={40}
                                                        height={40}
                                                        className="rounded-md object-contain"
                                                        data-ai-hint="gift icon"
                                                    />
                                                )}
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground break-all">{gift.imageUrl}</TableCell>
                                            <TableCell className="text-right font-medium">{gift.diamond ?? 'N/A'}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}
                </div>
            </CardContent>
            <CardFooter className="pt-2 border-t">
                <p className="text-xs text-muted-foreground">Mostrando {kakoGifts.length} presentes.</p>
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
                Informações detalhadas do perfil Kako Live identificadas via WebSocket e salvas no Firestore.
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

      <AlertDialog open={isConfirmClearProfilesListLocalDialogOpen} onOpenChange={setIsConfirmClearProfilesListLocalDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Limpar Tela (Perfis)</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem certeza que deseja limpar todos os perfis da visualização atual? Esta ação é apenas local e não afeta o banco de dados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsConfirmClearProfilesListLocalDialogOpen(false)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmClearProfilesListLocal}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Limpar Tela (Perfis)
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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

       <AlertDialog open={isConfirmClearGiftsListLocalDialogOpen} onOpenChange={setIsConfirmClearGiftsListLocalDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Limpar Tela (Presentes)</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem certeza que deseja limpar todos os presentes da visualização atual? Esta ação é apenas local e não afeta o banco de dados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsConfirmClearGiftsListLocalDialogOpen(false)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmClearGiftsListLocal}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Limpar Tela (Presentes)
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isConfirmClearGiftsDBDialogOpen} onOpenChange={setIsConfirmClearGiftsDBDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">Confirmar Zerar Banco de Dados (Presentes)!</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem certeza que deseja apagar <strong className="text-destructive">TODOS</strong> os presentes da coleção 'kakoGifts' no Firestore?
              <br />
              <strong className="text-destructive uppercase">Esta ação é irreversível e apagará os dados permanentemente do banco de dados.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsConfirmClearGiftsDBDialogOpen(false)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmClearAllGiftsFromDB}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              disabled={isDeletingGiftsDB}
            >
              {isDeletingGiftsDB ? <LoadingSpinner size="sm" className="mr-2"/> : null}
              Zerar Banco de Dados (Presentes)
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
