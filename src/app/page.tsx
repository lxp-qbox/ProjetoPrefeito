"use client";

import React, { useState, useEffect, useCallback, useMemo, Suspense, lazy } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Search, MoreHorizontal, ImagePlus, Video as VideoIcon, CalendarDays, FileText as FileTextIcon, Send, Sparkles, UserPlus, ListFilter, Tag, ThumbsUp, MessageSquare as MessageSquareIcon, Send as SendIconLucide, Smile, Paperclip, Gamepad2, Crown, PlayCircle, BarChart2, Bookmark, Settings as SettingsIcon, Home, UserCircle2, Users } from "lucide-react";
import type { FeedPost, Trend, SuggestedUser, UserProfile, SidebarNavItem, Hashtag } from "@/types";
import PostCard from "@/components/feed/post-card";
import PostCardSkeleton from "@/components/feed/post-card-skeleton";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { db, collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, Timestamp } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import Link from "next/link";
import { cn } from "@/lib/utils";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Lazy loading de componentes não críticos
const PremiumWidget = lazy(() => import("@/components/feed/premium-widget"));
const WhatsHappeningWidget = lazy(() => import("@/components/feed/whats-happening-widget"));
const WhoToFollowWidget = lazy(() => import("@/components/feed/who-to-follow-widget"));
const FooterLinksWidget = lazy(() => import("@/components/feed/footer-links-widget"));

const SearchWidget = () => (
  <div className="relative">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
    <Input
      type="search"
      placeholder="Buscar"
      className="pl-10 rounded-full bg-muted/60 border-transparent focus-visible:ring-1 focus-visible:ring-primary focus-visible:bg-card h-10 w-full"
      aria-label="Buscar no site"
    />
  </div>
);

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
  const { toast } = useToast();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMobileNavLabels, setShowMobileNavLabels] = useState(false);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);

  // Simulação para verificar mensagens não lidas
  useEffect(() => {
    // Aqui você poderia fazer uma consulta real para verificar mensagens não lidas
    // Por enquanto, apenas simulando com um valor fixo
    setHasUnreadMessages(true);
  }, []);

  useEffect(() => {
    // Fetch initial posts
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const postsRef = collection(db, "posts");
        const q = query(postsRef, orderBy("createdAt", "desc"));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const fetchedPosts: FeedPost[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            fetchedPosts.push({
              id: doc.id,
              ...data,
              userId: data.userId || "",
              user: data.user || { name: "Usuário Anônimo", handle: "@anon", avatarUrl: "" },
              content: data.content || "",
              timestamp: data.timestamp,
              stats: data.stats || { replies: 0, retweets: 0, likes: 0 },
              createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
            } as FeedPost);
          });
          setPosts(fetchedPosts);
          setLoading(false);
        });
        
        return unsubscribe;
      } catch (error) {
        console.error("Error fetching posts:", error);
        toast({
          title: "Erro ao carregar posts",
          description: "Não foi possível carregar os posts. Tente novamente mais tarde.",
          variant: "destructive",
        });
        setLoading(false);
        return () => {};
      }
    };
    
    const unsubscribe = fetchPosts();
    return () => {
      unsubscribe.then(unsub => unsub && unsub());
    };
  }, [toast]);

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
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-0 max-w-screen-xl mx-auto">
      {/* Desktop Left Sidebar - Hidden on mobile */}
      <aside className="hidden md:block md:col-span-1 p-4 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
        {/* Desktop left sidebar content */}
        <div className="space-y-6">
          <SearchWidget />
          <nav className="space-y-1">
            {/* Navigation items */}
          </nav>
        </div>
      </aside>

      {/* Main Content - Full width on mobile, narrower on desktop */}
      <main className="col-span-1 md:col-span-2 lg:col-span-2 border-x border-border min-h-screen">
        <div className="sticky top-0 z-10 backdrop-blur-md bg-background/90 border-b border-border p-4">
          <h1 className="text-xl font-bold">Página Inicial</h1>
        </div>

        <div className="pb-20">
          <CreatePostInput currentUser={currentUser} onPostSubmit={handlePostSubmit} />
          
          <div className="divide-y divide-border">
            {loading ? (
              // Mostrar esqueletos durante o carregamento
              Array(3).fill(0).map((_, i) => <PostCardSkeleton key={i} />)
            ) : posts.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-muted-foreground">Nenhum post encontrado. Seja o primeiro a postar!</p>
              </div>
            ) : (
              posts.map(post => <PostCard key={post.id} post={post} />)
            )}
          </div>
        </div>
      </main>

      {/* Right Sidebar - Hidden on mobile and small tablets */}
      <aside className="hidden lg:block lg:col-span-1 p-4 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
        <div className="space-y-6">
          {/* Right sidebar widgets */}
          <Suspense fallback={<div className="h-40"><LoadingSpinner size="md" message="Carregando widgets..." /></div>}>
            <PremiumWidget />
          </Suspense>
          
          <Suspense fallback={<div className="h-40"><LoadingSpinner size="md" /></div>}>
            <WhatsHappeningWidget />
          </Suspense>
          
          <Suspense fallback={<div className="h-40"><LoadingSpinner size="md" /></div>}>
            <WhoToFollowWidget />
          </Suspense>
          
          <Suspense fallback={<div className="h-10"></div>}>
            <FooterLinksWidget />
          </Suspense>
        </div>
      </aside>

      {/* Mobile Bottom Bar - Visible only on mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-20 bg-background border-t border-border px-6 py-2 md:hidden">
        <div className="flex justify-between items-center">
          <button 
            className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 p-2 bg-primary text-white rounded-full z-30"
            onClick={() => setShowMobileNavLabels(!showMobileNavLabels)}
            aria-label="Mostrar/ocultar legendas"
          >
            {showMobileNavLabels ? (
              <SettingsIcon className="h-5 w-5" />
            ) : (
              <Crown className="h-5 w-5" />
            )}
          </button>
          
          <div className="flex justify-between items-center w-full">
            <div className="flex flex-col items-center">
              <Link href="/" className="p-2 text-foreground hover:bg-muted rounded-full flex items-center justify-center">
                <Home className="h-6 w-6" />
              </Link>
              {showMobileNavLabels && (
                <span className="text-xs mt-1 text-muted-foreground">Início</span>
              )}
            </div>
            
            <div className="flex flex-col items-center">
              <Link href="/hosts" className="p-2 text-foreground hover:bg-muted rounded-full flex items-center justify-center">
                <Users className="h-6 w-6" />
              </Link>
              {showMobileNavLabels && (
                <span className="text-xs mt-1 text-muted-foreground">Lives</span>
              )}
            </div>
            
            <div className="flex flex-col items-center">
              <Link href="/bingo" className="p-2 text-foreground hover:bg-muted rounded-full flex items-center justify-center">
                <Gamepad2 className="h-6 w-6" />
              </Link>
              {showMobileNavLabels && (
                <span className="text-xs mt-1 text-muted-foreground">Jogos</span>
              )}
            </div>
            
            <div className="flex flex-col items-center">
              <Link href="/messages" className="p-2 text-foreground hover:bg-muted rounded-full flex items-center justify-center relative">
                <MessageSquareIcon className="h-6 w-6" />
                {hasUnreadMessages && (
                  <span className="absolute h-2.5 w-2.5 rounded-full bg-green-500 -right-0.5 -top-0.5" />
                )}
              </Link>
              {showMobileNavLabels && (
                <span className="text-xs mt-1 text-muted-foreground">Mensagens</span>
              )}
            </div>
            
            <div className="flex flex-col items-center">
              <Link href="/profile" className="p-2 text-foreground hover:bg-muted rounded-full flex items-center justify-center">
                <UserCircle2 className="h-6 w-6" />
              </Link>
              {showMobileNavLabels && (
                <span className="text-xs mt-1 text-muted-foreground">Perfil</span>
              )}
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
}
