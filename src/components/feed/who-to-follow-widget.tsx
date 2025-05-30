"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { SuggestedUser } from "@/types";

export default function WhoToFollowWidget() {
  const suggestions: SuggestedUser[] = [
    { 
      id: "sugg1", 
      name: "Lia Clark", 
      handle: "@liaclark", 
      avatarUrl: "https://placehold.co/40x40.png", 
      dataAiHint: "singer pop" 
    },
    { 
      id: "sugg2", 
      name: "SpaceX", 
      handle: "@SpaceX", 
      avatarUrl: "https://placehold.co/40x40.png", 
      dataAiHint: "space logo" 
    },
  ];
  
  return (
    <Card className="bg-muted border-none rounded-xl">
      <CardHeader className="p-4">
        <CardTitle className="text-xl font-bold">Quem seguir</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="space-y-0" role="list" aria-label="Sugestões para seguir">
          {suggestions.map((user) => (
            <li key={user.id} className="flex items-center justify-between px-4 py-3 hover:bg-card/50 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage 
                    src={user.avatarUrl || undefined} 
                    alt={`Foto de perfil de ${user.name}`} 
                    data-ai-hint={user.dataAiHint} 
                    width={40} 
                    height={40}
                  />
                  <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <a href="#" className="font-semibold text-sm text-foreground hover:underline">
                    {user.name}
                  </a>
                  <p className="text-xs text-muted-foreground">{user.handle}</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-full bg-foreground text-background hover:bg-foreground/90 h-8 px-4 text-xs font-semibold"
                aria-label={`Seguir ${user.name}`}
              >
                Seguir
              </Button>
            </li>
          ))}
        </ul>
        <div className="p-4">
          <Button 
            variant="link" 
            className="p-0 text-sm text-primary hover:no-underline hover:text-primary/80"
            aria-label="Mostrar mais sugestões para seguir"
          >
            Mostrar mais
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 