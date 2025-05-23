
"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/hooks/use-auth';
import { db, doc, getDoc, setDoc, serverTimestamp, updateDoc, collection, query, where, getDocs, writeBatch, Timestamp, deleteDoc } from "@/lib/firebase";
import { PlugZap, WifiOff, Info, Save, RefreshCw, Trash2, ListPlus, Copy, Play, Link as LinkIconLucide, Eye, ChevronDown, MessageSquare, Gamepad2, RadioTower, Gift as GiftIcon, UserCircle2, XCircle, DatabaseZap, Users } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { KakoProfile, KakoGift, UserProfile } from "@/types";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableRow, TableHead, TableHeader } from "@/components/ui/table";


const DEFAULT_WS_URL = "wss://h5-ws.kako.live/ws/v1?roomId=67b9ed5fa4e716a084a23765"; 

interface ParsedUserData {
  nickname?: string;
  avatarUrl?: string;
  level?: number;
  showId?: string;
  userId?: string; // FUID
  gender?: number;
}
interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  type: "success" | "error" | "info" | "received" | "sent" | "warning";
  rawData?: string;
  parsedData?: Record<string, any>;
  isJson?: boolean;
  classification?: string;
  parsedUserData?: ParsedUserData;
}


const generateUniqueId = () => {
  return String(Date.now()) + '-' + Math.random().toString(36).substr(2, 9);
};

export default function AdminKakoLiveUpdateDataChatPageContent() {
  const { toast } = useToast();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const { currentUser } = useAuth(); 

  const [wsUrlInput, setWsUrlInput] = useState<string>(DEFAULT_WS_URL);
  const [webSocketUrlList, setWebSocketUrlList] = useState<string[]>([]);
  const [newWsUrlToAdd, setNewWsUrlToAdd] = useState<string>("");

  const [isLoadingConfig, setIsLoadingConfig] = useState<boolean>(true);
  const [isSavingConfig, setIsSavingConfig] = useState<boolean>(false);

  const socketRef = useRef<WebSocket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<string>("Desconectado");
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const isManuallyDisconnectingRef = useRef(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isConnecting, setIsConnecting] = useState(false); 

  const configDocRef = doc(db, "app_settings", "live_data_config");

  const addLog = useCallback((logData: Omit<LogEntry, 'id' | 'timestamp'>) => {
    setLogs(prevLogs => [{ 
        id: generateUniqueId(), 
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }), 
        ...logData
    }, ...prevLogs.slice(0, 199)]);
  }, []);

  const fetchWsUrlConfig = useCallback(async () => {
    setIsLoadingConfig(true);
    addLog({ message: "Carregando configurações de URL do WebSocket...", type: "info" });
    try {
      const docSnap = await getDoc(configDocRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        const urls = data?.webSocketUrlList as string[] || [];
        setWebSocketUrlList(urls);
        if (urls.length > 0) {
          // Only set wsUrlInput from saved list if it's not already set (e.g. on initial load)
          // or if the user hasn't manually changed it yet.
          // For simplicity, we'll set it to the first saved URL if wsUrlInput is still the default.
          if (wsUrlInput === DEFAULT_WS_URL || !wsUrlInput) {
            setWsUrlInput(urls[0]);
          }
          addLog({ message: `Lista de URLs carregada. Usando: ${wsUrlInput || urls[0]} para conexão.`, type: "info" });
        } else {
           addLog({ message: `Nenhuma URL salva. Usando padrão: ${DEFAULT_WS_URL}`, type: "info" });
           if (!wsUrlInput) setWsUrlInput(DEFAULT_WS_URL); // Ensure wsUrlInput has a value
        }
      } else {
        setWebSocketUrlList([]);
        addLog({ message: `Nenhuma configuração de URL encontrada. Usando padrão: ${DEFAULT_WS_URL}`, type: "info" });
        if (!wsUrlInput) setWsUrlInput(DEFAULT_WS_URL);
      }
    } catch (error) {
      console.error("Erro ao carregar lista de URLs do WebSocket:", error);
      addLog({ message: "Falha ao carregar lista de URLs do WebSocket.", type: "error" });
      setWebSocketUrlList([]);
      if (!wsUrlInput) setWsUrlInput(DEFAULT_WS_URL);
    } finally {
      setIsLoadingConfig(false);
    }
  }, [addLog, configDocRef, wsUrlInput]);

  useEffect(() => {
    fetchWsUrlConfig();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Fetch config once on mount

  const upsertKakoProfileToFirestore = useCallback(async (profileData: KakoProfile) => {
    if (!profileData.id) {
      addLog({ message: `Tentativa de salvar perfil Kako sem ID (FUID): ${profileData.nickname}`, type: "error" });
      return;
    }
    const profileDocRef = doc(db, "kakoProfiles", profileData.id);
    try {
      const docSnap = await getDoc(profileDocRef);
      const dataToSave: Partial<KakoProfile> & { lastFetchedAt: any } = {
        id: profileData.id, // Ensure ID is part of data
        nickname: profileData.nickname,
        avatarUrl: profileData.avatarUrl,
        level: profileData.level,
        showId: profileData.showId,
        numId: profileData.numId,
        gender: profileData.gender,
        lastFetchedAt: serverTimestamp(),
      };
      if (profileData.signature) dataToSave.signature = profileData.signature;
      if (profileData.area) dataToSave.area = profileData.area;
      if (profileData.school) dataToSave.school = profileData.school;
      if (profileData.roomId) dataToSave.roomId = profileData.roomId;
      if (profileData.isLiving !== undefined) dataToSave.isLiving = profileData.isLiving;


      if (!docSnap.exists()) {
        await setDoc(profileDocRef, dataToSave);
        addLog({ message: `Novo perfil Kako salvo: ${profileData.nickname} (ID: ${profileData.id})`, type: "success" });
      } else {
        const existingData = docSnap.data() as KakoProfile;
        let hasChanges = false;
        (Object.keys(dataToSave) as Array<keyof typeof dataToSave>).forEach(key => {
          if (key !== 'lastFetchedAt' && dataToSave[key] !== undefined && dataToSave[key] !== existingData[key]) {
            hasChanges = true;
          }
        });

        if (hasChanges) {
          await updateDoc(profileDocRef, dataToSave);
          addLog({ message: `Perfil Kako atualizado: ${profileData.nickname} (ID: ${profileData.id})`, type: "info" });
        } else {
          await updateDoc(profileDocRef, { lastFetchedAt: serverTimestamp() });
          // addLog({ message: `Perfil Kako visto (sem alterações de dados): ${profileData.nickname} (ID: ${profileData.id})`, type: "info" });
        }
      }
    } catch (error) {
      console.error("Erro ao salvar/atualizar perfil Kako no Firestore:", error);
      addLog({ message: `Erro no Firestore ao processar perfil de ${profileData.nickname}: ${error instanceof Error ? error.message : String(error)}`, type: "error" });
    }
  }, [addLog]);

  const upsertKakoGiftData = useCallback(async (giftData: Partial<KakoGift> & { id: string }) => {
    if (!giftData.id) {
      addLog({ message: "Tentativa de salvar presente sem ID.", type: "error" });
      return;
    }
    const giftDocRef = doc(db, "kakoGifts", giftData.id.toString());
    try {
      const docSnap = await getDoc(giftDocRef);
      if (!docSnap.exists()) {
        const nameToSave = giftData.name || `Presente Desconhecido (ID: ${giftData.id})`;
        const imageUrlToSave = giftData.imageUrl || `https://placehold.co/48x48.png?text=${giftData.id}`;
        const diamondToSave = giftData.diamond === undefined ? null : giftData.diamond;
        const displayStatus = !!(giftData.name && giftData.imageUrl && !giftData.imageUrl.startsWith("https://placehold.co"));

        const newGiftToSave: KakoGift = {
          id: giftData.id.toString(),
          name: nameToSave,
          imageUrl: imageUrlToSave,
          diamond: diamondToSave,
          display: displayStatus,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          dataAiHint: nameToSave.toLowerCase().split(" ").slice(0, 2).join(" ") || "gift icon"
        };
        await setDoc(giftDocRef, newGiftToSave);
        addLog({ message: `Novo presente salvo: '${nameToSave}' (ID: ${giftData.id}) com display ${displayStatus}`, type: "success", parsedData: newGiftToSave, isJson: true });
      } else {
        const existingData = docSnap.data() as KakoGift;
        const updates: Partial<KakoGift> = {};
        let hasChanges = false;

        if (giftData.name && giftData.name !== existingData.name && existingData.name.startsWith("Presente Desconhecido")) {
          updates.name = giftData.name;
          updates.dataAiHint = giftData.name.toLowerCase().split(" ").slice(0, 2).join(" ") || "gift icon";
          hasChanges = true;
        }
        if (giftData.imageUrl && giftData.imageUrl !== existingData.imageUrl && (existingData.imageUrl?.startsWith("https://placehold.co") || !existingData.imageUrl)) {
          updates.imageUrl = giftData.imageUrl;
          hasChanges = true;
        }
        if (giftData.diamond !== undefined && giftData.diamond !== existingData.diamond) {
          updates.diamond = giftData.diamond === undefined ? null : giftData.diamond;
          hasChanges = true;
        }
        if (existingData.display === false && giftData.name && giftData.imageUrl && !giftData.imageUrl.startsWith("https://placehold.co")) {
          updates.display = true;
          hasChanges = true;
        }

        if (hasChanges) {
          updates.updatedAt = serverTimestamp();
          await updateDoc(giftDocRef, updates);
          addLog({ message: `Presente atualizado: '${updates.name || existingData.name}' (ID: ${giftData.id})`, type: "success", parsedData: updates, isJson: true });
        }
      }
    } catch (error) {
      console.error("Erro ao salvar/atualizar presente Kako:", error);
      addLog({ message: `Erro ao processar presente ID ${giftData.id}: ${error instanceof Error ? error.message : String(error)}`, type: "error" });
    }
  }, [addLog]);

  const parseWebSocketMessage = useCallback((rawData: string): { type: string, data: any, originalText: string, parsedUserData?: ParsedUserData, classification?: string, isJson: boolean, extractedRoomId?: string } | null => {
    let messageContentString = rawData;
    let parsedJson: any;
    let isJsonMessage = false;
    let extractedRoomIdFromJson: string | undefined = undefined;

    const firstBrace = messageContentString.indexOf('{');
    const lastBrace = messageContentString.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      messageContentString = messageContentString.substring(firstBrace, lastBrace + 1);
    }

    try {
      parsedJson = JSON.parse(messageContentString);
      isJsonMessage = true;
      if (parsedJson && typeof parsedJson === 'object' && 'roomId' in parsedJson) {
        extractedRoomIdFromJson = parsedJson.roomId;
      }
    } catch (e) {
      return { type: 'unknown_text', data: null, originalText: rawData, isJson: false, extractedRoomId: undefined };
    }

    let userData: ParsedUserData | undefined = undefined;
    if (parsedJson.user && typeof parsedJson.user === 'object') {
      userData = {
        userId: parsedJson.user.userId,
        nickname: parsedJson.user.nickname,
        avatarUrl: parsedJson.user.avatar || parsedJson.user.avatarUrl,
        level: parsedJson.user.level,
        numId: parsedJson.user.numId,
        showId: parsedJson.user.showId,
        gender: parsedJson.user.gender,
      };
    }

    let classification: string | undefined = undefined;

    if (parsedJson.anchor && typeof parsedJson.anchor === 'object' && 'online' in parsedJson && 'likes' in parsedJson) {
      classification = "Dados da LIVE";
      if (extractedRoomIdFromJson && 'mute' in parsedJson) { // More specific if 'mute' is present
        classification = "Dados da LIVE";
      }
      return { type: 'systemUpdate', data: parsedJson, originalText: messageContentString, parsedUserData: userData, classification, isJson: isJsonMessage, extractedRoomId: extractedRoomIdFromJson };
    }
    if (parsedJson.text && userData) {
      classification = "Mensagem de Chat";
      return { type: 'chat', data: parsedJson, originalText: messageContentString, parsedUserData: userData, classification, isJson: isJsonMessage, extractedRoomId: extractedRoomIdFromJson };
    }
    if (parsedJson.giftId && userData) {
      classification = "Presentes da Sala";
      return { type: 'gift', data: parsedJson, originalText: messageContentString, parsedUserData: userData, classification, isJson: isJsonMessage, extractedRoomId: extractedRoomIdFromJson };
    }
    if (parsedJson.game && parsedJson.game.baishun2) {
      return null;
    }
    if (userData && parsedJson.type === 1 && parsedJson.type2 === 1 && !parsedJson.text && !parsedJson.giftId && !parsedJson.game && !parsedJson.count) {
      classification = "Entrada de Usuário";
      return { type: 'userJoin', data: parsedJson, originalText: messageContentString, parsedUserData: userData, classification, isJson: isJsonMessage, extractedRoomId: extractedRoomIdFromJson };
    }
    if (userData && typeof parsedJson.count === 'number' && !parsedJson.text && !parsedJson.giftId && !parsedJson.game) {
      classification = "Contagem de Usuários";
      return { type: 'userCount', data: parsedJson, originalText: messageContentString, parsedUserData: userData, classification, isJson: isJsonMessage, extractedRoomId: extractedRoomIdFromJson };
    }
    if (userData && userData.userId && userData.nickname) {
      classification = "Evento de Perfil (Usuário)";
      return { type: 'profile', data: parsedJson, originalText: messageContentString, parsedUserData: userData, classification, isJson: isJsonMessage, extractedRoomId: extractedRoomIdFromJson };
    }
    if (extractedRoomIdFromJson) { // General room data if roomId is present but not classified above
        classification = "Dados da Sala";
        return { type: 'roomData', data: parsedJson, originalText: messageContentString, parsedUserData: userData, classification, isJson: isJsonMessage, extractedRoomId: extractedRoomIdFromJson };
    }

    if (isJsonMessage) {
      classification = "JSON Não Classificado";
      return { type: 'unknown_json', data: parsedJson, originalText: messageContentString, parsedUserData: userData, classification, isJson: isJsonMessage, extractedRoomId: extractedRoomIdFromJson };
    }
    return null;
  }, []);


  const connectWebSocket = useCallback(() => {
    const urlToConnect = wsUrlInput.trim();
    if (!urlToConnect || (!urlToConnect.startsWith("ws://") && !urlToConnect.startsWith("wss://"))) {
      toast({ title: "URL Inválida", description: "Por favor, insira uma URL WebSocket válida (ws:// ou wss://).", variant: "destructive" });
      setConnectionStatus("URL Inválida");
      return;
    }

    setIsConnecting(true);

    if (socketRef.current && (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING)) {
      addLog({ message: `Fechando conexão existente com ${socketRef.current.url} para reconectar.`, type: "info" });
      isManuallyDisconnectingRef.current = true;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (socketRef.current) {
        socketRef.current.onopen = null;
        socketRef.current.onmessage = null;
        socketRef.current.onerror = null;
        socketRef.current.onclose = null;
        socketRef.current.close();
      }
      socketRef.current = null;
    }

    isManuallyDisconnectingRef.current = false;
    setConnectionStatus(`Conectando a ${urlToConnect}...`);
    setErrorDetails(null);
    addLog({ message: `Tentando conectar a ${urlToConnect}...`, type: "info" });

    try {
      const newSocket = new WebSocket(urlToConnect);
      socketRef.current = newSocket;

      newSocket.onopen = () => {
        setIsConnecting(false);
        setConnectionStatus(`Conectado a: ${newSocket.url}`);
        addLog({ message: `Conexão estabelecida com ${newSocket.url}`, type: "success" });
      };

      newSocket.onmessage = async (event) => {
        let rawMessageString = "";
        if (event.data instanceof Blob) {
          try {
            rawMessageString = await event.data.text();
          } catch (e) {
            rawMessageString = "[Erro ao ler Blob como texto]";
            addLog({ message: "Erro ao ler Blob", type: "error", rawData: "[Blob Data]" });
          }
        } else if (typeof event.data === 'string') {
          rawMessageString = event.data;
        } else {
          try {
            rawMessageString = JSON.stringify(event.data);
          } catch {
            rawMessageString = "[Tipo de mensagem desconhecido]";
          }
        }

        const parsedEvent = parseWebSocketMessage(rawMessageString);

        if (parsedEvent) {
          if (parsedEvent.parsedUserData && parsedEvent.parsedUserData.userId) {
            upsertKakoProfileToFirestore(parsedEvent.parsedUserData as KakoProfile);
          }
          if (parsedEvent.type === 'gift' && parsedEvent.data.giftId) {
            upsertKakoGiftData({
              id: parsedEvent.data.giftId.toString(),
              name: parsedEvent.data.giftName || parsedEvent.data.gift?.name,
              imageUrl: parsedEvent.data.giftIcon || parsedEvent.data.gift?.imageUrl,
              diamond: parsedEvent.data.giftDiamondValue || parsedEvent.data.gift?.diamond,
            });
          }

          addLog({
            message: `Recebido (${parsedEvent.type}): ${rawMessageString.substring(0, 70)}...`,
            type: "received",
            rawData: rawMessageString,
            parsedData: parsedEvent.data,
            isJson: parsedEvent.isJson,
            classification: parsedEvent.classification,
            parsedUserData: parsedEvent.parsedUserData
          });
        } else {
          addLog({ message: `Dados brutos não processados: ${rawMessageString.substring(0, 100)}...`, type: "received", rawData: rawMessageString, isJson: false });
        }
      };

      newSocket.onerror = (errorEvent) => {
        const errorMsg = `Erro na conexão WebSocket: ${errorEvent.type || 'Tipo de erro desconhecido'}`;
        if (socketRef.current === newSocket) {
          setIsConnecting(false);
          setConnectionStatus("Erro na Conexão");
          setErrorDetails(errorMsg);
          addLog({ message: errorMsg, type: "error" });
          newSocket.onopen = null; newSocket.onmessage = null; newSocket.onerror = null; newSocket.onclose = null;
          if (newSocket.readyState === WebSocket.OPEN || newSocket.readyState === WebSocket.CONNECTING) newSocket.close();
          socketRef.current = null;
        }
      };

      newSocket.onclose = (closeEvent) => {
        let closeMsg = `Desconectado de ${newSocket.url}.`;
        if (closeEvent.code || closeEvent.reason) {
          closeMsg += ` Código: ${closeEvent.code}, Motivo: ${closeEvent.reason || 'N/A'}`;
        }

        if (socketRef.current === newSocket) {
          setIsConnecting(false);
          if (!isManuallyDisconnectingRef.current) {
            setConnectionStatus("Desconectado - Tentando Reconectar...");
            addLog({ message: `${closeMsg} Tentando reconectar em 5 segundos.`, type: "warning" });
            socketRef.current = null;
            if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = setTimeout(connectWebSocket, 5000);
          } else {
            setConnectionStatus("Desconectado");
            addLog({ message: "WebSocket Desconectado Manualmente.", type: "info" });
            socketRef.current = null;
          }
        }
      };

    } catch (error) {
      setIsConnecting(false);
      const errMsg = error instanceof Error ? error.message : "Erro desconhecido ao tentar conectar.";
      setConnectionStatus("Erro ao Iniciar Conexão");
      setErrorDetails(errMsg);
      addLog({ message: `Falha ao Conectar WebSocket: ${errMsg}`, type: "error" });
      if (socketRef.current) { socketRef.current.close(); socketRef.current = null; }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wsUrlInput, toast, addLog, parseWebSocketMessage, upsertKakoProfileToFirestore, upsertKakoGiftData]); // Removed disconnectManually from deps as it's stable

  const disconnectWebSocket = useCallback(() => {
    isManuallyDisconnectingRef.current = true;
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (socketRef.current) {
      addLog({ message: "Desconectando WebSocket manualmente...", type: "info" });
      socketRef.current.onopen = null;
      socketRef.current.onmessage = null;
      socketRef.current.onerror = null;
      socketRef.current.onclose = null;
      socketRef.current.close();
      socketRef.current = null;
      setConnectionStatus("Desconectado");
    } else {
      addLog({ message: "Nenhuma conexão WebSocket ativa para desconectar.", type: "info" });
      setConnectionStatus("Desconectado");
    }
    setIsConnecting(false);
  }, [addLog]);

  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      isManuallyDisconnectingRef.current = true; 
      if (socketRef.current) {
        socketRef.current.onopen = null;
        socketRef.current.onmessage = null;
        socketRef.current.onerror = null;
        socketRef.current.onclose = null;
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, []);

  const handleAddNewUrl = () => {
    const urlToAdd = newWsUrlToAdd.trim();
    if (!urlToAdd || (!urlToAdd.startsWith("ws://") && !urlToAdd.startsWith("wss://"))) {
      toast({ title: "URL Inválida", description: "Por favor, insira uma URL WebSocket válida (ws:// ou wss://).", variant: "destructive" });
      return;
    }
    if (webSocketUrlList.includes(urlToAdd)) {
      toast({ title: "URL Duplicada", description: "Esta URL já está na lista.", variant: "default" });
      return;
    }
    setWebSocketUrlList(prev => [...prev, urlToAdd]);
    setNewWsUrlToAdd("");
    toast({ title: "URL Adicionada à Lista", description: "Clique em 'Salvar Lista de URLs no DB' para persistir." });
  };

  const handleRemoveUrl = (indexToRemove: number) => {
    setWebSocketUrlList(prev => prev.filter((_, index) => index !== indexToRemove));
    toast({ title: "URL Removida da Lista", description: "Clique em 'Salvar Lista de URLs no DB' para persistir a remoção." });
  };

  const handleUseUrlForConnection = (url: string) => {
    setWsUrlInput(url);
    toast({ title: "URL Selecionada para Conexão", description: `Pronto para conectar a: ${url}` });
  };

  const handleSaveUrlList = async () => {
    setIsSavingConfig(true);
    addLog({ message: "Salvando lista de URLs no banco de dados...", type: "info" });
    try {
      const docSnap = await getDoc(configDocRef);
      if (docSnap.exists()) {
        await updateDoc(configDocRef, { webSocketUrlList: webSocketUrlList, lastUpdatedAt: serverTimestamp() });
      } else {
        await setDoc(configDocRef, { webSocketUrlList: webSocketUrlList, createdAt: serverTimestamp(), lastUpdatedAt: serverTimestamp() });
      }
      toast({ title: "Lista de URLs Salva!", description: "A lista de URLs do WebSocket foi salva com sucesso." });
      addLog({ message: "Lista de URLs salva no banco de dados.", type: "success" });
    } catch (error) {
      console.error("Erro ao salvar lista de URLs do WebSocket:", error);
      toast({ title: "Erro ao Salvar Lista", description: "Não foi possível salvar a lista de URLs.", variant: "destructive" });
      addLog({ message: "Falha ao salvar a lista de URLs no banco de dados.", type: "error" });
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleCopyRawData = (rawData: string) => {
    navigator.clipboard.writeText(rawData)
      .then(() => toast({ title: "Copiado!", description: "Dados brutos copiados para a área de transferência." }))
      .catch(err => toast({ title: "Falha ao Copiar", description: "Não foi possível copiar os dados.", variant: "destructive" }));
  };


  return (
    <div className="space-y-6 h-full flex flex-col p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ListPlus className="mr-2 h-6 w-6 text-primary" />
            Configurar e Salvar URLs de WebSocket
          </CardTitle>
          <CardDescription>
            Adicione, remova e salve uma lista de URLs de WebSocket para usar na coleta de dados. A primeira URL da lista será usada como padrão para conexão inicial se nenhuma estiver definida.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newWsUrlInput">Nova URL do WebSocket para Adicionar à Lista</Label>
            <div className="flex items-center gap-2">
              <Input
                id="newWsUrlInput"
                value={newWsUrlToAdd}
                onChange={(e) => setNewWsUrlToAdd(e.target.value)}
                placeholder="wss://exemplo.com/socket"
                disabled={isLoadingConfig || isSavingConfig}
              />
              <Button onClick={handleAddNewUrl} disabled={isLoadingConfig || isSavingConfig || !newWsUrlToAdd.trim()}>
                <ListPlus className="mr-2 h-4 w-4" /> Adicionar à Lista
              </Button>
            </div>
          </div>

          {isLoadingConfig ? (
            <div className="flex justify-center items-center py-4"><LoadingSpinner /><p className="ml-2 text-muted-foreground">Carregando URLs salvas...</p></div>
          ) : webSocketUrlList.length > 0 ? (
            <div className="space-y-3">
              <Label>URLs Salvas (Clique em 'Salvar Lista' para persistir alterações)</Label>
              <ScrollArea className="h-40 rounded-md border p-2">
                {webSocketUrlList.map((url, index) => (
                  <div key={index} className="flex items-center justify-between gap-2 p-1.5 border-b last:border-b-0">
                    <span className="text-sm truncate flex-1" title={url}>{url}</span>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => handleUseUrlForConnection(url)} disabled={isSavingConfig}>
                        <Play className="mr-1 h-3 w-3" /> Usar
                      </Button>
                      <Button variant="destructive" size="icon" className="h-7 w-7" onClick={() => handleRemoveUrl(index)} disabled={isSavingConfig}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-2">Nenhuma URL salva na lista.</p>
          )}

        </CardContent>
        <CardFooter>
          <Button onClick={handleSaveUrlList} disabled={isSavingConfig || isLoadingConfig}>
            {isSavingConfig ? <LoadingSpinner size="sm" /> : <Save className="mr-2 h-4 w-4" />}
            Salvar Lista de URLs no DB
          </Button>
        </CardFooter>
      </Card>

      <Separator />

      <Card className="flex-grow flex flex-col min-h-0">
        <CardHeader>
          <CardTitle className="flex items-center">
            <PlugZap className="mr-2 h-6 w-6 text-primary" />
            Conectar e Coletar Dados (Atualização em Tempo Real)
          </CardTitle>
          <CardDescription>
            A URL abaixo será usada para a conexão. Os dados de perfil e presentes vistos no chat serão salvos/atualizados no Firestore.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 flex-grow flex flex-col min-h-0">
          <div className="space-y-1">
            <Label htmlFor="wsUrlInputConnect">URL do WebSocket para Conexão Atual</Label>
            <div className="flex items-center gap-2">
              <Input
                id="wsUrlInputConnect"
                value={wsUrlInput}
                onChange={(e) => setWsUrlInput(e.target.value)}
                placeholder="wss://exemplo.com/socket"
                disabled={isConnecting}
              />
              <Button
                onClick={connectWebSocket}
                disabled={isConnecting || !wsUrlInput.trim()}
                className="h-10"
              >
                {isConnecting ? <LoadingSpinner size="sm" className="mr-2" /> : <PlugZap className="mr-2 h-4 w-4" />}
                {(socketRef.current && socketRef.current.readyState === WebSocket.OPEN && socketRef.current.url === wsUrlInput.trim()) ? "Reconectar ao Chat" : "Conectar ao Chat"}
              </Button>
              <Button
                variant="outline"
                onClick={disconnectWebSocket}
                disabled={!socketRef.current || (socketRef.current.readyState !== WebSocket.OPEN && socketRef.current.readyState !== WebSocket.CONNECTING)}
                className="h-10"
              >
                <WifiOff className="mr-2 h-4 w-4" />
                Desconectar
              </Button>
            </div>
          </div>


          <div className="mt-4 space-y-1">
            <Label>Status da Conexão:</Label>
            <p className="text-sm p-2 bg-muted rounded-md">{connectionStatus}</p>
            {errorDetails && (
              <p className="text-sm text-destructive p-2 bg-destructive/10 rounded-md">Detalhes do Erro: {errorDetails}</p>
            )}
          </div>

          <div className="mt-2 flex-grow flex flex-col min-h-0">
            <div className="flex justify-between items-center mb-1">
              <Label htmlFor="rawMessagesArea">Logs e Mensagens Coletadas ({logs.length}):</Label>
              <Button variant="outline" size="sm" onClick={() => setLogs([])} disabled={logs.length === 0}>
                <Trash2 className="mr-2 h-3 w-3" /> Limpar Logs da Tela
              </Button>
            </div>
            <ScrollArea id="rawMessagesArea" className="flex-grow h-72 rounded-md border bg-muted/30 p-1 mt-1">
              <div className="p-3 space-y-3">
                {logs.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhuma mensagem ou log para exibir...</p>}
                {logs.map(log => (
                  <div key={log.id}
                    className={`text-xs p-2 rounded-md border ${log.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' :
                      log.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' :
                        log.type === 'warning' ? 'bg-yellow-50 border-yellow-200 text-yellow-700' :
                          log.type === 'received' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                            log.type === 'sent' ? 'bg-purple-50 border-purple-200 text-purple-700' :
                              'bg-gray-50 border-gray-200 text-gray-700'
                      }`}>
                    <div className="flex justify-between items-center mb-1">
                      <p className={cn("font-semibold", (log.type === 'system' || log.type === 'error') ? "text-destructive" : "")}>
                        {log.type.charAt(0).toUpperCase() + log.type.slice(1)} às: {log.timestamp}
                      </p>
                      {log.classification && log.type === 'received' && (
                        <Badge variant="secondary" className={cn(`text-xs`,
                          log.classification === "Dados da LIVE" && "bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200",
                          log.classification === "Mensagem de Chat" && "bg-teal-100 text-teal-700 border-teal-200 hover:bg-teal-200",
                          log.classification === "Presentes da Sala" && "bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-200",
                          log.classification === "Dados da Sala" && "bg-sky-100 text-sky-700 border-sky-200 hover:bg-sky-200",
                          log.classification === "Dados de Jogo" && "bg-green-100 text-green-700 border-green-200 hover:bg-green-200",
                          log.classification === "Dados Externos" && "bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200",
                          log.classification === "Evento de Perfil (Usuário)" && "bg-indigo-100 text-indigo-700 border-indigo-200 hover:bg-indigo-200",
                          log.classification === "Entrada de Usuário" && "bg-lime-100 text-lime-700 border-lime-200 hover:bg-lime-200",
                          log.classification === "Contagem de Usuários" && "bg-cyan-100 text-cyan-700 border-cyan-200 hover:bg-cyan-200",
                          log.classification === "JSON Não Classificado" && "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200",
                        )}>
                          {log.classification === "Dados da LIVE" && <RadioTower className="mr-1.5 h-3 w-3" />}
                          {log.classification === "Mensagem de Chat" && <MessageSquare className="mr-1.5 h-3 w-3" />}
                          {log.classification === "Presentes da Sala" && <GiftIcon className="mr-1.5 h-3 w-3" />}
                          {log.classification === "Dados da Sala" && <Info className="mr-1.5 h-3 w-3" />}
                          {log.classification === "Dados de Jogo" && <Gamepad2 className="mr-1.5 h-3 w-3" />}
                          {log.classification === "Dados Externos" && <LinkIconLucide className="mr-1.5 h-3 w-3" />}
                          {log.classification === "Evento de Perfil (Usuário)" && <UserCircle2 className="mr-1.5 h-3 w-3" />}
                          {log.classification === "Entrada de Usuário" && <UserCircle2 className="mr-1.5 h-3 w-3" />}
                          {log.classification === "Contagem de Usuários" && <Users className="mr-1.5 h-3 w-3" />}
                          {log.classification}
                        </Badge>
                      )}
                    </div>
                    {log.type === 'received' && log.parsedUserData && (
                      <Card className="mb-2 mt-1 border-border/50">
                        <CardHeader className="p-2 bg-background/50">
                          <CardTitle className={cn(`text-sm font-semibold flex items-center`,
                            log.parsedUserData.gender === 1 ? "text-primary" :
                              log.parsedUserData.gender === 2 ? "text-pink-500" : "text-foreground"
                          )}>
                            <Avatar className="h-8 w-8 mr-2 border">
                              <AvatarImage src={log.parsedUserData.avatarUrl} alt={log.parsedUserData.nickname} data-ai-hint="user avatar" />
                              <AvatarFallback>
                                {log.parsedUserData.nickname ? log.parsedUserData.nickname.substring(0, 2).toUpperCase() : <UserCircle2 size={16} />}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              {log.parsedUserData.nickname || "Usuário Desconhecido"}
                              {log.parsedUserData.level && <Badge variant="secondary" className="ml-2 text-xs">Nv. {log.parsedUserData.level}</Badge>}
                            </div>
                          </CardTitle>
                          {(log.parsedUserData.showId || log.parsedUserData.userId) &&
                            <CardDescription className="text-xs mt-0.5 pl-10">
                              {log.parsedUserData.showId && <span>Show ID: {log.parsedUserData.showId}</span>}
                              {log.parsedUserData.userId && log.parsedUserData.showId && <span className="mx-1">|</span>}
                              {log.parsedUserData.userId && <span>FUID: {log.parsedUserData.userId}</span>}
                            </CardDescription>
                          }
                        </CardHeader>
                      </Card>
                    )}

                    {log.type === 'received' && log.classification === "Mensagem de Chat" && log.parsedData?.text && (
                      <div className="mt-2 mb-3 p-3 bg-background/70 border border-border rounded-md">
                        <p className="text-sm text-foreground font-medium break-all">{log.parsedData.text}</p>
                      </div>
                    )}

                    {log.type === 'received' && log.classification === "Presentes da Sala" && log.parsedData && log.parsedUserData && (
                      <div className="mt-2 mb-3 p-3 bg-yellow-100/70 border border-yellow-200 rounded-md">
                        <p className="text-sm text-yellow-800 font-medium break-all">
                          <GiftIcon className="inline-block mr-1.5 h-4 w-4" />
                          {log.parsedUserData?.nickname || 'Usuário Desconhecido'} enviou {log.parsedData?.giftCount || 'um'} Presente ID {log.parsedData?.giftId}!
                          (Destinatário: Anfitrião da Sala)
                        </p>
                      </div>
                    )}

                    <p className="font-medium break-words text-xs">{log.message}</p>

                    {log.rawData && (
                      <details className="mt-1">
                        <summary className="cursor-pointer text-xs hover:underline flex items-center">
                          Ver dados originais
                          <Button variant="ghost" size="icon" className="ml-2 h-5 w-5" onClick={(e) => { e.stopPropagation(); handleCopyRawData(log.rawData!); }}>
                            <Copy className="h-3 w-3" />
                            <span className="sr-only">Copiar dados brutos</span>
                          </Button>
                        </summary>
                        <pre className="mt-1 p-1.5 bg-black/5 rounded text-xs overflow-x-auto whitespace-pre-wrap break-all">
                          {log.isJson && log.parsedData ? JSON.stringify(log.parsedData, null, 2) : log.rawData}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground">
            Conecte-se a um WebSocket para coletar dados. Perfis e presentes identificados serão salvos/atualizados no Firestore.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
