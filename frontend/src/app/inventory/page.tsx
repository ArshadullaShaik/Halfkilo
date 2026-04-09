"use client";

import { useState } from "react";
import { useAccount, useReadContract } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { CONTRACTS } from "@/config/contracts";
import { AgentNFTABI, PetNFTABI, ReputationRegistryABI, ItemNFTABI, TBARegistryABI } from "@/config/abis";

const MOODS = ["😐 NEUTRAL", "😊 HAPPY", "😠 ANGRY", "😢 SAD", "🤩 EXCITED"];
const PERSONALITIES = ["CALM", "AGGRESSIVE", "PLAYFUL", "SHY"];
const RARITIES = ["COMMON", "UNCOMMON", "RARE", "EPIC", "LEGENDARY"];
const RARITY_CLASSES = ["rarity-common", "rarity-uncommon", "rarity-rare", "rarity-epic", "rarity-legendary"];

export default function InventoryPage() {
    const { isConnected } = useAccount();
    const [agentId, setAgentId] = useState("1");
    const [petId, setPetId] = useState("1");
    const [itemId, setItemId] = useState("1");

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

    const { data: tbaAddress } = useReadContract({
        address: CONTRACTS.tbaRegistry, abi: TBARegistryABI, functionName: "getAccount",
        args: [CONTRACTS.agentNFT, BigInt(agentId || "0")], query: { enabled: !!agentId && !!CONTRACTS.tbaRegistry },
    });

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
        <div className="page-container">
            <h1 style={{ fontSize: 14, color: "var(--accent)", marginBottom: 6 }}>INVENTORY</h1>
            <p style={{ color: "var(--text-dim)", marginBottom: 20, fontSize: 16 }}>
                &gt; Inspect agents and your loot
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
                {/* Agent */}
                <div className="pixel-panel">
                    <h2 style={{ fontSize: 9, color: "var(--accent-warm)", marginBottom: 12 }}>🤖 AGENT</h2>
                    <input className="pixel-input" type="number" min="1" placeholder="AGENT ID" value={agentId} onChange={(e) => setAgentId(e.target.value)} style={{ marginBottom: 12 }} />

                    {agentFetching ? (
                        <p style={{ color: "var(--text-dim)", fontSize: 14 }}>&gt; Scanning...</p>
                    ) : agentError ? (
                        <p style={{ color: "var(--accent-red)", fontSize: 14 }}>&gt; Agent Not Found</p>
                    ) : agentData ? (
                        <div className="pixel-panel-inset" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            <div>
                                <span style={{ fontFamily: "'Press Start 2P', cursive", fontSize: 7, color: "var(--text-dim)" }}>NAME</span>
                                <p style={{ color: "var(--text-bright)", fontWeight: "bold" }}>{agentData[0]}</p>
                            </div>
                            <div>
                                <span style={{ fontFamily: "'Press Start 2P', cursive", fontSize: 7, color: "var(--text-dim)" }}>LEVEL</span>
                                <p style={{ color: "var(--accent-warm)" }}>Level {agentData[1].toString()}</p>
                            </div>
                            {repData && (
                                <>
                                    <div className="flex gap-2">
                                        <span className="rarity-badge rarity-uncommon">W:{repData[0].toString()}</span>
                                        <span className="rarity-badge rarity-common">L:{repData[1].toString()}</span>
                                    </div>
                                    <div>
                                        <span style={{ fontFamily: "'Press Start 2P', cursive", fontSize: 7, color: "var(--text-dim)" }}>RATING</span>
                                        <div className="gauge-value" style={{ fontSize: 20 }}>{repData[2].toString()}</div>
                                    </div>
                                </>
                            )}
                            {tbaAddress && tbaAddress !== "0x0000000000000000000000000000000000000000" && (
                                <div>
                                    <span style={{ fontFamily: "'Press Start 2P', cursive", fontSize: 7, color: "var(--text-dim)" }}>TBA WALLET</span>
                                    <p style={{ fontSize: 11, color: "var(--accent-dim)", fontFamily: "monospace", wordBreak: "break-all" }}>{tbaAddress}</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <p style={{ color: "var(--text-dim)", fontSize: 14 }}>&gt; Enter ID to scan</p>
                    )}
                </div>

                {/* Item */}
                <div className="pixel-panel">
                    <h2 style={{ fontSize: 9, color: "var(--accent-warm)", marginBottom: 12 }}>💎 LOOT</h2>
                    <input className="pixel-input" type="number" min="1" placeholder="ITEM ID" value={itemId} onChange={(e) => setItemId(e.target.value)} style={{ marginBottom: 12 }} />

                    {itemFetching ? (
                        <p style={{ color: "var(--text-dim)", fontSize: 14 }}>&gt; Scanning...</p>
                    ) : itemError ? (
                        <p style={{ color: "var(--accent-red)", fontSize: 14 }}>&gt; Loot Not Found</p>
                    ) : itemData ? (
                        <div className="pixel-panel-inset" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            <div>
                                <span style={{ fontFamily: "'Press Start 2P', cursive", fontSize: 7, color: "var(--text-dim)" }}>NAME</span>
                                <p style={{ color: "var(--text-bright)", fontWeight: "bold" }}>{itemData[0]}</p>
                            </div>
                            <div>
                                <span style={{ fontFamily: "'Press Start 2P', cursive", fontSize: 7, color: "var(--text-dim)" }}>POWER</span>
                                <div className="gauge-value" style={{ fontSize: 20, color: "var(--accent-warm)" }}>{itemData[1].toString()}</div>
                            </div>
                            <div>
                                <span style={{ fontFamily: "'Press Start 2P', cursive", fontSize: 7, color: "var(--text-dim)" }}>RARITY</span>
                                <span className={`rarity-badge ${RARITY_CLASSES[itemData[2]] || "rarity-common"}`}>
                                    {RARITIES[itemData[2]] || "?"}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <p style={{ color: "var(--text-dim)", fontSize: 14 }}>&gt; Enter ID to scan</p>
                    )}
                </div>
            </div>
        </div>
    );
}
