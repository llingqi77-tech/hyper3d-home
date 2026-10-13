import * as THREE from "three";
import { objects, assetTargets } from "./assets.js";

const palette = {
  wall: "#eee8dc", cream: "#f4f0e8", cabinet: "#f4f1eb", cabinetInset: "#ebe6dc",
  brass: "#9a7542", stone: "#d0c8b8", metal: "#727d80", tileA: "#60483c", tileB: "#87644e",
  tileC: "#aa8b70", grout: "#d2c4b1", wood: "#9c744b", woodLight: "#bf996a", floor: "#c5ad8e",
  dark: "#343a38", towel: "#b85c78", soap: "#7da073", glow: "#ffe6ad",
};

function material(color, roughness = 0.8, metalness = 0) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

function makeDiamondTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = palette.grout;
  ctx.fillRect(0, 0, 256, 256);
  const colors = [palette.tileA, palette.tileB, palette.tileC, "#70594d"];
  for (let y = -64, row = 0; y < 320; y += 64, row++) {
    for (let x = -64, col = 0; x < 320; x += 64, col++) {
      ctx.save();
      ctx.translate(x + 32, y + 32);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = colors[(row + col * 3) % colors.length];
      ctx.fillRect(-21, -21, 42, 42);
      ctx.restore();
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2.56, 2.02);
  return texture;
}

// Match the user's kitchen close-up: terracotta and cream checkerboard.
function makeKitchenFloorTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1024;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#575c59";
  ctx.fillRect(0, 0, 1024, 1024);
  for (let row = 0; row < 2; row++) for (let col = 0; col < 2; col++) {
    const x = col * 512, y = row * 512;
    const glaze = ctx.createRadialGradient(x + 220, y + 180, 20, x + 260, y + 250, 420);
    const terracotta = (row + col) % 2 === 0;
    glaze.addColorStop(0, terracotta ? '#b38a76' : '#ddd8cc');
    glaze.addColorStop(1, terracotta ? '#936952' : '#b6b2a6');
    ctx.fillStyle = glaze; ctx.fillRect(x + 3, y + 3, 506, 506);
    ctx.strokeStyle = terracotta ? '#c6a58e' : '#e3dfd5';
    ctx.lineWidth = 2; ctx.strokeRect(x + 5, y + 5, 502, 502);
  }
  let seed = 89;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  for (let i = 0; i < 42000; i++) {
    ctx.fillStyle = random() > .5 ? "rgba(255,223,153,.035)" : "rgba(56,20,4,.025)";
    ctx.fillRect(random() * 1024, random() * 1024, random() * 9 + 1, random() * 8 + 1);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 8;
  // Two 30 cm squares per repeat, measured after the room's x/z scaling.
  texture.repeat.set(2.06 / .6, 3.08 / .6);
  return texture;
}

function makeCounterTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const ctx = c.getContext("2d");
  ctx.fillStyle = palette.stone;
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2400; i++) {
    const a = 0.04 + Math.random() * 0.16;
    ctx.fillStyle = `rgba(78,68,55,${a})`;
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 1 + Math.random() * 2, 1 + Math.random() * 2);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(2.5, 1.5);
  return t;
}

export function createKitchen(scene) {
  const root = new THREE.Group();
  root.name = "KitchenScene";
  root.scale.set(2.06 / 3.08, 1, 3.08 / 2.06);
  scene.add(root);
  const mat = {
    wall: material(palette.wall), cabinet: material(palette.cabinet, 0.72), inset: material(palette.cabinetInset),
    brass: material(palette.brass, 0.3, 0.7), wood: material(palette.wood), woodLight: material(palette.woodLight),
    tile: new THREE.MeshStandardMaterial({ map: makeDiamondTexture(), roughness: 0.95 }),
    sideTile: new THREE.MeshStandardMaterial({ map: makeDiamondTexture(), roughness: 0.95 }),
    floor: new THREE.MeshStandardMaterial({ map: makeKitchenFloorTexture(), roughness: 0.38 }),
    stone: new THREE.MeshStandardMaterial({ map: makeCounterTexture(), roughness: 0.68 }),
    metal: material(palette.metal, 0.26, 0.82), dark: material(palette.dark, 0.35, 0.45),
    ceramic: material("#c9d0d1", 0.28, 0.22), towel: material(palette.towel, 1), green: material(palette.soap, 0.35),
    glow: new THREE.MeshStandardMaterial({ color: palette.glow, emissive: palette.glow, emissiveIntensity: 1.4 }),
  };
  const groups = new Map();
  const mesh = (geo, m, x, y, z, parent = root) => {
    const o = new THREE.Mesh(geo, m);
    o.position.set(x, y, z);
    o.castShadow = true;
    o.receiveShadow = true;
    parent.add(o);
    return o;
  };
  const box = (w, h, d, m, x, y, z, parent = root) => mesh(new THREE.BoxGeometry(w, h, d), m, x, y, z, parent);
  const group = (id, position = [0, 0, 0]) => {
    const g = new THREE.Group();
    g.name = `object-${id}`;
    g.position.set(...position);
    root.add(g);
    groups.set(id, g);
    return g;
  };
  const mark = (id, title, position) => {
    const target = group(id, position);
    target.userData.objectId = id;
    target.userData.objectTitle = title;
    return target;
  };

  // x is the short stove-wall width; z is the longer east/west counter direction.
  // The floor-plan proportion is roughly 2.06 m × 3.08 m, not construction-grade.
  const floorEdge = material('#a48872');
  box(3.08, 0.12, 2.06, [floorEdge, floorEdge, mat.floor, floorEdge, floorEdge, floorEdge], 0, -0.06, 0);
  // Three rows of 6 cm mosaic squares lie flat across the dining threshold.
  const threshold = new THREE.Group();
  threshold.name = 'kitchen-dining-mosaic-threshold';
  scene.add(threshold);
  const mosaicColors = ['#2c7193', '#5da2aa', '#b5ced1', '#dfded1', '#969d73', '#b99d73'];
  box(2.06, .015, .186, material('#525957'), 0, .002, 1.445, threshold);
  for (let row = 0; row < 3; row++) for (let col = 0; col < 34; col++) {
    box(.057, .006, .057, material(mosaicColors[(col * 5 + row * 3 + Math.floor(col / 3)) % mosaicColors.length], .35),
      -1.02 + .03 + col * .06, .012, 1.385 + row * .06, threshold);
  }
  box(3.08, 0.1, 2.06, mat.wood, 0, 2.5, 0).userData.cutaway = 'roof';
  box(3.08, 2.42, 0.1, mat.tile, 0, 1.21, -0.99);
  // All three room walls are covered with the same brown diamond-pattern tile.
  box(0.1, 2.42, 1.98, mat.sideTile, -1.5, 1.21, 0).userData.cutaway = 'west';
  box(0.1, 2.42, 1.98, mat.sideTile, 1.5, 1.21, 0).userData.cutaway = 'east';
  // Wood ceiling boards.
  for (let x = -1.46; x <= 1.46; x += 0.16) box(0.012, 0.035, 2, mat.woodLight, x, 2.44, 0).userData.cutaway = 'roof';
  // Wall tiles continue behind the cabinetry and counter without backsplash patches.

  function paneledDoor(parent, x, y, z, w, h, face = "z", glass = false) {
    const plate = box(w, h, 0.035, mat.cabinet, x, y, z, parent);
    if (face === "x") plate.rotation.y = Math.PI / 2;
    const inner = box(w * 0.76, h * 0.7, 0.014, glass ? mat.ceramic : mat.inset, x, y, z + (face === "z" ? 0.024 : 0), parent);
    if (face === "x") {
      inner.position.x = x + (x > 0 ? -0.025 : 0.025);
      inner.position.z = z;
      inner.rotation.y = Math.PI / 2;
    }
    if (glass) inner.material = new THREE.MeshPhysicalMaterial({ color: "#d7dedb", roughness: 0.14, transmission: 0.28, transparent: true, opacity: 0.72 });
    const knob = mesh(new THREE.SphereGeometry(0.026, 16, 12), mat.brass, x + w * 0.31, y - h * 0.22, z + (face === "z" ? 0.035 : 0), parent);
    if (face === "x") { knob.position.x = x + (x > 0 ? -0.04 : 0.04); knob.position.z = z + w * 0.31; }
  }

  // 01 U-shaped base cabinetry and countertops.
  const base = mark("01", "U 形下柜与台面", [0, 0, 0]);
  box(2.82, 0.78, 0.56, mat.cabinet, 0, 0.4, -0.69, base);
  box(0.56, 0.78, 1.28, mat.cabinet, -1.19, 0.4, -0.03, base);
  box(0.56, 0.78, 1.28, mat.cabinet, 1.19, 0.4, -0.03, base);
  for (const x of [-1.12, -0.56, 0, 0.56, 1.12]) {
    paneledDoor(base, x, 0.42, -0.397, 0.5, 0.69);
    box(0.09, 0.015, 0.025, mat.brass, x + 0.13, 0.38, -0.365, base);
  }
  for (const z of [-0.48, -0.04, 0.4]) {
    paneledDoor(base, -0.89, 0.42, z, 0.39, 0.69, "x");
    paneledDoor(base, 0.89, 0.42, z, 0.39, 0.69, "x");
  }
  box(2.9, 0.075, 0.65, mat.stone, 0, 0.83, -0.68, base);
  box(0.65, 0.075, 1.32, mat.stone, -1.19, 0.83, -0.03, base);
  box(0.65, 0.075, 1.32, mat.stone, 1.19, 0.83, -0.03, base);
  // 02 back-wall cabinets with a glazed section on the right.
  const uppers = mark("02", "吊柜组", [0, 0, 0]);
  for (const [x, w] of [[-1.23, 0.35], [0.59, 0.46], [1.1, 0.48]]) {
    box(w, 0.62, 0.38, mat.cabinet, x, 1.91, -0.77, uppers);
    paneledDoor(uppers, x, 1.91, -0.57, w * 0.88, 0.53, "z", x > 0.85);
  }
  // Glass detail: muntins across the rightmost cabinet faces.
  for (const x of [0.99, 1.2]) box(0.018, 0.48, 0.016, mat.cabinet, x, 1.91, -0.532, uppers);
  box(0.41, 0.018, 0.016, mat.cabinet, 1.1, 1.91, -0.532, uppers);
  // 03 range hood and 04 hob.
  const hood = mark("03", "抽油烟机", [-0.58, 1.4, -0.85]);
  const hoodBody = box(0.75, 0.44, 0.32, mat.ceramic, 0, 0, 0, hood);
  hoodBody.rotation.x = -0.12;
  const hoodFace = mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.045, 32), mat.metal, 0, -0.03, 0.18, hood);
  hoodFace.rotation.x = Math.PI / 2;
  const hob = mark("04", "双头燃气灶", [-0.58, 0.89, -0.68]);
  box(0.72, 0.045, 0.48, mat.dark, 0, 0.02, 0, hob);
  for (const x of [-0.2, 0.2]) {
    mesh(new THREE.TorusGeometry(0.13, 0.016, 8, 32), mat.metal, x, 0.055, 0, hob).rotation.x = Math.PI / 2;
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2;
      box(0.045, 0.018, 0.22, mat.dark, x + Math.cos(a) * 0.07, 0.075, Math.sin(a) * 0.07, hob).rotation.y = a;
    }
  }
  // 05 double sink and 06 curved mixer tap.
  const sink = mark("05", "双槽水槽", [1.12, 0.86, 0.28]);
  box(0.54, 0.04, 0.82, mat.metal, 0, 0.02, 0, sink);
  for (const z of [-0.2, 0.2]) {
    box(0.42, 0.16, 0.34, mat.dark, 0, -0.065, z, sink);
    box(0.36, 0.012, 0.27, mat.ceramic, 0, -0.14, z, sink);
  }
  const faucet = mark("06", "水龙头", [1.12, 0.94, -0.06]);
  const tapBase = mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.08, 20), mat.metal, 0, 0, 0, faucet);
  const tapCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0.03, 0), new THREE.Vector3(0, 0.24, 0), new THREE.Vector3(0, 0.29, 0.08), new THREE.Vector3(0, 0.27, 0.25)]);
  mesh(new THREE.TubeGeometry(tapCurve, 28, 0.022, 10, false), mat.metal, 0, 0, 0, faucet);
  // 07 wood-ceiling flush light.
  const ceiling = mark("07", "厨房吸顶灯", [0, 2.38, 0]);
  mesh(new THREE.CylinderGeometry(0.24, 0.28, 0.12, 40), mat.brass, 0, 0.04, 0, ceiling);
  mesh(new THREE.CylinderGeometry(0.22, 0.24, 0.1, 40), mat.glow, 0, -0.03, 0, ceiling);
  // 08 lidded pot.
  const pot = mark("08", "带盖锅具", [-0.58, 0.99, -0.68]);
  mesh(new THREE.CylinderGeometry(0.16, 0.13, 0.2, 32), mat.metal, 0, 0.11, 0, pot);
  mesh(new THREE.TorusGeometry(0.145, 0.012, 8, 32), mat.dark, 0, 0.2, 0, pot);
  mesh(new THREE.SphereGeometry(0.13, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat.metal, 0, 0.2, 0, pot);
  mesh(new THREE.SphereGeometry(0.025, 16, 12), mat.dark, 0, 0.31, 0, pot);
  for (const s of [-1, 1]) box(0.12, 0.03, 0.035, mat.dark, s * 0.17, 0.13, 0, pot);
  // 09 oil/seasoning bottles.
  const bottles = mark("09", "油瓶与调味瓶", [-1.17, 0.91, -0.28]);
  for (const [x, h, c] of [[-0.1, 0.27, "#bd8744"], [0.02, 0.22, "#b84636"], [0.13, 0.24, "#dcbd65"]]) {
    mesh(new THREE.CylinderGeometry(0.042, 0.05, h, 18), material(c, 0.32), x, h / 2, 0, bottles);
    mesh(new THREE.CylinderGeometry(0.017, 0.022, 0.06, 12), mat.brass, x, h + 0.025, 0, bottles);
  }
  // 10 holder, 11 condiment set, 12 cutting boards.
  const utensils = mark("10", "厨具筒", [0.78, 0.9, -0.65]);
  mesh(new THREE.CylinderGeometry(0.075, 0.09, 0.2, 24), material("#b4773d"), 0, 0.1, 0, utensils);
  for (let i = 0; i < 6; i++) {
    const x = (i - 2.5) * 0.026;
    const tool = box(0.018, 0.32 + (i % 2) * 0.07, 0.018, i % 2 ? mat.wood : mat.dark, x, 0.28 + (i % 2) * 0.035, 0, utensils);
    tool.rotation.z = (i - 2.5) * 0.06;
  }
  const spices = mark("11", "调料罐与调料碟", [0.32, 0.9, -0.48]);
  for (const x of [-0.1, 0, 0.1]) {
    mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.1, 16), mat.ceramic, x, 0.05, 0, spices);
    mesh(new THREE.CylinderGeometry(0.041, 0.041, 0.015, 16), mat.wood, x, 0.105, 0, spices);
  }
  mesh(new THREE.CylinderGeometry(0.095, 0.1, 0.024, 24), mat.ceramic, 0, 0.018, 0.12, spices);
  const boards = mark("12", "砧板", [0.66, 0.91, -0.76]);
  for (let i = 0; i < 2; i++) {
    const b = box(0.24, 0.34, 0.035, i ? mat.wood : mat.woodLight, (i - 0.5) * 0.08, 0.19, (i - 0.5) * 0.045, boards);
    b.rotation.z = i ? 0.08 : -0.07;
    mesh(new THREE.TorusGeometry(0.02, 0.008, 6, 14), mat.brass, b.position.x, 0.32, 0.025 + (i - 0.5) * 0.045, boards);
  }
  // 13 wire dish rack, 14 hanging towel, 15 cleaning bottle.
  const rack = mark("13", "金属碗碟架", [1.19, 1.16, -0.55]);
  for (const x of [-0.21, 0.21]) for (const z of [-0.13, 0.13]) box(0.018, 0.3, 0.018, mat.metal, x, 0.15, z, rack);
  for (const y of [0.05, 0.3]) {
    mesh(new THREE.TorusGeometry(0.17, 0.007, 6, 32), mat.metal, 0, y, 0, rack).rotation.x = Math.PI / 2;
    for (let i = 0; i < 5; i++) box(0.012, 0.012, 0.3, mat.metal, -0.16 + i * 0.08, y, 0, rack);
  }
  for (let i = 0; i < 3; i++) mesh(new THREE.TorusGeometry(0.07, 0.008, 6, 24), mat.ceramic, -0.1 + i * 0.1, 0.37, 0, rack).rotation.x = Math.PI / 2;
  const towel = mark("14", "粉色抹布", [1.43, 1.1, -0.05]);
  const cloth = box(0.035, 0.4, 0.28, mat.towel, 0, -0.2, 0, towel);
  for (let i = 0; i < 5; i++) box(0.004, 0.39, 0.012, material("#d995a9"), 0.022, -0.2, -0.1 + i * 0.05, towel);
  const cleaner = mark("15", "清洁瓶", [1.16, 0.91, 0.57]);
  mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.19, 20), mat.green, 0, 0.095, 0, cleaner);
  mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.055, 12), mat.ceramic, 0, 0.22, 0, cleaner);
  // 16 entry lantern; placed outside the kitchen threshold, visible from the interior.
  const lantern = mark("16", "入口彩色吊灯", [0, 1.8, 1.12]);
  mesh(new THREE.CylinderGeometry(0.15, 0.19, 0.1, 28), mat.dark, 0, 0.29, 0, lantern);
  for (let i = 0; i < 6; i++) {
    const a = i * Math.PI / 3;
    const pane = mesh(new THREE.SphereGeometry(0.13, 16, 12), material(["#d13e57", "#e1a22f", "#5b9c65", "#7b4c92", "#e7d96a", "#dc7146"][i], 0.18), Math.cos(a) * 0.08, 0.13, Math.sin(a) * 0.08, lantern);
    pane.scale.set(0.8, 1, 0.45);
  }
  mesh(new THREE.CylinderGeometry(0.05, 0.13, 0.11, 20), mat.dark, 0, -0.02, 0, lantern);
  const lanternBulb = new THREE.PointLight("#ffb95f", 0.8, 2.4, 2);
  lanternBulb.position.set(0, 0.14, 0);
  lantern.add(lanternBulb);
  // Empty anchors reserve positions for separately generated new assets.
  mark('17', '水槽上方双门吊柜', [1.22, 1.9, .25]);
  mark('18', '高压锅', [-.17, 1.02, -.66]);

  const amb = new THREE.HemisphereLight("#ffffff", "#8b8377", 1.5);
  scene.add(amb);
  const sun = new THREE.DirectionalLight("#fffaf1", 1.8);
  sun.position.set(-2.5 * (2.06 / 3.08), 4.6, 3.7 * (3.08 / 2.06));
  sun.castShadow = true;
  sun.shadow.mapSize.set(1536, 1536);
  sun.shadow.camera.left = -3.5; sun.shadow.camera.right = 3.5; sun.shadow.camera.top = 3.5; sun.shadow.camera.bottom = -3.5;
  scene.add(sun);
  const ceilingGlow = new THREE.PointLight("#ffe8bd", 1.3, 4, 2);
  ceilingGlow.position.set(0, 2.2, 0.1 * (3.08 / 2.06));
  scene.add(ceilingGlow);
  root.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });

  const models = new Map();
  const picks = [];
  for (const [id, g] of groups) {
    g.userData.objectId = id;
    const item = objects.find((x) => x.id === id);
    if (item) {
      g.userData.objectTitle = item.name;
      picks.push(g);
    }
  }
  return { root, groups, picks, models, materials: mat, lights: { amb, sun, ceilingGlow, lanternBulb }, objects, assetTargets };
}
