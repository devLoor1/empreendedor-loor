import assert from "node:assert/strict";
import {
  isBrandedTenantSource,
  slugFromHostname,
  slugFromPathname,
  tenantRouterBasename,
} from "./tenant.ts";

assert.equal(slugFromPathname("/w/shared-fe-demo/app/dashboard"), "shared-fe-demo");
assert.equal(slugFromPathname("/app/dashboard"), null);
assert.equal(slugFromHostname("acme.empresa.loor.vc"), "acme");
assert.equal(slugFromHostname("luedal.empresa.loor.vc"), "luedal");
assert.equal(slugFromHostname("empresa.loor.vc"), null);
assert.equal(isBrandedTenantSource("hostname"), true);
assert.equal(isBrandedTenantSource("path"), true);
assert.equal(isBrandedTenantSource("vite_fallback"), false);
assert.equal(tenantRouterBasename("/w/acme/auth"), "/w/acme");
console.log("tenant.path.assertions: ok");
