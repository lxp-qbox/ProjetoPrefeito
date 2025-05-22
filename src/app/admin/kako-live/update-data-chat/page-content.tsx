
"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { KakoProfile, KakoGift, UserProfile } from "@/types"; // Added UserProfile
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
  type: "success" | "error" | "info" | "warning";
}

const generateUniqueId = () => {
  return String(Date.now()) + '-' + Math.random().toString(36).substr(2, 9);
};

export default function AdminKakoLiveUpdateDataChatPageContent() {
  const { toast } = useToast();
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const socketRef = useRef<WebSocket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<string>("Desconectado");
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const isManuallyDisconnectingRef = useRef(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const addLog = useCallback((message: string, type: LogEntry['type']) => {
    setLogs(prevLogs => [{ id: generateUniqueId(), timestamp: new Date().toLocaleTimeString('pt-BR'), message, type }, ...prevLogs.slice(0, 199)]); // Keep last 200 logs
  }, []);

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
        avatarUrl: profileData.avatarUrl,
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
        // Gift doesn't exist, create it even with partial info
        const newGiftToSave: KakoGift = {
          id: giftId,
          name: giftDataSource.name || `Presente Desconhecido (ID: ${giftId})`,
          imageUrl: giftDataSource.imageUrl || `https://placehold.co/48x48.png?text=${giftId}`, // Placeholder image
          diamond: giftDataSource.diamond === undefined ? null : giftDataSource.diamond,
          display: giftDataSource.name && giftDataSource.imageUrl ? true : false, // Only display by default if we have full info
          createdAt: serverTimestamp(),
          dataAiHint: giftDataSource.name ? giftDataSource.name.toLowerCase().split(" ")[0] : "gift icon"
        };
        await setDoc(giftDocRef, newGiftToSave);
        if (giftDataSource.name && giftDataSource.imageUrl) {
            addLog(`Novo presente '${newGiftToSave.name}' (ID: ${giftId}) salvo no Firestore a partir do chat.`, "success");
        } else {
            addLog(`Novo presente (ID: ${giftId}) salvo com informações parciais. Edite em 'Lista de Presentes'.`, "warning");
        }
      } else {
        // Gift exists. Optionally update if more info comes from WS, or just update a 'lastSeenInChatAt' timestamp.
        // For now, we only create if it doesn't exist to avoid overwriting admin-edited data.
        const existingData = docSnap.data() as KakoGift;
        const updates: Partial<KakoGift> = {};
        let hasChanges = false;

        if (giftDataSource.name && giftDataSource.name !== existingData.name && existingData.name.startsWith("Presente Desconhecido")) {
          updates.name = giftDataSource.name;
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
    if (socketRef.current && (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING)) {
      addLog("Já conectado ou conectando ao WebSocket.", "info");
      return;
    }
    isManuallyDisconnectingRef.current = false;
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    setConnectionStatus(`Conectando a ${WS_URL}...`);
    setErrorDetails(null);
    addLog(`Tentando conectar a ${WS_URL}...`, "info");

    try {
      const newSocket = new WebSocket(WS_URL);
      socketRef.current = newSocket;

      newSocket.onopen = () => {
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
            const processUser = async (userData: any, isAnchor: boolean = false, currentRoomId?: string) => {
              if (userData && userData.userId) {
                const profileDataToUpsert: Partial<KakoProfile> & { id: string } = {
                  id: userData.userId, // FUID
                  nickname: userData.nickname || "N/A",
                  avatarUrl: userData.avatar || userData.avatarUrl || "",
                  level: userData.level,
                  numId: userData.numId,
                  showId: userData.showId || "",
                  gender: userData.gender,
                  signature: userData.signature,
                  isLiving: isAnchor ? userData.isLiving : undefined, // Only set isLiving if it's the anchor
                  roomId: isAnchor ? currentRoomId : undefined, // Only set roomId if it's the anchor
                };
                await upsertKakoProfileToFirestore(profileDataToUpsert);
              }
            };

            if (parsedJson.user) await processUser(parsedJson.user, false, parsedJson.roomId);
            if (parsedJson.anchor) await processUser(parsedJson.anchor, true, parsedJson.roomId);
            
            // Process Gift Data
            if (parsedJson.giftId) {
                const giftDetailsSource = parsedJson.gift || parsedJson; // Try top level if 'gift' object not present
                
                await upsertKakoGiftData({
                    id: parsedJson.giftId.toString(),
                    name: giftDetailsSource.name || giftDetailsSource.giftName,
                    imageUrl: giftDetailsSource.imageUrl || giftDetailsSource.giftIcon,
                    diamond: giftDetailsSource.diamond === undefined ? giftDetailsSource.giftDiamondValue : giftDetailsSource.diamond,
                });
            }

            addLog(`${jsonStr.substring(0, 150)}${jsonStr.length > 150 ? '...' : ''}`, "info");

          } else {
            addLog(`Dados brutos (não JSON): ${messageContentString.substring(0,150)}${messageContentString.length > 150 ? '...' : ''}`, "info");
          }
        } catch (e) {
          console.error("Erro ao processar mensagem WebSocket:", e, "Dados brutos:", messageContentString);
          addLog(`Erro ao processar mensagem: ${e instanceof Error ? e.message : String(e)}. Dados: ${messageContentString.substring(0,100)}...`, "error");
        }
      };

      newSocket.onerror = (errorEvent) => {
        const errorMsg = `Erro na conexão WebSocket: ${errorEvent.type || 'Tipo de erro desconhecido'}`;
        setConnectionStatus("Erro na Conexão");
        setErrorDetails(errorMsg);
        addLog(errorMsg, "error");
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
    }
  }, [addLog]); // Removed isManuallyDisconnectingRef as it's a ref

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
      // Setting to null is handled by onclose
    } else {
      addLog("Nenhuma conexão WebSocket ativa para desconectar.", "info");
      setConnectionStatus("Desconectado");
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
            Conecta-se ao WebSocket do Kako Live para capturar informações de usuários e presentes em tempo real e salvá-las/atualizá-las no Firestore.
            <br />
            URL do WebSocket: <code className="bg-muted px-1 rounded-sm text-xs">{WS_URL}</code>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Button onClick={connectWebSocket} disabled={socketRef.current?.readyState === WebSocket.OPEN || socketRef.current?.readyState === WebSocket.CONNECTING}>
              <PlugZap className="mr-2 h-4 w-4"/> 
              {socketRef.current?.readyState === WebSocket.CONNECTING ? "Conectando..." : (socketRef.current?.readyState === WebSocket.OPEN ? 'Conectado' : 'Conectar ao Chat')}
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
          <CardDescription>Mostrando os últimos 200 logs de salvamento/atualização e mensagens brutas.</CardDescription>
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

    