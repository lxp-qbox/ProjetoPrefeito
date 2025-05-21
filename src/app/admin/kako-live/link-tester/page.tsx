
"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlugZap, XCircle, Link as LinkIconLucide, TableIcon, Send, BadgeInfo, Gamepad2, Gift, RadioTower } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { Table, TableBody, TableCell, TableRow, TableHead, TableHeader } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface ProcessedMessage {
  id: string;
  timestamp: string;
  type: 'received' | 'sent' | 'system' | 'error';
  originalData: string;
  parsedData?: Record<string, any>;
  isJson: boolean;
  classification?: string;
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

  const [showRoomDataFilter, setShowRoomDataFilter] = useState(true);
  const [showGameDataFilter, setShowGameDataFilter] = useState(true);
  const [showExternalDataFilter, setShowExternalDataFilter] = useState(true);
  const [showLiveDataFilter, setShowLiveDataFilter] = useState(true); // New filter state

  const handleConnect = () => {
    if (!wsUrl.trim() || (!wsUrl.startsWith("ws://") && !wsUrl.startsWith("wss://"))) {
      toast({
        title: "URL Inválida",
        description: "Por favor, insira uma URL WebSocket válida (ws:// ou wss://).",
        variant: "destructive",
      });
      return;
    }

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      toast({
        title: "Já Conectado",
        description: "Já existe uma conexão ativa. Desconecte primeiro.",
        variant: "default",
      });
      return;
    }

    setIsConnecting(true);
    setConnectionStatus(`Conectando a ${wsUrl}...`);
    setProcessedMessages([]);
    setErrorDetails(null);

    try {
      const newSocket = new WebSocket(wsUrl);
      socketRef.current = newSocket;

      newSocket.onopen = () => {
        setIsConnecting(false);
        setConnectionStatus(`Conectado a: ${wsUrl}`);
        setProcessedMessages(prev => [...prev, {
          id: generateUniqueId(),
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          type: 'system',
          originalData: `[SISTEMA] Conexão estabelecida com ${wsUrl}`,
          isJson: false,
        }]);
        toast({ title: "Conectado!", description: `Conexão WebSocket com ${wsUrl} estabelecida.` });
      };

      newSocket.onmessage = async (event) => {
        let messageContentString = "";
        if (event.data instanceof Blob) {
          try {
            messageContentString = await event.data.text();
          } catch (e) {
            console.error("Erro ao ler Blob:", e);
            messageContentString = "[Erro ao ler Blob do WebSocket]";
          }
        } else if (typeof event.data === 'string') {
          messageContentString = event.data;
        } else {
          try {
            messageContentString = JSON.stringify(event.data);
          } catch {
            messageContentString = "[Tipo de mensagem desconhecido do WebSocket]";
          }
        }

        let parsedJson: Record<string, any> | undefined;
        let isJsonMessage = false;
        let classification: string | undefined = undefined;

        try {
          const firstBrace = messageContentString.indexOf('{');
          const lastBrace = messageContentString.lastIndexOf('}');
          if (firstBrace !== -1 && lastBrace > firstBrace) {
            const jsonStr = messageContentString.substring(firstBrace, lastBrace + 1);
            parsedJson = JSON.parse(jsonStr);
            isJsonMessage = true;
          } else {
             // Attempt to parse the whole string if no clear JSON object found
             // This might fail if there are leading/trailing non-JSON chars not handled by substring
             try {
                parsedJson = JSON.parse(messageContentString);
                isJsonMessage = true;
             } catch {
                // Fallback if full string parsing fails
             }
          }

          if (isJsonMessage && parsedJson && typeof parsedJson === 'object') {
            if ('roomId' in parsedJson && 'mute' in parsedJson) {
              classification = "Dados da LIVE";
            } else if ('roomId' in parsedJson) {
              classification = "Dados da Sala";
            } else if ('game' in parsedJson) {
              classification = "Dados de Jogo";
            } else if ('giftId' in parsedJson && !('roomId' in parsedJson) ) { 
              classification = "Dados Externos";
            }
          }

        } catch (e) {
          isJsonMessage = false;
        }

        setProcessedMessages(prev => [...prev, {
          id: generateUniqueId(),
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          type: 'received',
          originalData: messageContentString,
          parsedData: parsedJson,
          isJson: isJsonMessage,
          classification: classification,
        }]);
      };

      newSocket.onerror = (errorEvent) => {
        setIsConnecting(false);
        const errorMsg = `Erro na conexão WebSocket: ${errorEvent.type}`;
        setConnectionStatus("Erro na Conexão");
        setErrorDetails(errorMsg);
        setProcessedMessages(prev => [...prev, {
          id: generateUniqueId(),
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          type: 'error',
          originalData: `[ERRO] ${errorMsg}`,
          isJson: false,
        }]);
        toast({ title: "Erro de Conexão", description: errorMsg, variant: "destructive" });
        if (socketRef.current) {
            socketRef.current.close();
            socketRef.current = null;
        }
      };

      newSocket.onclose = (closeEvent) => {
        setIsConnecting(false);
        let closeMsg = `Desconectado de ${wsUrl}.`;
        if (closeEvent.code || closeEvent.reason) {
          closeMsg += ` Código: ${closeEvent.code}, Motivo: ${closeEvent.reason || 'N/A'}`;
        }
        setConnectionStatus("Desconectado");
        setProcessedMessages(prev => [...prev, {
          id: generateUniqueId(),
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          type: 'system',
          originalData: `[SISTEMA] ${closeMsg}`,
          isJson: false,
        }]);
        toast({ title: "Desconectado", description: closeMsg });
        socketRef.current = null;
      };

    } catch (error) {
      setIsConnecting(false);
      const errMsg = error instanceof Error ? error.message : "Erro desconhecido ao tentar conectar.";
      setConnectionStatus("Erro ao Iniciar Conexão");
      setErrorDetails(errMsg);
      setProcessedMessages(prev => [...prev, {
          id: generateUniqueId(),
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          type: 'error',
          originalData: `[ERRO CRÍTICO] ${errMsg}`,
          isJson: false,
        }]);
      toast({ title: "Falha ao Conectar", description: errMsg, variant: "destructive" });
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    }
  };

  const handleDisconnect = () => {
    if (socketRef.current) {
      socketRef.current.close();
    } else {
      setConnectionStatus("Desconectado");
      toast({ title: "Já Desconectado", description: "Nenhuma conexão ativa para desconectar." });
    }
  };

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
      setProcessedMessages(prev => [...prev, {
        id: generateUniqueId(),
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        type: 'sent',
        originalData: `[ENVIADO] ${messageToSend.trim()}`,
        isJson: false,
      }]);
      toast({ title: "Mensagem Enviada", description: messageToSend.trim() });
      setMessageToSend("");
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      const errMsg = error instanceof Error ? error.message : "Erro desconhecido ao enviar mensagem.";
      setProcessedMessages(prev => [...prev, {
        id: generateUniqueId(),
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        type: 'error',
        originalData: `[ERRO AO ENVIAR] ${errMsg}`,
        isJson: false,
      }]);
      toast({ title: "Erro ao Enviar", description: errMsg, variant: "destructive" });
    }
  };

  useEffect(() => {
    return () => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.close();
      }
      socketRef.current = null;
    };
  }, []);

  const filteredMessages = processedMessages.filter(msg => {
    if (msg.type === 'sent' || msg.type === 'system' || msg.type === 'error') {
      return true; // Always show sent, system, and error messages
    }
    // For 'received' messages:
    if (msg.classification === "Dados da LIVE") {
      return showLiveDataFilter;
    }
    if (msg.classification === "Dados da Sala") {
      return showRoomDataFilter;
    }
    if (msg.classification === "Dados de Jogo") {
      return showGameDataFilter;
    }
    if (msg.classification === "Dados Externos") {
      return showExternalDataFilter;
    }
    return true; // Show unclassified received messages by default
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
            Insira uma URL WebSocket (ws:// ou wss://) para conectar e visualizar as mensagens recebidas. Mensagens JSON serão formatadas em tabela.
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
              disabled={isConnecting || (socketRef.current && socketRef.current.readyState === WebSocket.OPEN)}
            />
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={handleConnect}
              disabled={isConnecting || (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) || !wsUrl.trim()}
            >
              {isConnecting ? <LoadingSpinner size="sm" className="mr-2" /> : <PlugZap className="mr-2 h-4 w-4" />}
              {isConnecting ? "Conectando..." : (socketRef.current && socketRef.current.readyState === WebSocket.OPEN ? "Conectado" : "Conectar")}
            </Button>
            <Button
              variant="outline"
              onClick={handleDisconnect}
              disabled={!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN}
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
                placeholder="Digite sua mensagem aqui..."
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
              <Checkbox
                id="showLiveDataFilter"
                checked={showLiveDataFilter}
                onCheckedChange={(checked) => setShowLiveDataFilter(Boolean(checked))}
              />
              <Label htmlFor="showLiveDataFilter" className="text-sm font-medium cursor-pointer">Mostrar Dados da LIVE</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="showRoomDataFilter"
                checked={showRoomDataFilter}
                onCheckedChange={(checked) => setShowRoomDataFilter(Boolean(checked))}
              />
              <Label htmlFor="showRoomDataFilter" className="text-sm font-medium cursor-pointer">Mostrar Dados da Sala</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="showGameDataFilter"
                checked={showGameDataFilter}
                onCheckedChange={(checked) => setShowGameDataFilter(Boolean(checked))}
              />
              <Label htmlFor="showGameDataFilter" className="text-sm font-medium cursor-pointer">Mostrar Dados de Jogo</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="showExternalDataFilter"
                checked={showExternalDataFilter}
                onCheckedChange={(checked) => setShowExternalDataFilter(Boolean(checked))}
              />
              <Label htmlFor="showExternalDataFilter" className="text-sm font-medium cursor-pointer">Mostrar Dados Externos</Label>
            </div>
          </div>

          <div className="mt-2 flex-grow flex flex-col min-h-0">
            <Label htmlFor="rawMessagesArea">Mensagens Recebidas/Enviadas ({filteredMessages.length} de {processedMessages.length}):</Label>
            <ScrollArea id="rawMessagesArea" className="flex-grow h-72 rounded-md border bg-muted/30 p-1 mt-1">
              <div className="p-3 space-y-3">
                {filteredMessages.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhuma mensagem para exibir (verifique os filtros)...</p>}
                {filteredMessages.map((msg) => (
                  <div key={msg.id} className="p-3 border bg-background rounded-md shadow-sm">
                    <div className="flex justify-between items-center mb-1">
                        <p className={cn("text-xs", (msg.type === 'system' || msg.type === 'error') ? "text-destructive" : "text-muted-foreground")}>
                        {msg.type === 'sent' ? 'Enviado às: ' : msg.type === 'received' ? 'Recebido às: ' : 'Sistema/Erro às: '}
                        {msg.timestamp}
                        </p>
                        {msg.classification && msg.type === 'received' && (
                            <Badge className={cn(`text-xs`, 
                                msg.classification === "Dados da LIVE" && "bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200",
                                msg.classification === "Dados da Sala" && "bg-sky-100 text-sky-700 border-sky-200 hover:bg-sky-200",
                                msg.classification === "Dados de Jogo" && "bg-green-100 text-green-700 border-green-200 hover:bg-green-200",
                                msg.classification === "Dados Externos" && "bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200",
                                !["Dados da LIVE", "Dados da Sala", "Dados de Jogo", "Dados Externos"].includes(msg.classification) && "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"
                            )}>
                                {msg.classification === "Dados da LIVE" && <RadioTower className="mr-1.5 h-3 w-3" />}
                                {msg.classification === "Dados da Sala" && <BadgeInfo className="mr-1.5 h-3 w-3" />}
                                {msg.classification === "Dados de Jogo" && <Gamepad2 className="mr-1.5 h-3 w-3" />}
                                {msg.classification === "Dados Externos" && <Gift className="mr-1.5 h-3 w-3" />}
                                {msg.classification}
                            </Badge>
                        )}
                    </div>
                    {msg.type === 'received' && msg.isJson && msg.parsedData ? (
                      <div>
                        <h4 className="text-sm font-semibold mb-1 flex items-center">
                          <TableIcon className="w-4 h-4 mr-2 text-primary" />
                          Dados JSON Recebidos:
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
                            <summary className="cursor-pointer text-muted-foreground hover:text-primary">Ver dados brutos recebidos</summary>
                            <pre className="mt-1 p-2 bg-muted/50 rounded-md overflow-x-auto whitespace-pre-wrap break-all">
                              {msg.originalData}
                            </pre>
                          </details>
                      </div>
                    ) : (
                      <div>
                        <h4 className="text-sm font-semibold mb-1">
                          {msg.type === 'sent' ? 'Dados Brutos Enviados:' :
                           msg.type === 'received' ? 'Dados Brutos Recebidos (Não JSON/Erro de Parse):' :
                           msg.type === 'system' ? 'Mensagem do Sistema:' :
                           'Mensagem de Erro:'}
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

