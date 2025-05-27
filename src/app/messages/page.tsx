
"use client";

import ProtectedPage from "@/components/auth/protected-page";
import React, { useState, useEffect, useMemo, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Search, Send, MessageSquare, Check, CheckCheck, Smile, Paperclip, MoreVertical, UserCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConversationPreview, AppMessage, FirestoreConversation } from "@/types";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { db, collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, updateDoc, doc, Timestamp } from "@/lib/firebase";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";

const placeholderConversations: ConversationPreview[] = [
  { id: "convo1", userId: "user2", userName: "Alice Wonderland", userAvatar: "https://placehold.co/40x40.png", lastMessage: "E aí, como você está?", lastMessageTime: "10:30", unreadCount: 2, isOnline: true, isPinned: true },
  { id: "convo2", userId: "user3", userName: "Bob O Construtor", userAvatar: "https://placehold.co/40x40.png", lastMessage: "Podemos construir? Sim!", lastMessageTime: "Ontem", isOnline: false },
  { id: "convo3", userId: "user4", userName: "Charlie Brown", userAvatar: "https://placehold.co/40x40.png", lastMessage: "Meu Deus! Preciso de um conselho.", lastMessageTime: "Seg", unreadCount: 5, isOnline: true },
];

const placeholderMessages: AppMessage[] = [
  { id: "msg1", conversationId: "convo1", senderId: "user2", senderName: "Alice Wonderland", text: "E aí, como você está? Faz tempo que não nos vemos!", timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), status: 'read' },
  { id: "msg2", conversationId: "convo1", senderId: "currentUser", senderName: "Você", text: "Oi Alice! Estou ótimo, obrigado por perguntar. E você?", timestamp: new Date(Date.now() - 1000 * 60 * 3).toISOString(), status: 'read' },
  { id: "msg3", conversationId: "convo1", senderId: "user2", senderName: "Alice Wonderland", text: "Muito bem! Apenas ocupada com um novo projeto.", timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(), status: 'read'},
  { id: "msg-curr-1", conversationId: "convo1", senderId: "currentUser", senderName: "Você", text: "Que legal! Sobre o que é?", timestamp: new Date(Date.now() - 1000 * 60 * 1).toISOString(), status: 'delivered' },
  { id: "msg-curr-2", conversationId: "convo1", senderId: "currentUser", senderName: "Você", text: "Me conte mais quando puder.", timestamp: new Date().toISOString(), status: 'sent' },
];


export default function MessagesPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ConversationPreview | null>(null);
  const [messages, setMessages] = useState<AppMessage[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const currentUserId = currentUser?.uid;

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    if (!currentUserId) return;

    setIsLoadingConversations(true);
    const conversationsRef = collection(db, "conversations");
    const q = query(
      conversationsRef,
      where("participants", "array-contains", currentUserId),
      orderBy("updatedAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedConversations: ConversationPreview[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data() as FirestoreConversation;
        const otherParticipantId = data.participants.find(p => p !== currentUserId);
        const otherParticipantInfo = otherParticipantId ? data.participantInfo[otherParticipantId] : null;

        fetchedConversations.push({
          id: docSnap.id,
          userId: otherParticipantId || "unknown",
          userName: otherParticipantInfo?.name || "Usuário Desconhecido",
          userAvatar: otherParticipantInfo?.avatar,
          lastMessage: data.lastMessageText || "",
          lastMessageTime: data.lastMessageTimestamp instanceof Timestamp 
            ? formatDistanceToNow(data.lastMessageTimestamp.toDate(), { addSuffix: true, locale: ptBR })
            : "Agora",
          unreadCount: data.unreadCounts?.[currentUserId] || 0,
          isOnline: Math.random() > 0.5, // Placeholder
          isPinned: Math.random() > 0.2, // Placeholder
        });
      });
      setConversations(fetchedConversations);
      if (fetchedConversations.length > 0 && !selectedConversation) {
        setSelectedConversation(fetchedConversations[0]);
      }
      setIsLoadingConversations(false);
    }, (error) => {
      console.error("Error fetching conversations: ", error);
      setIsLoadingConversations(false);
    });

    return () => unsubscribe();
  }, [currentUserId, selectedConversation]);


  useEffect(() => {
    if (!selectedConversation?.id) {
      setMessages([]);
      return;
    }
    setIsLoadingMessages(true);
    const messagesRef = collection(db, "conversations", selectedConversation.id, "messages");
    const qMessages = query(messagesRef, orderBy("timestamp", "asc"));

    const unsubscribeMessages = onSnapshot(qMessages, (querySnapshot) => {
      const fetchedMessages: AppMessage[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data() as FirestoreMessage;
        fetchedMessages.push({
          id: docSnap.id,
          conversationId: selectedConversation.id,
          senderId: data.senderId,
          senderName: data.senderId === currentUserId ? (currentUser?.profileName || "Você") : (selectedConversation.userName || "Outro"),
          senderAvatar: data.senderId === currentUserId ? currentUser?.photoURL : selectedConversation.userAvatar,
          text: data.text,
          timestamp: data.timestamp, // Keep as Firestore Timestamp or Date
          isCurrentUser: data.senderId === currentUserId,
          status: data.status,
        });
      });
      setMessages(fetchedMessages);
      setIsLoadingMessages(false);
    }, (error) => {
      console.error("Error fetching messages: ", error);
      setIsLoadingMessages(false);
    });
    
    return () => unsubscribeMessages();
  }, [selectedConversation, currentUserId, currentUser?.profileName, currentUser?.photoURL]);


  const filteredConversations = useMemo(() => {
    if (!searchTerm) return conversations.sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0)); // Pinned first
    return conversations
      .filter(convo => convo.userName.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));
  }, [conversations, searchTerm]);


  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation?.id || !currentUserId) return;

    const messagesRef = collection(db, "conversations", selectedConversation.id, "messages");
    const conversationDocRef = doc(db, "conversations", selectedConversation.id);

    try {
      await addDoc(messagesRef, {
        senderId: currentUserId,
        text: newMessage.trim(),
        timestamp: serverTimestamp(),
        status: 'sent',
      } as FirestoreMessage);

      await updateDoc(conversationDocRef, {
        lastMessageText: newMessage.trim(),
        lastMessageTimestamp: serverTimestamp(),
        lastMessageSenderId: currentUserId,
        updatedAt: serverTimestamp(),
        [`unreadCounts.${selectedConversation.userId}`]: (selectedConversation.unreadCount || 0) + 1 // Increment for the other user
      });

      setNewMessage("");
    } catch (error) {
      console.error("Error sending message: ", error);
      // Add toast error
    }
  };
  
  const getInitials = (name: string) => {
    if (!name) return "?";
    const nameParts = name.split(' ');
    if (nameParts.length > 1 && nameParts[0] && nameParts[1]) {
      return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const formatMessageTimestamp = (timestamp: any): string => {
    if (!timestamp) return "";
    if (timestamp instanceof Timestamp) {
      return format(timestamp.toDate(), "HH:mm");
    }
    // Fallback for string timestamps or other types, adjust as needed
    try {
      return format(new Date(timestamp), "HH:mm")
    } catch {
      return "agora";
    }
  };


  if (authLoading) {
    return <div className="flex-grow flex justify-center items-center h-full"><LoadingSpinner size="lg"/></div>;
  }
  if (!currentUser) {
    // ProtectedPage should handle this, but as a fallback:
    return <ProtectedPage><div className="flex justify-center items-center h-full">Por favor, faça login para ver as mensagens.</div></ProtectedPage>;
  }
  

  return (
    <ProtectedPage>
      <div className="h-full flex flex-col">
        <div className="flex-grow flex overflow-hidden">
          {/* Left Pane: Conversation List */}
          <div className="w-full md:w-[320px] lg:w-[360px] border-r border-border flex flex-col bg-card">
            <div className="p-4 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar conversas..."
                  className="pl-10 h-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <ScrollArea className="flex-grow">
              {isLoadingConversations ? (
                <div className="p-4 text-center text-muted-foreground"><LoadingSpinner/> Carregando conversas...</div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">Nenhuma conversa encontrada.</div>
              ) : (
                filteredConversations.map((convo) => (
                  <button
                    key={convo.id}
                    className={cn(
                      "w-full text-left p-3 flex items-start space-x-3 hover:bg-muted/50 transition-colors border-b border-border last:border-b-0",
                      selectedConversation?.id === convo.id && "bg-muted"
                    )}
                    onClick={() => {
                        setSelectedConversation(convo);
                        // Logic to mark as read can be added here or when messages are fetched
                    }}
                  >
                    <div className="relative shrink-0">
                      <Avatar className="h-10 w-10 border">
                        <AvatarImage src={convo.userAvatar || undefined} alt={convo.userName} data-ai-hint="user avatar" />
                        <AvatarFallback>{getInitials(convo.userName)}</AvatarFallback>
                      </Avatar>
                      {convo.isOnline && (
                        <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 ring-1 ring-card" title="Online" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-sm truncate pr-2">{convo.userName}</h3>
                        <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">{convo.lastMessageTime}</span>
                      </div>
                      <div className="flex justify-between items-center mt-0.5">
                        <p className="flex-1 text-xs text-muted-foreground truncate min-w-0 pr-2">{convo.lastMessage}</p>
                        {convo.unreadCount && convo.unreadCount > 0 && (
                          <Badge variant="destructive" className="text-xs px-1.5 py-0.5 rounded-full shrink-0">{convo.unreadCount}</Badge>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </ScrollArea>
          </div>

          {/* Right Pane: Message View */}
          <div className="flex-1 flex flex-col bg-background">
            {selectedConversation ? (
              <>
                <div className="p-3 border-b border-border bg-card flex items-center justify-between shadow-sm">
                    <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10 border">
                            <AvatarImage src={selectedConversation.userAvatar || undefined} alt={selectedConversation.userName} data-ai-hint="chat partner avatar" />
                            <AvatarFallback>{getInitials(selectedConversation.userName)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <h2 className="text-base font-semibold">{selectedConversation.userName}</h2>
                            <p className="text-xs text-muted-foreground">{selectedConversation.isOnline ? "Online" : "Offline"}</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" className="text-muted-foreground">
                        <MoreVertical className="h-5 w-5" />
                    </Button>
                </div>
                <ScrollArea className="flex-grow p-4 space-y-2 bg-[url('https://placehold.co/1000x1000/E2E2E2/OCCCCCCC.png?text=')] bg-repeat bg-center"> {/* Replace with your actual chat background image if desired */}
                  {isLoadingMessages ? (
                     <div className="flex justify-center items-center h-full"><LoadingSpinner/> Carregando mensagens...</div>
                  ) : (
                    activeMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={cn(
                          "flex items-end max-w-[75%] sm:max-w-[60%] gap-2",
                          msg.isCurrentUser ? "ml-auto flex-row-reverse" : "mr-auto flex-row"
                        )}
                      >
                        {!msg.isCurrentUser && (
                          <Avatar className="h-7 w-7 border self-end shrink-0 hidden sm:flex">
                            <AvatarImage src={msg.senderAvatar || undefined} alt={msg.senderName} data-ai-hint={msg.isCurrentUser ? "my avatar" : "sender avatar"} />
                            <AvatarFallback>{getInitials(msg.senderName)}</AvatarFallback>
                          </Avatar>
                        )}
                        <div
                          className={cn(
                            "p-2.5 rounded-lg shadow-md text-sm",
                            msg.isCurrentUser
                              ? "bg-primary/90 text-primary-foreground rounded-br-none"
                              : "bg-card border border-border text-card-foreground rounded-bl-none"
                          )}
                        >
                          <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                          <div className={cn(
                            "flex items-center gap-1 mt-1",
                            msg.isCurrentUser ? "justify-end" : "justify-start"
                          )}>
                            <p className={cn(
                                "text-xs",
                                msg.isCurrentUser ? "text-primary-foreground/70" : "text-muted-foreground/80"
                            )}>{formatMessageTimestamp(msg.timestamp)}</p>
                            {msg.isCurrentUser && msg.status && (
                              <>
                                {msg.status === 'sent' && <Check className="h-4 w-4 text-primary-foreground/70" />}
                                {msg.status === 'delivered' && <CheckCheck className="h-4 w-4 text-primary-foreground/70" />}
                                {msg.status === 'read' && <CheckCheck className="h-4 w-4 text-sky-400" />}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </ScrollArea>
                <div className="flex items-center gap-2 p-3 border-t border-border bg-muted">
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary shrink-0">
                    <Smile className="h-5 w-5" />
                    <span className="sr-only">Adicionar emoji</span>
                  </Button>
                  <Textarea
                    placeholder="Digite sua mensagem..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    rows={1}
                    className="flex-1 resize-none min-h-[40px] max-h-[120px] border-0 bg-card focus-visible:ring-1 focus-visible:ring-primary shadow-sm rounded-lg px-3 py-2"
                  />
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary shrink-0">
                    <Paperclip className="h-5 w-5" />
                    <span className="sr-only">Anexar arquivo</span>
                  </Button>
                  <Button onClick={handleSendMessage} disabled={!newMessage.trim()} size="default" className="shrink-0 h-10 px-4 rounded-lg">
                    <Send className="h-4 w-4 mr-0 sm:mr-2" />
                    <span className="sr-only sm:not-sr-only">Enviar</span>
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-background">
                <MessageSquare className="h-16 w-16 text-muted-foreground/50 mb-4" />
                <h2 className="text-xl font-semibold text-foreground">Selecione uma conversa</h2>
                <p className="text-muted-foreground">Escolha alguém da lista para começar a conversar.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedPage>
  );
}

    