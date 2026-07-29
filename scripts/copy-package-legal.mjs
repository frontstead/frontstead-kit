import { copyFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const packageDir = process.cwd();
const rootDir = resolve(packageDir, "../..");
const distDir = resolve(packageDir, "dist");

await mkdir(distDir, { recursive: true });
await Promise.all([
  copyFile(resolve(rootDir, "LICENSE"), resolve(distDir, "LICENSE")),
  copyFile(resolve(rootDir, "NOTICE"), resolve(distDir, "NOTICE")),
]);
