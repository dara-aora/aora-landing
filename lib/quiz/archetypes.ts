import type { ArchetypeKey } from "./scoring";

/**
 * Archetype copy, transcribed from aora-website-build-spec.md §7.
 *
 * The per-archetype preorder CTA in the spec is superseded by a uniform
 * two-CTA end block on the result page (Stripe preorder + Chrome extension),
 * so no `cta` field is stored here.
 */

export type ArchetypeCopy = {
  key: ArchetypeKey;
  name: string; // big display name, e.g. "Baseline Clear"
  nameUpper: string; // e.g. "BASELINE CLEAR"
  description: string;
  whatThisMeans: string[]; // 3 bullets
  whatAoraTracks: string[]; // 3 bullets
  toneNote?: string; // private styling hint, unused in UI
};

export const ARCHETYPES: Record<ArchetypeKey, ArchetypeCopy> = {
  BASELINE_CLEAR: {
    key: "BASELINE_CLEAR",
    name: "Baseline Clear",
    nameUpper: "BASELINE CLEAR",
    description:
      "You're in the top 15% of people who take this assessment. Your exhaustion, stress, and cognitive clarity scores are all low. The question isn't whether you need help — it's whether you want to stay here, or push the ceiling.",
    whatThisMeans: [
      "Your recovery signals are strong. Most people in this zone have a sleep protocol they stick to.",
      "You're operating at a sustainable load — but “sustainable” isn't the same as “optimal.”",
      "The biggest risk at Baseline Clear is complacency. Performance decays silently.",
    ],
    whatAoraTracks: [
      "Peak cognitive hours — when your brain is sharpest, train around them.",
      "Early deviation detection — catch drift weeks before you'd feel it.",
      "Brain Age trend — the long-game metric.",
    ],
  },

  AMBIENT_LOAD: {
    key: "AMBIENT_LOAD",
    name: "Ambient Load",
    nameUpper: "AMBIENT LOAD",
    description:
      "You're carrying invisible friction. It doesn't feel like burnout — it feels like baseline. That's the problem. Your system is compensating, and the cost shows up in focus, mood, and recovery long before it shows up on any blood test.",
    whatThisMeans: [
      "Your exhaustion scores are elevated but not alarming — which is when most high-performers ignore them.",
      "Your stress response is slightly over-activated, likely chronically.",
      "Cognitive clarity is holding, but it's being propped up by willpower and caffeine.",
    ],
    whatAoraTracks: [
      "Daily Cognitive Load — see where the friction actually lives.",
      "Recovery between deep-work sessions.",
      "HRV correlation with self-reported state.",
    ],
  },

  OVERCLOCKED: {
    key: "OVERCLOCKED",
    name: "Overclocked",
    nameUpper: "OVERCLOCKED",
    description:
      "Your brain is running too hot, too long. This is where most founders, operators, and serious athletes live — and it's where they fail. You're still producing, but the quality is dropping and you know it. Most people in this zone are 6–12 months from a forced recalibration.",
    whatThisMeans: [
      "Your exhaustion scores are clinically elevated.",
      "Your stress load is sustained, not episodic — the pattern that predicts burnout.",
      "Your cognitive clarity score tells you what you already know: focus is harder than it used to be.",
    ],
    whatAoraTracks: [
      "Real-time Cognitive Load alerts — before you notice the drop.",
      "Burnout Risk trajectory — a 90-day forward projection.",
      "Daily protocol adjustments based on your recovery.",
    ],
  },

  BURNOUT_TERRITORY: {
    key: "BURNOUT_TERRITORY",
    name: "Burnout Territory",
    nameUpper: "BURNOUT TERRITORY",
    description:
      "You don't need another productivity app. You need data, and a way out. Scores in this range correlate with the clinical definition of burnout on the Copenhagen Burnout Inventory. This isn't a personality flaw — it's a measurable state, and the first step out is measuring where you actually are.",
    whatThisMeans: [
      "Your exhaustion scores meet or exceed the clinical threshold for personal burnout.",
      "Your stress load has almost certainly been elevated for months, not weeks.",
      "Cognitive clarity is compromised in ways that compound — which is why things feel harder than they should.",
    ],
    whatAoraTracks: [
      "A personalized de-load protocol, built from your first 14 days of data.",
      "Recovery trajectory — the number that matters most right now.",
      "Sleep architecture analysis — often the fastest lever.",
    ],
    toneNote:
      "Softer tone. No hype. Treat the reader like a friend who just got a bad lab result.",
  },
};
