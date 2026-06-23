import { prisma } from "./index";

async function main() {
  // ── Contest ───────────────────────────────────────────────────────────────
  const contest = await prisma.contest.create({
    data: {
      title: "Build Authentication from Scratch",
      description:
        "Implement a complete auth system step by step — server setup, business logic, middleware, and protected routes.",
      boilerplateId: "node-express-v1",
      startTime: new Date(),
      endTime: new Date(Date.now() + 1000 * 60 * 60 * 6), // 6 hours
    },
  });

  // ── Challenge 1: Server Setup ─────────────────────────────────────────────
  const c1 = await prisma.challenge.create({
    data: {
      title: "Server Setup — Ping Endpoint",
      notionDocId: "placeholder",
      editableFiles: ["handlers/ping.js"],
      timeLimitSeconds: 20,
      testSpec: [
        {
          name: "ping_returns_200",
          method: "GET",
          path: "/api/ping",
          expect: { status: 200 },
          weight: 5,
        },
        {
          name: "ping_returns_pong_message",
          method: "GET",
          path: "/api/ping",
          expect: {
            status: 200,
            jsonSchema: { required: ["message"] },
            bodyContains: { message: "pong" },
          },
          weight: 5,
        },
      ],
      maxPoints: 10,
    },
  });

  // ── Challenge 2: Auth Controller ──────────────────────────────────────────
  const c2 = await prisma.challenge.create({
    data: {
      title: "Auth Controller — Register & Login",
      notionDocId: "placeholder",
      editableFiles: ["controllers/auth.controller.js"],
      timeLimitSeconds: 25,
      testSpec: [
        // weight 0 — just seeds a user we can try to duplicate + login with
        {
          name: "register_new_user",
          method: "POST",
          path: "/api/auth/register",
          body: {
            name: "Test User",
            email: "{{random.email}}",
            password: "Password123",
          },
          expect: {
            status: 201,
            jsonSchema: { required: ["token", "user"] },
          },
          weight: 20,
          saveAs: { token: "$.token" },
        },
        {
          name: "register_duplicate_email_returns_409",
          method: "POST",
          path: "/api/auth/register",
          body: {
            name: "Another User",
            email: "{{random.email}}", // same cached email as above
            password: "AnotherPass123",
          },
          expect: { status: 409 },
          weight: 10,
        },
        {
          name: "login_with_correct_credentials",
          method: "POST",
          path: "/api/auth/login",
          body: {
            email: "{{random.email}}", // same cached email
            password: "Password123",
          },
          expect: {
            status: 200,
            jsonSchema: { required: ["token", "user"] },
          },
          weight: 20,
          saveAs: { loginToken: "$.token" },
        },
        {
          name: "login_with_wrong_password_returns_401",
          method: "POST",
          path: "/api/auth/login",
          body: {
            email: "{{random.email}}",
            password: "WrongPassword",
          },
          expect: { status: 401 },
          weight: 10,
        },
        {
          name: "login_with_nonexistent_email_returns_401",
          method: "POST",
          path: "/api/auth/login",
          body: {
            email: "nobody@devforces.test",
            password: "Password123",
          },
          expect: { status: 401 },
          weight: 10,
        },
      ],
      maxPoints: 70,
    },
  });

  // ── Challenge 3: Auth Middleware ──────────────────────────────────────────
  const c3 = await prisma.challenge.create({
    data: {
      title: "Auth Middleware — Protect Routes",
      notionDocId: "placeholder",
      editableFiles: ["middleware/auth.middleware.js"],
      timeLimitSeconds: 25,
      testSpec: [
        // weight 0 — register to get a valid token for later tests
        {
          name: "setup_register_for_token",
          method: "POST",
          path: "/api/auth/register",
          body: {
            name: "Middleware Tester",
            email: "{{random.email}}",
            password: "Password123",
          },
          expect: { status: 201 },
          weight: 0,
          saveAs: { token: "$.token" },
        },
        {
          name: "me_without_token_returns_401",
          method: "GET",
          path: "/api/me",
          expect: { status: 401 },
          weight: 10,
        },
        {
          name: "me_with_invalid_token_returns_401",
          method: "GET",
          path: "/api/me",
          headers: { Authorization: "Bearer thisisnotavalidtoken" },
          expect: { status: 401 },
          weight: 10,
        },
        {
          name: "me_with_valid_token_returns_200",
          method: "GET",
          path: "/api/me",
          headers: { Authorization: "Bearer {{saved.token}}" },
          expect: {
            status: 200,
            jsonSchema: { required: ["user"] },
          },
          weight: 20,
        },
        {
          name: "me_returns_correct_user_email",
          method: "GET",
          path: "/api/me",
          headers: { Authorization: "Bearer {{saved.token}}" },
          expect: {
            status: 200,
            bodyContains: {
              user: { email: "{{random.email}}" },
            },
          },
          weight: 10,
        },
      ],
      maxPoints: 50,
    },
  });

  // ── Challenge 4: Protected Profile Route ──────────────────────────────────
  const c4 = await prisma.challenge.create({
    data: {
      title: "Protected Route — User Profile",
      notionDocId: "placeholder",
      editableFiles: ["routes/auth.routes.js"],
      timeLimitSeconds: 25,
      testSpec: [
        // weight 0 — register to get token
        {
          name: "setup_register",
          method: "POST",
          path: "/api/auth/register",
          body: {
            name: "Profile Tester",
            email: "{{random.email}}",
            password: "Password123",
          },
          expect: { status: 201 },
          weight: 0,
          saveAs: { token: "$.token" },
        },
        {
          name: "profile_without_token_returns_401",
          method: "GET",
          path: "/api/auth/profile",
          expect: { status: 401 },
          weight: 10,
        },
        {
          name: "profile_with_invalid_token_returns_401",
          method: "GET",
          path: "/api/auth/profile",
          headers: { Authorization: "Bearer badtoken" },
          expect: { status: 401 },
          weight: 10,
        },
        {
          name: "profile_with_valid_token_returns_user",
          method: "GET",
          path: "/api/auth/profile",
          headers: { Authorization: "Bearer {{saved.token}}" },
          expect: {
            status: 200,
            jsonSchema: { required: ["user"] },
          },
          weight: 15,
        },
        {
          name: "profile_returns_correct_email",
          method: "GET",
          path: "/api/auth/profile",
          headers: { Authorization: "Bearer {{saved.token}}" },
          expect: {
            status: 200,
            bodyContains: {
              user: { email: "{{random.email}}" },
            },
          },
          weight: 15,
        },
        // existing routes still work
        {
          name: "register_still_works",
          method: "POST",
          path: "/api/auth/register",
          body: {
            name: "Second User",
            email: "{{random.uuid}}@devforces.test",
            password: "Password123",
          },
          expect: { status: 201 },
          weight: 5,
        },
        {
          name: "login_still_works",
          method: "POST",
          path: "/api/auth/login",
          body: {
            email: "{{random.email}}",
            password: "Password123",
          },
          expect: { status: 200 },
          weight: 5,
        },
      ],
      maxPoints: 60,
    },
  });

  // ── Map challenges to contest in order ────────────────────────────────────
  await prisma.contestToChallengeMapping.createMany({
    data: [
      { contestId: contest.id, challengeId: c1.id, index: 0 },
      { contestId: contest.id, challengeId: c2.id, index: 1 },
      { contestId: contest.id, challengeId: c3.id, index: 2 },
      { contestId: contest.id, challengeId: c4.id, index: 3 },
    ],
  });

  console.log({
    contestId: contest.id,
    challenges: {
      c1_ping: c1.id,
      c2_auth_controller: c2.id,
      c3_middleware: c3.id,
      c4_profile_route: c4.id,
    },
  });
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });