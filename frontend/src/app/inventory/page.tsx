"use client";

import { useEffect, useState } from "react";
import { useAccount, useReadContract } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { CONTRACTS } from "@/config/contracts";
import { AgentNFTABI, PetNFTABI, ReputationRegistryABI, ItemNFTABI, TBARegistryABI } from "@/config/abis";

const MOODS = ["😐 NEUTRAL", "😊 HAPPY", "😠 ANGRY", "😢 SAD", "🤩 EXCITED"];
const PERSONALITIES = ["CALM", "AGGRESSIVE", "PLAYFUL", "SHY"];
const RARITIES = ["COMMON", "UNCOMMON", "RARE", "EPIC", "LEGENDARY"];
const RARITY_CLASSES = ["rarity-common", "rarity-uncommon", "rarity-rare", "rarity-epic", "rarity-legendary"];

const SCAN_TIPS = [
    "Use the agent index to inspect your current recruit and linked TBA.",
    "Use the loot index to inspect battle drops and rarity tiers.",
    "Higher rarity loot carries a stronger visual signature on this screen.",
];

export default function InventoryPage() {
    const { isConnected, address } = useAccount();
    const [agentId, setAgentId] = useState("1");
    const [petId, setPetId] = useState("1");
    const [itemId, setItemId] = useState("1");
    const [lastBattleLootId, setLastBattleLootId] = useState<string | null>(null);

    const { data: agentData, isError: agentError, isFetching: agentFetching } = useReadContract({
        address: CONTRACTS.agentNFT, abi: AgentNFTABI, functionName: "getAgent",
        args: [BigInt(agentId || "0")], query: { enabled: !!agentId && !!CONTRACTS.agentNFT },
    });

    const { data: repData } = useReadContract({
        address: CONTRACTS.reputationRegistry, abi: ReputationRegistryABI, functionName: "getReputation",
        args: [BigInt(agentId || "0")], query: { enabled: !!agentId && !!CONTRACTS.reputationRegistry },
    });

    const { data: itemData, isError: itemError, isFetching: itemFetching } = useReadContract({
        address: CONTRACTS.itemNFT, abi: ItemNFTABI, functionName: "getItem",
        args: [BigInt(itemId || "0")], query: { enabled: !!itemId && !!CONTRACTS.itemNFT },
    });

    const itemRarityIndex = itemData ? Number(itemData[2]) : 0;
    const itemRarityLabel = RARITIES[itemRarityIndex] || "UNKNOWN";
    const itemRarityClass = RARITY_CLASSES[itemRarityIndex] || "rarity-common";
    const itemPower = itemData ? itemData[1].toString() : "0";
    const itemName = itemData ? itemData[0].toString() : "UNSCANNED LOOT";

    const { data: tbaAddress } = useReadContract({
        address: CONTRACTS.tbaRegistry, abi: TBARegistryABI, functionName: "getAccount",
        args: [CONTRACTS.agentNFT, BigInt(agentId || "0")], query: { enabled: !!agentId && !!CONTRACTS.tbaRegistry },
    });

    const agentResolved = Boolean(agentData) && !agentError && !agentFetching;

    useEffect(() => {
        if (!address || typeof window === "undefined") return;

        const savedLootId = window.localStorage.getItem(`lastBattleLootId:${address.toLowerCase()}`);
        setLastBattleLootId(savedLootId);
        if (savedLootId) setItemId(savedLootId);
    }, [address]);

    const selectedLootId = lastBattleLootId || itemId;
    const showingLastBattleLoot = Boolean(lastBattleLootId && String(lastBattleLootId) === String(itemId));

    if (!isConnected) {
        return (
            <div className="page-container" style={{ textAlign: "center", paddingTop: 120 }}>
                <p style={{ fontFamily: "'Press Start 2P', cursive", fontSize: 12, color: "var(--accent-red)", marginBottom: 16 }}>
                    ⚠ WALLET NOT LINKED
                </p>
                <ConnectButton />
            </div>
        );
    }

    return (
        <div className="page-container inventory-v2-screen">
            <section className="pixel-panel inventory-v2-shell">
                <header className="inventory-v2-header">
                    <div>
                        <p className="inventory-v2-kicker">HALFKILO STORAGE VAULT</p>
                        <h1 className="inventory-v2-title">LOOT ARCHIVE</h1>
                    </div>
                    <p className="inventory-v2-subtitle">
                        Inspect your active recruit, trace reputation, and surface reward drops with a more cinematic scan deck.
                    </p>
                </header>

                <div className="inventory-v2-stats-grid">
                    <div className="inventory-v2-metric">
                        <span>AGENT SCAN</span>
                        <strong>{agentId}</strong>
                    </div>
                    <div className="inventory-v2-metric">
                        <span>LOOT SCAN</span>
                        <strong>{itemId}</strong>
                    </div>
                    <div className="inventory-v2-metric">
                        <span>STATUS</span>
                        <strong>{agentData ? "ONLINE" : "SYNCING"}</strong>
                    </div>
                </div>

                <div className="inventory-v2-grid">
                    <section className="pixel-panel inventory-v2-card inventory-v2-agent-card">
                        <div className="inventory-v2-card-head">
                            <div>
                                <p className="avatar-label">AGENT</p>
                                <h2>RECRUITED PROFILE</h2>
                            </div>
                            <span className="inventory-v2-chip">LIVE INDEX</span>
                        </div>

                        <input
                            className="pixel-input"
                            type="number"
                            min="1"
                            placeholder="AGENT ID"
                            value={agentId}
                            onChange={(e) => setAgentId(e.target.value)}
                        />

                        {agentFetching ? (
                            <div className="inventory-v2-empty">&gt; Scanning agent record...</div>
                        ) : agentError ? (
                            <div className="inventory-v2-empty inventory-v2-empty--error">&gt; Agent Not Found</div>
                        ) : agentData ? (
                            <div className="inventory-v2-profile">
                                <div className="inventory-v2-profile-top">
                                    <div>
                                        <span className="inventory-v2-label">NAME</span>
                                        <p className="inventory-v2-value">{agentData[0]}</p>
                                    </div>
                                    <div className="inventory-v2-badge-stack">
                                        <span className="rarity-badge rarity-uncommon">LV {agentData[1].toString()}</span>
                                        {repData && <span className="rarity-badge rarity-common">RATING {repData[2].toString()}</span>}
                                    </div>
                                </div>

                                <div className="inventory-v2-profile-grid">
                                    <div className="inventory-v2-stat-tile">
                                        <span>WINS</span>
                                        <strong>{repData ? repData[0].toString() : "0"}</strong>
                                    </div>
                                    <div className="inventory-v2-stat-tile">
                                        <span>LOSSES</span>
                                        <strong>{repData ? repData[1].toString() : "0"}</strong>
                                    </div>
                                    <div className="inventory-v2-stat-tile inventory-v2-stat-tile--wide">
                                        <span>TBA WALLET</span>
                                        <strong>{tbaAddress && tbaAddress !== "0x0000000000000000000000000000000000000000" ? "LINKED" : "UNBOUND"}</strong>
                                    </div>
                                </div>

                                <div className="inventory-v2-addr-box">
                                    <span className="inventory-v2-label">TBA ADDRESS</span>
                                    <p>{tbaAddress && tbaAddress !== "0x0000000000000000000000000000000000000000" ? tbaAddress : "No token-bound wallet detected for this agent."}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="inventory-v2-empty">&gt; Enter an agent ID to begin the scan.</div>
                        )}
                    </section>

                    <section className="pixel-panel inventory-v2-card inventory-v2-loot-card">
                        <div className="inventory-v2-card-head">
                            <div>
                                <p className="avatar-label">LOOT</p>
                                <h2>BATTLE DROP</h2>
                            </div>
                            <span className={`inventory-v2-chip ${itemRarityClass}`}>{itemRarityLabel}</span>
                        </div>

                        {!agentResolved ? (
                            <div className="inventory-v2-empty inventory-v2-empty--error">
                                &gt; Loot archive locked until a valid agent is found.
                            </div>
                        ) : (
                            <>
                                <div className={`inventory-v2-loot-hero ${itemRarityClass} inventory-v2-loot-hero--alive`}>
                                    <div className="inventory-v2-loot-orb inventory-v2-loot-orb--pulse">
                                        <span>✦</span>
                                        <i className="inventory-v2-orb-ring" />
                                        <i className="inventory-v2-orb-ring inventory-v2-orb-ring--alt" />
                                    </div>
                                    <div className="inventory-v2-loot-copy">
                                        <span className="inventory-v2-label">ITEM NAME</span>
                                        <h3>{itemName}</h3>
                                        <p>
                                            {showingLastBattleLoot
                                                ? "Recovered from your latest victory. The vault is showing the exact reward minted by your last battle."
                                                : "Battle-grade artifact recovered from the arena vault. Scan the ID to reveal its power signature and rarity."}
                                        </p>
                                    </div>
                                </div>

                                <input
                                    className="pixel-input"
                                    type="number"
                                    min="1"
                                    placeholder="ITEM ID"
                                    value={selectedLootId}
                                    onChange={(e) => setItemId(e.target.value)}
                                />

                                {itemFetching ? (
                                    <div className="inventory-v2-empty">&gt; Scanning loot archive...</div>
                                ) : itemError ? (
                                    <div className="inventory-v2-empty inventory-v2-empty--error">&gt; Loot Not Found</div>
                                ) : itemData ? (
                                    <div className="inventory-v2-loot-panel-inset pixel-panel-inset">
                                        <div className="inventory-v2-profile-grid inventory-v2-profile-grid--loot">
                                            <div className="inventory-v2-stat-tile inventory-v2-stat-tile--wide">
                                                <span>POWER</span>
                                                <strong className="inventory-v2-power">{itemPower}</strong>
                                            </div>
                                            <div className="inventory-v2-stat-tile">
                                                <span>RARITY</span>
                                                <strong>{itemRarityLabel}</strong>
                                            </div>
                                            <div className="inventory-v2-stat-tile">
                                                <span>SIGNATURE</span>
                                                <strong>ENCRYPTED</strong>
                                            </div>
                                        </div>

                                        <div className="inventory-v2-tip-list">
                                            {SCAN_TIPS.map((tip) => (
                                                <div key={tip} className="inventory-v2-tip-row">
                                                    <span className="inventory-v2-tip-gem">◆</span>
                                                    <p>{tip}</p>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="inventory-v2-rarity-bar">
                                            <span className={`rarity-badge ${itemRarityClass}`}>{itemRarityLabel}</span>
                                            <span className="inventory-v2-loot-note">{showingLastBattleLoot ? "LAST BATTLE DROP" : "DROP POWER"} {itemPower}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="inventory-v2-empty">&gt; Enter an item ID to begin the scan.</div>
                                )}
                            </>
                        )}
                    </section>
                </div>
            </section>
        </div>
    );
}
