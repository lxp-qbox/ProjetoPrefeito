
import GameCard from "@/components/game/game-card";
import type { Game } from "@/types";
import { Input } from "@/components/ui/input";
import { Search, ListFilter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Placeholder data for games
const placeholderGames: Game[] = [
  { id: "1", title: "Weekend Bonanza Bingo", startTime: new Date(Date.now() + 2 * 60 * 60 * 1000), status: "Upcoming", description: "Join us for a fun-filled weekend bingo!", prize: "$100 Amazon Voucher" },
  { id: "2", title: "Midweek Madness", startTime: new Date(), status: "Live", description: "Crazy patterns, crazier prizes!", prize: "$50 Cash" },
  { id: "3", title: "Evening Chill Bingo", startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), status: "Upcoming", description: "Relax and unwind with our evening session.", prize: "Spa Day Pass" },
  { id: "4", title: "Morning Quickies", startTime: new Date(Date.now() - 5 * 60 * 60 * 1000), status: "Ended", description: "Fast-paced games to start your day.", prize: "Coffee Mug Set" },
  { id: "5", title: "Charity Bingo Night", startTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), status: "Upcoming", description: "Play for a good cause. All proceeds to charity.", prize: "Good Karma + Mystery Box" },
  { id: "6", title: "The Grand Bingo Tournament", startTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), status: "Upcoming", description: "Compete for the grand prize in our biggest tournament yet!", prize: "$1000 Grand Prize" },
];

export default function GamesPage() {
  // In a real app, you'd fetch and filter games
  const upcomingGames = placeholderGames.filter(game => game.status === "Upcoming").sort((a,b) => a.startTime.getTime() - b.startTime.getTime());
  const liveGames = placeholderGames.filter(game => game.status === "Live");
  const endedGames = placeholderGames.filter(game => game.status === "Ended").sort((a,b) => b.startTime.getTime() - a.startTime.getTime());


  return (
    <div className="space-y-8">
      <section className="bg-card p-6 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-primary mb-2">Explore Our Bingo Games</h1>
        <p className="text-muted-foreground mb-6">Find live games, see what's upcoming, or check results from past events.</p>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input type="search" placeholder="Search games by title or keyword..." className="pl-10 w-full" />
          </div>
          <Select defaultValue="all">
            <SelectTrigger className="w-full md:w-[180px]">
              <ListFilter className="h-4 w-4 mr-2 text-muted-foreground"/>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="live">Live</SelectItem>
              <SelectItem value="ended">Ended</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>

      {liveGames.length > 0 && (
        <section>
          <h2 className="text-2xl font-semibold mb-4 border-b pb-2 text-destructive">Live Now 🔥</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {liveGames.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        </section>
      )}

      {upcomingGames.length > 0 && (
        <section>
          <h2 className="text-2xl font-semibold mb-4 border-b pb-2 text-primary">Upcoming Games</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingGames.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        </section>
      )}
      
      {endedGames.length > 0 && (
        <section>
          <h2 className="text-2xl font-semibold mb-4 border-b pb-2 text-muted-foreground">Past Games</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-75">
            {endedGames.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        </section>
      )}

      {placeholderGames.length === 0 && (
         <div className="text-center py-12">
            <TicketIcon className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-xl font-semibold">No Games Found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              There are currently no games scheduled. Please check back later!
            </p>
          </div>
      )}
    </div>
  );
}
