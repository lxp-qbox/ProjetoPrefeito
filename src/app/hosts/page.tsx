
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Crown } from "lucide-react";
import type { Host } from "@/types";
import HostRow from "@/components/host/host-row";

// Placeholder data for hosts - EXPORTED for use in dynamic page
export const placeholderHosts: Host[] = [
  { id: "1", rankPosition: 1, name: "LOUD_CORINGA", avatarUrl: "https://placehold.co/40x40.png?text=LC", avgViewers: 37828, timeStreamed: 102.6, allTimePeakViewers: 307450, hoursWatched: "3.88M", rank: 10, followersGained: 59300, totalFollowers: "6.55M", totalViews: "50.8M", kakoLiveFuid: "1169d2d120e14f34b217dad9cdc91a6b", kakoLiveRoomId: "67b9ed5fa4e716a084a23765", streamTitle: "Ao Vivo com Coringa!", bio: "Streamer oficial da LOUD." },
  { id: "2", rankPosition: 2, name: "PAULINHOLOKOBR", avatarUrl: "https://placehold.co/40x40.png?text=PL", avgViewers: 37508, timeStreamed: 74.4, allTimePeakViewers: 266793, hoursWatched: "2.79M", rank: 17, followersGained: 35900, totalFollowers: "3.42M", totalViews: "--" },
  { id: "3", rankPosition: 3, name: "GAULES", avatarUrl: "https://placehold.co/40x40.png?text=GA", avgViewers: 5137, timeStreamed: 718.9, allTimePeakViewers: 707648, hoursWatched: "3.69M", rank: 29, followersGained: 13000, totalFollowers: "4.28M", totalViews: "405M" },
  { id: "4", rankPosition: 4, name: "ALANZOKA", avatarUrl: "https://placehold.co/40x40.png?text=AZ", avgViewers: 14131, timeStreamed: 143.8, allTimePeakViewers: 147051, hoursWatched: "2.03M", rank: 56, followersGained: 33000, totalFollowers: "7.66M", totalViews: "206M" },
  { id: "5", rankPosition: 5, name: "BAIANO", avatarUrl: "https://placehold.co/40x40.png?text=BA", avgViewers: 2974, timeStreamed: 680.9, allTimePeakViewers: 154553, hoursWatched: "2.02M", rank: 89, followersGained: 2200, totalFollowers: "1.05M", totalViews: "60.5M" },
  { id: "6", rankPosition: 6, name: "CELLBIT", avatarUrl: "https://placehold.co/40x40.png?text=CE", avgViewers: 7658, timeStreamed: 233.3, allTimePeakViewers: 215165, hoursWatched: "1.79M", rank: 90, followersGained: 10000, totalFollowers: "3.47M", totalViews: "84.1M" },
  { id: "7", rankPosition: 7, name: "LUQUET4", avatarUrl: "https://placehold.co/40x40.png?text=LU", avgViewers: 14811, timeStreamed: 89.5, allTimePeakViewers: 111307, hoursWatched: "1.33M", rank: 99, followersGained: 22700, totalFollowers: "2.00M", totalViews: "4.45M" },
  { id: "8", rankPosition: 8, name: "GABEPEIXE", avatarUrl: "https://placehold.co/40x40.png?text=GP", avgViewers: 5828, timeStreamed: 266.4, allTimePeakViewers: 101307, hoursWatched: "1.55M", rank: 109, followersGained: 9500, totalFollowers: "1.72M", totalViews: "19.5M" },
  {
    id: "new-test-host-1",
    rankPosition: 9,
    name: "PRESIDENTE",
    avatarUrl: "https://godzilla-live-oss.kako.live/avatar/0322d2dd57e74a028a9e72c2fae1fd9a/20250516/1747436206391.jpg/200x200",
    avgViewers: 15000,
    timeStreamed: 60.0,
    allTimePeakViewers: 30000,
    hoursWatched: "1.5M",
    rank: 39,
    followersGained: 8000,
    totalFollowers: "750K",
    totalViews: "3.0M",
    kakoLiveFuid: "0322d2dd57e74a028a9e72c2fae1fd9a",
    kakoLiveRoomId: "67b9ed5fa4e716a084a23765",
    bio: "✨The Presidential Agency, é uma organização de alto desempenho que opera sob contrato e rígidas diretrizes internas. Para fazer parte da agência, é obrigatório ser maior de idade.",
    streamTitle: "Dominando as Arenas!",
    likes: 276997,
    giftsReceived: [
      { id: "gift-40", name: "Miau", iconUrl: "https://godzilla-live-oss.kako.live/gift/luck_maotou_250320.png", count: 150 , dataAiHint: "gato miau" },
      { id: "gift-1", name: "Amor", iconUrl: "https://godzilla-live-oss.kako.live/gift/luck_aixin.png", count: 75, dataAiHint: "coração amor" },
      { id: "gift-26", name: "Rosas", iconUrl: "https://godzilla-live-oss.kako.live/gift/luck_meiguihua250211.png", count: 50, dataAiHint: "rosas flor" },
      { id: "gift-46", name: "Sol", iconUrl: "https://godzilla-live-oss.kako.live/gift/luck_zao_250426.png", count: 20, dataAiHint: "sol dia" },
      { id: "gift-31", name: "Sorvete", iconUrl: "https://godzilla-live-oss.kako.live/gift/luck_bingqiling_250314.png", count: 100, dataAiHint: "sorvete sobremesa" },
    ]
  },
  {
    id: "new-host-2",
    rankPosition: 10,
    name: "Streamer Estelar",
    avatarUrl: "https://placehold.co/40x40.png?text=SE",
    avgViewers: 12000,
    timeStreamed: 80.5,
    allTimePeakViewers: 25000,
    hoursWatched: "1.2M",
    rank: 45,
    followersGained: 7500,
    totalFollowers: "500K",
    totalViews: "2.5M",
    kakoLiveFuid: "38091a3fedba40de9e5ce2d9a72c6ab8",
    kakoLiveRoomId: "67c3da3bf8c755c85199b168",
    bio: "Bem-vindos à minha live! Jogos variados e muita diversão.",
    streamTitle: "Gameplay Épico e Risadas!",
    likes: 150320,
    giftsReceived: [
      { id: "gift-s2-1", name: "Diamante", iconUrl: "https://placehold.co/48x48.png?text=D", count: 50, dataAiHint: "diamante jóia" },
      { id: "gift-s2-2", name: "Estrela Cadente", iconUrl: "https://placehold.co/48x48.png?text=SC", count: 30, dataAiHint: "estrela céu" },
      { id: "gift-s2-3", name: "Poção Mágica", iconUrl: "https://placehold.co/48x48.png?text=MP", count: 70, dataAiHint: "poção magia" },
    ]
  },
];


export default function HostsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <section className="mb-8">
        <h1 className="text-3xl font-bold text-center mb-2 uppercase tracking-wide">
          Hosts TOP da Agência
        </h1>
        <p className="text-sm text-muted-foreground text-center max-w-2xl mx-auto">
          O Rank Geral é baseado na média de espectadores simultâneos, seguidores, visualizações e tempo de transmissão nos últimos 30 dias, Maio 2025, Todos os idiomas.
        </p>
      </section>

      <section className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-card rounded-lg shadow">
        <div className="flex gap-3 w-full sm:w-auto">
          <Select defaultValue="all-languages">
            <SelectTrigger className="w-full sm:w-[180px] text-sm">
              <SelectValue placeholder="Idioma" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-languages">Todos os Idiomas</SelectItem>
              <SelectItem value="portuguese">Português</SelectItem>
              <SelectItem value="english">Inglês</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="any-channel">
            <SelectTrigger className="w-full sm:w-[180px] text-sm">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any-channel">Qualquer Categoria</SelectItem>
              <SelectItem value="gaming">Jogos</SelectItem>
              <SelectItem value="just-chatting">Só Conversa</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" className="w-full sm:w-auto border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive text-sm">
          LISTA DE HOSTS AO VIVO
        </Button>
      </section>

      <p className="text-xs text-muted-foreground mb-2 text-center sm:text-left">
        Clique no cabeçalho da tabela para ordenar
      </p>

      <div className="rounded-lg border shadow-sm overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <Table className="min-w-full">
            <TableHeader className="bg-muted/30">
              <TableRow className="border-b-0">
                <TableHead className="w-12 pr-1 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">#</TableHead>
                <TableHead className="min-w-[200px] text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">Host</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap text-right">Média de Espect.</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap text-right">Tempo Transmitido</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap text-right">Pico Máximo</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap text-right">Horas Assistidas</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Crown className="h-4 w-4 text-yellow-500" /> Rank
                  </div>
                </TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap text-right">Seguidores Ganhos</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap text-right">Total de Seguidores</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap text-right">Total de Visualizações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {placeholderHosts.map((host) => (
                <HostRow key={host.id} host={host} />
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
