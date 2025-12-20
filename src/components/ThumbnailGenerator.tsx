"use client";

import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Download, RefreshCw, ChevronRight, Wand2, Send, MessageCircle, FileText, Check, Upload, X, Image as ImageIcon, Users, TrendingDown, Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import { GenerationState, TemplateType, ThumbnailData, ChatMessage, ReferenceImage } from "@/types";
import { analyzeTranscript, generateThumbnailImage, refineThumbnailWithChat } from "@/app/actions";

const TEMPLATES = [
    { 
        id: 'conflict' as TemplateType, 
        name: 'Conflict & Humiliation', 
        desc: 'Split-screen showdown between two figures. Perfect for debates, arguments, and takedowns.',
        icon: Users,
        fields: ['targetName', 'targetEmotion', 'opponentName', 'opponentEmotion', 'headline', 'bubbleText']
    },
    { 
        id: 'bad-news' as TemplateType, 
        name: 'Bad News & Data', 
        desc: 'Single subject reacting to disaster. Best for polls, market crashes, scandals, and disasters.',
        icon: TrendingDown,
        fields: ['targetName', 'targetEmotion', 'headline', 'bubbleText']
    },
    { 
        id: 'freeflow' as TemplateType, 
        name: 'Freeflow Creative', 
        desc: 'AI-driven creative composition. For unique stories that don\'t fit standard templates.',
        icon: Palette,
        fields: ['targetName', 'targetEmotion', 'headline', 'bubbleText']
    }
];

export function ThumbnailGenerator() {
    const [state, setState] = useState<GenerationState>({
        step: "input",
        transcript: "",
        selectedTemplate: "conflict",
        data: {
            headline: "",
            targetName: "",
            targetEmotion: "Panicked",
            bubbleText: "",
        },
        referenceImages: [],
        chatHistory: [],
        currentImageUrl: undefined,
    });

    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [chatInput, setChatInput] = useState("");
    const [isRefining, setIsRefining] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [pendingImage, setPendingImage] = useState<string | null>(null);
    const [imageDescription, setImageDescription] = useState("");
    const [quotaCooldown, setQuotaCooldown] = useState<number>(0);
    const chatEndRef = useRef<HTMLDivElement>(null);

    const [visualElementInput, setVisualElementInput] = useState("");

    const handleAddVisualElement = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && visualElementInput.trim()) {
            e.preventDefault();
            setState(prev => ({
                ...prev,
                data: {
                    ...prev.data,
                    visualElements: [...(prev.data.visualElements || []), visualElementInput.trim()]
                }
            }));
            setVisualElementInput("");
        }
    };

    const handleRemoveVisualElement = (index: number) => {
        setState(prev => ({
            ...prev,
            data: {
                ...prev.data,
                visualElements: prev.data.visualElements?.filter((_, i) => i !== index)
            }
        }));
    };
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [state.chatHistory]);

    // Auto-generate when entering generate step
    useEffect(() => {
        if (state.step === "generate" && !generatedImage && !isGeneratingImage && quotaCooldown === 0) {
            handleGenerateImage(true);
        }
    }, [state.step]);

    // Countdown timer for quota cooldown
    useEffect(() => {
        if (quotaCooldown > 0) {
            const timer = setInterval(() => {
                setQuotaCooldown(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [quotaCooldown]);

    const handleAnalyze = async () => {
        if (!state.transcript) return;
        setIsAnalyzing(true);

        try {
            const result = await analyzeTranscript(state.transcript);
            setState(prev => ({
                ...prev,
                step: "select",
                selectedTemplate: result.selectedTemplate,
                templateReason: result.templateReason,
                data: result.data,
            }));
        } catch (error) {
            console.error("Analysis failed:", error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleTemplateSelect = (template: TemplateType) => {
        setState(prev => ({
            ...prev,
            selectedTemplate: template,
        }));
    };

    const handleConfirmTemplate = () => {
        setState(prev => ({
            ...prev,
            step: "customize"
        }));
    };

    const handleProceedToGenerate = () => {
        setState(prev => ({
            ...prev,
            step: "generate",
            chatHistory: [],
        }));
        setGeneratedImage(null);
        // Generation will be triggered automatically by useEffect
    };

    const handleGenerateImage = async (highQuality: boolean) => {
        setIsGeneratingImage(true);
        try {
            const result = await generateThumbnailImage(
                state.data, 
                state.selectedTemplate, 
                highQuality,
                undefined, // no refinement instruction
                state.referenceImages // pass reference images
            );
            setGeneratedImage(result.imageUrl);
            setState(prev => ({ 
                ...prev, 
                currentImageUrl: result.imageUrl,
                lastThoughtSignature: result.thoughtSignature,
                chatHistory: [
                    ...prev.chatHistory,
                    {
                        role: 'assistant',
                        content: `Generated your "${state.selectedTemplate}" thumbnail! The image shows ${state.data.targetName} looking ${state.data.targetEmotion}${state.data.opponentName ? ` facing off against ${state.data.opponentName}` : ''}. Headline: "${state.data.headline}". Let me know if you'd like any changes!`,
                        imageUrl: result.imageUrl,
                        timestamp: new Date(),
                    }
                ]
            }));
        } catch (error: any) {
            console.error("Failed to generate image:", error);
            
            // Check for quota error
            if (error.message && error.message.startsWith('QUOTA_ERROR:')) {
                const cooldownSeconds = parseInt(error.message.split(':')[1]);
                setQuotaCooldown(cooldownSeconds);
                setState(prev => ({
                    ...prev,
                    chatHistory: [
                        ...prev.chatHistory,
                        {
                            role: 'assistant',
                            content: `⏱️ Quota limit reached. Please wait ${cooldownSeconds} seconds before trying again. The API has rate limits to prevent abuse.`,
                            timestamp: new Date(),
                        }
                    ]
                }));
            } else if (error.message && error.message.startsWith('IMAGE_BLOCKED:')) {
                const reason = error.message.split(':')[1];
                setState(prev => ({
                    ...prev,
                    chatHistory: [
                        ...prev.chatHistory,
                        {
                            role: 'assistant',
                            content: `🚫 Image generation was blocked by the AI safety filters (Reason: ${reason}). This usually happens when the prompt contains names of public figures or sensitive political content. Try using a more generic description of the subjects in the "Customize" step.`,
                            timestamp: new Date(),
                        }
                    ]
                }));
            } else {
                setState(prev => ({
                    ...prev,
                    chatHistory: [
                        ...prev.chatHistory,
                        {
                            role: 'assistant',
                            content: "Sorry, I couldn't generate the image. Please try again or adjust your settings.",
                            timestamp: new Date(),
                        }
                    ]
                }));
            }
        } finally {
            setIsGeneratingImage(false);
        }
    };

    const handleChatSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatInput.trim() || isRefining || !generatedImage) return;

        const userMessage: ChatMessage = {
            role: 'user',
            content: chatInput,
            timestamp: new Date(),
        };

        setState(prev => ({
            ...prev,
            chatHistory: [...prev.chatHistory, userMessage],
        }));
        setChatInput("");
        setIsRefining(true);

        try {
            const chatHistorySummary = state.chatHistory.map(m => `${m.role}: ${m.content}`);
            
            // Pass previous image for conversational editing
            const previousImage = generatedImage && state.lastThoughtSignature ? {
                base64: generatedImage,
                thoughtSignature: state.lastThoughtSignature
            } : undefined;

            const result = await refineThumbnailWithChat(
                chatInput,
                state.data,
                state.selectedTemplate,
                chatHistorySummary,
                state.referenceImages,
                previousImage // pass previous image with thought signature
            );

            setGeneratedImage(result.imageUrl);
            setState(prev => ({
                ...prev,
                currentImageUrl: result.imageUrl,
                lastThoughtSignature: result.thoughtSignature,
                chatHistory: [
                    ...prev.chatHistory,
                    {
                        role: 'assistant',
                        content: result.assistantMessage,
                        imageUrl: result.imageUrl,
                        timestamp: new Date(),
                    }
                ]
            }));
        } catch (error: any) {
            console.error("Refinement failed:", error);
            
            // Check for quota error
            if (error.message && error.message.startsWith('QUOTA_ERROR:')) {
                const cooldownSeconds = parseInt(error.message.split(':')[1]);
                setQuotaCooldown(cooldownSeconds);
                setState(prev => ({
                    ...prev,
                    chatHistory: [
                        ...prev.chatHistory,
                        {
                            role: 'assistant',
                            content: `⏱️ Quota limit reached. Please wait ${cooldownSeconds} seconds before trying again.`,
                            timestamp: new Date(),
                        }
                    ]
                }));
            } else if (error.message && error.message.startsWith('IMAGE_BLOCKED:')) {
                const reason = error.message.split(':')[1];
                setState(prev => ({
                    ...prev,
                    chatHistory: [
                        ...prev.chatHistory,
                        {
                            role: 'assistant',
                            content: `🚫 Your refinement request was blocked by the AI safety filters (Reason: ${reason}). This can happen with certain political descriptions. Try rephrasing your request.`,
                            timestamp: new Date(),
                        }
                    ]
                }));
            } else {
                setState(prev => ({
                    ...prev,
                    chatHistory: [
                        ...prev.chatHistory,
                        {
                            role: 'assistant',
                            content: "Sorry, I couldn't apply those changes. Try being more specific or regenerate the thumbnail.",
                            timestamp: new Date(),
                        }
                    ]
                }));
            }
        } finally {
            setIsRefining(false);
        }
    };

    const handleDownload = async () => {
        setIsDownloading(true);
        try {
            if (generatedImage) {
                const link = document.createElement('a');
                link.download = `really-american-${state.selectedTemplate}-${Date.now()}.png`;
                link.href = generatedImage;
                link.click();
            }
        } catch (err) {
            console.error("Download failed", err);
        } finally {
            setIsDownloading(false);
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        // For now, handle one image at a time
        const file = files[0];
        const reader = new FileReader();
        reader.onload = (event) => {
            const base64 = event.target?.result as string;
            setPendingImage(base64);
        };
        reader.readAsDataURL(file);
        
        // Reset the input so the same file can be uploaded again
        e.target.value = '';
    };

    const handleSaveReferenceImage = () => {
        if (!pendingImage || !imageDescription.trim()) return;
        
        setState(prev => ({
            ...prev,
            referenceImages: [...prev.referenceImages, {
                base64: pendingImage,
                description: imageDescription.trim()
            }]
        }));
        
        setPendingImage(null);
        setImageDescription("");
    };

    const handleCancelImageUpload = () => {
        setPendingImage(null);
        setImageDescription("");
    };

    const removeReferenceImage = (index: number) => {
        setState(prev => ({
            ...prev,
            referenceImages: prev.referenceImages.filter((_, i) => i !== index)
        }));
    };

    const currentStepIndex = ['input', 'select', 'customize', 'generate'].indexOf(state.step);

    return (
        <div className={cn(
            "mx-auto p-6 transition-all duration-500",
            state.step === 'generate' ? "max-w-[1400px]" : "max-w-7xl"
        )}>
            {/* Step Indicator */}
            <div className="mb-8">
                <div className="flex items-center gap-2 text-sm text-neutral-500 mb-2 font-mono uppercase tracking-wider">
                    {[
                        { label: 'Input', step: 'input' as const },
                        { label: 'Template', step: 'select' as const },
                        { label: 'Customize', step: 'customize' as const },
                        { label: 'Generate', step: 'generate' as const }
                    ].map((item, idx) => {
                        const stepNames = ['input', 'select', 'customize', 'generate'];
                        const itemStepIndex = stepNames.indexOf(item.step);
                        const canNavigate = currentStepIndex > itemStepIndex;
                        
                        return (
                            <div key={item.label} className="flex items-center gap-2">
                                {idx > 0 && <ChevronRight size={14} />}
                                <button
                                    onClick={() => canNavigate && setState(prev => ({ ...prev, step: item.step }))}
                                    disabled={!canNavigate}
                                    className={cn(
                                        "transition-colors",
                                        currentStepIndex === idx ? "text-brand-yellow" : 
                                        currentStepIndex > idx ? "text-white hover:text-brand-yellow cursor-pointer" : 
                                        "text-neutral-600 cursor-not-allowed"
                                    )}
                                >
                                    {idx + 1}. {item.label}
                                </button>
                            </div>
                        );
                    })}
                </div>
                <h2 className="text-3xl font-bold text-white uppercase tracking-tight">
                    {state.step === "input" && "Analyze Story"}
                    {state.step === "select" && "Select Template"}
                    {state.step === "customize" && "Customize Details"}
                    {state.step === "generate" && "Generate & Refine"}
                </h2>
            </div>

            <AnimatePresence mode="wait">
                {/* STEP 1: INPUT */}
                {state.step === "input" && (
                    <motion.div
                        key="input"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-6"
                    >
                        <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6 backdrop-blur-sm">
                            <label className="block text-sm font-medium text-neutral-400 mb-2">
                                VIDEO TRANSCRIPT OR STORY CONTEXT
                            </label>
                            <textarea
                                value={state.transcript}
                                onChange={(e) => setState(prev => ({ ...prev, transcript: e.target.value }))}
                                placeholder="Paste your video transcript here or describe the story..."
                                className="w-full h-64 bg-neutral-950 border border-neutral-800 rounded-lg p-4 text-neutral-200 placeholder:text-neutral-600 focus:ring-2 focus:ring-brand-yellow focus:border-transparent outline-none resize-none font-mono text-sm leading-relaxed"
                            />
                            <div className="mt-4 flex justify-end">
                                <button
                                    onClick={handleAnalyze}
                                    disabled={!state.transcript || isAnalyzing}
                                    className="bg-brand-yellow text-black px-6 py-3 rounded-lg font-bold uppercase tracking-wide hover:bg-yellow-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isAnalyzing ? (
                                        <>
                                            <RefreshCw className="animate-spin" size={18} />
                                            Analyzing...
                                        </>
                                    ) : (
                                        <>
                                            <Wand2 size={18} />
                                            Analyze Story
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* STEP 2: SELECT TEMPLATE */}
                {state.step === "select" && (
                    <motion.div
                        key="select"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-4"
                    >
                        {/* AI Suggestion Banner */}
                        {state.templateReason && (
                            <div className="bg-brand-yellow/10 border border-brand-yellow/30 rounded-xl p-4 mb-6">
                                <div className="flex items-start gap-3">
                                    <Sparkles className="text-brand-yellow mt-0.5" size={20} />
                                    <div>
                                        <p className="text-sm font-bold text-brand-yellow uppercase tracking-wider mb-1">AI Recommendation</p>
                                        <p className="text-neutral-300 text-sm">{state.templateReason}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Template Rows */}
                        <div className="space-y-3">
                            {TEMPLATES.map((t) => {
                                const Icon = t.icon;
                                const isSelected = state.selectedTemplate === t.id;
                                return (
                                    <button
                                        key={t.id}
                                        onClick={() => handleTemplateSelect(t.id)}
                                        className={cn(
                                            "w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all",
                                            isSelected
                                                ? "bg-neutral-900 border-brand-yellow shadow-[0_0_20px_rgba(255,242,0,0.1)]"
                                                : "bg-neutral-900/50 border-neutral-800 hover:border-neutral-600"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-12 h-12 rounded-lg flex items-center justify-center",
                                            isSelected ? "bg-brand-yellow text-black" : "bg-neutral-800 text-neutral-400"
                                        )}>
                                            <Icon size={24} />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className={cn(
                                                "text-lg font-bold mb-1",
                                                isSelected ? "text-brand-yellow" : "text-white"
                                            )}>{t.name}</h3>
                                            <p className="text-sm text-neutral-400">{t.desc}</p>
                                        </div>
                                        {isSelected && (
                                            <div className="w-8 h-8 rounded-full bg-brand-yellow flex items-center justify-center">
                                                <Check size={18} className="text-black" />
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-4 pt-4">
                            <button
                                onClick={() => setState(prev => ({ ...prev, step: "input" }))}
                                className="px-6 py-3 text-neutral-400 hover:text-white transition-colors font-mono text-sm"
                            >
                                ← Back
                            </button>
                            <button
                                onClick={handleConfirmTemplate}
                                className="flex-1 bg-brand-yellow text-black px-6 py-3 rounded-lg font-bold uppercase tracking-wide hover:bg-yellow-300 transition-colors flex items-center justify-center gap-2"
                            >
                                <Check size={18} />
                                Confirm Template
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* STEP 3: CUSTOMIZE */}
                {state.step === "customize" && (
                    <motion.div
                        key="customize"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-6"
                    >
                        {/* Story Context Display */}
                        <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                    <FileText size={16} /> Story Context
                                </h3>
                                <div className="flex items-center gap-2 px-3 py-1 bg-neutral-800 rounded-full border border-neutral-700">
                                    {(() => {
                                        const t = TEMPLATES.find(t => t.id === state.selectedTemplate);
                                        const Icon = t?.icon || Users;
                                        return (
                                            <>
                                                <Icon size={14} className="text-brand-yellow" />
                                                <span className="text-xs text-neutral-300 font-medium uppercase">{t?.name}</span>
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs text-neutral-500 uppercase font-bold mb-2 block">Narrative Summary</label>
                                    <textarea
                                        value={state.data.narrativeSummary || ''}
                                        onChange={(e) => setState(prev => ({ 
                                            ...prev, 
                                            data: { ...prev.data, narrativeSummary: e.target.value } 
                                        }))}
                                        className="w-full h-32 bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-white placeholder:text-neutral-600 focus:border-brand-yellow outline-none resize-none text-sm leading-relaxed"
                                        placeholder="Summarize the story context..."
                                    />
                                </div>

                                <div>
                                    <label className="text-xs text-neutral-500 uppercase font-bold mb-2 block">Visual Elements</label>
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {state.data.visualElements?.map((element, idx) => (
                                            <span key={idx} className="text-xs bg-neutral-800 text-brand-yellow px-2 py-1 rounded flex items-center gap-1">
                                                {element}
                                                <button 
                                                    onClick={() => handleRemoveVisualElement(idx)}
                                                    className="hover:text-white transition-colors"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                    <input
                                        type="text"
                                        value={visualElementInput}
                                        onChange={(e) => setVisualElementInput(e.target.value)}
                                        onKeyDown={handleAddVisualElement}
                                        placeholder="Type element and press Enter to add..."
                                        className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-white text-sm focus:border-brand-yellow outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Form Fields */}
                        <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6">
                            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Thumbnail Content</h3>
                            
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-neutral-500 uppercase font-bold mb-1 block">Headline</label>
                                    <input
                                        type="text"
                                        value={state.data.headline}
                                        onChange={(e) => setState(prev => ({ ...prev, data: { ...prev.data, headline: e.target.value } }))}
                                        placeholder="e.g., TRUMP PANICS!"
                                        className="w-full bg-neutral-950 border border-neutral-800 rounded p-3 text-white font-bold uppercase focus:border-brand-yellow outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-neutral-500 uppercase font-bold mb-1 block">Speech Bubble</label>
                                    <input
                                        type="text"
                                        value={state.data.bubbleText || ''}
                                        onChange={(e) => setState(prev => ({ ...prev, data: { ...prev.data, bubbleText: e.target.value } }))}
                                        placeholder="e.g., IT'S OVER!"
                                        className="w-full bg-neutral-950 border border-neutral-800 rounded p-3 text-white focus:border-brand-yellow outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-neutral-500 uppercase font-bold mb-1 block">Target Person</label>
                                    <input
                                        type="text"
                                        value={state.data.targetName}
                                        onChange={(e) => setState(prev => ({ ...prev, data: { ...prev.data, targetName: e.target.value } }))}
                                        placeholder="e.g., Donald Trump"
                                        className="w-full bg-neutral-950 border border-neutral-800 rounded p-3 text-white focus:border-brand-yellow outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-neutral-500 uppercase font-bold mb-1 block">Target Expression</label>
                                    <select
                                        value={state.data.targetEmotion}
                                        onChange={(e) => setState(prev => ({ ...prev, data: { ...prev.data, targetEmotion: e.target.value } }))}
                                        className="w-full bg-neutral-950 border border-neutral-800 rounded p-3 text-white focus:border-brand-yellow outline-none"
                                    >
                                        <option>Panicked</option>
                                        <option>Terrified</option>
                                        <option>Angry</option>
                                        <option>Crying</option>
                                        <option>Shocked</option>
                                        <option>Sweating</option>
                                    </select>
                                </div>

                                {state.selectedTemplate === 'conflict' && (
                                    <>
                                        <div>
                                            <label className="text-xs text-neutral-500 uppercase font-bold mb-1 block">Opponent Person</label>
                                            <input
                                                type="text"
                                                value={state.data.opponentName || ''}
                                                onChange={(e) => setState(prev => ({ ...prev, data: { ...prev.data, opponentName: e.target.value } }))}
                                                placeholder="e.g., Mark Kelly"
                                                className="w-full bg-neutral-950 border border-neutral-800 rounded p-3 text-white focus:border-brand-yellow outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-neutral-500 uppercase font-bold mb-1 block">Opponent Expression</label>
                                            <select
                                                value={state.data.opponentEmotion || 'Mocking'}
                                                onChange={(e) => setState(prev => ({ ...prev, data: { ...prev.data, opponentEmotion: e.target.value } }))}
                                                className="w-full bg-neutral-950 border border-neutral-800 rounded p-3 text-white focus:border-brand-yellow outline-none"
                                            >
                                                <option>Mocking</option>
                                                <option>Laughing</option>
                                                <option>Stern</option>
                                                <option>Smirking</option>
                                                <option>Confident</option>
                                            </select>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Reference Images Upload */}
                        <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6">
                            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                                <ImageIcon size={16} /> Reference Images (Optional)
                            </h3>
                            <p className="text-sm text-neutral-500 mb-4">
                                Upload reference images and describe how they should be used in the thumbnail.
                            </p>

                            <div className="space-y-3">
                                {state.referenceImages.map((img, idx) => (
                                    <div key={idx} className="flex gap-3 bg-neutral-950 p-3 rounded-lg border border-neutral-800 group">
                                        <img src={img.base64} alt={`Reference ${idx + 1}`} className="w-20 h-20 rounded object-cover flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-white font-medium mb-1">Reference {idx + 1}</p>
                                            <p className="text-xs text-neutral-400 line-clamp-2">{img.description}</p>
                                        </div>
                                        <button
                                            onClick={() => removeReferenceImage(idx)}
                                            className="flex-shrink-0 w-8 h-8 rounded-lg bg-neutral-800 hover:bg-red-900 flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                ))}
                                
                                <label className="flex items-center gap-3 p-4 rounded-lg border-2 border-dashed border-neutral-700 hover:border-brand-yellow text-neutral-500 hover:text-brand-yellow transition-colors cursor-pointer">
                                    <Upload size={20} />
                                    <span className="text-sm font-medium">Upload Reference Image</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="hidden"
                                    />
                                </label>
                            </div>
                        </div>

                        {/* Image Description Modal */}
                        {pendingImage && (
                            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 max-w-lg w-full"
                                >
                                    <h3 className="text-lg font-bold text-white uppercase mb-4">Describe This Reference Image</h3>
                                    
                                    <div className="mb-4">
                                        <img src={pendingImage} alt="Pending upload" className="w-full rounded-lg max-h-64 object-contain bg-neutral-950" />
                                    </div>

                                    <div className="mb-4">
                                        <label className="text-sm text-neutral-400 mb-2 block">
                                            How should this image be used?
                                        </label>
                                        <textarea
                                            value={imageDescription}
                                            onChange={(e) => setImageDescription(e.target.value)}
                                            placeholder="e.g., 'Use this as Trump's facial expression', 'Reference for Mark Kelly's stern look', 'This shows the courtroom setting I want'"
                                            className="w-full h-24 bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-white placeholder:text-neutral-600 focus:border-brand-yellow outline-none resize-none text-sm"
                                            autoFocus
                                        />
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={handleCancelImageUpload}
                                            className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-2 rounded-lg font-bold uppercase text-sm transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSaveReferenceImage}
                                            disabled={!imageDescription.trim()}
                                            className="flex-1 bg-brand-yellow hover:bg-yellow-400 text-black px-4 py-2 rounded-lg font-bold uppercase text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Add Image
                                        </button>
                                    </div>
                                </motion.div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-4">
                            <button
                                onClick={() => setState(prev => ({ ...prev, step: "select" }))}
                                className="px-6 py-3 text-neutral-400 hover:text-white transition-colors font-mono text-sm"
                            >
                                ← Back
                            </button>
                            <button
                                onClick={handleProceedToGenerate}
                                disabled={!state.data.headline || !state.data.targetName}
                                className="flex-1 bg-brand-yellow text-black px-6 py-3 rounded-lg font-bold uppercase tracking-wide hover:bg-yellow-300 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <Wand2 size={18} />
                                Generate Thumbnail
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* STEP 4: GENERATE & REFINE */}
                {state.step === "generate" && (
                    <motion.div
                        key="generate"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
                    >
                        {/* Left Column: Preview & Controls */}
                        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
                            {/* Current Settings Display */}
                            <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6 space-y-6">
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider">Current Settings</h3>
                                        <div className="flex items-center gap-2 px-3 py-1 bg-neutral-800 rounded-full border border-neutral-700">
                                            {(() => {
                                                const t = TEMPLATES.find(t => t.id === state.selectedTemplate);
                                                const Icon = t?.icon || Users;
                                                return (
                                                    <>
                                                        <Icon size={12} className="text-brand-yellow" />
                                                        <span className="text-xs text-neutral-300 font-medium uppercase">{t?.name}</span>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                                        <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800">
                                            <span className="text-neutral-500 text-xs font-bold uppercase block mb-1">Headline</span>
                                            <p className="text-white font-bold text-lg leading-tight">{state.data.headline}</p>
                                        </div>
                                        <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800">
                                            <span className="text-neutral-500 text-xs font-bold uppercase block mb-1">Speech Bubble</span>
                                            <p className="text-white text-lg">{state.data.bubbleText}</p>
                                        </div>
                                        <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800">
                                            <span className="text-neutral-500 text-xs font-bold uppercase block mb-1">Target</span>
                                            <p className="text-white font-medium">{state.data.targetName}</p>
                                            <p className="text-brand-yellow text-xs mt-1 uppercase font-bold">{state.data.targetEmotion}</p>
                                        </div>
                                        {state.selectedTemplate === 'conflict' && state.data.opponentName && (
                                            <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800">
                                                <span className="text-neutral-500 text-xs font-bold uppercase block mb-1">Opponent</span>
                                                <p className="text-white font-medium">{state.data.opponentName}</p>
                                                <p className="text-brand-yellow text-xs mt-1 uppercase font-bold">{state.data.opponentEmotion}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Story Context */}
                                {state.data.narrativeSummary && (
                                    <div className="border-t border-neutral-800 pt-6">
                                        <div className="flex items-center gap-2 mb-3">
                                            <FileText size={16} className="text-brand-yellow" />
                                            <span className="text-sm font-bold text-neutral-400 uppercase tracking-wider">Story Context</span>
                                        </div>
                                        <p className="text-sm text-neutral-300 leading-relaxed mb-4 bg-neutral-950/50 p-4 rounded-lg border border-neutral-800/50">
                                            {state.data.narrativeSummary}
                                        </p>
                                        {state.data.visualElements && state.data.visualElements.length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                {state.data.visualElements.map((element, idx) => (
                                                    <span key={idx} className="text-xs bg-neutral-800 text-brand-yellow px-3 py-1 rounded-full border border-brand-yellow/20">
                                                        {element}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Reference Images */}
                                {state.referenceImages.length > 0 && (
                                    <div className="border-t border-neutral-800 pt-6">
                                        <span className="text-sm font-bold text-neutral-400 uppercase tracking-wider block mb-3">Reference Images</span>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                            {state.referenceImages.map((img, idx) => (
                                                <div key={idx} className="flex flex-col gap-2 bg-neutral-950 p-2 rounded-lg border border-neutral-800">
                                                    <img src={img.base64} alt={`Ref ${idx + 1}`} className="w-full aspect-square rounded object-cover" />
                                                    <span className="text-[10px] text-neutral-500 line-clamp-2 px-1">{img.description}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Preview Area */}
                            <div className="aspect-video bg-neutral-900 rounded-2xl border-2 border-neutral-800 overflow-hidden relative shadow-2xl group ring-1 ring-white/5">
                                {isGeneratingImage ? (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-900/90 backdrop-blur-sm z-20">
                                        <div className="relative">
                                            <RefreshCw className="animate-spin text-brand-yellow mb-6" size={64} />
                                            <div className="absolute inset-0 blur-2xl bg-brand-yellow/20 animate-pulse"></div>
                                        </div>
                                        <p className="text-white text-lg font-bold uppercase tracking-widest animate-pulse">Generating thumbnail...</p>
                                        <p className="text-neutral-500 text-sm mt-3">Refining photorealistic likenesses...</p>
                                    </div>
                                ) : generatedImage ? (
                                    <img src={generatedImage} alt="Generated Thumbnail" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-600 bg-neutral-950">
                                        <ImageIcon size={64} className="mb-4 opacity-20" />
                                        <p className="text-lg font-medium opacity-50">Awaiting generation...</p>
                                    </div>
                                )}

                                {generatedImage && (
                                    <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-300 z-50 flex gap-3">
                                        <button
                                            onClick={handleDownload}
                                            disabled={isDownloading}
                                            className="bg-black/80 text-white p-3 rounded-xl hover:bg-brand-yellow hover:text-black transition-all transform hover:scale-110 disabled:opacity-50 border border-white/10"
                                            title="Download PNG"
                                        >
                                            {isDownloading ? <RefreshCw className="animate-spin" size={24} /> : <Download size={24} />}
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Regenerate Button */}
                            {generatedImage && (
                                <div className="space-y-4">
                                    {quotaCooldown > 0 && (
                                        <div className="bg-red-900/10 border border-red-900/30 rounded-xl p-4 text-center backdrop-blur-sm">
                                            <p className="text-red-400 text-sm font-black uppercase mb-1 tracking-tighter">API Rate Limit Active</p>
                                            <p className="text-neutral-400 text-xs">Available again in <span className="text-white font-mono">{quotaCooldown}s</span></p>
                                        </div>
                                    )}
                                    <button
                                        onClick={() => handleGenerateImage(true)}
                                        disabled={isGeneratingImage || quotaCooldown > 0}
                                        className="w-full bg-brand-yellow hover:bg-yellow-400 text-black p-4 rounded-xl font-black uppercase text-base transition-all transform hover:translate-y-[-2px] active:translate-y-[0] shadow-lg flex items-center justify-center gap-3 disabled:opacity-50 disabled:transform-none"
                                    >
                                        {isGeneratingImage ? (
                                            <>
                                                <RefreshCw className="animate-spin" size={20} />
                                                Generating New Version...
                                            </>
                                        ) : quotaCooldown > 0 ? (
                                            <>
                                                <RefreshCw size={20} />
                                                Cooldown ({quotaCooldown}s)
                                            </>
                                        ) : (
                                            <>
                                                <Wand2 size={20} />
                                                Regenerate Thumbnail
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Right Sidebar: Chat Interface */}
                        <div className="lg:col-span-5 xl:col-span-4 flex flex-col h-full sticky top-6">
                            <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl flex flex-col h-[calc(100vh-200px)] min-h-[700px]">
                            <div className="p-4 border-b border-neutral-800">
                                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                    <MessageCircle size={16} className="text-brand-yellow" /> 
                                    Refine Your Thumbnail
                                </h3>
                                <p className="text-xs text-neutral-500 mt-1">
                                    Chat to make changes: "Make it more dramatic", "Add flames", etc.
                                </p>
                            </div>

                            {/* Chat Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {state.chatHistory.length === 0 && !isGeneratingImage && (
                                    <div className="text-center text-neutral-600 py-8">
                                        <MessageCircle size={32} className="mx-auto mb-3 opacity-50" />
                                        <p className="text-sm">Generate a thumbnail first</p>
                                        <p className="text-xs mt-1">Then chat here to refine it!</p>
                                    </div>
                                )}
                                
                                {state.chatHistory.map((msg, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={cn(
                                            "flex",
                                            msg.role === 'user' ? "justify-end" : "justify-start"
                                        )}
                                    >
                                        <div className={cn(
                                            "max-w-[85%] rounded-xl p-3",
                                            msg.role === 'user' 
                                                ? "bg-brand-yellow text-black" 
                                                : "bg-neutral-800 text-white"
                                        )}>
                                            <p className="text-sm">{msg.content}</p>
                                            {msg.imageUrl && (
                                                <div className="mt-2 rounded-lg overflow-hidden border border-neutral-700">
                                                    <img 
                                                        src={msg.imageUrl} 
                                                        alt="Generated thumbnail" 
                                                        className="w-full aspect-video object-cover"
                                                    />
                                                </div>
                                            )}
                                            <p className="text-xs opacity-50 mt-1">
                                                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </motion.div>
                                ))}

                                {isRefining && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                                        <div className="bg-neutral-800 text-white rounded-xl p-3">
                                            <div className="flex items-center gap-2">
                                                <RefreshCw className="animate-spin" size={14} />
                                                <span className="text-sm">Refining thumbnail...</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                <div ref={chatEndRef} />
                            </div>

                            {/* Chat Input */}
                            <form onSubmit={handleChatSubmit} className="p-4 border-t border-neutral-800">
                                {quotaCooldown > 0 && (
                                    <div className="mb-3 bg-red-900/20 border border-red-900/50 rounded-lg p-2 text-center">
                                        <p className="text-red-400 text-xs font-bold">⏱️ Cooldown: {quotaCooldown}s</p>
                                    </div>
                                )}
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                        placeholder={
                                            quotaCooldown > 0 ? `Wait ${quotaCooldown}s...` :
                                            generatedImage ? "Describe changes..." : 
                                            "Generate a thumbnail first..."
                                        }
                                        disabled={!generatedImage || isRefining || quotaCooldown > 0}
                                        className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 text-white placeholder:text-neutral-600 focus:border-brand-yellow outline-none text-sm disabled:opacity-50"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!chatInput.trim() || !generatedImage || isRefining || quotaCooldown > 0}
                                        className="bg-brand-yellow hover:bg-yellow-400 text-black p-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Send size={18} />
                                    </button>
                                </div>
                                <div className="mt-3 text-xs text-neutral-500 bg-neutral-900/50 rounded-lg p-3 border border-neutral-800">
                                    <p className="font-bold text-neutral-400 mb-2 uppercase">How to refine:</p>
                                    <ul className="space-y-1.5 list-disc list-inside">
                                        <li><span className="text-brand-yellow">Visuals:</span> "Add flames in background", "Make it darker"</li>
                                        <li><span className="text-brand-yellow">Expressions:</span> "Make Trump look more panicked", "Make Biden laugh"</li>
                                        <li><span className="text-brand-yellow">Elements:</span> "Add a falling stock chart", "Put a MAGA hat on him"</li>
                                        <li><span className="text-brand-yellow">Composition:</span> "Zoom in on his face", "Change angle to low upshot"</li>
                                    </ul>
                                </div>
                            </form>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    </div>
);
}
