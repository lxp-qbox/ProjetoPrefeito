
"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlugZap, XCircle, Link as LinkIconLucide } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/ui/loading-spinner";

export default function AdminKakoLiveLinkTesterPage() {
  const [wsUrl, setWsUrl] = useState<string>("wss://h5-ws.kako.live/ws/v1?roomId=");
  const socketRef = useRef<WebSocket | null>(null);
  const [rawMessages, setRawMessages] = useState<string[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<string>("Desconectado");
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

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
    setRawMessages([]);
    setErrorDetails(null);

    try {
      const newSocket = new WebSocket(wsUrl);
      socketRef.current = newSocket;

      newSocket.onopen = () => {
        setIsConnecting(false);
        setConnectionStatus(`Conectado a: ${wsUrl}`);
        setRawMessages(prev => [...prev, `[SISTEMA] Conexão estabelecida com ${wsUrl}`]);
        toast({ title: "Conectado!", description: `Conexão WebSocket com ${wsUrl} estabelecida.` });
      };

      newSocket.onmessage = async (event) => {
        let messageData = "";
        if (event.data instanceof Blob) {
          try {
            messageData = await event.data.text();
          } catch (e) {
            console.error("Erro ao ler Blob:", e);
            messageData = "[Erro ao ler Blob do WebSocket]";
          }
        } else if (typeof event.data === 'string') {
          messageData = event.data;
        } else {
          try {
            messageData = JSON.stringify(event.data);
          } catch {
            messageData = "[Tipo de mensagem desconhecido do WebSocket]";
          }
        }
        setRawMessages(prev => [...prev, messageData]);
      };

      newSocket.onerror = (errorEvent) => {
        setIsConnecting(false);
        const errorMsg = `Erro na conexão WebSocket: ${errorEvent.type}`;
        setConnectionStatus("Erro na Conexão");
        setErrorDetails(errorMsg);
        setRawMessages(prev => [...prev, `[ERRO] ${errorMsg}`]);
        toast({ title: "Erro de Conexão", description: errorMsg, variant: "destructive" });
        if (socketRef.current) {
            socketRef.current.close(); // Ensure it's closed on error
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
        setRawMessages(prev => [...prev, `[SISTEMA] ${closeMsg}`]);
        toast({ title: "Desconectado", description: closeMsg });
        socketRef.current = null; // Clear the ref on close
      };

    } catch (error) {
      setIsConnecting(false);
      const errMsg = error instanceof Error ? error.message : "Erro desconhecido ao tentar conectar.";
      setConnectionStatus("Erro ao Iniciar Conexão");
      setErrorDetails(errMsg);
      setRawMessages(prev => [...prev, `[ERRO CRÍTICO] ${errMsg}`]);
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
      // onclose handler will update state
    } else {
      setConnectionStatus("Desconectado");
      toast({ title: "Já Desconectado", description: "Nenhuma conexão ativa para desconectar." });
    }
  };

  useEffect(() => {
    // Cleanup on component unmount
    return () => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.close();
      }
      socketRef.current = null;
    };
  }, []);

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
            Insira uma URL WebSocket (ws:// ou wss://) para conectar e visualizar as mensagens brutas recebidas.
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

          <div className="mt-4 flex-grow flex flex-col min-h-0">
            <Label htmlFor="rawMessagesArea">Mensagens Recebidas (Dados Brutos):</Label>
            <ScrollArea id="rawMessagesArea" className="flex-grow h-72 rounded-md border bg-muted/30 p-1 mt-1">
              <div className="p-3 space-y-2">
                {rawMessages.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Aguardando mensagens...</p>}
                {rawMessages.map((msg, index) => (
                  <pre key={index} className="text-xs p-2 border bg-background rounded-md shadow-sm whitespace-pre-wrap break-all">
                    {msg}
                  </pre>
                ))}
              </div>
            </ScrollArea>
          </div>
        </CardContent>
        <CardFooter>
            <p className="text-xs text-muted-foreground">
                Esta ferramenta é para fins de depuração e visualização de dados brutos de WebSockets.
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}
