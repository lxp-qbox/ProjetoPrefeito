
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import type { Host, ReceivedGift } from '@/types';
import { placeholderHosts } from '../page'; // Import placeholderHosts
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, UserCircle2, WifiOff, Info, Heart, Gift as GiftIcon, VideoOff, Users as UsersIcon, Send } from 'lucide-react';
import LoadingSpinner from '@/components/ui/loading-spinner';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";

// This is a temporary solution for fetching host data.
// In a real app, this would come from a database/API.
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

export default function HostStreamPage() {
  const params = useParams();
  const hostId = typeof params.hostId === 'string' ? params.hostId : undefined;
  const [host, setHost] = useState<Host | null | undefined>(undefined); // undefined: loading, null: not found/no stream
  
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: '1', user: 'Alice', avatar: 'https://placehold.co/32x32.png?text=A', message: 'Olá a todos!', timestamp: '10:30 AM' },
    { id: '2', user: 'Bob', avatar: 'https://placehold.co/32x32.png?text=B', message: 'E aí! 😄', timestamp: '10:31 AM' },
  ]);
  const [newMessage, setNewMessage] = useState("");
  const socketRef = useRef<WebSocket | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (hostId) {
      const foundHost = getHostById(hostId);
      setHost(foundHost);
    } else {
      setHost(null); // No hostId, so not found
    }
  }, [hostId]);

  // Effect for simulated gift updates
  useEffect(() => {
    if (!host?.giftsReceived || host.giftsReceived.length === 0) {
      return;
    }
    const intervalId = setInterval(() => {
      setHost(prevHost => {
        if (!prevHost?.giftsReceived || prevHost.giftsReceived.length === 0) {
          return prevHost;
        }
        // Ensure prevHost is not null before spreading
        if (!prevHost) return prevHost;
        
        const updatedGifts = prevHost.giftsReceived.map(gift => ({ ...gift }));
        const randomIndex = Math.floor(Math.random() * updatedGifts.length);
        if (updatedGifts[randomIndex]) { // Check if gift exists at index
            updatedGifts[randomIndex].count = (updatedGifts[randomIndex].count || 0) + Math.floor(Math.random() * 3) + 1;
        }
        return { ...prevHost, giftsReceived: updatedGifts };
      });
    }, 5000);
    return () => clearInterval(intervalId);
  }, [host]);


  // Effect for WebSocket chat
  useEffect(() => {
    if (!host || !host.kakoLiveRoomId) {
      return;
    }

    const wsUrl = `wss://h5-ws.kako.live/ws/v1?roomId=${host.kakoLiveRoomId}`;
    socketRef.current = new WebSocket(wsUrl);

    socketRef.current.onopen = () => {
      console.log("WebSocket conectado para chat: " + wsUrl);
      setChatMessages(prev => [...prev, {id: String(Date.now()), user: "Sistema", avatar: "", message: "Conectado ao chat!", timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}]);
    };

    socketRef.current.onmessage = async (event) => { // Made async
      console.log("Mensagem recebida do WebSocket:", event.data);
      let messageData = "";
      let userName = "Servidor";
      let userAvatar = `https://placehold.co/32x32.png?text=S`;

      if (event.data instanceof Blob) {
        try {
          const blobText = await event.data.text();
          messageData = blobText; // Default to blob text
          // Attempt to parse blob text as JSON
          try {
            const parsedBlobJson = JSON.parse(blobText);
            if (parsedBlobJson.user && parsedBlobJson.message) {
              userName = parsedBlobJson.user.nickname || parsedBlobJson.user.name || "Usuário";
              messageData = parsedBlobJson.message;
              userAvatar = `https://placehold.co/32x32.png?text=${userName.substring(0,1).toUpperCase() || 'U'}`;
            } else if (parsedBlobJson.content) {
                messageData = parsedBlobJson.content;
            } else {
                 // If JSON but not expected structure, use raw text
                console.log("Blob text was JSON, but not expected structure. Using raw text:", messageData);
            }
          } catch (e) {
            // Blob text was not JSON, use it as raw messageData
            console.log("Blob text was not JSON, using raw text:", messageData);
          }
        } catch (e) {
          console.error("Erro ao ler Blob do WebSocket:", e);
          messageData = "[Erro ao ler Blob]";
        }
      } else if (typeof event.data === 'string') {
        // Handle string data (try to parse as JSON first)
        try {
          const parsedJson = JSON.parse(event.data);
          if (parsedJson.user && parsedJson.message) {
            userName = parsedJson.user.nickname || parsedJson.user.name || "Usuário";
            messageData = parsedJson.message;
            userAvatar = `https://placehold.co/32x32.png?text=${userName.substring(0,1).toUpperCase() || 'U'}`;
          } else if (parsedJson.content) {
            messageData = parsedJson.content;
          } else {
            // JSON, but not the expected user/message structure
            messageData = event.data; // Show raw JSON string
          }
        } catch (e) {
          // Not JSON, treat as raw string
          messageData = event.data;
        }
      } else {
        // Other data types?
        console.warn("Tipo de mensagem WebSocket desconhecido:", event.data);
        messageData = "[Tipo de mensagem desconhecido]";
      }
      
      if (messageData) { // Only add if messageData is not empty
        setChatMessages(prev => [...prev, {
          id: String(Date.now()), 
          user: userName, 
          avatar: userAvatar, 
          message: messageData, 
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        }]);
      }
    };

    socketRef.current.onerror = (error) => {
      console.error("Erro no WebSocket:", error);
      setChatMessages(prev => [...prev, {id: String(Date.now()), user: "Sistema", avatar: "", message: "Erro na conexão do chat.", timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}]);
    };

    socketRef.current.onclose = () => {
      console.log("WebSocket desconectado.");
      setChatMessages(prev => [...prev, {id: String(Date.now()), user: "Sistema", avatar: "", message: "Desconectado do chat.", timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}]);
    };

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [host, host?.kakoLiveRoomId]);

  useEffect(() => {
    // Auto-scroll to bottom of chat
    if (scrollAreaRef.current) {
      const scrollableViewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (scrollableViewport) {
        scrollableViewport.scrollTop = scrollableViewport.scrollHeight;
      }
    }
  }, [chatMessages]);


  const handleSendMessage = () => {
    if (newMessage.trim() && socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      // The message format to send is specific to Kako Live's backend.
      // This is a guess; it might require a more complex JSON structure.
      socketRef.current.send(JSON.stringify({ type: 'chat', message: newMessage.trim() }));
      
      // Optimistically add to UI, or wait for echo from server
      setChatMessages(prev => [
        ...prev,
        {
          id: String(Date.now()),
          user: 'Você', // Or current user name
          avatar: 'https://placehold.co/32x32.png?text=V',
          message: newMessage.trim(),
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setNewMessage("");
    } else if (newMessage.trim()) {
        setChatMessages(prev => [
            ...prev,
            {
              id: String(Date.now()),
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
          Este host ainda não possui todas as informações necessárias (FUID ou RoomID) para a transmissão Kako Live.
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Coluna Principal: Vídeo e Info do Host */}
        <div className="md:col-span-2 space-y-6">
          <Card className="shadow-xl overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl text-primary">Transmissão de {host.name}</CardTitle>
            </CardHeader>
            <CardContent className="p-0 sm:p-2 md:p-4">
              <div className="bg-black rounded-md overflow-hidden shadow-inner aspect-video flex flex-col items-center justify-center text-muted-foreground">
                <video
                  playsInline
                  webkit-playsinline="" 
                  x5-playsinline="true"
                  x5-video-player-type="h5"
                  x-webkit-airplay="allow"
                  preload="auto"
                  controls
                  poster="https://placehold.co/1280x720.png?text=Player+de+V%C3%ADdeo"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  className="w-full h-full"
                  data-ai-hint="live stream"
                >
                </video>
              </div>
              <div className="mt-3 p-3 bg-destructive/10 text-destructive text-sm rounded-md flex items-start gap-2">
                <VideoOff className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Player de Vídeo Genérico Ativado</p>
                  <p>
                    Para reproduzir o conteúdo, este player requer uma URL de stream de vídeo direta (ex: .mp4, HLS .m3u8). 
                    A URL WebSocket (`wss://...`) para o chat não é uma fonte de vídeo compatível para este player. A funcionalidade de transmissão ao vivo do Kako Live não funcionará com este player genérico.
                  </p>
                </div>
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

        {/* Coluna da Direita: Chat */}
        <div className="md:col-span-1">
          <Card className="shadow-lg h-full flex flex-col max-h-[calc(100vh-12rem)] sm:max-h-[calc(100vh-10rem)]">
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
              <CardTitle className="text-lg font-semibold">Chat ao Vivo</CardTitle>
              <div className="flex items-center text-sm text-muted-foreground">
                <UsersIcon className="h-4 w-4 mr-1.5"/>
                <span>{/* Placeholder for live viewer count from WebSocket if available */}</span>
              </div>
            </CardHeader>
            <CardContent className="flex-grow p-0">
              <ScrollArea className="h-full" ref={scrollAreaRef}> {/* Ensure ScrollArea takes up available space */}
                <div className="p-4 space-y-4">
                  {chatMessages.map((item) => (
                    <div key={item.id} className="flex items-start space-x-3">
                      <Avatar className="h-8 w-8 border">
                        <AvatarImage src={item.avatar} alt={item.user} data-ai-hint="user avatar" />
                        <AvatarFallback>{item.user.substring(0,1)}</AvatarFallback>
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
                  disabled={!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN}
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

    