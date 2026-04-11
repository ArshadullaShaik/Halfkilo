/**
 * POST /api/npc/battle — Battle AI decision engine.
 * Body: { npcId, role, playerBehavior, health, opponentHealth, round }
 * Returns: { action, speed, style, taunt }
 */
import { NextResponse } from "next/server";
import { createBattleAgent, getFallbackBattleAction } from "@/lib/mastra";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            npcId = "socrates",
            role = "opponent",       // "opponent" | "opponentPet" | "playerPet"
            playerBehavior = "calm", // "calm" | "erratic" | "aggressive" | "idle"
            health = 100,
            opponentHealth = 100,
            round = 1,
        } = body as {
            npcId?: string;
            role?: string;
            playerBehavior?: string;
            health?: number;
            opponentHealth?: number;
            round?: number;
        };

        const prompt = `Battle state (round ${round}):
- My role: ${role}
- My health: ${health}%
- Opponent health: ${opponentHealth}%
- Opponent behavior: ${playerBehavior}
What is my next move? Respond with ONLY a JSON object.`;

        const agent = createBattleAgent(npcId);
        const response = await agent.generate([{ role: "user", content: prompt }]);

        // Parse the AI response as JSON
        let decision;
        try {
            const text = response.text.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
            decision = JSON.parse(text);
        } catch {
            decision = getFallbackBattleAction();
        }

        // Validate the decision has required fields
        if (!decision.action || !["attack", "block", "dodge"].includes(decision.action)) {
            decision = getFallbackBattleAction();
        }

        return NextResponse.json(decision);
    } catch (err) {
        console.error("[Battle AI API] Error:", err);
        return NextResponse.json(getFallbackBattleAction());
    }
}
