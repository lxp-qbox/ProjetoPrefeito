
export interface Game {
  id?: string; // Firestore document ID
  title: string;
  status: 'planejada' | 'ativa' | 'pausada' | 'finalizada' | 'cancelada';
  bingoType: '75-ball' | '90-ball';
  cardPrice?: number | null;

  prizeType?: 'kako_virtual' | 'cash' | 'other' | null;
  prizeKakoVirtualId?: string | null; // ID of the selected BingoPrize document
  prizeKakoVirtualName?: string | null; // Denormalized name for display
  prizeCashAmount?: number | null;
  prizeDescription: string;

  bingoRoomId?: string | null; // ID of the selected BingoRoomSetting
  bingoRoomName?: string | null; // Denormalized name of the room for display

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

  showId?: string | null; 
  kakoLiveId?: string | null; 
  kakoLiveRoomId?: string | null; 

  profileName?: string | null; 
  displayName?: string | null; 
  photoURL?: string | null;    
  level?: number | null;       

  hostStatus?: 'approved' | 'pending_review' | 'banned' | null;

  bio?: string | null;
  isVerified?: boolean; 
  followerCount?: number;
  followingCount?: number;
  followingIds?: string[];
  photos?: string[];
  gender?: 'male' | 'female' | 'other' | 'preferNotToSay' | null;
  birthDate?: string | null; 
  country?: string | null;
  phoneNumber?: string | null;
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
  createdAt?: any | null; 
  updatedAt?: any | null; 
  currentDiamondBalance?: number; 
}

export interface KakoProfile { 
  id: string; 
  numId?: number | null;
  nickname: string;
  avatarUrl: string; 
  level?: number | null;
  signature?: string | null;
  gender?: number | null; 
  area?: string | null;
  school?: string | null;
  showId?: string; 
  isLiving?: boolean | null;
  roomId?: string | null; 
  lastFetchedAt?: any | null; 
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

export interface BingoPrize { 
  id?: string; 
  name: string;
  type: 'kako_virtual' | 'cash' | 'other';
  imageUrl?: string | null;
  imageStoragePath?: string | null;
  kakoGiftId?: string | null; 
  valueDisplay?: string | null; 
  description?: string | null;
  isActive: boolean;
  quantityAvailable?: number | null;
  createdAt: any;
  updatedAt: any;
  createdBy?: string | null; 
}


export interface FirestoreConversation {
  id?: string; 
  participants: string[]; 
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

export interface FirestoreMessage {
  senderId: string; 
  text: string;     
  timestamp: any;   
  imageUrl?: string | null; 
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

export interface AppMessage { 
  id?: string; 
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string | null;
  text: string;
  timestamp: any; 
  imageUrl?: string | null;
  isCurrentUser?: boolean;
  status?: 'sent' | 'delivered' | 'read' | null;
}

export interface FeedPost {
  id?: string; 
  userId?: string; 
  user: UserSummary; 
  postTitle?: string | null;
  content: string;
  timestamp: any; 
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
  dataAiHint?: string | null;
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
  dataAiHint?: string | null;
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
  timestamp: string; 
  rawData?: string | null; 
  displayFormatted: boolean; 
  gender?: number | null; 
}

export interface ParsedUserData {
  nickname?: string;
  avatarUrl?: string | null;
  level?: number;
  showId?: string;
  userId?: string; 
  gender?: number;
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

export interface WebSocketConfig { 
  webSocketUrlList?: string[] | null;
  primaryWebSocketUrl?: string | null; // Added to store the active URL
}

  