
"use client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Database } from "lucide-react";

export default function AdminKakoLiveDataListPage() {
  return (
    <div className="space-y-6 bg-card p-6 rounded-lg shadow-lg h-full">
      <h1 className="text-2xl font-semibold text-foreground">Lista de Dados do Kako Live</h1>
       <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="mr-2 h-6 w-6 text-primary" />
            Dados Brutos e Agregados
          </CardTitle>
          <CardDescription>
            Esta seção está em desenvolvimento. Em breve você poderá visualizar e analisar dados relacionados à integração com o Kako Live.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Conteúdo da lista de dados aparecerá aqui...</p>
           <p className="mt-4 text-sm text-muted-foreground">
            Funcionalidades planejadas:
            <ul className="list-disc list-inside ml-4 mt-2">
              <li>Visualizar logs de API (se aplicável)</li>
              <li>Estatísticas de uso de recursos do Kako Live</li>
              <li>Ferramentas de diagnóstico para a integração</li>
            </ul>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
