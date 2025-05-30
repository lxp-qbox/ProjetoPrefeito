"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MoreHorizontal } from "lucide-react";
import type { Trend } from "@/types";
import { cn } from "@/lib/utils";

export default function WhatsHappeningWidget() {
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
        <ul className="space-y-0" role="list" aria-label="Tendências">
          {trends.map((trend) => (
            <li 
              key={trend.id} 
              className={cn(
                "px-4 py-3 hover:bg-card/50 transition-colors cursor-pointer border-b border-border/50",
                "focus-within:bg-card/80 focus-within:outline-none"
              )}
            >
              <div className="flex justify-between items-start">
                <p className="text-xs text-muted-foreground">{trend.category}</p>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 -mr-2 -mt-1 text-muted-foreground hover:bg-primary/10 hover:text-primary rounded-full"
                  aria-label="Mais opções para tendência"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
              <a 
                href="#" 
                className="block"
                onClick={(e) => e.preventDefault()}
              >
                <p className="font-semibold text-sm text-foreground">{trend.topic}</p>
                {trend.posts && <p className="text-xs text-muted-foreground">{trend.posts}</p>}
              </a>
            </li>
          ))}
        </ul>
        <div className="p-4">
          <Button 
            variant="link" 
            className="p-0 text-sm text-primary hover:no-underline hover:text-primary/80"
            aria-label="Mostrar mais tendências"
          >
            Mostrar mais
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 