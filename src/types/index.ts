
import type React from 'react';
import type { Control } from "react-hook-form";

export interface Game {
  id?: string;
  title: string;
  status: 'planejada' | 'ativa' | 'pausada' | 'finalizada' | 'cancelada'; // planejada, ativa, pausada, finalizada, cancelada
  bingoType: '75-ball' | '90-ball';
  bingoRoomId?: string;
  bingoRoomName?: string;
  cardPrice?: number | null;

  prizeType?: 'kako_virtual' | 'cash' | 'other';
  prizeKakoVirtualId?: string;
  prizeCashAmount?: number;
  prizeDescription: string;

  startTime: any; // Firestore Timestamp or Date
  actualStartTime?: any | null;
  endTime?: any | null;

  participantsCount?: number;
  cardsSold?: number;
  totalRevenue?: number;

  drawnBalls?: number[];
  lastDrawnBall?: number | null;

  winners?: GameWinner[];

  createdBy?: string | null;
  createdAt?: any; // Firestore Timestamp
  updatedAt?: any; // Firestore Timestamp
  notes?: string | null;

  // For UI/Card display (can be removed if data is always structured from the above)
  description?: string;
  prize?: string;
  participants?: number;
  hostedBy?: string;
  generatedCards?: number;
  countdownSeconds?: number;
  startTimeDisplay?: string;
  endTimeDisplay?: string;
  imageAiHint?: string;
  imageUrl?: string;
}

export interface GameWinner {
  userId: string;
  userName?: string | null;
  prizeId?: string | null;
  prizeDescription?: string | null;
  claimedAt?: any | null;
  winningCardId?: string | null;
}

export interface SupportTicket {
  subject: string;
  message: string;
  userId?: string | null;
  createdAt: Date;
}

export interface ReceivedGift {
  id: string;
  name: string;
  iconUrl: string;
  count: number;
  dataAiHint?: string | null;
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
  rank?: number | null;
  followersGained: number;
  totalFollowers: string;
  totalViews: string;
  kakoLiveFuid?: string | null;
  kakoLiveRoomId?: string | null;
  bio?: string | null;
  streamTitle?: string | null;
  likes?: number | null;
  giftsReceived?: ReceivedGift[];
  createdAt?: any | null;
  lastSeen?: any | null;
  source?: 'kakoLive' | 'manual' | null;
  totalDonationsValue?: number | null;
}

export interface UserProfile {
  uid: string;
  email?: string | null;
  role?: 'player' | 'host' | null;
  adminLevel?: 'master' | 'admin' | 'suporte' | null;

  showId?: string; 
  kakoLiveId?: string; 

  profileName?: string | null;
  displayName?: string | null; 
  photoURL?: string | null;
  level?: number; 

  hostStatus?: 'approved' | 'pending_review' | 'banned' | null;
  isVerified?: boolean;
  isPremiumVerified?: boolean;
  
  followerCount?: number;
  followingCount?: number;
  followingIds?: string[]; 

  bio?: string | null;
  photos?: string[];
  gender?: 'male' | 'female' | 'other' | 'preferNotToSay' | null;
  birthDate?: string | Date | null; 
  country?: string | null;
  phoneNumber?: string | null;
  foundUsVia?: string | null;
  referralCode?: string | null;

  isBanned?: boolean;
  banReason?: string | null;
  bannedBy?: string | null;
  bannedAt?: any | null;

  socialLinks?: {
    twitter?: string | null;
    instagram?: string | null;
    facebook?: string | null;
    youtube?: string | null;
    twitch?: string | null;
  } | null;
  themePreference?: 'light' | 'dark' | 'system' | null;
  accentColor?: string | null;

  hasCompletedOnboarding?: boolean;
  agreedToTermsAt?: any | null;
  liveVerificationCompletedAt?: any;

  createdAt?: any;
  updatedAt?: any;
  currentDiamondBalance?: number;
}

export interface KakoProfile {
  id: string; // FUID (userId from Kako API)
  numId?: number | null;
  nickname: string;
  avatarUrl?: string | null;
  level?: number | null;
  signature?: string | null;
  gender?: number | null;
  area?: string | null;
  school?: string | null;
  showId: string;
  isLiving?: boolean | null;
  roomId?: string | null;
  lastFetchedAt?: any | null;
  createdAt?: any;
}

export interface KakoGift {
  id: string; 
  name: string;
  imageUrl: string | null; 
  storagePath?: string | null;
  diamond?: number | null;
  category?: string | null; 
  display?: boolean; 
  createdAt?: any;
  updatedAt?: any;
  dataAiHint?: string | null;
}


export interface FirestoreConversation {
  id?: string;
  participants: string[]; // Array of user UIDs
  participantInfo: {
    [uid: string]: {
      name?: string | null;
      avatar?: string | null;
    }
  };
  lastMessageText?: string | null;
  lastMessageTimestamp?: any | null; 
  lastMessageSenderId?: string | null;
  unreadCounts?: { [uid: string]: number };
  createdAt: any; 
  updatedAt: any; 
}

export interface AppMessage {
  id?: string; 
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string | null;
  text: string;
  timestamp: any; // Firestore Server Timestamp or JS Date after fetch
  imageUrl?: string | null;
  isCurrentUser?: boolean; 
  status?: 'sent' | 'delivered' | 'read' | null;
  gender?: number | null;
}

export interface FirestoreMessage {
  senderId: string;
  text: string;
  timestamp: any; 
  imageUrl?: string | null;
  status?: 'sent' | 'delivered' | 'read' | null;
}

export interface UserSummary {
  name: string;
  handle: string;
  avatarUrl?: string | null;
  dataAiHint?: string;
}

export interface FeedPost {
  id: string;
  userId: string; // UID of the author
  user: UserSummary; // Denormalized author info
  postTitle?: string | null;
  content: string;
  timestamp: any; // Firestore Server Timestamp or JS Date after fetch
  imageUrl?: string | null;
  imageAiHint?: string | null;
  imageStoragePath?: string | null;
  stats: {
    replies: number;
    retweets: number;
    likes: number;
  };
}

export interface Trend {
  id: string;
  category?: string | null;
  topic: string;
  posts?: string | null; 
  icon?: React.ElementType;
}

export interface SuggestedUser {
  id: string; 
  name: string;
  handle: string; 
  avatarUrl: string | null;
  dataAiHint?: string;
}

export interface BanEntry {
  id: string;
  userId: string;
  userName?: string | null;
  userAvatar?: string | null;
  reason: string;
  bannedByUid: string;
  bannedByName?: string | null;
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

export interface BingoBallLocutorAudio {
  audioUrl: string;
  audioStoragePath: string;
  fileName: string;
  uploadedAt: any;
}

export interface BingoBallSetting {
  ballNumber: number;
  imageUrl?: string | null;
  imageStoragePath?: string | null;
  locutorAudios?: {
    [locutorId: string]: BingoBallLocutorAudio;
  } | null;
  lastUpdatedAt?: any | null;
}

export interface AudioSetting {
  id: string; 
  type: 'gameEvent' | 'interaction';
  eventName?: string | null; 
  displayName: string;
  audioUrl?: string | null;
  fileName?: string | null;
  storagePath?: string | null;
  uploadedAt?: any | null; 
  keyword?: string | null;
  associatedGiftId?: string | null;
  associatedGiftName?: string | null; 
  createdBy?: string | null;
}

export interface BingoRoomSetting {
  id?: string; 
  roomId: string;
  description?: string | null;
  isActive: boolean;
  addedBy?: string | null;
  addedAt?: any | null;
  lastCheckedAt?: any | null; 
}

export interface UserWallet {
  id?: string; // Typically user.uid
  kakoId?: string | null; 
  diamonds: number;
  lastUpdatedAt?: any | null;
}

export interface WalletConfig {
  autoAddDiamondsOnGift: boolean;
  autoAddThreshold: number;
  enableDonationsToHostWalletsForLinkedRooms?: boolean;
}

export interface ChatMessage { // Used in HostStreamPage
  id: string;
  user: string;
  avatar?: string | null;
  userMedalUrl?: string | null;
  message: string;
  timestamp: any;
  rawData?: string | null;
  displayFormatted: boolean;
  gender?: number | null;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  type: 'received' | 'sent' | 'system' | 'error' | 'info' | 'warning';
  message: string; 
  originalData?: string;
  parsedData?: Record<string, any>;
  isJson: boolean;
  classification?: string;
  parsedUserData?: ParsedUserData;
  giftInfo?: {
    senderNickname?: string;
    senderUserId?: string;
    giftId?: string;
    giftCount?: number;
    isDonationToHost?: boolean;
  };
}

export interface ParsedUserData {
  nickname?: string;
  avatarUrl?: string | null;
  level?: number;
  showId?: string;
  userId?: string; // FUID
  gender?: number;
}

export interface WebSocketConfig {
  webSocketUrlList?: string[] | null;
  primaryWebSocketUrl?: string | null;
}

// Added for Feed Page
export interface SidebarNavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  href: string;
  new?: boolean; // For "New" badge
}

export interface Hashtag {
  id: string;
  name: string;
  href: string;
}
// Trend and SuggestedUser already exist and are suitable.
// FeedPost is also suitable for post data.
