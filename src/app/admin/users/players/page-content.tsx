
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Users, CheckCircle, XCircle, Edit, ChevronDown, Eye, KeyRound } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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

interface AdminPlayer {
  id: string;
  avatarUrl: string;
  appUserId: string; 
  name: string;
  email: string;
  status: 'Ativo' | 'Banido' | 'Pendente';
}

const placeholderPlayers: AdminPlayer[] = [
  { id: "p1", avatarUrl: "https://placehold.co/40x40.png", appUserId: "player001", name: "Ana Jogadora", email: "ana.j@example.com", status: "Ativo" },
  { id: "p2", avatarUrl: "https://placehold.co/40x40.png", appUserId: "player002", name: "Bruno Gamer", email: "bruno.g@example.com", status: "Banido" },
  { id: "p3", avatarUrl: "https://placehold.co/40x40.png", appUserId: "player003", name: "Carla Participante", email: "carla.p@example.com", status: "Pendente" },
];

const getStatusStyles = (status: AdminPlayer['status']) => {
  switch (status) {
    case 'Ativo':
      return { text: 'Ativo', className: 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200' };
    case 'Banido':
      return { text: 'Banido', className: 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200' };
    case 'Pendente':
      return { text: 'Pendente', className: 'bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-200' };
    default:
      return { text: status, className: 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200' };
  }
};

export default function AdminPlayersPageContent() {
  return (
    <div className="space-y-6 h-full flex flex-col p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Gerenciamento de Players</h1>
          <p className="text-sm text-muted-foreground">Visualize e gerencie os players da plataforma.</p>
        </div>
        <div className="relative flex-grow sm:flex-grow-0 sm:min-w-[280px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input type="search" placeholder="Buscar players (Nome, ID, Email...)" className="pl-10 w-full h-10" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total de Players" count={placeholderPlayers.length} icon={Users} bgColorClass="bg-blue-500/10" textColorClass="text-blue-500" />
        <StatCard title="Players Ativos" count={placeholderPlayers.filter(p => p.status === 'Ativo').length} icon={CheckCircle} bgColorClass="bg-green-500/10" textColorClass="text-green-500" />
        <StatCard title="Players Banidos" count={placeholderPlayers.filter(p => p.status === 'Banido').length} icon={XCircle} bgColorClass="bg-red-500/10" textColorClass="text-red-500" />
      </div>

      <div className="flex-grow rounded-lg border overflow-hidden shadow-sm bg-card">
        <div className="overflow-x-auto h-full">
          <Table>
            <TableHeader className="bg-muted/50 sticky top-0 z-10">
              <TableRow>
                <TableHead className="min-w-[200px]">NOME</TableHead>
                <TableHead>STATUS</TableHead>
                <TableHead>EMAIL</TableHead>
                <TableHead className="text-right w-[200px]">AÇÕES</TableHead> 
              </TableRow>
            </TableHeader>
            <TableBody>
              {placeholderPlayers.map((player) => {
                const statusInfo = getStatusStyles(player.status);
                return (
                  <TableRow key={player.id} className="hover:bg-muted/20 transition-colors">
                    <TableCell className="font-medium">
                      <Link href={`/users/${player.appUserId}`} className="flex items-center gap-3 group">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={player.avatarUrl} alt={player.name} data-ai-hint="player avatar" />
                          <AvatarFallback>{player.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <span className="group-hover:text-primary group-hover:underline">{player.name}</span>
                          <div className="text-xs text-muted-foreground">{player.appUserId}</div>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs ${statusInfo.className}`}>
                        {statusInfo.text}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <a 
                        href={`mailto:${player.email}`}
                        className="text-primary hover:underline"
                      >
                        {player.email}
                      </a>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="sm" className="h-8 px-2 text-xs">
                          <Edit className="h-3 w-3 mr-1" />
                          Editar
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 px-2 text-xs">
                              Ações
                              <ChevronDown className="h-3 w-3 ml-1" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                               <XCircle className="mr-2 h-4 w-4" />
                              Banir Player
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                                <Eye className="mr-2 h-4 w-4" />
                                Ver Detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <KeyRound className="mr-2 h-4 w-4" />
                                Resetar Senha
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-muted-foreground pt-2">
        <p>Mostrando 1 a {placeholderPlayers.length} de {placeholderPlayers.length} resultados</p>
        <div className="flex items-center gap-1 mt-2 sm:mt-0">
          <Button variant="outline" size="sm" className="px-2 h-8 w-8" disabled={true}>&lt;</Button>
          <Button variant="default" size="sm" className="px-3 h-8 w-8">1</Button>
          <Button variant="outline" size="sm" className="px-2 h-8 w-8" disabled={true}>&gt;</Button>
        </div>
      </div>
    </div>
  );
}
