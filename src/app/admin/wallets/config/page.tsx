
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Save, Settings2 as Settings2Icon } from 'lucide-react'; // Renamed to avoid conflict
import LoadingSpinner from '@/components/ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import type { WalletConfig } from '@/types';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function AdminWalletsConfigPage() {
  const [config, setConfig] = useState<WalletConfig>({
    autoAddDiamondsOnGift: false,
    autoAddThreshold: 10,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const configDocRef = doc(db, "app_settings", "wallet_config");

  useEffect(() => {
    const fetchConfig = async () => {
      setIsLoading(true);
      try {
        const docSnap = await getDoc(configDocRef);
        if (docSnap.exists()) {
          setConfig(docSnap.data() as WalletConfig);
        } else {
          // If no config exists, save initial defaults
          await setDoc(configDocRef, { ...config, lastUpdatedAt: serverTimestamp() });
        }
      } catch (error) {
        console.error("Erro ao carregar configuração da carteira:", error);
        toast({ title: "Erro ao Carregar", description: "Não foi possível carregar as configurações.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    fetchConfig();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaveConfig = async () => {
    setIsSaving(true);
    try {
      await setDoc(configDocRef, { ...config, lastUpdatedAt: serverTimestamp() });
      toast({ title: "Configurações Salvas", description: "As configurações da carteira foram salvas." });
    } catch (error) {
      console.error("Erro ao salvar configuração da carteira:", error);
      toast({ title: "Erro ao Salvar", description: "Não foi possível salvar as configurações.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex justify-center items-center h-full">
        <LoadingSpinner size="lg" />
        <p className="ml-2 text-muted-foreground">Carregando configurações...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 h-full flex flex-col">
      <h1 className="text-2xl font-semibold text-foreground">Configurar Carteira</h1>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings2Icon className="mr-2 h-5 w-5 text-primary" />
            Configurações de Adição Automática de Diamantes
          </CardTitle>
          <CardDescription>
            Defina as regras para quando os diamantes de recompensas de presentes são automaticamente adicionados às carteiras dos usuários.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-3 p-4 border rounded-lg bg-muted/30">
            <Switch
              id="autoAddDiamonds"
              checked={config.autoAddDiamondsOnGift}
              onCheckedChange={(checked) => setConfig(prev => ({ ...prev, autoAddDiamondsOnGift: checked }))}
            />
            <Label htmlFor="autoAddDiamonds" className="text-sm font-medium cursor-pointer flex-1">
              Permitir adição automática de diamantes por recompensas de presentes a IDs Kako (mesmo não registrados em 'accounts').
            </Label>
          </div>

          {config.autoAddDiamondsOnGift && (
            <div className="space-y-2 p-4 border rounded-lg bg-muted/30">
              <Label htmlFor="autoAddThreshold" className="text-sm font-medium">
                Valor mínimo da recompensa para adição automática (diamantes):
              </Label>
              <Input
                id="autoAddThreshold"
                type="number"
                value={config.autoAddThreshold}
                onChange={(e) => setConfig(prev => ({ ...prev, autoAddThreshold: parseInt(e.target.value, 10) || 0 }))}
                min="1"
                className="max-w-xs"
              />
              <p className="text-xs text-muted-foreground">
                Se um presente recebido por um ID Kako resultar em uma recompensa de diamantes igual ou superior a este valor, os diamantes serão adicionados à sua carteira.
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="border-t pt-6">
          <Button onClick={handleSaveConfig} disabled={isSaving}>
            {isSaving ? <LoadingSpinner size="sm" className="mr-2" /> : <Save className="mr-2 h-4 w-4" />}
            Salvar Configurações
          </Button>
        </CardFooter>
      </Card>
       <div className="mt-auto pt-6 text-xs text-muted-foreground">
        <p><strong>Nota:</strong> A lógica real para adicionar diamantes automaticamente com base nessas configurações precisaria ser implementada em um backend (por exemplo, Firebase Cloud Functions) que processa eventos de presentes.</p>
      </div>
    </div>
  );
}
