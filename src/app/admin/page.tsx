
"use client";

import ProtectedPage from "@/components/auth/protected-page";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Gamepad2, MailQuestion, ShieldAlert, ArrowRight, LayoutDashboard } from "lucide-react";
import Link from "next/link";

export default function AdminPage() {
  const { currentUser } = useAuth();

  if (!currentUser || !currentUser.adminLevel) {
    return (
      <ProtectedPage>
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center p-4">
          <ShieldAlert className="w-16 h-16 text-destructive mb-4" />
          <h1 className="text-2xl font-bold text-destructive mb-2">Acesso Negado</h1>
          <p className="text-muted-foreground">
            Você não tem permissão para acessar esta página.
          </p>
          <Button asChild variant="outline" className="mt-6">
            <Link href="/">Voltar para Início</Link>
          </Button>
        </div>
      </ProtectedPage>
    );
  }

  const adminSections = [
    {
      title: "Gerenciar Usuários",
      icon: Users,
      link: "/admin/users", // Placeholder
    },
    {
      title: "Gerenciar Hosts",
      icon: Gamepad2,
      link: "/admin/hosts", // Placeholder
    },
    {
      title: "Tickets de Suporte",
      icon: MailQuestion,
      link: "/admin/tickets", // Placeholder
    },
  ];

  return (
    <ProtectedPage>
      <div className="space-y-6">
        <section className="bg-card p-6 rounded-lg shadow-md">
          <h1 className="text-3xl font-bold text-primary mb-2 flex items-center">
            <LayoutDashboard className="mr-3 h-8 w-8" />
            Painel Administrativo
            </h1>
          <p className="text-muted-foreground">
            Bem-vindo(a) ao painel de controle, {currentUser.profileName || currentUser.displayName}.
          </p>
        </section>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Admin Navigation Sidebar */}
          <nav className="w-full md:w-72 flex-shrink-0">
            <Card className="shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Navegação</CardTitle>
              </CardHeader>
              <CardContent className="p-2 space-y-1">
                {adminSections.map((section) => (
                  <Button
                    key={section.title}
                    variant="ghost"
                    className="w-full justify-start text-left h-auto py-2.5 px-3"
                    asChild
                  >
                    <Link href={section.link} className="flex items-center gap-3 text-sm font-medium">
                      <section.icon className="h-5 w-5 text-muted-foreground" />
                      {section.title}
                    </Link>
                  </Button>
                ))}
              </CardContent>
            </Card>
          </nav>

          {/* Admin Content Area */}
          <main className="flex-grow">
            <Card className="shadow-lg h-full">
              <CardHeader>
                <CardTitle>Bem-vindo ao Painel!</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Selecione uma opção no menu à esquerda para gerenciar usuários, hosts ou tickets de suporte.
                </p>
                <p className="mt-4 text-sm">
                  Este é o painel principal. O conteúdo específico da seção selecionada aparecerá aqui quando implementado.
                </p>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </ProtectedPage>
  );
}
