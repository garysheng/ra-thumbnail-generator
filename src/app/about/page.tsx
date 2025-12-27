import Link from "next/link";
import { Header } from "@/components/Header";
import { ArrowLeft, Bug, MessageSquare, Info } from "lucide-react";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-neutral-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-900 via-neutral-950 to-neutral-950">
      <Header />
      
      <div className="max-w-3xl mx-auto p-6 py-12">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-neutral-400 hover:text-brand-yellow transition-colors mb-8 font-mono text-sm"
        >
          <ArrowLeft size={16} />
          Back to Generator
        </Link>

        <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-8 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-brand-yellow rounded-xl flex items-center justify-center text-black">
              <Info size={24} />
            </div>
            <h1 className="text-3xl font-bold text-white uppercase tracking-tight">About This Tool</h1>
          </div>

          <div className="space-y-8 text-neutral-300 leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-white uppercase tracking-wide mb-3 flex items-center gap-2">
                For the Really American Team
              </h2>
              <p className="mb-4">
                This AI-powered Thumbnail Generator is custom-built for the Really American Media production team. 
                It's designed to dramatically speed up our workflow by generating high-quality, brand-consistent 
                thumbnails directly from video transcripts or story contexts.
              </p>
              <div className="bg-brand-yellow/10 border border-brand-yellow/30 rounded-lg p-4">
                <p className="text-sm text-brand-yellow font-bold uppercase mb-1">📌 Currently Optimized For:</p>
                <p className="text-neutral-300 text-sm">
                  <strong className="text-white">Substack</strong> - Thumbnails are generated at 14:10 aspect ratio (1456 x 1048 pixels), 
                  which is the recommended size for Substack social previews. YouTube thumbnail support may be added in the future.
                </p>
              </div>
            </section>

            <section className="grid md:grid-cols-2 gap-4">
              <div className="bg-neutral-950/50 border border-neutral-800 p-4 rounded-xl">
                <h3 className="font-bold text-white uppercase text-sm mb-2">✨ What it does</h3>
                <ul className="text-sm space-y-2 list-disc list-inside text-neutral-400">
                  <li>Analyzes transcripts for key conflict narratives</li>
                  <li>Suggests optimized templates (Conflict, Bad News, etc.)</li>
                  <li>Generates photorealistic composite images</li>
                  <li>Allows iterative refinement via chat</li>
                </ul>
              </div>
              <div className="bg-neutral-950/50 border border-neutral-800 p-4 rounded-xl">
                <h3 className="font-bold text-white uppercase text-sm mb-2">🚀 Best Practices</h3>
                <ul className="text-sm space-y-2 list-disc list-inside text-neutral-400">
                  <li>Provide detailed story context</li>
                  <li>Upload reference images for specific expressions</li>
                  <li>Use the chat to refine details ("add flames", "darker")</li>
                  <li>Check the "Story Context" panel to see what the AI knows</li>
                </ul>
              </div>
            </section>

            <section className="bg-neutral-950/50 border border-neutral-800 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white uppercase tracking-wide mb-4">What's New in v0.1.1</h2>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <span className="text-brand-yellow font-bold">•</span>
                  <div>
                    <p className="text-white font-medium mb-1">Substack Optimization</p>
                    <p className="text-neutral-400">Changed aspect ratio from 16:9 (YouTube) to 14:10 (1456 x 1048 pixels) for Substack social previews.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-brand-yellow font-bold">•</span>
                  <div>
                    <p className="text-white font-medium mb-1">Speech Bubble Toggle</p>
                    <p className="text-neutral-400">Added option to disable speech bubble in thumbnails via checkbox in the Customize step.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-brand-yellow font-bold">•</span>
                  <div>
                    <p className="text-white font-medium mb-1">Free Text Expressions</p>
                    <p className="text-neutral-400">Changed expression fields from dropdown menus to free text inputs, allowing any expression you want.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-brand-yellow font-bold">•</span>
                  <div>
                    <p className="text-white font-medium mb-1">Performance Improvements</p>
                    <p className="text-neutral-400">Switched story analysis to Gemini 3 Flash for faster and more cost-effective processing.</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-brand-yellow/10 border border-brand-yellow/20 rounded-xl p-6">
              <h2 className="text-xl font-bold text-brand-yellow uppercase tracking-wide mb-4 flex items-center gap-2">
                <Bug size={20} />
                Report Bugs & Feedback
              </h2>
              <p className="mb-4">
                This tool is in active development (v0.1.1). If you encounter any issues, have feature requests, 
                or just want to share feedback, please reach out directly:
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex items-center gap-3 bg-black/40 p-3 rounded-lg border border-brand-yellow/30 flex-1">
                  <div className="w-10 h-10 bg-brand-yellow/20 rounded-full flex items-center justify-center text-brand-yellow">
                    <MessageSquare size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-brand-yellow/70 font-bold uppercase">Text Gary</p>
                    <p className="text-white font-mono">(630) 240-4545</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-black/40 p-3 rounded-lg border border-brand-yellow/30 flex-1">
                  <div className="w-10 h-10 bg-brand-yellow/20 rounded-full flex items-center justify-center text-brand-yellow">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                      <path d="M6 15a2 2 0 0 1-2 2a2 2 0 0 1-2-2a2 2 0 0 1 2-2h2v2zm1-4a2 2 0 0 1 2-2a2 2 0 0 1 2 2v2h-2a2 2 0 0 1-2-2zm2-5a2 2 0 0 1 2-2a2 2 0 0 1 2 2v2h-2a2 2 0 0 1-2-2zm5-2a2 2 0 0 1 2 2v2h-2a2 2 0 0 1 2-2a2 2 0 0 1-2-2zm0 4a2 2 0 0 1 2 2v2h-2a2 2 0 0 1-2-2v-2zm5-2a2 2 0 0 1 2 2v2h-2a2 2 0 0 1-2-2a2 2 0 0 1 2-2zm0 4a2 2 0 0 1 2 2v2h-2a2 2 0 0 1-2-2v-2zm5-2a2 2 0 0 1 2 2v2h-2a2 2 0 0 1-2-2a2 2 0 0 1 2-2z"/>
                      <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 17.688a2.527 2.527 0 0 1-2.521 2.522a2.528 2.528 0 0 1-2.52-2.522a2.528 2.528 0 0 1 2.52-2.52h2.522v2.52zm12.622 0a2.528 2.528 0 0 1 2.522 2.522a2.528 2.528 0 0 1-2.522 2.52a2.528 2.528 0 0 1-2.52-2.52v-2.522h2.52zm1.266-2.523a2.528 2.528 0 0 1 2.523 2.521a2.527 2.527 0 0 1-2.523 2.522h-2.522V15.165a2.528 2.528 0 0 1 2.522-2.521z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-brand-yellow/70 font-bold uppercase">Slack</p>
                    <p className="text-white">Ping Gary Sheng</p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

