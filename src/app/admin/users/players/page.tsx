
"use client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Users } from "lucide-react";

export default function AdminPlayersPage() {
  return (
    <div className="space-y-6 bg-card p-6 rounded-lg shadow-lg h-full">
      <h1 className="text-2xl font-semibold text-foreground">Gerenciamento de Players</h1>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="mr-2 h-6 w-6 text-primary" />
            Lista de Players
          </CardTitle>
          <CardDescription>
            Esta seção está em desenvolvimento. Em breve você poderá gerenciar os players aqui.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Conteúdo da tabela de players aparecerá aqui...</p>
          <div className="mt-4 text-sm text-muted-foreground">
            Funcionalidades planejadas:
            <ul className="list-disc list-inside ml-4 mt-2">
              <li>Visualizar todos os players</li>
              <li>Buscar e filtrar players</li>
              <li>Ver detalhes do perfil de cada player</li>
              <li>Editar status (ativo, banido)</li>
              <li>Ver histórico de atividades</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
