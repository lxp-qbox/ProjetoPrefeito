
import GameCard from "@/components/game/game-card";
import type { Game } from "@/types";
import { Input } from "@/components/ui/input";
import { Search, ListFilter, TicketIcon } from "lucide-react"; // Added TicketIcon
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Placeholder data for games
const placeholderGames: Game[] = [
  { id: "1", title: "Weekend Bonanza Bingo", startTime: new Date(Date.now() + 2 * 60 * 60 * 1000), status: "Upcoming", description: "Junte-se a nós para um bingo de fim de semana cheio de diversão!", prize: "Vale Amazon de R$100" },
  { id: "2", title: "Midweek Madness", startTime: new Date(), status: "Live", description: "Padrões malucos, prêmios mais malucos ainda!", prize: "R$50 em Dinheiro" },
  { id: "3", title: "Evening Chill Bingo", startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), status: "Upcoming", description: "Relaxe e descontraia com nossa sessão noturna.", prize: "Passe para Dia de Spa" },
  { id: "4", title: "Morning Quickies", startTime: new Date(Date.now() - 5 * 60 * 60 * 1000), status: "Ended", description: "Jogos rápidos para começar o seu dia.", prize: "Conjunto de Canecas de Café" },
  { id: "5", title: "Charity Bingo Night", startTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), status: "Upcoming", description: "Jogue por uma boa causa. Todos os lucros para caridade.", prize: "Bom Karma + Caixa Misteriosa" },
  { id: "6", title: "The Grand Bingo Tournament", startTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), status: "Upcoming", description: "Compita pelo grande prêmio em nosso maior torneio até agora!", prize: "Grande Prêmio de R$1000" },
];

export default function GamesPage() {
  // In a real app, you'd fetch and filter games
  const upcomingGames = placeholderGames.filter(game => game.status === "Upcoming").sort((a,b) => a.startTime.getTime() - b.startTime.getTime());
  const liveGames = placeholderGames.filter(game => game.status === "Live");
  const endedGames = placeholderGames.filter(game => game.status === "Ended").sort((a,b) => b.startTime.getTime() - a.startTime.getTime());


  return (
    <div className="space-y-8">
      <section className="bg-card p-6 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-primary mb-2">Explore Nossos Jogos de Bingo</h1>
        <p className="text-muted-foreground mb-6">Encontre jogos ao vivo, veja o que está por vir ou confira os resultados de eventos passados.</p>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input type="search" placeholder="Buscar jogos por título ou palavra-chave..." className="pl-10 w-full" />
          </div>
          <Select defaultValue="all">
            <SelectTrigger className="w-full md:w-[180px]">
              <ListFilter className="h-4 w-4 mr-2 text-muted-foreground"/>
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="upcoming">Próximos</SelectItem>
              <SelectItem value="live">Ao Vivo</SelectItem>
              <SelectItem value="ended">Encerrados</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>

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
          <h2 className="text-2xl font-semibold mb-4 border-b pb-2 text-primary">Próximos Jogos</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingGames.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        </section>
      )}
      
      {endedGames.length > 0 && (
        <section>
          <h2 className="text-2xl font-semibold mb-4 border-b pb-2 text-muted-foreground">Jogos Anteriores</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-75">
            {endedGames.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        </section>
      )}

      {placeholderGames.length === 0 && (
         <div className="text-center py-12 bg-card rounded-lg shadow-md p-6">
            <TicketIcon className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-xl font-semibold">Nenhum Jogo Encontrado</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Atualmente não há jogos agendados. Por favor, volte mais tarde!
            </p>
          </div>
      )}
    </div>
  );
}
