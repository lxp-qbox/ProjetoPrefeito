
"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ServerOff, Gamepad2, MessageSquare, CreditCard } from "lucide-react";

interface ModuleStatus {
  id: string;
  name: string;
  icon: React.ElementType;
  isOffline: boolean;
}

const initialModules: ModuleStatus[] = [
  { id: "bingo_games", name: "Jogos de Bingo", icon: Gamepad2, isOffline: false },
  { id: "live_chat", name: "Chat Ao Vivo", icon: MessageSquare, isOffline: false },
  { id: "payments", name: "Sistema de Pagamentos", icon: CreditCard, isOffline: false },
  // Adicione mais módulos conforme necessário
];

export default function AdminMaintenanceOfflinePage() {
  const [modules, setModules] = useState<ModuleStatus[]>(initialModules);

  const handleToggleModule = (moduleId: string) => {
    setModules((prevModules) =>
      prevModules.map((module) =>
        module.id === moduleId ? { ...module, isOffline: !module.isOffline } : module
      )
    );
    // Aqui você adicionaria a lógica para comunicar essa mudança ao backend
    console.log(`Module ${moduleId} toggled to ${!modules.find(m=>m.id === moduleId)?.isOffline}`);
  };

  return (
    <div className="space-y-6 bg-card p-6 rounded-lg shadow-lg h-full">
      <h1 className="text-2xl font-semibold text-foreground">Gerenciar Status Offline de Módulos</h1>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ServerOff className="mr-2 h-6 w-6 text-primary" />
            Controle de Módulos Offline
          </CardTitle>
          <CardDescription>
            Ative ou desative módulos específicos do site. Módulos offline exibirão uma mensagem de manutenção para os usuários. 
            <strong className="text-destructive"> (Funcionalidade em desenvolvimento - os toggles são apenas visuais).</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <div key={module.id} className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50">
                <div className="flex items-center">
                  <Icon className="mr-3 h-5 w-5 text-muted-foreground" />
                  <Label htmlFor={`module-${module.id}`} className="text-sm font-medium">
                    {module.name}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id={`module-${module.id}`}
                    checked={module.isOffline}
                    onCheckedChange={() => handleToggleModule(module.id)}
                    aria-label={`Status offline para ${module.name}`}
                  />
                  <span className={`text-xs font-semibold ${module.isOffline ? 'text-destructive' : 'text-green-600'}`}>
                    {module.isOffline ? "Offline" : "Online"}
                  </span>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        <strong>Nota:</strong> Esta é uma interface de demonstração. As alterações feitas aqui não afetarão o status real do site até que a funcionalidade completa do backend seja implementada.
      </p>
    </div>
  );
}

    