"use client";

import { useState, useEffect, useMemo } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract, useReadContracts } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { CONTRACTS } from "@/config/contracts";
import { AgentNFTABI, GameCoreABI } from "@/config/abis";

const PLAYER_AGENT_ID = BigInt(1);
const AI_AGENT_ID = BigInt(2);
const ONLINE_OPPONENT_AGENT_ID = BigInt(3);
const LOOKBACK_LIMIT = 40;

const CLASS_TO_ATLAS: Record<string, string> = {
    Berserker: "socrates",
    Wizard: "turing",
    Rogue: "ada",
    Paladin: "sophia",
    Ranger: "descartes",
    Necromancer: "plato",
};

export default function BattlePage() {
    const { isConnected, address } = useAccount();
    const [isBattling, setIsBattling] = useState(false);
    const [gameMode, setGameMode] = useState<"ai" | "online">("ai");
    const [selectedAgentId, setSelectedAgentId] = useState<bigint | null>(null);

    const { data: battleTxHash, writeContract: doBattle, isPending: isBattlePending } = useWriteContract();

    const { isLoading: isBattleConfirming, isSuccess: isBattleSuccess } = useWaitForTransactionReceipt({ hash: battleTxHash });

    const { data: totalSupply } = useReadContract({
        address: CONTRACTS.agentNFT,
        abi: AgentNFTABI,
        functionName: "totalSupply",
        query: { enabled: !!CONTRACTS.agentNFT && !!address },
    });

    const candidateAgentIds = useMemo(() => {
        const total = Number(totalSupply ?? BigInt(0));
        if (!Number.isFinite(total) || total <= 0) return [] as bigint[];

        const start = Math.max(1, total - LOOKBACK_LIMIT + 1);
        const ids: bigint[] = [];
        for (let i = total; i >= start; i--) {
            ids.push(BigInt(i));
        }
        return ids;
    }, [totalSupply]);

    const { data: ownerChecks } = useReadContracts({
        contracts: candidateAgentIds.map((id) => ({
            address: CONTRACTS.agentNFT,
            abi: AgentNFTABI,
            functionName: "ownerOf",
            args: [id],
        })),
        query: { enabled: !!address && candidateAgentIds.length > 0 },
    });

    const ownedAgentIds = useMemo(() => {
        if (!address || !ownerChecks?.length) return [] as bigint[];
        const normalized = address.toLowerCase();

        return candidateAgentIds.filter((id, index) => {
            const row = ownerChecks[index] as { status?: string; result?: unknown } | undefined;
            return row?.status === "success" && typeof row.result === "string" && row.result.toLowerCase() === normalized;
        });
    }, [address, candidateAgentIds, ownerChecks]);

    useEffect(() => {
        if (!ownedAgentIds.length) return;
        if (selectedAgentId && ownedAgentIds.some((id) => id === selectedAgentId)) return;
        setSelectedAgentId(ownedAgentIds[0]);
    }, [ownedAgentIds, selectedAgentId]);

    const activeAgentId = selectedAgentId ?? ownedAgentIds[0] ?? PLAYER_AGENT_ID;

    const { data: activeAgentData } = useReadContract({
        address: CONTRACTS.agentNFT,
        abi: AgentNFTABI,
        functionName: "getAgent",
        args: [activeAgentId],
        query: { enabled: !!CONTRACTS.agentNFT && !!activeAgentId },
    });

    const activeAgentName = (activeAgentData?.[0] as string | undefined) || `Agent ${activeAgentId.toString()}`;
    const activeAgentClass = (activeAgentData?.[1] as string | undefined) || "Paladin";
    const activeAgentAtlas = CLASS_TO_ATLAS[activeAgentClass] || "sophia";

    useEffect(() => {
        const handleBattleEnd = () => setIsBattling(false);
        window.addEventListener('BATTLE_ENDED', handleBattleEnd);
        return () => window.removeEventListener('BATTLE_ENDED', handleBattleEnd);
    }, []);

    useEffect(() => {
        if (isBattleSuccess) {
            const opponentName = gameMode === "online" ? "Online Player" : "AI Agent";
            const opponentAtlas = gameMode === "online" ? "aristotle" : "socrates";

            setIsBattling(true);
            window.dispatchEvent(new CustomEvent('START_BATTLE', {
                detail: {
                    agentAName: activeAgentName,
                    petAName: "Your Pet",
                    agentBName: opponentName,
                    petBName: gameMode === "online" ? "Opponent Pet" : "CPU Pet",
                    p1Atlas: activeAgentAtlas,
                    p2Atlas: opponentAtlas,
                    winnerIsA: true,
                    gameMode: gameMode
                }
            }));
        }
    }, [isBattleSuccess, gameMode, activeAgentName, activeAgentAtlas]);

    const handleBattle = () => {
        const enemyAgentId = gameMode === "online" ? ONLINE_OPPONENT_AGENT_ID : AI_AGENT_ID;
        const playerAgentId = activeAgentId;

        doBattle({
            address: CONTRACTS.gameCore,
            abi: GameCoreABI,
            functionName: "battle",
            args: [playerAgentId, enemyAgentId],
        });
    };

    if (!isConnected) {
        return (
            <div className="battle-page-bg battle-page-bg--masked">
                <div className="page-container" style={{ textAlign: "center", paddingTop: 120 }}>
                    <p style={{ fontFamily: "'Press Start 2P', cursive", fontSize: 12, color: "var(--accent-red)", marginBottom: 16 }}>
                        ⚠ WALLET NOT LINKED
                    </p>
                    <ConnectButton />
                </div>
            </div>
        );
    }

    return (
        <div className={`battle-page-bg ${isBattling ? "battle-page-bg--transparent" : "battle-page-bg--masked"}`}>
            <div className="page-container">
                <h1 style={{ fontSize: 14, color: "var(--accent)", marginBottom: 6 }}>BATTLE ARENA</h1>
                <p style={{ color: "var(--text-dim)", marginBottom: 20, fontSize: 16 }}>
                    &gt; {isBattling ? "BATTLE IN PROGRESS... PRESS ESC IN GAME TO EXIT" : "Choose a mode and start fighting"}
                </p>

                {!isBattling && (
                    <div className="grid grid-cols-1 gap-4 max-w-[760px]">
                        {/* Battle Panel */}
                        <div className="pixel-panel">
                            <h2 style={{ fontSize: 10, color: "var(--accent-warm)", marginBottom: 16 }}>
                                ⚔ COMBAT TERMINAL
                            </h2>

                            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                <div>
                                    <label style={{ fontFamily: "'Press Start 2P', cursive", fontSize: 7, color: "var(--text-dim)", display: "block", marginBottom: 6 }}>
                                        YOUR MINTED AGENT
                                    </label>
                                    <select
                                        className="pixel-input"
                                        value={activeAgentId.toString()}
                                        onChange={(e) => setSelectedAgentId(BigInt(e.target.value))}
                                        disabled={ownedAgentIds.length === 0}
                                    >
                                        {ownedAgentIds.length === 0 ? (
                                            <option value={PLAYER_AGENT_ID.toString()}>No owned agents found (fallback #{PLAYER_AGENT_ID.toString()})</option>
                                        ) : (
                                            ownedAgentIds.map((id) => (
                                                <option key={id.toString()} value={id.toString()}>
                                                    #{id.toString()}
                                                </option>
                                            ))
                                        )}
                                    </select>
                                    <p style={{ color: "var(--text-dim)", fontSize: 14, marginTop: 6 }}>
                                        Active: {activeAgentName} ({activeAgentClass})
                                    </p>
                                </div>

                                {/* Battle Visualization */}
                                <div className="pixel-panel-inset" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 24, padding: 20 }}>
                                    <div style={{ textAlign: "center" }}>
                                        <div className="inv-slot filled" style={{ width: 56, height: 56, margin: "0 auto 6px" }}>
                                            <span style={{ fontSize: 28 }}>🤖</span>
                                        </div>
                                        <span style={{ fontFamily: "'Press Start 2P', cursive", fontSize: 7, color: "var(--text-dim)" }}>
                                            {activeAgentName.toUpperCase()}
                                        </span>
                                    </div>

                                    <span style={{ fontSize: 28, color: "var(--accent)", animation: "led-blink 1s ease infinite" }}>⚡</span>

                                    <div style={{ textAlign: "center" }}>
                                        <div className="inv-slot filled" style={{ width: 56, height: 56, margin: "0 auto 6px" }}>
                                            <span style={{ fontSize: 28 }}>🤖</span>
                                        </div>
                                        <span style={{ fontFamily: "'Press Start 2P', cursive", fontSize: 7, color: "var(--text-dim)" }}>
                                            {gameMode === "online" ? "ONLINE PLAYER" : "AI AGENT"}
                                        </span>
                                    </div>
                                </div>

                                <div style={{ marginTop: 12 }}>
                                    <label style={{ fontFamily: "'Press Start 2P', cursive", fontSize: 7, color: "var(--text-dim)", display: "block", marginBottom: 6 }}>
                                        GAME MODE
                                    </label>
                                    <div className="grid grid-cols-2 gap-2 mb-4">
                                        <button className={`pixel-btn ${gameMode === 'ai' ? 'selected' : ''}`} style={{ fontSize: 8, padding: 8 }} onClick={() => setGameMode('ai')}>
                                            ⚔ FIGHT VS AI AGENT
                                        </button>
                                        <button className={`pixel-btn ${gameMode === 'online' ? 'selected' : ''}`} style={{ fontSize: 8, padding: 8, borderColor: gameMode === 'online' ? 'var(--accent)' : 'inherit' }} onClick={() => setGameMode('online')}>
                                            🌐 FIGHT ONLINE PLAYER
                                        </button>
                                    </div>
                                </div>

                                <button
                                    className="pixel-btn"
                                    onClick={handleBattle}
                                    disabled={isBattlePending || isBattleConfirming}
                                    style={{ width: "100%", border: gameMode === 'online' ? '2px solid var(--accent)' : undefined }}
                                >
                                    {isBattlePending ? "CONFIRM..." : isBattleConfirming ? "⚔ FIGHTING..." : gameMode === "online" ? "⚔ START ONLINE MATCH" : "⚔ START AI MATCH"}
                                </button>

                                {isBattleSuccess && (
                                    <div className="tx-success">
                                        ✓ BATTLE RESOLVED | CHECK LOOT IN INVENTORY
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
