
export interface Game {
  id?: string; // Firestore document ID
  title: string;
  status: 'planejada' | 'ativa' | 'pausada' | 'finalizada' | 'cancelada';
  bingoType: '75-ball' | '90-ball';
  cardPrice?: number;

  prizeType?: 'kako_virtual' | 'cash' | 'other';
  prizeKakoVirtualId?: string; // ID of the selected BingoPrize document
  prizeCashAmount?: number;
  prizeDescription: string;

  bingoRoomId?: string; // ID of the selected BingoRoomSetting
  bingoRoomName?: string; // Denormalized name of the room

  startTime: any; // Firestore Timestamp
  actualStartTime?: any; // Firestore Timestamp
  endTime?: any; // Firestore Timestamp

  participantsCount?: number;
  cardsSold?: number;
  totalRevenue?: number;

  drawnBalls?: number[];
  lastDrawnBall?: number | null;

  winners?: GameWinner[];

  createdBy?: string; // UID of admin who created it
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
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

  showId?: string; // User-facing Kako Show ID
  kakoLiveId?: string; // FUID from Kako (technical ID)
  kakoLiveRoomId?: string; // Specific room ID for host's live stream

  profileName?: string;
  displayName?: string | null;
  photoURL?: string | null;
  level?: number; // From linked KakoProfile, populated by AuthContext

  hostStatus?: 'approved' | 'pending_review' | 'banned';

  bio?: string;
  isVerified?: boolean;
  followerCount?: number;
  followingCount?: number;
  followingIds?: string[];
  photos?: string[];
  gender?: 'male' | 'female' | 'other' | 'preferNotToSay';
  birthDate?: string; // YYYY-MM-DD
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
  agreedToTermsAt?: any; // Firestore Timestamp
  createdAt?: any;
  updatedAt?: any;
  currentDiamondBalance?: number; // Added for diamond balance
}

export interface KakoProfile {
  id: string; // FUID - This is the document ID in 'kakoProfiles' Firestore collection
  numId?: number;
  nickname: string;
  avatarUrl: string; // Mapped from 'avatar' in Kako API
  level?: number;
  signature?: string;
  gender?: number; // 1 for male, 2 for female
  area?: string;
  school?: string;
  showId: string;
  isLiving?: boolean;
  roomId?: string;
  lastFetchedAt?: any; // Firestore Timestamp
}

export interface KakoGift {
  id: string;
  name: string;
  imageUrl: string | null;
  storagePath?: string | null;
  diamond?: number | null;
  display?: boolean;
  createdAt?: any;
  updatedAt?: any;
  dataAiHint?: string;
}

export interface BingoPrize {
  id?: string;
  name: string;
  type: 'kako_virtual' | 'cash' | 'other';
  imageUrl?: string;
  storagePath?: string;
  kakoGiftId?: string;
  valueDisplay?: string;
  description?: string;
  isActive: boolean;
  quantityAvailable?: number | null;
  createdAt: any;
  updatedAt: any;
  createdBy?: string;
}


export interface FirestoreMessage {
  senderId: string;
  text: string;
  timestamp: any;
  imageUrl?: string;
}

export interface ConversationPreview {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string | null;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount?: number;
  isOnline?: boolean;
  isPinned?: boolean;
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

export interface AppMessage {
  id?: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string | null;
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
  imageStoragePath?: string; // For app-uploaded images
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

export interface BingoRoomSetting {
  id?: string;
  roomId: string;
  description?: string;
  isActive: boolean;
  addedBy?: string;
  addedAt?: any;
  lastCheckedAt?: any;
}

export interface UserWallet {
  id?: string; // Typically the user's UID
  kakoId: string; // FUID or Show ID, for cross-referencing if needed
  diamonds: number;
  lastUpdatedAt?: any;
}

export interface WalletConfig {
  autoAddDiamondsOnGift: boolean;
  autoAddThreshold: number;
  enableDonationsToHostWalletsForLinkedRooms?: boolean;
}
