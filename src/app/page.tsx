
"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ImagePlus, ListChecks, Smile, MapPin } from "lucide-react"; 
import type { FeedPost } from "@/types";
import PostCard from "@/components/feed/post-card";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Import sidebar widgets
import { SearchWidget } from "@/components/feed/SearchWidget";
import { PremiumSignupWidget } from "@/components/feed/PremiumSignupWidget";
import { WhatsHappeningWidget } from "@/components/feed/WhatsHappeningWidget";
import { WhoToFollowWidget } from "@/components/feed/WhoToFollowWidget";
import { FooterLinksWidget } from "@/components/feed/FooterLinksWidget";

const placeholderPosts: FeedPost[] = [
  {
    id: "1",
    user: {
      name: "Elon Musk",
      handle: "@elonmusk",
      avatarUrl: "https://placehold.co/48x48.png",
      dataAiHint: "man tech",
    },
    content: "Doge to the moon! 🚀",
    timestamp: "2h",
    imageUrl: "https://placehold.co/600x400.png",
    imageAiHint: "rocket moon",
    stats: { replies: 1200, retweets: 3500, likes: 75000 },
  },
  {
    id: "2",
    user: {
      name: "Ada Lovelace",
      handle: "@adalovelace",
      avatarUrl: "https://placehold.co/48x48.png",
      dataAiHint: "woman portrait",
    },
    content: "Just published my notes on the Analytical Engine. I believe it could be used to compose complex music, to produce graphics, and for both scientific and practical use. #programming #history",
    timestamp: "1d",
    stats: { replies: 50, retweets: 200, likes: 1500 },
  },
  {
    id: "3",
    user: {
      name: "Agência Presidencial",
      handle: "@thepresidential",
      avatarUrl: "https://placehold.co/48x48.png",
      dataAiHint: "agency logo",
    },
    content: "Bem-vindos à nossa nova plataforma! Fiquem ligados para jogos de bingo emocionantes e muito mais. #novidades #bingo",
    timestamp: "5m",
    stats: { replies: 10, retweets: 5, likes: 22 },
  },
];

export default function HomePage() {
  const { currentUser } = useAuth();
  const [newPostText, setNewPostText] = useState("");

  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    const nameParts = name.split(' ');
    if (nameParts.length > 1 && nameParts[0] && nameParts[1]) {
      return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="flex justify-center w-full flex-grow"> 
      <div className="flex w-full max-w-[990px] flex-grow overflow-hidden"> 
        {/* Main Feed Content */}
        <div className="w-full lg:w-[600px] border-r border-l border-border flex flex-col h-full"> 
          {/* What's happening input area */}
          <Card className="mb-0 shadow-none rounded-none border-x-0 border-t-0 shrink-0"> 
            <div className="p-4">
              <div className="flex space-x-3">
                <Avatar className="h-12 w-12 border">
                  <AvatarImage src={currentUser?.photoURL || undefined} alt={currentUser?.displayName || "Usuário"} data-ai-hint="user avatar" />
                  <AvatarFallback>{getInitials(currentUser?.displayName || currentUser?.email)}</AvatarFallback>
                </Avatar>
                <Textarea
                  placeholder="O que está acontecendo?"
                  className="flex-1 resize-none border-none focus-visible:ring-0 focus-visible:ring-offset-0 min-h-[80px] text-lg"
                  value={newPostText}
                  onChange={(e) => setNewPostText(e.target.value)}
                />
              </div>
              <div className="mt-3 flex justify-between items-center">
                <div className="flex space-x-1 text-primary">
                  <Button variant="ghost" size="icon" className="hover:bg-primary/10">
                    <ImagePlus className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="hover:bg-primary/10">
                    <ListChecks className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="hover:bg-primary/10">
                    <Smile className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="hover:bg-primary/10">
                    <MapPin className="h-5 w-5" />
                  </Button>
                </div>
                <Button
                  disabled={!newPostText.trim()}
                  className="rounded-full font-semibold px-6"
                >
                  Postar
                </Button>
              </div>
            </div>
          </Card>

          {/* Tabs for feed types */}
          <Tabs defaultValue="for-you" className="w-full flex-grow flex flex-col"> 
            <TabsList className="grid w-full grid-cols-2 h-auto p-0 rounded-none bg-card border-b shrink-0"> 
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
              <div className="space-y-0">
                {placeholderPosts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
                 {/* Add more posts to test scrolling */}
                {placeholderPosts.map((post, index) => (
                  <PostCard key={`${post.id}-clone-${index}`} post={{...post, id: `${post.id}-clone-${index}`}} />
                ))}
              </div>
            </TabsContent>
            <TabsContent value="following" className="mt-0 flex-grow overflow-y-auto"> 
              <div className="space-y-0">
                {placeholderPosts.map((post) => (
                  <PostCard key={`${post.id}-following`} post={post} />
                ))}
                <div className="text-center py-8 text-muted-foreground">
                    <p>Você ainda não está seguindo ninguém.</p>
                    <p className="text-sm">Postagens de contas que você segue aparecerão aqui.</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Sidebar */}
        <aside className="hidden lg:block w-[350px] pl-6 space-y-6 py-4 h-full overflow-y-auto"> 
          <SearchWidget />
          <PremiumSignupWidget />
          <WhatsHappeningWidget />
          <WhoToFollowWidget />
          <FooterLinksWidget />
        </aside>
      </div>
    </div>
  );
}
