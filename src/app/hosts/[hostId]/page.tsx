
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import type { Host, ChatMessage } from '@/types';
import { placeholderHosts } from '../page'; // Import placeholderHosts
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, UserCircle2, WifiOff, Info, Heart, Gift as GiftIcon, Users as UsersIcon, Send, ArrowDownCircle } from 'lucide-react';
import LoadingSpinner from '@/components/ui/loading-spinner';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { useAuth } from '@/hooks/use-auth';

const generateUniqueId = () => {
  return String(Date.now()) + '-' + Math.random().toString(36).substr(2, 9);
};

function parseChatMessage(data: any): { userName: string, userAvatar: string, messageData: string } | null {
  let parsedJson;
  let rawStringInput = "";

  if (typeof data === 'string') {
    rawStringInput = data;
    // Attempt to clean leading non-JSON characters
    const firstBraceIndex = rawStringInput.indexOf('{');
    const lastBraceIndex = rawStringInput.lastIndexOf('}');
    let cleanJsonString = rawStringInput;

    if (firstBraceIndex !== -1 && lastBraceIndex > firstBraceIndex) {
      cleanJsonString = rawStringInput.substring(firstBraceIndex, lastBraceIndex + 1);
    }
    
    try {
      parsedJson = JSON.parse(cleanJsonString);
    } catch (e) {
      // Not JSON, or cleaned string is not valid JSON
      // Use original rawStringInput if it wasn't just braces
      if (rawStringInput.trim() !== "" && firstBraceIndex === -1) {
         return { userName: "Texto", userAvatar: `https://placehold.co/32x32.png?text=T`, messageData: rawStringInput };
      }
      return null; // Or treat as error/unknown if needed
    }
  } else if (typeof data === 'object' && data !== null) {
    parsedJson = data;
  } else {
    return null;
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
  // Check for Game Event Structure (baishun2 - LavaLink)
  else if (parsedJson.game && parsedJson.game.baishun2 && parsedJson.user && parsedJson.user.nickname) {
    userName = parsedJson.user.nickname;
    userAvatar = parsedJson.user.avatar || `https://placehold.co/32x32.png?text=${userName.substring(0,1).toUpperCase() || 'G'}`;
    const gameName = parsedJson.game.baishun2.name || "um jogo";
    const gameAmount = parsedJson.amount !== undefined ? `. Pontos: ${parsedJson.amount}` : "";
    // const winType = parsedJson.winType; // Could be used for more descriptive messages
    
    messageData = `🎮 ${userName} interagiu com o jogo ${gameName}${gameAmount}.`;
    if (parsedJson.user.level) {
      messageData += ` (Nível ${parsedJson.user.level})`;
    }
  }
  // Check for standard chat message structure (like from user example: KAROL❤️WILLIAN🦊FOX)
  else if (parsedJson.user && typeof parsedJson.user === 'object' && parsedJson.text) {
    userName = parsedJson.user.nickname || "Usuário";
    messageData = parsedJson.text;
    userAvatar = parsedJson.user.avatar || `https://placehold.co/32x32.png?text=${userName.substring(0,1).toUpperCase() || 'U'}`;
  }
  // Fallback for other potential structures
  else if (parsedJson.username && (parsedJson.message || parsedJson.text || parsedJson.content)) {
    userName = parsedJson.username;
    messageData = parsedJson.text || parsedJson.message || parsedJson.content;
    userAvatar = parsedJson.avatar || `https://placehold.co/32x32.png?text=${userName.substring(0,1).toUpperCase() || 'U'}`;
  } else if (parsedJson.content) {
      messageData = parsedJson.content;
      if (parsedJson.type === 'system_message' || parsedJson.type === 'SYSTEM' || (!parsedJson.user && !parsedJson.username)) {
          userName = "Sistema";
          userAvatar = ""; 
      }
  } else if (typeof parsedJson === 'string') { 
    messageData = parsedJson;
    userName = "Anônimo";
    userAvatar = `https://placehold.co/32x32.png?text=A`;
  } else if (parsedJson.message && typeof parsedJson.message === 'string') { 
    messageData = parsedJson.message;
    userName = "Anônimo";
    userAvatar = `https://placehold.co/32x32.png?text=A`;
  } else if (rawStringInput && rawStringInput.trim() !== "" && rawStringInput.indexOf('{') === -1) { 
    messageData = rawStringInput;
    userName = "Texto";
    userAvatar = `https://placehold.co/32x32.png?text=T`;
  } else if (Object.keys(parsedJson).length > 0 && typeof parsedJson !== 'string') { 
    messageData = JSON.stringify(parsedJson); 
    userName = "JSON";
    userAvatar = `https://placehold.co/32x32.png?text=J`;
  } else if (data.toString && typeof data.toString === 'function') { 
    messageData = data.toString();
  } else {
    return null; 
  }

  return { userName, userAvatar, messageData };
}

const SCROLL_THRESHOLD = 10; // Pixels tolerance for being "at the bottom"

export default function HostStreamPage() {
  const params = useParams();
  const hostId = typeof params.hostId === 'string' ? params.hostId : undefined;
  const [host, setHost] = useState<Host | null | undefined>(undefined);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const socketRef = useRef<WebSocket | null>(null);
  
  const scrollViewportRef = useRef<HTMLDivElement | null>(null);
  const prevChatMessagesLengthRef = useRef<number>(0);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [newUnreadMessages, setNewUnreadMessages] = useState(0);
  
  const { currentUser } = useAuth();

  useEffect(() => {
    if (hostId) {
      const foundHost = placeholderHosts.find(h => h.id === hostId);
      setHost(foundHost);
      if (foundHost) {
        // Reset chat for new host
        setChatMessages([]);
        setNewUnreadMessages(0);
        setIsAtBottom(true);
        prevChatMessagesLengthRef.current = 0;
      }
    } else {
      setHost(null);
    }
  }, [hostId]);

  useEffect(() => {
    if (!host?.id || !host.giftsReceived || host.giftsReceived.length === 0) {
      return;
    }
    const intervalId = setInterval(() => {
      setHost(prevHost => {
        if (!prevHost || !prevHost.giftsReceived || prevHost.giftsReceived.length === 0) {
          return prevHost;
        }

        const updatedGifts = prevHost.giftsReceived.map(gift => ({ ...gift }));
        const randomIndex = Math.floor(Math.random() * updatedGifts.length);
        
        if (updatedGifts[randomIndex]) { 
            updatedGifts[randomIndex].count = (updatedGifts[randomIndex].count || 0) + Math.floor(Math.random() * 3) + 1;
        }
        return { ...prevHost, giftsReceived: updatedGifts };
      });
    }, 5000);
    return () => clearInterval(intervalId);
  }, [host?.id]); 

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const viewport = scrollViewportRef.current;
    if (viewport) {
      viewport.scrollTo({ top: viewport.scrollHeight, behavior });
    }
  }, []);

  const handleScroll = useCallback(() => {
    const viewport = scrollViewportRef.current;
    if (viewport) {
      const atBottom = viewport.scrollHeight - viewport.scrollTop <= viewport.clientHeight + SCROLL_THRESHOLD;
      setIsAtBottom(atBottom);
      if (atBottom) {
        setNewUnreadMessages(0);
      }
    }
  }, []);

  // Effect for WebSocket connection
  useEffect(() => {
    if (host === undefined) {
      return;
    }

    if (!host || !host.kakoLiveRoomId) {
       setChatMessages(prev => {
        // Only add if not already present or if chat is empty
        if (prev.length === 0 || (prev.length > 0 && prev[prev.length - 1]?.message !== "Host ou RoomID não configurado para o chat.")) {
          return [
            ...prev, 
            {
              id: generateUniqueId(), 
              user: "Sistema", 
              avatar: "", 
              message: "Host ou RoomID não configurado para o chat.", 
              timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
            }
          ];
        }
        return prev;
      });
      return;
    }

    const wsUrl = `wss://h5-ws.kako.live/ws/v1?roomId=${host.kakoLiveRoomId}`;
    socketRef.current = new WebSocket(wsUrl);
    
    setChatMessages(prev => [{id: generateUniqueId(), user: "Sistema", avatar: "", message: `Conectando a ${wsUrl}...`, timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}, ...prev.filter(m => m.message !== "Host ou RoomID não configurado para o chat.")]);


    socketRef.current.onopen = () => {
      console.log("WebSocket conectado para chat: " + wsUrl);
      setChatMessages(prev => [{id: generateUniqueId(), user: "Sistema", avatar: "", message: "Conectado ao chat!", timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}, ...prev.filter(m => m.message !== `Conectando a ${wsUrl}...` && m.message !== "Host ou RoomID não configurado para o chat.")]);
    };

    socketRef.current.onmessage = async (event) => {
      let messageContentString = "";
      if (event.data instanceof Blob) {
        try {
          const text = await event.data.text();
          // Clean leading non-JSON characters
          const firstBraceIndex = text.indexOf('{');
          const lastBraceIndex = text.lastIndexOf('}');
          if (firstBraceIndex !== -1 && lastBraceIndex > firstBraceIndex) {
            messageContentString = text.substring(firstBraceIndex, lastBraceIndex + 1);
          } else if (text.trim() !== "") { // If no JSON structure, use raw text if not empty
            messageContentString = text;
          }
        } catch (e) {
          console.error("Erro ao ler Blob do WebSocket:", e);
          messageContentString = "[Erro ao ler Blob]";
        }
      } else if (typeof event.data === 'string') {
         // Clean leading non-JSON characters from string data as well
        const firstBraceIndex = event.data.indexOf('{');
        const lastBraceIndex = event.data.lastIndexOf('}');
        if (firstBraceIndex !== -1 && lastBraceIndex > firstBraceIndex) {
            messageContentString = event.data.substring(firstBraceIndex, lastBraceIndex + 1);
        } else if (event.data.trim() !== "") { // If no JSON structure, use raw text if not empty
            messageContentString = event.data;
        }
      } else {
        console.warn("Tipo de mensagem WebSocket desconhecido:", event.data);
        try {
            messageContentString = JSON.stringify(event.data);
        } catch {
            messageContentString = "[Tipo de mensagem desconhecido]";
        }
      }
      
      const processedMessage = parseChatMessage(messageContentString);

      if (processedMessage && processedMessage.messageData && processedMessage.messageData.trim() !== "") {
        setChatMessages(prev => [...prev, {
          id: generateUniqueId(),
          user: processedMessage.userName,
          avatar: processedMessage.userAvatar,
          message: processedMessage.messageData,
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        }]);
      } else {
        console.log("Mensagem processada vazia ou nula, não adicionada ao chat:", processedMessage, "Original data:", event.data, "Cleaned string:", messageContentString);
      }
    };

    socketRef.current.onerror = (errorEvent) => {
      console.error("Erro no WebSocket:", errorEvent);
      let errorMessage = "Erro na conexão do chat.";
       if (typeof errorEvent === 'object' && errorEvent !== null && 'type' in errorEvent && (errorEvent as any).message) {
        errorMessage = `Erro no chat: ${(errorEvent as any).message}`;
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
  }, [host?.id, host?.kakoLiveRoomId]); // REMOVED chatMessages from dependencies

  // Effect to setup scroll listener and initial scroll
  useEffect(() => {
    const viewportElement = document.querySelector('.chat-scroll-area div[data-radix-scroll-area-viewport]');
    if (viewportElement) {
      scrollViewportRef.current = viewportElement as HTMLDivElement;
      scrollViewportRef.current.addEventListener('scroll', handleScroll);
      
      // Initial scroll and state check
      setTimeout(() => {
        scrollToBottom('auto'); // Scroll to bottom on initial load
        handleScroll(); // Set initial isAtBottom state
      }, 200); // Delay to allow layout to stabilize

      return () => {
        scrollViewportRef.current?.removeEventListener('scroll', handleScroll);
      };
    } else {
      // Fallback or warning if the viewport isn't found
      console.warn("Chat scroll viewport not found. Auto-scrolling and unread indicators might not work.");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleScroll, scrollToBottom, host?.id]); // Re-run if host changes


  // Effect for handling new messages and auto-scrolling
  useEffect(() => {
    const viewport = scrollViewportRef.current;
    if (!viewport) return;

    // Determine if user was at the bottom *before* new messages potentially changed scrollHeight
    const wasAtBottomBeforeUpdate = viewport.scrollHeight - viewport.scrollTop <= viewport.clientHeight + SCROLL_THRESHOLD;
    
    const newMessagesCount = chatMessages.length - prevChatMessagesLengthRef.current;

    if (newMessagesCount > 0) { // Only act if there are new messages
      if (wasAtBottomBeforeUpdate) {
        scrollToBottom('auto'); // Smooth scroll looks jerky for auto-scroll
      } else {
        setNewUnreadMessages(prev => prev + newMessagesCount);
      }
    }
    prevChatMessagesLengthRef.current = chatMessages.length;
  }, [chatMessages, scrollToBottom]);


  const handleSendMessage = () => {
    if (newMessage.trim() && socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      const messageToSend = {
        type: 'chat_message', 
        content: newMessage.trim(),
        // You might need to send other fields like user ID, nickname, avatar from currentUser
        // For now, Kako's backend might associate it with the WebSocket session.
      };
      socketRef.current.send(JSON.stringify(messageToSend));

      // Optimistically update UI
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
        // If trying to send a message but socket is not open
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

  const handleScrollToNewMessages = () => {
    scrollToBottom('smooth');
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
        <h1 className="text-2xl font-bold mb-2">Anfitrião não encontrado</h1>
        <p className="text-muted-foreground mb-6">
          Não foi possível encontrar informações para este anfitrião.
        </p>
        <Button asChild variant="outline">
          <Link href="/hosts">Voltar para Lista de Anfitriões</Link>
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
        <div className="w-8 h-8"></div> {/* Spacer */}
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
            {host.kakoLiveFuid && host.kakoLiveRoomId ? (
                <div className="bg-black rounded-md overflow-hidden shadow-inner aspect-video flex flex-col items-center justify-center text-muted-foreground">
                  <iframe
                    src={`https://app.kako.live/app/gzl_live.html?fuid=${host.kakoLiveFuid}&id=${host.kakoLiveRoomId}&type=live`}
                    width="100%"
                    height="100%"
                    allow="autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                    className="border-0 aspect-video" 
                    title={`Transmissão de ${host.name}`}
                    data-ai-hint="live stream"
                  ></iframe>
                </div>
              ) : (
                <div className="bg-muted rounded-md overflow-hidden shadow-inner aspect-video flex flex-col items-center justify-center text-destructive p-4">
                    <WifiOff className="w-16 h-16 mb-4" />
                    <p className="text-lg font-semibold">Transmissão Indisponível</p>
                    <p className="text-sm text-center">Este anfitrião não possui as informações (FUID ou RoomID) necessárias para a transmissão.</p>
                </div>
              )}
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
                Mais detalhes e estatísticas do anfitrião serão exibidos aqui em breve.
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
                <span>{/* Placeholder */}</span>
              </div>
            </CardHeader>
            <CardContent className="flex-grow p-0 min-h-0 relative"> 
              <ScrollArea className="h-full chat-scroll-area">
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
              {newUnreadMessages > 0 && !isAtBottom && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10">
                  <Button
                    size="sm"
                    onClick={handleScrollToNewMessages}
                    className="rounded-full shadow-md bg-primary/90 hover:bg-primary text-primary-foreground backdrop-blur-sm"
                  >
                    <ArrowDownCircle className="mr-2 h-4 w-4" />
                    {newUnreadMessages} Nova(s)
                  </Button>
                </div>
              )}
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

