
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import type { Host, ChatMessage } from '@/types';
import { placeholderHosts } from '../page';
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

type ParsedMessageResult =
  | { type: 'chat', userName: string, userAvatar: string, messageData: string }
  | { type: 'systemUpdate', online: number, likes: number, anchorNickname: string }
  | null;


function parseChatMessage(rawData: string): ParsedMessageResult {
  let parsedJson;
  try {
    const firstBraceIndex = rawData.indexOf('{');
    const lastBraceIndex = rawData.lastIndexOf('}');
    if (firstBraceIndex !== -1 && lastBraceIndex > firstBraceIndex) {
        rawData = rawData.substring(firstBraceIndex, lastBraceIndex + 1);
    }
    parsedJson = JSON.parse(rawData);
  } catch (e) {
    if (rawData && rawData.trim() !== "") {
      // If parsing fails but rawData is not empty, treat it as a simple text message
      return { type: 'chat', userName: "Texto", userAvatar: `https://placehold.co/32x32.png?text=T`, messageData: rawData };
    }
    // console.warn("Could not parse message or empty rawData:", rawData, e);
    return null;
  }

  let userName = "Servidor"; // Default for system or unknown messages
  let userAvatar = ""; // Default, can be a system icon or placeholder
  let messageData = "";

  // Room Status Update (Viewers, Likes, Anchor Info)
  if (parsedJson.anchor && parsedJson.anchor.nickname && parsedJson.online !== undefined && parsedJson.likes !== undefined) {
    return {
      type: 'systemUpdate',
      online: parsedJson.online,
      likes: parsedJson.likes,
      anchorNickname: parsedJson.anchor.nickname
    };
  }
  // Gift Event
  else if (parsedJson.giftId && parsedJson.user && parsedJson.user.nickname) {
    userName = parsedJson.user.nickname;
    userAvatar = parsedJson.user.avatar || `https://placehold.co/32x32.png?text=${userName.substring(0,1).toUpperCase() || 'G'}`;
    messageData = `🎁 ${userName} enviou ${parsedJson.giftCount || 1}x Presente ID ${parsedJson.giftId}!`;
    if (parsedJson.user.level) {
        messageData += ` (Nível ${parsedJson.user.level})`;
    }
    return { type: 'chat', userName, userAvatar, messageData };
  }
  // Game Event (baishun2 - LavaLink)
  else if (parsedJson.game && parsedJson.game.baishun2 && parsedJson.user && parsedJson.user.nickname) {
    return null; // Do not display game events in chat
  }
  // Standard Chat Message
  else if (parsedJson.user && typeof parsedJson.user === 'object' && parsedJson.user.nickname && parsedJson.text) {
    userName = parsedJson.user.nickname;
    messageData = parsedJson.text;
    userAvatar = parsedJson.user.avatar || `https://placehold.co/32x32.png?text=${userName.substring(0,1).toUpperCase() || 'U'}`;
    return { type: 'chat', userName, userAvatar, messageData };
  }
  // User Join/Enter Event (type 1, type2: 1 variant - no 'count' field)
  else if (
    parsedJson.user &&
    parsedJson.user.nickname &&
    parsedJson.type === 1 &&
    parsedJson.type2 === 1 &&
    !parsedJson.text && 
    !parsedJson.giftId && 
    !parsedJson.game &&
    !(parsedJson.anchor && parsedJson.anchor.nickname && parsedJson.online !== undefined) 
  ) {
    userName = parsedJson.user.nickname;
    userAvatar = parsedJson.user.avatar || `https://placehold.co/32x32.png?text=${userName.substring(0,1).toUpperCase() || 'U'}`;
    let joinMessage = `👋 ${userName} entrou na sala.`;
    if (parsedJson.user.level) {
      joinMessage += ` (Nível ${parsedJson.user.level})`;
    }
    if (parsedJson.roomUser && parsedJson.roomUser.fansLevel) {
        joinMessage += ` (Fã Nv. ${parsedJson.roomUser.fansLevel})`;
    }
    messageData = joinMessage;
    return { type: 'chat', userName, userAvatar, messageData };
  }
  // User Join/Enter Event (with 'count' field)
  else if (
    parsedJson.user && 
    parsedJson.user.nickname && 
    parsedJson.count !== undefined && 
    !parsedJson.text && 
    !parsedJson.giftId && 
    !parsedJson.game &&
    !(parsedJson.anchor && parsedJson.anchor.nickname && parsedJson.online !== undefined)
  ) {
    userName = parsedJson.user.nickname;
    userAvatar = parsedJson.user.avatar || `https://placehold.co/32x32.png?text=${userName.substring(0,1).toUpperCase() || 'U'}`;
    let joinMessage = `👋 ${userName} entrou na sala.`;
    if (parsedJson.user.level) {
      joinMessage += ` (Nível ${parsedJson.user.level})`;
    }
    if (parsedJson.roomUser && parsedJson.roomUser.fansLevel) {
        joinMessage += ` (Fã Nv. ${parsedJson.roomUser.fansLevel})`;
    }
    joinMessage += ` Espectadores: ${parsedJson.count}.`; 
    messageData = joinMessage;
    return { type: 'chat', userName, userAvatar, messageData };
  }
  // Fallback for other potential user-related structures for chat
  else if (parsedJson.username && (parsedJson.message || parsedJson.text || parsedJson.content)) {
    userName = parsedJson.username;
    messageData = parsedJson.text || parsedJson.message || parsedJson.content;
    userAvatar = parsedJson.avatar || `https://placehold.co/32x32.png?text=${userName.substring(0,1).toUpperCase() || 'U'}`;
    return { type: 'chat', userName, userAvatar, messageData };
  } 
  // Generic content that might be a system message not caught above, or simple text
  else if (parsedJson.content) {
      messageData = parsedJson.content;
      if (parsedJson.type === 'system_message' || parsedJson.type === 'SYSTEM' || (!parsedJson.user && !parsedJson.username)) {
          userName = "Sistema"; 
          userAvatar = ""; 
      } else if (parsedJson.user && parsedJson.user.nickname) { // if content exists with user
          userName = parsedJson.user.nickname;
          userAvatar = parsedJson.user.avatar || `https://placehold.co/32x32.png?text=${userName.substring(0,1).toUpperCase() || 'U'}`;
      }
      return { type: 'chat', userName, userAvatar, messageData };
  }
  // Final fallback for simple string messages not caught by initial rawData check
  else if (typeof parsedJson === 'string' && parsedJson.trim() !== "") { 
    messageData = parsedJson;
    userName = "Texto"; 
    userAvatar = `https://placehold.co/32x32.png?text=T`;
    return { type: 'chat', userName, userAvatar, messageData };
  } else if (parsedJson.message && typeof parsedJson.message === 'string' && parsedJson.message.trim() !== "") { 
    messageData = parsedJson.message;
    userName = "Anônimo";
    userAvatar = `https://placehold.co/32x32.png?text=A`;
    return { type: 'chat', userName, userAvatar, messageData };
  } else if (Object.keys(parsedJson).length > 0 && typeof parsedJson !== 'string') { 
    // console.warn("Mensagem JSON não reconhecida:", parsedJson);
    return null; // Do not display unknown complex JSON objects in chat
  }

  return null; // If no specific structure matches
}

const SCROLL_THRESHOLD = 10; // Pixels of tolerance for being "at the bottom"

export default function HostStreamPage() {
  const params = useParams();
  const hostId = typeof params.hostId === 'string' ? params.hostId : undefined;
  const [host, setHost] = useState<Host | null | undefined>(undefined); // undefined for loading, null for not found, Host for found
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const socketRef = useRef<WebSocket | null>(null);
  
  const scrollViewportRef = useRef<HTMLDivElement | null>(null);
  const prevChatMessagesLengthRef = useRef<number>(0);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [newUnreadMessages, setNewUnreadMessages] = useState(0);

  const [onlineViewers, setOnlineViewers] = useState<number | null>(null);
  const [liveLikes, setLiveLikes] = useState<number | null>(null);
  
  const { currentUser } = useAuth();

  useEffect(() => {
    if (hostId) {
      const foundHost = placeholderHosts.find(h => h.id === hostId);
      setHost(foundHost); // Will be 'undefined' if not found, which is fine for now
      if (foundHost) {
        // Reset chat and related states when host changes
        setChatMessages([]);
        setNewUnreadMessages(0);
        setIsAtBottom(true);
        prevChatMessagesLengthRef.current = 0;
        setOnlineViewers(foundHost.avgViewers || 0); // Initialize with placeholder or actual if available
        setLiveLikes(foundHost.likes || 0); // Initialize with placeholder or actual if available
      }
    } else {
      setHost(null); // No hostId provided
    }
  }, [hostId]);

  // Gift update simulation
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
        
        // Ensure the gift exists before trying to increment its count
        if (updatedGifts[randomIndex]) { 
            updatedGifts[randomIndex].count = (updatedGifts[randomIndex].count || 0) + Math.floor(Math.random() * 3) + 1;
        }
        return { ...prevHost, giftsReceived: updatedGifts };
      });
    }, 5000); // Update every 5 seconds
    return () => clearInterval(intervalId);
  }, [host?.id]); // Re-run if the host ID changes

  // WebSocket connection
  useEffect(() => {
    if (host === undefined) { // Still loading host data
      return;
    }

    if (!host || !host.kakoLiveRoomId) {
       if (host !== undefined && (chatMessages.length === 0 || (chatMessages.length > 0 && chatMessages[chatMessages.length - 1]?.message !== "Host ou RoomID não configurado para o chat."))) {
         // console.log("Host ou RoomID não configurado para o chat."); // Avoid adding to chat UI
       }
      return;
    }

    const wsUrl = `wss://h5-ws.kako.live/ws/v1?roomId=${host.kakoLiveRoomId}`;
    socketRef.current = new WebSocket(wsUrl);
    
    console.log(`Tentando conectar a ${wsUrl}...`);
    // setChatMessages(prev => [...prev, {id: generateUniqueId(), user: "Sistema", avatar: "", message: `Tentando conectar a ${wsUrl}...`, timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}]);

    socketRef.current.onopen = () => {
      console.log("WebSocket conectado!");
      // setChatMessages(prev => [...prev, {id: generateUniqueId(), user: "Sistema", avatar: "", message: "Conectado ao chat!", timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}]);
    };

    socketRef.current.onmessage = async (event) => {
      let messageContentString = "";
      if (event.data instanceof Blob) {
        try {
          messageContentString = await event.data.text();
        } catch (e) {
          console.error("Erro ao ler Blob:", e);
          messageContentString = "[Erro ao ler Blob]";
        }
      } else if (typeof event.data === 'string') {
        messageContentString = event.data;
      } else {
        // Attempt to stringify other types, though usually it's string or Blob
        try {
            messageContentString = JSON.stringify(event.data);
        } catch {
            messageContentString = "[Tipo de mensagem desconhecido]";
        }
      }
      
      const processedResult = parseChatMessage(messageContentString);

      if (processedResult) {
        if (processedResult.type === 'chat' && processedResult.messageData?.trim() !== "") {
          setChatMessages(prev => [...prev, {
            id: generateUniqueId(),
            user: processedResult.userName,
            avatar: processedResult.userAvatar,
            message: processedResult.messageData,
            timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
          }]);
        } else if (processedResult.type === 'systemUpdate') {
          setOnlineViewers(processedResult.online);
          setLiveLikes(processedResult.likes);
        }
      }
    };

    socketRef.current.onerror = (errorEvent) => {
      let errorMessage = "Erro na conexão do chat.";
       // Try to get a more specific message if available
       if (typeof errorEvent === 'object' && errorEvent !== null && 'type' in errorEvent && (errorEvent as any).message) {
        errorMessage = `Erro no chat: ${(errorEvent as any).message}`;
      } else if (typeof errorEvent === 'object' && errorEvent !== null && 'type' in errorEvent) {
        errorMessage = `Erro no chat: Evento do tipo ${errorEvent.type}`;
      }
      console.error("Erro no WebSocket:", errorEvent);
      setChatMessages(prev => [...prev, {id: generateUniqueId(), user: "Sistema", avatar: "", message: errorMessage, timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}]);
    };

    socketRef.current.onclose = (closeEvent) => {
      let closeMessage = "Desconectado do chat.";
      if (closeEvent.reason) {
        closeMessage += ` Motivo: ${closeEvent.reason}`;
      }
      console.log("WebSocket desconectado:", closeEvent.reason);
      setChatMessages(prev => [...prev, {id: generateUniqueId(), user: "Sistema", avatar: "", message: closeMessage, timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}]);
    };

    return () => {
      if (socketRef.current) {
        console.log("Fechando WebSocket...");
        socketRef.current.close();
      }
    };
  }, [host?.id, host?.kakoLiveRoomId]); // Only re-run if host or room ID changes

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const viewport = scrollViewportRef.current;
    if (viewport) {
      viewport.scrollTo({ top: viewport.scrollHeight, behavior });
    }
  }, []);

  const handleScroll = useCallback(() => {
    const viewport = scrollViewportRef.current;
    if (viewport) {
      const atBottom = viewport.scrollTop + viewport.clientHeight >= viewport.scrollHeight - SCROLL_THRESHOLD;
      setIsAtBottom(atBottom);
      if (atBottom) {
        setNewUnreadMessages(0);
      }
    }
  }, [setIsAtBottom, setNewUnreadMessages]);


  useEffect(() => {
    const viewportElement = scrollViewportRef.current; 
    if (!viewportElement) {
        // Attempt to find it again if the ref isn't populated on first pass
        // This can happen if child components render asynchronously or with delays.
        const el = document.querySelector('.chat-scroll-area div[data-radix-scroll-area-viewport]');
        if (el) {
            scrollViewportRef.current = el as HTMLDivElement;
            scrollViewportRef.current.addEventListener('scroll', handleScroll);
            // Initial scroll and state check
            setTimeout(() => {
                scrollToBottom('auto'); // Initial scroll to bottom
                handleScroll(); // Set initial isAtBottom state
            }, 200); // Delay to allow layout to settle
        } else {
            // console.warn("Chat scroll viewport not found for event listener attachment.");
        }
    } else {
        // Ref was already populated
        viewportElement.addEventListener('scroll', handleScroll);
        setTimeout(() => {
            scrollToBottom('auto');
            handleScroll();
        }, 200);
    }
    
    return () => {
      if (scrollViewportRef.current) {
        scrollViewportRef.current.removeEventListener('scroll', handleScroll);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleScroll, scrollToBottom]); // This effect should run once to set up listeners


  useEffect(() => {
    const newMessagesCount = chatMessages.length - prevChatMessagesLengthRef.current;

    if (newMessagesCount > 0) {
      if (isAtBottom) { // Use the state variable 'isAtBottom' which is updated by handleScroll
        scrollToBottom('auto');
      } else {
        setNewUnreadMessages(prev => prev + newMessagesCount);
      }
    }
    prevChatMessagesLengthRef.current = chatMessages.length;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatMessages, isAtBottom, scrollToBottom, setNewUnreadMessages]);


  const handleSendMessage = () => {
    if (newMessage.trim() && socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      // Format for Kako Live based on observed messages (simplified)
      const messageToSend = {
        type: 'chat_message', // This is a guess, might need specific type from Kako
        content: newMessage.trim(),
        // user: { nickname: currentUser?.profileName || 'Você' } // Kako might infer user from connection
      };
      socketRef.current.send(JSON.stringify(messageToSend));

      // Optimistic UI update
      setChatMessages(prev => [
        ...prev,
        {
          id: generateUniqueId(),
          user: currentUser?.profileName || 'Você', // Use profileName or display name
          avatar: currentUser?.photoURL || `https://placehold.co/32x32.png?text=${(currentUser?.profileName || 'V').substring(0,1).toUpperCase()}`,
          message: newMessage.trim(),
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setNewMessage("");
    } else if (newMessage.trim()) {
        // If socket not open, still add to local chat as a system message or just log
        setChatMessages(prev => [
            ...prev,
            {
              id: generateUniqueId(),
              user: 'Sistema',
              avatar: '', // No avatar for system
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
        <div className="w-8 h-8"></div> {/* Spacer to balance the back button */}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column (Video and Host Info) */}
        <div className="md:col-span-2 space-y-6">
         {/* Video Player Card */}
         <Card className="shadow-xl overflow-hidden">
            <CardHeader className="pb-2 flex-row justify-between items-center">
              <CardTitle className="text-xl text-primary">Transmissão de {host.name}</CardTitle>
              <div className="flex items-center space-x-4 text-sm">
                {onlineViewers !== null && (
                  <div className="flex items-center text-muted-foreground">
                    <UsersIcon className="h-4 w-4 mr-1.5 text-primary" />
                    <span>{onlineViewers.toLocaleString('pt-BR')}</span>
                  </div>
                )}
                {liveLikes !== null && (
                  <div className="flex items-center text-muted-foreground">
                    <Heart className="h-4 w-4 mr-1.5 text-destructive" />
                    <span>{liveLikes.toLocaleString('pt-BR')}</span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0 sm:p-2 md:p-4">
            {host.kakoLiveFuid && host.kakoLiveRoomId ? (
                <div className="bg-black rounded-md overflow-hidden shadow-inner aspect-video flex flex-col items-center justify-center text-muted-foreground">
                  {/* Using iframe to embed Kako Live player */}
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

          {/* Host Info Card */}
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
                  <p><strong>Curtidas (inicial):</strong> {(liveLikes !== null ? liveLikes : host.likes).toLocaleString('pt-BR')}</p>
                </div>
              )}
              <p className="text-xs text-muted-foreground pt-2">
                Mais detalhes e estatísticas do anfitrião serão exibidos aqui em breve.
              </p>
            </CardContent>
          </Card>

          {/* Gifts Received Card */}
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
                      <p className="text-xs text-muted-foreground">x {gift.count.toLocaleString('pt-BR')}</p>
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

        {/* Right Column (Chat) */}
        <div className="md:col-span-1">
          <Card className="shadow-lg h-full flex flex-col max-h-[calc(100vh-12rem)] sm:max-h-[calc(100vh-10rem)]"> {/* Max height for chat card */}
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
              <CardTitle className="text-lg font-semibold">Chat ao Vivo</CardTitle>
              <div className="flex items-center text-sm text-muted-foreground">
                {onlineViewers !== null && (
                    <>
                        <UsersIcon className="h-4 w-4 mr-1.5"/>
                        <span>{onlineViewers.toLocaleString('pt-BR')}</span>
                    </>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-grow p-0 min-h-0 relative"> {/* flex-grow and p-0 for ScrollArea */}
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
                  disabled={!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN || !newMessage.trim()}
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

