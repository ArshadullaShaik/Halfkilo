"use client";

import { useEffect, useRef } from "react";
import AppGame from "../game/main";

export default function GameCanvas() {
    const gameRef = useRef<Phaser.Game | null>(null);

    useEffect(() => {
        let isCancelled = false;

        // We only boot the Phaser game on the client side rendering phase.
        if (typeof window !== 'undefined') {
            const initGame = async () => {
                // We defer importing main.js structure till client mounting
                // since Phaser touches DOM and canvas which breaks SSR.
                const game = await AppGame("game-container");
                if (isCancelled) {
                    game.destroy(true, false);
                } else {
                    gameRef.current = game;
                }
            };

            initGame();
        }

        return () => {
            isCancelled = true;
            // Cleanup phase on component unmount
            if (gameRef.current) {
                gameRef.current.destroy(true, false);
                gameRef.current = null;
            }
        };
    }, []);

    return (
        <div
            id="game-container"
            style={{ width: "100%", height: "100%", minHeight: "100vh", backgroundColor: "#000", display: "flex", justifyContent: "center", alignItems: "center" }}
        />
    );
}
