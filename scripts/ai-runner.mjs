#!/usr/bin/env node

/**
 * Agent Arena – Off-chain Mood Runner
 *
 * Reads a JSON action log and emits a mood/personality recommendation.
 *
 * Usage:
 *   node scripts/ai-runner.mjs ./scripts/sample-actions.json
 *
 * Input format:
 *   {
 *     "tokenId": 2,
 *     "currentMood": 0,
 *     "personality": 1,
 *     "actions": [
 *       { "type": "attack", "success": true },
 *       { "type": "defend", "success": false }
 *     ]
 *   }
 */

import { readFileSync } from "fs";
import { resolve } from "path";

const MOODS = ["neutral", "happy", "angry", "sad", "excited"];
const PERSONALITIES = ["calm", "aggressive", "playful", "shy"];

function analyzeMood(data) {
  const { tokenId, currentMood, personality, actions } = data;

  let attackCount = 0;
  let defendCount = 0;
  let successCount = 0;
  let failCount = 0;

  for (const action of actions) {
    if (action.type === "attack") attackCount++;
    if (action.type === "defend") defendCount++;
    if (action.success) successCount++;
    else failCount++;
  }

  const total = actions.length || 1;
  const successRate = successCount / total;
  const aggressionRate = attackCount / total;

  // Mood recommendation logic
  let recommendedMood;
  if (successRate >= 0.7) {
    recommendedMood = aggressionRate > 0.5 ? 4 : 1; // excited or happy
  } else if (successRate <= 0.3) {
    recommendedMood = aggressionRate > 0.5 ? 2 : 3; // angry or sad
  } else {
    recommendedMood = 0; // neutral
  }

  // Personality adjustment suggestion
  let recommendedPersonality = personality;
  if (aggressionRate > 0.7 && personality !== 1) {
    recommendedPersonality = 1; // aggressive
  } else if (aggressionRate < 0.3 && successRate > 0.5) {
    recommendedPersonality = 0; // calm
  } else if (successRate > 0.6 && aggressionRate > 0.3 && aggressionRate < 0.7) {
    recommendedPersonality = 2; // playful
  }

  return {
    tokenId,
    previousMood: MOODS[currentMood] || "unknown",
    recommendedMood: recommendedMood,
    recommendedMoodName: MOODS[recommendedMood],
    previousPersonality: PERSONALITIES[personality] || "unknown",
    recommendedPersonality: recommendedPersonality,
    recommendedPersonalityName: PERSONALITIES[recommendedPersonality],
    analysis: {
      totalActions: actions.length,
      attacks: attackCount,
      defends: defendCount,
      successes: successCount,
      failures: failCount,
      successRate: Math.round(successRate * 100) + "%",
      aggressionRate: Math.round(aggressionRate * 100) + "%",
    },
  };
}

// Main
const filePath = process.argv[2];
if (!filePath) {
  console.error("Usage: node scripts/ai-runner.mjs <action-log.json>");
  process.exit(1);
}

try {
  const raw = readFileSync(resolve(filePath), "utf-8");
  const data = JSON.parse(raw);
  const result = analyzeMood(data);

  console.log("\n🎮 Agent Arena – Mood Runner\n");
  console.log(`Token ID:       ${result.tokenId}`);
  console.log(`Previous Mood:  ${result.previousMood} → Recommended: ${result.recommendedMoodName} (${result.recommendedMood})`);
  console.log(`Personality:    ${result.previousPersonality} → Recommended: ${result.recommendedPersonalityName} (${result.recommendedPersonality})`);
  console.log("\n📊 Analysis:");
  console.log(`  Actions:      ${result.analysis.totalActions}`);
  console.log(`  Attacks:      ${result.analysis.attacks}`);
  console.log(`  Defends:      ${result.analysis.defends}`);
  console.log(`  Success Rate: ${result.analysis.successRate}`);
  console.log(`  Aggression:   ${result.analysis.aggressionRate}`);
  console.log("\n📦 JSON Output:");
  console.log(JSON.stringify(result, null, 2));
} catch (err) {
  console.error("Error:", err.message);
  process.exit(1);
}
