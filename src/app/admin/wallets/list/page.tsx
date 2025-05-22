
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, RefreshCw, WalletCards as WalletCardsIcon } from 'lucide-react'; 
import LoadingSpinner from '@/components/ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import type { UserWallet } from '@/types';
import { collection, getDocs, orderBy, query, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AdminWalletsListPage() {
  const [wallets, setWallets] = useState<UserWallet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const { toast } = useToast();

  const fetchWallets = useCallback(async () => {
    setIsLoading(true);
    try {
      const walletsCollectionRef = collection(db, "userWallets");
      // Order by kakoId for consistent listing, or lastUpdatedAt if preferred
      const q = query(walletsCollectionRef, orderBy("kakoId", "asc")); 
      const querySnapshot = await getDocs(q);
      const fetchedWallets: UserWallet[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        fetchedWallets.push({
          id: doc.id,
          kakoId: data.kakoId,
          diamonds: data.diamonds,
          lastUpdatedAt: data.lastUpdatedAt instanceof Timestamp ? data.lastUpdatedAt.toDate() : (data.lastUpdatedAt ? new Date(data.lastUpdatedAt) : undefined),
        } as UserWallet);
      });
      setWallets(fetchedWallets);
      setLastFetched(new Date());
      if(fetchedWallets.length === 0) {
        toast({ title: "Nenhuma Carteira Encontrada", description: "Não há carteiras cadastradas no banco de dados." });
      }
    } catch (error) {
      console.error("Erro ao carregar carteiras:", error);
      toast({ title: "Erro ao Carregar", description: "Não foi possível carregar as carteiras do banco de dados.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchWallets();
  }, [fetchWallets]);

  return (
    <div className="p-6 space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-foreground">Listar Carteiras</h1>
        <Button variant="outline" onClick={fetchWallets} disabled={isLoading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar Lista
        </Button>
      </div>
      {lastFetched && (
        <p className="text-xs text-muted-foreground">
          Lista atualizada {formatDistanceToNow(lastFetched, { addSuffix: true, locale: ptBR })}
        </p>
      )}

      <Card className="flex-grow flex flex-col min-h-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <WalletCardsIcon className="mr-2 h-5 w-5 text-primary" />
            Carteiras de Usuários
          </CardTitle>
          <CardDescription>
            Visualize os saldos de diamantes associados aos IDs Kako (FUID/ShowID).
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow p-0 flex flex-col min-h-0">
          <div className="overflow-y-auto flex-grow">
            {isLoading ? (
              <div className="flex justify-center items-center h-full">
                <LoadingSpinner size="lg" />
                <p className="ml-2 text-muted-foreground">Carregando carteiras...</p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-muted sticky top-0 z-10">
                  <TableRow>
                    <TableHead>ID Kako (FUID/ShowID)</TableHead>
                    <TableHead className="text-right">Saldo de Diamantes</TableHead>
                    <TableHead className="text-right">Última Atualização</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {wallets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                        Nenhuma carteira encontrada no banco de dados.
                      </TableCell>
                    </TableRow>
                  ) : (
                    wallets.map((wallet) => (
                      <TableRow key={wallet.id || wallet.kakoId} className="hover:bg-muted/20">
                        <TableCell className="font-mono text-xs">{wallet.kakoId}</TableCell>
                        <TableCell className="text-right font-semibold text-primary">
                          <DollarSign className="inline-block mr-1 h-4 w-4 text-yellow-500" />
                          {wallet.diamonds.toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">
                          {wallet.lastUpdatedAt ? formatDistanceToNow(new Date(wallet.lastUpdatedAt), { addSuffix: true, locale: ptBR }) : 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
        <CardFooter className="pt-2 border-t flex justify-center">
          <p className="text-xs text-muted-foreground">
            Mostrando {wallets.length} carteiras.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
