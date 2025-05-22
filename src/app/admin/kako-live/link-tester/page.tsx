
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlugZap, XCircle, Link as LinkIconLucide, TableIcon, Send, BadgeInfo, Gamepad2, Gift as GiftIcon, RadioTower, MessageSquare, UserCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { Table, TableBody, TableCell, TableRow, TableHead, TableHeader } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface ParsedUserData {
  nickname?: string;
  avatarUrl?: string;
  level?: number;
  showId?: string;
  userId?: string; // FUID
  gender?: number;
}
interface ProcessedMessage {
  id: string;
  timestamp: string;
  type: 'received' | 'sent' | 'system' | 'error';
  originalData: string;
  parsedData?: Record<string, any>;
  isJson: boolean;
  classification?: string;
  parsedUserData?: ParsedUserData;
}

const generateUniqueId = () => {
  return String(Date.now()) + '-' + Math.random().toString(36).substr(2, 9);
};

export default function AdminKakoLiveLinkTesterPage() {
  const [wsUrl, setWsUrl] = useState<string>("wss://h5-ws.kako.live/ws/v1?roomId=");
  const socketRef = useRef<WebSocket | null>(null);
  const [processedMessages, setProcessedMessages] = useState<ProcessedMessage[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<string>("Desconectado");
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [messageToSend, setMessageToSend] = useState<string>("");
  const { toast } = useToast();
  const isManuallyDisconnectingRef = useRef(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [showLiveDataFilter, setShowLiveDataFilter] = useState(true);
  const [showChatMessageFilter, setShowChatMessageFilter] = useState(true);
  const [showRoomDataFilter, setShowRoomDataFilter] = useState(true);
  const [showGameDataFilter, setShowGameDataFilter] = useState(true);
  const [showExternalDataFilter, setShowExternalDataFilter] = useState(true);
  const [showRoomGiftsFilter, setShowRoomGiftsFilter] = useState(true);


  const addLogEntry = useCallback((message: string, type: ProcessedMessage['type'], originalData?: string, parsedData?: Record<string, any>, isJson?: boolean, classification?: string, parsedUserData?: ParsedUserData) => {
    setProcessedMessages(prev => [{
      id: generateUniqueId(),
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      type: type,
      originalData: originalData || message,
      parsedData: parsedData,
      isJson: isJson || false,
      classification: classification,
      parsedUserData: parsedUserData,
    }, ...prev.slice(0, 199)]);
  }, []);

  const disconnectManually = useCallback(() => {
    isManuallyDisconnectingRef.current = true;
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (socketRef.current) {
      addLogEntry("Desconectando WebSocket manualmente...", 'system');
      socketRef.current.onopen = null;
      socketRef.current.onmessage = null;
      socketRef.current.onerror = null;
      socketRef.current.onclose = null; 
      socketRef.current.close();
      socketRef.current = null; // Important to nullify after close
    }
    setConnectionStatus("Desconectado");
    setIsConnecting(false);
  }, [addLogEntry]);


  const handleConnect = useCallback(() => {
    if (!wsUrl.trim() || (!wsUrl.startsWith("ws://") && !wsUrl.startsWith("wss://"))) {
      toast({
        title: "URL Inválida",
        description: "Por favor, insira uma URL WebSocket válida (ws:// ou wss://).",
        variant: "destructive",
      });
      return;
    }

    // If already connected or connecting, disconnect first
    if (socketRef.current && (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING)) {
        addLogEntry(`Fechando conexão existente com ${socketRef.current.url} para reconectar.`, 'system');
        disconnectManually(); // Use the manual disconnect which also clears reconnect timers
    }
    
    isManuallyDisconnectingRef.current = false; // Reset manual disconnect flag for new connection attempt
    setIsConnecting(true);
    setConnectionStatus(`Conectando a ${wsUrl}...`);
    setErrorDetails(null);
    addLogEntry(`Tentando conectar a ${wsUrl}...`, 'system');

    try {
      const newSocket = new WebSocket(wsUrl);
      socketRef.current = newSocket; 

      newSocket.onopen = () => {
        setIsConnecting(false);
        setConnectionStatus(`Conectado a: ${newSocket.url}`);
        addLogEntry(`Conexão estabelecida com ${newSocket.url}`, 'system');
        toast({ title: "Conectado!", description: `Conexão WebSocket com ${newSocket.url} estabelecida.` });
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

            let parsedJson: Record<string, any> | undefined;
            let isJsonMessage = false;
            let classification: string | undefined = undefined;
            let msgUserData: ParsedUserData | undefined = undefined;

            const firstBrace = messageContentString.indexOf('{');
            const lastBrace = messageContentString.lastIndexOf('}');
            if (firstBrace !== -1 && lastBrace > firstBrace) {
              const jsonStr = messageContentString.substring(firstBrace, lastBrace + 1);
              try {
                parsedJson = JSON.parse(jsonStr);
                isJsonMessage = true;
              } catch { /* Parsing error, treat as non-JSON */ }
            } else {
                 try {
                    parsedJson = JSON.parse(messageContentString);
                    isJsonMessage = true;
                 } catch { /* Fallback if full string parsing fails */ }
            }

            if (isJsonMessage && parsedJson && typeof parsedJson === 'object') {
              if (parsedJson.user && typeof parsedJson.user === 'object') {
                msgUserData = {
                  nickname: parsedJson.user.nickname,
                  avatarUrl: parsedJson.user.avatar || parsedJson.user.avatarUrl,
                  level: parsedJson.user.level,
                  showId: parsedJson.user.showId,
                  userId: parsedJson.user.userId,
                  gender: parsedJson.user.gender,
                };
              }

              if ('roomId' in parsedJson && 'mute' in parsedJson) {
                classification = "Dados da LIVE";
              } else if ('roomId' in parsedJson && 'text' in parsedJson) {
                classification = "Mensagem de Chat";
              } else if ('roomId' in parsedJson && 'giftId' in parsedJson) {
                 classification = "Presentes da Sala";
              } else if ('roomId' in parsedJson) {
                classification = "Dados da Sala";
              } else if ('game' in parsedJson) {
                classification = "Dados de Jogo";
              } else if ('giftId' in parsedJson && !('roomId' in parsedJson)) {
                classification = "Dados Externos";
              }
            }
            
            addLogEntry(messageContentString, 'received', messageContentString, parsedJson, isJsonMessage, classification, msgUserData);

        } catch (e) {
            console.error("Erro ao processar mensagem WebSocket:", e);
            addLogEntry(`[ERRO INTERNO AO PROCESSAR MENSAGEM] ${e instanceof Error ? e.message : String(e)}. Dados brutos: ${messageContentString.substring(0,100)}...`, 'error', messageContentString);
        }
      };

      newSocket.onerror = (errorEvent) => {
        setIsConnecting(false);
        const errorMsg = `Erro na conexão WebSocket: ${errorEvent.type || 'Tipo de erro desconhecido'}`;
        setConnectionStatus("Erro na Conexão");
        setErrorDetails(errorMsg);
        addLogEntry(`[ERRO] ${errorMsg}`, 'error', errorMsg);
        toast({ title: "Erro de Conexão", description: errorMsg, variant: "destructive" });
        
        if (socketRef.current === newSocket) {
            newSocket.onopen = null;
            newSocket.onmessage = null;
            newSocket.onerror = null;
            newSocket.onclose = null;
            if (newSocket.readyState === WebSocket.OPEN || newSocket.readyState === WebSocket.CONNECTING) {
              newSocket.close();
            }
            socketRef.current = null;
        }
         if (!isManuallyDisconnectingRef.current) {
          if(reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = setTimeout(handleConnect, 5000); // Attempt to reconnect on error
        }
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
                addLogEntry(`${closeMsg} Tentando reconectar em 5 segundos.`, 'system', closeMsg);
                socketRef.current = null; 
                if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
                reconnectTimeoutRef.current = setTimeout(handleConnect, 5000);
            } else {
                setConnectionStatus("Desconectado");
                addLogEntry("WebSocket Desconectado Manualmente.", 'system', "Manually disconnected.");
                socketRef.current = null; 
            }
        } else {
           // This close event is for an old socket, already handled or cleaned up
           console.log("Old socket closed, current socketRef:", socketRef.current?.url);
        }
      };

    } catch (error) {
      setIsConnecting(false);
      const errMsg = error instanceof Error ? error.message : "Erro desconhecido ao tentar conectar.";
      setConnectionStatus("Erro ao Iniciar Conexão");
      setErrorDetails(errMsg);
      addLogEntry(`[ERRO CRÍTICO AO CONECTAR] ${errMsg}`, 'error', errMsg);
      toast({ title: "Falha ao Conectar", description: errMsg, variant: "destructive" });
      if (socketRef.current) { 
        socketRef.current.close();
        socketRef.current = null;
      }
    }
  }, [wsUrl, toast, addLogEntry, disconnectManually]);

  const handleSendMessage = () => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      toast({ title: "Não Conectado", description: "Conecte ao WebSocket antes de enviar mensagens.", variant: "destructive" });
      return;
    }
    if (!messageToSend.trim()) {
      toast({ title: "Mensagem Vazia", description: "Digite uma mensagem para enviar.", variant: "destructive" });
      return;
    }

    try {
      socketRef.current.send(messageToSend.trim());
      addLogEntry(messageToSend.trim(), 'sent');
      toast({ title: "Mensagem Enviada", description: messageToSend.trim() });
      setMessageToSend("");
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      const errMsg = error instanceof Error ? error.message : "Erro desconhecido ao enviar mensagem.";
      addLogEntry(`[ERRO AO ENVIAR] ${errMsg}`, 'error', errMsg);
      toast({ title: "Erro ao Enviar", description: errMsg, variant: "destructive" });
    }
  };

  useEffect(() => {
    return () => {
      disconnectManually(); // Ensure cleanup on unmount
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // disconnectManually is memoized

  const filteredMessages = processedMessages.filter(msg => {
    if (msg.type === 'sent' || msg.type === 'system' || msg.type === 'error') {
      return true;
    }
    if (msg.classification === "Dados da LIVE") return showLiveDataFilter;
    if (msg.classification === "Mensagem de Chat") return showChatMessageFilter;
    if (msg.classification === "Presentes da Sala") return showRoomGiftsFilter;
    if (msg.classification === "Dados da Sala") return showRoomDataFilter;
    if (msg.classification === "Dados de Jogo") return showGameDataFilter;
    if (msg.classification === "Dados Externos") return showExternalDataFilter;
    return true; 
  });

  return (
    <div className="p-6 space-y-6 h-full flex flex-col">
      <h1 className="text-2xl font-semibold text-foreground">Testador de Link WebSocket</h1>
      <Card className="flex-grow flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center">
            <LinkIconLucide className="mr-2 h-6 w-6 text-primary" />
            Testar Conexão WebSocket
          </CardTitle>
          <CardDescription>
            Insira uma URL WebSocket (ws:// ou wss://) para conectar e visualizar as mensagens recebidas/enviadas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 flex-grow flex flex-col">
          <div className="space-y-1">
            <Label htmlFor="wsUrl">URL do WebSocket</Label>
            <Input
              id="wsUrl"
              value={wsUrl}
              onChange={(e) => setWsUrl(e.target.value)}
              placeholder="wss://exemplo.com/socket"
              disabled={isConnecting && socketRef.current?.url === wsUrl}
            />
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={handleConnect}
              disabled={isConnecting || !wsUrl.trim()}
            >
              {isConnecting && socketRef.current?.url === wsUrl ? <LoadingSpinner size="sm" className="mr-2" /> : <PlugZap className="mr-2 h-4 w-4" />}
              {isConnecting && socketRef.current?.url === wsUrl ? "Conectando..." : 
               (socketRef.current && socketRef.current.readyState === WebSocket.OPEN && socketRef.current.url === wsUrl) ? "Reconectar" : "Conectar"}
            </Button>
            <Button
              variant="outline"
              onClick={disconnectManually}
              disabled={!socketRef.current || (socketRef.current.readyState !== WebSocket.OPEN && socketRef.current.readyState !== WebSocket.CONNECTING)}
            >
              <XCircle className="mr-2 h-4 w-4" />
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

          <div className="mt-4 space-y-2 border-t pt-4">
            <Label htmlFor="messageToSend">Mensagem para Enviar</Label>
            <div className="flex space-x-2">
              <Input
                id="messageToSend"
                value={messageToSend}
                onChange={(e) => setMessageToSend(e.target.value)}
                placeholder="Digite sua mensagem JSON ou texto aqui..."
                disabled={!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN}
                onKeyPress={(e) => e.key === 'Enter' && messageToSend.trim() && handleSendMessage()}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN || !messageToSend.trim()}
              >
                <Send className="mr-2 h-4 w-4" />
                Enviar
              </Button>
            </div>
          </div>

          <div className="mt-4 flex items-center space-x-4 border-t pt-4 flex-wrap gap-y-2">
            <div className="flex items-center space-x-2">
                <Checkbox id="showLiveDataFilter" checked={showLiveDataFilter} onCheckedChange={(checked) => setShowLiveDataFilter(Boolean(checked))} />
                <Label htmlFor="showLiveDataFilter" className="text-sm font-medium cursor-pointer">Mostrar Dados da LIVE</Label>
            </div>
            <div className="flex items-center space-x-2">
                <Checkbox id="showChatMessageFilter" checked={showChatMessageFilter} onCheckedChange={(checked) => setShowChatMessageFilter(Boolean(checked))} />
                <Label htmlFor="showChatMessageFilter" className="text-sm font-medium cursor-pointer">Mostrar Mensagens de Chat</Label>
            </div>
            <div className="flex items-center space-x-2">
                <Checkbox id="showRoomGiftsFilter" checked={showRoomGiftsFilter} onCheckedChange={(checked) => setShowRoomGiftsFilter(Boolean(checked))} />
                <Label htmlFor="showRoomGiftsFilter" className="text-sm font-medium cursor-pointer">Mostrar Presentes da Sala</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="showRoomDataFilter" checked={showRoomDataFilter} onCheckedChange={(checked) => setShowRoomDataFilter(Boolean(checked))} />
              <Label htmlFor="showRoomDataFilter" className="text-sm font-medium cursor-pointer">Mostrar Dados da Sala</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="showGameDataFilter" checked={showGameDataFilter} onCheckedChange={(checked) => setShowGameDataFilter(Boolean(checked))} />
              <Label htmlFor="showGameDataFilter" className="text-sm font-medium cursor-pointer">Mostrar Dados de Jogo</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="showExternalDataFilter" checked={showExternalDataFilter} onCheckedChange={(checked) => setShowExternalDataFilter(Boolean(checked))} />
              <Label htmlFor="showExternalDataFilter" className="text-sm font-medium cursor-pointer">Mostrar Dados Externos</Label>
            </div>
          </div>

          <div className="mt-2 flex-grow flex flex-col min-h-0">
            <Label htmlFor="rawMessagesArea">Mensagens ({filteredMessages.length} de {processedMessages.length}):</Label>
            <ScrollArea id="rawMessagesArea" className="flex-grow h-72 rounded-md border bg-muted/30 p-1 mt-1">
              <div className="p-3 space-y-3">
                {filteredMessages.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhuma mensagem para exibir...</p>}
                {filteredMessages.map((msg) => (
                  <div key={msg.id} className="p-3 border bg-background rounded-md shadow-sm">
                    <div className="flex justify-between items-center mb-1">
                        <p className={cn("text-xs", 
                            (msg.type === 'system' || msg.type === 'error') ? "text-destructive" : "text-muted-foreground"
                        )}>
                        {msg.type === 'sent' ? 'Enviado: ' : msg.type === 'received' ? 'Recebido: ' : 'Sistema/Erro: '}
                        {msg.timestamp}
                        </p>
                        {msg.classification && msg.type === 'received' && (
                            <Badge className={cn(`text-xs`, 
                                msg.classification === "Dados da LIVE" && "bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200",
                                msg.classification === "Mensagem de Chat" && "bg-teal-100 text-teal-700 border-teal-200 hover:bg-teal-200",
                                msg.classification === "Presentes da Sala" && "bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-200",
                                msg.classification === "Dados da Sala" && "bg-sky-100 text-sky-700 border-sky-200 hover:bg-sky-200",
                                msg.classification === "Dados de Jogo" && "bg-green-100 text-green-700 border-green-200 hover:bg-green-200",
                                msg.classification === "Dados Externos" && "bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200",
                            )}>
                                {msg.classification === "Dados da LIVE" && <RadioTower className="mr-1.5 h-3 w-3" />}
                                {msg.classification === "Mensagem de Chat" && <MessageSquare className="mr-1.5 h-3 w-3" />}
                                {msg.classification === "Presentes da Sala" && <GiftIcon className="mr-1.5 h-3 w-3" />}
                                {msg.classification === "Dados da Sala" && <BadgeInfo className="mr-1.5 h-3 w-3" />}
                                {msg.classification === "Dados de Jogo" && <Gamepad2 className="mr-1.5 h-3 w-3" />}
                                {msg.classification === "Dados Externos" && <GiftIcon className="mr-1.5 h-3 w-3" />} 
                                {msg.classification}
                            </Badge>
                        )}
                    </div>

                    {msg.type === 'received' && msg.parsedUserData && (
                      <Card className="mb-2 border-primary/30">
                        <CardHeader className="p-2 bg-primary/5">
                           <CardTitle className={cn(
                            "text-sm font-semibold flex items-center",
                            msg.parsedUserData.gender === 1 ? "text-primary" : 
                            msg.parsedUserData.gender === 2 ? "text-pink-500" : "text-foreground" 
                          )}>
                            <Avatar className="h-8 w-8 mr-2 border">
                              <AvatarImage src={msg.parsedUserData.avatarUrl} alt={msg.parsedUserData.nickname} data-ai-hint="user avatar"/>
                              <AvatarFallback>
                                {msg.parsedUserData.nickname ? msg.parsedUserData.nickname.substring(0,2).toUpperCase() : <UserCircle2 size={16}/>}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              {msg.parsedUserData.nickname || "Usuário Desconhecido"}
                              {msg.parsedUserData.level && <Badge variant="secondary" className="ml-2 text-xs">Nv. {msg.parsedUserData.level}</Badge>}
                            </div>
                          </CardTitle>
                          { (msg.parsedUserData.showId || msg.parsedUserData.userId) &&
                            <CardDescription className="text-xs mt-0.5 pl-10"> 
                                {msg.parsedUserData.showId && <span>Show ID: {msg.parsedUserData.showId}</span>}
                                {msg.parsedUserData.userId && msg.parsedUserData.showId && <span className="mx-1">|</span>}
                                {msg.parsedUserData.userId && <span>FUID: {msg.parsedUserData.userId}</span>}
                            </CardDescription>
                          }
                        </CardHeader>
                      </Card>
                    )}
                    
                    {msg.type === 'received' && msg.classification === "Mensagem de Chat" && msg.parsedData?.text && (
                      <div className="mt-2 mb-3 p-3 bg-muted border border-border rounded-md">
                        <p className="text-sm text-foreground font-medium break-all">{msg.parsedData.text}</p>
                      </div>
                    )}

                    {msg.type === 'received' && msg.classification === "Presentes da Sala" && msg.parsedData && msg.parsedUserData && (
                       <div className="mt-2 mb-3 p-3 bg-yellow-100 border border-yellow-200 rounded-md">
                        <p className="text-sm text-yellow-800 font-medium break-all">
                          <GiftIcon className="inline-block mr-1.5 h-4 w-4" /> 
                          {msg.parsedUserData?.nickname || 'Usuário Desconhecido'} enviou {msg.parsedData?.giftCount || 'um'} Presente ID {msg.parsedData?.giftId}! 
                          (Destinatário: Anfitrião da Sala)
                        </p>
                      </div>
                    )}

                    {msg.type === 'received' && msg.isJson && msg.parsedData ? (
                      <div>
                        <h4 className="text-sm font-semibold mb-1 flex items-center">
                          <TableIcon className="w-4 h-4 mr-2 text-primary" />
                          Dados JSON da Mensagem:
                        </h4>
                        <div className="max-h-60 overflow-y-auto text-xs border rounded-md">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-[30%]">Chave</TableHead>
                                <TableHead>Valor</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {Object.entries(msg.parsedData).map(([key, value]) => (
                                <TableRow key={key}>
                                  <TableCell className="font-medium break-all py-1 px-2">{key}</TableCell>
                                  <TableCell className="break-all py-1 px-2">
                                    {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                         <details className="mt-2 text-xs">
                            <summary className="cursor-pointer text-muted-foreground hover:text-primary">Ver dados brutos originais</summary>
                            <pre className="mt-1 p-2 bg-muted/50 rounded-md overflow-x-auto whitespace-pre-wrap break-all">
                              {msg.originalData}
                            </pre>
                          </details>
                      </div>
                    ) : ( 
                        <div>
                          <h4 className="text-sm font-semibold mb-1">
                            {msg.type === 'sent' ? 'Dados Brutos Enviados:' : 
                             msg.type === 'system' ? 'Mensagem do Sistema:' :
                             msg.type === 'error' ? 'Mensagem de Erro:' : 
                             'Dados Brutos Recebidos (Não JSON/Erro de Parse):'}
                          </h4>
                          <pre className="text-xs p-2 bg-muted/50 rounded-md overflow-x-auto whitespace-pre-wrap break-all">
                            {msg.originalData}
                          </pre>
                        </div>
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

    