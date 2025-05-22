
export interface Game {
  id?: string; // Firestore document ID
  title: string;
  status: 'planejada' | 'ativa' | 'pausada' | 'finalizada' | 'cancelada'; // Planned, Active, Paused, Ended, Cancelled
  bingoType: '75-ball' | '90-ball';
  cardPrice?: number; // Price per card, 0 for free
  
  // Option 1: Embed simplified prize info or link to complex prize objects
  prizeDescription?: string; // Simple text description of main prize(s)
  prizeIds?: string[]; // Array of IDs linking to a 'bingoPrizes' collection

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
  kakoLiveId?: string;     

  profileName?: string;      
  displayName?: string | null; 
  photoURL?: string | null;    
  level?: number;            
  
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
  id: string; 
  numId?: number; 
  nickname: string;
  avatarUrl: string; 
  level?: number;
  signature?: string; 
  gender?: number; 
  area?: string;
  school?: string;
  showId: string; 
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
  id: string;
  conversationId: string;
  senderId: string; 
  senderName: string;
  senderAvatar: string;
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

export interface SiteModule {
  id: string;
  name: string;
  icon: React.ElementType;
  globallyOffline: boolean;
  isHiddenFromMenu: boolean;
  minimumAccessLevelWhenOffline: MinimumAccessLevel;
}
export type UserRole = 'master' | 'admin' | 'suporte' | 'host' | 'player';
export type MinimumAccessLevel = UserRole | 'nobody';


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

export interface SidebarNavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  href?: string;
  action?: () => void;
  adminOnly?: boolean;
  separatorAbove?: boolean;
  new?: boolean; 
}

export type SidebarFooterItem = SidebarNavItem; 

