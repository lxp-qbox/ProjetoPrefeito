
export interface Game {
  id?: string; // Firestore document ID
  title: string;
  status: 'planejada' | 'ativa' | 'pausada' | 'finalizada' | 'cancelada'; // Planned, Active, Paused, Ended, Cancelled
  bingoType: '75-ball' | '90-ball';
  cardPrice?: number; // Price per card, 0 for free
  
  prizeType?: 'kako_virtual' | 'cash' | 'other';
  prizeKakoVirtualId?: string; // ID of the BingoPrize document if type is kako_virtual
  prizeCashAmount?: number; // Amount if type is cash
  prizeDescription: string; // General description, or main description for 'other'/'cash'

  startTime: any; // Firestore Timestamp for scheduled start
  actualStartTime?: any; // Firestore Timestamp for when it actually started
  endTime?: any; // Firestore Timestamp for when it ended or was cancelled

  // Statistics - These might be aggregated or calculated
  participantsCount?: number; // Number of unique players who joined
  cardsSold?: number;
  totalRevenue?: number; // Calculated from cardsSold * cardPrice

  // Game State - Specific to an active game instance
  drawnBalls?: number[]; // Array of balls drawn in order
  lastDrawnBall?: number | null;
  gamePatternToWin?: string; // For 75-ball bingo, e.g., "LINE", "FULL_HOUSE", "X_PATTERN"
  // winningConditions?: any; // Could be complex object defining win patterns

  // Winners
  winners?: GameWinner[];

  // Admin fields
  createdBy?: string; // UID of admin who created it
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
  notes?: string; // Admin notes
}

export interface GameWinner {
  userId: string; // UID of the winning user
  userName?: string; // Denormalized for display
  prizeId?: string; // ID of the prize won (links to BingoPrize collection)
  prizeDescription?: string; // Denormalized prize description
  claimedAt?: any; // Timestamp
  winningCardId?: string; // ID of the card that won
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
  
  showId?: string;          
  kakoLiveId?: string;     // FUID from Kako

  profileName?: string;      
  displayName?: string | null; 
  photoURL?: string | null;    
  level?: number; // Populated from linked KakoProfile if available
  
  profileHeader?: string;    
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
  hostStatus?: 'approved' | 'pending_review' | 'banned'; 
  isBanned?: boolean; 
  banReason?: string;
  bannedBy?: string; 
  bannedAt?: any; 
  civilStatus?: 'single' | 'married' | 'divorced' | 'widowed' | 'other' | 'preferNotToSay';
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
  id: string; // Gift ID from Kako API, used as Firestore Document ID
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
  message: string;
  timestamp: string;
  userMedalUrl?: string;
  rawData?: string;
  displayFormatted: boolean; 
  extractedRoomId?: string; 
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
  id: string; // Firestore document ID
  conversationId: string;
  senderId: string; 
  senderName: string;
  senderAvatar?: string | null; // Made optional
  text: string;
  timestamp: any; // Firestore Server Timestamp or Date
  isCurrentUser?: boolean; // Client-side only
  status?: 'sent' | 'delivered' | 'read'; // For current user's messages
}

export interface FirestoreConversation {
  id?: string; 
  participants: string[]; // Array of UIDs
  participantNames: { [uid: string]: string }; // Denormalized for quick display
  participantAvatars: { [uid: string]: string | null }; // Denormalized
  lastMessageText?: string;
  lastMessageTimestamp?: any; // Firestore Server Timestamp
  lastMessageSenderId?: string; 
  unreadCounts?: { [uid: string]: number }; // Unread count for each participant
  createdAt: any; // Firestore Server Timestamp
  updatedAt: any; // Firestore Server Timestamp
}

export interface FirestoreMessage { 
  id?: string; // Firestore document ID
  senderId: string; 
  text: string;     
  timestamp: any;   // Firestore Server Timestamp
  imageUrl?: string; 
}

export interface FeedPost {
  id: string; 
  userId?: string; 
  user: UserSummary; 
  postTitle?: string;
  content: string;
  timestamp: any; // Firestore Timestamp or Date
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
  handle: string; // Can be description like "CEO of Apple"
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

// For Maintenance Rules
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
// End for Maintenance Rules


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
  creatorId: string; // ID of user who created/generated the card
  createdAt: any; 
  // removed generatedByIpAddress
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
  valueDisplay?: string; // E.g., "10.000 Diamantes", "R$ 50,00"
  
  kakoGiftId?: string; // Specific ID from Kako Live API if it's a Kako gift
  kakoGiftName?: string; // Name from Kako Live API
  kakoGiftImageUrl?: string; // Image URL from Kako Live API

  isActive: boolean; 
  quantityAvailable?: number | null; // null for unlimited
  
  createdAt: any; // Firestore Server Timestamp
  updatedAt: any; // Firestore Server Timestamp
  createdBy?: string; // UID of admin who created it
}
