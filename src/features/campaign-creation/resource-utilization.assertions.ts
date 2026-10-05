import { strict as assert } from "node:assert";
import { RESOURCE_UTILIZATION_OPTIONS, resourceUtilizationLabel } from "./resource-utilization";

for (const option of RESOURCE_UTILIZATION_OPTIONS) {
  assert.equal(resourceUtilizationLabel(option.value), option.label);
}
assert.equal(resourceUtilizationLabel(null), "—");
assert.equal(resourceUtilizationLabel("  "), "—");
assert.equal(resourceUtilizationLabel("Expansão regional e contratação"), "Expansão regional e contratação");
console.log("resourceUtilization: 6 assertions passed");

// Platform registry: GET /resource-utilizations → { data: [{ code, name }] }.
{
  const { parseResourceUtilizationOptions } = await import("./resource-utilization");
  const parsed = parseResourceUtilizationOptions({ data: [{ code: "expansao", name: "Expansão de lojas" }] });
  assert.deepEqual(parsed, [{ value: "expansao", label: "Expansão de lojas" }]);
  assert.equal(resourceUtilizationLabel("expansao", parsed), "Expansão de lojas");
  assert.equal(resourceUtilizationLabel("expansao", parsed, "Nome da API"), "Nome da API");
  assert.equal(parseResourceUtilizationOptions({ data: [] }), RESOURCE_UTILIZATION_OPTIONS);
  assert.equal(parseResourceUtilizationOptions(null), RESOURCE_UTILIZATION_OPTIONS);
  console.log("resourceUtilization registry: 5 assertions passed");
}
