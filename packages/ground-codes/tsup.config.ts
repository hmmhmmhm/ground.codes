import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: {
    compilerOptions: {
      resolveJsonModule: false,
    },
  },
  external: ["@ground-codes/geoint", "@ground-codes/geoint/*"],
  splitting: true,
  minify: true,
  sourcemap: false,
  clean: true,
});
