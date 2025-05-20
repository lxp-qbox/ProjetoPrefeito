
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
  TableCell, // Added TableCell import
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Crown } from "lucide-react";
import type { Host } from "@/types";
import HostRow from "@/components/host/host-row";

// Placeholder data for hosts - EXPORTED for use in dynamic page
export const placeholderHosts: Host[] = [
  {
    id: "loud-coringa-01",
    rankPosition: 1,
    name: "LOUD_CORINGA",
    avatarUrl: "https://placehold.co/40x40.png",
    dataAiHint: "gamer avatar",
    avgViewers: 25600,
    timeStreamed: 185.2,
    allTimePeakViewers: 78000,
    hoursWatched: "4.7M",
    rank: 10,
    followersGained: 15200,
    totalFollowers: "2.1M",
    totalViews: "15.3M",
    kakoLiveFuid: "1169d2d120e14f34b217dad9cdc91a6b",
    kakoLiveRoomId: "67b9ed5fa4e716a084a23765", // Example Room ID
    bio: "Jogador profissional e streamer. Amo interagir com vocês!",
    streamTitle: "Gameplay Insana e Risadas!",
    likes: 150000,
    giftsReceived: [
        { id: "gift1", name: "Diamante", iconUrl: "https://placehold.co/48x48.png?text=💎", count: 150, dataAiHint:"diamond gem" },
        { id: "gift2", name: "Foguete", iconUrl: "https://placehold.co/48x48.png?text=🚀", count: 25, dataAiHint:"rocket space" },
    ],
    createdAt: new Date(),
    lastSeen: new Date(),
    source: 'manual',
    totalDonationsValue: 1200,
  },
  {
    id: "presidente-001", // Changed from new-test-host-1 for clarity
    rankPosition: 2,
    name: "PRESIDENTE",
    avatarUrl: "https://godzilla-live-oss.kako.live/avatar/0322d2dd57e74a028a9e72c2fae1fd9a/20250516/1747436206391.jpg/200x200",
    dataAiHint: "man suit",
    avgViewers: 18000,
    timeStreamed: 210.5,
    allTimePeakViewers: 55000,
    hoursWatched: "3.8M",
    rank: 39,
    followersGained: 10500,
    totalFollowers: "1.5M",
    totalViews: "10.1M",
    kakoLiveFuid: "0322d2dd57e74a028a9e72c2fae1fd9a",
    kakoLiveRoomId: "67b9ed5fa4e716a084a23765",
    bio: "✨The Presidential Agency, é uma organização de alto desempenho que opera sob contrato e rígidas diretrizes internas. Para fazer parte da agência, é obrigatório ser maior de idade.",
    streamTitle: "Dominando as Arenas!",
    likes: 276997,
    giftsReceived: [
      { id: "gift_miau", name: "Miau", iconUrl: "https://godzilla-live-oss.kako.live/gift/luck_maotou_250320.png", count: 15, dataAiHint: "cat face" },
      { id: "gift_amor", name: "Amor", iconUrl: "https://godzilla-live-oss.kako.live/gift/luck_aixin.png", count: 200, dataAiHint: "heart symbol" },
      { id: "gift_rosas", name: "Rosas", iconUrl: "https://godzilla-live-oss.kako.live/gift/luck_meiguihua250211.png", count: 50, dataAiHint: "roses flower" },
      { id: "gift_sol", name: "Sol", iconUrl: "https://godzilla-live-oss.kako.live/gift/luck_zao_250426.png", count: 100, dataAiHint: "sun bright" },
      { id: "gift_sorvete", name: "Sorvete", iconUrl: "https://godzilla-live-oss.kako.live/gift/luck_bingqiling_250314.png", count: 75, dataAiHint: "ice cream" },
    ],
    createdAt: new Date(),
    lastSeen: new Date(),
    source: 'kakoLive',
    totalDonationsValue: 5000,
  },
  {
    id: "streamer-galaxia-02",
    rankPosition: 3,
    name: "Comandante Estelar",
    avatarUrl: "https://placehold.co/40x40.png?text=CE",
    dataAiHint: "space commander",
    avgViewers: 15000,
    timeStreamed: 150.0,
    allTimePeakViewers: 45000,
    hoursWatched: "2.2M",
    rank: 25,
    followersGained: 8000,
    totalFollowers: "950K",
    totalViews: "7.5M",
    kakoLiveFuid: "7929e0d0a7654b93b114b88ceef8f01f", // From your URL
    kakoLiveRoomId: "67bb45bba2dac52d3825050f", // From your URL
    bio: "Explorando o universo dos games, uma live de cada vez. Junte-se à tripulação!",
    streamTitle: "Noite de Aventuras Intergalácticas!",
    likes: 120500,
    giftsReceived: [
      { id: "gift_star", name: "Estrela Cadente", iconUrl: "https://placehold.co/48x48.png?text=🌠", count: 80, dataAiHint:"shooting star" },
      { id: "gift_planet", name: "Planeta Misterioso", iconUrl: "https://placehold.co/48x48.png?text=🪐", count: 10, dataAiHint:"planet ring" },
    ],
    createdAt: new Date(),
    lastSeen: new Date(),
    source: 'manual',
    totalDonationsValue: 750,
  },
];


export default function HostsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <section className="mb-8">
        <h1 className="text-3xl font-bold text-center mb-2 uppercase tracking-wide text-primary">
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
              {placeholderHosts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="h-24 text-center text-muted-foreground">
                    Nenhum host encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                placeholderHosts.map((host) => (
                  <HostRow key={host.id} host={host} />
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
