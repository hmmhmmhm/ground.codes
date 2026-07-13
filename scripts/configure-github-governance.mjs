import {
  createGhApiClient,
  formatGovernanceResult,
  parseGovernanceArgs,
  runGitHubGovernance,
} from "./github-governance.mjs";

export const main = ({
  argv = process.argv.slice(2),
  api = createGhApiClient(),
  write = console.log,
  writeError = console.error,
} = {}) => {
  try {
    const options = parseGovernanceArgs(argv);
    const result = runGitHubGovernance({ api, ...options });
    for (const line of formatGovernanceResult(result)) write(line);
    return 0;
  } catch (error) {
    writeError(
      error?.name === "GovernanceError"
        ? error.message
        : "GitHub governance command failed.",
    );
    return 1;
  }
};

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exitCode = main();
}
