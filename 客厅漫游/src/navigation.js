export const PLAYER_RADIUS = 0.19;
export function canStand(x, z, colliders) {
  if (x < -3.25 || x > 3.25 || z < -4.73 || z > 4.73) return false;
  return !colliders.some(
    (c) =>
      x > c.minX - PLAYER_RADIUS &&
      x < c.maxX + PLAYER_RADIUS &&
      z > c.minZ - PLAYER_RADIUS &&
      z < c.maxZ + PLAYER_RADIUS,
  );
}
export function moveWithCollisions(position, dx, dz, colliders) {
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dz) / 0.075));
  for (let i = 0; i < steps; i++) {
    if (canStand(position.x + dx / steps, position.z, colliders))
      position.x += dx / steps;
    if (canStand(position.x, position.z + dz / steps, colliders))
      position.z += dz / steps;
  }
}
export const views = {
  overview: {
    pos: [-2.55, 1.6, -3.55],
    target: [1.45, 1.12, -0.1],
    name: "客厅 · 全景",
  },
  entry: {
    pos: [-2.8, 1.6, 4.16],
    target: [0.6, 1.3, -2.2],
    name: "餐厅 · 进门",
  },
  sofa: {
    pos: [1.72, 1.12, -1.75],
    target: [-1.9, 1.25, -2.6],
    name: "客厅 · 沙发",
  },
  nook: {
    pos: [0.55, 1.6, -0.45],
    target: [2.35, 1.65, 1.22],
    name: "客厅 · 书架",
  },
};
