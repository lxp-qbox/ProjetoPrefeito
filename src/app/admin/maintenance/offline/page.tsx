
"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ServerOff, Home as HomeIcon, ShieldCheck, UserCog, Star, User } from "lucide-react";

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

const initialHomePageStatus: ModuleAccessStatus = {
  globallyOffline: false,
  accessLevels: {
    master: 'normal',
    admin: 'normal',
    suporte: 'normal',
    host: 'normal',
    player: 'normal',
  },
};

type UserRole = 'master' | 'admin' | 'suporte' | 'host' | 'player';

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
    suporte: UserCog, // Using UserCog for Suporte as well, can be changed
    host: Star,
    player: User,
}

export default function AdminMaintenanceOfflinePage() {
  const [homePageStatus, setHomePageStatus] = useState<ModuleAccessStatus>(initialHomePageStatus);

  const handleGlobalToggleHome = (isOffline: boolean) => {
    setHomePageStatus((prev) => ({ ...prev, globallyOffline: isOffline }));
    // Here you would also call a function to save this global status to your backend.
    console.log(`Página Inicial (Home) global status toggled to: ${isOffline ? 'Offline' : 'Online'}`);
  };

  const handleRoleAccessChange = (role: UserRole, access: 'normal' | 'maintenance' | 'blocked') => {
    if (!access) return; // This check is fine, though access should always be one of the strings here
    setHomePageStatus((prev) => ({
      ...prev,
      accessLevels: {
        ...prev.accessLevels,
        [role]: access,
      },
    }));
    // Here you would also call a function to save this specific role's access level.
    console.log(`Access for role ${role} on Home page set to: ${access}`);
  };


  return (
    <div className="space-y-6 bg-card p-6 rounded-lg shadow-lg h-full">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Gerenciar Status Offline de Módulos</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ServerOff className="mr-2 h-6 w-6 text-primary" />
            Controle de Módulos Offline
          </CardTitle>
          <CardDescription>
            Ative ou desative módulos específicos do site. Se um módulo estiver offline, defina permissões de acesso granulares por função.
            <strong className="text-destructive block mt-1"> (Funcionalidade em desenvolvimento - os toggles são apenas visuais para esta demonstração).</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Página Inicial (Home) Module Control */}
          <Card className="p-4 border-border shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <HomeIcon className="mr-3 h-6 w-6 text-primary" />
                <Label htmlFor="home-global-status" className="text-lg font-semibold">
                  Página Inicial (Home)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="home-global-status"
                  checked={homePageStatus.globallyOffline}
                  onCheckedChange={handleGlobalToggleHome}
                  aria-label="Status global offline para Página Inicial"
                />
                <span className={`text-sm font-semibold ${homePageStatus.globallyOffline ? 'text-destructive' : 'text-green-600'}`}>
                  {homePageStatus.globallyOffline ? "Globalmente Offline" : "Globalmente Online"}
                </span>
              </div>
            </div>

            {homePageStatus.globallyOffline && (
              <div className="mt-4 pt-4 border-t border-border space-y-3">
                <p className="text-sm text-muted-foreground">
                  A página inicial está configurada como offline. Defina abaixo quem ainda pode acessá-la:
                </p>
                {(Object.keys(homePageStatus.accessLevels) as UserRole[]).map((role) => {
                  const RoleIcon = roleIcons[role];
                  return (
                    <div key={role} className="flex items-center justify-between p-2 border rounded-md bg-muted/30">
                      <div className="flex items-center">
                        <RoleIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                        <Label htmlFor={`home-${role}-access`} className="text-sm font-medium">
                          {roleDisplayNames[role]}
                        </Label>
                      </div>
                      <Select
                        value={homePageStatus.accessLevels[role]}
                        onValueChange={(value) => handleRoleAccessChange(role, value as 'normal' | 'maintenance' | 'blocked')}
                      >
                        <SelectTrigger id={`home-${role}-access`} className="w-[200px] h-9 text-xs">
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
          {/* End Página Inicial (Home) Module Control */}

        </CardContent>
      </Card>

      <CardFooter className="pt-6 border-t">
        <p className="text-xs text-muted-foreground">
          <strong>Nota Importante:</strong> Esta interface é uma demonstração para controle de acesso.
          As alterações feitas aqui são visuais e não afetam o comportamento real do site até que a lógica de backend
          e as verificações de permissão em cada rota sejam implementadas.
        </p>
      </CardFooter>
    </div>
  );
}
