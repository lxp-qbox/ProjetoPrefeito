
"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { KakoProfile, KakoGift } from "@/types";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import { db, doc, getDoc, setDoc, updateDoc, serverTimestamp, Timestamp } from "@/lib/firebase";
import { PlugZap, WifiOff, Info } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

// Hardcoded WebSocket URL for data ingestion
const WS_URL = "wss://h5-ws.kako.live/ws/v1?roomId=67b9ed5fa4e716a084a23765"; 

interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  type: "success" | "error" | "info";
}

const generateUniqueId = () => {
  return String(Date.now()) + '-' + Math.random().toString(36).substr(2, 9);
};

export default function AdminKakoLiveUpdateDataChatPageContent() {
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const socketRef = useRef<WebSocket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<string>("Desconectado");
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const isManuallyDisconnectingRef = useRef(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const addLog = useCallback((message: string, type: LogEntry['type']) => {
    setLogs(prevLogs => [{ id: generateUniqueId(), timestamp: new Date().toLocaleTimeString('pt-BR'), message, type }, ...prevLogs.slice(0, 99)]);
  }, []);

  const upsertKakoProfileToFirestore = async (profileData: Omit<KakoProfile, 'lastFetchedAt' | 'id'> & { id: string }) => {
    if (!profileData.id) {
      console.error("Cannot upsert profile without an ID (FUID)", profileData);
      addLog(`Erro: Tentativa de salvar perfil Kako sem ID (FUID): ${profileData.nickname || 'Desconhecido'}`, "error");
      return;
    }
    const profileDocRef = doc(db, "kakoProfiles", profileData.id); // FUID is the document ID
    try {
      const docSnap = await getDoc(profileDocRef);
      const dataToSave: Partial<KakoProfile> & { lastFetchedAt: any } = {
        id: profileData.id, // Store FUID as 'id' field as well for querying if needed, though doc ID is primary
        nickname: profileData.nickname,
        avatarUrl: profileData.avatarUrl,
        level: profileData.level,
        numId: profileData.numId,
        showId: profileData.showId,
        gender: profileData.gender,
        // Add other fields like signature, area, school, isLiving, roomId if they are reliably present in WebSocket user objects
        signature: profileData.signature,
        area: profileData.area,
        school: profileData.school,
        isLiving: profileData.isLiving,
        roomId: profileData.roomId,
        lastFetchedAt: serverTimestamp(),
      };

      if (docSnap.exists()) {
        const existingData = docSnap.data() as KakoProfile;
        let hasChanges = false;
        const updates: Partial<KakoProfile> & { lastFetchedAt: any } = { lastFetchedAt: serverTimestamp() };

        if (profileData.nickname !== existingData.nickname) { updates.nickname = profileData.nickname; hasChanges = true; }
        if (profileData.avatarUrl !== existingData.avatarUrl) { updates.avatarUrl = profileData.avatarUrl; hasChanges = true; }
        if (profileData.level !== existingData.level) { updates.level = profileData.level; hasChanges = true; }
        if (profileData.showId !== existingData.showId) { updates.showId = profileData.showId; hasChanges = true; }
        if (profileData.numId !== existingData.numId) { updates.numId = profileData.numId; hasChanges = true; }
        if (profileData.gender !== existingData.gender) { updates.gender = profileData.gender; hasChanges = true; }
        if (profileData.signature !== existingData.signature) { updates.signature = profileData.signature; hasChanges = true; }
        if (profileData.isLiving !== existingData.isLiving) { updates.isLiving = profileData.isLiving; hasChanges = true; }
        if (profileData.roomId !== existingData.roomId) { updates.roomId = profileData.roomId; hasChanges = true; }
        
        if (hasChanges) {
          await updateDoc(profileDocRef, updates);
          addLog(`Perfil Kako de ${profileData.nickname} (ShowID: ${profileData.showId || 'N/A'}) atualizado no Firestore.`, "success");
        } else {
           await updateDoc(profileDocRef, { lastFetchedAt: serverTimestamp() });
           // addLog(`Perfil Kako de ${profileData.nickname} visto novamente. 'lastFetchedAt' atualizado.`, "info");
        }
      } else {
        await setDoc(profileDocRef, { ...dataToSave, createdAt: serverTimestamp() }); // Add createdAt for new profiles
        addLog(`Novo perfil Kako de ${profileData.nickname} (ShowID: ${profileData.showId || 'N/A'}) salvo no Firestore.`, "success");
      }
    } catch (error) {
      console.error("Erro ao salvar/atualizar perfil Kako no Firestore:", error);
      addLog(`Erro no Firestore ao salvar/atualizar ${profileData.nickname}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, "error");
    }
  };

  const upsertKakoGiftData = async (giftDataSource: {id: string, name?: string, imageUrl?: string, diamond?: number | null}) => {
    if (!giftDataSource.id) {
        addLog("Tentativa de salvar presente sem ID.", "error");
        return;
    }
    const giftId = giftDataSource.id.toString();
    const giftDocRef = doc(db, "kakoGifts", giftId);

    try {
        const docSnap = await getDoc(giftDocRef);
        if (!docSnap.exists()) {
            // Only create if name and imageUrl are present from the event
            if (giftDataSource.name && giftDataSource.imageUrl) {
                const newGiftToSave: KakoGift = {
                    id: giftId,
                    name: giftDataSource.name,
                    imageUrl: giftDataSource.imageUrl,
                    diamond: giftDataSource.diamond === undefined ? null : giftDataSource.diamond,
                    display: true, // Default to displayable
                    createdAt: serverTimestamp(),
                };
                await setDoc(giftDocRef, newGiftToSave);
                addLog(`Novo presente '${giftDataSource.name}' (ID: ${giftId}) salvo no Firestore a partir do chat.`, "success");
            } else {
                addLog(`Presente ID ${giftId} visto no chat, mas não cadastrado e sem informações (nome/imagem) para cadastro automático.`, "info");
            }
        } else {
             // Optionally, update a 'lastSeenInChatAt' timestamp or check if other details changed
             // For now, we just log it was seen and exists.
            //  addLog(`Presente ID ${giftId} ('${docSnap.data().name}') visto no chat, já existe no DB.`, "info");
        }
    } catch (error) {
        console.error(`Erro ao processar presente ID ${giftId} no Firestore:`, error);
        addLog(`Erro no Firestore ao processar presente ID ${giftId}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, "error");
    }
  };


  const connectWebSocket = useCallback(() => {
    if (socketRef.current && (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING)) {
      addLog("Já conectado ou conectando ao WebSocket.", "info");
      return;
    }
    isManuallyDisconnectingRef.current = false;
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    setIsConnecting(true);
    setConnectionStatus(`Conectando a ${WS_URL}...`);
    setErrorDetails(null);
    addLog(`Tentando conectar a ${WS_URL}...`, "info");

    try {
      const newSocket = new WebSocket(WS_URL);
      socketRef.current = newSocket;

      newSocket.onopen = () => {
        setIsConnecting(false);
        setConnectionStatus(`Conectado a ${WS_URL}`);
        addLog(`Conexão com ${WS_URL} estabelecida.`, "success");
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

            // Process User Data (sender, anchor, etc.)
            if (parsedJson.user && parsedJson.user.userId) {
              const userData = parsedJson.user;
              const profileDataToUpsert: Omit<KakoProfile, 'lastFetchedAt'> & { id: string } = {
                id: userData.userId, // FUID
                nickname: userData.nickname || "N/A",
                avatarUrl: userData.avatar || userData.avatarUrl || "",
                level: userData.level,
                numId: userData.numId,
                showId: userData.showId || "",
                gender: userData.gender,
                signature: userData.signature,
                // area, school, isLiving, roomId might also be in `user` or `anchor` objects
              };
              await upsertKakoProfileToFirestore(profileDataToUpsert);
            }
            if (parsedJson.anchor && parsedJson.anchor.userId) {
                 const anchorData = parsedJson.anchor;
                 const profileDataToUpsert: Omit<KakoProfile, 'lastFetchedAt'> & { id: string } = {
                    id: anchorData.userId,
                    nickname: anchorData.nickname || "N/A",
                    avatarUrl: anchorData.avatar || anchorData.avatarUrl || "",
                    level: anchorData.level,
                    numId: anchorData.numId,
                    showId: anchorData.showId || "",
                    gender: anchorData.gender,
                    isLiving: anchorData.isLiving,
                    roomId: parsedJson.roomId, // Room ID from top level, anchor is in this room
                 };
                 await upsertKakoProfileToFirestore(profileDataToUpsert);
            }
            
            // Process Gift Data
            if (parsedJson.giftId) {
                // Attempt to extract gift details from the event.
                // This structure is HYPOTHETICAL and needs to be confirmed from actual WebSocket gift events.
                const giftDetailsSource = parsedJson.gift || parsedJson.giftDetails || parsedJson;
                
                await upsertKakoGiftData({
                    id: parsedJson.giftId.toString(),
                    name: giftDetailsSource.name || giftDetailsSource.giftName, // Try different possible field names
                    imageUrl: giftDetailsSource.imageUrl || giftDetailsSource.giftIcon,
                    diamond: giftDetailsSource.diamond === undefined ? giftDetailsSource.giftDiamondValue : giftDetailsSource.diamond,
                });
            }

            addLog(`Mensagem recebida: ${jsonStr.substring(0, 150)}${jsonStr.length > 150 ? '...' : ''}`, "info");

          } else {
            // Not JSON or not a full JSON object, log as raw
            addLog(`Dados brutos recebidos: ${messageContentString.substring(0,150)}${messageContentString.length > 150 ? '...' : ''}`, "info");
          }
        } catch (e) {
          console.error("Erro ao processar mensagem WebSocket:", e, "Dados brutos:", messageContentString);
          addLog(`Erro ao processar mensagem WebSocket: ${e instanceof Error ? e.message : String(e)}. Dados: ${messageContentString.substring(0,100)}...`, "error");
        }
      };

      newSocket.onerror = (errorEvent) => {
        setIsConnecting(false);
        const errorMsg = `Erro na conexão WebSocket: ${errorEvent.type || 'Tipo de erro desconhecido'}`;
        setConnectionStatus("Erro na Conexão");
        setErrorDetails(errorMsg);
        addLog(errorMsg, "error");
      };

      newSocket.onclose = (closeEvent) => {
        setIsConnecting(false);
        let closeMsg = `Desconectado de ${newSocket.url}.`;
        if (closeEvent.code || closeEvent.reason) {
          closeMsg += ` Código: ${closeEvent.code}, Motivo: ${closeEvent.reason || 'N/A'}`;
        }
        
        if (socketRef.current === newSocket) { 
            if (!isManuallyDisconnectingRef.current) {
                setConnectionStatus("Desconectado - Tentando Reconectar...");
                addLog(`${closeMsg} Tentando reconectar em 5 segundos.`, "info");
                socketRef.current = null; 
                reconnectTimeoutRef.current = setTimeout(connectWebSocket, 5000);
            } else {
                setConnectionStatus("Desconectado");
                addLog("WebSocket Desconectado Manualmente.", "info");
                socketRef.current = null; 
            }
        }
      };
    } catch (error) {
      setIsConnecting(false);
      const errMsg = error instanceof Error ? error.message : "Erro desconhecido ao tentar conectar.";
      setConnectionStatus("Erro ao Iniciar Conexão");
      setErrorDetails(errMsg);
      addLog(`Falha ao Conectar WebSocket: ${errMsg}`, "error");
    }
  }, [addLog]); 

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
    } else {
      addLog("Nenhuma conexão WebSocket ativa para desconectar.", "info");
    }
  }, [addLog]);


  useEffect(() => {
    connectWebSocket(); 
    return () => {
      disconnectManually();
    };
  }, [connectWebSocket, disconnectManually]); 

  return (
    <div className="space-y-6 h-full flex flex-col p-6">
      <Card>
        <CardHeader>
          <CardTitle>Atualizar Dados em Tempo Real (Via Chat)</CardTitle>
          <CardDescription>
            Esta página conecta-se ao WebSocket do Kako Live para capturar informações de usuários e presentes em tempo real e salvá-las/atualizá-las no Firestore.
            <br />
            URL do WebSocket: <code className="bg-muted px-1 rounded-sm text-xs">{WS_URL}</code>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Button onClick={connectWebSocket} disabled={isConnecting || (socketRef.current?.readyState === WebSocket.OPEN)}>
              <PlugZap className="mr-2 h-4 w-4"/> 
              {isConnecting ? "Conectando..." : (socketRef.current?.readyState === WebSocket.OPEN ? 'Conectado' : 'Conectar ao Chat')}
            </Button>
            <Button variant="outline" onClick={disconnectManually} disabled={!socketRef.current || socketRef.current.readyState === WebSocket.CLOSED}>
              <WifiOff className="mr-2 h-4 w-4" />
              Desconectar Manualmente
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
            Logs de Atividade
          </CardTitle>
          <CardDescription>Mostrando os últimos 100 logs de salvamento/atualização de perfis, presentes e status da conexão.</CardDescription>
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
                    'bg-blue-50 border-blue-200 text-blue-700' // info
                  }`}>
                    <span className="font-semibold">{log.timestamp}:</span> {log.message}
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

