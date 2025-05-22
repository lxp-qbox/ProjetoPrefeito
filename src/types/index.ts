
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
  kakoLiveId?: string; // FUID from Kako, technical key if profile is linked

  profileName?: string; // App's internal name, fallback or synced from Kako nickname    
  displayName?: string | null; 
  photoURL?: string | null; // App's internal avatar, fallback or synced from Kako avatar  
  level?: number; // Synced from KakoProfile if linked
  
  // profileHeader?: string; // No longer used in current profile design
  bio?: string;              
  isVerified?: boolean;      
  followerCount?: number;    
  followingCount?: number;   
  followingIds?: string[]; 
  photos?: string[];         
  gender?: 'male' | 'female' | 'other' | 'preferNotToSay';
  birthDate?: string; // Stored as "yyyy-MM-dd" string        
  country?: string;
  phoneNumber?: string;
  hostStatus?: 'approved' | 'pending_review' | 'banned'; 
  isBanned?: boolean; 
  banReason?: string;
  bannedBy?: string; 
  bannedAt?: any; 
  // civilStatus?: 'single' | 'married' | 'divorced' | 'widowed' | 'other' | 'preferNotToSay'; // Not currently used
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
  id: string; // FUID - Firestore Document ID
  numId?: number; 
  nickname: string;
  avatarUrl: string; // Mapped from 'avatar'
  level?: number;
  signature?: string; 
  gender?: number; 
  area?: string;
  school?: string;
  showId: string; // User-facing Show ID
  isLiving?: boolean; 
  roomId?: string; 
  lastFetchedAt?: any; 
}

export interface KakoGift {
  id: string; 
  name: string; 
  imageUrl: string; 
  diamond?: number | null; 
  display?: boolean; 
  createdAt?: any;
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
  // extractedRoomId?: string; // Not directly needed on ChatMessage type if filtering happens before state update
  userId?: string; 
  userLevel?: number; 
  gender?: number; 
}

export interface ConversationPreview {
  id: string;
  userId: string; 
  userName: string;
  userAvatar: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount?: number;
  isOnline?: boolean;
  isPinned?: boolean;
}

export interface AppMessage { 
  id: string; 
  conversationId: string;
  senderId: string; 
  senderName: string;
  senderAvatar?: string | null; 
  text: string;
  timestamp: any; 
  isCurrentUser?: boolean; 
  status?: 'sent' | 'delivered' | 'read'; 
}

export interface FirestoreConversation {
  id?: string; 
  participants: string[]; 
  participantNames: { [uid: string]: string }; 
  participantAvatars: { [uid: string]: string | null }; 
  lastMessageText?: string;
  lastMessageTimestamp?: any; 
  lastMessageSenderId?: string; 
  unreadCounts?: { [uid: string]: number }; 
  createdAt: any; 
  updatedAt: any; 
}

export interface FirestoreMessage { 
  id?: string; 
  senderId: string; 
  text: string;     
  timestamp: any;   
  imageUrl?: string; 
}

export interface FeedPost {
  id: string; 
  userId?: string; 
  user: UserSummary; 
  postTitle?: string;
  content: string;
  timestamp: any; 
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
  handle: string; 
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
  storagePath?: string; // Added for Firebase Storage path
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
  eventName?: string; // e.g., 'gameStart', 'winnerSound' - for type 'gameEvent'
  displayName: string; 
  audioUrl?: string;
  fileName?: string;
  storagePath?: string;
  uploadedAt?: any; 
  keyword?: string; // for type 'interaction'
  associatedGiftId?: string; // for type 'interaction'
  associatedGiftName?: string; // for type 'interaction', denormalized
}

export interface BingoBallSetting {
  ballNumber: number;
  imageUrl?: string;
  imageStoragePath?: string;
  audioUrl?: string;
  audioStoragePath?: string;
  lastUpdatedAt?: any; // Firestore Timestamp
}
