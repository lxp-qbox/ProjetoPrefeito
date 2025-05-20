
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Users, Clock, CheckCircle, XCircle, Edit, ChevronDown, User, Trash2 } from "lucide-react";
import Link from "next/link";
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
import React, { useState, useEffect, useCallback } from "react";
import { db, doc, updateDoc, serverTimestamp, getDocs, collection, query, where, deleteDoc, type UserProfile } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/ui/loading-spinner";

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
  id: string; // User UID
  avatarUrl?: string | null;
  isLive: boolean;
  kakoId?: string;
  name?: string;
  whatsapp?: string;
  status: 'Aprovado' | 'Pendente' | 'Banido';
}


const getStatusStyles = (status: AdminHost['status']) => {
  switch (status) {
    case 'Aprovado':
      return { text: 'Ativo', className: 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200' };
    case 'Pendente':
      return { text: 'Pendente', className: 'bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-200' };
    case 'Banido':
      return { text: 'Banido', className: 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200' };
    default:
      return { text: status, className: 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200' };
  }
};

const formatWhatsAppLink = (phoneNumber?: string) => {
  if (!phoneNumber) return "#";
  const digits = phoneNumber.replace(/\D/g, "");
  return `https://wa.me/${digits}`;
};


export default function AdminHostsPageContent() {
  const [adminHosts, setAdminHosts] = useState<AdminHost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const [hostToDelete, setHostToDelete] = useState<AdminHost | null>(null);
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);

  const fetchHosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("role", "==", "host"));
      const querySnapshot = await getDocs(q);
      const fetchedHosts: AdminHost[] = [];
      querySnapshot.forEach((docSnap) => {
        const userData = docSnap.data() as UserProfile;
        let status: AdminHost['status'] = 'Pendente';
        if (userData.hostStatus === 'approved') {
          status = 'Aprovado';
        } else if (userData.hostStatus === 'banned') {
          status = 'Banido';
        }

        fetchedHosts.push({
          id: docSnap.id,
          name: userData.profileName || userData.displayName || "N/A",
          avatarUrl: userData.photoURL,
          kakoId: userData.kakoLiveId,
          whatsapp: userData.phoneNumber,
          isLive: Math.random() > 0.5, // Placeholder for live status
          status: status,
        });
      });
      setAdminHosts(fetchedHosts);
    } catch (error) {
      console.error("Error fetching hosts:", error);
      toast({
        title: "Erro ao buscar hosts",
        description: "Não foi possível carregar a lista de hosts.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchHosts();
  }, [fetchHosts]);


  const handleRemoveHostRole = async (hostId: string) => {
    if (!hostId) {
      toast({ title: "Erro", description: "ID do host inválido.", variant: "destructive" });
      return;
    }
    try {
      const userDocRef = doc(db, "users", hostId);
      await updateDoc(userDocRef, {
        role: 'player',
        adminLevel: null,
        hostStatus: 'pending_review', // Or another appropriate default
        updatedAt: serverTimestamp(),
      });

      setAdminHosts(prevHosts => prevHosts.filter(h => h.id !== hostId));
      toast({
        title: "Host Removido",
        description: "A função do usuário foi alterada para 'player', nível de admin removido e status de host atualizado.",
      });

    } catch (error) {
      console.error("Erro ao remover função de host:", error);
      toast({
        title: "Erro",
        description: "Não foi possível remover a função de host. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleBanHost = async (hostId: string) => {
    console.log("Solicitado banir host:", hostId);
    try {
        const userDocRef = doc(db, "users", hostId);
        await updateDoc(userDocRef, {
            hostStatus: 'banned',
            isBanned: true, // You might have a general isBanned field too
            bannedAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        toast({ title: "Host Banido", description: "O status do host foi atualizado para banido."});
        fetchHosts(); // Refresh list
    } catch (error) {
        console.error("Erro ao banir host:", error);
        toast({ title: "Erro ao Banir", description: "Não foi possível banir o host.", variant: "destructive"});
    }
  };

  const handleRequestDeleteAccount = (host: AdminHost) => {
    setHostToDelete(host);
    setIsConfirmDeleteDialogOpen(true);
  };

  const handleConfirmDeleteAccount = async () => {
    if (!hostToDelete) return;
    try {
      await deleteDoc(doc(db, "users", hostToDelete.id));
      setAdminHosts(prevHosts => prevHosts.filter(h => h.id !== hostToDelete.id));
      toast({
        title: "Conta Excluída (Firestore)",
        description: `O perfil de ${hostToDelete.name} foi excluído do banco de dados. ATENÇÃO: A conta de autenticação do Firebase ainda existe e precisa ser removida manualmente no Firebase Console.`,
        variant: "default",
        duration: 9000,
      });
    } catch (error) {
      console.error("Erro ao excluir conta do Firestore:", error);
      toast({
        title: "Erro ao Excluir",
        description: "Não foi possível excluir o perfil do host do Firestore.",
        variant: "destructive",
      });
    } finally {
      setIsConfirmDeleteDialogOpen(false);
      setHostToDelete(null);
    }
  };


  const filteredHosts = adminHosts.filter(host =>
    host.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    host.kakoId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const approvedHostsCount = adminHosts.filter(h => h.status === 'Aprovado').length;
  const pendingHostsCount = adminHosts.filter(h => h.status === 'Pendente').length;


  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full p-6">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <>
      <div className="p-6 space-y-6 h-full flex flex-col">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Gerenciamento de Hosts</h1>
            <p className="text-sm text-muted-foreground">Visualize e gerencie os hosts da agência.</p>
          </div>
          <div className="relative flex-grow sm:flex-grow-0 sm:min-w-[280px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar hosts (Nome, ID Kako, etc.)..."
                className="pl-10 w-full h-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard title="Total de Hosts" count={adminHosts.length} icon={Users} bgColorClass="bg-blue-500/10" textColorClass="text-blue-500" />
          <StatCard title="Hosts Pendentes" count={pendingHostsCount} icon={Clock} bgColorClass="bg-yellow-500/10" textColorClass="text-yellow-500" />
          <StatCard title="Hosts Aprovados" count={approvedHostsCount} icon={CheckCircle} bgColorClass="bg-green-500/10" textColorClass="text-green-500" />
        </div>

        <div className="flex-grow rounded-lg border overflow-hidden shadow-sm bg-card">
          <div className="overflow-x-auto h-full">
            <Table>
              <TableHeader className="bg-muted/50 sticky top-0 z-10">
                <TableRow>
                  <TableHead className="w-[60px] px-4 text-center">LIVE</TableHead>
                  <TableHead className="min-w-[200px]">NOME</TableHead>
                  <TableHead>WHATSAPP</TableHead>
                  <TableHead>STATUS</TableHead>
                  <TableHead className="text-right w-[200px]">AÇÕES</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHosts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      Nenhum host encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredHosts.map((host) => {
                    const statusInfo = getStatusStyles(host.status);
                    return (
                      <TableRow key={host.id} className="hover:bg-muted/20 transition-colors">
                        <TableCell className="px-4 text-center">
                          <span className={`h-3 w-3 rounded-full inline-block ${host.isLive ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        </TableCell>
                        <TableCell className="font-medium">
                          <Link href={`/hosts/${host.kakoId || host.id}`} className="flex items-center gap-3 group">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={host.avatarUrl || undefined} alt={host.name || "Host"} data-ai-hint="host avatar" />
                              <AvatarFallback>{host.name ? host.name.substring(0, 2).toUpperCase() : <User />}</AvatarFallback>
                            </Avatar>
                            <div>
                              <span className="group-hover:text-primary group-hover:underline">{host.name}</span>
                              <div className="text-xs text-muted-foreground">{host.kakoId || "N/A"}</div>
                            </div>
                          </Link>
                        </TableCell>
                        <TableCell>
                          <a
                            href={formatWhatsAppLink(host.whatsapp)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {host.whatsapp || "N/A"}
                          </a>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-xs ${statusInfo.className}`}>
                            {statusInfo.text}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="outline" size="sm" className="h-8 px-2 text-xs" asChild>
                              <Link href={`/admin/hosts/${host.id}/edit`}>
                                <Edit className="h-3 w-3 mr-1" />
                                Editar
                              </Link>
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="h-8 px-2 text-xs">
                                  Ações
                                  <ChevronDown className="h-3 w-3 ml-1" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                    className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                                    onSelect={() => handleBanHost(host.id)}
                                >
                                   <XCircle className="mr-2 h-4 w-4" />
                                  Banir Host
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onSelect={() => handleRemoveHostRole(host.id)}>
                                    Remover dos Hosts
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => {/* Implement Give Admin Role Logic */}}>
                                    Dar Cargo Admin
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                                  onSelect={() => handleRequestDeleteAccount(host)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Excluir Conta (Firestore)
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-muted-foreground pt-2">
          <p>Mostrando 1 a {filteredHosts.length} de {filteredHosts.length} resultados</p>
          <div className="flex items-center gap-1 mt-2 sm:mt-0">
            <Button variant="outline" size="sm" className="px-2 h-8 w-8" disabled={true}>&lt;</Button>
            <Button variant="default" size="sm" className="px-3 h-8 w-8">1</Button>
            <Button variant="outline" size="sm" className="px-2 h-8 w-8" disabled={true}>&gt;</Button>
          </div>
        </div>
      </div>

      {hostToDelete && (
        <AlertDialog open={isConfirmDeleteDialogOpen} onOpenChange={setIsConfirmDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Você tem certeza que deseja excluir o perfil de <span className="font-semibold">{hostToDelete.name}</span> do Firestore?
                <br />
                <strong className="text-destructive">Esta ação não pode ser desfeita.</strong>
                <br />
                A conta de autenticação do Firebase ainda precisará ser removida manualmente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setIsConfirmDeleteDialogOpen(false)}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDeleteAccount}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              >
                Excluir Perfil (Firestore)
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}

    