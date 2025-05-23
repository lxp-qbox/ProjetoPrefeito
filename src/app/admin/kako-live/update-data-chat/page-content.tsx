
"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/hooks/use-auth';
import { db, doc, getDoc, setDoc, serverTimestamp, Timestamp, updateDoc } from "@/lib/firebase";
import { PlugZap, WifiOff, Info, Save, RefreshCw, Trash2, ListPlus, Copy, Play } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

const DEFAULT_WS_URL = "wss://h5-ws.kako.live/ws/v1?roomId=67b9ed5fa4e716a084a23765"; 

interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  type: "success" | "error" | "info" | "received" | "sent";
  rawData?: string;
}

const generateUniqueId = () => {
  return String(Date.now()) + '-' + Math.random().toString(36).substr(2, 9);
};

export default function AdminKakoLiveUpdateDataChatPageContent() {
  const { toast } = useToast();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const { currentUser } = useAuth(); 

  const [wsUrlInput, setWsUrlInput] = useState<string>(DEFAULT_WS_URL); // URL for current connection attempt
  const [webSocketUrlList, setWebSocketUrlList] = useState<string[]>([]); // List of saved URLs
  const [newWsUrlToAdd, setNewWsUrlToAdd] = useState<string>(""); // Input for adding a new URL to the list

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

  const fetchWsUrlConfig = useCallback(async () => {
    setIsLoadingConfig(true);
    addLog("Carregando configurações de URL do WebSocket...", "info");
    try {
      const docSnap = await getDoc(configDocRef);
      if (docSnap.exists() && docSnap.data()?.webSocketUrlList) {
        const urls = docSnap.data()?.webSocketUrlList as string[];
        setWebSocketUrlList(urls);
        if (urls.length > 0) {
          setWsUrlInput(urls[0]); // Default to first URL in list for connection
          addLog(`Lista de URLs carregada. Usando: ${urls[0]}`, "info");
        } else {
          setWsUrlInput(DEFAULT_WS_URL);
          addLog(`Nenhuma URL salva. Usando padrão: ${DEFAULT_WS_URL}`, "info");
        }
      } else {
        setWebSocketUrlList([]);
        setWsUrlInput(DEFAULT_WS_URL);
        addLog(`Nenhuma configuração de URL encontrada. Usando padrão: ${DEFAULT_WS_URL}`, "info");
      }
    } catch (error) {
      console.error("Erro ao carregar lista de URLs do WebSocket:", error);
      addLog("Falha ao carregar lista de URLs do WebSocket.", "error");
      setWebSocketUrlList([]);
      setWsUrlInput(DEFAULT_WS_URL); 
    } finally {
      setIsLoadingConfig(false);
    }
  }, [addLog, configDocRef]);

  useEffect(() => {
    fetchWsUrlConfig();
  }, [fetchWsUrlConfig]);


  const connectWebSocket = useCallback(() => {
    // ... (connectWebSocket logic remains largely the same, using wsUrlInput) ...
    const urlToConnect = wsUrlInput.trim();
    if (!urlToConnect || (!urlToConnect.startsWith("ws://") && !urlToConnect.startsWith("wss://"))) {
      toast({ title: "URL Inválida", description: "Por favor, insira uma URL WebSocket válida (ws:// ou wss://).", variant: "destructive" });
      setConnectionStatus("URL Inválida");
      return;
    }

    if (socketRef.current && (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING)) {
        addLog(`Fechando conexão existente com ${socketRef.current.url} para reconectar.`, "info");
        isManuallyDisconnectingRef.current = true; 
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
        // ... (existing onmessage logic to parse and log, and upsert profiles/gifts) ...
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

            // ... (existing logic to upsertKakoProfileToFirestore and upsertKakoGiftData) ...

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
        if (socketRef.current === newSocket) { 
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
      setConnectionStatus("Desconectado");
    }
  }, [addLog]);

  useEffect(() => {
    return () => {
      disconnectManually();
    };
  }, [disconnectManually]); 

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
    addLog("Salvando lista de URLs no banco de dados...", "info");
    try {
      // Check if document exists to decide between setDoc and updateDoc, or just use setDoc with merge
      const docSnap = await getDoc(configDocRef);
      if(docSnap.exists()){
        await updateDoc(configDocRef, { webSocketUrlList: webSocketUrlList, lastUpdatedAt: serverTimestamp() });
      } else {
        await setDoc(configDocRef, { webSocketUrlList: webSocketUrlList, lastUpdatedAt: serverTimestamp() });
      }
      toast({ title: "Lista de URLs Salva!", description: "A lista de URLs do WebSocket foi salva com sucesso." });
      addLog("Lista de URLs salva no banco de dados.", "success");
    } catch (error) {
      console.error("Erro ao salvar lista de URLs do WebSocket:", error);
      toast({ title: "Erro ao Salvar Lista", description: "Não foi possível salvar a lista de URLs.", variant: "destructive" });
      addLog("Falha ao salvar a lista de URLs no banco de dados.", "error");
    } finally {
      setIsSavingConfig(false);
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col p-6">
      <Card>
        <CardHeader>
          <CardTitle>Configurar e Salvar URLs de WebSocket</CardTitle>
          <CardDescription>
            Adicione, remova e salve uma lista de URLs de WebSocket para usar na coleta de dados.
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
                disabled={isLoadingConfig}
              />
              <Button onClick={handleAddNewUrl} disabled={isLoadingConfig || !newWsUrlToAdd.trim()}>
                <ListPlus className="mr-2 h-4 w-4" /> Adicionar à Lista
              </Button>
            </div>
          </div>

          {webSocketUrlList.length > 0 && (
            <div className="space-y-3">
              <Label>URLs Salvas (Clique em 'Salvar Lista' para persistir alterações)</Label>
              <ScrollArea className="h-40 rounded-md border p-2">
                {webSocketUrlList.map((url, index) => (
                  <div key={index} className="flex items-center justify-between gap-2 p-1.5 border-b last:border-b-0">
                    <span className="text-sm truncate flex-1" title={url}>{url}</span>
                    <div className="flex gap-1 shrink-0">
                       <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => handleUseUrlForConnection(url)}>
                         <Play className="mr-1 h-3 w-3"/> Usar
                       </Button>
                       <Button variant="destructive" size="icon" className="h-7 w-7" onClick={() => handleRemoveUrl(index)}>
                         <Trash2 className="h-3 w-3" />
                       </Button>
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </div>
          )}
           {webSocketUrlList.length === 0 && !isLoadingConfig && (
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

      <Card className="flex-grow flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Link className="mr-2 h-6 w-6 text-primary" />
            Conectar e Testar WebSocket
          </CardTitle>
          <CardDescription>
            A URL abaixo será usada para a conexão. Você pode digitá-la ou usar uma da lista acima clicando em "Usar".
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 flex-grow flex flex-col">
          <div className="space-y-1">
            <Label htmlFor="wsUrlInputConnect">URL do WebSocket para Conexão Atual</Label>
            <Input
              id="wsUrlInputConnect"
              value={wsUrlInput}
              onChange={(e) => setWsUrlInput(e.target.value)}
              placeholder="wss://exemplo.com/socket"
              disabled={socketRef.current?.readyState === WebSocket.CONNECTING}
            />
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={connectWebSocket}
              disabled={(socketRef.current?.readyState === WebSocket.CONNECTING) || !wsUrlInput.trim()}
            >
              {(socketRef.current?.readyState === WebSocket.CONNECTING) ? <LoadingSpinner size="sm" className="mr-2" /> : <PlugZap className="mr-2 h-4 w-4" />}
              {(socketRef.current?.readyState === WebSocket.CONNECTING) ? "Conectando..." : 
               (socketRef.current && socketRef.current.readyState === WebSocket.OPEN && socketRef.current.url === wsUrlInput.trim()) ? "Reconectar ao Chat" : "Conectar ao Chat"}
            </Button>
            <Button
              variant="outline"
              onClick={disconnectManually}
              disabled={!socketRef.current || (socketRef.current.readyState !== WebSocket.OPEN && socketRef.current.readyState !== WebSocket.CONNECTING)}
            >
              <WifiOff className="mr-2 h-4 w-4" />
              Desconectar
            </Button>
          </div>

          <div className="mt-4 space-y-1">
            <Label>Status da Conexão:</Label>
            <p className="text-sm p-2 bg-muted rounded-md">{connectionStatus}</p>
            {errorDetails && (
              <p className="text-sm text-destructive p-2 bg-destructive/10 rounded-md">Detalhes do Erro: {errorDetails}</p>
            )}
          </div>

          {/* Logs and other parts of the tester remain the same */}
          <div className="mt-2 flex-grow flex flex-col min-h-0">
            <Label htmlFor="rawMessagesArea">Logs e Mensagens ({logs.length}):</Label>
            <ScrollArea id="rawMessagesArea" className="flex-grow h-72 rounded-md border bg-muted/30 p-1 mt-1">
              <div className="p-3 space-y-3">
                {logs.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhuma mensagem ou log para exibir...</p>}
                {logs.map(log => (
                  <div key={log.id} className={`text-xs p-2 rounded-md border ${
                    log.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' :
                    log.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' :
                    log.type === 'warning' ? 'bg-yellow-50 border-yellow-200 text-yellow-700' :
                    log.type === 'received' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                    log.type === 'sent' ? 'bg-purple-50 border-purple-200 text-purple-700' :
                    'bg-gray-50 border-gray-200 text-gray-700' 
                  }`}>
                    <span className="font-semibold">{log.timestamp}:</span> {log.message}
                    {log.rawData && (
                        <details className="mt-1">
                            <summary className="cursor-pointer text-xs hover:underline">Ver dados brutos</summary>
                            <pre className="mt-1 p-1.5 bg-black/5 rounded text-xs overflow-x-auto whitespace-pre-wrap break-all">{log.rawData}</pre>
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
                Esta ferramenta é para fins de depuração e visualização de dados de WebSockets.
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}

    