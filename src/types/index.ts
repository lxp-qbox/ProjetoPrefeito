
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
  gender?: number; 
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
  timestamp: any; // Can be Firestore Timestamp or string for display
  isCurrentUser?: boolean; 
  status?: 'sent' | 'delivered' | 'read';
}

export interface FirestoreConversation {
  id?: string; 
  participants: string[]; // Array of user UIDs
  participantNames: { [uid: string]: string }; 
  participantAvatars: { [uid: string]: string | null }; 
  lastMessageText?: string;
  lastMessageTimestamp?: any; // Firestore Timestamp
  lastMessageSenderId?: string; 
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
  // Add other fields like groupName, groupAvatar if it's a group chat
}

export interface FirestoreMessage { 
  id?: string; // Document ID
  senderId: string; // UID of the user who sent the message
  text: string;     // The content of the message
  timestamp: any;   // Firestore Server Timestamp (for ordering)
  imageUrl?: string; // Optional: if you support image messages
}

export interface FeedPost {
  id: string; 
  userId?: string; // UID of the user who created the post
  user: UserSummary; 
  postTitle?: string;
  content: string;
  timestamp: any; // Firestore Timestamp
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
  handle: string; // User's role/title, e.g., "UI/UX Designer" or "@username"
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
  handle: string; // User's role/title or @username
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
  cardNumbers: (number | null)[][]; // The 3x9 (90-ball) or 5x5 (75-ball) array of numbers
  creatorId: string; // UID of the user who generated/created this card, or "system"
  createdAt: any; // Firestore Timestamp
  usageHistory: CardUsageInstance[]; // Array of usage instances
  timesAwarded: number; // How many times this card has been a winner
  awardsHistory: AwardInstance[]; // Details of each win
}

// New type for Bingo Prizes
export interface BingoPrize {
  id: string; // Unique ID for this prize entry in your DB (e.g., auto-generated by Firestore)
  name: string; // Name of the prize, e.g., "Créditos Kako Live (1000)", "Vale Presente R$50"
  description?: string; // Optional longer description
  type: 'kako_virtual' | 'cash' | 'physical_item' | 'other'; // Type of prize
  imageUrl?: string; // URL for an image representing the prize
  valueDisplay?: string; // Formatted value for display, e.g., "1000 Créditos", "R$ 50,00"
  
  // Specific to Kako Live virtual items
  kakoGiftId?: string; // If it maps to a specific Kako Live gift ID
  kakoGiftName?: string; // The name of the Kako Live gift (can be denormalized)
  kakoGiftImageUrl?: string; // The image URL of the Kako Live gift (can be denormalized)

  isActive: boolean; // Is this prize currently offered in games?
  quantityAvailable?: number | null; // null for unlimited, number for limited quantity
  
  // Admin fields
  createdAt: any; // Firestore Timestamp when this prize was added to your DB
  updatedAt: any; // Firestore Timestamp
  createdBy?: string; // UID of admin who created/last updated it
}

// Sidebar navigation items
export interface SidebarNavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  href?: string;
  action?: () => void;
  adminOnly?: boolean;
  separatorAbove?: boolean;
  new?: boolean; // For "New" badge
}

export type SidebarFooterItem = SidebarNavItem; // Can be the same or extended
