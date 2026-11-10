import assert from "node:assert/strict";
import path from "node:path";
import { createServer } from "vite";

// Exercise the real API consumer through Vite's module loader. Every fetch is
// intercepted in memory; no server port, real account, token or mail is used.
const originalFetch = globalThis.fetch;
const originalStorage = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
const calls = [];
const storageWrites = [];
let reply;
globalThis.fetch = async (url, init) => {
  assert.equal(new URL(url).origin, "https://qa.example.invalid");
  calls.push({ url, init });
  return reply();
};
Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: {
    getItem: () => null,
    setItem: (...args) => storageWrites.push(args),
  },
});
Object.defineProperty(globalThis, "window", {
  configurable: true,
  value: { location: { protocol: "https:" } },
});

function createApiLoader(apiSlug, platformSlug) {
  return createServer({
    configFile: false,
    envDir: false,
    root: process.cwd(),
    appType: "custom",
    server: { middlewareMode: true, watch: null, hmr: false, ws: false },
    optimizeDeps: { noDiscovery: true, entries: [] },
    resolve: { alias: { "@": path.resolve("src") } },
    define: {
      "import.meta.env.VITE_API_BASE_URL": JSON.stringify("https://qa.example.invalid/service"),
      "import.meta.env.VITE_API_SLUG": JSON.stringify(apiSlug) ?? "undefined",
      "import.meta.env.VITE_PLATFORM_SLUG": JSON.stringify(platformSlug) ?? "undefined",
    },
    logLevel: "error",
  });
}
const server = await createApiLoader("qa-confirmation-tenant", "");

let checks = 0;
function respond(status, body = { message: "synthetic response" }) {
  reply = () =>
    new Response(status === 204 ? null : JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    });
}

try {
  const api = await server.ssrLoadModule("/src/services/api.ts");
  respond(201);
  await api.requestEmailConfirmation("  QA@Example.Invalid  ");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "https://qa.example.invalid/service/resend-confirmation");
  assert.equal(calls[0].init.method, "POST");
  assert.deepEqual(JSON.parse(calls[0].init.body), {
    email: "qa@example.invalid",
    user_type: "entrepreneur",
    platform_slug: "qa-confirmation-tenant",
  });
  assert.equal(calls[0].init.headers["x-whitelabel-slug"], "qa-confirmation-tenant");
  assert.equal(calls[0].init.headers.Authorization, undefined);
  checks += 1;

  for (const status of [201, 429]) {
    let release;
    reply = () =>
      new Promise((resolve) => {
        release = resolve;
      });
    const before = calls.length;
    const firstForm = api.requestEmailConfirmation("qa@example.invalid");
    const remountedForm = api.requestEmailConfirmation(" QA@Example.Invalid ");
    const outcomes = Promise.allSettled([firstForm, remountedForm]);
    assert.equal(
      calls.length,
      before + 1,
      "remount/concurrent consumers must share one pending dispatch",
    );
    release(
      new Response(JSON.stringify({ message: "synthetic response" }), {
        status,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const results = await outcomes;
    assert.ok(
      results.every((result) => result.status === (status === 201 ? "fulfilled" : "rejected")),
    );
    respond(201);
    await api.requestEmailConfirmation("qa@example.invalid");
    assert.equal(
      calls.length,
      before + 2,
      "a settled request must release the guard for a later explicit action",
    );
    checks += 1;
  }

  for (const email of ["", "  ", "not-an-email", "a@", "a b@example.invalid"]) {
    const before = calls.length;
    await assert.rejects(api.requestEmailConfirmation(email), (error) => error.status === 400);
    assert.equal(calls.length, before, "invalid email must not dispatch");
    checks += 1;
  }

  for (const status of [200, 202, 204, 400, 403, 404, 422, 429, 503]) {
    respond(status);
    const before = calls.length;
    await assert.rejects(
      api.requestEmailConfirmation("qa@example.invalid"),
      (error) => error.status === status,
    );
    assert.equal(
      calls.length,
      before + 1,
      "errors and non-contract success statuses must not retry",
    );
    checks += 1;
  }

  const beforeNetworkError = calls.length;
  reply = () => {
    throw new TypeError("synthetic network failure");
  };
  await assert.rejects(
    api.requestEmailConfirmation("qa@example.invalid"),
    /synthetic network failure/,
  );
  assert.equal(calls.length, beforeNetworkError + 1);
  checks += 1;

  // Existing auth methods still accept their original HTTP 200 responses.
  respond(200, { data: { token: "synthetic-token-not-persisted" } });
  await api.login("qa@example.invalid", "synthetic-password-only");
  assert.ok(calls.at(-1).url.endsWith("/auth/entrepreneur/login"));
  respond(200);
  await api.recoverPassword("qa@example.invalid");
  assert.ok(calls.at(-1).url.endsWith("/auth/entrepreneur/recover"));
  assert.deepEqual(
    storageWrites,
    [],
    "requesting confirmation must not authenticate or mark verification",
  );
  checks += 2;

  // Match the deployed sites: PLATFORM_SLUG only, as well as legacy API_SLUG
  // precedence. Each loader has its own module scope; no network port opens.
  for (const [apiSlug, platformSlug, expectedSlug] of [
    [undefined, "homologacao", "homologacao"],
    [undefined, "finapop-homologacao", "finapop-homologacao"],
    ["", "  qa-platform-only  ", "qa-platform-only"],
    ["qa-api-override", "qa-platform-fallback", "qa-api-override"],
    [undefined, undefined, undefined],
  ]) {
    const loader = await createApiLoader(apiSlug, platformSlug);
    try {
      const variant = await loader.ssrLoadModule("/src/services/api.ts");
      respond(201);
      await variant.requestEmailConfirmation(" QA@Example.Invalid ");
      const sent = calls.at(-1);
      assert.equal(JSON.parse(sent.init.body).platform_slug, expectedSlug);
      assert.equal(sent.init.headers["x-whitelabel-slug"], expectedSlug);
      assert.equal(JSON.parse(sent.init.body).user_type, "entrepreneur");
      checks += 1;
      if (platformSlug === "homologacao") {
        respond(200);
        await variant.login("qa@example.invalid", "synthetic-password-only");
        await variant.recoverPassword("qa@example.invalid");
        for (const existingCall of calls.slice(-2)) {
          assert.equal(JSON.parse(existingCall.init.body).platform_slug, undefined);
          assert.equal(existingCall.init.headers["x-whitelabel-slug"], undefined);
          checks += 1;
        }
      }
    } finally {
      await loader.close();
    }
  }
  console.log(
    `PASS: ${checks} focused confirmation/auth checks; ${calls.length} intercepted requests; zero network access.`,
  );
} finally {
  await server.close();
  globalThis.fetch = originalFetch;
  if (originalStorage) Object.defineProperty(globalThis, "localStorage", originalStorage);
  else delete globalThis.localStorage;
  if (originalWindow) Object.defineProperty(globalThis, "window", originalWindow);
  else delete globalThis.window;
}
