
"use client";

import ProtectedPage from "@/components/auth/protected-page";
import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Search, Send, MessageSquare, Users, Check, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConversationPreview, AppMessage } from "@/types";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";


// Placeholder Data
const placeholderConversations: ConversationPreview[] = [
  { id: "convo1", userId: "user2", userName: "Alice Wonderland", userAvatar: "https://placehold.co/40x40.png?text=AW", lastMessage: "E aí, como você está? Faz tempo que não nos vemos!", lastMessageTime: "10:30", unreadCount: 2, isOnline: true, isPinned: true },
  { id: "convo2", userId: "user3", userName: "Bob O Construtor", userAvatar: "https://placehold.co/40x40.png?text=BB", lastMessage: "Podemos construir? Sim, nós podemos!", lastMessageTime: "Ontem", unreadCount: 0, isOnline: false },
  { id: "convo3", userId: "user4", userName: "Charlie Brown", userAvatar: "https://placehold.co/40x40.png?text=CB", lastMessage: "Meu Deus! Preciso de um conselho.", lastMessageTime: "Seg", unreadCount: 5, isOnline: true },
  { id: "convo4", userId: "user5", userName: "Diana Prince", userAvatar: "https://placehold.co/40x40.png?text=DP", lastMessage: "Querendo saber se você está livre para uma missão.", lastMessageTime: "12/05/2024", isOnline: false },
  { id: "convo5", userId: "user6", userName: "Edward Mãos de Tesoura", userAvatar: "https://placehold.co/40x40.png?text=ES", lastMessage: "Você poderia me ajudar com minha cerca viva?", lastMessageTime: "10/05/2024", isOnline: false },
];

const placeholderMessages: AppMessage[] = [
  { id: "msg1", conversationId: "convo1", senderId: "user2", senderName: "Alice Wonderland", senderAvatar: "https://placehold.co/40x40.png?text=AW", text: "E aí, como você está? Faz tempo que não nos vemos!", timestamp: "10:30", status: 'read' },
  { id: "msg2", conversationId: "convo1", senderId: "currentUser", senderName: "Você", senderAvatar: "https://placehold.co/40x40.png?text=ME", text: "Oi Alice! Estou ótimo, obrigado por perguntar. E você?", timestamp: "10:32", status: 'read' },
  { id: "msg3", conversationId: "convo1", senderId: "user2", senderName: "Alice Wonderland", senderAvatar: "https://placehold.co/40x40.png?text=AW", text: "Muito bem! Apenas ocupada com um novo projeto.", timestamp: "10:33", status: 'read'},
  { id: "msg-curr-1", conversationId: "convo1", senderId: "currentUser", senderName: "Você", senderAvatar: "https://placehold.co/40x40.png?text=ME", text: "Que legal! Sobre o que é?", timestamp: "10:35", status: 'delivered' },
  { id: "msg-curr-2", conversationId: "convo1", senderId: "currentUser", senderName: "Você", senderAvatar: "https://placehold.co/40x40.png?text=ME", text: "Me conte mais quando puder.", timestamp: "10:36", status: 'sent' },
  { id: "msg4", conversationId: "convo2", senderId: "user3", senderName: "Bob O Construtor", senderAvatar: "https://placehold.co/40x40.png?text=BB", text: "Podemos construir? Sim, nós podemos!", timestamp: "Ontem" },
  { id: "msg5", conversationId: "convo3", senderId: "user4", senderName: "Charlie Brown", senderAvatar: "https://placehold.co/40x40.png?text=CB", text: "Meu Deus! Preciso de um conselho.", timestamp: "Seg" },
  { id: "msg6", conversationId: "convo3", senderId: "currentUser", senderName: "Você", senderAvatar: "https://placehold.co/40x40.png?text=ME", text: "Claro Charlie, o que foi?", timestamp: "Seg", status: 'read' },
];


export default function MessagesPage() {
  const { currentUser } = useAuth();
  const [conversations, setConversations] = useState<ConversationPreview[]>(placeholderConversations);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(placeholderConversations[0]?.id || null);
  const [messages, setMessages] = useState<AppMessage[]>(placeholderMessages);
  const [searchTerm, setSearchTerm] = useState("");
  const [newMessage, setNewMessage] = useState("");

  const currentUserId = currentUser?.uid || "currentUser"; // Fallback for placeholder

  const filteredConversations = useMemo(() => {
    if (!searchTerm) return conversations;
    return conversations.filter(convo =>
      convo.userName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [conversations, searchTerm]);

  const activeMessages = useMemo(() => {
    if (!selectedConversationId) return [];
    return messages
      .filter(msg => msg.conversationId === selectedConversationId)
      .map(msg => ({ ...msg, isCurrentUser: msg.senderId === currentUserId }))
      .sort((a,b) => {
         const timeA = a.timestamp.split(':').map(Number);
         const timeB = b.timestamp.split(':').map(Number);
         if (timeA.length === 2 && timeB.length === 2) {
           if (timeA[0] !== timeB[0]) return timeA[0] - timeB[0];
           return timeA[1] - timeB[1];
         }
         return 0; 
      });
  }, [messages, selectedConversationId, currentUserId]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversationId) return;
    const msgId = `msg${Date.now()}`;
    const newMsg: AppMessage = {
      id: msgId,
      conversationId: selectedConversationId,
      senderId: currentUserId,
      senderName: currentUser?.profileName || "Você",
      senderAvatar: currentUser?.photoURL || "https://placehold.co/40x40.png?text=ME",
      text: newMessage.trim(),
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      isCurrentUser: true,
      status: 'sent', // Initial status for sent messages
    };
    setMessages(prev => [...prev, newMsg]);
    setNewMessage("");

    setConversations(prevConvos => prevConvos.map(c => 
        c.id === selectedConversationId 
        ? {...c, lastMessage: newMessage.trim(), lastMessageTime: newMsg.timestamp, unreadCount: 0} 
        : c
    ).sort((a, b) => { 
        if (a.id === selectedConversationId) return -1;
        if (b.id === selectedConversationId) return 1;
        return 0;
    }));
  };
  
  const getInitials = (name: string) => {
    if (!name) return "?";
    const nameParts = name.split(' ');
    if (nameParts.length > 1 && nameParts[0] && nameParts[1]) {
      return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };


  if (!currentUser) {
    return <ProtectedPage><div className="flex justify-center items-center h-full">Carregando...</div></ProtectedPage>;
  }
  
  const selectedConversation = conversations.find(c => c.id === selectedConversationId);


  return (
    <ProtectedPage>
      <div className="h-full flex flex-col">
        <div className="flex-grow flex overflow-hidden">
          {/* Left Pane: Conversation List */}
          <div className="w-full md:w-1/3 lg:w-1/4 border-r border-border flex flex-col bg-card">
            <div className="p-4 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar conversas..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <ScrollArea className="flex-grow">
              {filteredConversations.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">Nenhuma conversa encontrada.</div>
              ) : (
                filteredConversations.map((convo) => (
                  <button
                    key={convo.id}
                    className={cn(
                      "w-full text-left p-4 flex items-start space-x-3 hover:bg-muted/50 transition-colors border-b border-border last:border-b-0",
                      selectedConversationId === convo.id && "bg-muted"
                    )}
                    onClick={() => {
                        setSelectedConversationId(convo.id);
                        setConversations(prevConvos => prevConvos.map(c => 
                            c.id === convo.id ? {...c, unreadCount: 0} : c
                        ));
                    }}
                  >
                    <div className="relative shrink-0">
                      <Avatar className="h-10 w-10 border">
                        <AvatarImage src={convo.userAvatar} alt={convo.userName} data-ai-hint="user avatar" />
                        <AvatarFallback>{getInitials(convo.userName)}</AvatarFallback>
                      </Avatar>
                      {convo.isOnline && (
                        <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 ring-2 ring-card" title="Online" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-sm truncate pr-2">{convo.userName}</h3>
                        <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">{convo.lastMessageTime}</span>
                      </div>
                      <div className="flex justify-between items-center mt-0.5">
                        <p className="text-xs text-muted-foreground truncate pr-2">{convo.lastMessage}</p>
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
            {selectedConversationId && selectedConversation ? (
              <>
                <div className="p-4 border-b border-border bg-card">
                    <div className="flex items-center space-x-3">
                        <div className="relative shrink-0">
                          <Avatar className="h-10 w-10 border">
                              <AvatarImage src={selectedConversation.userAvatar} alt={selectedConversation.userName} data-ai-hint="user avatar chat" />
                              <AvatarFallback>{getInitials(selectedConversation.userName)}</AvatarFallback>
                          </Avatar>
                           {selectedConversation.isOnline && (
                            <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 ring-2 ring-card" title="Online" />
                          )}
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold">{selectedConversation.userName}</h2>
                            <p className="text-xs text-muted-foreground">{selectedConversation.isOnline ? "Online" : "Offline"}</p>
                        </div>
                    </div>
                </div>
                <ScrollArea className="flex-grow p-4 space-y-4">
                  {activeMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex items-end max-w-xl gap-2", 
                        msg.isCurrentUser ? "ml-auto flex-row-reverse" : "mr-auto flex-row"
                      )}
                    >
                       <Avatar className="h-8 w-8 border self-start shrink-0">
                          <AvatarImage src={msg.senderAvatar} alt={msg.senderName} data-ai-hint={msg.isCurrentUser ? "my avatar" : "sender avatar"} />
                          <AvatarFallback>{getInitials(msg.senderName)}</AvatarFallback>
                        </Avatar>
                      <div
                        className={cn(
                          "p-3 rounded-xl shadow-sm",
                          msg.isCurrentUser
                            ? "bg-primary text-primary-foreground rounded-br-none"
                            : "bg-card border border-border text-card-foreground rounded-bl-none"
                        )}
                      >
                        {!msg.isCurrentUser && <p className="text-xs font-semibold mb-0.5 text-primary">{msg.senderName}</p>}
                        <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
                        <div className="flex items-center justify-end mt-1.5 gap-1">
                          <p className={cn(
                              "text-xs",
                              msg.isCurrentUser ? "text-primary-foreground/70" : "text-muted-foreground"
                          )}>{msg.timestamp}</p>
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
                  ))}
                </ScrollArea>
                <div className="p-4 border-t border-border bg-card">
                  <div className="flex items-center space-x-2">
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
                      className="flex-1 resize-none min-h-[40px] max-h-[120px]"
                    />
                    <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                      <Send className="h-4 w-4" />
                      <span className="sr-only">Enviar</span>
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <MessageSquare className="h-16 w-16 text-muted-foreground mb-4" />
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

