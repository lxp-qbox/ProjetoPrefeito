
import type { Game } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import FinishedGameCard from "@/components/bingo/finished-game-card";
import { Users, Clock, Trophy, Award, ArrowRight } from "lucide-react";
import Link from "next/link";

// Placeholder data
const nextGame: Game = {
  id: "next-1",
  title: "Bingo Beneficente",
  startTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // ~2 hours from now
  status: "Upcoming",
  participants: 24,
  prize: "10K",
  startTimeDisplay: "20:00",
  additionalInfo: "24 participantes!",
};

const finishedGames: Game[] = [
  { id: "fin-1", title: "Mega Bingo da Semana", startTime: new Date(), status: "Ended", participants: 56, endTimeDisplay: "16:30", winners: "João Silva" },
  { id: "fin-2", title: "Bingo dos Amigos", startTime: new Date(), status: "Ended", participants: 37, endTimeDisplay: "21:45", winners: "Maria Oliveira" },
  { id: "fin-3", title: "Bingo da Quarta", startTime: new Date(), status: "Ended", participants: 42, endTimeDisplay: "20:15", winners: "2 pessoas" },
];

export default function BingoPage() {
  return (
    <div className="space-y-8">
      {/* Próxima Partida Section */}
      <section>
        <div className="bg-primary text-primary-foreground p-3 rounded-t-lg flex justify-between items-center shadow-md">
          <div className="flex items-center">
            <div className="h-2.5 w-2.5 bg-white rounded-full mr-2"></div>
            <span className="font-semibold text-lg">Próxima Partida</span>
          </div>
          {nextGame.startTimeDisplay && (
            <Badge className="bg-white/20 text-primary-foreground text-xs">
              Começa às {nextGame.startTimeDisplay}
            </Badge>
          )}
        </div>
        <Card className="rounded-t-none shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">{nextGame.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div className="flex items-center space-x-2">
                <Users className="h-7 w-7 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Participantes</p>
                  <p className="font-semibold text-lg">{nextGame.participants || 0}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-7 w-7 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Início às</p>
                  <p className="font-semibold text-lg">{nextGame.startTimeDisplay || "N/A"}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Trophy className="h-7 w-7 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Prêmio</p>
                  <p className="font-semibold text-lg">{nextGame.prize || "N/A"}</p>
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center mt-6 pt-4 border-t">
              <p className="text-muted-foreground text-sm">{nextGame.additionalInfo || ""}</p>
              <Button asChild size="sm">
                <Link href={`/bingo/${nextGame.id}/play`}>
                  Participar Agora <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Partidas Finalizadas Section */}
      <section>
        <div className="mb-6">
          <div className="flex items-center mb-1">
            <Award className="h-7 w-7 mr-2 text-primary" />
            <h2 className="text-2xl font-semibold">Partidas Finalizadas</h2>
          </div>
          <p className="text-muted-foreground">
            Confira as últimas partidas realizadas e seus vencedores
          </p>
        </div>
        {finishedGames.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {finishedGames.map((game) => (
              <FinishedGameCard key={game.id} game={game} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">Nenhuma partida finalizada ainda.</p>
        )}
      </section>
    </div>
  );
}
