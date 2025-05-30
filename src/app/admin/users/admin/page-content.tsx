
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, UserCog, Edit, ChevronDown, ShieldCheck, Award, UserCheck as UserCheckIcon, ShieldOff, Trash2 } from "lucide-react"; 
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
import { db, doc, updateDoc, serverTimestamp, getDocs, collection, query, where, type UserProfile, deleteDoc } from "@/lib/firebase";
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

interface AdminAccount {
  id: string; // User UID
  avatarUrl?: string | null;
  name?: string;
  email?: string;
  kakoShowId?: string;
  adminLevel: 'master' | 'admin' | 'suporte';
}

const getAdminLevelBadgeVariant = (adminLevel: AdminAccount['adminLevel']) => {
  switch (adminLevel) {
    case 'master':
      return 'destructive'; 
    case 'admin':
      return 'default'; 
    case 'suporte':
      return 'secondary'; 
    default:
      return 'outline';
  }
};

export default function AdminAdminsPageContent() {
  const [adminAccounts, setAdminAccounts] = useState<AdminAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const [adminToRevoke, setAdminToRevoke] = useState<AdminAccount | null>(null);
  const [isConfirmRevokeDialogOpen, setIsConfirmRevokeDialogOpen] = useState(false);

  const fetchAdminAccounts = useCallback(async () => {
    setIsLoading(true);
    try {
      const accountsRef = collection(db, "accounts");
      const q = query(accountsRef, where("adminLevel", "in", ["master", "admin", "suporte"]));
      const querySnapshot = await getDocs(q);
      const fetchedAdmins: AdminAccount[] = [];
      querySnapshot.forEach((docSnap) => {
        const userData = docSnap.data() as UserProfile;
        if (userData.adminLevel) { 
            fetchedAdmins.push({
            id: docSnap.id,
            name: userData.profileName || userData.displayName || "N/A",
            avatarUrl: userData.photoURL,
            email: userData.email || "N/A",
            kakoShowId: userData.kakoShowId,
            adminLevel: userData.adminLevel,
          });
        }
      });
      setAdminAccounts(fetchedAdmins);
    } catch (error) {
      console.error("Error fetching admin accounts:", error);
      toast({
        title: "Erro ao buscar contas admin",
        description: "Não foi possível carregar a lista de administradores.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAdminAccounts();
  }, [fetchAdminAccounts]);

  const handleRequestRevokeAdminAccess = (admin: AdminAccount) => {
    setAdminToRevoke(admin);
    setIsConfirmRevokeDialogOpen(true);
  };

  const handleConfirmRevokeAdminAccess = async () => {
    if (!adminToRevoke) return;
    try {
      const userDocRef = doc(db, "accounts", adminToRevoke.id);
      await updateDoc(userDocRef, {
        adminLevel: null,
        updatedAt: serverTimestamp(),
      });
      setAdminAccounts(prevAdmins => prevAdmins.filter(a => a.id !== adminToRevoke.id));
      toast({
        title: "Acesso Revogado",
        description: `O acesso administrativo de ${adminToRevoke.name} foi revogado.`,
      });
    } catch (error) {
      console.error("Erro ao revogar acesso admin:", error);
      toast({
        title: "Erro ao Revogar Acesso",
        description: "Não foi possível revogar o acesso administrativo. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsConfirmRevokeDialogOpen(false);
      setAdminToRevoke(null);
    }
  };

  const filteredAdminAccounts = adminAccounts.filter(admin =>
    admin.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.kakoShowId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const masterCount = adminAccounts.filter(a => a.adminLevel === 'master').length;
  const adminCount = adminAccounts.filter(a => a.adminLevel === 'admin').length;
  const supportCount = adminAccounts.filter(a => a.adminLevel === 'suporte').length;

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
            <h1 className="text-2xl font-semibold text-foreground">Gerenciamento de Contas Admin</h1>
            <p className="text-sm text-muted-foreground">Visualize e gerencie os administradores da plataforma.</p>
          </div>
          <div className="relative flex-grow sm:flex-grow-0 sm:min-w-[280px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar admins (Nome, Email, Show ID...)"
              className="pl-10 w-full h-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total de Admins" count={adminAccounts.length} icon={UserCog} bgColorClass="bg-purple-500/10" textColorClass="text-purple-500" />
          <StatCard title="Contas Master" count={masterCount} icon={Award} bgColorClass="bg-yellow-500/10" textColorClass="text-yellow-500" />
          <StatCard title="Contas Admin" count={adminCount} icon={ShieldCheck} bgColorClass="bg-blue-500/10" textColorClass="text-blue-500" />
          <StatCard title="Contas Suporte" count={supportCount} icon={UserCheckIcon} bgColorClass="bg-green-500/10" textColorClass="text-green-500" />
        </div>

        <div className="flex-grow rounded-lg border overflow-hidden shadow-sm bg-card">
          <div className="overflow-x-auto h-full">
            <Table>
              <TableHeader className="bg-muted/50 sticky top-0 z-10">
                <TableRow>
                  <TableHead className="min-w-[250px]">NOME</TableHead>
                  <TableHead>NÍVEL ADMIN</TableHead>
                  <TableHead className="text-right w-[200px]">AÇÕES</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAdminAccounts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                      Nenhuma conta admin encontrada.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAdminAccounts.map((admin) => (
                    <TableRow key={admin.id} className="hover:bg-muted/20 transition-colors">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3 group">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={admin.avatarUrl || undefined} alt={admin.name || "Admin"} data-ai-hint="admin avatar" />
                            <AvatarFallback>{admin.name ? admin.name.substring(0, 2).toUpperCase() : 'AD'}</AvatarFallback>
                          </Avatar>
                          <div>
                            <span className="group-hover:text-primary">{admin.name}</span>
                            <div className="text-xs text-muted-foreground">
                              Email: {admin.email} <br />
                              Show ID: {admin.kakoShowId || "N/A"}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getAdminLevelBadgeVariant(admin.adminLevel)} className="capitalize">
                          {admin.adminLevel}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="outline" size="sm" className="h-8 px-2 text-xs" asChild>
                            <Link href={`/admin/hosts/${admin.id}/edit`}> {/* Link to host edit page */}
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
                              <DropdownMenuItem onSelect={() => toast({title: "Modificar Nível", description: "Funcionalidade em desenvolvimento."})}>
                                 Modificar Nível
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                  className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                                  onSelect={() => handleRequestRevokeAdminAccess(admin)}
                                  disabled={admin.adminLevel === 'master' && admin.kakoShowId === '10933200'} // Prevent revoking master admin with special ID
                              >
                                 <ShieldOff className="mr-2 h-4 w-4" />
                                 Revogar Acesso Admin
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
          <p>Mostrando 1 a {filteredAdminAccounts.length} de {filteredAdminAccounts.length} resultados</p>
          <div className="flex items-center gap-1 mt-2 sm:mt-0">
            <Button variant="outline" size="sm" className="px-2 h-8 w-8" disabled={true}>&lt;</Button>
            <Button variant="default" size="sm" className="px-3 h-8 w-8">1</Button>
            <Button variant="outline" size="sm" className="px-2 h-8 w-8" disabled={true}>&gt;</Button>
          </div>
        </div>
      </div>

      {adminToRevoke && (
        <AlertDialog open={isConfirmRevokeDialogOpen} onOpenChange={setIsConfirmRevokeDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Revogação de Acesso</AlertDialogTitle>
              <AlertDialogDescription>
                Você tem certeza que deseja revogar o acesso administrativo de <span className="font-semibold">{adminToRevoke.name}</span>?
                Eles manterão sua função base (host/player).
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setIsConfirmRevokeDialogOpen(false)}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmRevokeAdminAccess}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              >
                Revogar Acesso
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}


