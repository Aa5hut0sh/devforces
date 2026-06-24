import { spawn, type ChildProcess, execSync } from "child_process";
import net from "net";

const NODE_BIN = (() => {
  try {
    if (process.platform === "win32") {
      const result = execSync("where node", { encoding: "utf-8" });
      return (result.split("\n")[0] ?? "node").trim();
    }
    return execSync("which node", { encoding: "utf-8" }).trim();
  } catch {
    return process.platform === "win32"
      ? "node"
      : "/home/ubuntu/.nvm/versions/node/v20.20.2/bin/node";
  }
})();

export async function getFreePortAndRelease(): Promise<{ port: number; release: () => void }> {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.unref();
    srv.on("error", reject);
    srv.listen(0, () => {
      const address = srv.address();
      if (address && typeof address === "object") {
        resolve({
          port: address.port,
          release: () => srv.close(),
        });
      } else {
        srv.close();
        reject(new Error("Could not determine free port"));
      }
    });
  });
}

const isLinuxSandbox = process.platform === "linux" && process.env.NODE_ENV === "production";

export function spawnSandboxed(cwd: string, port: number): ChildProcess {
  const env = {
    ...process.env,
    PORT: String(port),
    NODE_ENV: "grading",
    PATH: process.env.PATH ?? "/usr/local/bin:/usr/bin:/bin",
  };

  if (isLinuxSandbox) {
    return spawn(
      "systemd-run",
      [
        "--user",
        "--scope",
        "-p", "MemoryMax=128M",
        "-p", "CPUQuota=50%",
        "-p", "TasksMax=30",
        "--",
        NODE_BIN, "--max-old-space-size=128", "server.js",
      ],
      { cwd, env, stdio: ["ignore", "pipe", "pipe"] }
    );
  }

  return spawn(NODE_BIN, ["server.js"], { cwd, env });
}

export async function waitForReady(
  port: number,
  maxAttempts = 50,
  intervalMs = 300
): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/health`, {
        signal: AbortSignal.timeout(1500),
      });
      if (res.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error("Server did not become ready in time");
}