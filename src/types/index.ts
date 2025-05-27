
export interface Game {
  id?: string;
  title: string;
  status: 'planejada' | 'ativa' | 'pausada' | 'finalizada' | 'cancelada';
  bingoType: '75-ball' | '90-ball';
  cardPrice?: number | null;

  prizeType?: 'kako_virtual' | 'cash' | 'other';
  prizeKakoVirtualId?: string;
  prizeCashAmount?: number;
  prizeDescription: string;

  bingoRoomId?: string;
  bingoRoomName?: string;

  startTime: any;
  actualStartTime?: any | null;
  endTime?: any | null;

  participantsCount?: number;
  cardsSold?: number;
  totalRevenue?: number;

  drawnBalls?: number[];
  lastDrawnBall?: number | null;

  winners?: GameWinner[];

  createdBy?: string | null;
  createdAt: any;
  updatedAt: any;
  notes?: string | null;

  // For UI/Card display
  description?: string; // Optional description for game listings
  prize?: string; // Simplified prize display for game listings
  participants?: number; // From GameCard placeholder
  hostedBy?: string; // From HostGamesPage placeholder
  generatedCards?: number; // From BingoPlayPage
  countdownSeconds?: number; // From BingoPlayPage
  startTimeDisplay?: string; // From BingoPage placeholder
  endTimeDisplay?: string; // From FinishedGameCard placeholder
  imageAiHint?: string; // For game card images
  imageUrl?: string; // For game card images
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
  id: string; // Kako Live FUID, used as document ID in placeholderHosts
  rankPosition: number;
  name: string;
  avatarUrl: string;
  dataAiHint?: string;
  avgViewers: number;
  timeStreamed: number;
  allTimePeakViewers: number;
  hoursWatched: string;
  rank?: number | null; // User's level on Kako
  followersGained: number;
  totalFollowers: string;
  totalViews: string;
  kakoLiveFuid?: string | null; // Redundant if id is already FUID
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
  uid: string; // Firebase Auth UID, used as document ID in 'accounts'
  email?: string | null;
  role?: 'player' | 'host' | null;
  adminLevel?: 'master' | 'admin' | 'suporte' | null;

  showId?: string; // User-facing Kako Live Show ID
  kakoLiveId?: string; // Technical Kako Live FUID (synced from KakoProfile.id)

  profileName?: string | null; // App's display name, can be overridden by Kako nickname
  displayName?: string | null; // Firebase Auth display name, initial fallback
  photoURL?: string | null; // App's avatar, can be overridden by Kako avatar
  level?: number; // User's level (synced from KakoProfile.level)

  hostStatus?: 'approved' | 'pending_review' | 'banned' | null;

  bio?: string | null;
  isVerified?: boolean; // Email verified status
  isPremiumVerified?: boolean; // App-specific premium verification
  followerCount?: number;
  followingCount?: number;
  followingIds?: string[];
  photos?: string[];
  gender?: 'male' | 'female' | 'other' | 'preferNotToSay' | null;
  birthDate?: string | Date | null; // Store as YYYY-MM-DD string or Date
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

export interface KakoProfile { // Stored in 'kakoProfiles' collection, doc ID is FUID
  id: string; // FUID (userId from Kako API)
  numId?: number | null;
  nickname: string;
  avatarUrl: string | null; // Mapped from 'avatar' in Kako API
  level?: number | null;
  signature?: string | null;
  gender?: number | null; // 1 for male, 2 for female from Kako
  area?: string | null;
  school?: string | null;
  showId: string; // User-facing Show ID from Kako
  isLiving?: boolean | null;
  roomId?: string | null;
  lastFetchedAt?: any | null;
  createdAt?: any;
}

export interface KakoGift { // Stored in 'kakoGifts' collection
  id: string; // Gift ID from Kako, used as document ID
  name: string;
  imageUrl: string | null;
  storagePath?: string | null;
  diamond?: number | null;
  category?: string | null; // e.g., Sorte, Exclusivo, Interação, Fã-Clube
  display?: boolean;
  createdAt?: any;
  updatedAt?: any;
  dataAiHint?: string | null;
}


export interface ConversationPreview { // For UI display in conversations list
  id: string; // Firestore document ID of the conversation
  userId: string; // UID of the other participant
  userName: string;
  userAvatar?: string | null;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount?: number;
  isOnline?: boolean;
  isPinned?: boolean; // Placeholder for future pinning
}

export interface FirestoreConversation { // Stored in 'conversations' collection
  id?: string; // Firestore document ID
  participants: string[]; // Array of user UIDs
  participantInfo: {
    [uid: string]: {
      name?: string | null;
      avatar?: string | null;
    }
  };
  lastMessageText?: string | null;
  lastMessageTimestamp?: any | null; // Firestore Server Timestamp
  lastMessageSenderId?: string | null;
  unreadCounts?: { [uid: string]: number };
  createdAt: any; // Firestore Server Timestamp
  updatedAt: any; // Firestore Server Timestamp
}

export interface AppMessage { // For UI display and Firestore messages subcollection
  id?: string; // Firestore document ID
  conversationId: string;
  senderId: string;
  senderName: string; // Denormalized for UI
  senderAvatar?: string | null; // Denormalized for UI
  text: string;
  timestamp: any; // Firestore Server Timestamp
  imageUrl?: string | null;
  isCurrentUser?: boolean; // UI flag
  status?: 'sent' | 'delivered' | 'read' | null; // Message status
}

// This can be simplified if FirestoreMessage and AppMessage are mostly the same
export interface FirestoreMessage { // Structure for messages in subcollections
  senderId: string;
  text: string;
  timestamp: any; // Firestore Server Timestamp
  imageUrl?: string | null;
  status?: 'sent' | 'delivered' | 'read' | null;
  // Any other fields needed per message
}


export interface FeedPost {
  id: string;
  userId?: string; // UID of the author from 'accounts' collection
  user: UserSummary; // Denormalized author info
  postTitle?: string | null;
  content: string;
  timestamp: any; // Firestore Server Timestamp
  imageUrl?: string | null;
  imageAiHint?: string | null;
  imageStoragePath?: string | null;
  stats: {
    replies: number;
    retweets: number;
    likes: number;
  };
}

export interface UserSummary { // For denormalizing user info in posts/comments etc.
  name: string; // User's profileName or displayName
  handle?: string; // User's @handle (e.g., derived from email or a chosen username)
  avatarUrl?: string | null;
  dataAiHint?: string;
}

export interface Trend {
  id: string;
  category?: string | null;
  topic: string;
  posts?: string | null; // e.g. "18.8K posts"
  icon?: React.ElementType; // For TopicsWidget
}

export interface SuggestedUser {
  id: string; // User UID
  name: string;
  handle: string; // User's @handle or description
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
  kakoId?: string | null; // FUID or Show ID from Kako for mapping
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

export interface LogEntry { // Used in WebSocket Link Tester and Update Data (Chat)
  id: string;
  timestamp: string;
  type: 'received' | 'sent' | 'system' | 'error' | 'info' | 'warning';
  message: string; // Short summary or raw text if not JSON
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

export interface ParsedUserData { // Used with LogEntry
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

    