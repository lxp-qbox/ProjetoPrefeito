
export interface Game {
  id?: string; // Firestore document ID
  title: string;
  status: 'planejada' | 'ativa' | 'pausada' | 'finalizada' | 'cancelada';
  bingoType: '75-ball' | '90-ball';
  cardPrice?: number | null;

  prizeType?: 'kako_virtual' | 'cash' | 'other' | null;
  prizeKakoVirtualId?: string | null; // ID of the selected BingoPrize document
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

export interface ReceivedGift { // Used in Host placeholder data
  id: string;
  name: string;
  iconUrl: string;
  count: number;
  dataAiHint?: string | null;
}

export interface Host { // This type is primarily for the placeholder data in /app/hosts/page.tsx
  id: string; // App-specific ID for the placeholder list
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
  kakoLiveFuid?: string | null; // Actual FUID from Kako
  kakoLiveRoomId?: string | null; // Actual RoomID from Kako
  bio?: string | null;
  streamTitle?: string | null;
  likes?: number | null;
  giftsReceived?: ReceivedGift[];
  createdAt?: any | null;
  lastSeen?: any | null;
  source?: 'kakoLive' | 'manual' | null;
  totalDonationsValue?: number | null;
}

export interface UserProfile { // For 'accounts' Firestore collection
  uid: string; // Firebase Auth UID
  email?: string | null;
  role?: 'player' | 'host' | null;
  adminLevel?: 'master' | 'admin' | 'suporte' | null;

  showId?: string | null; // User-facing Kako Show ID
  kakoLiveId?: string | null; // Technical FUID from Kako (linked KakoProfile.id)
  kakoLiveRoomId?: string | null; // If host has a specific room for their main stream

  profileName?: string | null; // App's display name, potentially synced from KakoProfile.nickname
  displayName?: string | null; // Firebase Auth display name
  photoURL?: string | null;    // Firebase Auth photoURL, potentially synced from KakoProfile.avatarUrl
  level?: number | null;       // User's level, potentially synced from KakoProfile.level

  hostStatus?: 'approved' | 'pending_review' | 'banned' | null;

  bio?: string | null;
  isVerified?: boolean; // Reflects firebaseUser.emailVerified
  followerCount?: number;
  followingCount?: number;
  followingIds?: string[];
  photos?: string[];
  gender?: 'male' | 'female' | 'other' | 'preferNotToSay' | null;
  birthDate?: string | null; // YYYY-MM-DD
  country?: string | null;
  phoneNumber?: string | null;
  isBanned?: boolean;
  banReason?: string | null;
  bannedBy?: string | null;
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
  createdAt?: any | null; // Firestore Timestamp
  updatedAt?: any | null; // Firestore Timestamp
  currentDiamondBalance?: number; 
}

export interface KakoProfile { // For 'kakoProfiles' Firestore collection
  id: string; // FUID - This is the document ID in 'kakoProfiles' Firestore collection
  numId?: number | null;
  nickname: string;
  avatarUrl: string; // Mapped from Kako's 'avatar' field
  level?: number | null;
  signature?: string | null;
  gender?: number | null; // 1 for male, 2 for female
  area?: string | null;
  school?: string | null;
  showId: string; // User-facing searchable ID from Kako
  isLiving?: boolean | null;
  roomId?: string | null; // If this profile is currently live in a room
  lastFetchedAt?: any | null; // Firestore Timestamp
}

export interface KakoGift { // For 'kakoGifts' Firestore collection
  id: string; // Gift ID from Kako, used as document ID
  name: string;
  imageUrl: string | null;
  storagePath?: string | null; // If uploaded by admin
  diamond?: number | null;
  category?: string | null; // e.g., Sorte, Exclusivo, Interação, Fã-Clube
  display?: boolean; // If it should be generally available/shown
  createdAt?: any;
  updatedAt?: any;
  dataAiHint?: string | null;
}

export interface BingoPrize { // For 'bingoPrizes' Firestore collection
  id?: string; // Firestore auto-generated ID
  name: string;
  type: 'kako_virtual' | 'cash' | 'other';
  imageUrl?: string | null;
  storagePath?: string | null; // If image uploaded via admin panel
  kakoGiftId?: string | null; // If type is kako_virtual, references ID in KakoGift
  valueDisplay?: string | null; // e.g., "R$ 100,00" or "Coroa Kako"
  description?: string | null;
  isActive: boolean;
  quantityAvailable?: number | null;
  createdAt: any;
  updatedAt: any;
  createdBy?: string | null; // UID of admin who created it
}


export interface FirestoreConversation {
  id?: string; // Firestore document ID
  participants: string[]; // Array of user UIDs
  participantInfo: { 
    [uid: string]: { // Denormalized info for quick display
      name?: string | null;
      avatar?: string | null;
    }
  };
  lastMessageText?: string | null;
  lastMessageTimestamp?: any | null; // Firestore Server Timestamp
  lastMessageSenderId?: string | null;
  unreadCounts?: { [uid: string]: number }; // uid: count
  createdAt: any; // Firestore Server Timestamp
  updatedAt: any; // Firestore Server Timestamp
}

export interface FirestoreMessage {
  id?: string; // Firestore document ID
  senderId: string; 
  text: string;     
  timestamp: any; // Firestore Server Timestamp   
  imageUrl?: string | null; 
  // readBy?: string[]; // For group chats later
}

export interface ConversationPreview { // For UI display
  id: string; // Firestore document ID of the conversation
  userId: string; // The OTHER user's UID in a 1-on-1 chat
  userName: string;
  userAvatar?: string | null;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount?: number;
  isOnline?: boolean;
  isPinned?: boolean;
}

export interface AppMessage { // For UI display
  id?: string; // Firestore document ID of the message
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string | null;
  text: string;
  timestamp: any; // Can be Date object or string for display
  imageUrl?: string | null;
  isCurrentUser?: boolean;
  status?: 'sent' | 'delivered' | 'read' | null;
}

export interface FeedPost {
  id?: string; // Firestore document ID
  userId?: string; // UID of the author from 'accounts' collection
  user: UserSummary; 
  postTitle?: string | null;
  content: string;
  timestamp: any; // Firestore Timestamp or Date for display
  imageUrl?: string | null;
  imageAiHint?: string | null;
  imageStoragePath?: string | null; 
  stats: {
    replies: number;
    retweets: number;
    likes: number;
  };
}

export interface UserSummary { // Denormalized user info for posts/comments
  name: string;
  handle?: string; // User's handle or role
  avatarUrl?: string | null; 
  dataAiHint?: string | null;
}

export interface Trend { // For "What's Happening" widget
  id: string;
  category?: string | null;
  topic: string;
  posts?: string | null; // e.g., "18.8K posts"
  icon?: React.ElementType;
}

export interface SuggestedUser { // For "Who to Follow" widget
  id: string; // User UID
  name: string;
  handle: string; // Can be description or actual handle
  avatarUrl: string | null; 
  dataAiHint?: string | null;
}

export interface BanEntry { // For admin banishment list
  id: string; // Firestore document ID
  userId: string; // UID of the banned user
  userName?: string | null;
  userAvatar?: string | null;
  reason: string;
  bannedByUid: string; // UID of the admin who banned
  bannedByName?: string | null;
  bannedAt: any; // Firestore Timestamp
  expiresAt?: any | null; // Firestore Timestamp
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
  userId: string; // UID of the player using the card
  gameId: string;
  timestamp: any; // Firestore Timestamp
  isWinner?: boolean;
}

export interface AwardInstance {
  gameId: string;
  userId: string; // UID of the winner
  timestamp: any; // Firestore Timestamp
}

export interface GeneratedBingoCard {
  id: string; // Firestore document ID
  cardNumbers: (number | null)[][];
  creatorId: string; // UID of user who generated it, or "system"
  createdAt: any; // Firestore Timestamp
  usageHistory: CardUsageInstance[];
  timesAwarded: number;
  awardsHistory: AwardInstance[];
}

export interface BingoBallLocutorAudio {
  audioUrl: string;
  audioStoragePath: string;
  fileName: string;
  uploadedAt: any; // Firestore Timestamp
}
export interface BingoBallSetting {
  ballNumber: number; // Used as document ID in Firestore (as string)
  imageUrl?: string | null;
  imageStoragePath?: string | null;
  locutorAudios?: {
    [locutorId: string]: BingoBallLocutorAudio; // e.g., "Padrão", "José"
  } | null;
  lastUpdatedAt?: any | null; // Firestore Timestamp
}

export interface AudioSetting { // For game event audios and interaction audios
  id: string; // Firestore document ID (e.g., 'audioInicioPartida' or auto-ID for interaction)
  type: 'gameEvent' | 'interaction';
  eventName?: string | null; // For gameEvent: 'Início da Partida', etc.
  displayName: string; // User-friendly name
  audioUrl?: string | null;
  fileName?: string | null;
  storagePath?: string | null; // Path in Firebase Storage
  uploadedAt?: any | null; // Firestore Timestamp
  keyword?: string | null; // For interaction audios
  associatedGiftId?: string | null; // For interaction audios, links to BingoPrize.id
  associatedGiftName?: string | null; // Denormalized for display
  createdBy?: string | null; // UID of admin
}

export interface BingoRoomSetting {
  id?: string; // Firestore document ID
  roomId: string; // Kako Live Room ID
  description?: string | null;
  isActive: boolean;
  addedBy?: string | null; // UID of admin who added it
  addedAt?: any | null; // Firestore Timestamp
  lastCheckedAt?: any | null; // Firestore Timestamp, for when data was last pulled or connection attempted
}

export interface UserWallet {
  id?: string; // Firestore document ID (typically user UID)
  kakoId: string; // User's Kako FUID or Show ID - needs consistent usage
  diamonds: number;
  lastUpdatedAt?: any | null; // Firestore Timestamp
}

export interface WalletConfig {
  autoAddDiamondsOnGift: boolean;
  autoAddThreshold: number;
  enableDonationsToHostWalletsForLinkedRooms?: boolean;
}

export interface ChatMessage { // For host stream page chat UI
  id: string; // Unique ID for the message (server ID or client-generated)
  user: string; // Sender's name
  avatar?: string | null;
  userMedalUrl?: string | null;
  message: string;
  timestamp: string; // Formatted time string for display
  rawData?: string | null; // Original WebSocket message string
  displayFormatted: boolean; // Whether to show the formatted message or just raw data placeholder
  gender?: number | null; // 1 for male, 2 for female
}

// For WebSocket Link Tester
export interface ParsedUserData {
  nickname?: string;
  avatarUrl?: string | null;
  level?: number;
  showId?: string;
  userId?: string; // FUID
  gender?: number;
}

export interface LogEntry { // For WebSocket Link Tester page & global WS logs
  id: string;
  timestamp: string;
  type: 'received' | 'sent' | 'system' | 'error';
  message: string; // Formatted message for display
  originalData?: string; // Raw string from WS
  parsedData?: Record<string, any>; // Parsed JSON object
  isJson: boolean;
  classification?: string; // e.g., "Dados da Sala", "Mensagem de Chat"
  parsedUserData?: ParsedUserData;
  giftInfo?: {
    senderNickname?: string;
    senderUserId?: string;
    giftId?: string;
    giftCount?: number;
    isDonationToHost?: boolean;
  };
}

export interface WebSocketConfig { // For app_settings/live_data_config
  webSocketUrlList?: string[] | null;
}
