
export interface Game {
  id?: string; // Firestore document ID
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

  startTime: any; // Firestore Timestamp
  actualStartTime?: any | null; // Firestore Timestamp
  endTime?: any | null; // Firestore Timestamp

  participantsCount?: number;
  cardsSold?: number;
  totalRevenue?: number;

  drawnBalls?: number[];
  lastDrawnBall?: number | null;

  winners?: GameWinner[];

  createdBy?: string | null; // User UID
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
  notes?: string | null;
}

export interface GameWinner {
  userId: string;
  userName?: string | null;
  prizeId?: string | null;
  prizeDescription?: string | null;
  claimedAt?: any | null; // Firestore Timestamp
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

  showId?: string; // Kako user-facing Show ID
  kakoLiveId?: string; // Kako FUID

  profileName?: string | null;
  displayName?: string | null; // Typically from Firebase Auth, synced to profileName
  photoURL?: string | null; // User's avatar
  level?: number; // This should come from linked KakoProfile via AuthContext

  hostStatus?: 'approved' | 'pending_review' | 'banned' | null;

  bio?: string | null;
  isVerified?: boolean; // Email verification status from Firebase Auth
  followerCount?: number;
  followingCount?: number;
  followingIds?: string[];
  photos?: string[];
  gender?: 'male' | 'female' | 'other' | 'preferNotToSay' | null;
  birthDate?: string | null; // Stored as "yyyy-MM-dd"
  country?: string | null;
  phoneNumber?: string | null;

  isBanned?: boolean;
  banReason?: string | null;
  bannedBy?: string | null; // UID of admin who banned
  bannedAt?: any | null; // Firestore Timestamp

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
  agreedToTermsAt?: any | null; // Firestore Timestamp

  createdAt?: any; // Firestore Timestamp
  updatedAt?: any; // Firestore Timestamp
  currentDiamondBalance?: number;
}

export interface KakoProfile {
  id: string; // Document ID in Firestore = FUID = Kako's userId
  numId?: number | null;
  nickname: string;
  avatarUrl: string | null; // Mapped from 'avatar' in Kako's API response
  level?: number | null;
  signature?: string | null;
  gender?: number | null; // 1 for male, 2 for female from Kako
  area?: string | null;
  school?: string | null;
  showId: string; // The user-facing searchable ID from Kako, e.g., "10785510"
  isLiving?: boolean | null;
  roomId?: string | null;
  lastFetchedAt?: any | null; // Firestore Timestamp
}

export interface KakoGift {
  id: string; // Gift ID from Kako, used as document ID
  name: string;
  imageUrl: string | null;
  storagePath?: string | null; // Path in Firebase Storage if uploaded by app
  diamond?: number | null;
  category?: string | null; // E.g., "Sorte", "Exclusivo"
  display?: boolean; // Should this gift be generally displayable in app's prize lists
  createdAt?: any;
  updatedAt?: any;
  dataAiHint?: string | null;
}

export interface BingoPrize {
  id?: string;
  name: string;
  type: 'kako_virtual' | 'cash' | 'other';
  imageUrl?: string | null;
  storagePath?: string | null; // If image uploaded by app
  kakoGiftId?: string | null; // ID of a KakoGift document
  valueDisplay?: string | null;
  description?: string | null;
  isActive: boolean;
  quantityAvailable?: number | null;
  createdAt: any;
  updatedAt: any;
  createdBy?: string | null;
}

export interface FirestoreConversation {
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

export interface FirestoreMessage {
  senderId: string;
  text: string;
  timestamp: any; // Firestore Server Timestamp
  imageUrl?: string | null;
}

export interface ConversationPreview {
  id: string;
  userId: string; // UID of the other participant
  userName: string;
  userAvatar?: string | null;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount?: number;
  isOnline?: boolean;
  isPinned?: boolean;
}

export interface AppMessage {
  id?: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string | null;
  text: string;
  timestamp: any; // Can be Date object for display, or Firestore Timestamp
  imageUrl?: string | null;
  isCurrentUser?: boolean;
  status?: 'sent' | 'delivered' | 'read' | null;
}

export interface FeedPost {
  id: string;
  userId?: string; // UID of the author
  user: UserSummary;
  postTitle?: string | null;
  content: string;
  timestamp: any; // Firestore Timestamp
  imageUrl?: string | null;
  imageAiHint?: string | null;
  imageStoragePath?: string | null;
  stats: {
    replies: number;
    retweets: number;
    likes: number;
  };
}

export interface UserSummary {
  name: string;
  handle?: string;
  avatarUrl?: string | null;
  dataAiHint?: string;
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
  id?: string; // Firestore document ID (should be user UID)
  kakoId?: string | null; // User's Kako FUID or Show ID - for reference. Can be empty initially.
  diamonds: number;
  lastUpdatedAt?: any | null;
}

export interface WalletConfig {
  autoAddDiamondsOnGift: boolean;
  autoAddThreshold: number;
  enableDonationsToHostWalletsForLinkedRooms?: boolean;
}

export interface ChatMessage {
  id: string;
  user: string;
  avatar?: string | null;
  userMedalUrl?: string | null;
  message: string;
  timestamp: any; // Can be Date object or Firestore Timestamp
  rawData?: string | null;
  displayFormatted: boolean;
  gender?: number | null; // 1 for male, 2 for female
}

export interface ParsedUserData {
  nickname?: string;
  avatarUrl?: string | null;
  level?: number;
  showId?: string;
  userId?: string; // FUID
  gender?: number;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  type: 'received' | 'sent' | 'system' | 'error' | 'info' | 'warning';
  message: string;
  originalData?: string;
  parsedData?: Record<string, any>; // Parsed JSON payload
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

export interface WebSocketConfig {
  webSocketUrlList?: string[] | null;
  primaryWebSocketUrl?: string | null;
}

    