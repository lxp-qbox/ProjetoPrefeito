
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Users, Clock, CheckCircle, XCircle, MoreHorizontal, ChevronDown, Edit } from "lucide-react";
import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface StatCardProps {
  title: string;
  count: string | number;
  icon: React.ElementType;
  iconColor?: string;
  bgColorClass?: string;
  textColorClass?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, count, icon: Icon, iconColor = "text-primary", bgColorClass = "bg-primary/10", textColorClass="text-primary" }) => (
  <Card className="shadow-md">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <div className={`p-2 rounded-lg ${bgColorClass}`}>
        <Icon className={`h-5 w-5 ${textColorClass}`} />
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold text-foreground">{count}</div>
    </CardContent>
  </Card>
);

interface AdminHost {
  id: string;
  avatarUrl: string;
  isLive: boolean;
  kakoId: string;
  name: string;
  whatsapp: string;
  url?: string;
  country: string;
  status: 'Aprovado' | 'Pendente' | 'Banido';
}

const placeholderHosts: AdminHost[] = [
  { id: "1", avatarUrl: "https://placehold.co/40x40.png", isLive: true, kakoId: "kako123", name: "João Silva", whatsapp: "+55 (11) 98765-4321", url: "#", country: "Brasil", status: "Aprovado" },
  { id: "2", avatarUrl: "https://placehold.co/40x40.png", isLive: true, kakoId: "kako456", name: "Maria Oliveira", whatsapp: "+55 (21) 91234-5678", url: undefined, country: "Brasil", status: "Pendente" },
  { id: "3", avatarUrl: "https://placehold.co/40x40.png", isLive: false, kakoId: "kako789", name: "Carlos Pereira", whatsapp: "+55 (31) 99887-7665", url: "#", country: "Brasil", status: "Banido" },
];

const getStatusStyles = (status: AdminHost['status']) => {
  switch (status) {
    case 'Aprovado':
      return { text: 'Ativo', className: 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200' };
    case 'Pendente':
      return { text: 'Pendente', className: 'bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-200' };
    case 'Banido':
      return { text: 'Inativo', className: 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200' }; 
    default:
      return { text: status, className: 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200' };
  }
};

const formatWhatsAppLink = (phoneNumber: string) => {
  if (!phoneNumber) return "#";
  const digits = phoneNumber.replace(/\D/g, ""); // Remove all non-digit characters
  return `https://wa.me/${digits}`;
};


export default function AdminHostsPageContent() {
  return (
    <div className="space-y-6 h-full flex flex-col p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Gerenciamento de Hosts</h1>
          <p className="text-sm text-muted-foreground">Visualize e gerencie os hosts da agência.</p>
        </div>
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="relative flex-grow sm:flex-grow-0 sm:min-w-[280px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input type="search" placeholder="Buscar hosts (Nome, ID Kako, etc.)..." className="pl-10 w-full h-10" />
          </div>
          <div className="flex items-center gap-2 mt-4 sm:mt-0">
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  Ações
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Banir Host</DropdownMenuItem>
                <DropdownMenuItem>Remover dos Hosts</DropdownMenuItem>
                <DropdownMenuItem>Dar Cargo Admin</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total de Hosts" count={placeholderHosts.length} icon={Users} bgColorClass="bg-blue-500/10" textColorClass="text-blue-500" />
        <StatCard title="Hosts Pendentes" count={placeholderHosts.filter(h => h.status === 'Pendente').length} icon={Clock} bgColorClass="bg-yellow-500/10" textColorClass="text-yellow-500" />
        <StatCard title="Hosts Aprovados" count={placeholderHosts.filter(h => h.status === 'Aprovado').length} icon={CheckCircle} bgColorClass="bg-green-500/10" textColorClass="text-green-500" />
      </div>

      <div className="flex-grow rounded-lg border overflow-hidden shadow-sm bg-card">
        <div className="overflow-x-auto h-full">
          <Table>
            <TableHeader className="bg-muted/50 sticky top-0 z-10">
              <TableRow>
                <TableHead className="w-[50px] px-4">
                  <Checkbox id="select-all-hosts" aria-label="Selecionar todos os hosts" />
                </TableHead>
                <TableHead className="min-w-[200px]">NOME</TableHead>
                <TableHead>PAÍS</TableHead>
                <TableHead>STATUS</TableHead>
                <TableHead>WHATSAPP</TableHead>
                <TableHead className="text-right w-[80px]">AÇÕES</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {placeholderHosts.map((host) => {
                const statusInfo = getStatusStyles(host.status);
                return (
                  <TableRow key={host.id} className="hover:bg-muted/20 transition-colors">
                    <TableCell className="px-4">
                      <Checkbox id={`select-host-${host.id}`} aria-label={`Selecionar host ${host.name}`} />
                    </TableCell>
                    <TableCell className="font-medium">
                      <Link href={`/hosts/${host.kakoId}`} className="flex items-center gap-3 group">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={host.avatarUrl} alt={host.name} data-ai-hint="host avatar" />
                          <AvatarFallback>{host.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <span className="group-hover:text-primary group-hover:underline">{host.name}</span>
                          <div className="text-xs text-muted-foreground">{host.kakoId}</div>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{host.country}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs ${statusInfo.className}`}>
                        {statusInfo.text}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <a 
                        href={formatWhatsAppLink(host.whatsapp)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {host.whatsapp}
                      </a>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Ações para {host.name}</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-muted-foreground pt-2">
        <p>Mostrando 1 a {placeholderHosts.length} de {placeholderHosts.length} resultados</p>
        <div className="flex items-center gap-1 mt-2 sm:mt-0">
          <Button variant="outline" size="sm" className="px-2 h-8 w-8" disabled={true}>&lt;</Button>
          <Button variant="default" size="sm" className="px-3 h-8 w-8">1</Button>
          <Button variant="outline" size="sm" className="px-2 h-8 w-8" disabled={true}>&gt;</Button>
        </div>
      </div>
    </div>
  );
}

