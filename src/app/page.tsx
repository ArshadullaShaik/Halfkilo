"use client";

import Link from "next/link";
import { useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useReadContract } from "wagmi";
import { CONTRACTS } from "@/config/contracts";
import { AgentNFTABI, PetNFTABI } from "@/config/abis";

type CharacterPreset = {
  id: string;
  name: string;
  role: string;
  motto: string;
  atlas: string;
  power: number;
  tactics: number;
  mobility: number;
};

type LoadoutPreset = {
  id: string;
  name: string;
  detail: string;
  statLabel: string;
  statValue: string;
  accentClass?: string;
};

type ToggleOption = {
  id: string;
  label: string;
  detail: string;
};

const characterPresets: CharacterPreset[] = [
  {
    id: "plato",
    name: "Plato",
    role: "Strategist",
    motto: "Hold the center, win the fight.",
    atlas: "/assets/characters/plato/atlas.png",
    power: 92,
    tactics: 98,
    mobility: 58,
  },
  {
    id: "turing",
    name: "Turing",
    role: "Tech Duelist",
    motto: "Reads the room before the strike.",
    atlas: "/assets/characters/turing/atlas.png",
    power: 84,
    tactics: 91,
    mobility: 74,
  },
  {
    id: "ada",
    name: "Ada",
    role: "Field Engineer",
    motto: "Build fast. Adapt faster.",
    atlas: "/assets/characters/ada/atlas.png",
    power: 78,
    tactics: 86,
    mobility: 82,
  },
  {
    id: "socrates",
    name: "Socrates",
    role: "Frontline Mentor",
    motto: "Counter, answer, advance.",
    atlas: "/assets/characters/socrates/atlas.png",
    power: 90,
    tactics: 81,
    mobility: 63,
  },
  {
    id: "descartes",
    name: "Descartes",
    role: "Precision Sniper",
    motto: "Calm aim, clear outcome.",
    atlas: "/assets/characters/descartes/atlas.png",
    power: 88,
    tactics: 77,
    mobility: 69,
  },
  {
    id: "leibniz",
    name: "Leibniz",
    role: "Support Analyst",
    motto: "Stacks advantages before the rush.",
    atlas: "/assets/characters/leibniz/atlas.png",
    power: 73,
    tactics: 95,
    mobility: 66,
  },
];

const gunPresets: LoadoutPreset[] = [
  {
    id: "pulse-rifle",
    name: "Pulse Rifle",
    detail: "Balanced beam for steady pressure and safe mid-range control.",
    statLabel: "Damage",
    statValue: "82",
    accentClass: "rarity-rare",
  },
  {
    id: "ion-shotgun",
    name: "Ion Shotgun",
    detail: "Close-range burst for aggressive lane breaks and fast finishes.",
    statLabel: "Burst",
    statValue: "96",
    accentClass: "rarity-legendary",
  },
  {
    id: "rail-pistol",
    name: "Rail Pistol",
    detail: "Fast swap sidearm with a clean crit window for sharp timing.",
    statLabel: "Speed",
    statValue: "88",
    accentClass: "rarity-uncommon",
  },
  {
    id: "arc-launcher",
    name: "Arc Launcher",
    detail: "Arc-shot utility for crowd pressure and tactical disruption.",
    statLabel: "Control",
    statValue: "91",
    accentClass: "rarity-epic",
  },
];

const outfitPresets: LoadoutPreset[] = [
  {
    id: "urban-void",
    name: "Urban Void",
    detail: "Lightweight suit with a clean silhouette and stealth-minded trim.",
    statLabel: "Armor",
    statValue: "67",
    accentClass: "rarity-common",
  },
  {
    id: "gold-breach",
    name: "Gold Breach",
    detail: "Command coat with reinforced shoulders and bold arena presence.",
    statLabel: "Armor",
    statValue: "88",
    accentClass: "rarity-legendary",
  },
  {
    id: "field-operant",
    name: "Field Operant",
    detail: "Practical kit that keeps movement light while staying battle ready.",
    statLabel: "Agility",
    statValue: "93",
    accentClass: "rarity-rare",
  },
  {
    id: "spectrum-core",
    name: "Spectrum Core",
    detail: "High-tech armor with animated trim for a strong identity read.",
    statLabel: "Style",
    statValue: "97",
    accentClass: "rarity-epic",
  },
];

const toggleOptions: ToggleOption[] = [
  {
    id: "pet-assist",
    label: "Pet assist",
    detail: "Keep your companion visible in combat previews.",
  },
  {
    id: "quick-swap",
    label: "Quick swap",
    detail: "Switch weapons with reduced animation delay.",
  },
  {
    id: "helmet-on",
    label: "Helmet on",
    detail: "Show the full combat helm during the loadout screen.",
  },
  {
    id: "loot-focus",
    label: "Loot focus",
    detail: "Prioritize item drops and inventory alerts after battle.",
  },
];

const navLinks = [
  { label: "BATTLE", href: "/battle" },
  { label: "REGISTER", href: "/register" },
  { label: "INVENTORY", href: "/inventory" },
  { label: "MARKET", href: "/marketplace" },
];

export default function HomePage() {
  const { isConnected, address } = useAccount();
  const [selectedCharacter, setSelectedCharacter] = useState(characterPresets[0].id);
  const [selectedGun, setSelectedGun] = useState(gunPresets[0].id);
  const [selectedOutfit, setSelectedOutfit] = useState(outfitPresets[0].id);
  const [activeOptions, setActiveOptions] = useState<string[]>(["pet-assist", "quick-swap"]);

  const { data: agentCount } = useReadContract({
    address: CONTRACTS.agentNFT,
    abi: AgentNFTABI,
    functionName: "totalSupply",
    query: { enabled: !!CONTRACTS.agentNFT },
  });

  const { data: petCount } = useReadContract({
    address: CONTRACTS.petNFT,
    abi: PetNFTABI,
    functionName: "totalSupply",
    query: { enabled: !!CONTRACTS.petNFT },
  });

  const currentCharacter =
    characterPresets.find((character) => character.id === selectedCharacter) ?? characterPresets[0];
  const currentGun = gunPresets.find((gun) => gun.id === selectedGun) ?? gunPresets[0];
  const currentOutfit =
    outfitPresets.find((outfit) => outfit.id === selectedOutfit) ?? outfitPresets[0];

  const toggleOption = (optionId: string) => {
    setActiveOptions((current) =>
      current.includes(optionId) ? current.filter((entry) => entry !== optionId) : [...current, optionId],
    );
  };

  return (
    <div className="lobby-screen">
      <div className="lobby-shell">
        <header className="lobby-topbar pixel-panel">
          <div className="lobby-brand">
            <div className="lobby-brand__icon">
              <img src="/assets/logo.png" alt="Agent Arena" />
            </div>
            <div>
              <p className="lobby-brand__eyebrow">BASE COMMAND</p>
              <h1>Agent Arena</h1>
            </div>
          </div>

          <div className="lobby-topbar__stats">
            <span className={`status-chip ${isConnected ? "status-chip--online" : "status-chip--offline"}`}>
              {isConnected ? "ONLINE" : "OFFLINE"}
            </span>
            <span className="status-chip status-chip--gold">AGENTS: {agentCount?.toString() || "0"}</span>
            <span className="status-chip status-chip--teal">PETS: {petCount?.toString() || "0"}</span>
            <span className="status-chip status-chip--dim">
              {address ? `${address.slice(0, 6)}…${address.slice(-4)}` : "WALLET STANDBY"}
            </span>
          </div>

          <div className="lobby-topbar__wallet">
            <ConnectButton showBalance={false} chainStatus="none" accountStatus="avatar" />
          </div>
        </header>

        <main className="lobby-grid">
          <aside className="lobby-nav pixel-panel">
            <div className="lobby-nav__hero">
              <p className="lobby-nav__eyebrow">TACTICAL MENU</p>
              <h2>Navigate the base</h2>
              <p>
                Build your loadout, manage inventory, and enter the arena from one control room.
              </p>
            </div>

            <div className="lobby-nav__links">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href} className="lobby-nav__link">
                  <span>{link.label}</span>
                  <strong>ENTER</strong>
                </Link>
              ))}
            </div>

            <div className="lobby-nav__panel pixel-panel-inset">
              <span className="section-label">SYSTEM</span>
              <p>Deploy from the battle lobby. Character selection, weapons, outfits, and battle options are all staged here.</p>
            </div>
          </aside>

          <section className="lobby-stage pixel-panel">
            <div className="lobby-stage__top">
              <div>
                <p className="section-label">SELECTED CHARACTER</p>
                <h2>{currentCharacter.name}</h2>
              </div>
              <span className={`rarity-badge ${currentCharacter.power >= 90 ? "rarity-legendary" : "rarity-rare"}`}>
                {currentCharacter.role}
              </span>
            </div>

            <div className="lobby-stage__arena">
              <div className="lobby-stage__portrait">
                <img src={currentCharacter.atlas} alt={currentCharacter.name} className="lobby-stage__art" />
              </div>

              <div className="lobby-stage__metrics">
                <div className="lobby-stat">
                  <span>POWER</span>
                  <strong>{currentCharacter.power}</strong>
                </div>
                <div className="lobby-stat">
                  <span>TACTICS</span>
                  <strong>{currentCharacter.tactics}</strong>
                </div>
                <div className="lobby-stat">
                  <span>MOBILITY</span>
                  <strong>{currentCharacter.mobility}</strong>
                </div>
              </div>

              <div className="lobby-stage__quote pixel-panel-inset">
                <p>{currentCharacter.motto}</p>
              </div>
            </div>

            <div className="lobby-roster">
              {characterPresets.map((character) => {
                const isActive = selectedCharacter === character.id;

                return (
                  <button
                    key={character.id}
                    type="button"
                    className={`lobby-card ${isActive ? "active" : ""}`}
                    onClick={() => setSelectedCharacter(character.id)}
                    aria-pressed={isActive}
                  >
                    <img src={character.atlas} alt={character.name} className="lobby-card__art" />
                    <div className="lobby-card__copy">
                      <span>{character.role}</span>
                      <strong>{character.name}</strong>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <aside className="lobby-loadout">
            <article className="pixel-panel lobby-module">
              <div className="section-header">
                <div>
                  <p className="section-label">WEAPON</p>
                  <h2>{currentGun.name}</h2>
                </div>
                <span className={`rarity-badge ${currentGun.accentClass || "rarity-common"}`}>{currentGun.statLabel}</span>
              </div>

              <div className="lobby-weapon">
                <div className="lobby-weapon__track">
                  {gunPresets.map((gun) => {
                    const isActive = selectedGun === gun.id;
                    return (
                      <button
                        key={gun.id}
                        type="button"
                        className={`lobby-track-card ${isActive ? "active" : ""}`}
                        onClick={() => setSelectedGun(gun.id)}
                        aria-pressed={isActive}
                      >
                        <span>{gun.statLabel}</span>
                        <strong>{gun.name}</strong>
                        <p>{gun.statValue}</p>
                      </button>
                    );
                  })}
                </div>
                <div className="lobby-weapon__detail pixel-panel-inset">
                  <p>{currentGun.detail}</p>
                  <div className="lobby-weapon__meta">
                    <span>{currentGun.statLabel}</span>
                    <strong>{currentGun.statValue}</strong>
                  </div>
                </div>
              </div>
            </article>

            <article className="pixel-panel lobby-module">
              <div className="section-header">
                <div>
                  <p className="section-label">OUTFITS</p>
                  <h2>{currentOutfit.name}</h2>
                </div>
                <span className={`rarity-badge ${currentOutfit.accentClass || "rarity-common"}`}>{currentOutfit.statLabel}</span>
              </div>

              <div className="lobby-outfit-grid">
                {outfitPresets.map((outfit) => {
                  const isActive = selectedOutfit === outfit.id;
                  return (
                    <button
                      key={outfit.id}
                      type="button"
                      className={`lobby-outfit-card ${isActive ? "active" : ""}`}
                      onClick={() => setSelectedOutfit(outfit.id)}
                      aria-pressed={isActive}
                    >
                      <strong>{outfit.name}</strong>
                      <span>{outfit.statLabel}</span>
                      <p>{outfit.statValue}</p>
                    </button>
                  );
                })}
              </div>

              <div className="pixel-panel-inset lobby-note">
                <p>{currentOutfit.detail}</p>
              </div>
            </article>

            <article className="pixel-panel lobby-module">
              <div className="section-header">
                <div>
                  <p className="section-label">OPTIONS</p>
                  <h2>Battle preferences</h2>
                </div>
                <span className="section-help">Toggle your preferred run behavior.</span>
              </div>

              <div className="lobby-options">
                {toggleOptions.map((option) => {
                  const isActive = activeOptions.includes(option.id);
                  return (
                    <button
                      key={option.id}
                      type="button"
                      className={`lobby-option ${isActive ? "active" : ""}`}
                      onClick={() => toggleOption(option.id)}
                      aria-pressed={isActive}
                    >
                      <strong>{option.label}</strong>
                      <span>{option.detail}</span>
                    </button>
                  );
                })}
              </div>
            </article>
          </aside>
        </main>

        <footer className="lobby-footer pixel-panel">
          <div>
            <p className="section-label">READY STATE</p>
            <h2>Loadout locked. Deploy when you are ready.</h2>
            <p>
              Select a fighter, choose your weapon and outfit, then launch the arena.
            </p>
          </div>

          <div className="lobby-footer__actions">
            <Link href="/battle" className="pixel-btn warm lobby-start-btn">
              START BATTLE
            </Link>
            <Link href="/register" className="pixel-btn">
              REGISTER
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
