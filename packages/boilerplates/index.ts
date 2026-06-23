import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_ROOT = path.join(__dirname, "templates");

const IGNORED = new Set(["node_modules", ".git", "dist", "package-lock.json", "bun.lockb"]);

export function getBoilerplateRoot(boilerplateId: string): string {
  return path.join(TEMPLATES_ROOT, boilerplateId);
}

export async function loadBoilerplateFiles(boilerplateId: string): Promise<Record<string, string>> {
  const root = getBoilerplateRoot(boilerplateId);
  const files: Record<string, string> = {};

  async function walk(dir: string, relPrefix: string) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (IGNORED.has(entry.name)) continue;
      const fullPath = path.join(dir, entry.name);
      const relPath = path.join(relPrefix, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath, relPath);
      } else {
        files[relPath.replace(/\\/g, "/")] = await fs.readFile(fullPath, "utf-8");
      }
    }
  }

  await walk(root, "");
  return files;
}