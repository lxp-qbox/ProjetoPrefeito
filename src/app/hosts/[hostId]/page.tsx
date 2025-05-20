
"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import type { Host } from '@/types';
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

// Placeholder chat messages
const placeholderChatMessages = [
  { id: '1', user: 'Alice', avatar: 'https://placehold.co/32x32.png?text=A', message: 'Olá a todos!', timestamp: '10:30 AM' },
  { id: '2', user: 'Bob', avatar: 'https://placehold.co/32x32.png?text=B', message: 'E aí! 😄', timestamp: '10:31 AM' },
  { id: '3', user: 'Carlos', avatar: 'https://placehold.co/32x32.png?text=C', message: 'Essa transmissão está demais!', timestamp: '10:32 AM' },
  { id: '4', user: 'Diana', avatar: 'https://placehold.co/32x32.png?text=D', message: 'Alguém sabe qual o próximo jogo?', timestamp: '10:33 AM' },
  { id: '5', user: 'Edu', avatar: 'https://placehold.co/32x32.png?text=E', message: 'Adorando a energia! ✨', timestamp: '10:34 AM' },
  { id: '6', user: 'Fernanda', avatar: 'https://placehold.co/32x32.png?text=F', message: 'PRESIDENTE é o melhor!', timestamp: '10:35 AM' },
  { id: '7', user: 'Gabriel', avatar: 'https://placehold.co/32x32.png?text=G', message: 'Muitos presentes!', timestamp: '10:36 AM' },
];


export default function HostStreamPage() {
  const params = useParams();
  const hostId = typeof params.hostId === 'string' ? params.hostId : undefined;
  const [host, setHost] = useState<Host | null | undefined>(undefined); // undefined: loading, null: not found/no stream
  const [chatMessages, setChatMessages] = useState(placeholderChatMessages);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    if (hostId) {
      const foundHost = getHostById(hostId);
      setHost(foundHost);
    } else {
      setHost(null); // No hostId, so not found
    }
  }, [hostId]);

  // Effect to simulate gift updates
  useEffect(() => {
    if (!host || !host.giftsReceived || host.giftsReceived.length === 0) {
      return;
    }

    const intervalId = setInterval(() => {
      setHost(prevHost => {
        if (!prevHost || !prevHost.giftsReceived || prevHost.giftsReceived.length === 0) {
          return prevHost;
        }
        const updatedGifts = prevHost.giftsReceived.map(gift => ({ ...gift }));
        const randomIndex = Math.floor(Math.random() * updatedGifts.length);
        updatedGifts[randomIndex].count = (updatedGifts[randomIndex].count || 0) + 1;

        return { ...prevHost, giftsReceived: updatedGifts };
      });
    }, 5000);

    return () => clearInterval(intervalId);
  }, [host]);


  const handleSendMessage = () => {
    if (newMessage.trim()) {
      setChatMessages(prev => [
        ...prev,
        {
          id: String(prev.length + 1),
          user: 'Você',
          avatar: 'https://placehold.co/32x32.png?text=V',
          message: newMessage.trim(),
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setNewMessage("");
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
        <div className="w-8 h-8"></div>
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
                  x5-playsinline="true"
                  x5-video-player-type="h5"
                  x-webkit-airplay="allow"
                  preload="auto"
                  controls
                  poster="https://placehold.co/1280x720.png?text=Player+de+V%C3%ADdeo"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  className="w-full h-full" // Removed object-contain, style handles object-fit
                >
                  {/* 
                    A valid video source URL (e.g., .mp4, .webm, HLS .m3u8, DASH .mpd) is required here.
                    WebSocket URLs (wss://...) are not direct video sources for this player.
                  */}
                </video>
              </div>
              <div className="mt-3 p-3 bg-destructive/10 text-destructive text-sm rounded-md flex items-start gap-2">
                <VideoOff className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Player de Vídeo Genérico Ativado</p>
                  <p>
                    Para reproduzir o conteúdo, este player requer uma URL de stream de vídeo direta (ex: .mp4, HLS .m3u8). 
                    A URL WebSocket (`wss://...`) não é compatível. A funcionalidade de transmissão ao vivo do Kako Live não funcionará com este player.
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
          <Card className="shadow-lg h-full flex flex-col max-h-[calc(100vh-12rem)] sm:max-h-[calc(100vh-10rem)]"> {/* Adjust max-height as needed */}
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
              <CardTitle className="text-lg font-semibold">Chat ao Vivo</CardTitle>
              <div className="flex items-center text-sm text-muted-foreground">
                <UsersIcon className="h-4 w-4 mr-1.5"/>
                <span>1.2k</span> {/* Placeholder viewer count */}
              </div>
            </CardHeader>
            <CardContent className="flex-grow p-0">
              <ScrollArea className="h-[calc(100%-0px)] p-4"> {/* Adjust height dynamically or set fixed */}
                <div className="space-y-4">
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
                        <p className="text-sm text-foreground/90">{item.message}</p>
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
                />
                <Button onClick={handleSendMessage}>
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

    