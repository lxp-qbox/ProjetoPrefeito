

export interface Game {
  id?: string; // Firestore document ID
  title: string;
  status: 'planejada' | 'ativa' | 'pausada' | 'finalizada' | 'cancelada'; 
  bingoType: '75-ball' | '90-ball';
  cardPrice?: number; 
  
  prizeType?: 'kako_virtual' | 'cash' | 'other';
  prizeKakoVirtualId?: string; 
  prizeCashAmount?: number; 
  prizeDescription: string; 

  bingoRoomId?: string; // ID of the selected BingoRoomSetting
  bingoRoomName?: string; // Denormalized name of the room

  startTime: any; 
  actualStartTime?: any; 
  endTime?: any; 

  participantsCount?: number; 
  cardsSold?: number;
  totalRevenue?: number; 

  drawnBalls?: number[]; 
  lastDrawnBall?: number | null;
  gamePatternToWin?: string; 
  
  winners?: GameWinner[];

  createdBy?: string; 
  createdAt: any; 
  updatedAt: any; 
  notes?: string; 
}

export interface GameWinner {
  userId: string; 
  userName?: string; 
  prizeId?: string; 
  prizeDescription?: string; 
  claimedAt?: any; 
  winningCardId?: string; 
}


export interface SupportTicket {
  subject: string;
  message: string;
  userId?: string; 
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
  rankPosition: number; 
  name: string; 
  avatarUrl: string; 
  dataAiHint?: string;
  avgViewers: number;
  timeStreamed: number; 
  allTimePeakViewers: number;
  hoursWatched: string; 
  rank: number; 
  followersGained: number;
  totalFollowers: string; 
  totalViews: string; 
  kakoLiveFuid?: string; 
  kakoLiveRoomId?: string; 
  bio?: string; 
  streamTitle?: string; 
  likes?: number; 
  giftsReceived?: ReceivedGift[]; 
  createdAt?: any; 
  lastSeen?: any; 
  source?: 'kakoLive' | 'manual'; 
  totalDonationsValue?: number; 
}

export interface UserProfile { 
  uid: string; 
  email?: string | null;
  role?: 'player' | 'host'; 
  adminLevel?: 'master' | 'admin' | 'suporte' | null; 
  
  showId?: string; // User-facing Kako Show ID
  kakoLiveId?: string; // FUID from Kako, technical key from linked KakoProfile
  
  profileName?: string; // App's name, potentially synced from KakoProfile.nickname or Firebase Auth displayName    
  displayName?: string | null; // From Firebase Auth, often an initial fallback
  photoURL?: string | null;  // App's avatar, potentially synced from KakoProfile.avatarUrl or Firebase Auth photoURL
  level?: number; // Populated dynamically from linked KakoProfile

  hostStatus?: 'approved' | 'pending_review' | 'banned'; 
  
  bio?: string;              
  isVerified?: boolean;      
  followerCount?: number;    
  followingCount?: number;   
  followingIds?: string[]; 
  photos?: string[];         
  gender?: 'male' | 'female' | 'other' | 'preferNotToSay';
  birthDate?: string;       
  country?: string;
  phoneNumber?: string;
  isBanned?: boolean; 
  banReason?: string;
  bannedBy?: string; 
  bannedAt?: any; 
  socialLinks?: {
    twitter?: string;
    instagram?: string;
    facebook?: string;
    youtube?: string;
    twitch?: string;
  };
  themePreference?: 'light' | 'dark' | 'system';
  accentColor?: string;      
  hasCompletedOnboarding?: boolean;
  agreedToTermsAt?: any; 
  createdAt?: any;           
  updatedAt?: any;           
}

export interface KakoProfile { 
  id: string; // FUID - Firestore Document ID for kakoProfiles collection
  numId?: number; 
  nickname: string;
  avatarUrl: string; // Mapped from 'avatar' in Kako API
  level: number; 
  signature?: string; 
  gender?: number; // 1 for male, 2 for female (based on Kako API)
  area?: string;
  school?: string;
  showId: string; // User-facing Show ID from Kako
  isLiving?: boolean; 
  roomId?: string; 
  lastFetchedAt?: any; 
}

export interface KakoGift {
  id: string; // This should be the giftId from Kako, and used as the document ID in Firestore
  name: string; 
  imageUrl: string; 
  diamond?: number | null; 
  display?: boolean; // If it should be generally available/shown in your app's prize lists
  createdAt?: any; // Firestore Timestamp when it was first added to your DB
  dataAiHint?: string; 
}


export interface ChatMessage { 
  id: string;
  user: string;
  avatar?: string;
  userMedalUrl?: string;
  message: string;
  timestamp: string;
  rawData?: string;
  displayFormatted: boolean; 
  gender?: number;
}

export interface FirestoreConversation {
  id?: string; 
  participants: string[]; // Array of UIDs
  participantNames: { [uid: string]: string }; 
  participantAvatars: { [uid: string]: string | null }; 
  lastMessageText?: string;
  lastMessageTimestamp?: any; 
  lastMessageSenderId?: string; 
  unreadCounts?: { [uid: string]: number }; 
  createdAt: any; 
  updatedAt: any; 
}

export interface AppMessage { 
  id?: string; 
  conversationId: string;
  senderId: string; 
  senderName: string;
  senderAvatar?: string;
  text: string;     
  timestamp: any;   // Firestore Server Timestamp (for ordering) or string for optimistic
  imageUrl?: string; 
  isCurrentUser?: boolean;
  status?: 'sent' | 'delivered' | 'read';
}

export interface FeedPost {
  id: string; 
  userId?: string; 
  user: UserSummary; 
  postTitle?: string;
  content: string;
  timestamp: any; // Can be Firestore Timestamp or string
  imageUrl?: string;
  imageAiHint?: string;
  stats: {
    replies: number;
    retweets: number;
    likes: number;
  };
}
    
export interface UserSummary {
  name: string;
  handle: string; 
  avatarUrl: string;
  dataAiHint?: string; 
}

export interface Trend {
  id: string;
  category?: string;
  topic: string;
  posts?: string; 
  icon?: React.ElementType;
}

export interface SuggestedUser {
  id: string;
  name: string;
  handle: string; // Can be @username or a description like "CEO of Apple"
  avatarUrl: string;
  dataAiHint?: string;
}

export interface BanEntry {
  id: string; 
  userId: string;
  userName?: string;
  userAvatar?: string | null;
  reason: string;
  bannedByUid: string; 
  bannedByName?: string; 
  bannedAt: any; 
  expiresAt?: any | null; 
}

export type UserRole = 'master' | 'admin' | 'suporte' | 'host' | 'player';
export type MinimumAccessLevel = UserRole | 'nobody';

export interface SiteModule {
  id: string;
  name: string;
  icon: React.ElementType;
  globallyOffline: boolean;
  isHiddenFromMenu: boolean;
  minimumAccessLevelWhenOffline: MinimumAccessLevel;
}

export interface CardUsageInstance {
  userId: string; 
  gameId: string; 
  timestamp: any;   
  isWinner?: boolean; 
}

export interface AwardInstance {
  gameId: string;
  userId: string; 
  timestamp: any; 
}

export interface GeneratedBingoCard {
  id: string; 
  cardNumbers: (number | null)[][]; 
  creatorId: string; 
  createdAt: any; 
  usageHistory: CardUsageInstance[]; 
  timesAwarded: number; 
  awardsHistory: AwardInstance[]; 
}

export interface BingoPrize {
  id?: string; 
  name: string; 
  description?: string; 
  type: 'kako_virtual' | 'cash' | 'physical_item' | 'other'; 
  imageUrl?: string; 
  storagePath?: string;
  valueDisplay?: string; 
  
  kakoGiftId?: string; 
  kakoGiftName?: string; 
  kakoGiftImageUrl?: string; 

  isActive: boolean; 
  quantityAvailable?: number | null; 
  
  createdAt: any; 
  updatedAt: any; 
  createdBy?: string; 
}

export interface AudioSetting {
  id: string; 
  type: 'gameEvent' | 'interaction';
  eventName?: string; // e.g., 'gameStart', 'winnerSound'
  displayName: string; // e.g., "Início da Partida" or a custom name for interaction audio
  audioUrl?: string;
  fileName?: string;
  storagePath?: string;
  uploadedAt?: any; 
  // For interaction audios:
  keyword?: string; 
  associatedGiftId?: string; // ID of a BingoPrize
  associatedGiftName?: string; // Denormalized name
  createdBy?: string; // UID of admin who added it
}

export interface BingoBallLocutorAudio {
  audioUrl: string;
  audioStoragePath: string;
  fileName: string;
  uploadedAt: any;
}

export interface BingoBallSetting {
  ballNumber: number;
  imageUrl?: string;
  imageStoragePath?: string;
  locutorAudios?: { 
    [locutorId: string]: BingoBallLocutorAudio; // Key is locutor name/ID, value is the audio data for that locutor
  };
  lastUpdatedAt?: any; 
}

export interface BingoRoomSetting {
  id?: string; // Firestore document ID
  roomId: string;
  description?: string;
  isActive: boolean;
  addedBy?: string;
  addedAt?: any; // Firestore Timestamp
  lastCheckedAt?: any; // Firestore Timestamp, for when data was last pulled or connection attempted
}

