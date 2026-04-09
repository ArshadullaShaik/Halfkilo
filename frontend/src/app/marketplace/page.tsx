"use client";

import { useState } from "react";
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther, formatEther } from "viem";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { CONTRACTS } from "@/config/contracts";
import { MarketplaceABI, ItemNFTABI } from "@/config/abis";

export default function MarketplacePage() {
    const { isConnected } = useAccount();
    const [listTokenId, setListTokenId] = useState("");
    const [listPrice, setListPrice] = useState("");
    const [buyListingId, setBuyListingId] = useState("");
    const [approveTokenId, setApproveTokenId] = useState("");

    const { data: listTxHash, writeContract: doList, isPending: isListPending } = useWriteContract();
    const { data: buyTxHash, writeContract: doBuy, isPending: isBuyPending } = useWriteContract();
    const { data: approveTxHash, writeContract: doApprove, isPending: isApprovePending } = useWriteContract();

    const { isLoading: isListConfirming, isSuccess: isListSuccess } = useWaitForTransactionReceipt({ hash: listTxHash });
    const { isLoading: isBuyConfirming, isSuccess: isBuySuccess } = useWaitForTransactionReceipt({ hash: buyTxHash });
    const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({ hash: approveTxHash });

    const { data: listingData } = useReadContract({
        address: CONTRACTS.marketplace, abi: MarketplaceABI, functionName: "listings",
        args: [BigInt(buyListingId || "0")], query: { enabled: !!buyListingId && !!CONTRACTS.marketplace },
    });

    const handleApprove = () => {
        if (!approveTokenId) return;
        doApprove({ address: CONTRACTS.itemNFT, abi: ItemNFTABI, functionName: "approve", args: [CONTRACTS.marketplace, BigInt(approveTokenId)] });
    };

    const handleList = () => {
        if (!listTokenId || !listPrice) return;
        doList({ address: CONTRACTS.marketplace, abi: MarketplaceABI, functionName: "listItem", args: [CONTRACTS.itemNFT, BigInt(listTokenId), parseEther(listPrice)] });
    };

    const handleBuy = () => {
        if (!buyListingId || !listingData) return;
        doBuy({ address: CONTRACTS.marketplace, abi: MarketplaceABI, functionName: "buyItem", args: [BigInt(buyListingId)], value: listingData[3] });
    };

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
            <h1 style={{ fontSize: 14, color: "var(--accent)", marginBottom: 6 }}>MARKETPLACE</h1>
            <p style={{ color: "var(--text-dim)", marginBottom: 20, fontSize: 16 }}>
                &gt; List and trade loot for AVAX
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Sell Side */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {/* Approve */}
                    <div className="pixel-panel">
                        <h2 style={{ fontSize: 9, color: "var(--accent-warm)", marginBottom: 12 }}>
                            🔓 STEP 1: APPROVE
                        </h2>
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            <div>
                                <label style={{ fontFamily: "'Press Start 2P', cursive", fontSize: 7, color: "var(--text-dim)", display: "block", marginBottom: 6 }}>
                                    ITEM TOKEN ID
                                </label>
                                <input className="pixel-input" type="number" min="1" placeholder="ID" value={approveTokenId} onChange={(e) => setApproveTokenId(e.target.value)} />
                            </div>
                            <button className="pixel-btn" onClick={handleApprove} disabled={isApprovePending || isApproveConfirming || !approveTokenId} style={{ width: "100%" }}>
                                {isApprovePending ? "CONFIRM..." : isApproveConfirming ? "APPROVING..." : "APPROVE MARKET"}
                            </button>
                            {isApproveSuccess && <div className="tx-success">✓ APPROVED</div>}
                        </div>
                    </div>

                    {/* List */}
                    <div className="pixel-panel">
                        <h2 style={{ fontSize: 9, color: "var(--accent-warm)", marginBottom: 12 }}>
                            📋 STEP 2: LIST
                        </h2>
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            <div>
                                <label style={{ fontFamily: "'Press Start 2P', cursive", fontSize: 7, color: "var(--text-dim)", display: "block", marginBottom: 6 }}>TOKEN ID</label>
                                <input className="pixel-input" type="number" min="1" placeholder="ID" value={listTokenId} onChange={(e) => setListTokenId(e.target.value)} />
                            </div>
                            <div>
                                <label style={{ fontFamily: "'Press Start 2P', cursive", fontSize: 7, color: "var(--text-dim)", display: "block", marginBottom: 6 }}>PRICE (AVAX)</label>
                                <input className="pixel-input" type="text" placeholder="0.1" value={listPrice} onChange={(e) => setListPrice(e.target.value)} />
                            </div>
                            <button className="pixel-btn warm" onClick={handleList} disabled={isListPending || isListConfirming || !listTokenId || !listPrice} style={{ width: "100%" }}>
                                {isListPending ? "CONFIRM..." : isListConfirming ? "LISTING..." : "📋 LIST ITEM"}
                            </button>
                            {isListSuccess && <div className="tx-success">✓ LISTED</div>}
                        </div>
                    </div>
                </div>

                {/* Buy Side */}
                <div className="pixel-panel" style={{ height: "fit-content" }}>
                    <h2 style={{ fontSize: 9, color: "var(--accent-warm)", marginBottom: 12 }}>
                        💰 BUY ITEM
                    </h2>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        <div>
                            <label style={{ fontFamily: "'Press Start 2P', cursive", fontSize: 7, color: "var(--text-dim)", display: "block", marginBottom: 6 }}>LISTING ID</label>
                            <input className="pixel-input" type="number" min="1" placeholder="ID" value={buyListingId} onChange={(e) => setBuyListingId(e.target.value)} />
                        </div>

                        {listingData && listingData[4] && (
                            <div className="pixel-panel-inset" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                <div className="flex justify-between" style={{ fontSize: 14 }}>
                                    <span style={{ color: "var(--text-dim)" }}>SELLER</span>
                                    <span style={{ color: "var(--text-primary)", fontFamily: "monospace", fontSize: 12 }}>
                                        {listingData[0].slice(0, 6)}…{listingData[0].slice(-4)}
                                    </span>
                                </div>
                                <div className="flex justify-between" style={{ fontSize: 14 }}>
                                    <span style={{ color: "var(--text-dim)" }}>TOKEN</span>
                                    <span style={{ color: "var(--text-primary)" }}>#{listingData[2].toString()}</span>
                                </div>
                                <div className="flex justify-between" style={{ fontSize: 14 }}>
                                    <span style={{ color: "var(--text-dim)" }}>PRICE</span>
                                    <span style={{ color: "var(--accent-warm)", fontWeight: "bold" }}>{formatEther(listingData[3])} AVAX</span>
                                </div>
                                <div className="flex justify-between" style={{ fontSize: 14 }}>
                                    <span style={{ color: "var(--text-dim)" }}>STATUS</span>
                                    <span style={{ color: "var(--accent)" }}>● ACTIVE</span>
                                </div>
                            </div>
                        )}

                        {listingData && !listingData[4] && buyListingId && (
                            <div className="tx-error">✗ LISTING INACTIVE</div>
                        )}

                        <button className="pixel-btn" onClick={handleBuy} disabled={isBuyPending || isBuyConfirming || !buyListingId || !listingData?.[4]} style={{ width: "100%" }}>
                            {isBuyPending ? "CONFIRM..." : isBuyConfirming ? "BUYING..." : "💰 BUY NOW"}
                        </button>

                        {isBuySuccess && <div className="tx-success">✓ PURCHASE COMPLETE</div>}
                    </div>
                </div>
            </div>
        </div>
    );
}
