'use server';

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { TemplateType, ThumbnailData, ChatMessage, ReferenceImage } from "@/types";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

const safetySettings = [
    {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
    },
    {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
    },
    {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
    },
    {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
    },
];

export async function analyzeTranscript(transcript: string): Promise<{
    selectedTemplate: TemplateType;
    templateReason: string;
    data: ThumbnailData;
}> {
    if (!process.env.GOOGLE_API_KEY) {
        throw new Error("GOOGLE_API_KEY is not set");
    }

    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    const prompt = `
    You are an expert thumbnail designer for "Really American", a political commentary channel known for sensationalist, high-contrast, and emotionally charged thumbnails.
    
    Analyze the following video transcript or story context and generate thumbnail concepts.
    
    TRANSCRIPT/CONTEXT:
    "${transcript}"
    
    Your task:
    1. Select the best template:
       - 'conflict': For debates, arguments, person vs person, takedowns.
       - 'bad-news': For polls, market crashes, disasters, general bad news for a target.
       - 'freeflow': If it doesn't fit the above.
    
    2. Extract/Generate the following data fields based on the template:
       - headline: Short, punchy, 2-5 words, ALL CAPS. Must capture the CORE revelation or scandal. (e.g., "TRUMP PANICS!", "FILES EXPOSED!")
       - targetName: The main subject being negatively affected or reacting.
       - targetEmotion: The facial expression for the target (e.g., "Panicked", "Crying", "Angry", "Shocked", "Terrified", "Sweating").
       - opponentName: (For 'conflict' only) The person winning or attacking.
       - opponentEmotion: (For 'conflict' only) The expression for the opponent (e.g., "Laughing", "Mocking", "Stern").
       - bubbleText: Short speech bubble text (2-4 words) that captures the scandal or fear. (e.g., "IT'S OVER!", "THEY KNOW!", "THE FILES!")
       - narrativeSummary: A DETAILED 3-4 sentence summary that an image generator can use. Include:
         * WHO is involved (names, roles)
         * WHAT the scandal/conflict is about (specific details like "photos", "files", "documents")
         * WHY it matters (the stakes, what's being revealed)
         * KEY VISUAL ELEMENTS that should appear (e.g., "documents falling", "photos scattered", "files exposed")
       - visualElements: An array of 3-5 specific visual elements that should appear in the thumbnail based on the story (e.g., ["falling documents", "Epstein's shadow", "photos scattered", "jail bars", "FBI logo"])
    
    Return ONLY a valid JSON object with this structure:
    {
      "selectedTemplate": "conflict" | "bad-news" | "freeflow",
      "templateReason": "string (1-2 sentences explaining WHY this template fits the story best)",
      "data": {
        "headline": "string",
        "targetName": "string",
        "targetEmotion": "string",
        "opponentName": "string" (optional),
        "opponentEmotion": "string" (optional),
        "bubbleText": "string",
        "narrativeSummary": "string (detailed 3-4 sentences)",
        "visualElements": ["string", "string", "string"]
      }
    }
  `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Clean up markdown code blocks if present
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(jsonStr);
        
        // Inject the original transcript as story context
        parsed.data.storyContext = transcript;

        return parsed;
    } catch (error) {
        console.error("Error analyzing transcript:", error);
        // Fallback
        return {
            selectedTemplate: "freeflow",
            templateReason: "Analysis failed. Using freeflow template as fallback.",
            data: {
                headline: "ANALYSIS FAILED",
                targetName: "Subject",
                targetEmotion: "Neutral",
                bubbleText: "Error",
                storyContext: transcript
            }
        };
    }
}

export async function generateThumbnailImage(
    data: ThumbnailData, 
    template: TemplateType, 
    useHighQuality: boolean = true,
    refinementInstruction?: string,
    referenceImages?: ReferenceImage[],
    previousImage?: { base64: string; thoughtSignature?: string }
): Promise<{ imageUrl: string; thoughtSignature?: string }> {
    if (!process.env.GOOGLE_API_KEY) {
        throw new Error("GOOGLE_API_KEY is not set");
    }

    // Use Gemini 2.0 Flash for image generation (supports native image output)
    const model = genAI.getGenerativeModel({ 
        model: 'gemini-3-pro-image-preview',
        generationConfig: {
            // @ts-ignore - responseModalities is valid for image generation
            responseModalities: ['image', 'text'],
        },
        safetySettings
    });

    // Build rich context from the story
    const narrativeSummary = data.narrativeSummary || '';
    const visualElements = data.visualElements || [];
    const visualElementsList = visualElements.length > 0 
        ? `STORY-SPECIFIC VISUAL ELEMENTS TO INCLUDE:\n${visualElements.map(e => `- ${e}`).join('\n')}`
        : '';
    
    const referenceImageNote = referenceImages && referenceImages.length > 0
        ? `\n\n🎨 REFERENCE IMAGES PROVIDED (${referenceImages.length} image(s) attached below):
${referenceImages.map((img, idx) => `Image ${idx + 1}: ${img.description}`).join('\n')}

Use these reference images according to their descriptions:
- Match the likenesses, facial features, poses, and styling from the reference photos
- Follow the specific usage instructions provided for each image
- Incorporate the visual elements, expressions, or scenes shown in the references`
        : '';

    const style = `Style: Sensationalist political commentary YouTube thumbnail for "Really American" channel. 
High contrast, photorealistic portraits, 8k resolution, cinematic dramatic lighting.
CRITICAL: Generate photorealistic faces/portraits that capture the essence and recognizable features of the subjects mentioned. Make expressions exaggerated and dramatic.
IMPORTANT: DO NOT include the text "Really American" or any channel logos/watermarks in the image.${referenceImageNote}`;

    let prompt = '';

    if (template === 'conflict') {
        prompt = `${style}

STORY CONTEXT (THIS IS CRITICAL - the thumbnail must reflect this specific story):
${narrativeSummary}

${visualElementsList}

COMPOSITION: Vertical split-screen, 16:9 aspect ratio YouTube thumbnail.

LEFT SIDE (THE LOSER):
- Subject: ${data.targetName} (generate their recognizable likeness)
- Expression: Extreme ${data.targetEmotion} - sweating, desperate, eyes wide, mouth agape
- Lighting: Cool blue anxiety tint, harsh unflattering shadows
- Background: Dark ominous blurred texture with story-relevant elements

RIGHT SIDE (THE WINNER):
- Subject: ${data.opponentName || 'Opponent'} (generate their recognizable likeness)
- Expression: ${data.opponentEmotion || 'Stern'} - powerful, confident, dominant, smirking
- Lighting: Warm victorious golden tones
- Background: Brighter heroic setting

OVERLAYS (MUST INCLUDE):
- Large curved BRIGHT YELLOW (#FFF200) arrow pointing from right to left (winner to loser)
- White speech bubble with thick black outline near ${data.opponentName || 'right figure'} containing: "${data.bubbleText}"
- MASSIVE bottom banner: "${data.headline}" in IMPACT font, BRIGHT YELLOW (#FFF200), 5px black stroke

${refinementInstruction ? `REFINEMENT REQUEST: ${refinementInstruction}` : ''}`;
    } else if (template === 'bad-news') {
        prompt = `${style}

STORY CONTEXT (THIS IS CRITICAL - the thumbnail must reflect this specific story):
${narrativeSummary}

${visualElementsList}

COMPOSITION: Dramatic collage, 16:9 aspect ratio YouTube thumbnail.

MAIN SUBJECT (FOREGROUND):
- ${data.targetName} (generate their recognizable likeness)
- Expression: Extreme ${data.targetEmotion} - devastated, head in hands, sweating, panicking
- Scale: Large, taking up 60% of frame
- Lighting: Harsh alarm red rim lighting, dramatic shadows

BACKGROUND & STORY-SPECIFIC ELEMENTS:
- Include visual elements from the story context listed above
- These elements should be clearly visible and relevant to the scandal/news
- Examples: scattered photos, falling documents, file folders, evidence imagery
- Large RED downward-trending graph/arrow showing collapse
- Dark stormy/ominous atmosphere
- Fire, chaos elements as appropriate to the story

OVERLAYS (MUST INCLUDE):
- Corner inset box with text: "${data.bubbleText}" - make this prominent and scary
- MASSIVE bottom banner: "${data.headline}" in IMPACT font, BRIGHT YELLOW (#FFF200), 5px black stroke
- Red warning graphics/alerts scattered

${refinementInstruction ? `REFINEMENT REQUEST: ${refinementInstruction}` : ''}`;
    } else {
        prompt = `${style}

STORY CONTEXT (THIS IS CRITICAL - the thumbnail must reflect this specific story):
${narrativeSummary}

${visualElementsList}

COMPOSITION: Creative YouTube thumbnail, 16:9 aspect ratio.

Create a dramatic, attention-grabbing thumbnail that captures this specific story.
Include the story-specific visual elements listed above.

SUBJECT: ${data.targetName}
EXPRESSION: ${data.targetEmotion}
HEADLINE: "${data.headline}"
SPEECH BUBBLE: "${data.bubbleText}"

Include dramatic lighting, high contrast, and sensationalist political commentary aesthetic.
Text overlay in BRIGHT YELLOW (#FFF200) Impact font with black stroke.

${refinementInstruction ? `REFINEMENT REQUEST: ${refinementInstruction}` : ''}`;
    }

    try {
        let contents: any[];

        if (previousImage && refinementInstruction) {
            // Conversational editing: pass previous image with thought signature
            const prevImageData = previousImage.base64.includes('base64,') 
                ? previousImage.base64.split('base64,')[1] 
                : previousImage.base64;

            const prevImagePart: any = {
                inlineData: {
                    mimeType: 'image/png',
                    data: prevImageData
                }
            };

            // Include thought signature if available
            if (previousImage.thoughtSignature) {
                prevImagePart.thoughtSignature = previousImage.thoughtSignature;
            }

            contents = [
                {
                    role: 'user',
                    parts: [{ text: 'Generate a thumbnail for this story.' }]
                },
                {
                    role: 'model',
                    parts: [prevImagePart]
                },
                {
                    role: 'user',
                    parts: [{ text: `Make the following changes: ${refinementInstruction}` }]
                }
            ];
        } else {
            // Initial generation: build prompt with reference images
            const parts: any[] = [{ text: prompt }];
            
            // Add reference images if provided
            if (referenceImages && referenceImages.length > 0) {
                for (const refImg of referenceImages) {
                    const base64Data = refImg.base64.includes('base64,') 
                        ? refImg.base64.split('base64,')[1] 
                        : refImg.base64;
                    
                    parts.push({
                        inlineData: {
                            mimeType: 'image/jpeg',
                            data: base64Data
                        }
                    });
                }
            }

            contents = [{ role: 'user', parts }];
        }

        // @ts-ignore
        const result = await model.generateContent({ contents });
        const response = await result.response;

        // Extract image and thought signature
        // @ts-ignore
        const candidates = response.candidates || [];
        let imageData: string | null = null;
        let thoughtSignature: string | undefined;

        for (const candidate of candidates) {
            if (candidate.content && candidate.content.parts) {
                for (const part of candidate.content.parts) {
                    if (part.inlineData) {
                        imageData = `data:image/png;base64,${part.inlineData.data}`;
                    }
                    if (part.text) {
                        console.log("Model returned text instead of image:", part.text);
                    }
                    // @ts-ignore - thoughtSignature is not in official types yet
                    if (part.thoughtSignature) {
                        // @ts-ignore
                        thoughtSignature = part.thoughtSignature;
                    }
                }
            }
        }

        if (!imageData) {
            console.error("Full response structure:", JSON.stringify(response, null, 2));
            
            // Check for prompt feedback blocks (very common for political content)
            // @ts-ignore
            if (response.promptFeedback && response.promptFeedback.blockReason) {
                // @ts-ignore
                const reason = response.promptFeedback.blockReason;
                throw new Error(`IMAGE_BLOCKED:${reason}`);
            }
            
            throw new Error("No image data found in response");
        }

        return { imageUrl: imageData, thoughtSignature };
    } catch (error: any) {
        console.error("Image generation failed:", error);
        
        // Check for quota error with retry delay
        if (error.message && error.message.includes('429')) {
            // Extract retry delay from error message
            const retryMatch = error.message.match(/retry in ([\d.]+)s/i);
            if (retryMatch) {
                const retrySeconds = Math.ceil(parseFloat(retryMatch[1]));
                const quotaError = new Error(`QUOTA_ERROR:${retrySeconds}`);
                quotaError.name = 'QuotaError';
                throw quotaError;
            } else {
                // Default fallback if parsing fails but it is a 429
                const quotaError = new Error(`QUOTA_ERROR:60`);
                quotaError.name = 'QuotaError';
                throw quotaError;
            }
        }
        
        throw error;
    }
}

// New function for iterative refinement with chat
export async function refineThumbnailWithChat(
    userFeedback: string,
    data: ThumbnailData,
    template: TemplateType,
    chatHistorySummary: string[], // Just the text messages, not full objects with images
    referenceImages?: ReferenceImage[],
    previousImage?: { base64: string; thoughtSignature?: string }
): Promise<{ imageUrl: string; thoughtSignature?: string; assistantMessage: string }> {
    if (!process.env.GOOGLE_API_KEY) {
        throw new Error("GOOGLE_API_KEY is not set");
    }

    // Use Gemini for understanding the refinement request
    const textModel = genAI.getGenerativeModel({ model: "gemini-3-pro-preview" });
    
    // Build chat context from summary (no images)
    const historyContext = chatHistorySummary.slice(-6).join('\n');

    const analysisPrompt = `You are helping refine a YouTube thumbnail for "Really American" political commentary channel.

CURRENT THUMBNAIL DATA:
- Template: ${template}
- Headline: ${data.headline}
- Target: ${data.targetName} (${data.targetEmotion})
${data.opponentName ? `- Opponent: ${data.opponentName} (${data.opponentEmotion})` : ''}
- Speech Bubble: ${data.bubbleText}
- Story Context: ${data.narrativeSummary || data.storyContext?.substring(0, 500) || 'N/A'}

RECENT CONVERSATION:
${historyContext}

USER'S NEW REQUEST:
"${userFeedback}"

Respond with:
1. A brief acknowledgment of what they want changed (1 sentence)
2. A detailed image generation instruction to incorporate their feedback

Format your response as JSON:
{
  "acknowledgment": "string",
  "refinementInstruction": "string"
}`;

    try {
        const analysisResult = await textModel.generateContent(analysisPrompt);
        const analysisText = analysisResult.response.text();
        const jsonStr = analysisText.replace(/```json/g, '').replace(/```/g, '').trim();
        const { acknowledgment, refinementInstruction } = JSON.parse(jsonStr);

        // Generate new image with refinement, passing previous image for conversational editing
        const result = await generateThumbnailImage(data, template, true, refinementInstruction, referenceImages, previousImage);

        return {
            imageUrl: result.imageUrl,
            thoughtSignature: result.thoughtSignature,
            assistantMessage: acknowledgment
        };
    } catch (error) {
        console.error("Refinement failed:", error);
        throw error;
    }
}
