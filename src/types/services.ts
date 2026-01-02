// Service Interface Types for Senior Learning Platform
import {
  AIResponse,
  ConversationContext,
  Tutorial,
  LocalizedContent,
  UserAction,
  ActionContext,
  PerformanceData,
  AccessibilitySettings,
  User,
  SupportTicket
} from './core';

// AI Service Interface
export interface AIService {
  sendMessage(message: string, context: ConversationContext): Promise<AIResponse>;
  sendVoiceMessage?(audioBlob: Blob, context: ConversationContext): Promise<AIResponse>;
  sendImageMessage?(imageFile: File, context: ConversationContext): Promise<AIResponse>;
  formatAsFlashcards?(response: string): Promise<FlashcardStep[]>;
  escalateToHuman(conversationId: string, reason: string): Promise<void>;
  getContextualHelp(pageContext: PageContext): Promise<HelpContent>;
  trackInteractionQuality(interactionId: string, rating: number): Promise<void>;
  getConversationHistory(userId: string, limit?: number): Promise<AIMessage[]>;
  clearConversationHistory(userId: string): Promise<void>;
}

export interface PageContext {
  url: string;
  title: string;
  section: string;
  userSkillLevel?: string;
  currentTutorial?: string;
}

export interface HelpContent {
  title: string;
  content: string;
  actions: HelpAction[];
  relatedTopics: string[];
}

export interface HelpAction {
  label: string;
  type: 'navigate' | 'tutorial' | 'contact' | 'external';
  target: string;
}

export interface AIMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai' | 'system';
  timestamp: Date;
  confidence?: number;
}

export interface FlashcardStep {
  id: string;
  stepNumber: number;
  title: string;
  content: string;
  instructions: string[];
  icon?: string;
  audioScript?: string;
  estimatedDuration: number;
  methodGroup?: string; // For grouping steps by method (e.g., "Method 1: Using Settings", "Method 2: Using Control Panel")
  methodStepCount?: number; // Total steps in this method group
  image?: string;
  annotations?: {
    type: 'arrow' | 'circle';
    x: number;
    y: number;
    label?: string;
    color?: string;
    size?: number;
  }[];
}

export interface FlashcardMethod {
  id: string;
  title: string;
  description?: string;
  steps: FlashcardStep[];
  difficulty?: 'easy' | 'medium' | 'hard';
  estimatedTotalTime?: number;
}



// Content Management Service Interface
export interface ContentService {
  getTutorials(filters?: TutorialFilters): Promise<Tutorial[]>;
  getTutorial(id: string): Promise<Tutorial>;
  createTutorial(tutorial: TutorialDraft): Promise<Tutorial>;
  updateTutorial(id: string, updates: Partial<Tutorial>): Promise<Tutorial>;
  publishTutorial(id: string): Promise<void>;
  getLocalizedContent(contentId: string, locale: string): Promise<LocalizedContent>;
  searchContent(query: string, filters?: SearchFilters): Promise<SearchResult[]>;
  validateAccessibility(contentId: string): Promise<AccessibilityReport>;
}

export interface TutorialFilters {
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  category?: string;
  language?: string;
  duration?: { min?: number; max?: number };
  tags?: string[];
}

export interface TutorialDraft {
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  content: any;
  authorId: string;
}

export interface SearchFilters {
  contentType?: string[];
  difficulty?: string[];
  language?: string;
  dateRange?: { start: Date; end: Date };
}

export interface SearchResult {
  id: string;
  title: string;
  description: string;
  type: string;
  relevanceScore: number;
  highlights: string[];
}

export interface AccessibilityReport {
  score: number;
  issues: AccessibilityIssue[];
  recommendations: string[];
  wcagCompliance: WCAGCompliance;
}

export interface AccessibilityIssue {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  element?: string;
  suggestion: string;
}

export interface WCAGCompliance {
  level: 'A' | 'AA' | 'AAA';
  passedCriteria: string[];
  failedCriteria: string[];
}

// Analytics Service Interface
export interface AnalyticsService {
  trackUserAction(action: UserAction, context: ActionContext): Promise<void>;
  trackPerformanceMetric(metric: PerformanceMetric): Promise<void>;
  trackAccessibilityUsage(feature: AccessibilityFeature): Promise<void>;
  generateUsageReport(timeframe: TimeFrame, filters?: ReportFilters): Promise<UsageReport>;
  trackError(error: ErrorEvent): Promise<void>;
  trackConversion(event: ConversionEvent): Promise<void>;
}

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  context: Record<string, any>;
  timestamp: Date;
}

export interface AccessibilityFeature {
  feature: string;
  enabled: boolean;
  userId: string;
  timestamp: Date;
  effectiveness?: number;
}

export interface TimeFrame {
  start: Date;
  end: Date;
  granularity: 'hour' | 'day' | 'week' | 'month';
}

export interface ReportFilters {
  userSegment?: string;
  deviceType?: string;
  language?: string;
  accessibilityFeatures?: string[];
}

export interface UsageReport {
  summary: UsageMetrics;
  trends: TrendData[];
  segments: SegmentData[];
  recommendations: string[];
}

export interface UsageMetrics {
  totalUsers: number;
  activeUsers: number;
  completionRate: number;
  averageSessionDuration: number;
  errorRate: number;
}

export interface TrendData {
  date: Date;
  metric: string;
  value: number;
}

export interface SegmentData {
  segment: string;
  metrics: UsageMetrics;
  insights: string[];
}

export interface ErrorEvent {
  message: string;
  stack?: string;
  userId?: string;
  context: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface ConversionEvent {
  event: string;
  userId: string;
  value?: number;
  properties: Record<string, any>;
}

// User Service Interface
export interface UserService {
  getUser(id: string): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  updateAccessibilitySettings(userId: string, settings: AccessibilitySettings): Promise<void>;
  exportUserData(userId: string): Promise<UserDataExport>;
  deleteUserData(userId: string): Promise<void>;
  validateUserConsent(userId: string, consentType: string): Promise<boolean>;
}

export interface UserDataExport {
  user: User;
  learningProgress: any;
  conversations: any[];
  supportTickets: SupportTicket[];
  exportedAt: Date;
  format: 'json' | 'csv' | 'pdf';
}

// Support Service Interface
export interface SupportService {
  createTicket(ticket: CreateTicketRequest): Promise<SupportTicket>;
  getTicket(id: string): Promise<SupportTicket>;
  updateTicket(id: string, updates: Partial<SupportTicket>): Promise<SupportTicket>;
  getUserTickets(userId: string): Promise<SupportTicket[]>;
  escalateToHuman(conversationId: string, reason: string): Promise<SupportTicket>;
  getEmergencySupport(): Promise<EmergencySupport>;
}

export interface CreateTicketRequest {
  userId: string;
  type: 'technical' | 'content' | 'accessibility' | 'general';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  subject: string;
  description: string;
  context?: Record<string, any>;
}

export interface EmergencySupport {
  available: boolean;
  contactMethods: ContactMethod[];
  estimatedWaitTime?: number;
  resources: SupportResource[];
}

export interface ContactMethod {
  type: 'phone' | 'chat' | 'email';
  value: string;
  available: boolean;
  hours?: string;
}

export interface SupportResource {
  title: string;
  description: string;
  url: string;
  type: 'article' | 'video' | 'guide';
}

// Notification Service Interface
export interface NotificationService {
  sendNotification(notification: NotificationRequest): Promise<void>;
  scheduleNotification(notification: ScheduledNotification): Promise<string>;
  cancelNotification(id: string): Promise<void>;
  getUserNotifications(userId: string): Promise<Notification[]>;
  markAsRead(notificationId: string): Promise<void>;
}

export interface NotificationRequest {
  userId: string;
  type: 'email' | 'push' | 'sms' | 'in-app';
  title: string;
  message: string;
  data?: Record<string, any>;
  priority: 'low' | 'normal' | 'high';
}

export interface ScheduledNotification extends NotificationRequest {
  scheduledFor: Date;
  recurring?: RecurrencePattern;
}

export interface RecurrencePattern {
  frequency: 'daily' | 'weekly' | 'monthly';
  interval: number;
  endDate?: Date;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  readAt?: Date;
}

// Error Recovery Interface
export interface ErrorRecoveryService {
  handleError(error: Error, context: ErrorContext): Promise<RecoveryAction>;
  getRecoveryOptions(errorType: string): Promise<RecoveryOption[]>;
  executeRecovery(action: RecoveryAction): Promise<boolean>;
  reportRecoverySuccess(actionId: string, successful: boolean): Promise<void>;
}

export interface ErrorContext {
  userId?: string;
  sessionId: string;
  page: string;
  userAgent: string;
  actions: string[];
  state?: Record<string, any>;
}

export interface RecoveryAction {
  id: string;
  type: 'retry' | 'fallback' | 'redirect' | 'reset' | 'escalate';
  description: string;
  automated: boolean;
  data?: Record<string, any>;
}

export interface RecoveryOption {
  action: RecoveryAction;
  probability: number;
  userFriendly: boolean;
  estimatedTime: number;
}