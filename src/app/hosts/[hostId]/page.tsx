
"use client";

import * as React from 'react';
import { useParams } from 'next/navigation';
import type { Host } from '@/types';
import { placeholderHosts } from '../page'; // Import placeholderHosts
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, UserCircle2, WifiOff } from 'lucide-react';
import LoadingSpinner from '@/components/ui/loading-spinner';

// This is a temporary solution for fetching host data.
// In a real app, this would come from a database/API.
const getHostById = (id: string): Host | undefined => {
  return placeholderHosts.find(host => host.id === id);
};

export default function HostStreamPage() {
  const params = useParams();
  const hostId = typeof params.hostId === 'string' ? params.hostId : undefined;
  const [host, setHost] = React.useState<Host | null | undefined>(undefined); // undefined: loading, null: not found/no stream

  React.useEffect(() => {
    if (hostId) {
      const foundHost = getHostById(hostId);
      setHost(foundHost);
    } else {
      setHost(null); // No hostId, so not found
    }
  }, [hostId]);

  if (host === undefined) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!host) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center p-4">
        <UserCircle2 className="w-16 h-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Host não encontrado</h1>
        <p className="text-muted-foreground mb-6">
          Não foi possível encontrar informações para este host.
        </p>
        <Button asChild variant="outline">
          <Link href="/hosts">Voltar para Lista de Hosts</Link>
        </Button>
      </div>
    );
  }

  if (!host.kakoLiveFuid || !host.kakoLiveRoomId) {
     return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center p-4">
        <WifiOff className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold mb-2">{host.name} não configurou uma transmissão corretamente.</h1>
        <p className="text-muted-foreground mb-6">
          Este host ainda não possui todas as informações necessárias (FUID ou RoomID) para a transmissão Kako Live.
        </p>
        <Button asChild variant="outline">
          <Link href="/hosts">Voltar para Lista de Hosts</Link>
        </Button>
      </div>
    );
  }
  
  const embedUrl = `https://app.kako.live/app/gzl_live.html?fuid=${host.kakoLiveFuid}&id=${host.kakoLiveRoomId}&type=live`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/hosts">
            <ArrowLeft className="h-6 w-6" />
            <span className="sr-only">Voltar</span>
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-center flex-grow mr-8 sm:mr-0 truncate px-2">
          Ao Vivo: {host.name}
        </h1>
        <div className="w-8 h-8"></div> {/* Spacer for balance if needed */}
      </div>

      <Card className="shadow-xl overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl text-primary">Transmissão de {host.name}</CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-2 md:p-4">
          <AspectRatio ratio={16 / 9} className="bg-black rounded-md overflow-hidden shadow-inner">
            <iframe
              src={embedUrl}
              title={`Transmissão ao vivo de ${host.name}`}
              className="w-full h-full"
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              frameBorder="0"
            />
          </AspectRatio>
          <p className="text-xs text-muted-foreground mt-3 text-center px-4 pb-2">
            Se o vídeo não carregar, o host pode não estar ao vivo ou pode haver restrições de incorporação.
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Sobre {host.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p><strong>Rank da Agência:</strong> #{host.rankPosition}</p>
          <p><strong>Rank Geral:</strong> {host.rank}</p>
          <p><strong>Seguidores:</strong> {host.totalFollowers}</p>
          <p><strong>Visualizações Totais:</strong> {host.totalViews}</p>
           <p><strong>Média de Espectadores:</strong> {host.avgViewers.toLocaleString('pt-BR')}</p>
          <p className="text-xs text-muted-foreground pt-2">
            Mais detalhes e estatísticas do host serão exibidos aqui em breve.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
