
"use client";

import ProtectedPage from "@/components/auth/protected-page";
import GameCard from "@/components/game/game-card";
import type { Game } from "@/types";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusCircle, Gamepad2 } from "lucide-react";

// Placeholder data for games, including a hostedBy field
const allPlaceholderGames: Game[] = [
  { id: "1", title: "Meu Bingo Exclusivo", startTime: new Date(Date.now() + 2 * 60 * 60 * 1000), status: "Upcoming", hostedBy: "testUser123", description: "Um jogo especial para meus seguidores!", prize: "Vale Starbucks de R$20" },
  { id: "2", title: "De Tarde com João", startTime: new Date(), status: "Live", hostedBy: "anotherHost", description: "Não hospedado pelo usuário de teste atual.", prize: "Vale GameStop de R$30"},
  { id: "3", title: "Meu Clássico Semanal", startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), status: "Upcoming", hostedBy: "testUser123", description: "O jogo semanal regular que você ama.", prize: "Camiseta Personalizada" },
  { id: "4", title: "O Grande (Arquivado)", startTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), status: "Ended", hostedBy: "testUser123", description: "Nosso maior jogo do mês passado.", prize: "R$500" },
];

export default function HostGamesPage() {
  const { currentUser } = useAuth();

  // Filter games hosted by the current user
  // In a real app, currentUser.uid would be used. For placeholders, we use a mock ID.
  const hostId = currentUser?.uid || "testUser123"; // Use actual UID or a consistent mock
  const hostedGames = allPlaceholderGames.filter(game => game.hostedBy === hostId);

  const upcomingGames = hostedGames.filter(game => game.status === "Upcoming").sort((a,b) => a.startTime.getTime() - b.startTime.getTime());
  const liveGames = hostedGames.filter(game => game.status === "Live");
  const endedGames = hostedGames.filter(game => game.status === "Ended").sort((a,b) => b.startTime.getTime() - a.startTime.getTime());


  return (
    <ProtectedPage>
      <div className="space-y-8">
        <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-6 rounded-lg shadow-md">
          <div>
            <h1 className="text-3xl font-bold text-primary mb-1 flex items-center">
              <Gamepad2 className="mr-3 h-8 w-8"/> Meus Jogos Criados
            </h1>
            <p className="text-muted-foreground">Gerencie e visualize os jogos de bingo que você criou.</p>
          </div>
          <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <Link href="/host/games/create"> {/* Placeholder link */}
              <PlusCircle className="mr-2 h-5 w-5" /> Criar Novo Jogo
            </Link>
          </Button>
        </section>

        {hostedGames.length === 0 && (
          <div className="text-center py-12 bg-card rounded-lg shadow-md p-6">
            <Gamepad2 className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-xl font-semibold">Nenhum Jogo Criado Ainda</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Pronto para criar seu primeiro jogo de bingo? Clique no botão acima para começar!
            </p>
          </div>
        )}

        {liveGames.length > 0 && (
        <section>
          <h2 className="text-2xl font-semibold mb-4 border-b pb-2 text-destructive">Ao Vivo Agora 🔥</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {liveGames.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        </section>
        )}

        {upcomingGames.length > 0 && (
            <section>
            <h2 className="text-2xl font-semibold mb-4 border-b pb-2 text-primary">Próximos Jogos Criados</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcomingGames.map((game) => (
                <GameCard key={game.id} game={game} />
                ))}
            </div>
            </section>
        )}
        
        {endedGames.length > 0 && (
            <section>
            <h2 className="text-2xl font-semibold mb-4 border-b pb-2 text-muted-foreground">Jogos Criados Anteriores</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-75">
                {endedGames.map((game) => (
                <GameCard key={game.id} game={game} />
                ))}
            </div>
            </section>
        )}
      </div>
    </ProtectedPage>
  );
}
