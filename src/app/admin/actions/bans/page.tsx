"use client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { XCircle } from "lucide-react";

export default function AdminBansPage() {
  return (
    <div className="space-y-6 bg-card p-6 rounded-lg shadow-lg h-full">
      <h1 className="text-2xl font-semibold text-foreground">Gerenciamento de Banimentos</h1>
       <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <XCircle className="mr-2 h-6 w-6 text-destructive" />
            Lista de Hosts Banidos
          </CardTitle>
          <CardDescription>
            Esta seção está em desenvolvimento. Em breve você poderá gerenciar os hosts banidos aqui.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Conteúdo da tabela de hosts banidos aparecerá aqui...</p>
          <div className="mt-4">
            <p className="text-sm text-muted-foreground">Funcionalidades planejadas:</p>
            <ul className="list-disc list-inside ml-4 mt-2">
              <li>Visualizar todos os hosts banidos</li>
              <li>Revisar motivo e data do banimento</li>
              <li>Opção para reverter banimentos (com log)</li>
              <li>Buscar e filtrar hosts banidos</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
