/**
 * POST /api/npc/chat — NPC conversational AI.
 * Body: { npcId: string, message: string, history?: {role,content}[] }
 * Returns: { reply: string }
 */
import { NextResponse } from "next/server";
import { createNpcAgent, getFallbackChat } from "@/lib/mastra";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { npcId, message, history } = body as {
            npcId: string;
            message: string;
            history?: { role: string; content: string }[];
        };

        if (!npcId || !message) {
            return NextResponse.json({ reply: getFallbackChat(npcId || "socrates") });
        }

        // Build conversation messages
        const messages: { role: "user" | "assistant"; content: string }[] = [];
        if (history) {
            for (const h of history.slice(-6)) {
                messages.push({ role: h.role as "user" | "assistant", content: h.content });
            }
        }
        messages.push({ role: "user", content: message });

        const agent = createNpcAgent(npcId);
        const response = await agent.generate(messages);

        return NextResponse.json({ reply: response.text || getFallbackChat(npcId) });
    } catch (err) {
        console.error("[NPC Chat API] Error:", err);
        const npcId = "socrates";
        return NextResponse.json({ reply: getFallbackChat(npcId) });
    }
}
