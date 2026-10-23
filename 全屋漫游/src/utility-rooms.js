import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { assets as bathroom2Assets } from '../../公卫2漫游/src/assets.js';
import { prepareModel } from '../../公卫2漫游/src/model.js';
import { UPPER_CABINET_CENTER, UPPER_CABINET_HEIGHT } from '../../厨房漫游/src/dimensions.js';
import { createKitchen as createStandaloneKitchen } from './canonical/kitchen.js';

// Room-local metres; never set the supplied roots' transforms.
// kitchen: centered X/Z, 2.06 x 3.08, Y=0 floor. The original procedural
// coordinates span 3.08 x 2.06 and retain their original internal X/Z scale.
// Generated kitchen GLBs already use the resulting 2.06 x 3.08 coordinates.
// bathroom1: 1.42 x 1.70; source X=0..1.42, Z=0..1.70 (+Z north).
// Apply the original reflection BEFORE centering: X'=.71-X, Z'=Z-.85.
// Recommended parent yaw +PI/2 puts its north window toward global +X and
// its south entrance toward global -X. After yaw the footprint is 1.70 x 1.42;
// for a global 2.94 x 1.70 footprint, parent local scales are X=1.70/1.42,
// Z=2.94/1.70 (not the unswapped width ratio). No door/shell is added here.
// bathroom2: centered 3.40 x 1.90, +X east, +Z south, height 2.65.
// Its latest default curtain is gathered to .16, anchored at its north end.
// Plan exceptions: kitchen excludes X<-.51 AND Z>.15 (parent yaw -PI/2); bathroom2 excludes
// X>.225 AND Z>.385. Cabinet surfaces are clipped at the kitchen notch;
// other kitchen fixtures move the minimum axis distance out of that notch.
// Bathroom2's drain moves north and its rod is shortened at the new wall.
// prepareModel is safe to import: its BASE_URL is used only by getModel,
// which is never called. All GLB URLs below go exclusively through assetUrl.

const NATIVE = {
  kitchen: { width: 2.06, depth: 3.08, height: 2.5, origin: 'center', north: [0, 0, -1], notch: { x: -.51, z: .15 } },
  bathroom1: { width: 1.42, depth: 1.70, height: 2.45, origin: 'center', reflectedX: true, north: [0, 0, 1], recommendedYaw: Math.PI / 2 },
  bathroom2: { width: 3.4, depth: 1.9, height: 2.65, origin: 'center', north: [0, 0, -1], notch: { x: .225, z: .385 } },
};

const kitchenModels = [
  { id: '16', file: 'entry-lantern.glb', size: [.55, .62, .55], pos: [0, 1.8, 1.675] },
  { id: '03', file: 'white-hood-v2.glb', size: [.80, .43, .36], pos: [-.26, 1.36, -1.24] },
  { id: '04', file: 'two-burner-hob-v2.glb', size: [.80, .11, .48], pos: [-.26, .868, -1.02] },
  { id: '08', file: 'nonstick-pan-v2.glb', size: [.28, .09, .45], pos: [-.49, .978, -.92], yaw: Math.PI },
  { id: '18', file: 'pressure-cooker-v2.glb', size: [.28, .29, .40], pos: [-.03, .978, -.95], yaw: Math.PI },
  { id: '17', file: 'sink-upper-cabinet-v2.glb', size: [.80, UPPER_CABINET_HEIGHT, .28], pos: [.83, 1.80, .42], yaw: -Math.PI / 2, exactSize: true },
];

const bathroom1Models = [
  { id: 'cabinet', file: 'cabinet-isolated-v3.glb', focus: [.30, .45, .54], size: [.68, .80, .49], yaw: Math.PI / 2 },
  { id: 'basin', file: 'basin-isolated-v3.glb', focus: [.31, .95, .54], size: [.46, .20, .46], yaw: 0 },
  { id: 'lamp', file: 'double-lamp.glb', focus: [.10, 2.12, .54], size: [.56, .34, .24], yaw: Math.PI / 2 },
  { id: 'toilet', file: 'toilet.glb', focus: [.26, .54, 1.24], size: [.70, .76, .46], yaw: Math.PI / 2 },
  { id: 'showerhead', file: 'shower-black-v2.glb', focus: [1.15, 1.375, 1.24], size: [.30, 1.65, .50], yaw: -Math.PI / 2 },
];

const material = (color, roughness = .8, metalness = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });

function mesh(parent, geometry, mat, x = 0, y = 0, z = 0, name = '') {
  const result = new THREE.Mesh(geometry, mat);
  result.name = name;
  result.position.set(x, y, z);
  result.castShadow = true;
  result.receiveShadow = true;
  parent.add(result);
  return result;
}

function box(parent, w, h, d, mat, x, y, z, name) {
  return mesh(parent, new THREE.BoxGeometry(w, h, d), mat, x, y, z, name);
}

function objectGroup(parent, id, pos = [0, 0, 0]) {
  const group = new THREE.Group();
  group.name = id;
  group.userData.assetId = id;
  group.position.set(...pos);
  parent.add(group);
  return group;
}

function boundsOf(model, label) {
  model.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(model);
  const size = bounds.getSize(new THREE.Vector3());
  if (bounds.isEmpty() || ![size.x, size.y, size.z].every(n => Number.isFinite(n) && n > 0)) {
    throw new Error(`Invalid or empty model bounds: ${label}`);
  }
  return { bounds, size, center: bounds.getCenter(new THREE.Vector3()) };
}

function prepareKitchenModel(source, spec) {
  const model = source.clone(true);
  const { bounds, size, center } = boundsOf(model, spec.file);
  const ratios = spec.size.map((n, i) => n / Math.max(size.getComponent(i), .001));
  const fit = spec.exactSize ? new THREE.Vector3(...ratios) : new THREE.Vector3().setScalar(Math.min(...ratios));
  model.scale.multiply(fit);
  model.position.set(-center.x * fit.x, -bounds.min.y * fit.y, -center.z * fit.z);
  const placed = new THREE.Group();
  placed.name = `hyper3d-${spec.id}`;
  placed.userData.assetId = spec.id;
  placed.position.set(...spec.pos);
  placed.rotation.y = spec.yaw || 0;
  placed.add(model);
  placed.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return placed;
}

function prepareBathroom1Model(source, spec) {
  const model = source.clone(true);
  const { bounds, size, center } = boundsOf(model, spec.file);
  model.position.sub(new THREE.Vector3(center.x, bounds.min.y, center.z));
  const scaled = new THREE.Group();
  scaled.add(model);
  scaled.scale.set(...spec.size.map((n, i) => n / Math.max(size.getComponent(i), .001)));
  const placed = new THREE.Group();
  placed.name = `hyper3d-${spec.id}`;
  placed.rotation.y = spec.yaw;
  placed.position.set(spec.focus[0], spec.focus[1] - spec.size[1] / 2, spec.focus[2]);
  placed.add(scaled);
  placed.traverse(o => {
    if (!o.isMesh) return;
    o.castShadow = o.receiveShadow = true;
    const mats = (Array.isArray(o.material) ? o.material : [o.material]).map(m => {
      const copy = m.clone();
      copy.side = THREE.DoubleSide;
      return copy;
    });
    o.material = Array.isArray(o.material) ? mats : mats[0];
  });
  return placed;
}

// Keep X>=-.51 OR Z<=.15. Split triangles at both planes, interpolating
// all attributes, rather than retaining triangles that straddle the notch.
// Only original procedural cabinetry is cut; GLB fixtures keep their geometry.
function clipKitchenCabinetry(group) {
  group.parent.updateMatrixWorld(true);
  const point = new THREE.Vector3();
  group.traverse(o => {
    if (!o.isMesh) return;
    const source = o.geometry;
    const geometry = source.index ? source.toNonIndexed() : source.clone();
    const attributes = Object.entries(geometry.attributes);
    const output = Object.fromEntries(attributes.map(([key]) => [key, []]));
    const signed = (vertex, axis, limit, sign) => {
      point.fromArray(vertex.position).applyMatrix4(o.matrixWorld);
      return sign * (point[axis] - limit);
    };
    function clip(polygon, axis, limit, sign) {
      const result = [];
      for (let i = 0; i < polygon.length; i++) {
        const a = polygon[i], b = polygon[(i + 1) % polygon.length];
        const da = signed(a, axis, limit, sign), db = signed(b, axis, limit, sign);
        if (da <= 0) result.push(a);
        if ((da < 0 && db > 0) || (da > 0 && db < 0)) {
          const t = da / (da - db);
          result.push(Object.fromEntries(attributes.map(([key]) => [key, a[key].map((n, k) => n + (b[key][k] - n) * t)])));
        }
      }
      return result;
    }
    function append(polygon) {
      for (let i = 1; i < polygon.length - 1; i++) {
        for (const vertex of [polygon[0], polygon[i], polygon[i + 1]]) {
          for (const [key] of attributes) output[key].push(...vertex[key]);
        }
      }
    }
    for (let i = 0; i < geometry.attributes.position.count; i += 3) {
      const triangle = [0, 1, 2].map(k => Object.fromEntries(attributes.map(([key, attr]) => [key,
        Array.from({ length: attr.itemSize }, (_, n) => attr.array[(i + k) * attr.itemSize + n]),
      ])));
      append(clip(triangle, 'x', -.51, -1));
      append(clip(clip(triangle, 'x', -.51, 1), 'z', .15, 1));
    }
    const result = new THREE.BufferGeometry();
    for (const [key, attr] of attributes) result.setAttribute(key, new THREE.Float32BufferAttribute(output[key], attr.itemSize));
    result.computeBoundingBox();
    result.computeBoundingSphere();
    o.geometry = result;
    o.visible = output.position.length > 0;
    geometry.dispose();
    source.dispose();
  });
}

function avoidKitchenNotch(group) {
  group.parent.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(group);
  if (bounds.min.x >= -.51 || bounds.max.z <= .15) return;
  const dx = -.51 - bounds.min.x + .001;
  const dz = bounds.max.z - .15 + .001;
  // Convert metre displacement back into the original procedural frame.
  const parentScale = group.parent.scale;
  const shift = dx < dz ? [dx / parentScale.x, 0, 0] : [0, 0, -dz / parentScale.z];
  group.position.add(new THREE.Vector3(...shift));
  group.userData.planAdjustment = { reason: 'kitchen floorplan notch', localShift: shift };
}

// Adapted from kitchen.js: identical cabinetry, panel doors and active
// procedural fixture geometry; no shell, fallback GLBs, DOM or scene lights.
function assembleKitchen(root, complete) {
  const original = objectGroup(root, 'kitchen-original-procedural');
  original.scale.set(2.06 / 3.08, 1, 3.08 / 2.06);
  const mat = {
    cabinet: material('#f4f1eb', .72), inset: material('#ebe6dc'), brass: material('#9a7542', .3, .7),
    wood: material('#9c744b'), woodLight: material('#bf996a'), metal: material('#727d80', .26, .82),
    dark: material('#343a38', .35, .45), ceramic: material('#c9d0d1', .28, .22),
    towel: material('#b85c78', 1), green: material('#7da073', .35),
    glow: new THREE.MeshStandardMaterial({ color: '#ffe6ad', emissive: '#ffe6ad', emissiveIntensity: 1.4 }),
  };
  // Same speckled countertop palette, using a deterministic DataTexture so
  // creating room furniture does not require a document/canvas environment.
  const pixels = new Uint8Array(256 * 256 * 4);
  let seed = 89;
  for (let i = 0; i < pixels.length; i += 4) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const speckle = (seed >>> 24) < 38 ? .84 : 1;
    pixels.set([208 * speckle, 200 * speckle, 184 * speckle, 255], i);
  }
  const texture = new THREE.DataTexture(pixels, 256, 256);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2.5, 1.5);
  texture.needsUpdate = true;
  mat.stone = new THREE.MeshStandardMaterial({ map: texture, roughness: .68 });
  const b = (p, w, h, d, m, x, y, z) => box(p, w, h, d, m, x, y, z);
  function paneledDoor(parent, x, y, z, w, h, face = 'z', glass = false) {
    const plate = b(parent, w, h, .035, mat.cabinet, x, y, z);
    if (face === 'x') plate.rotation.y = Math.PI / 2;
    const inner = b(parent, w * .76, h * .7, .014, mat.inset, x, y, z + (face === 'z' ? .024 : 0));
    if (face === 'x') {
      inner.position.set(x + (x > 0 ? -.025 : .025), y, z);
      inner.rotation.y = Math.PI / 2;
    }
    if (glass) inner.material = new THREE.MeshPhysicalMaterial({ color: '#d7dedb', roughness: .14, transmission: .28, transparent: true, opacity: .72 });
    const knob = mesh(parent, new THREE.SphereGeometry(.026, 16, 12), mat.brass, x + w * .31, y - h * .22, z + (face === 'z' ? .035 : 0));
    if (face === 'x') { knob.position.x = x + (x > 0 ? -.04 : .04); knob.position.z = z + w * .31; }
  }
  const parts = [];
  const mark = (id, pos) => { const g = objectGroup(original, `object-${id}`, pos); parts.push(g); return g; };
  const base = mark('01');
  b(base, 2.82, .78, .56, mat.cabinet, 0, .4, -.69);
  for (const x of [-1.19, 1.19]) b(base, .56, .78, 1.28, mat.cabinet, x, .4, -.03);
  for (const x of [-1.12, -.56, 0, .56, 1.12]) {
    paneledDoor(base, x, .42, -.397, .5, .69);
    b(base, .09, .015, .025, mat.brass, x + .13, .38, -.365);
  }
  for (const z of [-.48, -.04, .4]) for (const x of [-.89, .89]) paneledDoor(base, x, .42, z, .39, .69, 'x');
  b(base, 2.9, .075, .65, mat.stone, 0, .83, -.68);
  for (const x of [-1.19, 1.19]) b(base, .65, .075, 1.32, mat.stone, x, .83, -.03);
  const uppers = mark('02');
  for (const [x, w] of [[-1.12, .48], [-.56, .52], [.02, .52], [.59, .46], [1.1, .48]]) {
    b(uppers, w, UPPER_CABINET_HEIGHT, .38, mat.cabinet, x, UPPER_CABINET_CENTER, -.77);
    paneledDoor(uppers, x, UPPER_CABINET_CENTER, -.57, w * .88, .53, 'z', x > .85);
  }
  for (const x of [.99, 1.2]) b(uppers, .018, .48, .016, mat.cabinet, x, UPPER_CABINET_CENTER, -.532);
  b(uppers, .41, .018, .016, mat.cabinet, 1.1, UPPER_CABINET_CENTER, -.532);
  clipKitchenCabinetry(base);
  clipKitchenCabinetry(uppers);

  const sink = mark('05', [1.12, .86, .28]);
  b(sink, .54, .04, .82, mat.metal, 0, .02, 0);
  for (const z of [-.2, .2]) {
    b(sink, .42, .16, .34, mat.dark, 0, -.065, z);
    b(sink, .36, .012, .27, mat.ceramic, 0, -.14, z);
  }
  const faucet = mark('06', [1.12, .94, -.06]);
  mesh(faucet, new THREE.CylinderGeometry(.035, .045, .08, 20), mat.metal);
  const curve = new THREE.CatmullRomCurve3([[0, .03, 0], [0, .24, 0], [0, .29, .08], [0, .27, .25]].map(p => new THREE.Vector3(...p)));
  mesh(faucet, new THREE.TubeGeometry(curve, 28, .022, 10, false), mat.metal);
  const ceiling = mark('07', [0, 2.38, 0]);
  mesh(ceiling, new THREE.CylinderGeometry(.24, .28, .12, 40), mat.brass, 0, .04, 0);
  mesh(ceiling, new THREE.CylinderGeometry(.22, .24, .1, 40), mat.glow, 0, -.03, 0);
  const bottles = mark('09', [-1.17, .91, -.28]);
  for (const [x, h, c] of [[-.1, .27, '#bd8744'], [.02, .22, '#b84636'], [.13, .24, '#dcbd65']]) {
    mesh(bottles, new THREE.CylinderGeometry(.042, .05, h, 18), material(c, .32), x, h / 2, 0);
    mesh(bottles, new THREE.CylinderGeometry(.017, .022, .06, 12), mat.brass, x, h + .025, 0);
  }
  const utensils = mark('10', [.78, .9, -.65]);
  mesh(utensils, new THREE.CylinderGeometry(.075, .09, .2, 24), material('#b4773d'), 0, .1, 0);
  for (let i = 0; i < 6; i++) {
    const tool = b(utensils, .018, .32 + (i % 2) * .07, .018, i % 2 ? mat.wood : mat.dark, (i - 2.5) * .026, .28 + (i % 2) * .035, 0);
    tool.rotation.z = (i - 2.5) * .06;
  }
  const spices = mark('11', [.32, .9, -.48]);
  for (const x of [-.1, 0, .1]) {
    mesh(spices, new THREE.CylinderGeometry(.035, .04, .1, 16), mat.ceramic, x, .05, 0);
    mesh(spices, new THREE.CylinderGeometry(.041, .041, .015, 16), mat.wood, x, .105, 0);
  }
  mesh(spices, new THREE.CylinderGeometry(.095, .1, .024, 24), mat.ceramic, 0, .018, .12);
  const boards = mark('12', [.66, .91, -.76]);
  for (let i = 0; i < 2; i++) {
    const board = b(boards, .24, .34, .035, i ? mat.wood : mat.woodLight, (i - .5) * .08, .19, (i - .5) * .045);
    board.rotation.z = i ? .08 : -.07;
    mesh(boards, new THREE.TorusGeometry(.02, .008, 6, 14), mat.brass, board.position.x, .32, .025 + (i - .5) * .045);
  }
  const rack = mark('13', [1.19, 1.16, -.55]);
  for (const x of [-.21, .21]) for (const z of [-.13, .13]) b(rack, .018, .3, .018, mat.metal, x, .15, z);
  for (const y of [.05, .3]) {
    mesh(rack, new THREE.TorusGeometry(.17, .007, 6, 32), mat.metal, 0, y, 0).rotation.x = Math.PI / 2;
    for (let i = 0; i < 5; i++) b(rack, .012, .012, .3, mat.metal, -.16 + i * .08, y, 0);
  }
  for (let i = 0; i < 3; i++) mesh(rack, new THREE.TorusGeometry(.07, .008, 6, 24), mat.ceramic, -.1 + i * .1, .37, 0).rotation.x = Math.PI / 2;
  const towel = mark('14', [1.43, 1.1, -.05]);
  b(towel, .035, .4, .28, mat.towel, 0, -.2, 0);
  for (let i = 0; i < 5; i++) b(towel, .004, .39, .012, material('#d995a9'), .022, -.2, -.1 + i * .05);
  const cleaner = mark('15', [1.16, .91, .57]);
  mesh(cleaner, new THREE.CylinderGeometry(.045, .055, .19, 20), mat.green, 0, .095, 0);
  mesh(cleaner, new THREE.CylinderGeometry(.02, .025, .055, 12), mat.ceramic, 0, .22, 0);
  for (const part of parts) {
    if (part !== base && part !== uppers) avoidKitchenNotch(part);
    complete('kitchen', part, false);
  }
}

// Actual permanent details from bathroom1/main.js, not the GLB placeholders.
function assembleBathroom1(root, complete) {
  const original = objectGroup(root, 'bathroom1-reflected-centered');
  original.scale.x = -1;
  original.position.set(.71, 0, -.85);
  const metal = material('#342d24', .33, .62);
  const porcelain = material('#f5f2e9', .22, .02);
  const chrome = material('#d8e1e5', .22, .72);
  const parts = [];
  const mark = id => { const g = objectGroup(original, id); parts.push(g); return g; };
  const faucet = mark('faucet');
  mesh(faucet, new THREE.CylinderGeometry(.023, .025, .29, 24), chrome, .065, .995, .54);
  box(faucet, .19, .035, .043, chrome, .155, 1.125, .54);
  box(faucet, .085, .012, .030, chrome, .09, 1.169, .54);
  const mirror = mark('mirror');
  box(mirror, .035, .68, .46, metal, .05, 1.66, .54);
  const surface = new THREE.Mesh(new THREE.PlaneGeometry(.40, .62), material('#c9d9d7', .08, 1));
  surface.name = 'vanity mirror surface';
  surface.rotation.y = Math.PI / 2;
  surface.position.set(.072, 1.66, .54);
  mirror.add(surface);
  const shelf = mark('corner toiletries shelf');
  box(shelf, .28, .025, .20, metal, .15, 1.60, 1.585);
  for (let i = 0; i < 4; i++) box(shelf, .045, .14, .045, material(['#e9ede4', '#86a2a3', '#d7c5a7', '#f1efdf'][i], .5), .06 + i * .06, 1.6825, 1.585);
  const towel = mark('towel bar and hanging towel');
  box(towel, .55, .035, .035, metal, .075, 2.03, 1.20);
  box(towel, .27, .46, .035, material('#ead6a8', .88), .20, 1.77, 1.20);
  for (let i = 0; i < 4; i++) box(towel, .27, .018, .008, material(i % 2 ? '#aebbc0' : '#dcc686', .75), .20, 1.63 + i * .055, 1.18);
  const paper = mark('toilet paper roll');
  box(paper, .12, .10, .10, porcelain, .18, .68, .97);
  mesh(paper, new THREE.CylinderGeometry(.018, .018, .102, 16), metal, .18, .68, .97).rotation.z = Math.PI / 2;
  const soap = mark('wall-mounted-soap-dispenser');
  box(soap, .035, .14, .12, metal, .055, 1.06, 1.02);
  box(soap, .10, .17, .105, material('#dce5d4', .28, .08), .12, 1.09, 1.02);
  box(soap, .035, .045, .035, porcelain, .12, 1.20, 1.02);
  box(soap, .11, .022, .035, porcelain, .155, 1.225, 1.02);
  const drain = mark('drain');
  mesh(drain, new THREE.CylinderGeometry(.055, .055, .008, 28), metal, 1.24, .024, .25);
  const window = mark('north wall recessed window');
  const frame = material('#899599', .29, .72);
  const glass = new THREE.MeshStandardMaterial({ color: '#c0dde3', transparent: true, opacity: .20, metalness: .05, roughness: .12, depthWrite: false, side: THREE.DoubleSide });
  for (const x of [.643, 1.317]) box(window, .026, .50, .078, frame, x, 1.91, 1.742);
  for (const y of [1.673, 2.147]) box(window, .70, .026, .078, frame, .98, y, 1.742);
  for (let i = 0; i < 5; i++) {
    const y = 1.725 + i * .092;
    box(window, .648, .007, .077, glass, .98, y, 1.744).rotation.x = -.48;
    box(window, .648, .007, .008, frame, .98, y + .018, 1.710);
  }
  for (const part of parts) complete('bathroom1', part, false);
  return original;
}

/**
 * Populate the three supplied Groups without renderer, DOM, controls or shell.
 * Progress fires once per assembled object/GLB instance (copies count separately).
 * assetCount includes procedural assemblies; loadedModels counts GLB instances.
 * At most two GLB jobs run at once. Failures include the repo path and are thrown
 * together after the queue settles; successful objects stay available for review.
 * Calling twice on the same roots is rejected to prevent duplicate furniture.
 */
export async function populateUtilityRooms({ rooms, assetUrl, onProgress = () => {} }) {
  if (!(rooms instanceof Map) || typeof assetUrl !== 'function' || typeof onProgress !== 'function') {
    throw new TypeError('Expected rooms Map, assetUrl(relativeRepoPath), and optional onProgress(label)');
  }
  for (const key of Object.keys(NATIVE)) {
    const root = rooms.get(key)?.root;
    if (!root?.isGroup) throw new TypeError(`Missing THREE.Group: rooms.get('${key}').root`);
    if (root.userData.utilityRoomsState) throw new Error(`Utility room already populated or attempted: ${key}`);
  }
  const stats = { assetCount: 0, loadedModels: 0, proceduralObjects: 0, rooms: {} };
  const stages = {};
  for (const [key, native] of Object.entries(NATIVE)) {
    const root = rooms.get(key).root;
    root.userData.assetCount = 0;
    root.userData.utilityRoomsState = 'loading';
    root.userData.nativeRoom = structuredClone(native);
    stages[key] = new THREE.Group();
    stages[key].name = `${key}-utility-contents`;
    stats.rooms[key] = { assetCount: 0, loadedModels: 0, proceduralObjects: 0, native: structuredClone(native), adjustments: [] };
  }
  function complete(key, object, isModel) {
    object.userData.roomId = key;
    object.traverse(o => {
      o.userData.roomId = key;
      o.userData.assetId ??= object.userData.assetId || object.name;
    });
    const room = stats.rooms[key];
    room.assetCount++;
    stats.assetCount++;
    const category = isModel ? 'loadedModels' : 'proceduralObjects';
    room[category]++;
    stats[category]++;
    if (object.userData.planAdjustment) room.adjustments.push({ id: object.name, ...object.userData.planAdjustment });
    rooms.get(key).root.userData.assetCount = room.assetCount;
    onProgress(`${key}: ${object.name}`);
  }
  const failures = [];
  let succeeded = false;
  try {
    // Keep the restored shared-house layout, but mount the complete current
    // independent kitchen scene: its original cabinetry, walls, floor and GLBs.
    const standaloneKitchen = await createStandaloneKitchen({ assetUrl, onProgress, bathroomDoor: true });
    stages.kitchen.add(standaloneKitchen.scene);
    complete('kitchen', standaloneKitchen.scene, true);
    const bathroom1Original = assembleBathroom1(stages.bathroom1, complete);
    const mirror = new THREE.Mesh(new THREE.PlaneGeometry(.65, .77), material('#c9d9d7', .08, 1));
    mirror.name = 'vanity mirror surface';
    mirror.position.set(-1.03, 1.56, -.796);
    stages.bathroom2.add(mirror);
    complete('bathroom2', mirror, false);

    const loader = new GLTFLoader();
    const cache = new Map();
    function load(path) {
      if (!cache.has(path)) {
        cache.set(path, Promise.resolve().then(() => assetUrl(path)).then(url => loader.loadAsync(url)));
      }
      return cache.get(path);
    }
    const jobs = [];
    for (const spec of bathroom1Models) {
      const path = `公卫1漫游/public/assets/${spec.file}`;
      jobs.push({ path, run: async () => {
        const placed = prepareBathroom1Model((await load(path)).scene, spec);
        placed.userData.sourceAsset = path;
        bathroom1Original.add(placed);
        complete('bathroom1', placed, true);
      } });
    }
    for (const asset of bathroom2Assets) {
      const path = `公卫2漫游/public/assets/${asset.file || `${asset.id}.glb`}`;
      jobs.push({ path, run: async () => {
        const source = (await load(path)).scene;
        boundsOf(source, path);
        const specs = [asset, ...(asset.copies || []).map(copy => ({ ...asset, ...copy }))];
        for (let i = 0; i < specs.length; i++) {
          let spec = specs[i];
          // Keep the north rod endpoint at -.92 and finish 3 cm before the
          // notch's Z=.385 wall. Width is pre-yaw, just as in assets.js.
          if (spec.id === 'rod') spec = { ...spec, size: [1.275, .025, .025], pos: [.46, 2.20, -.2825] };
          if (spec.id === 'drain') spec = { ...spec, pos: [1.53, .014, .31] };
          const placed = prepareModel(source, spec);
          if (i) placed.name = `${asset.id}-copy-${i}`;
          if (asset.id === 'curtain') {
            placed.scale.x = .16;
            placed.position.z = -.89 + .89 * .16;
            placed.userData.curtainAmount = .16;
          }
          if (asset.id === 'rod' || asset.id === 'drain') placed.userData.planAdjustment = {
            reason: 'bathroom2 floorplan notch', originalSize: asset.size, originalPosition: asset.pos, size: spec.size, position: spec.pos,
          };
          boundsOf(placed, path);
          placed.userData.sourceAsset = path;
          stages.bathroom2.add(placed);
          complete('bathroom2', placed, true);
        }
      } });
    }
    async function worker() {
      while (jobs.length) {
        const job = jobs.shift();
        try { await job.run(); }
        catch (cause) { failures.push(new Error(`Utility room asset failed: ${job.path}`, { cause })); }
      }
    }
    await Promise.all([worker(), worker()]);
    if (failures.length) throw new AggregateError(failures, `${failures.length} utility room asset(s) failed`);
    succeeded = true;
    return { ...stats, kitchen: standaloneKitchen };
  } finally {
    for (const key of Object.keys(NATIVE)) {
      const root = rooms.get(key).root;
      root.add(stages[key]);
      // A rejected callback or assembly also leaves a truthful partial state.
      root.userData.utilityRoomsState = succeeded ? 'ready' : 'partial';
    }
  }
}
