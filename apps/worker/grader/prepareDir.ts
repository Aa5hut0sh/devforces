import fs from "fs/promises";
import path from "path";
import os from "os";
import crypto from "crypto";
import { getBoilerplateRoot } from "@repo/boilerplates";

export async function prepareSubmissionDir(
  boilerplateId: string,
  fullFiles: Record<string, string>
): Promise<string> {
  const tmpDir = path.join(os.tmpdir(), "devforces-submissions", crypto.randomUUID());
  await fs.mkdir(tmpDir, { recursive: true });
  
  const templateRoot = getBoilerplateRoot(boilerplateId);
  const nodeModulesSrc = path.join(templateRoot, "node_modules");

  const symlinkType = process.platform === "win32" ? "junction" : "dir";

  

  try {
    await fs.symlink(nodeModulesSrc, path.join(tmpDir, "node_modules"), symlinkType);
  } catch {
    // symlink can fail in some sandboxed/dev environments — fall back to a real copy
    await fs.cp(nodeModulesSrc, path.join(tmpDir, "node_modules"), { recursive: true });
  }

  for (const [filePath, content] of Object.entries(fullFiles)) {
    const dest = path.join(tmpDir, filePath);
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.writeFile(dest, content, "utf-8");
  }
  

  return tmpDir;
}

export async function cleanupSubmissionDir(tmpDir: string) {
  await fs.rm(tmpDir, { recursive: true, force: true });
}