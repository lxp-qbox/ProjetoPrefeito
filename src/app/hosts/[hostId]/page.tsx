
"use client";

import * as React from 'react';
import { useParams } from 'next/navigation';
import type { Host } from '@/types';
import { placeholderHosts } from '../page'; // Import placeholderHosts
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, UserCircle2, WifiOff, Info, Heart, Gift as GiftIcon } from 'lucide-react';
import LoadingSpinner from '@/components/ui/loading-spinner';
import Image from 'next/image';

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

  // Effect to simulate gift updates
  React.useEffect(() => {
    if (!host || !host.giftsReceived || host.giftsReceived.length === 0) {
      return; // Don't start interval if no host or no gifts
    }

    const intervalId = setInterval(() => {
      setHost(prevHost => {
        if (!prevHost || !prevHost.giftsReceived || prevHost.giftsReceived.length === 0) {
          return prevHost;
        }
        // Create a deep copy to avoid state mutation issues
        const updatedGifts = prevHost.giftsReceived.map(gift => ({ ...gift }));
        const randomIndex = Math.floor(Math.random() * updatedGifts.length);
        updatedGifts[randomIndex].count = (updatedGifts[randomIndex].count || 0) + 1; // Increment count of a random gift

        return { ...prevHost, giftsReceived: updatedGifts };
      });
    }, 5000); // Update every 5 seconds

    return () => clearInterval(intervalId); // Cleanup on unmount
  }, [host]); // Rerun effect if host data changes (e.g., initial load or if host object itself is replaced)


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
  const pageTitle = host.streamTitle || `Ao Vivo: ${host.name}`;

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
          {pageTitle}
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
          <CardTitle className="text-lg flex items-center">
            <Info className="h-5 w-5 mr-2 text-primary flex-shrink-0" />
            Sobre {host.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {host.bio && (
            <p><strong>Bio:</strong> {host.bio}</p>
          )}
          <p><strong>Rank da Agência:</strong> #{host.rankPosition}</p>
          <p><strong>Rank Geral:</strong> {host.rank}</p>
          <p><strong>Seguidores:</strong> {host.totalFollowers}</p>
          <p><strong>Visualizações Totais:</strong> {host.totalViews}</p>
           <p><strong>Média de Espectadores:</strong> {host.avgViewers.toLocaleString('pt-BR')}</p>
           {host.likes !== undefined && (
            <div className="flex items-center">
              <Heart className="h-4 w-4 mr-2 text-destructive" />
              <p><strong>Likes:</strong> {host.likes.toLocaleString('pt-BR')}</p>
            </div>
          )}
          <p className="text-xs text-muted-foreground pt-2">
            Mais detalhes e estatísticas do host serão exibidos aqui em breve.
          </p>
        </CardContent>
      </Card>

      {host.giftsReceived && host.giftsReceived.length > 0 && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
                <GiftIcon className="h-5 w-5 mr-2 text-primary flex-shrink-0" />
                Presentes Recebidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {host.giftsReceived.map((gift) => (
                <div key={gift.id} className="flex flex-col items-center text-center p-2 border rounded-lg shadow-sm bg-muted/20">
                  <Image 
                    src={gift.iconUrl} 
                    alt={gift.name} 
                    width={48} 
                    height={48} 
                    className="rounded-md mb-2"
                    data-ai-hint={gift.dataAiHint || "gift icon"}
                  />
                  <p className="text-sm font-medium">{gift.name}</p>
                  <p className="text-xs text-muted-foreground">x {gift.count}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
       {(!host.giftsReceived || host.giftsReceived.length === 0) && (
         <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="text-lg flex items-center">
                    <GiftIcon className="h-5 w-5 mr-2 text-primary flex-shrink-0" />
                    Presentes Recebidos
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground text-sm">Nenhum presente recebido ainda.</p>
            </CardContent>
         </Card>
       )}
    </div>
  );
}
