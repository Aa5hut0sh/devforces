import { spawn, type ChildProcess } from "child_process";
import net from "net";

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
  const env = { ...process.env, PORT: String(port), NODE_ENV: "grading" };

  if (isLinuxSandbox) {
    return spawn(
      "systemd-run",
      [
        "--uid=sandboxuser",
        "--scope",
        "-p", "MemoryMax=256M",
        "-p", "CPUQuota=50%",
        "-p", "TasksMax=30",
        "--",
        "node", "--max-old-space-size=128", "server.js",
      ],
      { cwd, env }
    );
  }


  return spawn("node", ["server.js"], { cwd, env });
}

export async function waitForReady(
  port: number,
  maxAttempts = 50,   // was 30
  intervalMs = 300    // was 200
): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/health`, {
        signal: AbortSignal.timeout(1500), // was 1000
      });
      if (res.ok) return;
    } catch {
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error("Server did not become ready in time");
}