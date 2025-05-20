
"use client";

import ProtectedPage from "@/components/auth/protected-page";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Gamepad2, MailQuestion, ShieldAlert, ArrowRight } from "lucide-react";
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
      description: "Visualize e gerencie todos os usuários cadastrados na plataforma.",
      icon: Users,
      link: "/admin/users", // Placeholder
      cta: "Gerenciar Usuários",
    },
    {
      title: "Gerenciar Hosts",
      description: "Acesse e gerencie os perfis de hosts e suas estatísticas.",
      icon: Gamepad2,
      link: "/admin/hosts", // Placeholder
      cta: "Gerenciar Hosts",
    },
    {
      title: "Tickets de Suporte",
      description: "Revise e responda aos tickets de suporte enviados pelos usuários.",
      icon: MailQuestion,
      link: "/admin/tickets", // Placeholder
      cta: "Ver Tickets",
    },
  ];

  return (
    <ProtectedPage>
      <div className="space-y-8">
        <section className="bg-card p-6 rounded-lg shadow-md">
          <h1 className="text-3xl font-bold text-primary mb-2">Painel Administrativo</h1>
          <p className="text-muted-foreground">
            Bem-vindo(a) ao painel de controle da The Presidential Agency, {currentUser.profileName || currentUser.displayName}.
          </p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminSections.map((section) => (
            <Card key={section.title} className="flex flex-col shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="items-center text-center">
                <div className="p-3 bg-primary/10 rounded-full mb-3">
                  <section.icon className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-xl">{section.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow text-center">
                <CardDescription>{section.description}</CardDescription>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full">
                  <Link href={section.link}>
                    {section.cta} <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </section>
      </div>
    </ProtectedPage>
  );
}
