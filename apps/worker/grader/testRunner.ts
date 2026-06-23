import { randomUUID } from "crypto";

export interface TestCase {
  name: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  headers?: Record<string, string>;
  body?: unknown;
  expect: {
    status: number;
    body?: Record<string, unknown>; // exact value checks
    jsonSchema?: { required?: string[] }; // field existence checks
    bodyContains?: Record<string, unknown>; // partial/nested checks
  };
  weight: number;
  saveAs?: Record<string, string>;
}

export interface TestResult {
  name: string;
  passed: boolean;
  weight: number;
  earnedWeight: number;
  actualStatus?: number;
  expectedStatus: number;
  actualBody?: unknown;       // what actually came back
  error?: string;
  failReason?: string;        // "status" | "schema" | "body"
}
interface RunContext {
  random: Record<string, string>;
  saved: Record<string, string>;
}

function randomValueFor(key: string): string {
  if (key === "email") return `test+${randomUUID().slice(0, 8)}@devforces.test`;
  if (key === "uuid") return randomUUID();
  return randomUUID().slice(0, 12);
}


function resolveTemplate(value: unknown, ctx: RunContext): unknown {
  if (typeof value === "string") {
    return value.replace(/\{\{(random|saved)\.(\w+)\}\}/g, (_m, ns: string, key: string) => {
      if (ns === "random") {
        if (!ctx.random[key]) ctx.random[key] = randomValueFor(key);
        return ctx.random[key];
      }
      return ctx.saved[key] ?? "";
    });
  }
  if (Array.isArray(value)) return value.map((v) => resolveTemplate(v, ctx));
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = resolveTemplate(v, ctx);
    return out;
  }
  return value;
}

function extractJsonPath(obj: unknown, jsonPath: string): unknown {
  const parts = jsonPath.replace(/^\$\.?/, "").split(".").filter(Boolean);
  let current: any = obj;
  for (const part of parts) {
    if (current == null) return undefined;
    current = current[part];
  }
  return current;
}

function checkExpectedBody(
  actual: unknown,
  expected: Record<string, unknown>
): boolean {
  if (!actual || typeof actual !== "object") return false;
  const obj = actual as Record<string, unknown>;
  for (const [key, val] of Object.entries(expected)) {
    if (typeof val === "object" && val !== null) {
      if (!checkExpectedBody(obj[key], val as Record<string, unknown>)) return false;
    } else {
      if (obj[key] !== val) return false;
    }
  }
  return true;
}

export async function runTestSpec(baseUrl: string, testSpec: TestCase[]) {
  const ctx: RunContext = { random: {}, saved: {} };
  const results: TestResult[] = [];

  for (const test of testSpec) {
    const url = `${baseUrl}${resolveTemplate(test.path, ctx)}`;
    const headers = resolveTemplate(test.headers ?? {}, ctx) as Record<string, string>;
    const body = test.body !== undefined ? resolveTemplate(test.body, ctx) : undefined;

    try {
      const res = await fetch(url, {
        method: test.method,
        headers: { "Content-Type": "application/json", ...headers },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(10_000),
      });

      let json: unknown = null;
      try {
        json = await res.json();
      } catch {
        // non-JSON response — fine for some tests, jsonSchema check just won't match
      }

      const statusOk = res.status === test.expect.status;
      const schemaOk =
        !test.expect.jsonSchema?.required ||
        test.expect.jsonSchema.required.every(
          (field) => json && typeof json === "object" && field in (json as object)
        );
        const resolvedExpectBody = test.expect.body
        ? resolveTemplate(test.expect.body, ctx) as Record<string, unknown>
        : undefined;

      const resolvedBodyContains = test.expect.bodyContains
        ? resolveTemplate(test.expect.bodyContains, ctx) as Record<string, unknown>
        : undefined;

      const bodyOk =
        !resolvedExpectBody ||
        checkExpectedBody(json, resolvedExpectBody);

      const bodyContainsOk =
        !resolvedBodyContains ||
        checkExpectedBody(json, resolvedBodyContains);

      const passed = statusOk && schemaOk && bodyOk && bodyContainsOk;

      if (passed && test.saveAs) {
        for (const [key, jpath] of Object.entries(test.saveAs)) {
          const val = extractJsonPath(json, jpath);
          if (val !== undefined) ctx.saved[key] = String(val);
        }
      }

      results.push({
        name: test.name,
        passed,
        weight: test.weight,
        earnedWeight: passed ? test.weight : 0,
        actualStatus: res.status,
        expectedStatus: test.expect.status,
        actualBody: !passed ? json : undefined, 
        failReason: !statusOk ? "status" : !schemaOk ? "schema" : !bodyOk ? "body" : undefined,
      });
    } catch (err) {
      results.push({
        name: test.name,
        passed: false,
        weight: test.weight,
        earnedWeight: 0,
        expectedStatus: test.expect.status,
        error: err instanceof Error ? err.message : "Request failed",
      });
    }
  }

  const totalPoints = results.reduce((sum, r) => sum + r.earnedWeight, 0);
  const allPassed = results.every((r) => r.passed);

  return { results, totalPoints, allPassed };
}