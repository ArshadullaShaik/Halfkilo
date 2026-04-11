"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPublicClient, decodeEventLog, http } from "viem";
import { avalancheFuji } from "viem/chains";
import { useAccount, useChainId, usePublicClient, useReadContract, useWriteContract } from "wagmi";
import { CONTRACTS } from "@/config/contracts";
import { AgentNFTABI, GameCoreABI } from "@/config/abis";

const PLAYER_AGENT_ID = BigInt(1);
const AI_FALLBACK_AGENT_ID = BigInt(2);
const RECEIPT_TIMEOUT_MS = 45_000;
const FUJI_RECEIPT_RPCS = [
  process.env.NEXT_PUBLIC_RPC_URL,
  "https://api.avax-test.network/ext/bc/C/rpc",
  "https://avalanche-fuji-c-chain-rpc.publicnode.com",
].filter((url): url is string => !!url);
const ALLOWED_ATLASES = new Set([
  "sophia",
  "socrates",
  "plato",
  "aristotle",
  "descartes",
  "leibniz",
  "ada",
  "turing",
  "searle",
  "chomsky",
  "dennett",
  "miguel",
  "paul",
]);

type NpcChallengePayload = {
  agentBName: string;
  p2Atlas: string;
};

type ChallengeStatusPayload = {
  phase: "engage" | "wallet" | "submitted" | "mining" | "success" | "error";
  npcName?: string;
  message?: string;
};

export default function HomePage() {
  const { address } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const [pendingNpcChallenge, setPendingNpcChallenge] = useState<NpcChallengePayload | null>(null);
  const [cachedEnemyAgentId, setCachedEnemyAgentId] = useState<bigint | null>(null);

  const { writeContractAsync: doBattleAsync, isPending: isBattlePending } = useWriteContract();
  const { data: characterOfData } = useReadContract({
    address: CONTRACTS.gameCore,
    abi: GameCoreABI,
    functionName: "characterOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!CONTRACTS.gameCore },
  });

  const activePlayerAgentId = useMemo(() => {
    const resolved = characterOfData as bigint | undefined;
    return resolved && resolved > BigInt(0) ? resolved : PLAYER_AGENT_ID;
  }, [characterOfData]);

  const emitChallengeStatus = (payload: ChallengeStatusPayload) => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent("CHALLENGE_STATUS", { detail: payload }));
  };

  const waitForReceiptWithFallback = useCallback(async (hash: `0x${string}`) => {
    try {
      return await publicClient!.waitForTransactionReceipt({
        hash,
        confirmations: 1,
        timeout: RECEIPT_TIMEOUT_MS,
      });
    } catch {
      // Fall through to alternate RPCs when the configured transport is stale.
    }

    for (const rpcUrl of FUJI_RECEIPT_RPCS) {
      try {
        const fallbackClient = createPublicClient({
          chain: avalancheFuji,
          transport: http(rpcUrl),
        });

        return await fallbackClient.waitForTransactionReceipt({
          hash,
          confirmations: 1,
          timeout: RECEIPT_TIMEOUT_MS,
        });
      } catch {
        // Try next fallback endpoint.
      }
    }

    throw new Error("Confirmation lookup timed out. Transaction may be confirmed; refresh to sync state.");
  }, [publicClient]);

  useEffect(() => {
    if (!address || typeof window === "undefined") return;

    const rawAtlas = window.localStorage.getItem(`recruitAtlasByWallet:${address.toLowerCase()}`) || "sophia";
    const savedAtlas = ALLOWED_ATLASES.has(rawAtlas) ? rawAtlas : "sophia";
    window.localStorage.setItem("activeRecruitAtlas", savedAtlas);
  }, [address]);

  useEffect(() => {
    if (!publicClient || !CONTRACTS.agentNFT || !CONTRACTS.gameCore || typeof window === "undefined") return;

    let active = true;

    const warmEnemyAgentCache = async () => {
      try {
        const fromStorage = window.localStorage.getItem("cachedBaseEnemyAgentId");
        if (fromStorage && /^\d+$/.test(fromStorage)) {
          const parsed = BigInt(fromStorage);
          const isRegistered = await publicClient.readContract({
            address: CONTRACTS.gameCore,
            abi: GameCoreABI,
            functionName: "registered",
            args: [parsed],
          });

          if (isRegistered && parsed !== activePlayerAgentId) {
            if (!active) return;
            setCachedEnemyAgentId(parsed);
            return;
          }
        }

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
            setCachedEnemyAgentId(probeId);
            window.localStorage.setItem("cachedBaseEnemyAgentId", probeId.toString());
            return;
          }

          probeId -= BigInt(1);
        }

        if (!active) return;
        setCachedEnemyAgentId(AI_FALLBACK_AGENT_ID);
      } catch {
        if (!active) return;
        setCachedEnemyAgentId(AI_FALLBACK_AGENT_ID);
      }
    };

    void warmEnemyAgentCache();
    return () => {
      active = false;
    };
  }, [publicClient, activePlayerAgentId]);

  useEffect(() => {
    const onChallengeNpc = (evt: Event) => {
      const event = evt as CustomEvent<NpcChallengePayload>;
      const detail = event.detail;
      if (!detail?.agentBName || !detail?.p2Atlas) return;
      setPendingNpcChallenge(detail);
      emitChallengeStatus({ phase: "engage", npcName: detail.agentBName });
    };

    window.addEventListener("CHALLENGE_NPC", onChallengeNpc as EventListener);
    return () => window.removeEventListener("CHALLENGE_NPC", onChallengeNpc as EventListener);
  }, []);

  useEffect(() => {
    if (!pendingNpcChallenge) return;

    const challengeDetail = pendingNpcChallenge;
    const enemyAgentId = cachedEnemyAgentId ?? AI_FALLBACK_AGENT_ID;
    setPendingNpcChallenge(null);

    // --- Always launch the BattleScene immediately ---
    const playerAtlas =
      typeof window !== "undefined"
        ? (window.localStorage.getItem(
          address ? `recruitAtlasByWallet:${address.toLowerCase()}` : "activeRecruitAtlas"
        ) ||
          window.localStorage.getItem("activeRecruitAtlas") ||
          "sophia")
        : "sophia";

    const battleDetail = {
      agentAName: "You",
      petAName: "Your Pet",
      agentBName: challengeDetail.agentBName,
      petBName: `${challengeDetail.agentBName} Pet`,
      p1Atlas: playerAtlas,
      p2Atlas: challengeDetail.p2Atlas,
      winnerIsA: true,
      gameMode: "ai",
    };

    console.log("[Challenge Flow] Launching BattleScene immediately:", battleDetail);
    window.dispatchEvent(new CustomEvent("START_BATTLE_SCENE", { detail: battleDetail }));

    // --- Attempt on-chain tx in the background (requires wallet + correct network) ---
    if (!address) {
      emitChallengeStatus({ phase: "error", message: "Wallet not connected — running in demo mode." });
      return;
    }

    if (chainId !== 43113) {
      emitChallengeStatus({ phase: "error", message: "Switch to Avalanche Fuji (43113) for on-chain battle." });
      return;
    }

    if (!CONTRACTS.gameCore || !publicClient || isBattlePending) {
      // Contracts not configured or tx already in flight — scene is already launched, nothing more to do.
      return;
    }

    emitChallengeStatus({ phase: "wallet", npcName: challengeDetail.agentBName });

    let active = true;

    const executeChallenge = async () => {
      try {
        const hash = await doBattleAsync({
          address: CONTRACTS.gameCore,
          abi: GameCoreABI,
          functionName: "battle",
          account: address,
          chainId: 43113,
          gas: BigInt(700000),
          args: [activePlayerAgentId, enemyAgentId],
        });

        if (!active) return;
        emitChallengeStatus({ phase: "submitted", npcName: challengeDetail.agentBName });
        emitChallengeStatus({ phase: "mining", npcName: challengeDetail.agentBName });

        const receipt = await waitForReceiptWithFallback(hash);
        if (!active) return;

        if (receipt.status !== "success") {
          emitChallengeStatus({ phase: "error", message: "On-chain transaction failed." });
          return;
        }

        emitChallengeStatus({ phase: "success", npcName: challengeDetail.agentBName });

        // Persist loot data from BattleResolved event
        const battleLog = receipt.logs.find(
          (entry) => entry.address.toLowerCase() === CONTRACTS.gameCore.toLowerCase()
        );
        if (battleLog) {
          try {
            const decoded = decodeEventLog({
              abi: GameCoreABI,
              data: battleLog.data,
              topics: battleLog.topics,
            }) as { eventName: string; args?: { winner?: bigint; lootId?: bigint } };

            if (decoded.eventName === "BattleResolved") {
              const lootId = decoded.args?.lootId;
              if (lootId !== undefined) {
                window.localStorage.setItem(`lastBattleLootId:${address.toLowerCase()}`, lootId.toString());
                window.localStorage.setItem(`lastBattleLootAt:${address.toLowerCase()}`, String(Date.now()));
              }
            }
          } catch {
            // Parsing failures are non-critical.
          }
        }
      } catch (err) {
        if (!active) return;
        const msg =
          (err as { shortMessage?: string; message?: string })?.shortMessage ||
          (err as { message?: string })?.message ||
          "On-chain battle call failed.";
        emitChallengeStatus({ phase: "error", message: msg });
      }
    };

    void executeChallenge();

    return () => {
      active = false;
    };
  }, [pendingNpcChallenge, isBattlePending, cachedEnemyAgentId, activePlayerAgentId, doBattleAsync, address, chainId, publicClient, waitForReceiptWithFallback]);

  return null;
}
