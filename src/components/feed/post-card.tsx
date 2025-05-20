
"use client";

import type { FeedPost } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { MessageCircle, Repeat2, Heart, Upload, MoreHorizontal } from "lucide-react";

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
          <Avatar className="h-10 w-10 mt-1">
            <AvatarImage src={post.user.avatarUrl} alt={post.user.name} data-ai-hint={post.user.dataAiHint || "user avatar"} />
            <AvatarFallback>{getInitials(post.user.name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center justify-between">
                <div className="flex items-baseline space-x-1">
                    <span className="font-bold text-sm text-foreground hover:underline cursor-pointer">{post.user.name}</span>
                    <span className="text-xs text-muted-foreground">{post.user.handle}</span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground hover:underline cursor-pointer">{post.timestamp}</span>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full">
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </div>
            
            <p className="text-sm text-foreground whitespace-pre-wrap mt-0.5">{post.content}</p>
            
            {post.imageUrl && (
              <div className="mt-3 rounded-lg overflow-hidden border border-border aspect-video relative">
                <Image
                  src={post.imageUrl}
                  alt="Post image"
                  fill
                  className="object-cover"
                  data-ai-hint={post.imageAiHint || "post image"}
                />
              </div>
            )}
            
            <div className="mt-3 flex justify-between items-center text-muted-foreground max-w-xs">
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary hover:bg-primary/10 rounded-full text-xs group">
                <MessageCircle className="h-4 w-4 group-hover:text-primary" />
                <span className="ml-1 group-hover:text-primary">{post.stats.replies > 0 ? post.stats.replies : ''}</span>
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-green-500 hover:bg-green-500/10 rounded-full text-xs group">
                <Repeat2 className="h-4 w-4 group-hover:text-green-500" />
                <span className="ml-1 group-hover:text-green-500">{post.stats.retweets > 0 ? post.stats.retweets : ''}</span>
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-red-500 hover:bg-red-500/10 rounded-full text-xs group">
                <Heart className="h-4 w-4 group-hover:text-red-500" />
                <span className="ml-1 group-hover:text-red-500">{post.stats.likes > 0 ? post.stats.likes : ''}</span>
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary hover:bg-primary/10 rounded-full text-xs group">
                <Upload className="h-4 w-4 group-hover:text-primary" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

    