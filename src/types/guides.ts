export type AnnotationType = 'arrow' | 'circle' | 'blur';
export type Direction = 'up' | 'down' | 'left' | 'right';

export interface GuideAnnotation {
    type: AnnotationType;
    x: number; // Percentage (0-100)
    y: number; // Percentage (0-100)
    direction?: Direction; // For arrows
    label?: string;
    color?: string; // hex code
    size?: number; // scale factor (default 1)
    width?: number; // For blur rect (percentage)
    height?: number; // For blur rect (percentage)
    rotation?: number; // Degrees (0-360)
}


export interface GuideStep {
    id: string;
    title: string;
    content: string;
    /** @deprecated use directionsByDevice */
    instructions?: string[];
    /** Numbered directions per device — users only see their device */
    directionsByDevice?: Partial<Record<string, string[]>>;
    image?: string;
    imageCaption?: string;
    annotations?: GuideAnnotation[];
}

export interface AlternateSolution {
    title: string;
    steps: GuideStep[];
    type: 'Community Workaround' | 'Official';
}

export interface TroubleshootingGuide {
    id: string;
    title: string;
    problemDescription: string;
    keywords: string[];
    category: string;

    // Primary Solution
    steps: GuideStep[];

    // Alternate Solutions
    alternates?: AlternateSolution[];

    meta: {
        created: string; // ISO Date string
        updated: string; // ISO Date string
        sourceUrl?: string;
        source?: 'discovery' | 'ai-chat' | 'manual';
        originalQuery?: string;
        confidenceScore: number;
        priorityScore?: number;
        difficulty: 'Easy' | 'Medium' | 'Hard';
    };
}

export interface GuideFeedback {
    id: string;
    guideId: string;
    searchQuery?: string;
    rating: 'helpful' | 'not-helpful';
    comment?: string;
    timestamp: string;
}
