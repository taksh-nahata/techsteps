// Legacy learning types - extending core types for backward compatibility

export interface SkillAssessmentResult {
  skillLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  recommendedStartingPathId: string;
  completedAt: Date;
  // Optional legacy fields if needed
  q1ComfortLevel?: 'new' | 'basics' | 'confident';
  q2EmailSent?: boolean;
  q3SmartphoneUsed?: boolean;
}

// Legacy Module interface - maps to Tutorial in core types
export interface Module {
  id: string; // e.g., "turn-on-pc"
  titleKey: string; // For i18n, e.g., "learningPaths.fundamentals.modules.turnOnPc.title"
  descriptionKey: string; // For i18n
  // Add content property for rich lesson content
  content?: string | JSX.Element;
  contentDetailsKey?: string; // e.g., "learningPaths.fundamentals.modules.turnOnPc.details"
  estimatedTime: string; // e.g., "15 min"
  dependsOn?: string[]; // IDs of modules that must be completed first
  iconName?: string; // Optional: Lucide icon name for the module
}

export interface LearningPath {
  id: string; // e.g., "fundamentals"
  titleKey: string; // For i18n, e.g., "learningPaths.fundamentals.title"
  descriptionKey: string; // For i18n
  iconName: string; // Name of a Lucide icon, e.g., "Target"
  modules: Module[];
  badgeIdOnCompletion: string; // ID of the badge awarded
  sortOrder: number; // To maintain a specific order of paths
}

// Legacy UserLearningProgress - simplified version of core LearningProgress
export interface UserLearningProgress {
  completedModules: Record<string, boolean>; // { [moduleId: string]: true }
  earnedBadges: Record<string, boolean>; // { [badgeId: string]: true }
  // Path progress can be calculated on the fly or stored if preferred.
  // For simplicity, let's assume it's calculated from completedModules and total modules in a path.
  // We can store path-specific progress if performance becomes an issue.
  // pathProgress: Record<string, { completedCount: number; totalCount: number; progressPercent: number }>;
}

export interface Badge {
  id: string; // e.g., "onlineExplorer"
  nameKey: string; // For i18n
  descriptionKey: string; // For i18n
  iconName: string; // Lucide icon name
}

// Example of how this might integrate with UserData in UserContext.ts
// This is for planning and will be added to UserContext.tsx later.
/*
export interface UserData {
  // ... existing fields
  skillAssessmentAnswers?: SkillAssessmentResult;
  recommendedStartingPathId?: string;
  learningProgress?: UserLearningProgress;
}
*/
