import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: {
    compilerOptions: {
      resolveJsonModule: false,
    },
  },
  splitting: true,
  sourcemap: false,
  clean: true,
});
