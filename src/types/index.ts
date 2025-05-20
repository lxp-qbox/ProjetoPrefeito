
export interface Game {
  id: string;
  title: string;
  startTime: Date; // For upcoming: start time. For ended: can be original start time or actual end time.
  status: 'Upcoming' | 'Live' | 'Ended' | 'Aberta'; // Added 'Aberta' status
  hostedBy?: string;
  description?: string; // General game description
  prize?: string;
  
  // Fields for Bingo Page
  participants?: number;
  winners?: string; // e.g., "João Silva" or "2 pessoas"
  additionalInfo?: string; // e.g., "24 participantes!" shown on the "Next Game" card
  startTimeDisplay?: string; // e.g., "20:00" for display
  endTimeDisplay?: string; // e.g., "16:30" for display for finished games

  // Fields for Game Play Page
  generatedCards?: number;
  countdownSeconds?: number;
}

export interface SupportTicket {
  subject: string;
  message: string;
  userId?: string; // Optional: associate ticket with user
  createdAt: Date;
}

export interface Host {
  id: string;
  rankPosition: number; // #1, #2
  name: string;
  avatarUrl: string;
  avgViewers: number;
  timeStreamed: number; // in hours
  allTimePeakViewers: number;
  hoursWatched: string; // e.g., "3.88M"
  rank: number; // The actual rank number, e.g., 10
  followersGained: number;
  totalFollowers: string; // e.g., "6.55M"
  totalViews: string; // e.g., "50.8M"
}
