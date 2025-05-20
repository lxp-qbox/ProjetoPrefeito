
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TicketIcon, Users, Award } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="space-y-12">
      <section className="text-center py-12 md:py-16 bg-gradient-to-br from-primary/10 via-background to-background rounded-xl shadow-lg">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-primary mb-6">
            Bem-vindo à The Presidential Agency
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Seu principal destino para jogos de bingo emocionantes, engajamento comunitário e prêmios incríveis. Junte-se à diversão hoje!
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button size="lg" asChild className="shadow-md hover:shadow-lg transition-shadow">
              <Link href="/games">Explorar Jogos <TicketIcon className="ml-2 h-5 w-5" /></Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="shadow-md hover:shadow-lg transition-shadow">
              <Link href="/signup">Cadastre-se Agora</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-6 md:gap-8">
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="items-center text-center">
            <div className="p-3 bg-primary/10 rounded-full mb-3">
              <TicketIcon className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Jogos de Bingo Empolgantes</CardTitle>
            <CardDescription>Descubra uma variedade de jogos de bingo com diferentes temas e prêmios.</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
             <Image src="https://placehold.co/600x400.png" alt="Jogos de Bingo" data-ai-hint="bingo game" width={600} height={400} className="rounded-md mb-4 aspect-video object-cover"/>
            <Button variant="secondary" asChild>
              <Link href="/games">Ver Jogos</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="items-center text-center">
             <div className="p-3 bg-primary/10 rounded-full mb-3">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Foco na Comunidade</CardTitle>
            <CardDescription>Conecte-se com outros jogadores e desfrute de um ambiente de jogo amigável.</CardDescription>
          </CardHeader>
           <CardContent className="text-center">
            <Image src="https://placehold.co/600x400.png" alt="Comunidade" data-ai-hint="community group" width={600} height={400} className="rounded-md mb-4 aspect-video object-cover"/>
            <p className="text-muted-foreground mb-4">Faça parte da nossa crescente família de entusiastas do bingo.</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="items-center text-center">
             <div className="p-3 bg-primary/10 rounded-full mb-3">
              <Award className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Ganhe Grandes Prêmios</CardTitle>
            <CardDescription>Jogue por diversão ou compita por recompensas e jackpots atraentes.</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Image src="https://placehold.co/600x400.png" alt="Prêmios" data-ai-hint="trophy prize" width={600} height={400} className="rounded-md mb-4 aspect-video object-cover"/>
             <p className="text-muted-foreground mb-4">Prepare-se para a sua chance de gritar "BINGO!" e ganhar.</p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
