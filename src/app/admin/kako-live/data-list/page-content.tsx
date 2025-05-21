
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Users, Wifi, Edit, ChevronDown, Eye, RefreshCw, UserCircle2, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { KakoProfile } from "@/types";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";

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

// Updated placeholder data to match the new JSON structure
const placeholderKakoProfiles: KakoProfile[] = [
  {
    id: "b2f7260f233746e19ebac80d31d82908", // userId
    nickname: "Janyᵃᵍⁿᵉˣᵘˢ✨️",
    avatarUrl: "https://godzilla-live-oss.kako.live/avatar/b2f7260f233746e19ebac80d31d82908/20250509/1746802335031.jpg/200x200", // avatar
    level: 24,
    numId: 1000360701,
    gender: 2,
    showId: "10956360",
    isLiving: true,
  },
  {
    id: "0322d2dd57e74a028a9e72c2fae1fd9a",
    nickname: "PRESIDENTE",
    avatarUrl: "https://godzilla-live-oss.kako.live/avatar/0322d2dd57e74a028a9e72c2fae1fd9a/20250516/1747436206391.jpg/200x200",
    level: 39,
    numId: 1008850234,
    isLiving: true,
    gender: 1,
    showId: "10763129",
  },
  {
    id: "c2e7c033b41243b5b09f42aa50edf4a1",
    nickname: "KAROL❤️WILLIAN🦊FOX",
    avatarUrl: "https://godzilla-live-oss.kako.live/avatar/c2e7c033b41243b5b09f42aa50edf4a1/20250514/1747241154907.jpg/200x200",
    level: 22,
    numId: 1001007128,
    isLiving: false,
    gender: 2,
    showId: "10433584",
  },
  {
    id: "d4e4ed8946bc40f483ca2da95164a90b",
    nickname: "ALENE",
    avatarUrl: "https://godzilla-live-oss.kako.live/avatar/d4e4ed8946bc40f483ca2da95164a90b/20250509/1746753809206.jpg/200x200",
    level: 21,
    numId: 1005155088,
    isLiving: true,
    gender: 2,
    showId: "10800907",
  },
];


export default function AdminKakoLiveDataListPageContent() {
  const [kakoProfiles, setKakoProfiles] = useState<KakoProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const [profileToDelete, setProfileToDelete] = useState<KakoProfile | null>(null);
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
  const [isConfirmClearDialogOpen, setIsConfirmClearDialogOpen] = useState(false);


  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      setKakoProfiles(placeholderKakoProfiles);
      setIsLoading(false);
    }, 1000);
  }, []);

  const handleRequestDeleteProfile = (profile: KakoProfile) => {
    setProfileToDelete(profile);
    setIsConfirmDeleteDialogOpen(true);
  };

  const handleConfirmDeleteProfile = () => {
    if (!profileToDelete) return;
    setKakoProfiles(prevProfiles => prevProfiles.filter(p => p.id !== profileToDelete.id));
    toast({
      title: "Perfil Removido (Localmente)",
      description: `O perfil de ${profileToDelete.nickname} foi removido da lista.`,
    });
    setIsConfirmDeleteDialogOpen(false);
    setProfileToDelete(null);
  };

  const handleConfirmClearList = () => {
    setKakoProfiles([]);
    toast({
      title: "Lista Zerada",
      description: "Todos os perfis foram removidos da lista atual.",
    });
    setIsConfirmClearDialogOpen(false);
  };

  const filteredProfiles = kakoProfiles.filter(profile =>
    profile.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (profile.numId && profile.numId.toString().includes(searchTerm)) ||
    (profile.showId && profile.showId.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const onlineProfilesCount = kakoProfiles.filter(p => p.isLiving).length;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full p-6">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6 h-full flex flex-col p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Lista de Perfis do Kako Live</h1>
            <p className="text-sm text-muted-foreground">Visualize dados de perfis (simulado).</p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-grow sm:flex-grow-0 sm:min-w-[280px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar perfis (Nome, ID Kako...)"
                  className="pl-10 w-full h-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" onClick={() => setIsConfirmClearDialogOpen(true)} className="h-10">
                <Trash2 className="mr-2 h-4 w-4" />
                Zerar Lista
              </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-1 gap-4"> {/* Changed to 1 column for stat cards */}
          <StatCard title="Total de Perfis Carregados" count={kakoProfiles.length} icon={Users} bgColorClass="bg-sky-500/10" textColorClass="text-sky-500" />
        </div>

        <div className="flex-grow rounded-lg border overflow-hidden shadow-sm bg-card">
          <div className="overflow-x-auto h-full">
            <Table>
              <TableHeader className="bg-muted/50 sticky top-0 z-10">
                <TableRow>
                  <TableHead className="w-[60px] px-4"></TableHead> {/* Avatar */}
                  <TableHead className="min-w-[150px]">NICKNAME</TableHead>
                  <TableHead>NÍVEL</TableHead>
                  <TableHead>USER ID (FUID)</TableHead>
                  <TableHead className="text-right w-[150px]">AÇÕES</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProfiles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      Nenhum perfil encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProfiles.map((profile) => (
                    <TableRow key={profile.id} className="hover:bg-muted/20 transition-colors">
                      <TableCell className="px-4">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={profile.avatarUrl || undefined} alt={profile.nickname} data-ai-hint="user avatar" />
                          <AvatarFallback>
                              {profile.nickname ? profile.nickname.substring(0,2).toUpperCase() : <UserCircle2 />}
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-medium">
                          {profile.nickname}
                          {profile.isLiving && <span className="ml-2 h-2 w-2 rounded-full inline-block bg-green-500" title="Online"></span>}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          Nível {profile.level || "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{profile.id}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="outline" size="sm" className="h-8 px-2 text-xs" onClick={() => toast({title: "Visualizar Detalhes", description:"Funcionalidade em desenvolvimento."})}>
                            <Eye className="h-3 w-3 mr-1" />
                            Detalhes
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm" className="h-8 px-2 text-xs">
                                Ações
                                <ChevronDown className="h-3 w-3 ml-1" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onSelect={() => toast({title: "Sincronizar Dados", description:"Funcionalidade em desenvolvimento."})}>
                                 <RefreshCw className="mr-2 h-4 w-4" />
                                 Sincronizar Dados
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                                onSelect={() => handleRequestDeleteProfile(profile)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Remover da Lista (Local)
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-muted-foreground pt-2">
          <p>Mostrando 1 a {filteredProfiles.length} de {filteredProfiles.length} resultados</p>
          <div className="flex items-center gap-1 mt-2 sm:mt-0">
            <Button variant="outline" size="sm" className="px-2 h-8 w-8" disabled={true}>&lt;</Button>
            <Button variant="default" size="sm" className="px-3 h-8 w-8">1</Button>
            <Button variant="outline" size="sm" className="px-2 h-8 w-8" disabled={true}>&gt;</Button>
          </div>
        </div>
      </div>

      {profileToDelete && (
        <AlertDialog open={isConfirmDeleteDialogOpen} onOpenChange={setIsConfirmDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Remoção</AlertDialogTitle>
              <AlertDialogDescription>
                Você tem certeza que deseja remover o perfil de <span className="font-semibold">{profileToDelete.nickname}</span> da lista? Esta ação é apenas local e não afeta dados externos.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setIsConfirmDeleteDialogOpen(false)}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDeleteProfile}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              >
                Remover
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      <AlertDialog open={isConfirmClearDialogOpen} onOpenChange={setIsConfirmClearDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Zerar Lista</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem certeza que deseja remover todos os perfis da lista atual? Esta ação não pode ser desfeita para a visualização atual.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsConfirmClearDialogOpen(false)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmClearList}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Zerar Lista
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
