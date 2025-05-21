
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
  kakoLiveRoomId?: string;  // User's Kako Live Room ID for hosts (if they are a host)

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
  avatarUrl: string; 
  level?: number;
  signature?: string; 
  gender?: number; 
  area?: string;
  school?: string;
  showId?: string; 
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
  displayFormatted: boolean; // New flag
  extractedRoomId?: string; 
  userId?: string; 
  userLevel?: number; 
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

// New types for Generated Bingo Cards
export interface CardUsageInstance {
  userId: string; // UID of the player who used the card
  gameId: string; // ID of the game/match it was used in
  timestamp: any;   // Firestore Timestamp of when it was used
  isWinner?: boolean; // Optional: if you track wins per card usage
}

export interface AwardInstance {
  gameId: string;
  userId: string; // UID of the player who won with this card in this game
  timestamp: any; // Firestore Timestamp of when the award was registered
}

export interface GeneratedBingoCard {
  id: string; // Unique ID for the card document (e.g., hash or UUID)
  cardNumbers: (number | null)[][]; // The 3x9 array of numbers
  creatorId: string; // UID of the user who generated/created this card
  createdAt: any; // Firestore Timestamp
  usageHistory: CardUsageInstance[]; // Array of usage instances
  timesAwarded: number; // How many times this card has been a winner
  awardsHistory: AwardInstance[]; // Details of each win
}
