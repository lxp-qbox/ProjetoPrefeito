
export interface Game {
  id: string;
  title: string;
  startTime: Date; 
  status: 'Upcoming' | 'Live' | 'Ended' | 'Aberta'; 
  hostedBy?: string;
  description?: string; 
  prize?: string;
  
  participants?: number;
  winners?: string; 
  additionalInfo?: string; 
  startTimeDisplay?: string; 
  endTimeDisplay?: string; 

  generatedCards?: number;
  countdownSeconds?: number;
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
  
  showId?: string;          // User's Kako Live Show ID (e.g., "10763129") - Primary link to KakoProfile
  kakoLiveId?: string;      // User's Kako Live FUID (technical ID from Kako, e.g., "0322d2dd...") - Stored after linking

  profileName?: string;      
  displayName?: string | null; 
  photoURL?: string | null;    
  level?: number;            // This will be dynamically populated from linked KakoProfile
  
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
  id: string; // Kako Live userId (FUID) - THIS IS THE DOCUMENT ID in 'kakoProfiles'
  numId?: number; 
  nickname: string;
  avatarUrl: string; // Mapped from 'avatar'
  level?: number;
  signature?: string; 
  gender?: number; // 1 for male, 2 for female (based on example)
  area?: string;
  school?: string;
  showId?: string; // The user-facing searchable ID from Kako
  isLiving?: boolean; 
  roomId?: string; 
  lastFetchedAt?: any; 
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
  gender?: number; // Added for nickname color coding
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

// --- Bingo Specific Types ---

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
  id: string; 
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
