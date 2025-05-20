
export interface Game {
  id: string;
  title: string;
  startTime: Date; // For upcoming: start time. For ended: can be original start time or actual end time.
  status: 'Upcoming' | 'Live' | 'Ended';
  hostedBy?: string;
  description?: string; // General game description
  prize?: string;
  
  // Fields for Bingo Page
  participants?: number;
  winners?: string; // e.g., "João Silva" or "2 pessoas"
  additionalInfo?: string; // e.g., "24 participantes!" shown on the "Next Game" card
  startTimeDisplay?: string; // e.g., "20:00" for display
  endTimeDisplay?: string; // e.g., "16:30" for display for finished games
}

export interface SupportTicket {
  subject: string;
  message: string;
  userId?: string; // Optional: associate ticket with user
  createdAt: Date;
}
