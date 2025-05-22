
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

  bingoRoomId?: string;
  bingoRoomName?: string;

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
  rank?: number;
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
  kakoLiveId?: string; // FUID from Kako

  profileName?: string;
  displayName?: string | null;
  photoURL?: string | null;
  level?: number; // From linked KakoProfile

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
  id: string; // FUID - Firestore Document ID for kakoProfiles collection, Kako's userId
  numId?: number;
  nickname: string;
  avatarUrl: string; // Mapped from 'avatar' in Kako API
  level?: number;
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
  storagePath?: string; // Path in Firebase Storage if uploaded by app
  diamond?: number | null;
  display?: boolean;
  createdAt?: any;
  updatedAt?: any;
  dataAiHint?: string;
}


export interface FirestoreMessage {
  senderId: string;
  text: string;
  timestamp: any;
  imageUrl?: string;
}

export interface ConversationPreview {
  id: string;
  userId: string; // UID of the other participant
  userName: string;
  userAvatar: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount?: number;
  isOnline?: boolean;
  isPinned?: boolean;
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
  timestamp: any;
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
  storagePath?: string; // Added for app-uploaded images
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
  eventName?: string;
  displayName: string;
  audioUrl?: string;
  fileName?: string;
  storagePath?: string;
  uploadedAt?: any;
  keyword?: string;
  associatedGiftId?: string;
  associatedGiftName?: string;
  createdBy?: string;
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
    [locutorId: string]: BingoBallLocutorAudio;
  };
  lastUpdatedAt?: any;
}

export interface BingoRoomSetting {
  id?: string;
  roomId: string;
  description?: string;
  isActive: boolean;
  addedBy?: string;
  addedAt?: any;
  lastCheckedAt?: any;
}
