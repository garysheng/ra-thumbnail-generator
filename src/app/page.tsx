import Image from "next/image";
import { Header } from "@/components/Header";
import { ThumbnailGenerator } from "@/components/ThumbnailGenerator";

export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-900 via-neutral-950 to-neutral-950">
      <Header />
      <div className="py-12">
        <ThumbnailGenerator />
      </div>
    </main>
  );
}
