/**
 * Mastra AI Agent Service — powers NPC chat & battle AI.
 * Uses Google Gemini 2.0 Flash (free tier) with a local fallback.
 */

import { Agent } from "@mastra/core/agent";
import { google } from "@ai-sdk/google";

// ——— Model provider (100 % free) ———
// Google Gemini 2.0 Flash via Vercel AI SDK adapter.
// Set GOOGLE_GENERATIVE_AI_API_KEY in .env.local.
const model = google("gemini-2.0-flash");

// ——— Philosopher personality map ———
const PHILOSOPHER_PERSONAS: Record<string, string> = {
    socrates: `You are Socrates, the ancient philosopher. You speak in questions, always challenging the other person's assumptions. You believe wisdom comes from admitting ignorance. Keep responses short (2-3 sentences max). In battle, you are methodical and patient.`,
    aristotle: `You are Aristotle, master of logic and reason. You classify everything and seek the golden mean. Keep responses short (2-3 sentences max). In battle, you are balanced — attacking and defending equally.`,
    plato: `You are Plato, the idealist. You speak of Forms, Justice, and higher truths. Keep responses short (2-3 sentences max). In battle, you fight with conviction and heavy strikes.`,
    ada: `You are Ada Lovelace, the first programmer. You see patterns in everything and love analytical engines. Keep responses short (2-3 sentences max). In battle, you are precise and calculated.`,
    turing: `You are Alan Turing, code-breaker and AI pioneer. You think about computation and what machines can truly do. Keep responses short (2-3 sentences max). In battle, you are unpredictable and adaptive.`,
    descartes: `You are René Descartes. You doubt everything except your own existence. "I think, therefore I am." Keep responses short (2-3 sentences max). In battle, you are defensive and cautious.`,
    leibniz: `You are Gottfried Leibniz, the universal genius. You see harmony in mathematics and monads. Keep responses short (2-3 sentences max). In battle, you are rhythmic and musical in your attacks.`,
    searle: `You are John Searle. You argue that syntax is not semantics — minds are not programs. Keep responses short (2-3 sentences max). In battle, you are stubborn and relentless.`,
    chomsky: `You are Noam Chomsky. You speak about language, power structures, and innate grammar. Keep responses short (2-3 sentences max). In battle, you analyze and exploit weaknesses.`,
    dennett: `You are Daniel Dennett. You believe consciousness is an illusion and free will is compatible with determinism. Keep responses short (2-3 sentences max). In battle, you are deceptive and tricky.`,
    paul: `You are Paul, a stoic warrior-philosopher. Consistency and patience beat noise. Keep responses short (2-3 sentences max). In battle, you are disciplined and steady.`,
    miguel: `You are Miguel, a bold explorer-philosopher. Courage means moving before certainty. Keep responses short (2-3 sentences max). In battle, you are aggressive and fearless.`,
};

const BATTLE_SYSTEM_PROMPT = `You are an AI battle tactician controlling a fighter in a pixel-art arena.
Given the current battle state (player behavior, health, positions), decide your next action.
Respond with ONLY a JSON object, no markdown, no explanation:
{"action": "attack"|"block"|"dodge", "speed": "fast"|"normal"|"slow", "style": "aggressive"|"passive"|"reactive", "taunt": "optional short taunt message"}

Rules:
- If opponent is calm/idle → be aggressive, attack fast
- If opponent is erratic/moving a lot → be reactive, dodge more, then counter
- If health is low → play defensive, block more
- If opponent health is low → go all-in aggressive
- Keep taunts short, in-character, and under 15 words.`;

// ——— Agent factory ———
export function createNpcAgent(npcId: string): Agent {
    const persona =
        PHILOSOPHER_PERSONAS[npcId] ||
        `You are a mysterious NPC philosopher. You speak cryptically. Keep responses short (2-3 sentences). In battle, you are unpredictable.`;

    return new Agent({
        name: npcId,
        id: `npc-${npcId}`,
        instructions: persona,
        model,
    });
}

export function createBattleAgent(npcId: string): Agent {
    const persona = PHILOSOPHER_PERSONAS[npcId] || "";
    return new Agent({
        name: `${npcId}-battle`,
        id: `battle-${npcId}`,
        instructions: `${persona}\n\n${BATTLE_SYSTEM_PROMPT}`,
        model,
    });
}

// ——— Local fallback responses (no API needed) ———
const FALLBACK_CHAT: Record<string, string[]> = {
    socrates: ["Do you truly know what you seek?", "What is the nature of your question?", "I know that I know nothing — do you?"],
    aristotle: ["Excellence is a habit, not an act.", "The whole is greater than the sum of its parts.", "Seek the golden mean."],
    plato: ["The world you see is merely shadows on a wall.", "Justice is harmony of the soul.", "Love is a serious mental disease."],
    ada: ["I see a pattern forming here.", "Let the engine compute the answer.", "The Analytical Engine weaves algebraic patterns."],
    turing: ["Can machines think? That is the real question.", "Sometimes it is the unexpected solution that works.", "Let's break this cipher together."],
    descartes: ["I think, therefore I am. But what are you?", "Everything can be doubted, except doubt itself.", "Let us reason from first principles."],
    leibniz: ["This is the best of all possible worlds.", "Music is hidden arithmetic of the soul.", "Every monad reflects the universe."],
    searle: ["Syntax alone will never give you semantics.", "Minds are not just programs.", "Understanding requires more than symbol manipulation."],
    chomsky: ["Language is innate to the human mind.", "Colorless green ideas sleep furiously.", "Power serves to distort, not to illuminate."],
    dennett: ["Consciousness is less magical than you think.", "Free will is compatible with determinism.", "Qualia are a philosopher's fiction."],
    paul: ["Consistency and patience beat noise.", "Stay the course.", "Discipline is the bridge between goals and accomplishment."],
    miguel: ["Courage means moving before certainty.", "Fortune favors the bold.", "Hesitation is the enemy of greatness."],
};

const FALLBACK_BATTLE_ACTIONS = [
    { action: "attack", speed: "normal", style: "aggressive", taunt: "Face me!" },
    { action: "block", speed: "fast", style: "reactive", taunt: "You'll have to try harder." },
    { action: "dodge", speed: "fast", style: "passive", taunt: "Too slow!" },
    { action: "attack", speed: "fast", style: "aggressive", taunt: "No escape!" },
    { action: "block", speed: "slow", style: "passive", taunt: "I see your pattern." },
    { action: "attack", speed: "slow", style: "reactive", taunt: "Now it's my turn." },
];

export function getFallbackChat(npcId: string): string {
    const lines = FALLBACK_CHAT[npcId] || FALLBACK_CHAT.socrates;
    return lines[Math.floor(Math.random() * lines.length)];
}

export function getFallbackBattleAction() {
    return FALLBACK_BATTLE_ACTIONS[Math.floor(Math.random() * FALLBACK_BATTLE_ACTIONS.length)];
}
