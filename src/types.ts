export type TemplateType = 'conflict' | 'bad-news' | 'freeflow';

export type AspectRatio = '14:10' | '19:10';

export interface ThumbnailData {
    headline: string;
    targetName: string;
    targetImage?: string;
    targetEmotion: string;
    opponentName?: string;
    opponentImage?: string;
    opponentEmotion?: string;
    bubbleText?: string;
    showSpeechBubble?: boolean; // Option to disable speech bubble
    aspectRatio?: AspectRatio; // Aspect ratio for thumbnail (default: 14:10)
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
    isError?: boolean; // Flag to indicate if this is an error message that can be retried
    retryAction?: () => void; // Function to call when retry is clicked
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
