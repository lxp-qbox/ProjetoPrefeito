"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { KakoProfile, KakoGift, UserProfile } from "@/types";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import { db, doc, getDoc, setDoc, updateDoc, serverTimestamp, Timestamp } from "@/lib/firebase";
import { PlugZap, WifiOff, Info, Save, RefreshCw } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const DEFAULT_WS_URL = "wss://h5-ws.kako.live/ws/v1?roomId=67b9ed5fa4e716a084a23765"; 

interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  type: "success" | "error" | "info" | "warning" | "received" | "sent";
  rawData?: string;
}

const generateUniqueId = () => {
  return String(Date.now()) + '-' + Math.random().toString(36).substr(2, 9);
};

export default function AdminKakoLiveUpdateDataChatPageContent() {
  const { toast } = useToast();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const { currentUser } = useAuth(); // Assuming useAuth is available

  const [wsUrlInput, setWsUrlInput] = useState<string>(DEFAULT_WS_URL);
  const [savedWsUrl, setSavedWsUrl] = useState<string>("");
  const [isLoadingConfig, setIsLoadingConfig] = useState<boolean>(true);
  const [isSavingConfig, setIsSavingConfig] = useState<boolean>(false);

  const socketRef = useRef<WebSocket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<string>("Desconectado");
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const isManuallyDisconnectingRef = useRef(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const configDocRef = doc(db, "app_settings", "live_data_config");

  const addLog = useCallback((message: string, type: LogEntry['type'], rawData?: string) => {
    setLogs(prevLogs => [{ id: generateUniqueId(), timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }), message, type, rawData }, ...prevLogs.slice(0, 199)]);
  }, []);

  useEffect(() => {
    const fetchWsUrlConfig = async () => {
      setIsLoadingConfig(true);
      try {
        const docSnap = await getDoc(configDocRef);
        if (docSnap.exists() && docSnap.data()?.chatWebSocketUrl) {
          const url = docSnap.data()?.chatWebSocketUrl as string;
          setSavedWsUrl(url);
          setWsUrlInput(url);
          addLog(`URL do WebSocket carregada: ${url}`, "info");
        } else {
          addLog(`Nenhuma URL do WebSocket configurada. Usando padrão: ${DEFAULT_WS_URL}`, "info");
          setWsUrlInput(DEFAULT_WS_URL); // Set to default if not found
        }
      } catch (error) {
        console.error("Erro ao carregar URL do WebSocket:", error);
        addLog("Falha ao carregar configuração da URL do WebSocket.", "error");
        setWsUrlInput(DEFAULT_WS_URL); // Fallback to default on error
      } finally {
        setIsLoadingConfig(false);
      }
    };
    fetchWsUrlConfig();
  }, [addLog, configDocRef]);


  const upsertKakoProfileToFirestore = async (profileData: Partial<KakoProfile> & { id: string }) => {
    if (!profileData.id) {
      console.error("Cannot upsert profile without an ID (FUID)", profileData);
      addLog(`Erro: Tentativa de salvar perfil Kako sem ID (FUID): ${profileData.nickname || 'Desconhecido'}`, "error");
      return;
    }
    const profileDocRef = doc(db, "kakoProfiles", profileData.id);
    try {
      const docSnap = await getDoc(profileDocRef);
      const dataToSave: Partial<KakoProfile> & { lastFetchedAt: any } = {
        id: profileData.id,
        nickname: profileData.nickname,
        avatarUrl: profileData.avatarUrl, // Ensure this maps from 'avatar' if that's the source field name
        level: profileData.level,
        numId: profileData.numId,
        showId: profileData.showId,
        gender: profileData.gender,
        signature: profileData.signature,
        area: profileData.area,
        school: profileData.school,
        isLiving: profileData.isLiving,
        roomId: profileData.roomId,
        lastFetchedAt: serverTimestamp(),
      };

      Object.keys(dataToSave).forEach(key => dataToSave[key as keyof typeof dataToSave] === undefined && delete dataToSave[key as keyof typeof dataToSave]);

      if (docSnap.exists()) {
        const existingData = docSnap.data() as KakoProfile;
        let hasChanges = false;
        const updates: Partial<KakoProfile> & { lastFetchedAt: any } = { lastFetchedAt: serverTimestamp() };

        if (profileData.nickname !== undefined && profileData.nickname !== existingData.nickname) { updates.nickname = profileData.nickname; hasChanges = true; }
        if (profileData.avatarUrl !== undefined && profileData.avatarUrl !== existingData.avatarUrl) { updates.avatarUrl = profileData.avatarUrl; hasChanges = true; }
        if (profileData.level !== undefined && profileData.level !== existingData.level) { updates.level = profileData.level; hasChanges = true; }
        if (profileData.showId !== undefined && profileData.showId !== existingData.showId) { updates.showId = profileData.showId; hasChanges = true; }
        if (profileData.numId !== undefined && profileData.numId !== existingData.numId) { updates.numId = profileData.numId; hasChanges = true; }
        if (profileData.gender !== undefined && profileData.gender !== existingData.gender) { updates.gender = profileData.gender; hasChanges = true; }
        if (profileData.signature !== undefined && profileData.signature !== existingData.signature) { updates.signature = profileData.signature; hasChanges = true; }
        if (profileData.isLiving !== undefined && profileData.isLiving !== existingData.isLiving) { updates.isLiving = profileData.isLiving; hasChanges = true; }
        if (profileData.roomId !== undefined && profileData.roomId !== existingData.roomId) { updates.roomId = profileData.roomId; hasChanges = true; }
        
        if (hasChanges) {
          await updateDoc(profileDocRef, updates);
          addLog(`Perfil Kako de ${profileData.nickname || existingData.nickname} (ShowID: ${profileData.showId || existingData.showId || 'N/A'}) atualizado no Firestore.`, "success");
        } else {
           await updateDoc(profileDocRef, { lastFetchedAt: serverTimestamp() });
        }
      } else {
        const newProfileData = { ...dataToSave, createdAt: serverTimestamp() };
        await setDoc(profileDocRef, newProfileData);
        addLog(`Novo perfil Kako de ${profileData.nickname || 'Desconhecido'} (ShowID: ${profileData.showId || 'N/A'}) salvo no Firestore.`, "success");
      }
    } catch (error) {
      console.error("Erro ao salvar/atualizar perfil Kako no Firestore:", error);
      addLog(`Erro no Firestore ao salvar/atualizar ${profileData.nickname || 'Desconhecido'}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, "error");
    }
  };

  const upsertKakoGiftData = async (giftDataSource: { id: string, name?: string, imageUrl?: string, diamond?: number | null }) => {
    if (!giftDataSource.id) {
      addLog("Tentativa de salvar presente sem ID.", "error");
      return;
    }
    const giftId = giftDataSource.id.toString();
    const giftDocRef = doc(db, "kakoGifts", giftId);

    try {
      const docSnap = await getDoc(giftDocRef);
      if (!docSnap.exists()) {
        const newGiftToSave: KakoGift = {
          id: giftId,
          name: giftDataSource.name || `Presente Desconhecido (ID: ${giftId})`,
          imageUrl: giftDataSource.imageUrl || `https://placehold.co/48x48.png?text=${giftId}`,
          diamond: giftDataSource.diamond === undefined ? null : giftDataSource.diamond,
          display: !!(giftDataSource.name && giftDataSource.imageUrl),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          dataAiHint: giftDataSource.name ? giftDataSource.name.toLowerCase().split(" ")[0].replace(/[^a-z0-9]/gi, '') : "gift icon"
        };
        await setDoc(giftDocRef, newGiftToSave);
        addLog(`Novo presente '${newGiftToSave.name}' (ID: ${giftId}) ${newGiftToSave.display ? 'salvo com detalhes.' : 'salvo com info parcial.'}`, newGiftToSave.display ? "success" : "warning");
      } else {
        const existingData = docSnap.data() as KakoGift;
        const updates: Partial<KakoGift> = {};
        let hasChanges = false;

        if (giftDataSource.name && giftDataSource.name !== existingData.name && existingData.name.startsWith("Presente Desconhecido")) {
          updates.name = giftDataSource.name;
          updates.dataAiHint = giftDataSource.name.toLowerCase().split(" ")[0].replace(/[^a-z0-9]/gi, '');
          hasChanges = true;
        }
        if (giftDataSource.imageUrl && giftDataSource.imageUrl !== existingData.imageUrl && existingData.imageUrl.startsWith("https://placehold.co")) {
          updates.imageUrl = giftDataSource.imageUrl;
          hasChanges = true;
        }
        if (giftDataSource.diamond !== undefined && giftDataSource.diamond !== existingData.diamond) {
          updates.diamond = giftDataSource.diamond;
          hasChanges = true;
        }
        if (hasChanges) {
          updates.updatedAt = serverTimestamp();
          await updateDoc(giftDocRef, updates);
          addLog(`Presente ID ${giftId} ('${updates.name || existingData.name}') atualizado com informações do chat.`, "info");
        }
      }
    } catch (error) {
      console.error(`Erro ao processar presente ID ${giftId} no Firestore:`, error);
      addLog(`Erro no Firestore ao processar presente ID ${giftId}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, "error");
    }
  };

  const connectWebSocket = useCallback(() => {
    const urlToConnect = wsUrlInput.trim();
    if (!urlToConnect || (!urlToConnect.startsWith("ws://") && !urlToConnect.startsWith("wss://"))) {
      toast({ title: "URL Inválida", description: "Por favor, insira uma URL WebSocket válida (ws:// ou wss://).", variant: "destructive" });
      setConnectionStatus("URL Inválida");
      return;
    }

    if (socketRef.current && (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING)) {
        addLog(`Fechando conexão existente com ${socketRef.current.url} para reconectar.`, "info");
        isManuallyDisconnectingRef.current = true; // Temporarily set to prevent auto-reconnect for this specific action
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        socketRef.current.onopen = null;
        socketRef.current.onmessage = null;
        socketRef.current.onerror = null;
        socketRef.current.onclose = null;
        socketRef.current.close();
        socketRef.current = null;
    }
    
    isManuallyDisconnectingRef.current = false;
    setConnectionStatus(`Conectando a ${urlToConnect}...`);
    setErrorDetails(null);
    addLog(`Tentando conectar a ${urlToConnect}...`, "info");

    try {
      const newSocket = new WebSocket(urlToConnect);
      socketRef.current = newSocket;

      newSocket.onopen = () => {
        setConnectionStatus(`Conectado a: ${newSocket.url}`);
        addLog(`Conexão estabelecida com ${newSocket.url}`, "success");
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
            
            addLog(`Mensagem recebida: ${jsonStr.substring(0, 150)}${jsonStr.length > 150 ? '...' : ''}`, "received", jsonStr);

            const processUser = async (userData: any, isAnchor: boolean = false, currentRoomId?: string) => {
              if (userData && userData.userId) {
                const profileDataToUpsert: Partial<KakoProfile> & { id: string } = {
                  id: userData.userId,
                  nickname: userData.nickname || "N/A",
                  avatarUrl: userData.avatar || userData.avatarUrl || "",
                  level: userData.level,
                  numId: userData.numId,
                  showId: userData.showId || "",
                  gender: userData.gender,
                  signature: userData.signature,
                  isLiving: isAnchor ? userData.isLiving : undefined,
                  roomId: isAnchor ? currentRoomId : undefined,
                };
                await upsertKakoProfileToFirestore(profileDataToUpsert);
              }
            };

            if (parsedJson.user) await processUser(parsedJson.user, false, parsedJson.roomId);
            if (parsedJson.anchor) await processUser(parsedJson.anchor, true, parsedJson.roomId);
            
            if (parsedJson.giftId) {
                const giftDetailsSource = parsedJson.gift || parsedJson;
                await upsertKakoGiftData({
                    id: parsedJson.giftId.toString(),
                    name: giftDetailsSource.name || giftDetailsSource.giftName,
                    imageUrl: giftDetailsSource.imageUrl || giftDetailsSource.giftIcon,
                    diamond: giftDetailsSource.diamond === undefined ? giftDetailsSource.giftDiamondValue : giftDetailsSource.diamond,
                });
            }
          } else {
            addLog(`Dados brutos (não JSON): ${messageContentString.substring(0,150)}${messageContentString.length > 150 ? '...' : ''}`, "received", messageContentString);
          }
        } catch (e) {
          console.error("Erro ao processar mensagem WebSocket:", e, "Dados brutos:", messageContentString);
          addLog(`Erro ao processar mensagem: ${e instanceof Error ? e.message : String(e)}. Dados: ${messageContentString.substring(0,100)}...`, "error", messageContentString);
        }
      };

      newSocket.onerror = (errorEvent) => {
        const errorMsg = `Erro na conexão WebSocket: ${errorEvent.type || 'Tipo de erro desconhecido'}`;
        setConnectionStatus("Erro na Conexão");
        setErrorDetails(errorMsg);
        addLog(errorMsg, "error");
        if (socketRef.current === newSocket) { // Ensure it's the current socket
            newSocket.onopen = null; newSocket.onmessage = null; newSocket.onerror = null; newSocket.onclose = null;
            if(newSocket.readyState === WebSocket.OPEN || newSocket.readyState === WebSocket.CONNECTING) newSocket.close();
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
                addLog(`${closeMsg} Tentando reconectar em 5 segundos.`, "warning");
                socketRef.current = null; 
                if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
                reconnectTimeoutRef.current = setTimeout(connectWebSocket, 5000);
            } else {
                setConnectionStatus("Desconectado");
                addLog("WebSocket Desconectado Manualmente.", "info");
                socketRef.current = null; 
            }
        }
      };

    } catch (error) {
      const errMsg = error instanceof Error ? error.message : "Erro desconhecido ao tentar conectar.";
      setConnectionStatus("Erro ao Iniciar Conexão");
      setErrorDetails(errMsg);
      addLog(`Falha ao Conectar WebSocket: ${errMsg}`, "error");
      if(socketRef.current) { socketRef.current.close(); socketRef.current = null; }
    }
  }, [wsUrlInput, toast, addLog]);

  const disconnectManually = useCallback(() => {
    isManuallyDisconnectingRef.current = true; 
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (socketRef.current) {
      addLog("Desconectando WebSocket manualmente...", "info");
      socketRef.current.onopen = null;
      socketRef.current.onmessage = null;
      socketRef.current.onerror = null;
      socketRef.current.onclose = null; 
      socketRef.current.close();
      socketRef.current = null;
      setConnectionStatus("Desconectado");
    } else {
      addLog("Nenhuma conexão WebSocket ativa para desconectar.", "info");
      setConnectionStatus("Desconectado"); // Ensure status is updated even if no active socket
    }
  }, [addLog]);

  const handleSaveWsUrl = async () => {
      const urlToSave = wsUrlInput.trim();
      if (!urlToSave || (!urlToSave.startsWith("ws://") && !urlToSave.startsWith("wss://"))) {
        toast({ title: "URL Inválida", description: "Por favor, insira uma URL WebSocket válida.", variant: "destructive" });
        return;
      }
      setIsSavingConfig(true);
      try {
        await setDoc(configDocRef, { chatWebSocketUrl: urlToSave, lastUpdatedAt: serverTimestamp() }, { merge: true });
        setSavedWsUrl(urlToSave);
        toast({ title: "URL Salva", description: "A URL do WebSocket foi salva com sucesso." });
        addLog(`URL do WebSocket salva: ${urlToSave}`, "success");
      } catch (error) {
        console.error("Erro ao salvar URL do WebSocket:", error);
        toast({ title: "Erro ao Salvar URL", description: "Não foi possível salvar a URL.", variant: "destructive" });
        addLog("Falha ao salvar a URL do WebSocket.", "error");
      } finally {
        setIsSavingConfig(false);
      }
    };

  useEffect(() => {
    // No auto-connect on mount, user clicks button
    return () => {
      disconnectManually();
    };
  }, [disconnectManually]); 

  return (
    <div className="space-y-6 h-full flex flex-col p-6">
      <Card>
        <CardHeader>
          <CardTitle>Atualizar Dados em Tempo Real (Via Chat)</CardTitle>
          <CardDescription>
            Conecte-se ao WebSocket do Kako Live para capturar informações de usuários e presentes em tempo real e salvá-las/atualizá-las no Firestore.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="wsUrlInput">URL do WebSocket para Coleta de Dados</Label>
            <div className="flex items-center gap-2">
              <Input
                id="wsUrlInput"
                value={wsUrlInput}
                onChange={(e) => setWsUrlInput(e.target.value)}
                placeholder="wss://exemplo.com/socket"
                disabled={isLoadingConfig}
              />
              <Button onClick={handleSaveWsUrl} disabled={isSavingConfig || isLoadingConfig || wsUrlInput.trim() === savedWsUrl}>
                {isSavingConfig ? <LoadingSpinner size="sm" /> : <Save className="mr-2 h-4 w-4" />}
                Salvar URL
              </Button>
            </div>
            {isLoadingConfig && <p className="text-xs text-muted-foreground">Carregando URL salva...</p>}
            {savedWsUrl && <p className="text-xs text-muted-foreground">URL Salva: {savedWsUrl}</p>}
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={connectWebSocket} disabled={!wsUrlInput.trim() || isLoadingConfig || (socketRef.current?.readyState === WebSocket.OPEN && socketRef.current?.url === wsUrlInput.trim())}>
              <PlugZap className="mr-2 h-4 w-4"/> 
              {socketRef.current?.readyState === WebSocket.CONNECTING ? "Conectando..." : 
               (socketRef.current?.readyState === WebSocket.OPEN && socketRef.current?.url === wsUrlInput.trim()) ? 'Reconectar' : 'Conectar ao Chat'}
            </Button>
            <Button variant="outline" onClick={disconnectManually} disabled={!socketRef.current || socketRef.current.readyState === WebSocket.CLOSED}>
              <WifiOff className="mr-2 h-4 w-4" />
              Desconectar
            </Button>
            <Button variant="outline" onClick={() => setLogs([])} disabled={logs.length === 0}>
                <RefreshCw className="mr-2 h-4 w-4" /> Limpar Logs
            </Button>
          </div>
          <p className="text-sm p-2 bg-muted rounded-md">
            Status da Conexão: <span className={
              connectionStatus.startsWith("Conectado") ? "text-green-600 font-semibold" : 
              connectionStatus.startsWith("Erro") || connectionStatus.includes("Reconectar") ? "text-destructive font-semibold" : 
              "text-muted-foreground"
            }>{connectionStatus}</span>
          </p>
          {errorDetails && (
            <p className="text-xs text-destructive p-2 bg-destructive/10 rounded-md">
              Detalhes do Erro: {errorDetails}
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="flex-grow flex flex-col min-h-0">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Info className="mr-2 h-5 w-5 text-primary" />
            Logs de Atividade do WebSocket e Banco de Dados
          </CardTitle>
          <CardDescription>Mostrando os últimos {logs.length} logs.</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow p-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-2">
              {logs.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">Nenhuma atividade registrada ainda...</p>
              ) : (
                logs.map(log => (
                  <div key={log.id} className={`text-xs p-2 rounded-md border ${
                    log.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' :
                    log.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' :
                    log.type === 'warning' ? 'bg-yellow-50 border-yellow-200 text-yellow-700' :
                    log.type === 'received' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                    log.type === 'sent' ? 'bg-purple-50 border-purple-200 text-purple-700' :
                    'bg-gray-50 border-gray-200 text-gray-700' // info
                  }`}>
                    <span className="font-semibold">{log.timestamp}:</span> {log.message}
                    {log.rawData && (
                        <details className="mt-1">
                            <summary className="cursor-pointer text-xs hover:underline">Ver dados brutos</summary>
                            <pre className="mt-1 p-1.5 bg-black/5 rounded text-xs overflow-x-auto whitespace-pre-wrap break-all">{log.rawData}</pre>
                        </details>
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
