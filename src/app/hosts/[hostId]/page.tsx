
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import type { Host, ChatMessage } from '@/types';
import { placeholderHosts } from '../page'; 
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, UserCircle2, WifiOff, Info, Heart, Gift as GiftIcon, Users as UsersIcon, Send, Maximize2, Minimize2, ArrowDownCircle } from 'lucide-react';
import LoadingSpinner from '@/components/ui/loading-spinner';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"
import { Input } from "@/components/ui/input";
import { useAuth } from '@/hooks/use-auth';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from '@/lib/utils';


const generateUniqueId = () => {
  return String(Date.now()) + '-' + Math.random().toString(36).substr(2, 9);
};

type ParsedChatMessageType =
  | { type: 'chat', id?: string, userName: string, userAvatar?: string, userMedalUrl?: string, messageData: string, extractedRoomId?: string , userId?: string, userLevel?: number, userGender?: number }
  | { type: 'systemUpdate', online: number, likes: number, anchorNickname: string, anchorUserId?: string, anchorAvatarUrl?: string, anchorLevel?: number, extractedRoomId?: string, isCurrentlyLive: boolean }
  | null;


function parseChatMessage(rawData: string): ParsedChatMessageType {
  let parsedJson: any;
  try {
    const firstBraceIndex = rawData.indexOf('{');
    const lastBraceIndex = rawData.lastIndexOf('}');
    let jsonString = rawData;
    if (firstBraceIndex !== -1 && lastBraceIndex > firstBraceIndex) {
        jsonString = rawData.substring(firstBraceIndex, lastBraceIndex + 1);
    }
    parsedJson = JSON.parse(jsonString);
  } catch (e) {
    return null;
  }

  const serverMessageId = parsedJson.id as string | undefined;
  const extractedRoomId = parsedJson.roomId as string | undefined;
  let userName = "Sistema";
  let userAvatar: string | undefined = undefined;
  let userMedalUrl: string | undefined = undefined;
  let messageData = "";
  let userId: string | undefined = undefined;
  let userLevel: number | undefined = undefined;
  let userGender: number | undefined = undefined;


  const messageUser = parsedJson.user;
  if (messageUser && typeof messageUser === 'object') {
    userName = messageUser.nickname || messageUser.name || userName;
    userAvatar = messageUser.avatar || messageUser.avatarUrl;
    userId = messageUser.userId;
    userLevel = messageUser.level;
    userGender = messageUser.gender; // Extract gender
    if (messageUser.nickname) { 
        userMedalUrl = `https://app.kako.live/app/rs/medal/user/range_1.png`;
    }
  }

  if (parsedJson.anchor && typeof parsedJson.anchor === 'object' && parsedJson.anchor.nickname && typeof parsedJson.online === 'number' && typeof parsedJson.likes === 'number') {
    let isStreamCurrentlyLive = true;
    
    const statusChecks = [
        parsedJson.anchor.isLiving === false,
        (typeof parsedJson.status === 'number' && parsedJson.status !== 19 && parsedJson.status !== 1),
        (typeof parsedJson.stopReason === 'number' && parsedJson.stopReason !== 0),
        parsedJson.paused === true
    ];

    if (statusChecks.some(check => check)) {
        isStreamCurrentlyLive = false;
        if (parsedJson.anchor.isLiving === false) console.log("Stream ended: anchor.isLiving is false");
        if (typeof parsedJson.status === 'number' && parsedJson.status !== 19 && parsedJson.status !== 1) console.log(`Stream ended: status is ${parsedJson.status}`);
        if (typeof parsedJson.stopReason === 'number' && parsedJson.stopReason !== 0) console.log(`Stream ended: stopReason is ${parsedJson.stopReason}`);
        if (parsedJson.paused === true) console.log("Stream ended: paused is true");
    }
    

    return {
      type: 'systemUpdate',
      online: parsedJson.online,
      likes: parsedJson.likes,
      anchorNickname: parsedJson.anchor.nickname,
      anchorUserId: parsedJson.anchor.userId,
      anchorAvatarUrl: parsedJson.anchor.avatar,
      anchorLevel: parsedJson.anchor.level,
      extractedRoomId,
      isCurrentlyLive: isStreamCurrentlyLive
    };
  }
  else if (parsedJson.giftId && messageUser && messageUser.nickname && typeof parsedJson.giftCount === 'number') {
    messageData = `🎁 ${userName} enviou ${parsedJson.giftCount}x Presente ID ${parsedJson.giftId}!`;
    if (userLevel) {
        messageData += ` (Nível ${userLevel})`;
    }
    return { type: 'chat', id: serverMessageId, userName, userAvatar, userMedalUrl, messageData, extractedRoomId, userId, userLevel, userGender };
  }
  else if (parsedJson.game && parsedJson.game.baishun2) {
    return null; 
  }
  else if (
    messageUser && typeof messageUser === 'object' && messageUser.nickname &&
    parsedJson.type === 1 && parsedJson.type2 === 1 &&
    !parsedJson.text && !parsedJson.giftId && !parsedJson.game && !parsedJson.count &&
    !(parsedJson.anchor && typeof parsedJson.anchor === 'object' && parsedJson.anchor.nickname && typeof parsedJson.online === 'number')
  ) {
    let joinMessage = `👋 Entrou na sala.`;
    if (userLevel) {
      joinMessage += ` (Nível ${userLevel})`;
    }
    if (parsedJson.roomUser && parsedJson.roomUser.fansLevel) {
        joinMessage += ` (Fã Nv. ${parsedJson.roomUser.fansLevel})`;
    }
    messageData = joinMessage;
    return { type: 'chat', id: serverMessageId, userName, userAvatar, userMedalUrl, messageData, extractedRoomId, userId, userLevel, userGender };
  }
  else if (
    messageUser && typeof messageUser === 'object' && messageUser.nickname &&
    typeof parsedJson.count === 'number' &&
    !parsedJson.text && !parsedJson.giftId && !parsedJson.game &&
    !(parsedJson.anchor && typeof parsedJson.anchor === 'object' && parsedJson.anchor.nickname && typeof parsedJson.online === 'number')
  ) {
    let joinMessage = `👋 Entrou na sala.`;
    if (userLevel) {
      joinMessage += ` (Nível ${userLevel})`;
    }
    if (parsedJson.roomUser && parsedJson.roomUser.fansLevel) {
        joinMessage += ` (Fã Nv. ${parsedJson.roomUser.fansLevel})`;
    }
    joinMessage += ` Espectadores: ${parsedJson.count}.`;
    messageData = joinMessage;
    return { type: 'chat', id: serverMessageId, userName, userAvatar, userMedalUrl, messageData, extractedRoomId, userId, userLevel, userGender };
  }
  else if (messageUser && typeof messageUser === 'object' && messageUser.nickname && parsedJson.text) {
    messageData = parsedJson.text;
    return { type: 'chat', id: serverMessageId, userName, userAvatar, userMedalUrl, messageData, extractedRoomId, userId, userLevel, userGender };
  }
  else if (parsedJson.username && (parsedJson.message || parsedJson.text || parsedJson.content)) {
    userName = parsedJson.username;
    userAvatar = parsedJson.avatar;
    userId = parsedJson.userId;
    messageData = parsedJson.text || parsedJson.message || parsedJson.content;
    return { type: 'chat', id: serverMessageId, userName, userAvatar, userMedalUrl, messageData, extractedRoomId, userId, userLevel, userGender };
  }
  else if (parsedJson.content && !messageUser && !parsedJson.anchor && !parsedJson.giftId && !parsedJson.game && !parsedJson.type && !parsedJson.count) {
      messageData = parsedJson.content;
      return { type: 'chat', id: serverMessageId, userName: "Sistema", userAvatar: undefined, userMedalUrl: undefined, messageData, extractedRoomId };
  }
  return null;
}

const SCROLL_THRESHOLD = 10;

export default function HostStreamPage() {
  const params = useParams();
  const hostId = typeof params.hostId === 'string' ? params.hostId : undefined;
  const [host, setHost] = useState<Host | null | undefined>(undefined);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const socketRef = useRef<WebSocket | null>(null);

  const scrollAreaRef = useRef<React.ElementRef<typeof ScrollAreaPrimitive.Root>>(null);
  const scrollViewportRef = useRef<HTMLDivElement | null>(null);
  const prevChatMessagesLengthRef = useRef<number>(0);

  const [isAtBottom, setIsAtBottom] = useState(true);
  const [newUnreadMessages, setNewUnreadMessages] = useState(0);
  const [enableAutoScroll, setEnableAutoScroll] = useState(true);

  const [onlineViewers, setOnlineViewers] = useState<number | null>(null);
  const [liveLikes, setLiveLikes] = useState<number | null>(null);
  const [showRawData, setShowRawData] = useState(false);
  const [isChatMaximized, setIsChatMaximized] = useState(false);
  const [isStreamEnded, setIsStreamEnded] = useState(false);

  const { currentUser } = useAuth();

  useEffect(() => {
    if (hostId) {
      const foundHost = placeholderHosts.find(h => h.id === hostId);
      setHost(foundHost);
      if (foundHost) {
        setChatMessages([]);
        prevChatMessagesLengthRef.current = 0;
        setOnlineViewers(foundHost.avgViewers || 0);
        setLiveLikes(foundHost.likes || 0);
        setIsAtBottom(true);
        setNewUnreadMessages(0);
        setIsStreamEnded(false); // Reset stream ended state when new host is loaded
      }
    } else {
      setHost(null);
    }
  }, [hostId]);

  useEffect(() => {
    if (isStreamEnded || !host?.id || !host.giftsReceived || host.giftsReceived.length === 0) {
      if (socketRef.current && isStreamEnded && socketRef.current.readyState !== WebSocket.CLOSED) {
        console.log("WebSocket: Gift simulation stopped or will be closed by stream end logic.");
      }
      return;
    }
    const intervalId = setInterval(() => {
      setHost(prevHost => {
        if (!prevHost || !prevHost.id || !prevHost.giftsReceived || prevHost.giftsReceived.length === 0) {
          return prevHost;
        }
        if (host?.id && prevHost.id !== host.id) {
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
  }, [host?.id, host?.giftsReceived, isStreamEnded]);


  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (scrollViewportRef.current) {
      scrollViewportRef.current.scrollTo({ top: scrollViewportRef.current.scrollHeight, behavior });
    }
  }, []);

  const handleScroll = useCallback(() => {
    if (!scrollViewportRef.current) return;
    const viewport = scrollViewportRef.current;
    const atBottom = viewport.scrollTop + viewport.clientHeight >= viewport.scrollHeight - SCROLL_THRESHOLD;
    setIsAtBottom(atBottom);
    if (atBottom) {
      setNewUnreadMessages(0);
    }
  }, [SCROLL_THRESHOLD, setIsAtBottom, setNewUnreadMessages]);

  useEffect(() => {
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]') as HTMLDivElement;
        scrollViewportRef.current = viewport;
        if (viewport) {
            viewport.addEventListener('scroll', handleScroll);
            // Call handleScroll once after attaching the listener to set initial state
            handleScroll(); 
            return () => viewport.removeEventListener('scroll', handleScroll);
        } else {
           // console.warn("Scroll viewport not found in HostStreamPage");
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [host, handleScroll]);


  useEffect(() => {
    const newMessagesCount = chatMessages.length - prevChatMessagesLengthRef.current;

    if (newMessagesCount > 0 && enableAutoScroll) { 
      if (isAtBottom) {
        scrollToBottom('auto');
      } else {
        setNewUnreadMessages(prev => prev + newMessagesCount);
      }
    }
    prevChatMessagesLengthRef.current = chatMessages.length;
  }, [chatMessages, isAtBottom, scrollToBottom, enableAutoScroll, setNewUnreadMessages]);


  useEffect(() => {
    if (host === undefined || isStreamEnded) {
      if (isStreamEnded && socketRef.current && socketRef.current.readyState !== WebSocket.CLOSED) {
        console.log("WebSocket: Closing connection because stream has ended.");
        socketRef.current.close();
        socketRef.current = null;
      }
      return;
    }

    if (!host || !host.kakoLiveRoomId) {
        console.warn("Host ou RoomID não configurado para chat. Não conectando WebSocket.");
        return;
    }
    if (socketRef.current && socketRef.current.url.includes(host.kakoLiveRoomId)) {
      console.log("WebSocket: Already connected to the correct room for this host.");
      return;
    }

    if (socketRef.current) {
      console.log("WebSocket: Closing existing connection before opening new one for different host/room.");
      socketRef.current.onopen = null;
      socketRef.current.onmessage = null;
      socketRef.current.onerror = null;
      socketRef.current.onclose = null;
      socketRef.current.close();
      socketRef.current = null;
    }
    
    console.log(`WebSocket: Tentando conectar a wss://h5-ws.kako.live/ws/v1?roomId=${host.kakoLiveRoomId}`);
    socketRef.current = new WebSocket(`wss://h5-ws.kako.live/ws/v1?roomId=${host.kakoLiveRoomId}`);

    socketRef.current.onopen = () => {
      console.log("WebSocket: Conectado!");
    };

    socketRef.current.onmessage = async (event) => {
      try {
        let messageContentString = "";
        if (event.data instanceof Blob) {
          try {
            messageContentString = await event.data.text();
          } catch (e) {
            console.error("WebSocket: Erro ao ler Blob:", e);
            messageContentString = "[Erro ao ler Blob]";
          }
        } else if (typeof event.data === 'string') {
          messageContentString = event.data;
        } else {
          try {
              messageContentString = JSON.stringify(event.data);
          } catch {
              messageContentString = "[Tipo de mensagem desconhecido]";
          }
        }
        
        // Attempt to clean potential leading non-JSON characters
        let cleanJsonString = messageContentString;
        const firstBrace = messageContentString.indexOf('{');
        const lastBrace = messageContentString.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace > firstBrace) {
          cleanJsonString = messageContentString.substring(firstBrace, lastBrace + 1);
        }

        const processedResult = parseChatMessage(cleanJsonString);

        if (processedResult) {
          if (processedResult.type === 'systemUpdate') {
             if (!processedResult.extractedRoomId || (processedResult.extractedRoomId === host.kakoLiveRoomId)) {
                setOnlineViewers(processedResult.online);
                setLiveLikes(processedResult.likes);

                if (processedResult.isCurrentlyLive === false && !isStreamEnded) { 
                  setIsStreamEnded(true);
                  setChatMessages(prev => [...prev, {
                      id: generateUniqueId(),
                      user: "Sistema",
                      avatar: undefined,
                      userMedalUrl: undefined,
                      message: "A transmissão foi encerrada.",
                      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                      rawData: "Stream ended event (from systemUpdate)",
                      displayFormatted: true,
                      gender: undefined,
                  }]);
                } else if (processedResult.isCurrentlyLive === true && isStreamEnded) {
                  setIsStreamEnded(false);
                   setChatMessages(prev => [...prev, {
                      id: generateUniqueId(),
                      user: "Sistema",
                      avatar: undefined,
                      userMedalUrl: undefined,
                      message: "A transmissão foi reiniciada!",
                      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                      rawData: "Stream restarted event (from systemUpdate)",
                      displayFormatted: true,
                      gender: undefined,
                  }]);
                }
            }
          } else if (processedResult.type === 'chat') {
            const shouldDisplayFormatted = (processedResult.extractedRoomId && processedResult.extractedRoomId === host.kakoLiveRoomId) || !processedResult.extractedRoomId;
            
            const potentialNewMessage: ChatMessage = {
              id: processedResult.id || generateUniqueId(),
              user: processedResult.userName,
              avatar: processedResult.userAvatar,
              userMedalUrl: processedResult.userMedalUrl,
              message: processedResult.messageData,
              timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
              rawData: cleanJsonString,
              displayFormatted: shouldDisplayFormatted,
              gender: processedResult.userGender,
            };

            setChatMessages(prev => {
              if (potentialNewMessage.id && !potentialNewMessage.id.startsWith("client-temp-") && prev.some(msg => msg.id === potentialNewMessage.id)) {
                  return prev; 
              }
              const lastMessage = prev.length > 0 ? prev[prev.length -1] : null;
              if (
                potentialNewMessage.user === (currentUser?.profileName || 'Você') &&
                lastMessage &&
                lastMessage.user === potentialNewMessage.user &&
                lastMessage.message === potentialNewMessage.message &&
                lastMessage.displayFormatted && 
                lastMessage.id.startsWith("client-temp-") 
              ) {
                return prev;
              }
              return [...prev, potentialNewMessage];
            });
          }
        } else if (messageContentString?.trim() !== "") {
          setChatMessages(prev => [...prev, {
            id: generateUniqueId(),
            user: 'Servidor (Dados)',
            avatar: undefined,
            userMedalUrl: undefined,
            message: 'Conteúdo não processado para o chat.',
            timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            rawData: messageContentString,
            displayFormatted: false, // Will only show if showRawData is true
            gender: undefined,
          }]);
        }
      } catch (e: any) {
        console.error("WebSocket: Erro fatal ao processar mensagem:", e, "Dados originais:", event.data);
        const errorMessage = e instanceof Error ? e.message : String(e);
        const originalData = typeof event.data === 'string' ? event.data : (event.data instanceof Blob ? '[Blob Data]' : '[Binary Data]');
        // Removed adding this critical error to chatMessages to avoid potential loops if error is in setChatMessages
      }
    };

    socketRef.current.onerror = (errorEvent) => {
      let errorMessage = "Erro na conexão do chat.";
       if (typeof errorEvent === 'object' && errorEvent !== null && 'type'in errorEvent && (errorEvent as any).message) {
        errorMessage = `Erro no chat: ${(errorEvent as any).message}`;
      } else if (typeof errorEvent === 'object' && errorEvent !== null && 'type'in errorEvent) {
        errorMessage = `Erro no chat: Evento do tipo ${errorEvent.type}`;
      }
      console.error("WebSocket: Erro na conexão:", errorEvent, errorMessage);
    };

    socketRef.current.onclose = (closeEvent) => {
      let closeMessage = "Desconectado do chat.";
      if (closeEvent.reason) {
        closeMessage += ` Motivo: ${closeEvent.reason} (Código: ${closeEvent.code})`;
      } else {
        closeMessage += ` (Código: ${closeEvent.code})`;
      }
      console.log("WebSocket: Desconectado.", closeEvent, closeMessage);
      if (socketRef.current && socketRef.current.readyState !== WebSocket.CLOSING && socketRef.current.readyState !== WebSocket.CLOSED) {
         // Avoid adding to chat if already closing or closed to prevent loops
      }
    };

    return () => {
      if (socketRef.current) {
        console.log("WebSocket: Cleaning up connection for host change or unmount.");
        socketRef.current.onopen = null;
        socketRef.current.onmessage = null;
        socketRef.current.onerror = null;
        socketRef.current.onclose = null;
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [host?.id, host?.kakoLiveRoomId, currentUser?.profileName, isStreamEnded]); // isStreamEnded added

  const handleSendMessage = () => {
    if (newMessage.trim() && socketRef.current && socketRef.current.readyState === WebSocket.OPEN && !isStreamEnded) {
      const messageToSend = { text: newMessage.trim() };
      socketRef.current.send(JSON.stringify(messageToSend));

      const optimisticMessage: ChatMessage = {
        id: "client-temp-" + generateUniqueId(), 
        user: currentUser?.profileName || 'Você',
        avatar: currentUser?.photoURL || undefined,
        userMedalUrl: 'https://app.kako.live/app/rs/medal/user/range_1.png', 
        message: newMessage.trim(),
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        rawData: JSON.stringify({ ...messageToSend, sent: true }),
        displayFormatted: true,
        gender: currentUser?.gender === 'male' ? 1 : currentUser?.gender === 'female' ? 2 : undefined,
      };
      setChatMessages(prev => [...prev, optimisticMessage]);
      setNewMessage("");
    } else if (newMessage.trim() && isStreamEnded) {
      setChatMessages(prev => [
        ...prev,
        {
          id: generateUniqueId(),
          user: 'Sistema',
          avatar: undefined,
          userMedalUrl: undefined,
          message: "Não é possível enviar mensagens. A transmissão foi encerrada.",
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          rawData: "Attempted send while stream ended",
          displayFormatted: true,
          gender: undefined,
        }
      ]);
    } else if (newMessage.trim()) { 
        // Removed adding "Não conectado ao chat" message to avoid potential loops
        console.warn("Attempted to send message while not connected or message empty.");
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
        <div className="w-8 h-8"></div> 
      </div>

      {/* Main Content Grid */}
      <div className={`grid grid-cols-1 ${isChatMaximized ? 'md:grid-cols-1' : 'md:grid-cols-3'} gap-6`}>
        {/* Left Column (Video and Host Info) */}
        <div className={`${isChatMaximized ? 'hidden md:hidden' : 'md:col-span-2 space-y-6'}`}>
         <Card className="shadow-xl overflow-hidden">
            <CardHeader className="pb-2 flex-row justify-between items-center">
              <CardTitle className="text-xl text-primary">{host.streamTitle || `Transmissão de ${host.name}`}</CardTitle>
               <div className="flex items-center space-x-4 text-sm">
                {isStreamEnded ? (
                    <span className="text-sm font-semibold text-destructive">OFFLINE</span>
                ) : onlineViewers !== null && (
                  <div className="flex items-center text-muted-foreground">
                    <UsersIcon className="h-4 w-4 mr-1.5 text-primary" />
                    <span>{onlineViewers.toLocaleString('pt-BR')}</span>
                  </div>
                )}
                {!isStreamEnded && liveLikes !== null && (
                  <div className="flex items-center text-muted-foreground">
                    <Heart className="h-4 w-4 mr-1.5 text-destructive" />
                    <span>{liveLikes.toLocaleString('pt-BR')}</span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
            <div className="bg-black rounded-md overflow-hidden shadow-inner aspect-[16/9] flex flex-col items-center justify-center text-muted-foreground relative">
              {isStreamEnded ? (
                <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-center p-4 z-10">
                  <WifiOff className="w-16 h-16 text-destructive mb-4" />
                  <p className="text-xl font-semibold text-destructive-foreground">Esta transmissão foi encerrada.</p>
                </div>
              ) : null}
              {(host.kakoLiveFuid && host.kakoLiveRoomId) ? (
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
                ) : (
                  <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-center p-4 z-10">
                      <WifiOff className="w-16 h-16 text-destructive mb-4" />
                      <p className="text-lg font-semibold text-destructive-foreground">Transmissão Indisponível</p>
                      <p className="text-sm text-center text-destructive-foreground/80">Este anfitrião não possui as informações (FUID ou RoomID) necessárias para a transmissão.</p>
                  </div>
                )}
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
              <p><strong>Média de Espectadores:</strong> {(onlineViewers !== null && !isStreamEnded ? onlineViewers : host.avgViewers).toLocaleString('pt-BR')}</p>
              {host.likes !== undefined && (
                <div className="flex items-center">
                  <Heart className="h-4 w-4 mr-2 text-destructive" />
                  <p><strong>Curtidas:</strong> {(liveLikes !== null && !isStreamEnded ? liveLikes : host.likes).toLocaleString('pt-BR')}</p>
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
        <div className={`${isChatMaximized ? 'md:col-span-1' : 'md:col-span-1'}`}>
          <Card className="shadow-lg h-full flex flex-col max-h-[calc(100vh-12rem)] sm:max-h-[calc(100vh-10rem)]">
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
              <CardTitle className="text-lg font-semibold">Chat ao Vivo</CardTitle>
              <div className="flex items-center text-sm text-muted-foreground">
                {isStreamEnded ? (
                    <span className="text-xs font-semibold text-destructive mr-2">OFFLINE</span>
                ) : onlineViewers !== null && (
                    <>
                        <UsersIcon className="h-4 w-4 mr-1.5"/>
                        <span>{onlineViewers.toLocaleString('pt-BR')}</span>
                    </>
                )}
                 <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsChatMaximized(!isChatMaximized)}
                    className="ml-2 text-muted-foreground hover:text-primary"
                    title={isChatMaximized ? "Minimizar Chat" : "Maximizar Chat"}
                  >
                    {isChatMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                  </Button>
                <div className="flex items-center space-x-2 ml-2">
                    <Switch
                        id="enable-auto-scroll"
                        checked={enableAutoScroll}
                        onCheckedChange={(checked) => {
                            setEnableAutoScroll(Boolean(checked)); // Ensure boolean
                            if (Boolean(checked) && !isAtBottom) {
                                scrollToBottom('smooth');
                                setNewUnreadMessages(0);
                            } else if (!Boolean(checked)) {
                                setNewUnreadMessages(0); 
                            }
                        }}
                        aria-label="Rolagem automática"
                    />
                    <Label htmlFor="enable-auto-scroll" className="text-xs cursor-pointer">Rolagem Auto.</Label>
                </div>
                <div className="flex items-center space-x-2 ml-2">
                    <Switch
                        id="show-raw-data"
                        checked={showRawData}
                        onCheckedChange={(checked) => setShowRawData(Boolean(checked))}
                        aria-label="Mostrar dados brutos"
                    />
                    <Label htmlFor="show-raw-data" className="text-xs cursor-pointer">Dados Brutos</Label>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-grow p-0 min-h-0 relative">
              <ScrollArea ref={scrollAreaRef} className="h-full chat-scroll-area">
                <div className="p-4 space-y-4">
                  {chatMessages.map((item) => (
                    <div key={item.id} className="pb-2 border-b last:border-b-0">
                      {item.displayFormatted && (
                        <div className="flex items-start space-x-3">
                          <Avatar className="h-8 w-8 border">
                            {item.avatar ? (
                                <AvatarImage src={item.avatar} alt={item.user} data-ai-hint="user avatar" />
                            ) : null}
                            <AvatarFallback>{item.user ? item.user.substring(0,1).toUpperCase() : 'S'}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center space-x-1">
                              {item.userMedalUrl && (
                                <Image
                                  src={item.userMedalUrl}
                                  alt="Medalha"
                                  width={16}
                                  height={16}
                                  className="h-4 w-auto mr-0.5 align-middle"
                                  data-ai-hint="user medal"
                                />
                              )}
                              <span className={cn(
                                "text-sm font-semibold",
                                item.gender === 1 ? "text-primary" : 
                                item.gender === 2 ? "text-pink-500" : "text-primary" 
                              )}>
                                {item.user}
                              </span>
                              <span className="text-xs text-muted-foreground">{item.timestamp}</span>
                            </div>
                            <p className="text-sm text-foreground/90 break-all">{item.message}</p>
                          </div>
                        </div>
                      )}
                      {showRawData && item.rawData && (
                        <pre className="mt-1 text-xs bg-muted/40 p-2 rounded-md overflow-x-auto border border-border">
                          {(() => {
                            try {
                              return JSON.stringify(JSON.parse(item.rawData), null, 2);
                            } catch (e) {
                              return item.rawData; 
                            }
                          })()}
                        </pre>
                      )}
                      {!item.displayFormatted && !showRawData && null}
                    </div>
                  ))}
                </div>
              </ScrollArea>
              {enableAutoScroll && !isAtBottom && newUnreadMessages > 0 && !isStreamEnded && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => scrollToBottom('smooth')}
                        className="rounded-full shadow-md bg-primary/80 text-primary-foreground hover:bg-primary"
                    >
                        <ArrowDownCircle className="h-4 w-4 mr-2" />
                        {newUnreadMessages} Nova(s)
                    </Button>
                </div>
              )}
            </CardContent>
            <div className="p-4 border-t">
              <div className="flex space-x-2">
                <Input
                  placeholder={isStreamEnded ? "Transmissão encerrada" : "Diga algo..."}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-grow"
                  disabled={!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN || isStreamEnded || !newMessage.trim()}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN || !newMessage.trim() || isStreamEnded}
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
