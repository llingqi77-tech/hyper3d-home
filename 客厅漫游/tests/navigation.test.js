import test from "node:test";
import assert from "node:assert/strict";
import { canStand, moveWithCollisions } from "../src/navigation.js";
const furniture = [{ minX: 0, maxX: 1, minZ: 0, maxZ: 1 }];
test("walls and furniture reject entry but aisles remain passable", () => {
  assert.equal(canStand(0, -2, furniture), true);
  assert.equal(canStand(0.5, 0.5, furniture), false);
  assert.equal(canStand(-0.1, 0.5, furniture), false);
  assert.equal(canStand(3.4, 0, []), false);
  assert.equal(canStand(0, 4.9, []), false);
});
test("fast movement cannot tunnel through a piece of furniture", () => {
  const p = { x: -1, z: 0.5 };
  moveWithCollisions(p, 4, 0, furniture);
  assert.ok(p.x < -0.18);
  assert.ok(p.x > -0.28);
});
test("diagonal movement slides along an obstacle", () => {
  const p = { x: -0.25, z: 0.3 };
  moveWithCollisions(p, 0.5, 0.2, furniture);
  assert.ok(p.x < -0.18);
  assert.ok(p.z > 0.49);
});
test("room boundary blocks forward motion", () => {
  const p = { x: 2, z: -4.5 };
  moveWithCollisions(p, 0, -10, []);
  assert.ok(p.z >= -4.73);
});
