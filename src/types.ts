export type TemplateType = 'conflict' | 'bad-news' | 'freeflow';

export interface ThumbnailData {
    headline: string;
    targetName: string;
    targetImage?: string;
    targetEmotion: string;
    opponentName?: string;
    opponentImage?: string;
    opponentEmotion?: string;
    bubbleText?: string;
    arrowDirection?: 'left' | 'right';
    // Story context for rich image generation
    storyContext?: string;
    narrativeSummary?: string;
    // Specific visual elements extracted from story
    visualElements?: string[];
}

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    imageUrl?: string;
    timestamp: Date;
}

export interface ReferenceImage {
    base64: string;
    description: string;
}

export interface GenerationState {
    step: 'input' | 'select' | 'customize' | 'generate';
    transcript: string;
    selectedTemplate: TemplateType;
    data: ThumbnailData;
    // AI's explanation for why this template was suggested
    templateReason?: string;
    // Reference images uploaded by user with descriptions
    referenceImages: ReferenceImage[];
    // Chat history for iterative refinement
    chatHistory: ChatMessage[];
    // Current generated image
    currentImageUrl?: string;
    // Thought signature from last image generation (for conversational editing)
    lastThoughtSignature?: string;
}
