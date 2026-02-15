import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { useState } from "react";
import { ContactTerminal } from "./components/contact-terminal";
import { GameLauncher } from "./components/games";
import { InfiniteCanvas } from "./components/infinite-canvas";
import { SystemOverlay } from "./components/overlay";
import { SEO } from "./components/seo";
import manifest from "./data/manifest.json";
import type { MediaItem } from "./lib/types";

// Type the manifest data
const media: MediaItem[] = manifest;

export default function App() {
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isGamesOpen, setIsGamesOpen] = useState(false);

  return (
    <>
      {/* SEO - Managed via react-helmet-async */}
      <SEO />

      <main className="relative h-screen w-screen overflow-hidden bg-white">
        {/* Infinite canvas - the void */}
        <InfiniteCanvas
          backgroundColor="#ffffff"
          fogColor="#ffffff"
          fogFar={280}
          fogNear={100}
          media={media}
        />

        {/* System overlay - minimal, institutional */}
        <SystemOverlay
          clearance="ENGINEER"
          designation="PRODUCT"
          onContactClick={() => setIsContactOpen(true)}
          onGamesClick={() => setIsGamesOpen(true)}
          operatorId="yyyyaaa"
          showScanLines={true}
          status="nominal"
        />

        {/* Contact terminal modal */}
        <ContactTerminal
          isOpen={isContactOpen}
          onClose={() => setIsContactOpen(false)}
        />

        {/* Game launcher modal */}
        <GameLauncher
          isOpen={isGamesOpen}
          onClose={() => setIsGamesOpen(false)}
        />
      </main>
      <Analytics />
      <SpeedInsights />
    </>
  );
}
