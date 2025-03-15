export default {
  // Run ESLint on all TypeScript and TypeScript React files in the apps/web directory
  'apps/web/**/*.{ts,tsx}': ['pnpm --filter web lint'],
  // Run type checking on all TypeScript and TypeScript React files in the apps/web directory
  'apps/web/**/*.{ts,tsx}': ['pnpm --filter web check-types'],
};
