const entries = ({ reason, confidence = "high", words }) =>
  words
    .trim()
    .split(/\s+/)
    .map((word) => ({ word, reason, confidence }));

export const englishPolicyFindingsPart3 = [
  ...entries({
    reason: "thirty-seventh-pass-civic-negative-commerce-or-game",
    words:
      "Correction Corrections Discipline Pride Spend Spending Spent Trick Tricks",
  }),
  ...entries({
    reason: "thirty-ninth-pass-negative-civic-promotion-or-proof",
    words: `
        Challenging Forget Forgot Forgotten Innocent Noise Peace Promote
        Promoting Promotion Proof Unity
      `,
  }),
  ...entries({
    reason: "forty-fourth-pass-pest-or-animal-collision",
    words: "Bug Bugs Fly Mice Monkey Mouse Spider",
  }),
  ...entries({
    reason: "forty-eighth-pass-commerce-or-promotional-collision",
    words: "Best Free Hot",
  }),
  ...entries({
    reason: "forty-ninth-pass-violent-action-collision",
    words: "Cutting",
  }),
  ...entries({
    reason: "fiftieth-pass-promotional-collision",
    words: "Lowest",
  }),
  ...entries({
    reason: "core-review-test-blocklist-alignment",
    words: "Amberstone Petunia",
  }),
];
