
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
  // gamePatternToWin?: string; // Example: "line", "full_house" - for 75-ball mainly

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
  id: string; // This is the App User ID (UID from Firebase Auth)
  rankPosition: number;
  name: string; // This should be UserProfile.profileName or displayName
  avatarUrl: string; // This should be UserProfile.photoURL
  dataAiHint?: string;
  avgViewers: number;
  timeStreamed: number;
  allTimePeakViewers: number;
  hoursWatched: string;
  rank?: number; // This could be UserProfile.level if sourced from KakoProfile
  followersGained: number;
  totalFollowers: string; // Could be UserProfile.followerCount
  totalViews: string;
  kakoLiveFuid?: string; // This is the FUID from Kako, stored in UserProfile.kakoLiveId
  kakoLiveRoomId?: string; // Stored in UserProfile if specific to the host's primary room
  bio?: string; // UserProfile.bio
  streamTitle?: string;
  likes?: number;
  giftsReceived?: ReceivedGift[];
  createdAt?: any; // UserProfile.createdAt
  lastSeen?: any; // UserProfile.updatedAt or a specific last_active field
  source?: 'kakoLive' | 'manual';
  totalDonationsValue?: number;
}

export interface UserProfile {
  uid: string;
  email?: string | null;
  role?: 'player' | 'host';
  adminLevel?: 'master' | 'admin' | 'suporte' | null;

  showId?: string; // User-facing Kako Show ID
  kakoLiveId?: string; // Technical FUID from Kako, linked from KakoProfile.id

  profileName?: string; // App's primary display name, can be synced from KakoProfile.nickname
  displayName?: string | null; // Firebase Auth display name
  photoURL?: string | null; // App's primary avatar, can be synced from KakoProfile.avatarUrl
  level?: number; // Synced from linked KakoProfile.level

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
  kakoLiveRoomId?: string; // If a host has a default/primary room ID
}

// Represents a profile as fetched or stored from Kako Live itself
export interface KakoProfile {
  id: string; // FUID - This is the document ID in 'kakoProfiles' Firestore collection
  numId?: number;
  nickname: string;
  avatarUrl: string; // Mapped from 'avatar' in Kako API
  level: number;
  signature?: string;
  gender?: number; // 1 for male, 2 for female
  area?: string;
  school?: string;
  showId: string; // User-facing Show ID from Kako
  isLiving?: boolean;
  roomId?: string;
  lastFetchedAt?: any; // Firestore Timestamp
}

export interface KakoGift {
  id: string; // This should be the giftId from Kako, used as the document ID in 'kakoGifts'.
  name: string;
  imageUrl: string | null;
  storagePath?: string | null; // Path in Firebase Storage if uploaded by app
  diamond?: number | null;
  display?: boolean;
  createdAt?: any;
  updatedAt?: any;
  dataAiHint?: string;
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
  userAvatar?: string | null; // Made optional to align with AppMessage
  lastMessage: string;
  lastMessageTime: string;
  unreadCount?: number;
  isOnline?: boolean;
  isPinned?: boolean;
}

export interface FirestoreConversation {
  id?: string; // Document ID
  participants: string[]; // Array of UIDs
  participantNames: { [uid: string]: string }; // Denormalized names for quick display
  participantAvatars: { [uid: string]: string | null }; // Denormalized avatars
  lastMessageText?: string;
  lastMessageTimestamp?: any; // Firestore Timestamp
  lastMessageSenderId?: string;
  unreadCounts?: { [uid: string]: number };
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
}

export interface AppMessage {
  id?: string; // Firestore document ID
  conversationId: string;
  senderId: string; // UID of the sender
  senderName: string; // Denormalized sender name
  senderAvatar?: string | null; // Denormalized sender avatar
  text: string;
  timestamp: any; // Firestore Timestamp or Date object
  imageUrl?: string;
  isCurrentUser?: boolean; // UI flag
  status?: 'sent' | 'delivered' | 'read';
  gender?: number; // For nickname color
  userMedalUrl?: string;
  rawData?: string;
  displayFormatted: boolean;
}

export interface FeedPost {
  id: string;
  userId?: string; // UID of the post author from 'accounts' collection
  user: UserSummary;
  postTitle?: string;
  content: string;
  timestamp: any; // Firestore Timestamp or Date object
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
  handle: string; // e.g., @username or role
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
  handle: string; // Can be username or role/description
  avatarUrl: string;
  dataAiHint?: string;
}

export interface BanEntry {
  id: string; // Firestore document ID
  userId: string; // UID of the banned user
  userName?: string; // Denormalized name
  userAvatar?: string | null; // Denormalized avatar
  reason: string;
  bannedByUid: string; // UID of the admin who banned
  bannedByName?: string; // Denormalized name of the admin
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
  id: string; // Firestore document ID
  cardNumbers: (number | null)[][];
  creatorId: string; // UID of who generated it (e.g., admin UID or "system")
  createdAt: any; // Firestore Timestamp
  usageHistory: CardUsageInstance[];
  timesAwarded: number;
  awardsHistory: AwardInstance[];
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
  ballNumber: number; // Document ID in Firestore will be ballNumber.toString()
  imageUrl?: string;
  imageStoragePath?: string;
  locutorAudios?: { // Map of locutorId to their audio for this ball
    [locutorId: string]: BingoBallLocutorAudio;
  };
  lastUpdatedAt?: any;
}

export interface BingoRoomSetting {
  id?: string; // Firestore document ID
  roomId: string; // The actual Kako Live Room ID
  description?: string;
  isActive: boolean;
  addedBy?: string; // UID of admin who added it
  addedAt?: any; // Firestore Timestamp
  lastCheckedAt?: any; // Firestore Timestamp, for when data was last pulled or connection verified
}

export interface UserWallet {
  id?: string; // Firestore document ID (could be the kakoId or a generated one)
  kakoId: string; // This should be the Kako User ID (FUID or Show ID, needs consistency)
  diamonds: number;
  lastUpdatedAt?: any; // Firestore Timestamp
}

export interface WalletConfig {
  autoAddDiamondsOnGift: boolean;
  autoAddThreshold: number; // e.g., 10 diamonds
}
