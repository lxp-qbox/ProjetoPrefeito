
"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function PostCardSkeleton() {
  return (
    <Card className="rounded-none border-b border-x-0 shadow-none last:border-b-0">
      <CardContent className="p-4">
        <div className="flex space-x-3">
          <Skeleton className="h-10 w-10 rounded-full mt-1 shrink-0" />
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-baseline space-x-1">
                <Skeleton className="h-4 w-24 rounded-md" />
                <Skeleton className="h-3 w-16 rounded-md" />
              </div>
              <Skeleton className="h-6 w-6 rounded-full" />
            </div>
            <Skeleton className="h-4 w-5/6 rounded-md" />
            <Skeleton className="h-4 w-3/4 rounded-md" />
            
            <Skeleton className="mt-3 rounded-lg aspect-video w-full h-48" /> {/* Placeholder for image */}
            
            <div className="mt-3 flex justify-start items-center text-muted-foreground space-x-6">
              <Skeleton className="h-5 w-10 rounded-md" />
              <Skeleton className="h-5 w-10 rounded-md" />
              <Skeleton className="h-5 w-10 rounded-md" />
              <Skeleton className="h-5 w-8 rounded-md" />
            </div>

            <div className="mt-3 flex items-center space-x-2">
                <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                <Skeleton className="h-9 flex-1 rounded-full" />
                <Skeleton className="h-9 w-9 rounded-full" />
                <Skeleton className="h-9 w-9 rounded-full" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
