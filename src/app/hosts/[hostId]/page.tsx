
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import type { Host, UserProfile } from '@/types';
import { placeholderHosts } from '../page';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, UserCircle2, WifiOff, Info, Heart, Gift as GiftIcon, Users as UsersIcon, Send } from 'lucide-react';
import LoadingSpinner from '@/components/ui/loading-spinner';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { useAuth } from '@/hooks/use-auth';

const getHostById = (id: string): Host | undefined => {
  return placeholderHosts.find(host => host.id === id);
};

interface ChatMessage {
  id: string;
  user: string;
  avatar: string;
  message: string;
  timestamp: string;
}

const generateUniqueId = () => {
  return String(Date.now()) + '-' + Math.random().toString(36).substr(2, 9);
};

function parseChatMessage(data: any): { userName: string, userAvatar: string, messageData: string } | null {
  let parsedJson;
  let rawStringInput = "";

  if (typeof data === 'string') {
    rawStringInput = data;
    try {
      parsedJson = JSON.parse(data);
    } catch (e) {
      // Not JSON, treat as raw string for messageData
      return { userName: "Anônimo", userAvatar: `https://placehold.co/32x32.png?text=A`, messageData: data };
    }
  } else if (typeof data === 'object' && data !== null) {
    parsedJson = data; // Already an object (e.g. from Blob parsed as JSON)
  } else {
    return null; // Not a string or object we can parse
  }

  let userName = "Servidor";
  let userAvatar = "";
  let messageData = "";

  // Check for Gift Event Structure
  if (parsedJson && parsedJson.giftId && parsedJson.user && parsedJson.user.nickname) {
    userName = parsedJson.user.nickname;
    userAvatar = parsedJson.user.avatar || `https://placehold.co/32x32.png?text=${userName.substring(0,1).toUpperCase() || 'G'}`;
    messageData = `🎁 ${userName} enviou ${parsedJson.giftCount || 1}x Presente ID ${parsedJson.giftId}!`;
    if (parsedJson.user.level) {
        messageData += ` (Nível ${parsedJson.user.level})`;
    }
  }
  // Check for standard chat message structure (like from your previous example)
  else if (parsedJson.user && typeof parsedJson.user === 'object' && (parsedJson.text || parsedJson.message || parsedJson.content)) {
    userName = parsedJson.user.nickname || parsedJson.user.name || "Usuário";
    messageData = parsedJson.text || parsedJson.message || parsedJson.content;
    if (parsedJson.user.avatar && typeof parsedJson.user.avatar === 'string') {
      userAvatar = parsedJson.user.avatar;
    } else if (parsedJson.user.avatarUrl && typeof parsedJson.user.avatarUrl === 'string') {
      userAvatar = parsedJson.user.avatarUrl;
    } else {
      userAvatar = `https://placehold.co/32x32.png?text=${userName.substring(0,1).toUpperCase() || 'U'}`;
    }
  } else if (parsedJson.username && (parsedJson.message || parsedJson.text || parsedJson.content)) {
    userName = parsedJson.username;
    messageData = parsedJson.text || parsedJson.message || parsedJson.content;
    if (parsedJson.avatar && typeof parsedJson.avatar === 'string') {
      userAvatar = parsedJson.avatar;
    } else {
       userAvatar = `https://placehold.co/32x32.png?text=${userName.substring(0,1).toUpperCase() || 'U'}`;
    }
  } else if (parsedJson.content) { // Generic content field
      messageData = parsedJson.content;
      if (parsedJson.type === 'system_message' || parsedJson.type === 'SYSTEM' || (!parsedJson.user && !parsedJson.username)) {
          userName = "Sistema";
          userAvatar = ""; // No avatar for system
      }
  } else if (typeof parsedJson === 'string') { // If parsedJson is just a string itself
    messageData = parsedJson;
    userName = "Anônimo";
    userAvatar = `https://placehold.co/32x32.png?text=A`;
  } else if (parsedJson.message && typeof parsedJson.message === 'string') { // Object with a 'message' string
    messageData = parsedJson.message;
    userName = "Anônimo";
    userAvatar = `https://placehold.co/32x32.png?text=A`;
  } else if (rawStringInput) { // Fallback to the original raw string if no known structure matched
    messageData = rawStringInput;
    userName = "Texto";
    userAvatar = `https://placehold.co/32x32.png?text=T`;
  } else if (Object.keys(parsedJson).length > 0 && typeof parsedJson !== 'string') { // Fallback for unknown JSON object
    messageData = JSON.stringify(parsedJson); // Show the raw JSON
    userName = "JSON";
    userAvatar = `https://placehold.co/32x32.png?text=J`;
  } else if (data.toString && typeof data.toString === 'function') { // Last resort, try .toString()
    messageData = data.toString();
  } else {
    return null; // Could not determine message structure
  }

  return { userName, userAvatar, messageData };
}


export default function HostStreamPage() {
  const params = useParams();
  const hostId = typeof params.hostId === 'string' ? params.hostId : undefined;
  const [host, setHost] = useState<Host | null | undefined>(undefined);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const socketRef = useRef<WebSocket | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (hostId) {
      const foundHost = getHostById(hostId);
      setHost(foundHost);
    } else {
      setHost(null);
    }
  }, [hostId]);

  useEffect(() => {
    if (!host?.giftsReceived || host.giftsReceived.length === 0) {
      return;
    }
    const intervalId = setInterval(() => {
      setHost(prevHost => {
        if (!prevHost?.giftsReceived || prevHost.giftsReceived.length === 0) {
          return prevHost;
        }
        if (!prevHost) return prevHost;

        const updatedGifts = prevHost.giftsReceived.map(gift => ({ ...gift }));
        const randomIndex = Math.floor(Math.random() * updatedGifts.length);
        if (updatedGifts[randomIndex]) {
            updatedGifts[randomIndex].count = (updatedGifts[randomIndex].count || 0) + Math.floor(Math.random() * 3) + 1;
        }
        return { ...prevHost, giftsReceived: updatedGifts };
      });
    }, 5000);
    return () => clearInterval(intervalId);
  }, [host]);

  useEffect(() => {
    if (!host || !host.kakoLiveRoomId) {
      setChatMessages(prev => [...prev, {id: generateUniqueId(), user: "Sistema", avatar: "", message: "Host ou RoomID não configurado para o chat.", timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}]);
      return;
    }

    const wsUrl = `wss://h5-ws.kako.live/ws/v1?roomId=${host.kakoLiveRoomId}`;
    socketRef.current = new WebSocket(wsUrl);

    socketRef.current.onopen = () => {
      console.log("WebSocket conectado para chat: " + wsUrl);
      setChatMessages(prev => [...prev, {id: generateUniqueId(), user: "Sistema", avatar: "", message: "Conectado ao chat!", timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}]);
    };

    socketRef.current.onmessage = async (event) => {
      console.log("Mensagem recebida do WebSocket:", event.data);
      let processedMessage: { userName: string, userAvatar: string, messageData: string } | null = null;
      let messageString = "";

      if (event.data instanceof Blob) {
        try {
          messageString = await event.data.text();
        } catch (e) {
          console.error("Erro ao ler Blob do WebSocket:", e);
          processedMessage = { userName: "Erro", userAvatar: "", messageData: "[Erro ao ler Blob]" };
        }
      } else if (typeof event.data === 'string') {
        messageString = event.data;
      } else {
        console.warn("Tipo de mensagem WebSocket desconhecido:", event.data);
        let unknownDataString = "[Tipo de mensagem desconhecido]";
        try {
            unknownDataString = JSON.stringify(event.data);
        } catch {}
        processedMessage = { userName: "Desconhecido", userAvatar: "", messageData: unknownDataString };
      }

      if (!processedMessage && messageString) {
        // Attempt to clean leading non-JSON characters
        const firstBraceIndex = messageString.indexOf('{');
        const lastBraceIndex = messageString.lastIndexOf('}');
        let cleanJsonString = messageString;

        if (firstBraceIndex !== -1 && lastBraceIndex > firstBraceIndex) {
          cleanJsonString = messageString.substring(firstBraceIndex, lastBraceIndex + 1);
        }
        
        processedMessage = parseChatMessage(cleanJsonString);

        // If parseChatMessage couldn't make sense of it as JSON, but the original messageString was non-empty and NOT JSON
        if (!processedMessage && messageString.trim() !== "" && firstBraceIndex === -1) {
            processedMessage = { userName: "Texto", userAvatar: "https://placehold.co/32x32.png?text=T", messageData: messageString };
        }
      }


      if (processedMessage && processedMessage.messageData && processedMessage.messageData.trim() !== "") {
        setChatMessages(prev => [...prev, {
          id: generateUniqueId(),
          user: processedMessage.userName,
          avatar: processedMessage.userAvatar,
          message: processedMessage.messageData,
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        }]);
      } else {
        console.log("Mensagem processada vazia ou nula, não adicionada ao chat:", processedMessage);
      }
    };

    socketRef.current.onerror = (errorEvent) => {
      console.error("Erro no WebSocket:", errorEvent);
      let errorMessage = "Erro na conexão do chat.";
      if (errorEvent instanceof ErrorEvent && errorEvent.message) {
        errorMessage = `Erro no chat: ${errorEvent.message}`;
      } else if (typeof errorEvent === 'object' && errorEvent !== null && 'type' in errorEvent) {
        errorMessage = `Erro no chat: Evento do tipo ${errorEvent.type}`;
      }
      setChatMessages(prev => [...prev, {id: generateUniqueId(), user: "Sistema", avatar: "", message: errorMessage, timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}]);
    };

    socketRef.current.onclose = (closeEvent) => {
      console.log("WebSocket desconectado:", closeEvent.code, closeEvent.reason);
      let closeMessage = "Desconectado do chat.";
      if (closeEvent.reason) {
        closeMessage += ` Motivo: ${closeEvent.reason}`;
      }
      setChatMessages(prev => [...prev, {id: generateUniqueId(), user: "Sistema", avatar: "", message: closeMessage, timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}]);
    };

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [host, host?.kakoLiveRoomId]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollableViewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (scrollableViewport) {
        scrollableViewport.scrollTop = scrollableViewport.scrollHeight;
      }
    }
  }, [chatMessages]);

  const handleSendMessage = () => {
    if (newMessage.trim() && socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      const messageToSend = {
        type: 'chat_message', // This type might need adjustment based on Kako's API
        content: newMessage.trim(),
        // You might need to send user details from currentUser if Kako's API expects them
        // user: { nickname: currentUser?.profileName, userId: currentUser?.uid, avatar: currentUser?.photoURL } 
      };
      socketRef.current.send(JSON.stringify(messageToSend));

      setChatMessages(prev => [
        ...prev,
        {
          id: generateUniqueId(),
          user: currentUser?.profileName || 'Você',
          avatar: currentUser?.photoURL || `https://placehold.co/32x32.png?text=${(currentUser?.profileName || 'V').substring(0,1).toUpperCase()}`,
          message: newMessage.trim(),
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setNewMessage("");
    } else if (newMessage.trim()) {
        setChatMessages(prev => [
            ...prev,
            {
              id: generateUniqueId(),
              user: 'Sistema',
              avatar: '',
              message: "Não conectado ao chat para enviar mensagem.",
              timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
            }
          ]);
    }
  };

  if (host === undefined) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!host) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center p-4">
        <UserCircle2 className="w-16 h-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Host não encontrado</h1>
        <p className="text-muted-foreground mb-6">
          Não foi possível encontrar informações para este host.
        </p>
        <Button asChild variant="outline">
          <Link href="/hosts">Voltar para Lista de Hosts</Link>
        </Button>
      </div>
    );
  }

  if (!host.kakoLiveFuid || !host.kakoLiveRoomId) {
     return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center p-4">
        <WifiOff className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold mb-2">{host.name} não configurou uma transmissão corretamente.</h1>
        <p className="text-muted-foreground mb-6">
          Este host ainda não possui todas as informações necessárias (FUID ou RoomID) para a transmissão Kako Live e/ou chat.
        </p>
        <Button asChild variant="outline">
          <Link href="/hosts">Voltar para Lista de Hosts</Link>
        </Button>
      </div>
    );
  }

  const pageTitle = host.streamTitle || `Ao Vivo: ${host.name}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/hosts">
            <ArrowLeft className="h-6 w-6" />
            <span className="sr-only">Voltar</span>
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-center flex-grow mr-8 sm:mr-0 truncate px-2">
          {pageTitle}
        </h1>
        <div className="w-8 h-8"></div> {/* Placeholder for spacing if needed */}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Video Player and Host Info */}
        <div className="md:col-span-2 space-y-6">
          <Card className="shadow-xl overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl text-primary">Transmissão de {host.name}</CardTitle>
            </CardHeader>
            <CardContent className="p-0 sm:p-2 md:p-4">
              <div className="bg-black rounded-md overflow-hidden shadow-inner aspect-video flex flex-col items-center justify-center text-muted-foreground">
                {/* Kako Live Embed */}
                <iframe
                  src={`https://app.kako.live/app/gzl_live.html?fuid=${host.kakoLiveFuid}&id=${host.kakoLiveRoomId}&type=live`}
                  width="100%"
                  height="100%"
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                  className="border-0"
                  title={`Transmissão de ${host.name}`}
                  data-ai-hint="live stream"
                ></iframe>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Info className="h-5 w-5 mr-2 text-primary flex-shrink-0" />
                Sobre {host.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {host.bio && (
                <p><strong>Bio:</strong> {host.bio}</p>
              )}
              <p><strong>Rank da Agência:</strong> #{host.rankPosition}</p>
              <p><strong>Rank Geral:</strong> {host.rank}</p>
              <p><strong>Seguidores:</strong> {host.totalFollowers}</p>
              <p><strong>Visualizações Totais:</strong> {host.totalViews}</p>
              <p><strong>Média de Espectadores:</strong> {host.avgViewers.toLocaleString('pt-BR')}</p>
              {host.likes !== undefined && (
                <div className="flex items-center">
                  <Heart className="h-4 w-4 mr-2 text-destructive" />
                  <p><strong>Likes:</strong> {host.likes.toLocaleString('pt-BR')}</p>
                </div>
              )}
              <p className="text-xs text-muted-foreground pt-2">
                Mais detalhes e estatísticas do host serão exibidos aqui em breve.
              </p>
            </CardContent>
          </Card>

          {host.giftsReceived && host.giftsReceived.length > 0 && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                    <GiftIcon className="h-5 w-5 mr-2 text-primary flex-shrink-0" />
                    Presentes Recebidos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {host.giftsReceived.map((gift) => (
                    <div key={gift.id} className="flex flex-col items-center text-center p-2 border rounded-lg shadow-sm bg-muted/20">
                      <Image
                        src={gift.iconUrl}
                        alt={gift.name}
                        width={48}
                        height={48}
                        className="rounded-md mb-2"
                        data-ai-hint={gift.dataAiHint || "gift icon"}
                      />
                      <p className="text-sm font-medium">{gift.name}</p>
                      <p className="text-xs text-muted-foreground">x {gift.count}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          {(!host.giftsReceived || host.giftsReceived.length === 0) && (
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                        <GiftIcon className="h-5 w-5 mr-2 text-primary flex-shrink-0" />
                        Presentes Recebidos
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground text-sm">Nenhum presente recebido ainda.</p>
                </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Chat */}
        <div className="md:col-span-1">
          <Card className="shadow-lg h-full flex flex-col max-h-[calc(100vh-12rem)] sm:max-h-[calc(100vh-10rem)]">
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
              <CardTitle className="text-lg font-semibold">Chat ao Vivo</CardTitle>
              <div className="flex items-center text-sm text-muted-foreground">
                <UsersIcon className="h-4 w-4 mr-1.5"/>
                <span>{/* Placeholder for live viewer count */}</span>
              </div>
            </CardHeader>
            <CardContent className="flex-grow p-0 min-h-0"> {/* Added min-h-0 */}
              <ScrollArea className="h-full" ref={scrollAreaRef}>
                <div className="p-4 space-y-4">
                  {chatMessages.map((item) => (
                    <div key={item.id} className="flex items-start space-x-3">
                      <Avatar className="h-8 w-8 border">
                        {item.avatar ? (
                            <AvatarImage src={item.avatar} alt={item.user} data-ai-hint="user avatar" />
                        ) : null}
                        <AvatarFallback>{item.user ? item.user.substring(0,1).toUpperCase() : 'S'}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-baseline space-x-2">
                          <span className="text-sm font-semibold text-primary">{item.user}</span>
                          <span className="text-xs text-muted-foreground">{item.timestamp}</span>
                        </div>
                        <p className="text-sm text-foreground/90 break-all">{item.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
            <div className="p-4 border-t">
              <div className="flex space-x-2">
                <Input
                  placeholder="Diga algo..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-grow"
                  disabled={!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN || !newMessage.trim()}
                >
                  <Send className="h-4 w-4"/>
                  <span className="sr-only">Enviar</span>
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

