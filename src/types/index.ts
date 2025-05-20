
export interface Game {
  id: string;
  title: string;
  startTime: Date; // For upcoming: start time. For ended: can be original start time or actual end time.
  status: 'Upcoming' | 'Live' | 'Ended' | 'Aberta'; // Added 'Aberta' status
  hostedBy?: string;
  description?: string; // General game description
  prize?: string;
  
  // Fields for Bingo Page
  participants?: number;
  winners?: string; // e.g., "João Silva" or "2 pessoas"
  additionalInfo?: string; // e.g., "24 participantes!" for the "Next Game" card
  startTimeDisplay?: string; // e.g., "20:00" for display
  endTimeDisplay?: string; // e.g., "16:30" for display for finished games

  // Fields for Game Play Page
  generatedCards?: number;
  countdownSeconds?: number;
}

export interface SupportTicket {
  subject: string;
  message: string;
  userId?: string; // Optional: associate ticket with user
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
  id: string; // Kako Live userId (fuid), will be document ID in Firestore 'hosts' collection
  rankPosition: number; 
  name: string; // Kako nickname
  avatarUrl: string; // Kako avatar
  avgViewers: number;
  timeStreamed: number; // in hours
  allTimePeakViewers: number;
  hoursWatched: string; 
  rank: number; // Kako user.level
  followersGained: number;
  totalFollowers: string; 
  totalViews: string; 
  kakoLiveFuid?: string; // Same as id (Kako userId)
  kakoLiveRoomId?: string; 
  bio?: string; // Kako signature
  streamTitle?: string; // Current stream title
  likes?: number; 
  giftsReceived?: ReceivedGift[];
  createdAt?: any; // Firestore Timestamp
  lastSeen?: any; // Firestore Timestamp
  source?: 'kakoLive' | 'manual'; // How the profile was created/sourced
  totalDonationsValue?: number; // Placeholder for donations
}

export interface UserProfile {
  uid: string; // Firebase Auth UID
  email?: string | null;
  role?: 'player' | 'host'; // Base role
  adminLevel?: 'master' | 'admin' | 'suporte' | null; // Hierarchical admin level
  kakoLiveId?: string;       // User's own Kako Live ID, if they link it
  profileName?: string;      // Preferred display name in this app (can be from Kako, or set by user)
  displayName?: string | null; // From Firebase Auth, should ideally be synced with profileName
  photoURL?: string | null;    // From Firebase Auth, for avatar (can be from Kako, or uploaded)
  profileHeader?: string;    // URL for a profile header image
  bio?: string;              // User's bio for this platform (max 100 chars)
  isVerified?: boolean;      // If the user is verified on this platform
  level?: number;            // User's level on this platform
  followerCount?: number;    // Followers on this platform
  followingCount?: number;   // Following on this platform
  photos?: string[];         // URLs for additional profile photos on this platform
  gender?: 'male' | 'female' | 'other' | 'preferNotToSay';
  birthDate?: string;        // YYYY-MM-DD
  country?: string;
  phoneNumber?: string;
  civilStatus?: 'single' | 'married' | 'divorced' | 'widowed' | 'other' | 'preferNotToSay';
  socialLinks?: {
    twitter?: string;
    instagram?: string;
    facebook?: string;
    youtube?: string;
    twitch?: string;
  };
  themePreference?: 'light' | 'dark' | 'system';
  accentColor?: string;      // hex
  hasCompletedOnboarding?: boolean;
  agreedToTermsAt?: any; // Firestore Timestamp
  createdAt?: any;           // Firestore Timestamp
  updatedAt?: any;           // Firestore Timestamp
}

export interface KakoProfile {
  id: string; // Kako Live userId (maps to `userId` from Kako API)
  numId?: number; // Kako's numerical ID (maps to `numId` from Kako API)
  nickname: string;
  avatarUrl: string;
  level?: number;
  signature?: string; // Bio from Kako
  gender?: number; // 1 for male, 2 for female as per Kako API example
  area?: string;
  school?: string;
  showId?: string; // Another ID used by Kako
  isLiving?: boolean; // If they are currently live
  lastFetchedAt?: any; // Firestore Timestamp for when this profile was last fetched/updated
  // You can add other fields here as you discover them from Kako Live's API
}


export interface ChatMessage { // For Host Stream Chat
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

// For P2P Messages Page - Types for UI
export interface ConversationPreview {
  id: string;
  userId: string; // ID of the other user in the conversation
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
  senderId: string; // UID of the sender
  senderName: string;
  senderAvatar: string;
  text: string;
  timestamp: any; // Firestore Timestamp or string for placeholder
  isCurrentUser?: boolean; // Determined at render time
  status?: 'sent' | 'delivered' | 'read';
}

// Types for Firestore data structure (P2P Messages)
export interface FirestoreConversation {
  id?: string; // Document ID, usually auto-generated
  participants: string[]; // Array of User UIDs
  participantNames: { [uid: string]: string }; // For quick display in conversation list
  participantAvatars: { [uid: string]: string | null }; // For quick display
  lastMessageText?: string;
  lastMessageTimestamp?: any; // Firestore Server Timestamp
  lastMessageSenderId?: string; // UID of the sender of the last message
  createdAt: any; // Firestore Server Timestamp
  updatedAt: any; // Firestore Server Timestamp
  // Optional: for managing unread counts per user more robustly on the backend
  // unreadCounts?: { [uid: string]: number }; 
}

// Feed Types
export interface UserSummary {
  name: string;
  handle: string;
  avatarUrl: string;
  dataAiHint?: string; // For user avatar image search
}

export interface FeedPost {
  id: string;
  user: UserSummary;
  content: string;
  timestamp: string;
  imageUrl?: string;
  imageAiHint?: string; // For post image search
  stats: {
    replies: number;
    retweets: number;
    likes: number;
  };
}
    
// For Twitter-like right sidebar
export interface Trend {
  id: string;
  category: string;
  topic: string;
  posts?: string; // Made optional to match data
}

export interface SuggestedUser {
  id: string;
  name: string;
  handle: string;
  avatarUrl: string;
  dataAiHint?: string;
}
