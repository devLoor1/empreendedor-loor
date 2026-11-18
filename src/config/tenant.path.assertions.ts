import assert from "node:assert/strict";
import { slugFromHostname, slugFromPathname, tenantRouterBasename } from "./tenant.ts";

assert.equal(slugFromPathname("/w/shared-fe-demo/app/dashboard"), "shared-fe-demo");
assert.equal(slugFromPathname("/app/dashboard"), null);
assert.equal(slugFromHostname("acme.empresa.loor.vc"), "acme");
assert.equal(tenantRouterBasename("/w/acme/auth"), "/w/acme");
console.log("tenant.path.assertions: ok");
