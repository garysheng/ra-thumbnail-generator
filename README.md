# Really American Thumbnail Generator

An AI-powered thumbnail generator designed for Really American Media to reduce thumbnail creation time from 30-45 minutes to under 5 minutes.

## Features

- **Intelligent Template Selection**: Analyzes story context to suggest the best template.
- **Brand Consistency**: Enforces Really American's "Sensationalist Political Commentary" style (Impact font, Yellow/Red colors).
- **Live Preview**: Real-time CSS-based preview of the thumbnail.
- **Iterative Refinement**: Customize text, emotions, and images.
- **Download Ready**: Generates high-quality PNGs for YouTube.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Image Generation**: html2canvas

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
3. **Customize**: Tweak the headline, speech bubble, and emotions.
4. **Download**: Click the download button to save the thumbnail.
