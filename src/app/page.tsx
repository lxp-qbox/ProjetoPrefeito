
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Search, MoreHorizontal, ImagePlus, Video as VideoIcon, CalendarDays, FileText as FileTextIcon, Send, Sparkles, UserPlus, ListFilter, Tag, ThumbsUp, MessageSquare as MessageSquareIcon, Send as SendIconLucide, Smile, Paperclip, Gamepad2, Crown, PlayCircle, BarChart2, Bookmark, Settings as SettingsIcon } from "lucide-react";
import type { FeedPost, Trend, SuggestedUser, UserProfile, SidebarNavItem, Hashtag } from "@/types";
import PostCard from "@/components/feed/post-card";
import PostCardSkeleton from "@/components/feed/post-card-skeleton";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { db, collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, Timestamp } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import Link from "next/link"; // Added import for Link
import { cn } from "@/lib/utils";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


const SearchWidget = () => (
  <div className="relative">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
    <Input
      type="search"
      placeholder="Buscar"
      className="pl-10 rounded-full bg-muted/60 border-transparent focus-visible:ring-1 focus-visible:ring-primary focus-visible:bg-card h-10 w-full"
    />
  </div>
);

const PremiumWidget = () => (
  <Card className="bg-muted border-none rounded-xl">
    <CardHeader className="p-4">
      <CardTitle className="text-xl font-bold">Assine o Premium</CardTitle>
    </CardHeader>
    <CardContent className="p-4 pt-0">
      <CardDescription className="text-sm mb-3">
        Assine para desbloquear novos recursos e, se elegível, receba uma parte da receita.
      </CardDescription>
      <Button size="sm" className="rounded-full font-semibold px-4 py-1.5 h-auto text-sm bg-primary text-primary-foreground hover:bg-primary/90">
        Experimente grátis
      </Button>
    </CardContent>
  </Card>
);

const WhatsHappeningWidget = () => {
  const trends: Trend[] = [
    { id: "t1", category: "Política · Assunto do Momento", topic: "Eleições 2026" },
    { id: "t2", category: "Futebol · Assunto do Momento", topic: "Final da Champions", posts: "35,8 mil posts" },
    { id: "t3", category: "Música · Assunto do Momento", topic: "Novo Álbum Anitta", posts: "102 mil posts" },
    { id: "t4", category: "Tecnologia", topic: "IA Generativa", posts: "22 mil posts" },
  ];
  return (
    <Card className="bg-muted border-none rounded-xl">
      <CardHeader className="p-4">
        <CardTitle className="text-xl font-bold">O que está acontecendo</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-0">
          {trends.map((trend) => (
            <div key={trend.id} className="px-4 py-3 hover:bg-card/50 transition-colors cursor-pointer border-b last:border-b-0 border-border/50">
              <div className="flex justify-between items-start">
                <p className="text-xs text-muted-foreground">{trend.category}</p>
                <Button variant="ghost" size="icon" className="h-7 w-7 -mr-2 -mt-1 text-muted-foreground hover:bg-primary/10 hover:text-primary rounded-full">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
              <p className="font-semibold text-sm text-foreground">{trend.topic}</p>
              {trend.posts && <p className="text-xs text-muted-foreground">{trend.posts}</p>}
            </div>
          ))}
        </div>
        <div className="p-4">
          <Button variant="link" className="p-0 text-sm text-primary hover:no-underline hover:text-primary/80">Mostrar mais</Button>
        </div>
      </CardContent>
    </Card>
  );
};

const WhoToFollowWidget = () => {
  const suggestions: SuggestedUser[] = [
    { id: "sugg1", name: "Lia Clark", handle: "@liaclark", avatarUrl: "https://placehold.co/40x40.png", dataAiHint: "singer pop" },
    { id: "sugg2", name: "SpaceX", handle: "@SpaceX", avatarUrl: "https://placehold.co/40x40.png", dataAiHint: "space logo" },
  ];
  return (
    <Card className="bg-muted border-none rounded-xl">
      <CardHeader className="p-4">
        <CardTitle className="text-xl font-bold">Quem seguir</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-0">
          {suggestions.map((user) => (
            <div key={user.id} className="flex items-center justify-between px-4 py-3 hover:bg-card/50 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.avatarUrl || undefined} alt={user.name} data-ai-hint={user.dataAiHint} />
                  <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-sm text-foreground hover:underline">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.handle}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="rounded-full bg-foreground text-background hover:bg-foreground/90 h-8 px-4 text-xs font-semibold">
                Seguir
              </Button>
            </div>
          ))}
        </div>
        <div className="p-4">
          <Button variant="link" className="p-0 text-sm text-primary hover:no-underline hover:text-primary/80">Mostrar mais</Button>
        </div>
      </CardContent>
    </Card>
  );
};

const FooterLinksWidget = () => {
  const footerLinks = [
    { name: "Termos de Serviço", href: "#" }, { name: "Política de Privacidade", href: "#" },
    { name: "Política de cookies", href: "#" }, { name: "Acessibilidade", href: "#" },
    { name: "Informações de anúncios", href: "#" }, { name: "Mais...", href: "#" },
  ];
  return (
    <div className="px-4 py-2 text-xs text-muted-foreground">
      <div className="flex flex-wrap gap-x-2 gap-y-1">
        {footerLinks.map((link) => (
          <Link key={link.name} href={link.href} className="hover:underline">
            {link.name}
          </Link>
        ))}
        <span>© {new Date().getFullYear()} The Presidential Agency.</span>
      </div>
    </div>
  );
};


const CreatePostInput = ({ currentUser, onPostSubmit }: { currentUser: UserProfile | null, onPostSubmit: (text: string) => Promise<void> }) => {
  const [text, setText] = useState("");
  const [isPosting, setIsPosting] = useState(false);

  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    const nameParts = name.split(' ');
    if (nameParts.length > 1 && nameParts[0] && nameParts[1]) {
      return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleSubmit = async () => {
    if (!text.trim() || !currentUser) return;
    setIsPosting(true);
    await onPostSubmit(text.trim());
    setText("");
    setIsPosting(false);
  };

  const actionButtons = [
    { icon: ImagePlus, label: "Foto", action: () => console.log("Add Photo") },
    { icon: VideoIcon, label: "Vídeo", action: () => console.log("Add Video") },
    { icon: CalendarDays, label: "Evento", action: () => console.log("Add Event") },
    { icon: FileTextIcon, label: "Artigo", action: () => console.log("Write Article") },
  ];

  return (
    <Card className="mb-0 shadow-none rounded-none border-x-0 border-t-0 shrink-0">
      <CardContent className="p-4">
        <div className="flex space-x-3">
          <Avatar className="h-12 w-12 border">
            <AvatarImage src={currentUser?.photoURL || undefined} alt={currentUser?.profileName || "Usuário"} data-ai-hint="user avatar" />
            <AvatarFallback>{getInitials(currentUser?.profileName || currentUser?.email)}</AvatarFallback>
          </Avatar>
          <Textarea
            placeholder="No que você está pensando?"
            className="flex-1 resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-lg p-2 min-h-[80px]"
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={!currentUser || isPosting}
          />
        </div>
        <div className="mt-3 flex justify-between items-center">
          <div className="flex space-x-1 text-primary">
            <TooltipProvider>
              {actionButtons.map(btn => (
                <Tooltip key={btn.label}>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="hover:bg-primary/10 h-9 w-9" onClick={btn.action} disabled={!currentUser || isPosting}>
                      <btn.icon className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>{btn.label}</p></TooltipContent>
                </Tooltip>
              ))}
            </TooltipProvider>
          </div>
          <Button
            onClick={handleSubmit}
            disabled={!text.trim() || !currentUser || isPosting}
            size="sm"
            className="rounded-full font-semibold px-5"
          >
            {isPosting ? <LoadingSpinner size="sm" className="mr-2" /> : <Send className="h-4 w-4 sm:mr-2" />}
            <span className="hidden sm:inline">Enviar</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};


export default function HomePage() {
  const { currentUser } = useAuth();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const { toast } = useToast();

  const fetchPosts = useCallback(async () => {
    setIsLoadingPosts(true);
    try {
      const postsCollection = collection(db, "posts");
      const q = query(postsCollection, orderBy("timestamp", "desc"));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedPosts: FeedPost[] = snapshot.docs.map(docSnap => {
          const data = docSnap.data();
          let formattedTimestamp = "data inválida";
          if (data.timestamp && typeof data.timestamp.toDate === 'function') {
            try {
              formattedTimestamp = formatDistanceToNow(data.timestamp.toDate(), { addSuffix: true, locale: ptBR });
            } catch (e) {
              console.error("Error formatting date:", e, data.timestamp);
            }
          } else if (data.timestamp) {
             formattedTimestamp = String(data.timestamp); 
          }
          return {
            id: docSnap.id,
            userId: data.userId,
            user: data.user || { name: "Usuário Desconhecido", handle: "@desconhecido", avatarUrl: undefined, dataAiHint: "user avatar" },
            postTitle: data.postTitle,
            content: data.content,
            timestamp: formattedTimestamp,
            imageUrl: data.imageUrl,
            imageAiHint: data.imageAiHint,
            stats: data.stats || { replies: 0, retweets: 0, likes: 0 },
          } as FeedPost;
        });
        setPosts(fetchedPosts);
        setIsLoadingPosts(false);
      }, (error) => {
        console.error("Erro ao carregar posts em tempo real:", error);
        toast({ title: "Erro ao Carregar Feed", description: error.message, variant: "destructive" });
        setIsLoadingPosts(false);
      });
      return unsubscribe; // Return the unsubscribe function for cleanup
    } catch (error: any) {
        console.error("Erro ao configurar listener de posts:", error);
        toast({ title: "Erro de Configuração do Feed", description: error.message, variant: "destructive" });
        setIsLoadingPosts(false);
        return () => {}; // Return an empty cleanup function on initial setup error
    }
  }, [toast]);

  useEffect(() => {
    const unsubscribe = fetchPosts();
    return () => {
      unsubscribe.then(unsub => unsub()).catch(err => console.error("Error unsubscribing from posts:", err));
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchPosts]);

  const handlePostSubmit = async (text: string) => {
    if (!currentUser) {
      toast({ title: "Não autenticado", description: "Você precisa estar logado para postar.", variant: "destructive" });
      return;
    }
    try {
      const newPostData = {
        content: text.trim(),
        timestamp: serverTimestamp(),
        userId: currentUser.uid,
        user: {
          name: currentUser.profileName || currentUser.displayName || "Usuário Anônimo",
          handle: `@${currentUser.email?.split('@')[0] || currentUser.uid.substring(0,6)}`,
          avatarUrl: currentUser.photoURL || undefined,
          dataAiHint: "user avatar"
        },
        stats: { replies: 0, retweets: 0, likes: 0 },
      };
      await addDoc(collection(db, "posts"), newPostData);
      toast({ title: "Post Enviado!", description: "Seu post foi publicado." });
      // No explicit fetchPosts() needed here due to onSnapshot
    } catch (error: any) {
      console.error("Error creating post:", error);
      toast({ title: "Erro ao Postar", description: error.message, variant: "destructive" });
    }
  };
  
  const filteredFollowingPosts = useMemo(() => {
    if (!currentUser?.followingIds) return [];
    return posts.filter(post => currentUser.followingIds!.includes(post.userId || ""));
  }, [posts, currentUser?.followingIds]);

  return (
    <div className="flex justify-center w-full flex-grow">
      <div className="flex w-full max-w-screen-xl flex-grow overflow-hidden">
        
        {/* Central Feed Column */}
        <div className="w-full lg:w-[600px] border-r border-l border-border flex flex-col h-full">
          <div className="shrink-0">
            <CreatePostInput currentUser={currentUser} onPostSubmit={handlePostSubmit} />
          </div>
          
          <Tabs defaultValue="for-you" className="w-full flex-grow flex flex-col overflow-hidden">
             <TabsList className="grid w-full grid-cols-2 h-auto p-0 rounded-none bg-card shrink-0 sticky top-0 z-10 border-b border-border">
              <TabsTrigger
                value="for-you"
                className="py-4 text-sm font-semibold text-muted-foreground data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
              >
                Pra Você
              </TabsTrigger>
              <TabsTrigger
                value="following"
                className="py-4 text-sm font-semibold text-muted-foreground data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
              >
                Seguindo
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="for-you" className="mt-0 flex-grow overflow-y-auto">
              {isLoadingPosts ? (
                 <div className="p-4 flex-grow flex flex-col items-center justify-start"> 
                    <PostCardSkeleton />
                    <PostCardSkeleton />
                    <PostCardSkeleton />
                 </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground p-6">
                    <Sparkles className="mx-auto h-12 w-12 mb-3" />
                    <h3 className="text-lg font-semibold">Nenhum post por aqui ainda.</h3>
                    <p className="text-sm">Que tal criar o primeiro?</p>
                </div>
              ) : (
                <div className="space-y-0">
                  {posts.map((post) => ( <PostCard key={post.id} post={post} /> ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="following" className="mt-0 flex-grow overflow-y-auto">
              {isLoadingPosts ? (
                <div className="p-4 flex-grow flex flex-col items-center justify-start"> 
                    <PostCardSkeleton />
                    <PostCardSkeleton />
                    <PostCardSkeleton />
                 </div>
              ) : (!currentUser?.followingIds || currentUser.followingIds.length === 0) ? (
                <div className="text-center py-12 text-muted-foreground p-6">
                    <UserPlus className="mx-auto h-12 w-12 mb-3" />
                    <h3 className="text-lg font-semibold">Você ainda não segue ninguém.</h3>
                    <p className="text-sm">Posts de contas que você segue aparecerão aqui.</p>
                </div>
              ) : filteredFollowingPosts.length === 0 ? (
                 <div className="text-center py-12 text-muted-foreground p-6">
                    <MessageSquareIcon className="mx-auto h-12 w-12 mb-3" />
                    <h3 className="text-lg font-semibold">Nenhuma novidade por enquanto.</h3>
                    <p className="text-sm">Os posts das contas que você segue aparecerão aqui.</p>
                </div>
              ) : (
                <div className="space-y-0">
                  {filteredFollowingPosts.map((post) => ( <PostCard key={post.id} post={post} /> ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Sidebar */}
        <aside className="hidden lg:flex flex-col w-[350px] pl-6 py-3 h-full"> 
          <div className="shrink-0 pb-3 sticky top-0 bg-background z-10"> 
            <SearchWidget />
          </div>
          <div className="flex-grow overflow-y-auto space-y-5 pr-4"> 
            <PremiumWidget />
            <WhatsHappeningWidget />
            <WhoToFollowWidget />
            <FooterLinksWidget />
          </div>
        </aside>
      </div>
    </div>
  );
}
