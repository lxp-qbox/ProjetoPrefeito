
import type { Game } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Clock, Trophy, CheckCircle2, ChevronRight } from "lucide-react";
import Link from "next/link";

interface FinishedGameCardProps {
  game: Game;
}

export default function FinishedGameCard({ game }: FinishedGameCardProps) {
  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow flex flex-col h-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl font-semibold">{game.title}</CardTitle>
          <Badge variant="outline" className="text-xs whitespace-nowrap">
            <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" />
            Finalizada
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2.5 text-sm flex-grow">
        {game.participants !== undefined && (
          <div className="flex items-center text-muted-foreground">
            <Users className="h-4 w-4 mr-2 text-primary" />
            <div>
              Participantes
              <p className="text-foreground font-medium">{game.participants}</p>
            </div>
          </div>
        )}
        {game.endTimeDisplay && (
          <div className="flex items-center text-muted-foreground">
            <Clock className="h-4 w-4 mr-2 text-primary" />
            <div>
              Finalizado às
              <p className="text-foreground font-medium">{game.endTimeDisplay}</p>
            </div>
          </div>
        )}
        {game.winners && (
          <div className="flex items-center text-muted-foreground">
            <Trophy className="h-4 w-4 mr-2 text-primary" />
            <div>
              Vencedor(es)
              <p className="text-foreground font-medium">{game.winners}</p>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Link 
          href={`/bingo/${game.id}`} 
          className="text-primary no-underline hover:underline text-sm font-medium flex items-center w-full justify-end"
        >
          Ver detalhes <ChevronRight className="h-4 w-4 ml-1" />
        </Link>
      </CardFooter>
    </Card>
  );
}

