"use client";

import { useMemo, useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { CONTRACTS } from "@/config/contracts";
import { GameCoreABI } from "@/config/abis";

type CharacterPreset = {
  id: string;
  name: string;
  style: string;
  lore: string;
  defaultClass: string;
};

const CLASSES = ["Berserker", "Wizard", "Rogue", "Paladin", "Ranger", "Necromancer"];
const OUTFITS = ["Arena Prime", "Neo Raider", "Runic Guard", "Street Hunter", "Void Knight"];
const VOICES = ["Calm", "Aggressive", "Mysterious", "Cheerful"];

const CHARACTER_PRESETS: CharacterPreset[] = [
  {
    id: "sophia",
    name: "Sophia",
    style: "Arcane Vanguard",
    lore: "Frontline caster with durable pressure and balanced tempo.",
    defaultClass: "Paladin",
  },
  {
    id: "ada",
    name: "Ada",
    style: "Data Duelist",
    lore: "Fast tactical fighter with precise setup control.",
    defaultClass: "Rogue",
  },
  {
    id: "turing",
    name: "Turing",
    style: "Mind Hacker",
    lore: "Reads enemy patterns and punishes bad spacing.",
    defaultClass: "Wizard",
  },
  {
    id: "socrates",
    name: "Socrates",
    style: "Arena Mentor",
    lore: "Counter-focused bruiser built for close combat reads.",
    defaultClass: "Berserker",
  },
  {
    id: "aristotle",
    name: "Aristotle",
    style: "Order Sentinel",
    lore: "Stable defender with clean engagement windows.",
    defaultClass: "Paladin",
  },
  {
    id: "descartes",
    name: "Descartes",
    style: "Precision Analyst",
    lore: "Spacing specialist with punishing lane control.",
    defaultClass: "Ranger",
  },
  {
    id: "plato",
    name: "Plato",
    style: "Formation Architect",
    lore: "High strategy agent that excels in long exchanges.",
    defaultClass: "Necromancer",
  },
  {
    id: "leibniz",
    name: "Leibniz",
    style: "Support Computor",
    lore: "Builds advantages through buffs and rotations.",
    defaultClass: "Wizard",
  },
];

export default function RegisterPage() {
  const { isConnected, address } = useAccount();

  const [selectedCharacterId, setSelectedCharacterId] = useState(CHARACTER_PRESETS[0].id);
  const [agentName, setAgentName] = useState("");
  const [agentClass, setAgentClass] = useState(CHARACTER_PRESETS[0].defaultClass);
  const [outfit, setOutfit] = useState(OUTFITS[0]);
  const [voice, setVoice] = useState(VOICES[0]);
  const [metadataURI, setMetadataURI] = useState("ipfs://");

  const { data: agentTxHash, writeContract: registerAgent, isPending: isRegPending } = useWriteContract();
  const { isLoading: isAgentConfirming, isSuccess: isAgentSuccess } = useWaitForTransactionReceipt({ hash: agentTxHash });

  const selectedCharacter = useMemo(
    () => CHARACTER_PRESETS.find((entry) => entry.id === selectedCharacterId) ?? CHARACTER_PRESETS[0],
    [selectedCharacterId],
  );

  const handleCharacterSelect = (characterId: string) => {
    const next = CHARACTER_PRESETS.find((entry) => entry.id === characterId);
    setSelectedCharacterId(characterId);
    if (next) {
      setAgentClass(next.defaultClass);
    }
  };

  const handleRegisterAgent = () => {
    if (!address || !agentName.trim()) return;

    registerAgent({
      address: CONTRACTS.gameCore,
      abi: GameCoreABI,
      functionName: "registerAgent",
      args: [address, agentName.trim(), agentClass, metadataURI],
    });
  };

  if (!isConnected) {
    return (
      <div className="page-container" style={{ textAlign: "center", paddingTop: 120 }}>
        <p
          style={{
            fontFamily: "'Press Start 2P', cursive",
            fontSize: 12,
            color: "var(--accent-red)",
            marginBottom: 16,
          }}
        >
          WALLET NOT LINKED
        </p>
        <ConnectButton />
      </div>
    );
  }

  return (
    <div className="page-container">
      <h1 style={{ fontSize: 14, color: "var(--accent)", marginBottom: 6 }}>AVATAR FORGE</h1>
      <p style={{ color: "var(--text-dim)", marginBottom: 20, fontSize: 16 }}>
        &gt; Build your fighter like a character select lobby and mint your agent identity.
      </p>

      <div className="avatar-builder-grid">
        <section className="pixel-panel avatar-roster-panel">
          <h2 className="avatar-heading">CHARACTER SELECT</h2>
          <p className="avatar-subtext">Pick a base fighter and then tune the loadout.</p>

          <div className="avatar-roster-grid">
            {CHARACTER_PRESETS.map((character) => {
              const selected = selectedCharacter.id === character.id;
              return (
                <button
                  key={character.id}
                  type="button"
                  className={`avatar-roster-card ${selected ? "selected" : ""}`}
                  onClick={() => handleCharacterSelect(character.id)}
                  aria-pressed={selected}
                >
                  <img
                    src={`/assets/characters/${character.id}/atlas.png`}
                    alt={character.name}
                    className="avatar-roster-art"
                  />
                  <div className="avatar-roster-copy">
                    <strong>{character.name}</strong>
                    <span>{character.style}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="pixel-panel avatar-preview-panel">
          <div className="avatar-preview-top">
            <div>
              <p className="avatar-label">ACTIVE AVATAR</p>
              <h2 className="avatar-title">{selectedCharacter.name}</h2>
              <p className="avatar-subtext">{selectedCharacter.style}</p>
            </div>
            <span className="rarity-badge rarity-rare">{agentClass}</span>
          </div>

          <div className="avatar-stage pixel-panel-inset">
            <img
              src={`/assets/characters/${selectedCharacter.id}/atlas.png`}
              alt={selectedCharacter.name}
              className="avatar-stage-art"
            />
          </div>

          <p className="avatar-lore">{selectedCharacter.lore}</p>

          <div className="avatar-metrics">
            <div className="game-gauge">
              <div className="gauge-value">{outfit}</div>
              <div className="gauge-label">OUTFIT</div>
            </div>
            <div className="game-gauge">
              <div className="gauge-value">{voice}</div>
              <div className="gauge-label">VOICE</div>
            </div>
          </div>
        </section>

        <section className="pixel-panel avatar-build-panel">
          <h2 className="avatar-heading">BUILD SETTINGS</h2>

          <div className="avatar-form-stack">
            <div>
              <label className="avatar-label">AVATAR NAME</label>
              <input
                className="pixel-input"
                placeholder="Shadow Knight..."
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
              />
            </div>

            <div>
              <label className="avatar-label">CLASS</label>
              <div className="avatar-chip-grid">
                {CLASSES.map((entry) => (
                  <button
                    key={entry}
                    type="button"
                    className={`class-chip ${agentClass === entry ? "selected" : ""}`}
                    onClick={() => setAgentClass(entry)}
                  >
                    {entry}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="avatar-label">OUTFIT</label>
              <div className="avatar-chip-grid compact">
                {OUTFITS.map((entry) => (
                  <button
                    key={entry}
                    type="button"
                    className={`class-chip ${outfit === entry ? "selected" : ""}`}
                    onClick={() => setOutfit(entry)}
                  >
                    {entry}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="avatar-label">VOICE STYLE</label>
              <div className="avatar-chip-grid compact">
                {VOICES.map((entry) => (
                  <button
                    key={entry}
                    type="button"
                    className={`class-chip ${voice === entry ? "selected" : ""}`}
                    onClick={() => setVoice(entry)}
                  >
                    {entry}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="avatar-label">METADATA URI</label>
              <input
                className="pixel-input"
                placeholder="ipfs://..."
                value={metadataURI}
                onChange={(e) => setMetadataURI(e.target.value)}
              />
            </div>

            <button
              className="pixel-btn"
              onClick={handleRegisterAgent}
              disabled={isRegPending || isAgentConfirming || !agentName.trim()}
              style={{ width: "100%", marginTop: 6 }}
            >
              {isRegPending ? "CONFIRM IN WALLET..." : isAgentConfirming ? "MINTING..." : "MINT AVATAR"}
            </button>

            {isAgentSuccess && (
              <div className="tx-success">
                AGENT RECRUITED | TX: {agentTxHash?.slice(0, 16)}...
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
