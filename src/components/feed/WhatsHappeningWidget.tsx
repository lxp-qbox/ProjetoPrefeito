
import type { Trend } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";

const placeholderTrends: Trend[] = [
  { id: "1", category: "Política · Assunto do Momento", topic: "Pablo Marçal", posts: "" },
  { id: "2", category: "Podcasts & rádio · Assunto do Momento", topic: "CAIO E LUAN NO PODDELAS", posts: "18,8 mil posts" },
  { id: "3", category: "Assunto do Momento em Brasil", topic: "Advogado", posts: "28,8 mil posts" },
];

export function WhatsHappeningWidget() {
  return (
    <Card className="bg-muted border-none rounded-xl">
      <CardHeader className="p-4">
        <CardTitle className="text-lg font-bold">O que está acontecendo</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-0">
          {placeholderTrends.map((trend) => (
            <div key={trend.id} className="px-4 py-3 hover:bg-card/50 transition-colors cursor-pointer">
              <div className="flex justify-between items-start">
                <p className="text-xs text-muted-foreground">{trend.category}</p>
                <Button variant="ghost" size="icon" className="h-7 w-7 -mr-2 -mt-1 text-muted-foreground">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
              <p className="font-semibold text-sm text-foreground">{trend.topic}</p>
              {trend.posts && <p className="text-xs text-muted-foreground">{trend.posts}</p>}
            </div>
          ))}
        </div>
         <div className="p-4">
            <Button variant="link" className="p-0 text-sm text-primary hover:no-underline">Mostrar mais</Button>
        </div>
      </CardContent>
    </Card>
  );
}
