import typescript from "@rollup/plugin-typescript";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import nodePolyfills from "rollup-plugin-node-polyfills";

export default {
  input: "src/main.ts",
  output: {
    dir: ".",
    sourcemap: "inline",
    format: "cjs",
    exports: "default",
  },
  external: ["obsidian"],
  plugins: [typescript(), nodePolyfills(), nodeResolve({ browser: true }), commonjs()],
};
