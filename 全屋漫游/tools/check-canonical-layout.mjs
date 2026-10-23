import assert from 'node:assert/strict';
import {ROOM_DEFS, CORRIDORS, BOUNDS, BY_ID, contains, inPoly} from '../src/canonical-layout.js';

assert.equal(ROOM_DEFS.length, 10);
assert.equal(new Set(ROOM_DEFS.map(r => r.id)).size, 10);
assert.equal(BY_ID.size, 10);
for (const room of ROOM_DEFS) {
  assert(room.native.every(n => n > 0), `${room.id}: invalid native size`);
  assert.equal(room.poly.length >= 4, true, `${room.id}: missing footprint`);
  assert(inPoly(...room.walk, room.poly), `${room.id}: walk point outside original footprint`);
}

const step = .10;
const cols = Math.ceil((BOUNDS.maxX - BOUNDS.minX) / step);
const rows = Math.ceil((BOUNDS.maxZ - BOUNDS.minZ) / step);
const cells = new Uint8Array(cols * rows);
let overlaps = 0;
for (let row = 0; row < rows; row++) for (let col = 0; col < cols; col++) {
  const x = BOUNDS.minX + (col + .5) * step;
  const z = BOUNDS.minZ + (row + .5) * step;
  const count = ROOM_DEFS.filter(r => inPoly(x, z, r.poly)).length;
  if (count > 1) overlaps++;
  cells[row * cols + col] = contains(x, z) ? 1 : 0;
}
assert.equal(overlaps, 0, 'Native room footprints overlap');

// Corridors may bridge rigid original footprints; this tests the plan only.
// Native wall meshes are separately preserved and may block free walking.
const startRoom = BY_ID.get('dining');
const nearest = point => {
  let best = -1, distance = Infinity;
  for (let i = 0; i < cells.length; i++) if (cells[i]) {
    const x = BOUNDS.minX + ((i % cols) + .5) * step;
    const z = BOUNDS.minZ + (Math.floor(i / cols) + .5) * step;
    const d = (x - point[0]) ** 2 + (z - point[1]) ** 2;
    if (d < distance) {distance = d;best = i;}
  }
  return best;
};
const first = nearest(startRoom.walk), seen = new Uint8Array(cells.length), queue = [first];
seen[first] = 1;
for (let cursor = 0; cursor < queue.length; cursor++) {
  const i = queue[cursor], x = i % cols, z = Math.floor(i / cols);
  for (const [dx, dz] of [[1,0],[-1,0],[0,1],[0,-1]]) {
    const nx = x + dx, nz = z + dz;
    if (nx < 0 || nx >= cols || nz < 0 || nz >= rows) continue;
    const next = nz * cols + nx;
    if (cells[next] && !seen[next]) {seen[next] = 1;queue.push(next);}
  }
}
for (const room of ROOM_DEFS) assert(seen[nearest(room.walk)], `${room.id}: plan disconnected`);
assert(CORRIDORS.length > 0);
console.log('PASS: 10 non-overlapping native footprints and a connected plan corridor.');
