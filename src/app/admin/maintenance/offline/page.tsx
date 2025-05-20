
"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button"; // Added Button import
import { ServerOff, Home as HomeIcon, Users as UsersIconProp, TicketIcon, LayoutDashboard, UserCircle2, Settings as SettingsIcon, ShieldCheck, UserCog, Star, User } from "lucide-react"; // Renamed Users to UsersIconProp
import { useToast } from "@/hooks/use-toast"; // Added useToast import

interface ModuleAccessStatus {
  globallyOffline: boolean;
  accessLevels: {
    master: 'normal' | 'maintenance' | 'blocked';
    admin: 'normal' | 'maintenance' | 'blocked';
    suporte: 'normal' | 'maintenance' | 'blocked';
    host: 'normal' | 'maintenance' | 'blocked';
    player: 'normal' | 'maintenance' | 'blocked';
  };
}

interface SiteModule extends ModuleAccessStatus {
  id: string;
  name: string;
  icon: React.ElementType;
}

type UserRole = keyof ModuleAccessStatus['accessLevels'];

const roleDisplayNames: Record<UserRole, string> = {
  master: "Master",
  admin: "Admin",
  suporte: "Suporte",
  host: "Host",
  player: "Player",
};

const roleIcons: Record<UserRole, React.ElementType> = {
    master: ShieldCheck,
    admin: UserCog,
    suporte: UserCog,
    host: Star,
    player: User,
};

const initialModuleStatuses: SiteModule[] = [
  {
    id: 'home',
    name: "Página Inicial (Home)",
    icon: HomeIcon,
    globallyOffline: false,
    accessLevels: { master: 'normal', admin: 'normal', suporte: 'normal', host: 'normal', player: 'normal' },
  },
  {
    id: 'hosts',
    name: "Página de Hosts",
    icon: UsersIconProp, // Changed from Star to UsersIconProp
    globallyOffline: false,
    accessLevels: { master: 'normal', admin: 'normal', suporte: 'normal', host: 'normal', player: 'normal' },
  },
  {
    id: 'games',
    name: "Página de Jogos",
    icon: TicketIcon,
    globallyOffline: false,
    accessLevels: { master: 'normal', admin: 'normal', suporte: 'normal', host: 'normal', player: 'normal' },
  },
  {
    id: 'adminPanel',
    name: "Painel Admin",
    icon: LayoutDashboard,
    globallyOffline: false,
    accessLevels: { master: 'normal', admin: 'normal', suporte: 'normal', host: 'normal', player: 'normal' },
  },
  {
    id: 'profile',
    name: "Página de Perfil",
    icon: UserCircle2,
    globallyOffline: false,
    accessLevels: { master: 'normal', admin: 'normal', suporte: 'normal', host: 'normal', player: 'normal' },
  },
  {
    id: 'settings',
    name: "Página de Configurações",
    icon: SettingsIcon,
    globallyOffline: false,
    accessLevels: { master: 'normal', admin: 'normal', suporte: 'normal', host: 'normal', player: 'normal' },
  },
];


export default function AdminMaintenanceOfflinePage() {
  const [moduleStatuses, setModuleStatuses] = useState<SiteModule[]>(initialModuleStatuses);
  const { toast } = useToast(); // Initialize toast

  const handleGlobalToggle = (moduleId: string, isOffline: boolean) => {
    setModuleStatuses((prevModules) =>
      prevModules.map((module) =>
        module.id === moduleId ? { ...module, globallyOffline: isOffline } : module
      )
    );
    console.log(`Module ${moduleId} global status toggled to: ${isOffline ? 'Offline' : 'Online'}`);
  };

  const handleRoleAccessChange = (moduleId: string, role: UserRole, access: 'normal' | 'maintenance' | 'blocked') => {
    setModuleStatuses((prevModules) =>
      prevModules.map((module) =>
        module.id === moduleId
          ? {
              ...module,
              accessLevels: {
                ...module.accessLevels,
                [role]: access,
              },
            }
          : module
      )
    );
    console.log(`Access for role ${role} on module ${moduleId} set to: ${access}`);
  };

  const handleSaveChanges = () => {
    // Placeholder for actual save logic
    console.log("Attempting to save maintenance settings:", moduleStatuses);
    toast({
      title: "Salvar Configurações (Simulação)",
      description: "A funcionalidade de salvar no banco de dados ainda não foi implementada. As configurações atuais foram exibidas no console.",
    });
    // In a real implementation, you would send `moduleStatuses` to your backend/Firestore here.
  };


  return (
    <div className="space-y-6 bg-background p-6 rounded-lg shadow-sm h-full overflow-y-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Gerenciar Status Offline de Módulos</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ServerOff className="mr-2 h-6 w-6 text-primary" />
            Controle de Acesso aos Módulos
          </CardTitle>
          <CardDescription>
            Ative ou desative módulos específicos do site. Se um módulo estiver offline, defina permissões de acesso granulares por função.
            <strong className="text-destructive block mt-1">As alterações feitas aqui são locais. Clique em "Salvar Alterações" para torná-las persistentes (funcionalidade de salvar ainda em desenvolvimento).</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {moduleStatuses.map((module) => {
            const ModuleIcon = module.icon;
            return (
              <Card key={module.id} className="p-4 border-border shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <ModuleIcon className="mr-3 h-6 w-6 text-primary" />
                    <Label htmlFor={`${module.id}-global-status`} className="text-lg font-semibold">
                      {module.name}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id={`${module.id}-global-status`}
                      checked={module.globallyOffline}
                      onCheckedChange={(checked) => handleGlobalToggle(module.id, checked)}
                      aria-label={`Status global offline para ${module.name}`}
                    />
                    <span className={`text-sm font-semibold ${module.globallyOffline ? 'text-destructive' : 'text-green-600'}`}>
                      {module.globallyOffline ? "Globalmente Offline" : "Globalmente Online"}
                    </span>
                  </div>
                </div>

                {module.globallyOffline && (
                  <div className="mt-4 pt-4 border-t border-border space-y-3">
                    <p className="text-sm text-muted-foreground">
                      O módulo <span className="font-semibold">{module.name}</span> está configurado como offline. Defina abaixo quem ainda pode acessá-lo:
                    </p>
                    {(Object.keys(module.accessLevels) as UserRole[]).map((role) => {
                      const RoleIcon = roleIcons[role];
                      return (
                        <div key={role} className="flex items-center justify-between p-2 border rounded-md bg-muted/30">
                          <div className="flex items-center">
                            <RoleIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                            <Label htmlFor={`${module.id}-${role}-access`} className="text-sm font-medium">
                              {roleDisplayNames[role]}
                            </Label>
                          </div>
                          <Select
                            value={module.accessLevels[role]}
                            onValueChange={(value) => handleRoleAccessChange(module.id, role, value as 'normal' | 'maintenance' | 'blocked')}
                          >
                            <SelectTrigger id={`${module.id}-${role}-access`} className="w-[200px] h-9 text-xs focus-visible:ring-0 focus-visible:ring-offset-0">
                              <SelectValue placeholder="Definir acesso" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="normal">Acesso Normal</SelectItem>
                              <SelectItem value="maintenance">Ver Manutenção</SelectItem>
                              <SelectItem value="blocked">Bloqueado</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            );
          })}
        </CardContent>
         <CardFooter className="pt-6 border-t flex justify-end">
          <Button onClick={handleSaveChanges}>Salvar Alterações</Button>
        </CardFooter>
      </Card>

      <CardFooter className="pt-6 border-t">
        <p className="text-xs text-muted-foreground">
          <strong>Nota Importante:</strong> Esta interface é para configurar o controle de acesso.
          As alterações feitas aqui precisam ser salvas e a lógica de backend
          e as verificações de permissão em cada rota precisam ser implementadas para que tenham efeito real.
        </p>
      </CardFooter>
    </div>
  );
}
