
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Users, Clock, CheckCircle, XCircle, MoreHorizontal } from "lucide-react";
import Link from "next/link";

interface StatCardProps {
  title: string;
  count: string | number;
  icon: React.ElementType;
  iconColor?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, count, icon: Icon, iconColor = "text-primary" }) => (
  <Card className="shadow-md">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <div className={`p-2 rounded-full bg-opacity-10 ${
          title === "Total de Usuários" ? "bg-blue-500" :
          title === "Pendentes" ? "bg-yellow-500" :
          title === "Aprovados" ? "bg-green-500" :
          title === "Banidos" ? "bg-red-500" : "bg-primary" // fallback
        }`}>
        <Icon className={`h-5 w-5 ${
          title === "Total de Usuários" ? "text-blue-500" :
          title === "Pendentes" ? "text-yellow-500" :
          title === "Aprovados" ? "text-green-500" :
          title === "Banidos" ? "text-red-500" : iconColor // fallback
        }`} />
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold">{count}</div>
    </CardContent>
  </Card>
);

interface AdminHost {
  id: string;
  isLive: boolean;
  kakoId: string;
  name: string;
  whatsapp: string;
  url?: string;
  country: string;
  status: 'Aprovado' | 'Pendente' | 'Banido';
}

const placeholderHosts: AdminHost[] = [
  { id: "1", isLive: true, kakoId: "kako123", name: "João Silva", whatsapp: "+55 (11) 98765-4321", url: "#", country: "Brasil", status: "Aprovado" },
  { id: "2", isLive: true, kakoId: "kako456", name: "Maria Oliveira", whatsapp: "+55 (21) 91234-5678", url: undefined, country: "Brasil", status: "Pendente" },
  // Add more placeholder hosts if needed
];

export default function AdminHostsPageContent() {
  return (
    <div className="space-y-6 bg-card p-6 rounded-lg shadow-lg">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-semibold text-foreground">Gerenciamento de Hosts</h1>
        <div className="relative w-full sm:w-auto sm:min-w-[280px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input type="search" placeholder="Buscar hosts..." className="pl-10 w-full h-10" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total de Usuários" count={2} icon={Users} />
        <StatCard title="Pendentes" count={1} icon={Clock} />
        <StatCard title="Aprovados" count={1} icon={CheckCircle} />
        <StatCard title="Banidos" count={0} icon={XCircle} />
      </div>

      <div className="rounded-lg border overflow-x-auto shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[50px] text-center">LIVE</TableHead>
              <TableHead>ID DO KAKO</TableHead>
              <TableHead>NOME DE USUÁRIO</TableHead>
              <TableHead>WHATSAPP</TableHead>
              <TableHead>URL</TableHead>
              <TableHead>PAÍS</TableHead>
              <TableHead>STATUS</TableHead>
              <TableHead className="text-right w-[80px]">AÇÕES</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {placeholderHosts.map((host) => (
              <TableRow key={host.id} className="hover:bg-muted/20 transition-colors">
                <TableCell className="text-center">
                  {host.isLive && <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500" title="Ao Vivo"></span>}
                </TableCell>
                <TableCell className="font-medium text-primary hover:underline">
                  <Link href={`/hosts/${host.kakoId}`}>{host.kakoId}</Link>
                </TableCell>
                <TableCell>{host.name}</TableCell>
                <TableCell className="text-muted-foreground">{host.whatsapp}</TableCell>
                <TableCell>
                  {host.url ? (
                    <Button variant="link" asChild className="p-0 h-auto text-primary hover:underline">
                      <Link href={host.url} target="_blank" rel="noopener noreferrer">Abrir</Link>
                    </Button>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">{host.country}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      host.status === 'Aprovado' ? 'default' :
                      host.status === 'Pendente' ? 'secondary' :
                      'destructive'
                    }
                    className={
                      host.status === 'Aprovado' ? 'bg-green-100 text-green-700 border-green-200' :
                      host.status === 'Pendente' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                      'bg-red-100 text-red-700 border-red-200'
                    }
                  >
                    {host.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {/* Placeholder for action button/dropdown */}
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Ações</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-muted-foreground">
        <p>Mostrando 1 a {placeholderHosts.length} de {placeholderHosts.length} resultados</p>
        <div className="flex items-center gap-2 mt-2 sm:mt-0">
          <Button variant="outline" size="sm" disabled={true}>Anterior</Button>
          <Button variant="default" size="sm" className="px-3 h-8">1</Button>
          <Button variant="outline" size="sm" disabled={true}>Próxima</Button>
        </div>
      </div>
    </div>
  );
}
