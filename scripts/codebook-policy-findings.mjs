import { englishPolicyFindingsPart1 } from "./data/codebook-policy-findings-english-1.mjs";
import { englishPolicyFindingsPart2 } from "./data/codebook-policy-findings-english-2.mjs";
import { englishPolicyFindingsPart3 } from "./data/codebook-policy-findings-english-3.mjs";
import { koreanPolicyFindingsPart1 } from "./data/codebook-policy-findings-korean-1.mjs";
import { koreanPolicyFindingsPart2 } from "./data/codebook-policy-findings-korean-2.mjs";
import { chinesePolicyFindingsPart1 } from "./data/codebook-policy-findings-chinese-1.mjs";
import { chinesePolicyFindingsPart2 } from "./data/codebook-policy-findings-chinese-2.mjs";
import { japanesePolicyFindingsPart1 } from "./data/codebook-policy-findings-japanese-1.mjs";
import { japanesePolicyFindingsPart2 } from "./data/codebook-policy-findings-japanese-2.mjs";

export const AGENT_REVIEWED_POLICY_FINDINGS = {
  english: [
    ...englishPolicyFindingsPart1,
    ...englishPolicyFindingsPart2,
    ...englishPolicyFindingsPart3,
  ],
  korean: [...koreanPolicyFindingsPart1, ...koreanPolicyFindingsPart2],
  chinese: [...chinesePolicyFindingsPart1, ...chinesePolicyFindingsPart2],
  japanese: [...japanesePolicyFindingsPart1, ...japanesePolicyFindingsPart2],
};

export const AGENT_REVIEWED_BLOCKLISTS = Object.fromEntries(
  Object.entries(AGENT_REVIEWED_POLICY_FINDINGS).map(([language, findings]) => [
    language,
    findings.map((finding) => finding.word),
  ]),
);
