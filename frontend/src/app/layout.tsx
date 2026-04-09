import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { CommandDeck } from "@/components/Navbar";
import { CommandBar } from "@/components/CommandBar";
import GlobalCanvas from "@/components/GlobalCanvas";

export const metadata: Metadata = {
  title: "Agent Arena – Tactical Command Terminal",
  description: "On-chain auto-battler on Avalanche Fuji. Register agents, battle, collect loot, and trade on the marketplace.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <GlobalCanvas />
          <CommandDeck />
          <main style={{ minHeight: "100vh", position: "relative", zIndex: 10 }}>{children}</main>
          <CommandBar />
        </Providers>
      </body>
    </html>
  );
}
