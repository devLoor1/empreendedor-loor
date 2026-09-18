import { strict as assert } from "node:assert";
import { RESOURCE_UTILIZATION_OPTIONS, resourceUtilizationLabel } from "./resource-utilization";

for (const option of RESOURCE_UTILIZATION_OPTIONS) {
  assert.equal(resourceUtilizationLabel(option.value), option.label);
}
assert.equal(resourceUtilizationLabel(null), "—");
assert.equal(resourceUtilizationLabel("  "), "—");
assert.equal(resourceUtilizationLabel("Expansão regional e contratação"), "Expansão regional e contratação");
console.log("resourceUtilization: 6 assertions passed");
