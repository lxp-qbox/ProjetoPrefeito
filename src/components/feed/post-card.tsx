
"use client";

import type { FeedPost } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import NextImage from "next/image"; // Renamed to avoid conflict with Lucide's Image icon
import { Textarea } from "@/components/ui/textarea";
import { 
    MessageCircle, 
    Repeat2, 
    Heart, 
    Send as SendIcon, // Renamed to avoid conflict
    MoreHorizontal,
    ThumbsUp, // For like
    Smile, // For comment emoji
    ImagePlus as ImageIcon, // For comment image attach
} from "lucide-react";

interface PostCardProps {
  post: FeedPost;
}

const getInitials = (name?: string | null) => {
    if (!name) return "U";
    const nameParts = name.split(' ');
    if (nameParts.length > 1 && nameParts[0] && nameParts[1]) {
      return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
};

export default function PostCard({ post }: PostCardProps) {
  return (
    <Card className="rounded-none border-b border-x-0 shadow-none hover:bg-muted/20 transition-colors last:border-b-0">
      <CardContent className="p-4">
        <div className="flex space-x-3">
          <Avatar className="h-10 w-10 mt-1 shrink-0">
            <AvatarImage src={post.user.avatarUrl || undefined} alt={post.user.name} data-ai-hint={post.user.dataAiHint || "user avatar"} />
            <AvatarFallback>{getInitials(post.user.name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0"> {/* Added min-w-0 for proper truncation */}
            <div className="flex items-center justify-between">
                <div className="flex items-baseline space-x-1 truncate"> {/* Added truncate here */}
                    <span className="font-bold text-sm text-foreground hover:underline cursor-pointer truncate">{post.user.name}</span>
                    <span className="text-xs text-muted-foreground truncate">{post.user.handle}</span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground hover:underline cursor-pointer whitespace-nowrap">{post.timestamp}</span>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full shrink-0">
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </div>
            
            {post.postTitle && <h3 className="font-semibold mt-1 text-foreground">{post.postTitle}</h3>}
            <p className="text-sm text-foreground whitespace-pre-wrap mt-0.5 break-words">{post.content}</p>
            
            {post.imageUrl && (
              <div className="mt-3 rounded-lg overflow-hidden border border-border aspect-video relative">
                <NextImage
                  src={post.imageUrl}
                  alt={post.postTitle || "Post image"}
                  fill
                  className="object-cover"
                  data-ai-hint={post.imageAiHint || "post image"}
                />
              </div>
            )}
            
            <div className="mt-3 flex justify-start items-center text-muted-foreground space-x-6"> {/* Changed justify-between and max-w-xs */}
              <Button variant="ghost" size="icon" className="h-auto p-0 text-xs group flex items-center gap-1.5 hover:text-red-500">
                <Heart className="h-5 w-5 group-hover:fill-red-500/20" /> {/* Adjusted icon size */}
                <span className="font-medium">{post.stats.likes > 0 ? post.stats.likes : ''}</span>
              </Button>
              <Button variant="ghost" size="icon" className="h-auto p-0 text-xs group flex items-center gap-1.5 hover:text-primary">
                <MessageCircle className="h-5 w-5" /> {/* Adjusted icon size */}
                <span className="font-medium">{post.stats.replies > 0 ? post.stats.replies : ''}</span>
              </Button>
              <Button variant="ghost" size="icon" className="h-auto p-0 text-xs group flex items-center gap-1.5 hover:text-green-500">
                <Repeat2 className="h-5 w-5" /> {/* Adjusted icon size */}
                <span className="font-medium">{post.stats.retweets > 0 ? post.stats.retweets : ''}</span>
              </Button>
              <Button variant="ghost" size="icon" className="h-auto p-0 text-xs group flex items-center gap-1.5 hover:text-primary">
                <SendIcon className="h-5 w-5" /> {/* Adjusted icon size */}
              </Button>
            </div>

            {/* Write a comment section */}
            <div className="mt-3 flex items-center space-x-2">
                <Avatar className="h-8 w-8 shrink-0">
                    {/* Placeholder for current user's avatar - replace with actual data if available */}
                    <AvatarImage src={post.user.avatarUrl || undefined} alt="Você" data-ai-hint="user avatar"/>
                    <AvatarFallback>{getInitials(post.user.name)}</AvatarFallback>
                </Avatar>
                <Textarea
                    placeholder="Escreva um comentário..."
                    rows={1}
                    className="flex-1 resize-none border-muted/50 rounded-full px-4 py-2 text-sm bg-muted/50 focus-visible:ring-1 focus-visible:ring-primary focus-visible:bg-card h-9"
                />
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary h-9 w-9">
                    <Smile className="h-5 w-5" />
                </Button>
                 <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary h-9 w-9">
                    <ImageIcon className="h-5 w-5" />
                </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
