
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
  // All placeholder hosts removed
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
