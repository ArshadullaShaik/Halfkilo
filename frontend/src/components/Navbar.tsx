"use client";

import { useAccount, useChainId } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export function CommandDeck() {
    const { isConnected, address } = useAccount();
    const chainId = useChainId();

    return (
        <header
            className="fixed top-0 left-0 right-0 z-50"
            style={{
                background: "var(--bg-panel)",
                borderBottom: "var(--px) solid var(--border-light)",
            }}
        >
            <div className="flex items-center justify-between max-w-[1100px] mx-auto px-4 h-14">
                {/* Logo Sprite */}
                <div className="flex items-center gap-3">
                    <div className="sprite-float" style={{ width: 32, height: 32 }}>
                        <img
                            src="/assets/knight-sprite.png"
                            alt="Agent Arena"
                            style={{ width: 32, height: 32, imageRendering: "pixelated" }}
                        />
                    </div>
                    <span
                        style={{
                            fontFamily: "'Press Start 2P', cursive",
                            fontSize: 11,
                            color: "var(--accent)",
                            textShadow: "0 0 8px var(--accent-glow)",
                        }}
                    >
                        AGENT ARENA
                    </span>
                </div>

                {/* LED Status Modules */}
                <div className="flex items-center gap-2">
                    {isConnected ? (
                        <>
                            {/* Chain LED */}
                            <div className="led-module">
                                <div className="led-dot green" />
                                <span style={{ color: "var(--accent)", fontSize: 13 }}>
                                    CHAIN: {chainId === 43113 ? "FUJI" : chainId}
                                </span>
                            </div>

                            {/* Wallet LED */}
                            <div className="led-module">
                                <div className="led-dot amber" />
                                <span style={{ color: "var(--accent-warm)", fontSize: 13 }}>
                                    {address?.slice(0, 6)}…{address?.slice(-4)}
                                </span>
                            </div>

                            {/* Status LED */}
                            <div className="led-module">
                                <div className="led-dot green" />
                                <span style={{ color: "var(--accent)", fontSize: 13 }}>ONLINE</span>
                            </div>
                        </>
                    ) : (
                        <div className="led-module">
                            <div className="led-dot red" />
                            <span style={{ color: "var(--accent-red)", fontSize: 13 }}>DISCONNECTED</span>
                        </div>
                    )}

                    <ConnectButton
                        showBalance={false}
                        chainStatus="none"
                        accountStatus="avatar"
                    />
                </div>
            </div>
        </header>
    );
}
