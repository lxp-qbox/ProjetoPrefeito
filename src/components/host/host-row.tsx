
"use client";

import type { Host } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import Image from "next/image";

interface HostRowProps {
  host: Host;
}

// Helper for formatting large numbers, can be expanded
const formatNumber = (num: number): string => {
  return num.toLocaleString('pt-BR'); // Using pt-BR for locale formatting
};

export default function HostRow({ host }: HostRowProps) {
  return (
    <TableRow className="border-b hover:bg-muted/20">
      <TableCell className="w-12 text-sm font-medium text-muted-foreground pr-1 text-center">
        #{host.rankPosition}
      </TableCell>
      <TableCell className="min-w-[200px]">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={host.avatarUrl} alt={host.name} data-ai-hint="streamer avatar" />
            <AvatarFallback>{host.name.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className="font-semibold text-sm whitespace-nowrap">{host.name}</span>
        </div>
      </TableCell>
      <TableCell className="text-sm font-semibold text-primary whitespace-nowrap text-right">{formatNumber(host.avgViewers)}</TableCell>
      <TableCell className="text-sm text-right whitespace-nowrap">
        <div className="font-semibold text-destructive">{host.timeStreamed.toFixed(1).replace('.',',')}</div>
        <div className="text-xs text-muted-foreground">horas</div>
      </TableCell>
      <TableCell className="text-sm font-semibold text-accent whitespace-nowrap text-right">{formatNumber(host.allTimePeakViewers)}</TableCell>
      <TableCell className="text-sm font-semibold text-primary whitespace-nowrap text-right">{host.hoursWatched}</TableCell>
      <TableCell className="text-sm text-center whitespace-nowrap">
        <Badge
          variant="secondary"
          className="bg-primary/10 text-primary font-bold text-xs px-2.5 py-1"
        >
          {host.rank}
        </Badge>
      </TableCell>
      <TableCell className="text-sm font-semibold text-green-600 dark:text-green-500 whitespace-nowrap text-right">
        +{formatNumber(host.followersGained)}
      </TableCell>
      <TableCell className="text-sm font-semibold text-primary whitespace-nowrap text-right">{host.totalFollowers}</TableCell>
      <TableCell className="text-sm font-semibold text-accent whitespace-nowrap text-right">{host.totalViews}</TableCell>
    </TableRow>
  );
}
