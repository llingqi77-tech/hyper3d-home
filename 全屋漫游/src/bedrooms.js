import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// Coordinates stay in the standalone rooms' metres, Y up, centre of floor at origin.
// Build off-tree: Box3 fitting must not see the parent's global rotations/scales.
const DIMENSIONS = {
  master: { width: 5.08, depth: 3.25, height: 2.72 },
  children: { width: 3.66, depth: 3.63, height: 2.72 },
  guest: { width: 3.80, depth: 3.20, height: 2.72 },
  junction: { width: 2.55, depth: 2.10, height: 2.72 },
};
const MASTER_ASSETS = '主卧漫游/public/assets/';
const CHILDREN_ASSETS = '儿童房漫游/public/models/';
const GUEST_ASSETS = '客房漫游/dist/models/';
const JUNCTION_ASSETS = '三门交汇区漫游/public/assets/';

function shadows(group, doubleSide = false) {
  group.traverse(object => {
    if (!object.isMesh) return;
    object.castShadow = true;
    object.receiveShadow = true;
    if (doubleSide && object.material) {
      for (const material of [].concat(object.material)) material.side = THREE.DoubleSide;
    }
  });
  return group;
}

function bounds(object) {
  object.updateWorldMatrix(true, true);
  const box = new THREE.Box3().setFromObject(object);
  if (box.isEmpty()) throw new Error(`Empty model: ${object.name}`);
  return box;
}

function measure(object) {
  const box = bounds(object);
  const size = box.getSize(new THREE.Vector3());
  if (![size.x, size.y, size.z].every(value => Number.isFinite(value) && value > 0)) {
    throw new Error(`Invalid model dimensions: ${object.name}`);
  }
  return { box, size, center: box.getCenter(new THREE.Vector3()) };
}

function placement(model, name, position, yaw = 0) {
  const group = new THREE.Group();
  group.name = name;
  group.position.fromArray(position);
  group.rotation.y = yaw;
  group.add(model);
  return shadows(group);
}

// Children/junction source convention: scale in model axes, then rotate the anchor.
function fitModel(model, dimensions, uniform = false) {
  const { box, size, center } = measure(model);
  const fit = new THREE.Vector3(...dimensions).divide(size);
  if (uniform) fit.setScalar(Math.min(fit.x, fit.y, fit.z));
  model.scale.multiply(fit);
  model.position.set(-center.x * fit.x, -box.min.y * fit.y, -center.z * fit.z);
  return model;
}

function requiredObject(group, name) {
  const object = group.getObjectByName(name);
  if (!object) throw new Error(`Missing required node "${name}" in ${group.name}`);
  return object;
}

/**
 * Populate only furniture, lights' GLBs and actual window fittings.
 * Returns the number of successfully placed GLB instances (31 on full success).
 * Each supplied root gets assetCount and nativeDimensions; procedural guest
 * furniture/window fittings are deliberately not counted as loaded GLBs.
 * Partial loads remain inspectable; every failure is collected in AggregateError.
 */
export async function populateBedrooms({ rooms, assetUrl, onProgress = () => {} }) {
  if (!(rooms instanceof Map)) throw new TypeError('populateBedrooms: rooms must be a Map');
  if (typeof assetUrl !== 'function' || typeof onProgress !== 'function') {
    throw new TypeError('populateBedrooms: assetUrl and onProgress must be functions');
  }
  const loader = new GLTFLoader();
  const errors = [];
  let count = 0;

  async function attempt(label, task) {
    try { return await task(); }
    catch (cause) {
      errors.push(new Error(`${label}: ${cause?.message || String(cause)}`, { cause }));
      return null;
    }
  }

  async function populate(key, builder) {
    const root = rooms.get(key)?.root;
    if (!root?.isGroup) {
      errors.push(new Error(`${key}: rooms.get('${key}').root must be a THREE.Group`));
      return;
    }
    const content = new THREE.Group();
    content.name = `${key}-bedrooms-content`;
    content.userData.nativeDimensions = { ...DIMENSIONS[key] };
    root.userData.nativeDimensions = { ...DIMENSIONS[key] };
    root.userData.assetCount = 0;
    root.userData.coordinateSystem = 'metres; Y up; local X east, local +Z south; floor centre origin';

    const report = (group, label, path) => {
      group.userData.assetPath = path;
      content.add(group);
      root.userData.assetCount++;
      count++;
      onProgress(`${key}: ${label}`);
      return group;
    };
    const load = (path, label, make) => attempt(`${key}/${label} (${path})`, async () => {
      const url = assetUrl(path);
      if (!url) throw new Error('assetUrl returned no URL');
      const source = (await loader.loadAsync(url)).scene;
      measure(source);
      return report(await make(source), label, path);
    });
    await attempt(`${key}/assembly`, () => builder({ root, content, load, report, attempt }));
    root.add(content);
  }

  // At most four room loaders are active; room-internal loads are sequential.
  await Promise.all([
    populate('master', buildMaster),
    populate('children', buildChildren),
    populate('guest', buildGuest),
    populate('junction', buildJunction),
  ]);
  if (errors.length) {
    const error = new AggregateError(errors, `populateBedrooms: ${errors.length} failure(s)\n${errors.map(e => e.message).join('\n')}`);
    error.assetCount = count;
    throw error;
  }
  return count;
}

async function buildMaster({ root, content, load, report, attempt }) {
  // Latest 主卧漫游/src/main.js: retain +X-facing doors and all post-fit shifts.
  const models = new Map();
  const specs = [
    ['wardrobe', '后墙左侧四门衣柜', [0, 0, 0]],
    ['bed', '木床与绿色床品', [-.05, 0, -.425], -Math.PI / 2],
    ['nightstand', '床头柜一', [-1.21, 0, -1.385]],
    ['nightstand', '床头柜二', [1.11, 0, -1.385]],
    ['slidingDoor', '四扇玻璃推拉门', [2.505, 0, 0], Math.PI / 2],
    ['children-curtains', '儿童房同款窗帘', [2.30, .04, 0], -Math.PI / 2],
    ['desk', '右下角木质书桌', [1.65, 0, 1.28]],
  ];
  for (const [id, name, position, yaw = 0] of specs) {
    const model = await load(`${MASTER_ASSETS}${id}.glb`, name, source => {
      if (id === 'children-curtains') {
        const cloths = [];
        source.traverse(o => { if (o.isMesh && o.geometry.getAttribute('color')) cloths.push(o); });
        if (cloths.length !== 2) throw new Error(`Expected two curtain cloths, got ${cloths.length}`);
        for (const cloth of cloths) {
          const panel = new THREE.Group();
          const offset = cloth.position.x;
          panel.name = offset < 0 ? 'curtain-left' : 'curtain-right';
          panel.position.x = offset;
          cloth.parent.add(panel);
          panel.add(cloth);
          cloth.position.x = 0;
        }
      }
      source.name = name;
      source.position.fromArray(position);
      source.rotation.y = yaw;
      if (id === 'wardrobe') {
        const box = bounds(source);
        source.position.x += -2.54 - box.min.x;
        source.position.z += -1.625 - box.min.z;
      }
      if (id === 'children-curtains') {
        source.scale.set(3.10 / 1.98, 2.25 / 1.76, 1);
        for (const [panelName, side] of [['curtain-left', -1], ['curtain-right', 1]]) {
          const panel = requiredObject(source, panelName);
          panel.position.x = side * 1.00;
          panel.scale.x = .5;
        }
        source.userData.open = true;
      }
      if (id === 'slidingDoor') {
        requiredObject(source, 'slider-1').position.x = -.78;
        requiredObject(source, 'slider-2').position.x = .78;
        source.userData.open = true;
      }
      return shadows(source);
    });
    if (model) models.set(id === 'nightstand' ? name : id, model);
  }

  const wardrobe = models.get('wardrobe'), bed = models.get('bed');
  const left = models.get('床头柜一'), right = models.get('床头柜二');
  await attempt('master/wardrobe-bed-nightstand fit', () => {
    if (!(wardrobe && bed && left && right)) throw new Error('Wardrobe, bed and both nightstands are required for the final fit');
    const bedBounds = bounds(bed), old = bounds(wardrobe);
    wardrobe.scale.z *= (bedBounds.max.z - bedBounds.min.z) / (old.max.z - old.min.z);
    const resized = bounds(wardrobe);
    wardrobe.position.z += bedBounds.min.z - resized.min.z;
    const face = bounds(requiredObject(wardrobe, '柜门饰板1'));
    const top = bounds(requiredObject(left, '床头柜台面'));
    const shiftX = face.max.x - top.min.x;
    for (const group of [bed, left, right]) group.position.x += shiftX;
    content.updateMatrixWorld(true);
    root.userData.masterFit = { bedShiftX: shiftX, wardrobeDoorsFace: '+X', wardrobeMatchesBedLength: true, touchesLeftNightstand: true };
  });

  // Fit the checked source pendant once; report each of its two placed instances.
  let pendantTemplate;
  const pendantPath = `${MASTER_ASSETS}pendant.glb`;
  const first = await load(pendantPath, '公卫2同款床头吊灯1', source => {
    if (!left) throw new Error('Left nightstand is required to place its pendant');
    const { box, size, center } = measure(source);
    const fit = new THREE.Group();
    fit.add(source);
    source.scale.set(.21 / size.x, .63 / size.y, .21 / size.z);
    source.position.set(-center.x * source.scale.x, -box.min.y * source.scale.y, -center.z * source.scale.z);
    pendantTemplate = fit;
    return placement(fit, '公卫2同款床头吊灯1', [left.position.x, 1.86, -1.385]);
  });
  if (first) await attempt('master/公卫2同款床头吊灯2', () => {
    if (!right) throw new Error('Right nightstand is required to place its pendant');
    const lamp = placement(pendantTemplate.clone(true), '公卫2同款床头吊灯2', [right.position.x, 1.86, -1.385]);
    report(lamp, lamp.name, pendantPath);
  });
  root.userData.balconyOpening = { side: '+X', plane: 2.54, start: -1.55, end: 1.55, height: 2.32, sliderOpen: true, curtainOpen: true };
  root.userData.entryOpening = { side: '+Z', start: -2.45, end: -1.55 };
}

async function buildChildren({ root, content, load }) {
  // The plan's new south-west door needs a full inward landing. Keep the rear
  // cabinet edge at -1.67, shorten its run by .75 and move its centre by -.375.
  // Its front edge is now +.82, .995 m behind the +1.815 door plane.
  const specs = [
    { id: 'wardrobe', size: [2.49, 2.38, .55], position: [-1.485, 0, -.425], yaw: Math.PI / 2 },
    { id: 'desk', size: [.98, .75, .55], position: [1.49, 0, -1.25], yaw: -Math.PI / 2 },
    { id: 'bunk-bed-v2', position: [1.08, 0, .48], yaw: -Math.PI / 2 },
    { id: 'wood-chair', position: [.82, 0, -1.25], yaw: Math.PI / 2 },
    { id: 'mountain-bike', position: [-.63, 0, -.70], yaw: Math.PI / 2 },
    { id: 'ceiling-light', size: [.46, .20, .46], position: [0, 2.52, 0] },
    { id: 'curtains', position: [.24, .70, -1.73] },
  ];
  for (const spec of specs) await load(`${CHILDREN_ASSETS}${spec.id}.glb`, spec.id, source => {
    const model = new THREE.Group();
    if (spec.id === 'ceiling-light') source.rotation.x = Math.PI / 2;
    if (spec.id === 'desk') source.traverse(object => {
      if (object.isMesh) for (const material of [].concat(object.material)) material.color.multiply(new THREE.Color('#bd946e'));
    });
    model.add(source);
    if (spec.size) fitModel(model, spec.size);
    return placement(model, spec.id, spec.position, spec.yaw);
  });
  buildChildrenBay(content);
  root.userData.entryOpening = { side: '+Z', plane: 1.815, start: -1.83, end: -1.11 };
  root.userData.entryClearance = { min: [-1.83, 0, .92], max: [-1.11, 2.14, 1.815] };
  root.userData.wardrobeAdaptation = {
    originalLength: 3.24, length: 2.49, rearZ: -1.67, frontZ: .82,
    reason: 'Retain west-wall wardrobe and original bed/desk/bike; clear the relocated south-west door and inward swing.',
  };
  root.userData.windowOpening = { side: '-Z', center: .24, width: 1.60, sill: .70, head: 2.35, bayDepth: .70 };
}

const material = (color, roughness = .7, metalness = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });

function box(parent, name, size, position, mat, radius = 0) {
  const geometry = radius
    ? new RoundedBoxGeometry(...size, 2, Math.min(radius, ...size.map(v => v / 4)))
    : new THREE.BoxGeometry(...size);
  const mesh = new THREE.Mesh(geometry, mat);
  mesh.name = name;
  mesh.position.fromArray(position);
  mesh.castShadow = mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function buildChildrenBay(content) {
  // Only the actual outward window recess from 儿童房/src/room.js, no shell/sky.
  const bay = new THREE.Group();
  bay.name = 'children-window-bay';
  content.add(bay);
  const white = material('#f5f1e8', .75);
  const glass = new THREE.MeshPhysicalMaterial({ color: '#d5eaf1', transparent: true, opacity: .20, roughness: .12, side: THREE.DoubleSide, depthWrite: false });
  const z = -3.63 / 2, windowX = .24, width = 1.60, left = windowX - width / 2;
  for (const y of [.70, 2.35]) box(bay, '飘窗窗台', [1.72, .10, .83], [windowX, y, z - .35 + .015], white);
  for (const x of [left, windowX + width / 2]) {
    box(bay, '飘窗外角框', [.065, 1.60, .065], [x, 1.55, z - .69], white);
    box(bay, '飘窗侧玻璃', [.04, 1.60, .70], [x, 1.55, z - .35], glass);
  }
  box(bay, '飘窗正面玻璃', [width, 1.60, .018], [windowX, 1.55, z - .69], glass);
  for (let i = 0; i <= 3; i++) box(bay, '飘窗竖框', [.034, 1.60, .045], [left + i * width / 3, 1.55, z - .70], white);
  for (const y of [.77, 1.55, 2.33]) box(bay, '飘窗横框', [width, .034, .045], [windowX, y, z - .70], white);
}

// These two textures reproduce the standalone guest's deterministic canvas
// stripes in raw pixels, so importing/populating this module needs no DOM.
function guestTexture(type) {
  const size = 1024, pixels = new Uint8Array(size * size * 4);
  const fill = (x, y, w, h, color) => {
    for (let row = y; row < Math.min(y + h, size); row++) {
      for (let col = x; col < Math.min(x + w, size); col++) {
        const i = (row * size + col) * 4;
        pixels[i] = color[0]; pixels[i + 1] = color[1]; pixels[i + 2] = color[2]; pixels[i + 3] = 255;
      }
    }
  };
  if (type === 'bamboo') {
    fill(0, 0, size, size, [183, 139, 71]);
    let seed = 42;
    for (let x = 0; x < size; x += 5) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      const color = seed / 4294967296 > .5 ? [197, 154, 83] : [173, 125, 62];
      fill(x, 0, 3, size, color);
      fill(x + 4, 0, 1, size, [Math.round(183 * .8 + 64 * .2), Math.round(139 * .8 + 40 * .2), Math.round(71 * .8 + 18 * .2)]);
    }
    for (let y = 0; y < size; y += 128) fill(0, y, size, 2, [158, 121, 63]);
  } else {
    fill(0, 0, size, size, [222, 211, 181]);
    for (let x = 0; x < size; x += 60) {
      fill(x, 0, 3, size, [168, 159, 132]); fill(0, x, size, 3, [168, 159, 132]);
      fill(x + 8, 0, 4, size, [244, 234, 209]); fill(0, x + 8, size, 4, [244, 234, 209]);
    }
    fill(0, 0, size, 260, [127, 149, 161]);
    fill(0, 250, size, 12, [184, 161, 108]);
  }
  const texture = new THREE.DataTexture(pixels, size, size);
  texture.name = `guest-${type}`;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.flipY = true;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}

function buildGuestFurniture(content) {
  // Direct geometry/placements from 客房漫游/dist/app.js, including the widened
  // bed and west-wall bookcase. The original room shell and entry door are omitted.
  const ivory = material('#e9dfc7'), edge = material('#f5eedc');
  const brass = material('#98825c', .3, .65), dark = material('#282d28');
  const part = (parent, w, h, d, x, y, z, mat = ivory, radius = .005) => box(parent, parent.name, [w, h, d], [x, y, z], mat, radius);
  const group = name => { const g = new THREE.Group(); g.name = name; content.add(g); return g; };
  const knob = (x, y, z, parent) => {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(.014, 12, 8), brass);
    mesh.name = '圆形金属拉手'; mesh.position.set(x, y, z); parent.add(mesh);
  };
  const win = group('window');
  const glass = new THREE.MeshPhysicalMaterial({ color: '#cee3e5', transparent: true, opacity: .21, roughness: .08, metalness: .08, side: THREE.DoubleSide });
  part(win, 1.62, 1.46, .06, -.91, 1.70, -1.61, glass, 0);
  for (const x of [-1.72, -.91, -.1]) part(win, .035, 1.49, .07, x, 1.70, -1.58, dark);
  for (const y of [.96, 2.44]) part(win, 1.66, .035, .07, -.91, y, -1.58, dark);
  part(win, 1.75, .055, .19, -.91, .94, -1.52, edge);
  const curtainMat = new THREE.MeshStandardMaterial({ map: guestTexture('curtain'), roughness: 1, side: THREE.DoubleSide });
  for (const cx of [-1.60, -.22]) {
    const rows = 60, cols = 30, positions = [], uv = [], indices = [];
    for (let iy = 0; iy <= rows; iy++) {
      const t = iy / rows, y = 2.46 - t * 1.49;
      const width = .44 - .28 * Math.exp(-Math.pow((t - .66) / .15, 2));
      for (let ix = 0; ix <= cols; ix++) {
        const u = ix / cols;
        positions.push(cx + (u - .5) * width, y, -1.40 + Math.cos(u * Math.PI * 12) * .035);
        uv.push(u, 1 - t);
      }
    }
    for (let iy = 0; iy < rows; iy++) for (let ix = 0; ix < cols; ix++) {
      const a = iy * (cols + 1) + ix, b = a + cols + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geometry.setIndex(indices); geometry.computeVertexNormals();
    const curtain = new THREE.Mesh(geometry, curtainMat); curtain.name = '灰蓝米色拼接窗帘'; curtain.castShadow = true; win.add(curtain);
    part(win, .20, .04, .09, cx, 1.48, -1.37, material('#baa16a'));
  }
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(.014, .014, 1.9, 20), brass);
  rod.name = '窗帘杆'; rod.position.set(-.91, 2.49, -1.42); rod.rotation.z = Math.PI / 2; rod.castShadow = true; win.add(rod);

  const desk = group('desk');
  part(desk, 1.99, .055, .66, -.905, .77, -1.24, edge, .012);
  for (const x of [-1.84, -.03]) part(desk, .065, .72, .58, x, .38, -1.26);
  part(desk, .43, .61, .57, -.145, .43, -1.26);
  for (let i = 0; i < 3; i++) { part(desk, .39, .18, .027, -.145, .25 + i * .19, -.96, edge); knob(-.145, .25 + i * .19, -.938, desk); }
  part(desk, .43, .18, .57, -1.61, .65, -1.26);
  part(desk, .39, .15, .027, -1.61, .65, -.96, edge); knob(-1.61, .65, -.938, desk);
  part(desk, 1.1, .035, .43, -1.0, .62, -.93, edge);
  part(desk, 1.1, .075, .025, -1.0, .60, -.70);

  const bookcase = group('bookcase');
  const bcX = -1.70, bcZ = -.55, bcH = 2.62, bcL = 2.04, bcT = .045, bcDepth = .40, bcY = bcH / 2;
  part(bookcase, .025, bcH, bcL, bcX - bcDepth / 2 + .013, bcY, bcZ);
  for (const z of [bcZ - bcL / 2 + .018, bcZ + bcL / 2 - .018]) part(bookcase, bcDepth - .025, bcH, .036, bcX, bcY, z, edge);
  part(bookcase, bcDepth, .075, bcL + .025, bcX, bcH - .038, bcZ);
  part(bookcase, bcDepth, .075, bcL + .025, bcX, .04, bcZ);
  for (let row = 1; row < 5; row++) part(bookcase, bcDepth, .045, bcL, bcX, .04 + row * (bcH - .08) / 5, bcZ, edge);
  for (let col = 1; col < 5; col++) part(bookcase, bcDepth, .04, bcT, bcX, bcY, bcZ - bcL / 2 + col * bcL / 5, edge);
  const spineMats = ['#f3ead7', '#ded9cb', '#e5e0d5', '#c8c2d0', '#a7b2a1', '#d8c3a3'].map(c => material(c, .9));
  for (let row = 0; row < 4; row++) for (let col = 0; col < 5; col++) for (let n = 0; n < 6; n++) {
    const height = .30 + (n % 3) * .045, width = .030 + (n % 2) * .008;
    part(bookcase, .026, height, width, bcX + bcDepth / 2 - .012, .12 + row * .62 + height / 2, bcZ - bcL / 2 + col * bcL / 5 + .045 + n * .053, spineMats[(row + col + n) % spineMats.length], .003);
  }

  const cabinet = group('cabinet');
  part(cabinet, 1.79, .72, .64, .995, .38, -1.26);
  part(cabinet, 1.84, .055, .68, .995, .77, -1.25, edge);
  for (let i = 0; i < 3; i++) { part(cabinet, .48, .20, .026, .39, .20 + i * .225, -.925, edge); knob(.39, .20 + i * .225, -.905, cabinet); }
  for (const x of [.95, 1.56]) {
    part(cabinet, .58, .66, .028, x, .41, -.925, edge);
    part(cabinet, .51, .57, .012, x, .41, -.905);
    knob(x + (x < 1.2 ? .22 : -.22), .44, -.885, cabinet);
  }
  const shelf = group('shelf');
  for (const [x, y] of [[1.05, .80], [1.50, .80], [1.50, 1.25]]) {
    part(shelf, .43, .025, .30, x, y, -1.29, edge);
    part(shelf, .43, .025, .30, x, y + .43, -1.29, edge);
    for (const xx of [x - .215, x + .215]) part(shelf, .025, .43, .30, xx, y + .215, -1.29, edge);
    part(shelf, .43, .43, .018, x, y + .215, -1.44);
  }
  const bed = group('bed');
  const bx = 1.055, bz = .275, bw = 1.61, bl = 2.35;
  part(bed, bw, .30, bl, bx, .20, bz, ivory, .018);
  for (const x of [bx - bw / 2 + .035, bx + bw / 2 - .035]) part(bed, .07, .40, bl + .03, x, .25, bz, edge, .012);
  part(bed, bw + .04, .42, .065, bx, .25, bz + bl / 2, edge);
  part(bed, bw - .12, .29, .015, bx, .23, bz + bl / 2 + .039);
  part(bed, bw - .14, .055, bl - .10, bx, .393, bz, material('#e5dbba'), .012);
  part(bed, bw - .16, .016, bl - .11, bx, .43, bz, new THREE.MeshStandardMaterial({ map: guestTexture('bamboo'), roughness: .8 }), .003);
}

async function buildGuest({ root, content, load }) {
  buildGuestFurniture(content);
  // Actual manifest IDs/files; no replacement furniture GLBs. The checked files
  // have no required compression extensions (standalone's Draco setup is unused).
  const specs = [
    ['chair', [.60, .94, .59], [-.99, 0, -.28], Math.PI],
    ['lamp', [.70, .63, .70], [-.20, 2.08, -.1]],
    ['fan', [.22, .29, .15], [.40, .801, -1.18]],
    ['bamboo', [.30, .65, .25], [-.02, .801, -1.37]],
    ['cactus', [.11, .18, .11], [-.57, .801, -1.14]],
    ['quilt', [.68, .24, .48], [.77, .445, -.62]],
    ['pillow', [.58, .16, .39], [1.47, .445, -.62]],
    ['monitor', [.46, .37, .18], [-1.22, .801, -1.35]],
    ['keyboard', [.43, .03, .15], [-1.05, .64, -.93]],
    ['pencils', [.085, .17, .085], [-.80, .801, -1.16]],
    ['books', [.25, .085, .17], [-.29, .801, -1.14]],
  ];
  for (const [id, dimensions, position, yaw = 0] of specs) await load(`${GUEST_ASSETS}${id}.glb`, id, source => {
    // Preserve guest assetfit exactly: translate source BEFORE scaling wrapper.
    const { box, size, center } = measure(source);
    source.position.sub(new THREE.Vector3(center.x, box.min.y, center.z));
    const normalized = new THREE.Group();
    normalized.add(source);
    normalized.scale.set(dimensions[0] / Math.max(size.x, .001), dimensions[1] / Math.max(size.y, .001), dimensions[2] / Math.max(size.z, .001));
    return shadows(placement(normalized, id, position, yaw), true);
  });
  root.userData.planDimensions = { width: 2.94, depth: 3.30 };
  root.userData.suggestedPlanScale = { x: 2.94 / 3.80, y: 1, z: 3.30 / 3.20 };
  root.userData.windowOpening = { side: '-Z', center: -.91, width: 1.62, sill: .97, head: 2.42 };
  root.userData.entryOpening = { side: '+Z', start: -1.80, end: -.68, height: 2.72 };
}

async function buildJunction({ root, load }) {
  const specs = [
    ['junction-cabinet', [.96, 1.09, .38], [1.025, 0, -.40], -Math.PI / 2, false],
    ['junction-pendant', [.34, .65, .34], [0, 2.05, -.10], 0, true],
    ['junction-painting-left', [.40, .45, .035], [-1.16, 1.54, -1.93], Math.PI / 2, false],
    ['junction-painting-right', [.43, .57, .035], [1.16, 1.50, -.64], -Math.PI / 2, false],
  ];
  for (const [id, dimensions, position, yaw, uniform] of specs) await load(`${JUNCTION_ASSETS}${id}.glb`, id, source => placement(fitModel(source, dimensions, uniform), id, position, yaw));
  root.userData.layoutNote = 'Four original assets in native 2.55 x 2.10 m coordinates; parent fits the irregular global hall.';
}
