
export interface Game {
  id: string;
  title: string;
  startTime: Date;
  status: 'Upcoming' | 'Live' | 'Ended';
  hostedBy?: string; // User ID of the host
  description?: string;
  prize?: string;
}

export interface SupportTicket {
  subject: string;
  message: string;
  userId?: string; // Optional: associate ticket with user
  createdAt: Date;
}
