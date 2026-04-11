"use client";

import { useState, useEffect } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, usePublicClient, useReadContract } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { CONTRACTS } from "@/config/contracts";
import { AgentNFTABI, GameCoreABI } from "@/config/abis";
import { decodeEventLog } from "viem";

const PLAYER_AGENT_ID = BigInt(1);
const AI_AGENT_ID = BigInt(2);
const ONLINE_OPPONENT_AGENT_ID = BigInt(3);
const SHEET = { width: 832, height: 3456 };
const FRONT_FRAME = { x: 18, y: 143, w: 28, h: 47 };

function buildSpriteStyle(characterId: string) {
    return {
        width: `${FRONT_FRAME.w * 1.15}px`,
        height: `${FRONT_FRAME.h * 1.15}px`,
        backgroundImage: `url(/assets/characters/${characterId}/atlas.png)`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: `-${FRONT_FRAME.x * 1.15}px -${FRONT_FRAME.y * 1.15}px`,
        backgroundSize: `${SHEET.width * 1.15}px ${SHEET.height * 1.15}px`,
        imageRendering: "pixelated" as const,
    };
}

export default function BattlePage() {
    const { isConnected, address } = useAccount();
    const publicClient = usePublicClient();
    const [isBattling, setIsBattling] = useState(false);
    const [gameMode, setGameMode] = useState<"ai" | "online">("ai");
    const [aiAgentIdInput, setAiAgentIdInput] = useState(AI_AGENT_ID.toString());
    const [battleInputError, setBattleInputError] = useState<string | null>(null);
    const [playerAtlas, setPlayerAtlas] = useState("sophia");

    const { data: battleTxHash, writeContract: doBattle, isPending: isBattlePending } = useWriteContract();
    const { data: characterOfData } = useReadContract({
        address: CONTRACTS.gameCore,
        abi: GameCoreABI,
        functionName: "characterOf",
        args: address ? [address] : undefined,
        query: { enabled: !!address && !!CONTRACTS.gameCore },
    });

    const { isLoading: isBattleConfirming, isSuccess: isBattleSuccess } = useWaitForTransactionReceipt({ hash: battleTxHash });
    const activePlayerAgentId = (characterOfData as bigint | undefined) && (characterOfData as bigint | undefined)! > BigInt(0)
        ? (characterOfData as bigint)
        : PLAYER_AGENT_ID;

    useEffect(() => {
        if (!address || typeof window === "undefined") {
            setPlayerAtlas("sophia");
            return;
        }

        const savedAtlas = window.localStorage.getItem(`recruitAtlasByWallet:${address.toLowerCase()}`);
        setPlayerAtlas(savedAtlas || "sophia");
    }, [address]);

    useEffect(() => {
        const handleBattleEnd = () => setIsBattling(false);
        window.addEventListener('BATTLE_ENDED', handleBattleEnd);
        return () => window.removeEventListener('BATTLE_ENDED', handleBattleEnd);
    }, []);

    useEffect(() => {
        let active = true;

        const autoSelectLatestAiAgent = async () => {
            if (!publicClient || !CONTRACTS.agentNFT || !CONTRACTS.gameCore) return;

            try {
                const latestAgentId = await publicClient.readContract({
                    address: CONTRACTS.agentNFT,
                    abi: AgentNFTABI,
                    functionName: "totalSupply",
                });

                let probeId = latestAgentId;
                while (probeId > BigInt(0)) {
                    const isRegistered = await publicClient.readContract({
                        address: CONTRACTS.gameCore,
                        abi: GameCoreABI,
                        functionName: "registered",
                        args: [probeId],
                    });

                    if (isRegistered && probeId !== activePlayerAgentId) {
                        if (!active) return;
                        setAiAgentIdInput(probeId.toString());
                        setBattleInputError(null);
                        return;
                    }

                    probeId -= BigInt(1);
                }

                if (!active) return;
                setBattleInputError("NO DEPLOYED AI AGENT FOUND YET");
            } catch {
                if (!active) return;
                setBattleInputError("FAILED TO AUTO-LOAD LATEST AI AGENT");
            }
        };

        autoSelectLatestAiAgent();
        return () => {
            active = false;
        };
    }, [publicClient, isConnected, activePlayerAgentId]);

    useEffect(() => {
        if (isBattleSuccess) {
            const opponentName = gameMode === "online" ? "Online Player" : "AI Agent";
            setIsBattling(true);
            window.dispatchEvent(new CustomEvent('START_BATTLE', {
                detail: {
                    agentAName: "You",
                    petAName: "Your Pet",
                    agentBName: opponentName,
                    petBName: gameMode === "online" ? "Opponent Pet" : "CPU Pet",
                    p1Atlas: playerAtlas,
                    p2Atlas: gameMode === "online" ? "aristotle" : "aristotle",
                    winnerIsA: true,
                    gameMode: gameMode
                }
            }));
        }
    }, [isBattleSuccess, gameMode, playerAtlas]);

    useEffect(() => {
        if (!isBattleSuccess || !battleTxHash || !publicClient || !address || typeof window === "undefined") return;

        let active = true;

        const persistLastBattleLoot = async () => {
            try {
                const receipt = await publicClient.getTransactionReceipt({ hash: battleTxHash });
                const battleLog = receipt.logs.find((entry) => entry.address.toLowerCase() === CONTRACTS.gameCore.toLowerCase());

                if (!battleLog) return;

                const decoded = decodeEventLog({
                    abi: GameCoreABI,
                    data: battleLog.data,
                    topics: battleLog.topics,
                }) as { eventName: string; args?: { lootId?: bigint } };

                if (decoded.eventName !== "BattleResolved") return;

                const lootId = decoded.args?.lootId;
                if (lootId === undefined) return;
                if (!active) return;

                window.localStorage.setItem(`lastBattleLootId:${address.toLowerCase()}`, lootId.toString());
                window.localStorage.setItem(`lastBattleLootAt:${address.toLowerCase()}`, String(Date.now()));
            } catch {
                // Ignore receipt decoding failures; battle still completed.
            }
        };

        void persistLastBattleLoot();

        return () => {
            active = false;
        };
    }, [isBattleSuccess, battleTxHash, publicClient, address]);

    const handleBattle = () => {
        let enemyAgentId = ONLINE_OPPONENT_AGENT_ID;

        if (gameMode === "ai") {
            const normalized = aiAgentIdInput.trim();
            if (!/^\d+$/.test(normalized) || normalized === "0") {
                setBattleInputError("ENTER A VALID AI AGENT ID (> 0)");
                return;
            }

            const parsedAiId = BigInt(normalized);
            if (parsedAiId === activePlayerAgentId) {
                setBattleInputError("AI AGENT ID MUST BE DIFFERENT FROM YOUR AGENT ID");
                return;
            }

            enemyAgentId = parsedAiId;
        }

        setBattleInputError(null);

        doBattle({
            address: CONTRACTS.gameCore,
            abi: GameCoreABI,
            functionName: "battle",
            args: [activePlayerAgentId, enemyAgentId],
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
                                {/* Battle Visualization */}
                                <div className="pixel-panel-inset" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 24, padding: 20 }}>
                                    <div style={{ textAlign: "center" }}>
                                        <div className="inv-slot filled" style={{ width: 56, height: 56, margin: "0 auto 6px", overflow: "hidden" }}>
                                            <div
                                                role="img"
                                                aria-label="Your recruited agent"
                                                style={{
                                                    ...buildSpriteStyle(playerAtlas),
                                                    maxWidth: "100%",
                                                    maxHeight: "100%",
                                                    transformOrigin: "center center",
                                                }}
                                            />
                                        </div>
                                        <span style={{ fontFamily: "'Press Start 2P', cursive", fontSize: 7, color: "var(--text-dim)" }}>
                                            YOU
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
                                        <button
                                            className={`pixel-btn ${gameMode === 'ai' ? 'selected' : ''}`}
                                            style={{ fontSize: 8, padding: 8 }}
                                            onClick={() => {
                                                setGameMode('ai');
                                                setBattleInputError(null);
                                            }}
                                        >
                                            ⚔ FIGHT VS AI AGENT
                                        </button>
                                        <button
                                            className={`pixel-btn ${gameMode === 'online' ? 'selected' : ''}`}
                                            style={{ fontSize: 8, padding: 8, borderColor: gameMode === 'online' ? 'var(--accent)' : 'inherit' }}
                                            onClick={() => {
                                                setGameMode('online');
                                                setBattleInputError(null);
                                            }}
                                        >
                                            🌐 FIGHT ONLINE PLAYER
                                        </button>
                                    </div>

                                    {gameMode === "ai" && (
                                        <div>
                                            <label style={{ fontFamily: "'Press Start 2P', cursive", fontSize: 7, color: "var(--text-dim)", display: "block", marginBottom: 6 }}>
                                                AI AGENT ID
                                            </label>
                                            <input
                                                className="pixel-input"
                                                type="number"
                                                min="1"
                                                step="1"
                                                value={aiAgentIdInput}
                                                onChange={(e) => {
                                                    setAiAgentIdInput(e.target.value);
                                                    if (battleInputError) setBattleInputError(null);
                                                }}
                                                placeholder="2"
                                            />
                                        </div>
                                    )}
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

                                {battleInputError && (
                                    <div className="tx-error">
                                        {battleInputError}
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
