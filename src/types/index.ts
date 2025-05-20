
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
  id: string; // Kako Live userId, will be document ID in Firestore
  rankPosition: number; 
  name: string; // Kako nickname
  avatarUrl: string; // Kako avatar
  avgViewers: number;
  timeStreamed: number; // in hours
  allTimePeakViewers: number;
  hoursWatched: string; 
  rank: number; // Kako user.level
  followersGained: number;
  totalFollowers: string; 
  totalViews: string; 
  kakoLiveFuid?: string; // Same as id (Kako userId)
  kakoLiveRoomId?: string; 
  bio?: string; // Kako signature
  streamTitle?: string; // Current stream title
  likes?: number; 
  giftsReceived?: ReceivedGift[];
  
  // New fields for richer host profile and tracking
  totalDonationsValue?: number; // Placeholder for donations
  createdAt?: any; // Firestore Timestamp
  lastSeen?: any; // Firestore Timestamp
  source?: 'kakoLive' | 'manual'; // How the profile was created/sourced
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
  hasCompletedOnboarding?: boolean; // New field for onboarding
  agreedToTermsAt?: any; // Firestore Timestamp for terms agreement
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
  displayFormatted: boolean;
  extractedRoomId?: string; // Added for room-specific filtering
  userId?: string; // User ID of the message sender
  userLevel?: number; // Level of the message sender
}

