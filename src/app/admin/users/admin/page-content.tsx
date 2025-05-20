
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, UserCog, Edit, ChevronDown, ShieldCheck, Award, UserCheck as UserCheckIcon } from "lucide-react"; // Changed User to UserCheckIcon to avoid name collision
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import React, { useState, useEffect, useCallback } from "react";
import { db, doc, updateDoc, serverTimestamp, getDocs, collection, query, where, type UserProfile } from "@/lib/firebase";
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
  adminLevel: 'master' | 'admin' | 'suporte';
}

const getAdminLevelBadgeVariant = (adminLevel: AdminAccount['adminLevel']) => {
  switch (adminLevel) {
    case 'master':
      return 'destructive'; // Or a gold/purple color
    case 'admin':
      return 'default'; // Blue
    case 'suporte':
      return 'secondary'; // Gray or a lighter blue/green
    default:
      return 'outline';
  }
};

export default function AdminAdminsPageContent() {
  const [adminAccounts, setAdminAccounts] = useState<AdminAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const fetchAdminAccounts = useCallback(async () => {
    setIsLoading(true);
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("adminLevel", "in", ["master", "admin", "suporte"]));
      const querySnapshot = await getDocs(q);
      const fetchedAdmins: AdminAccount[] = [];
      querySnapshot.forEach((docSnap) => {
        const userData = docSnap.data() as UserProfile;
        if (userData.adminLevel) { // Ensure adminLevel is not null
            fetchedAdmins.push({
            id: docSnap.id,
            name: userData.profileName || userData.displayName || "N/A",
            avatarUrl: userData.photoURL,
            email: userData.email || "N/A",
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

  const filteredAdminAccounts = adminAccounts.filter(admin =>
    admin.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.email?.toLowerCase().includes(searchTerm.toLowerCase())
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
    <div className="space-y-6 h-full flex flex-col p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Gerenciamento de Contas Admin</h1>
          <p className="text-sm text-muted-foreground">Visualize e gerencie os administradores da plataforma.</p>
        </div>
        <div className="relative flex-grow sm:flex-grow-0 sm:min-w-[280px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar admins (Nome, Email...)"
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
                          <div className="text-xs text-muted-foreground">{admin.email}</div>
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
                            <DropdownMenuItem onSelect={() => console.log("Modificar nível:", admin.id)}>
                               Modificar Nível
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                                onSelect={() => console.log("Revogar acesso:", admin.id)}
                            >
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
  );
}

    