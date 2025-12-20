# Really American Thumbnail Generator

An AI-powered thumbnail generator designed for Really American Media, primarily for **Substack article thumbnails**. 

**Note**: Originally intended to replace the YouTube thumbnail workflow, but it turned out to be harder to create something that replaces the fine-tuned machine for YouTube. This tool is now focused on Substack content creation.

## Features

- **Intelligent Template Selection**: Analyzes story context to suggest the best template.
- **Brand Consistency**: Enforces Really American's "Sensationalist Political Commentary" style (Impact font, Yellow/Red colors).
- **AI-Powered Generation**: Uses Google Gemini 3 Pro Image to generate photorealistic thumbnails.
- **Iterative Refinement**: Chat-based refinement system to adjust thumbnails iteratively.
- **Reference Images**: Upload reference images with descriptions to guide generation.
- **Download Ready**: Generates high-quality PNGs for Substack articles.

## Tech Stack

- **Framework**: Next.js 16 (App Router, Server Actions)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **AI**: Google Gemini 3 Pro (Image Generation & Text Analysis)

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) with your browser.

## Usage

1. **Input**: Paste a video transcript or describe a story.
2. **Select**: Choose a template (Conflict, Bad News, or Freeflow).
3. **Customize**: Tweak the headline, speech bubble, emotions, and upload reference images.
4. **Generate**: AI generates a photorealistic thumbnail based on your story context.
5. **Refine**: Use the chat interface to iteratively refine the thumbnail.
6. **Download**: Click the download button to save the thumbnail for your Substack article.

## Environment Setup

Create a `.env.local` file with your Google Gemini API key:

```bash
GOOGLE_API_KEY=your_api_key_here
```

## Limitations

- **YouTube Thumbnails**: This tool is optimized for Substack article thumbnails. Creating YouTube-quality thumbnails that match the fine-tuned production workflow proved more challenging than expected.
- **API Quotas**: Google Gemini API has rate limits. The tool handles quota errors gracefully with cooldown timers.
