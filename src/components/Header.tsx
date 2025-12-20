import Image from "next/image";
import Link from "next/link";
import { Info } from "lucide-react";

export function Header() {
    return (
        <header className="border-b border-neutral-800 bg-neutral-900/50 backdrop-blur-md sticky top-0 z-50">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                    <Image 
                        src="/really-american-logo.png" 
                        alt="Really American" 
                        width={40} 
                        height={40} 
                        className="rounded-full"
                    />
                    <h1 className="text-xl font-bold tracking-wide text-white">
                        REALLY <span className="text-brand-yellow">AMERICAN</span> <span className="text-neutral-400 text-sm font-normal ml-2 hidden sm:inline-block">THUMBNAIL GENERATOR</span>
                    </h1>
                </Link>
                <div className="flex items-center gap-4">
                    <Link 
                        href="/about" 
                        className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors text-sm font-medium"
                    >
                        <Info size={16} />
                        <span className="hidden sm:inline">About</span>
                    </Link>
                    <div className="text-xs text-neutral-500 font-mono">v0.1.0</div>
                </div>
            </div>
        </header>
    );
}
