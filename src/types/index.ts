
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

export interface ReceivedGift {
  id: string;
  name: string;
  iconUrl: string;
  count: number;
  dataAiHint?: string;
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
  rank: number; // The actual rank number, e.g., 10 (can map to level from API)
  followersGained: number;
  totalFollowers: string; // e.g., "6.55M"
  totalViews: string; // e.g., "50.8M"
  kakoLiveFuid?: string; // Identifier for Kako Live stream fuid (maps to data.user.userId)
  kakoLiveRoomId?: string; // Identifier for Kako Live stream room/session ID (maps to data.roomId)
  bio?: string; // Host's signature or bio (maps to data.user.signature)
  streamTitle?: string; // Current stream title (maps to data.title)
  likes?: number; // Number of likes (maps to data.like)
  giftsReceived?: ReceivedGift[];
}

export interface UserProfile {
  uid: string;
  email?: string | null;
  role: 'player' | 'host' | 'suporte' | 'admin' | 'master';
  kakoLiveId?: string;       // passaporte
  profileName?: string;      // o nome do usuario do kako
  displayName?: string | null; // From Firebase Auth, synced with profileName
  photoURL?: string | null;    // From Firebase Auth, for avatar (profile_image)
  profileHeader?: string;    // a imagem de fundo do profile
  bio?: string;              // bio - 100 caracteres
  isVerified?: boolean;      // se o usuario tem verificado ganha um selo
  level?: number;            // qual e o nivel do usuario no site
  followerCount?: number;    // numero de seguidores
  followingCount?: number;   // numero de seguidores que o usuario segue
  photos?: string[];         // a opcao de adicionar mais fotos no perfil
  gender?: 'male' | 'female' | 'other' | 'preferNotToSay'; // sexo
  birthDate?: string;        // data de nascimento (e.g., YYYY-MM-DD)
  civilStatus?: 'single' | 'married' | 'divorced' | 'widowed' | 'other' | 'preferNotToSay'; // status civil
  socialLinks?: {            // link de rede social
    twitter?: string;
    instagram?: string;
    facebook?: string;
    youtube?: string;
    twitch?: string;
  };
  themePreference?: 'light' | 'dark' | 'system'; // mudar o tema do site
  accentColor?: string;      // escolher a cor padrao que se destaca no site (hex)
  createdAt?: any;           // Firestore Timestamp
  updatedAt?: any;           // Firestore Timestamp
}

export interface ChatMessage {
  id: string;
  user: string;
  avatar?: string;
  message: string;
  timestamp: string;
  userMedalUrl?: string;
  rawData?: string;
  displayFormatted: boolean; // New flag: controls if the formatted message is shown
}
