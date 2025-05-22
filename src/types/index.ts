
export interface Game {
  id?: string; // Firestore document ID
  title: string;
  status: 'planejada' | 'ativa' | 'pausada' | 'finalizada' | 'cancelada';
  bingoType: '75-ball' | '90-ball';
  cardPrice?: number;

  prizeType?: 'kako_virtual' | 'cash' | 'other';
  prizeKakoVirtualId?: string; // ID of the selected BingoPrize document
  prizeCashAmount?: number;
  prizeDescription: string; // Main description or for 'other' type

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
  userId: string; // UID of the winning user from 'accounts'
  userName?: string; // Denormalized name
  prizeId?: string; // ID of the BingoPrize
  prizeDescription?: string; // Denormalized prize description
  claimedAt?: any; // Firestore Timestamp
  winningCardId?: string; // ID of the GeneratedBingoCard
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
  id: string; // This should be the giftId from Kako, used as the document ID in 'kakoGifts'.
  name: string;
  imageUrl: string | null; // Can be null if not yet set or not applicable
  storagePath?: string | null; // Path in Firebase Storage if uploaded by app
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
  storagePath?: string; // For app-uploaded images
  kakoGiftId?: string;
  valueDisplay?: string;
  description?: string;
  isActive: boolean;
  quantityAvailable?: number | null; // null for unlimited
  createdAt: any;
  updatedAt: any;
  createdBy?: string; // UID of admin
}


export interface FirestoreMessage {
  senderId: string; // UID of the user who sent the message
  text: string;     // The content of the message
  timestamp: any;   // Firestore Server Timestamp (for ordering)
  imageUrl?: string; // Optional: if you support image messages
}

export interface ConversationPreview {
  id: string; // Firestore document ID of the conversation
  userId: string; // UID of the other participant
  userName: string;
  userAvatar?: string | null; 
  lastMessage: string;
  lastMessageTime: string;
  unreadCount?: number;
  isOnline?: boolean;
  isPinned?: boolean;
}

export interface FirestoreConversation {
  id?: string; // Document ID
  participants: string[]; // Array of UIDs
  participantNames: { [uid: string]: string }; 
  participantAvatars: { [uid: string]: string | null }; 
  lastMessageText?: string;
  lastMessageTimestamp?: any; // Firestore Timestamp
  lastMessageSenderId?: string;
  unreadCounts?: { [uid: string]: number };
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
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
  id?: string; 
  kakoId: string; 
  diamonds: number;
  lastUpdatedAt?: any; 
}

export interface WalletConfig {
  autoAddDiamondsOnGift: boolean;
  autoAddThreshold: number; 
  enableDonationsToHostWalletsForLinkedRooms?: boolean;
}
