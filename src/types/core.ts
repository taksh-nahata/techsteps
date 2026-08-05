// Core Data Models for Senior Learning Platform

// User and Authentication Types
export interface User {
  id: string;
  email: string;
  profile: UserProfile;
  preferences: UserPreferences;
  learningProgress: LearningProgress;
  accessibilitySettings: AccessibilitySettings;
  caregiverAccess?: CaregiverAccess[];
  createdAt: Date;
  lastActiveAt: Date;
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  dateOfBirth?: Date;
  preferredLanguage: string;
  timezone: string;
  emergencyContact?: EmergencyContact;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
}

export interface UserPreferences {
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  learning: LearningPreferences;
  ui: UIPreferences;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  sms: boolean;
  learningReminders: boolean;
  caregiverUpdates: boolean;
  systemUpdates: boolean;
}

export interface PrivacySettings {
  shareProgressWithCaregivers: boolean;
  allowAnalytics: boolean;
  allowAITraining: boolean;
  dataRetentionPeriod: number; // days
}

export interface LearningPreferences {
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  pacePreference: 'slow' | 'normal' | 'fast';
  preferredContentTypes: ContentType[];
  reminderFrequency: 'daily' | 'weekly' | 'monthly' | 'none';
}

export interface UIPreferences {
  theme: 'light' | 'dark' | 'high-contrast';
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  reducedMotion: boolean;
  keyboardNavigation: boolean;
  screenReaderOptimized: boolean;
  seniorMode: boolean;
}

// Accessibility Types
export interface AccessibilitySettings {
  highContrast: boolean;
  reducedMotion: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  keyboardNavigation: boolean;
  screenReaderOptimized: boolean;
  voiceControl: boolean;
  magnification: number; // 1.0 = 100%
}

// Learning Content Types
export interface Tutorial {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration: number; // minutes
  content: TutorialContent;
  prerequisites: string[];
  learningObjectives: string[];
  assessments: Assessment[];
  localizations: Record<string, LocalizedContent>;
  accessibility: AccessibilityMetadata;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
}

export interface TutorialContent {
  sections: ContentSection[];
  resources: Resource[];
  exercises: Exercise[];
}

export interface ContentSection {
  id: string;
  title: string;
  content: string;
  media: MediaAsset[];
  interactiveElements: InteractiveElement[];
  estimatedReadTime: number; // minutes
}

export interface MediaAsset {
  id: string;
  type: 'image' | 'video' | 'audio' | 'animation';
  url: string;
  altText?: string;
  caption?: string;
  transcript?: string;
  duration?: number; // for video/audio
}

export interface InteractiveElement {
  id: string;
  type: 'quiz' | 'practice' | 'simulation' | 'checklist';
  title: string;
  instructions: string;
  data: any; // Flexible data structure for different element types
}

export interface Exercise {
  id: string;
  title: string;
  instructions: string;
  type: 'practice' | 'quiz' | 'hands-on';
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: number; // minutes
  feedback: ExerciseFeedback;
}

export interface ExerciseFeedback {
  correct: string;
  incorrect: string;
  hint?: string;
  explanation?: string;
}

export interface Assessment {
  id: string;
  title: string;
  questions: AssessmentQuestion[];
  passingScore: number; // percentage
  maxAttempts: number;
}

export interface AssessmentQuestion {
  id: string;
  question: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer';
  options?: string[];
  correctAnswer: string | string[];
  explanation?: string;
}

// Learning Progress Types
export interface LearningProgress {
  completedTutorials: Record<string, TutorialProgress>;
  completedExercises: Record<string, ExerciseProgress>;
  earnedBadges: Record<string, BadgeProgress>;
  skillLevels: Record<string, SkillLevel>;
  totalTimeSpent: number; // minutes
  streakDays: number;
  lastActivityDate: Date;
}

export interface TutorialProgress {
  tutorialId: string;
  completedSections: string[];
  completedExercises: string[];
  assessmentScores: Record<string, number>;
  timeSpent: number; // minutes
  completedAt?: Date;
  lastAccessedAt: Date;
}

export interface ExerciseProgress {
  exerciseId: string;
  attempts: ExerciseAttempt[];
  completed: boolean;
  bestScore: number;
  timeSpent: number; // minutes
}

export interface ExerciseAttempt {
  attemptNumber: number;
  score: number;
  timeSpent: number; // minutes
  completedAt: Date;
  answers: Record<string, any>;
}

export interface BadgeProgress {
  badgeId: string;
  earnedAt: Date;
  criteria: Record<string, boolean>;
}

export interface SkillLevel {
  skill: string;
  level: 'novice' | 'beginner' | 'intermediate' | 'advanced' | 'expert';
  experience: number; // points
  lastUpdated: Date;
}

// AI Assistant Types
export interface AIConversation {
  id: string;
  userId: string;
  messages: AIMessage[];
  context: ConversationContext;
  status: 'active' | 'escalated' | 'resolved';
  createdAt: Date;
  updatedAt: Date;
}

export interface AIMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai' | 'system';
  timestamp: Date;
  attachments?: Attachment[];
  metadata?: MessageMetadata;
}

export interface MessageMetadata {
  confidence?: number;
  processingTime?: number;
  model?: string;
  tokens?: number;
  escalationReason?: string;
}

export interface ConversationContext {
  currentPage?: string;
  currentTutorial?: string;
  userSkillLevel?: string;
  previousQuestions?: string[];
  failureCount: number;
  knownFacts?: string[]; // Add this
  /** User's device for device-specific guide directions */
  guideDeviceType?: string;
}

export interface AIResponse {
  content: string;
  confidence: number;
  suggestedActions?: Action[];
  requiresHumanEscalation: boolean;
  metadata: ResponseMetadata;
  extractedFacts?: string[]; // Add this
  spokenText?: string;     // Add this for TTS optimization
  flashcards?: any[] | null;
}

export interface ResponseMetadata {
  processingTime: number;
  model: string;
  tokens: number;
  sources?: string[];
}

export interface Action {
  type: 'navigate' | 'tutorial' | 'help' | 'contact';
  label: string;
  data: any;
}

// Caregiver Types
export interface CaregiverAccess {
  caregiverId: string;
  permissions: CaregiverPermissions;
  relationship: string;
  grantedAt: Date;
  lastAccessAt?: Date;
  active: boolean;
}

export interface CaregiverPermissions {
  viewProgress: boolean;
  receiveNotifications: boolean;
  accessSupport: boolean;
  manageSettings: boolean;
}

export interface Caregiver {
  id: string;
  name: string;
  email: string;
  phone?: string;
  relationship: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
}

// Content Management Types
export interface ContentDraft {
  id: string;
  type: 'tutorial' | 'exercise' | 'assessment';
  title: string;
  content: any;
  authorId: string;
  status: 'draft' | 'review' | 'approved' | 'published';
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContentReview {
  id: string;
  contentId: string;
  reviewerId: string;
  status: 'pending' | 'approved' | 'rejected';
  feedback?: string;
  reviewedAt?: Date;
}

// Localization Types
export interface LocalizedContent {
  language: string;
  title: string;
  description: string;
  content: string;
  culturalAdaptations?: CulturalAdaptation[];
}

export interface CulturalAdaptation {
  region: string;
  adaptations: Record<string, string>;
  examples: string[];
  colorPreferences?: string[];
}

// Analytics Types
export interface UserAction {
  userId: string;
  sessionId: string;
  action: string;
  context: ActionContext;
  timestamp: Date;
  deviceInfo: DeviceInfo;
  performanceMetrics?: PerformanceData;
}

export interface ActionContext {
  page: string;
  feature: string;
  tutorialId?: string;
  exerciseId?: string;
  additionalData?: Record<string, any>;
}

export interface DeviceInfo {
  userAgent: string;
  screenResolution: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  operatingSystem: string;
  browser: string;
  connectionType?: string;
}

export interface PerformanceData {
  loadTime: number;
  renderTime: number;
  memoryUsage?: number;
  batteryLevel?: number;
}

// Error and Support Types
export interface ErrorLog {
  id: string;
  userId?: string;
  sessionId: string;
  error: ErrorDetails;
  context: ErrorContext;
  timestamp: Date;
  resolved: boolean;
}

export interface ErrorDetails {
  message: string;
  stack?: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface ErrorContext {
  page: string;
  userAgent: string;
  actions: string[];
  state?: Record<string, any>;
}

export interface SupportTicket {
  id: string;
  userId: string;
  type: 'technical' | 'content' | 'accessibility' | 'general';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  subject: string;
  description: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

// Utility Types
export type ContentType = 'text' | 'video' | 'audio' | 'interactive' | 'practice';
export type LanguageCode = 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'ar' | 'he' | 'zh' | 'ja';
export type TimeFrame = 'day' | 'week' | 'month' | 'quarter' | 'year';

// API Response Types
export interface APIResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  errors?: string[];
  pagination?: PaginationInfo;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Attachment Types
export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedAt: Date;
}