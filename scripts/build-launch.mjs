// Bundle site/launch/entry.mjs for the browser → site/launch/sc.bundle.js (Buffer/process shimmed).
import { build } from "esbuild";
await build({ entryPoints: ["site/launch/entry.mjs"], bundle: true, format: "iife", platform: "browser", target: "es2020", minify: true, outfile: "site/launch/sc.bundle.js",
  define: { "process.env.NODE_ENV": '"production"', global: "window" },
  inject: ["site/launch/shims.mjs"], logLevel: "warning" });
console.log("built site/launch/sc.bundle.js");
