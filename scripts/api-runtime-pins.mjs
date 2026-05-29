export const RUNTIME_REPOSITORY =
  "git+https://github.com/hmmhmmhm/ground.codes.git";
export const WORKSPACE_DEPENDENCY = "workspace:*";

export const RUNTIME_PACKAGES = [
  {
    name: "ground-codes",
    path: "packages/ground-codes",
  },
  {
    name: "@ground-codes/geoint",
    path: "packages/geoint",
  },
  {
    name: "@repo/codebook",
    path: "packages/codebook",
  },
];

export const buildPinnedDependency = (tag, { path }) =>
  `${RUNTIME_REPOSITORY}#${tag}&path:${path}`;

export const getRuntimeTag = (packageJson) => {
  const firstDependency = packageJson.dependencies?.[RUNTIME_PACKAGES[0].name];
  if (typeof firstDependency !== "string") return null;
  const match = firstDependency.match(/#([^&]+)&path:/);
  return match?.[1] ?? null;
};

export const usesWorkspaceRuntime = (packageJson) =>
  RUNTIME_PACKAGES.every(
    ({ name }) => packageJson.dependencies?.[name] === WORKSPACE_DEPENDENCY,
  );

export const getRuntimePinFailures = (packageJson, tag) =>
  usesWorkspaceRuntime(packageJson)
    ? []
    : RUNTIME_PACKAGES.flatMap((runtimePackage) => {
        const expected = buildPinnedDependency(tag, runtimePackage);
        const actual = packageJson.dependencies?.[runtimePackage.name];
        return actual === expected
          ? []
          : [
              `${runtimePackage.name} expected ${expected} or ${WORKSPACE_DEPENDENCY}, found ${
                actual ?? "missing"
              }`,
            ];
      });

export const getStrictRuntimePinFailures = (packageJson, tag) =>
  RUNTIME_PACKAGES.flatMap((runtimePackage) => {
    const expected = buildPinnedDependency(tag, runtimePackage);
    const actual = packageJson.dependencies?.[runtimePackage.name];
    return actual === expected
      ? []
      : [
          `${runtimePackage.name} expected ${expected}, found ${
            actual ?? "missing"
          }`,
        ];
  });

export const updateRuntimePins = (packageJson, tag) => {
  packageJson.dependencies ??= {};

  let changed = false;
  for (const runtimePackage of RUNTIME_PACKAGES) {
    const nextValue = buildPinnedDependency(tag, runtimePackage);
    if (packageJson.dependencies[runtimePackage.name] !== nextValue) {
      packageJson.dependencies[runtimePackage.name] = nextValue;
      changed = true;
    }
  }

  return changed;
};
