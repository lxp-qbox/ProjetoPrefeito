
"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { KakoProfile } from "@/types";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import { db, doc, getDoc, setDoc, updateDoc, serverTimestamp } from "@/lib/firebase";
import { PlugZap, WifiOff, Info } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

// Hardcoded WebSocket URL for data ingestion
const WS_URL = "wss://h5-ws.kako.live/ws/v1?roomId=67b9ed5fa4e716a084a23765"; // Example Room ID for data gathering

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

  const upsertKakoProfileToFirestore = async (profileData: Omit<KakoProfile, 'lastFetchedAt'> & { id: string }) => {
    if (!profileData.id) {
      console.error("Cannot upsert profile without an ID", profileData);
      addLog(`Erro: Tentativa de salvar perfil sem ID: ${profileData.nickname || 'Desconhecido'}`, "error");
      return;
    }
    const profileDocRef = doc(db, "kakoProfiles", profileData.id);
    try {
      const docSnap = await getDoc(profileDocRef);
      const dataToSave: KakoProfile = {
        id: profileData.id,
        nickname: profileData.nickname,
        avatarUrl: profileData.avatarUrl, // Assuming 'avatarUrl' is what KakoProfile type expects
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

        if (profileData.nickname !== existingData.nickname) { updates.nickname = profileData.nickname; hasChanges = true; }
        if (profileData.avatarUrl !== existingData.avatarUrl) { updates.avatarUrl = profileData.avatarUrl; hasChanges = true; }
        if (profileData.level !== existingData.level) { updates.level = profileData.level; hasChanges = true; }
        if (profileData.showId !== existingData.showId) { updates.showId = profileData.showId; hasChanges = true; }
        if (profileData.numId !== existingData.numId) { updates.numId = profileData.numId; hasChanges = true; }
        if (profileData.gender !== existingData.gender) { updates.gender = profileData.gender; hasChanges = true; }
        
        if (hasChanges) {
          await updateDoc(profileDocRef, updates);
          addLog(`Perfil de ${profileData.nickname} atualizado no Firestore.`, "success");
        } else {
           await updateDoc(profileDocRef, { lastFetchedAt: serverTimestamp() });
           // addLog(`Perfil de ${profileData.nickname} visto novamente. 'lastFetchedAt' atualizado.`, "info"); // Can be noisy
        }
      } else {
        await setDoc(profileDocRef, dataToSave);
        addLog(`Novo perfil de ${profileData.nickname} salvo no Firestore.`, "success");
      }
    } catch (error) {
      console.error("Erro ao salvar/atualizar perfil Kako no Firestore:", error);
      addLog(`Erro no Firestore ao salvar/atualizar ${profileData.nickname}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, "error");
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

            if (parsedJson.user && parsedJson.user.userId) {
              const userData = parsedJson.user;
              const newProfileData = {
                id: userData.userId,
                nickname: userData.nickname || "N/A",
                avatarUrl: userData.avatar || userData.avatarUrl || "",
                level: userData.level,
                numId: userData.numId,
                showId: userData.showId,
                gender: userData.gender,
              };
              await upsertKakoProfileToFirestore(newProfileData);
            }
             // You can add more specific parsing for other message types if needed
             // e.g., if (parsedJson.anchor && ...) for host updates
          }
        } catch (e) {
          console.error("Erro ao processar mensagem WebSocket:", e, "Dados brutos:", messageContentString);
          addLog(`Erro ao processar mensagem WebSocket: ${e instanceof Error ? e.message : String(e)}`, "error");
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addLog]); // Added addLog to dependencies

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
      // socketRef.current = null; // onclose handler will set this
    } else {
      addLog("Nenhuma conexão WebSocket ativa para desconectar.", "info");
    }
  }, [addLog]);


  // Auto-connect on mount
  useEffect(() => {
    connectWebSocket(); 
    return () => {
      disconnectManually();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // connectWebSocket and disconnectManually are stable due to useCallback

  return (
    <div className="space-y-6 h-full flex flex-col p-6">
      <Card>
        <CardHeader>
          <CardTitle>Atualizar Dados em Tempo Real (Via Chat)</CardTitle>
          <CardDescription>
            Esta página conecta-se ao WebSocket do Kako Live para capturar informações de usuários em tempo real e salvá-las/atualizá-las no Firestore.
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
              Desconectar
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
          <CardDescription>Mostrando os últimos 100 logs de salvamento/atualização de perfis e status da conexão.</CardDescription>
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
