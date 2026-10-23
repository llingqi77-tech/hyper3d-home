import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

// Exact local copy of 客厅漫游/src/room.js + materials.js, scoped per factory.
// This preserves the standalone's first-load PRNG sequence for every instance.
// main.js supplies the initial day lighting. No environment map was present.
export async function createLiving({assetUrl,onProgress=()=>{},renderer}) {
if(typeof assetUrl!=="function")throw new TypeError("createLiving requires assetUrl(repoPath)");
let seed = 1807;
function random() {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
}
function canvasTexture(size, paint, rx = 1, ry = 1) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  paint(c.getContext("2d"), size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rx, ry);
  t.anisotropy = 8;
  return t;
}
function makeMaterials() {
  const woodTex = canvasTexture(
    512,
    (c, s) => {
      c.fillStyle = "#6c4229";
      c.fillRect(0, 0, s, s);
      for (let i = 0; i < 1800; i++) {
        const y = random() * s;
        c.strokeStyle = `rgba(${random() > 0.5 ? "221,171,104" : "27,13,6"},${random() * 0.18})`;
        c.lineWidth = random() * 2 + 0.3;
        c.beginPath();
        for (let x = 0; x <= s; x += 8) {
          const yy = y + Math.sin(x / 45 + y) * 1.8;
          if (x === 0) c.moveTo(x, yy);
          else c.lineTo(x, yy);
        }
        c.stroke();
      }
      for (let j = 0; j < 8; j++) {
        c.strokeStyle = "#311e1222";
        c.beginPath();
        c.ellipse(
          random() * s,
          random() * s,
          30 + random() * 70,
          2 + random() * 4,
          0,
          0,
          Math.PI * 2,
        );
        c.stroke();
      }
    },
    2,
    2,
  );
  const floral = canvasTexture(1024, (c, s) => {
    c.fillStyle = "#ece3c9";
    c.fillRect(0, 0, s, s);
    for (let row = -1; row < 5; row++)
      for (let col = -1; col < 5; col++) {
        const x = col * 260 + (row % 2) * 120 + random() * 45,
          y = row * 255 + random() * 65;
        c.save();
        c.translate(x, y);
        c.rotate(random() * 6.28);
        for (let i = 0; i < 8; i++) {
          const a = i * 0.86;
          c.save();
          c.rotate(a);
          c.strokeStyle = "#7b7e5044";
          c.lineWidth = 3;
          c.beginPath();
          c.moveTo(0, 0);
          c.quadraticCurveTo(32, -30, 95, 10);
          c.stroke();
          c.fillStyle = ["#717553", "#8b8960", "#a2a081"][i % 3];
          c.beginPath();
          c.ellipse(65, 4, 26, 10, -0.4, 0, 6.28);
          c.fill();
          c.strokeStyle = "#d9d3b255";
          c.beginPath();
          c.moveTo(45, 7);
          c.lineTo(85, -1);
          c.stroke();
          c.restore();
        }
        for (let b = 0; b < 3; b++) {
          c.save();
          c.translate((b - 1) * 38, b === 1 ? -30 : 8);
          const palette = [
            "#9b5e59",
            "#b5796d",
            "#c0927e",
            "#d0aa91",
            "#864f49",
          ];
          for (let i = 0; i < 42; i++) {
            let a = i * 2.4,
              r = 36 * (1 - i / 45);
            c.fillStyle = palette[i % 5];
            c.beginPath();
            c.ellipse(
              Math.cos(a) * r,
              Math.sin(a) * r,
              16 - i * 0.18,
              11 - i * 0.1,
              a,
              0,
              6.28,
            );
            c.fill();
          }
          c.restore();
        }
        c.restore();
      }
    for (let i = 0; i < 180000; i++) {
      c.fillStyle = random() > 0.5 ? "#fff1" : "#4437170c";
      c.fillRect(random() * s, random() * s, 1, 1);
    }
    for (let i = 0; i < s; i += 3) {
      c.fillStyle = "#fff1";
      c.fillRect(0, i, s, 1);
      c.fillRect(i, 0, 1, s);
    }
  });
  const tile = canvasTexture(
    1024,
    (c, s) => {
      c.fillStyle = "#b38b62";
      c.fillRect(0, 0, s, s);
      const g = c.createRadialGradient(460, 400, 50, 512, 512, 750);
      g.addColorStop(0, "#bc8e5f");
      g.addColorStop(1, "#8e603e");
      c.fillStyle = g;
      c.beginPath();
      c.moveTo(110, 10);
      c.lineTo(914, 10);
      c.lineTo(1014, 110);
      c.lineTo(1014, 914);
      c.lineTo(914, 1014);
      c.lineTo(110, 1014);
      c.lineTo(10, 914);
      c.lineTo(10, 110);
      c.closePath();
      c.fill();
      c.strokeStyle = "#d3b589";
      c.lineWidth = 6;
      c.stroke();
      c.strokeStyle = "#d4ad7550";
      c.lineWidth = 2;
      for (let i = 0; i < 18; i++) {
        c.beginPath();
        c.moveTo(120 + i * 2, 22 + i * 2);
        c.lineTo(900 - i * 2, 22 + i * 2);
        c.stroke();
      }
      for (let i = 0; i < 45000; i++) {
        c.fillStyle = random() > 0.5 ? "#ffe8aa08" : "#41220608";
        c.fillRect(random() * s, random() * s, random() * 12, 1);
      }
      for (const x of [0, s])
        for (const y of [0, s]) {
          c.save();
          c.translate(x, y);
          c.rotate(Math.PI / 4);
          c.fillStyle = "#e0cf9f";
          c.fillRect(-70, -70, 140, 140);
          c.strokeStyle = "#786548";
          c.lineWidth = 5;
          c.strokeRect(-53, -53, 106, 106);
          for (let a = 0; a < 4; a++) {
            c.rotate(Math.PI / 2);
            c.fillStyle = "#817e59";
            c.beginPath();
            c.ellipse(25, 0, 18, 9, 0, 0, 6.28);
            c.fill();
          }
          c.restore();
        }
    },
    10,
    14,
  );
  const plaster = canvasTexture(
    256,
    (c, s) => {
      c.fillStyle = "#f2ecdd";
      c.fillRect(0, 0, s, s);
      for (let i = 0; i < 18000; i++) {
        c.fillStyle = random() > 0.5 ? "#fff2" : "#85755d12";
        c.fillRect(random() * s, random() * s, 1, 1);
      }
    },
    5,
    4,
  );
  const mat = (color, roughness = 0.8, extra = {}) =>
    new THREE.MeshStandardMaterial({ color, roughness, ...extra });
  return {
    wood: mat("#ffffff", 0.47, { map: woodTex }),
    woodLight: mat("#c5a271", 0.6, { map: woodTex }),
    wall: mat("#fff7e8", 0.9, {
      map: plaster,
      bumpMap: plaster,
      bumpScale: 0.018,
    }),
    trim: mat("#f8f1df"),
    cream: mat("#e7dcc1"),
    sage: mat("#979c68"),
    darkSage: mat("#566447"),
    fabric: mat("#ffffff", 0.96, {
      map: floral,
      bumpMap: floral,
      bumpScale: 0.013,
    }),
    tile: mat("#ffffff", 0.62, { map: tile }),
    brass: mat("#a38843", 0.36, { metalness: 0.73 }),
    metal: mat("#302e22", 0.52, { metalness: 0.5 }),
    paper: mat("#e9e4cd"),
    red: mat("#a83724", 0.42),
    ceramic: mat("#eee7d5", 0.22),
    green: mat("#597640", 0.71),
    soil: mat("#37291b"),
    glass: mat("#819a85", 0.2, { transparent: true, opacity: 0.22 }),
    curtain: mat("#a8ad84", 1),
    linen: mat("#ebe3c9", 1),
    bulb: mat("#fff6d6", 0.4, { emissive: "#ffda88", emissiveIntensity: 1.5 }),
  };
}
function paintingTexture(kind = 0) {
  return canvasTexture(512, (c, s) => {
    c.fillStyle = kind ? "#cad6c5" : "#c1c6ad";
    c.fillRect(0, 0, s, s);
    c.fillStyle = "#ede2ba";
    c.fillRect(150, 120, 245, 350);
    c.fillStyle = "#938b69";
    c.fillRect(235, 200, 86, 250);
    c.fillStyle = "#344a39";
    c.fillRect(254, 230, 50, 205);
    c.fillStyle = "#f3ebd0";
    for (let i = 0; i < 8; i++) c.fillRect(158, 130 + i * 45, 60, 4);
    c.fillStyle = "#68784c";
    for (let i = 0; i < 650; i++) {
      const x = random() * s,
        y = random() * s * 0.7;
      if (x < 160 || x > 365 || y < 145) {
        c.fillStyle = ["#456045", "#7c8954", "#b6b37a", "#92a267"][i % 4];
        c.fillRect(x, y, 6 + random() * 20, 6 + random() * 20);
      }
    }
    c.fillStyle = "#aaa184";
    c.beginPath();
    c.moveTo(0, 512);
    c.lineTo(250, 400);
    c.lineTo(512, 445);
    c.lineTo(512, 512);
    c.fill();
    c.strokeStyle = "#646750";
    for (let i = 0; i < 40; i++) {
      c.beginPath();
      c.moveTo(random() * 512, 430 + random() * 82);
      c.lineTo(random() * 512, 430 + random() * 82);
      c.stroke();
    }
  });
}

function createRoom(scene) {
  const m = makeMaterials(),
    root = new THREE.Group();
  scene.add(root);
  const colliders = [],
    lamps = [];
  const mesh = (geo, mat, x = 0, y = 0, z = 0, p = root) => {
    const o = new THREE.Mesh(geo, mat);
    o.position.set(x, y, z);
    o.castShadow = true;
    o.receiveShadow = true;
    p.add(o);
    return o;
  };
  const box = (w, h, d, mat, x, y, z, p = root) =>
    mesh(new THREE.BoxGeometry(w, h, d), mat, x, y, z, p);
  const round = (w, h, d, r, mat, x, y, z, p = root) =>
    mesh(new RoundedBoxGeometry(w, h, d, 3, r), mat, x, y, z, p);
  const cyl = (rt, rb, h, mat, x, y, z, p = root) =>
    mesh(new THREE.CylinderGeometry(rt, rb, h, 24), mat, x, y, z, p);
  const ball = (r, mat, x, y, z, p = root) =>
    mesh(new THREE.SphereGeometry(r, 16, 12), mat, x, y, z, p);
  const group = (x, y, z, rot = 0) => {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    g.rotation.y = rot;
    root.add(g);
    return g;
  };
  const block = (x, z, w, d) =>
    colliders.push({
      minX: x - w / 2,
      maxX: x + w / 2,
      minZ: z - d / 2,
      maxZ: z + d / 2,
    });
  function rod(a, b, r, mat, p = root) {
    const v = new THREE.Vector3(...a),
      end = new THREE.Vector3(...b),
      delta = end.clone().sub(v);
    const o = mesh(
      new THREE.CylinderGeometry(r, r, delta.length(), 10),
      mat,
      0,
      0,
      0,
      p,
    );
    o.position.copy(v.add(end).multiplyScalar(0.5));
    o.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      delta.normalize(),
    );
    return o;
  }
  // Room dimensions inferred from the references. The entrance remains part of the walkable room.
  box(7, 0.1, 10, m.tile, 0, -0.05, 0);
  box(7.2, 3.2, 0.18, m.wall, 0, 1.6, -5);
  box(0.18, 3.2, 10, m.wall, -3.5, 1.6, 0);
  box(7.2, 3.2, 0.18, m.wall, 0, 1.6, 5);
  // Window opening on the sofa side.
  box(0.18, 3.2, 3.05, m.wall, 3.5, 1.6, 3.475);
  box(0.18, 3.2, 1.3, m.wall, 3.5, 1.6, -4.35);
  box(0.18, 0.75, 5.65, m.wall, 3.5, 0.375, -0.875);
  box(0.18, 0.45, 5.65, m.wall, 3.5, 2.975, -0.875);
  for (const z of [-4.88, 4.88]) {
    box(7, 0.12, 0.05, m.wood, 0, 0.065, z);
    box(7, 0.16, 0.23, m.trim, 0, 2.98, z);
    box(7, 0.07, 0.31, m.trim, 0, 3.08, z);
  }
  for (const x of [-3.38, 3.38]) {
    box(0.06, 0.12, 9.8, m.wood, x, 0.065, 0);
    box(0.23, 0.16, 9.8, m.trim, x, 2.98, 0);
    box(0.31, 0.07, 9.8, m.trim, x, 3.08, 0);
  }
  const ceiling = box(7.2, 0.12, 10.2, m.trim, 0, 3.26, 0);
  const ceilingInset = box(6.1, 0.05, 8.9, m.cream, 0, 3.17, 0);
  // Rounded arch: solid upper spandrel with an open lower passage.
  function arch(left, right, z, spring, top, depth, mat = m.wall) {
    const r = (right - left) / 2,
      mid = (left + right) / 2;
    const shape = new THREE.Shape();
    shape.moveTo(left, top);
    shape.lineTo(right, top);
    shape.lineTo(right, spring);
    shape.absellipse(mid, spring, r, 0.42, 0, Math.PI, false);
    shape.lineTo(left, top);
    const o = mesh(
      new THREE.ExtrudeGeometry(shape, {
        depth,
        bevelEnabled: false,
        curveSegments: 32,
      }),
      mat,
      0,
      0,
      z - depth / 2,
    );
    return o;
  }
  box(0.38, 3.2, 0.36, m.wall, -3.23, 1.6, 1.25);
  box(0.4, 3.2, 0.46, m.wall, 1.08, 1.6, 1.25);
  arch(-3.04, 0.88, 1.25, 2.47, 3.25, 0.38);
  block(-3.23, 1.25, 0.38, 0.36);
  block(1.08, 1.25, 0.4, 0.46);
  // Niche and green writing desk, viewed from living room.
  box(1.95, 3.2, 0.16, m.wall, 2.27, 1.6, 1.64);
  box(0.18, 3.2, 0.6, m.wall, 3.31, 1.6, 1.35);
  arch(1.28, 3.22, 1.24, 2.39, 3.25, 0.62);
  block(2.25, 1.45, 2.3, 0.68);
  for (const y of [0.86, 1.48, 2.1])
    box(1.86, 0.055, 0.48, m.trim, 2.25, y, 1.29);
  const bookColors = [
    "#71836a",
    "#acb3a0",
    "#b69770",
    "#7894a0",
    "#d3c9a6",
    "#9d7764",
    "#626c53",
  ];
  const bookM = bookColors.map(
    (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.9 }),
  );
  function book(x, y, z, w, h, d, idx, p = root) {
    box(w, h, d, bookM[idx % bookM.length], x, y + h / 2, z, p);
    box(w * 0.8, 0.01, 0.003, m.brass, x, y + h * 0.85, z - d / 2 - 0.003, p);
  }
  for (let row = 0; row < 2; row++)
    for (let i = 0; i < 17; i++) {
      book(
        1.47 + i * 0.095,
        0.89 + row * 0.62,
        1.21,
        0.065,
        0.25 + random() * 0.18,
        0.22,
        i + row,
      );
    }
  box(1.86, 0.09, 0.74, m.sage, 2.26, 0.8, 1.12);
  box(1.77, 0.23, 0.6, m.sage, 2.26, 0.64, 1.18);
  for (const x of [1.44, 3.08]) box(0.07, 0.55, 0.08, m.sage, x, 0.3, 1.05);
  for (const x of [1.83, 2.68]) {
    box(0.8, 0.19, 0.025, m.sage, x, 0.64, 0.865);
    ball(0.025, m.brass, x, 0.64, 0.84);
  }
  block(2.26, 1.1, 1.9, 0.77);
  // Paneled window, muted outdoor foliage and softly pleated curtains.
  const outdoor = new THREE.MeshBasicMaterial({ color: "#c8d2b8" });
  const outdoorMaterials = [outdoor];
  box(0.035, 2.08, 5.5, outdoor, 3.58, 1.78, -0.85);
  for (let i = 0; i < 60; i++) {
    const leaf = ball(
      0.13 + random() * 0.21,
      new THREE.MeshBasicMaterial({
        color: ["#849476", "#a8b597", "#d5d9c1"][i % 3],
      }),
      3.54,
      0.94 + random() * 1.68,
      -3.45 + random() * 5.2,
    );
    outdoorMaterials.push(leaf.material);
    leaf.scale.x = 0.1;
  }
  for (const z of [-3.66, -2.35, -0.95, 0.45, 1.89])
    box(0.08, 2.07, 0.055, m.wood, 3.38, 1.78, z);
  for (const y of [0.76, 1.17, 2.8])
    box(0.1, 0.07, 5.6, m.wood, 3.36, y, -0.88);
  for (let i = 0; i < 20; i++) {
    const x = 3.15 + Math.sin(i * 1.4) * 0.06;
    box(
      0.06,
      2.27,
      0.09,
      i % 3 === 0 ? m.sage : m.curtain,
      x,
      1.62,
      -3.6 + i * 0.06,
    );
    box(
      0.06,
      2.27,
      0.09,
      i % 3 === 0 ? m.sage : m.curtain,
      x,
      1.62,
      0.9 + i * 0.055,
    );
  }
  rod([3.12, 2.84, -3.85], [3.12, 2.84, 2.15], 0.035, m.brass);
  box(0.24, 0.22, 5.9, m.sage, 3.16, 2.71, -0.86);
  // Lower wrought iron railing and repeating curls.
  for (let z = -3.45; z < 1.9; z += 0.44) {
    rod([3.23, 0.8, z], [3.23, 1.22, z], 0.012, m.metal);
    const ring = mesh(
      new THREE.TorusGeometry(0.13, 0.011, 8, 24),
      m.metal,
      3.23,
      1.08,
      z,
    );
    ring.rotation.y = Math.PI / 2;
  }
  function sofa(x, z, width, angle) {
    const g = group(x, 0, z, angle);
    for (const xx of [-width / 2 + 0.09, width / 2 - 0.09])
      for (const zz of [-0.39, 0.39])
        box(0.13, 0.43, 0.13, m.wood, xx, 0.215, zz, g);
    box(width, 0.18, 0.89, m.wood, 0, 0.37, 0, g);
    box(width - 0.12, 0.08, 0.78, m.wood, 0, 0.51, 0, g);
    for (const xx of [-width / 2 + 0.05, width / 2 - 0.05]) {
      box(0.13, 0.52, 0.87, m.wood, xx, 0.68, 0, g);
      round(0.18, 0.09, 1.01, 0.025, m.wood, xx, 0.96, 0, g);
      box(0.12, 0.18, 0.92, m.wood, xx, 0.54, 0, g);
    }
    box(width - 0.22, 0.11, 0.11, m.wood, 0, 1.11, 0.41, g);
    for (let xx = -width / 2 + 0.24; xx < width / 2 - 0.15; xx += 0.2)
      box(0.085, 0.52, 0.055, m.wood, xx, 0.82, 0.4, g);
    const count = width > 2 ? 3 : 2;
    for (let i = 0; i < count; i++) {
      let xx = ((i - (count - 1) / 2) * (width - 0.3)) / count;
      round(
        (width - 0.32) / count - 0.025,
        0.18,
        0.78,
        0.065,
        m.fabric,
        xx,
        0.59,
        -0.005,
        g,
      );
      const back = round(
        (width - 0.32) / count - 0.015,
        0.66,
        0.19,
        0.07,
        m.fabric,
        xx,
        0.99,
        0.31,
        g,
      );
      back.rotation.x = -0.11;
      const pillow = round(
        0.55,
        0.35,
        0.16,
        0.07,
        m.fabric,
        xx,
        0.84,
        0.095,
        g,
      );
      pillow.rotation.z = i % 2 ? -0.08 : 0.09;
      pillow.rotation.x = -0.15;
    }
    // Cane summer seat pads.
    const pad = new THREE.MeshStandardMaterial({
      color: "#b19a61",
      roughness: 1,
    });
    round(width - 0.32, 0.015, 0.65, 0.02, pad, 0, 0.69, -0.04, g);
    for (let i = 0; i < 45; i++)
      box(width - 0.36, 0.003, 0.004, m.cream, 0, 0.701, -0.33 + i * 0.013, g);
    if (Math.abs(angle) > 0.1) block(x, z, 1.03, width);
    else block(x, z, width, 1.04);
    return g;
  }
  sofa(2.46, -1.73, 2.83, Math.PI / 2);
  sofa(0.35, 0.52, 1.95, 0);
  // Coffee table, lower shelf and everyday objects.
  const table = group(0.5, 0, -1.65);
  round(1.43, 0.095, 1.88, 0.025, m.wood, 0, 0.53, 0, table);
  box(1.29, 0.07, 1.7, m.wood, 0, 0.18, 0, table);
  for (const x of [-0.59, 0.59])
    for (const z of [-0.81, 0.81])
      box(0.1, 0.49, 0.1, m.wood, x, 0.245, z, table);
  block(0.5, -1.65, 1.43, 1.88);
  function stack(x, y, z, p = root, n = 4) {
    for (let i = 0; i < n; i++) {
      const b = box(
        0.28 + random() * 0.1,
        0.035,
        0.35,
        bookM[i % 7],
        x + (random() - 0.5) * 0.04,
        y + i * 0.039,
        z,
        p,
      );
      b.rotation.y = (random() - 0.5) * 0.22;
      box(0.28, 0.025, 0.33, m.paper, x, y + i * 0.039 + 0.003, z - 0.012, p);
    }
  }
  stack(0.36, 0.6, -0.3, table, 4);
  stack(-0.25, 0.6, 0.4, table, 2);
  stack(0.27, 0.245, 0.32, table, 4);
  function cup(x, y, z, p = root) {
    cyl(0.057, 0.048, 0.105, m.ceramic, x, y + 0.055, z, p);
    cyl(
      0.048,
      0.048,
      0.002,
      new THREE.MeshStandardMaterial({ color: "#51402a" }),
      x,
      y + 0.11,
      z,
      p,
    );
    const handle = mesh(
      new THREE.TorusGeometry(0.039, 0.008, 8, 20),
      m.ceramic,
      x + 0.056,
      y + 0.06,
      z,
      p,
    );
    cyl(0.08, 0.08, 0.01, m.ceramic, x, y, z, p);
  }
  cup(-0.33, 0.59, -0.45, table);
  cup(0.3, 0.59, 0.55, table);
  cyl(0.09, 0.065, 0.22, m.metal, -0.3, 0.7, -0.05, table);
  ball(0.06, m.metal, -0.3, 0.82, -0.05, table);
  rod([-0.25, 0.77, -0.05], [-0.16, 0.8, -0.05], 0.02, m.metal, table);
  const stool = group(-0.56, 0, -2.94);
  round(0.37, 0.06, 0.34, 0.04, m.red, 0, 0.32, 0, stool);
  for (const x of [-0.13, 0.13])
    for (const z of [-0.12, 0.12])
      box(0.05, 0.3, 0.05, m.red, x, 0.15, z, stool);
  block(-0.56, -2.94, 0.4, 0.4);
  // Low media cabinet against the wall, matching the period furniture in the reference.
  box(3.35, 0.075, 0.57, m.wood, 0.1, 0.68, -4.55);
  box(3.2, 0.075, 0.54, m.wood, 0.1, 0.14, -4.55);
  for (const x of [-1.5, -0.51, 0.56, 1.7])
    box(0.065, 0.5, 0.51, m.wood, x, 0.42, -4.55);
  for (const x of [-1.02, 1.15]) {
    box(0.88, 0.42, 0.04, m.wood, x, 0.41, -4.25);
    ball(0.022, m.brass, x, 0.43, -4.215);
  }
  block(0.1, -4.55, 3.35, 0.65);
  stack(0.02, 0.74, -4.55, root, 3);
  function plant(x, y, z, scale = 1, p = root) {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    g.scale.setScalar(scale);
    p.add(g);
    cyl(0.14, 0.095, 0.23, m.red, 0, 0.115, 0, g);
    cyl(0.127, 0.127, 0.014, m.soil, 0, 0.23, 0, g);
    for (let i = 0; i < 14; i++) {
      const a = i * 2.4,
        r = 0.12 + random() * 0.18,
        h = 0.4 + random() * 0.34;
      const tx = Math.cos(a) * r,
        tz = Math.sin(a) * r;
      rod([0, 0.23, 0], [tx, h, tz], 0.009, m.green, g);
      const leaf = ball(0.1, m.green, tx, h, tz, g);
      leaf.scale.set(0.65, 0.2, 1.55);
      leaf.rotation.set(0.4, a, 0.3);
    }
    return g;
  }
  plant(1.4, 0.73, -4.54, 1.25);
  plant(2.99, 0.87, 0.95, 0.65);
  plant(2.4, 2.14, 1.25, 0.5);
  function painting(x, y, z, w, h, rot, kind = 0) {
    const g = group(x, y, z, rot);
    box(w + 0.06, h + 0.06, 0.07, m.wood, 0, 0, 0, g);
    box(w + 0.025, h + 0.025, 0.075, m.brass, 0, 0, 0.006, g);
    const mat = new THREE.MeshStandardMaterial({
      map: paintingTexture(kind),
      roughness: 0.92,
    });
    const p = mesh(new THREE.PlaneGeometry(w, h), mat, 0, 0, 0.05, g);
    return p;
  }
  painting(-0.72, 2.0, -4.87, 0.82, 0.69, 0);
  painting(0.6, 2, -4.87, 0.82, 0.69, 0, 1);
  const originalArt = painting(-3.37, 1.95, -1.22, 0.84, 1.12, Math.PI / 2);
  // Sample the original painting from the supplied photo; keep it on a true 3D wall.
  const paintingReady = new THREE.TextureLoader().loadAsync(assetUrl("客厅漫游/public/references/desk.jpg")).then((texture) => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    const panel = originalArt;
    panel.geometry.setAttribute(
      "uv",
      new THREE.Float32BufferAttribute(
        [
          421 / 726,
          1 - 360 / 982,
          596 / 726,
          1 - 335 / 982,
          420 / 726,
          1 - 578 / 982,
          619 / 726,
          1 - 568 / 982,
        ],
        2,
      ),
    );
    panel.material.map.dispose();
    panel.material.map = texture;
    panel.material.needsUpdate = true;
  });
  // Decorative wavy wall trim over the two paintings.
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-2.9, 2.53, -4.82),
    new THREE.Vector3(-2.4, 2.76, -4.82),
    new THREE.Vector3(-1.7, 2.52, -4.82),
    new THREE.Vector3(0, 2.77, -4.82),
    new THREE.Vector3(1.7, 2.52, -4.82),
    new THREE.Vector3(2.4, 2.76, -4.82),
    new THREE.Vector3(3.2, 2.55, -4.82),
  ]);
  mesh(new THREE.TubeGeometry(curve, 80, 0.09, 8, false), m.cream);
  // Wall sconces.
  for (const x of [-2.05, 1.93]) {
    ball(0.095, m.brass, x, 1.94, -4.82);
    rod([x, 1.94, -4.82], [x, 2.08, -4.58], 0.018, m.brass);
    cyl(0.12, 0.06, 0.17, m.bulb, x, 2.15, -4.58);
  }
  // Dining area behind the arch.
  const dining = group(-1.17, 0, 3.17);
  round(1.9, 0.1, 1.08, 0.03, m.wood, 0, 0.79, 0, dining);
  for (const x of [-0.78, 0.78])
    for (const z of [-0.39, 0.39])
      box(0.09, 0.77, 0.09, m.wood, x, 0.385, z, dining);
  block(-1.17, 3.17, 1.98, 1.12);
  const clothCanvas = document.createElement("canvas");
  clothCanvas.width = clothCanvas.height = 256;
  const ctx = clothCanvas.getContext("2d");
  ctx.fillStyle = "#d3c2a2";
  ctx.fillRect(0, 0, 256, 256);
  for (let x = 0; x < 8; x++)
    for (let y = 0; y < 8; y++) {
      ctx.fillStyle = ["#6a7561", "#ac9b79", "#d8c7a9", "#806d4a"][(x + y) % 4];
      ctx.fillRect(x * 32, y * 32, 32, 32);
    }
  const clothTex = new THREE.CanvasTexture(clothCanvas);
  clothTex.colorSpace = THREE.SRGBColorSpace;
  const cloth = new THREE.MeshStandardMaterial({ map: clothTex, roughness: 1 });
  box(1.89, 0.014, 1.06, cloth, 0, 0.852, 0, dining);
  box(1.89, 0.22, 0.013, cloth, 0, 0.74, -0.542, dining);
  box(1.89, 0.22, 0.013, cloth, 0, 0.74, 0.542, dining);
  function chair(x, z, rot) {
    const g = group(x, 0, z, rot);
    round(0.48, 0.065, 0.47, 0.025, m.wood, 0, 0.46, 0, g);
    for (const xx of [-0.19, 0.19])
      for (const zz of [-0.18, 0.18])
        box(0.045, 0.46, 0.045, m.wood, xx, 0.23, zz, g);
    for (const xx of [-0.2, 0.2])
      box(0.055, 0.57, 0.055, m.wood, xx, 0.76, 0.2, g);
    round(0.49, 0.11, 0.07, 0.025, m.wood, 0, 1.01, 0.2, g);
    for (const xx of [-0.12, 0, 0.12])
      box(0.035, 0.4, 0.03, m.wood, xx, 0.76, 0.2, g);
    block(x, z, 0.5, 0.5);
  }
  chair(-1.72, 4.05, 0);
  chair(-0.7, 4.05, 0);
  chair(-1.7, 2.26, Math.PI);
  chair(-0.7, 2.26, Math.PI);
  chair(-2.6, 3.15, Math.PI / 2);
  plant(-1.65, 0.86, 3.17, 0.8);
  cup(-0.82, 0.86, 3.22);
  // Glass fronted walnut display cupboard.
  const cabinet = group(-1.26, 0, 4.63);
  box(2.45, 2.5, 0.15, m.wood, 0, 1.3, 0.2, cabinet);
  for (const x of [-1.2, 1.2]) box(0.09, 2.54, 0.5, m.wood, x, 1.3, 0, cabinet);
  for (const y of [0.12, 0.78, 1.3, 1.87, 2.53])
    box(2.47, 0.07, 0.54, m.wood, 0, y, 0, cabinet);
  box(2.6, 0.12, 0.62, m.wood, 0, 2.58, 0, cabinet);
  for (const x of [-0.8, 0, 0.8]) {
    box(0.74, 0.56, 0.05, m.wood, x, 0.44, -0.27, cabinet);
    ball(0.025, m.brass, x, 0.47, -0.31, cabinet);
    for (const xx of [x - 0.35, x + 0.35])
      box(0.04, 1.13, 0.055, m.wood, xx, 1.91, -0.28, cabinet);
    box(0.67, 1.1, 0.018, m.glass, x, 1.91, -0.29, cabinet);
    for (let i = 0; i < 2; i++) {
      cyl(0.07, 0.055, 0.17, m.ceramic, x - 0.15 + i * 0.29, 1.4, 0, cabinet);
      cyl(0.095, 0.05, 0.21, m.ceramic, x - 0.15 + i * 0.29, 2.0, 0, cabinet);
    }
  }
  block(-1.26, 4.62, 2.6, 0.63);
  // Double sided antique station clock on the arch.
  const clock = group(-2.82, 2.32, 1.0, Math.PI);
  rod([0, 0.15, 0], [0, 0.4, 0], 0.025, m.metal, clock);
  rod([0, 0.4, 0], [0.25, 0.4, 0], 0.025, m.metal, clock);
  const faceCanvas = document.createElement("canvas");
  faceCanvas.width = faceCanvas.height = 256;
  const fc = faceCanvas.getContext("2d");
  fc.fillStyle = "#ede5c8";
  fc.fillRect(0, 0, 256, 256);
  fc.fillStyle = "#34372d";
  fc.font = "20px Georgia";
  fc.textAlign = "center";
  fc.textBaseline = "middle";
  for (let i = 1; i <= 12; i++) {
    const a = (i * Math.PI) / 6;
    fc.fillText(String(i), 128 + Math.sin(a) * 97, 128 - Math.cos(a) * 97);
  }
  fc.strokeStyle = "#35372d";
  fc.lineWidth = 5;
  fc.beginPath();
  fc.moveTo(128, 128);
  fc.lineTo(90, 82);
  fc.moveTo(128, 128);
  fc.lineTo(165, 55);
  fc.stroke();
  const faceTex = new THREE.CanvasTexture(faceCanvas);
  faceTex.colorSpace = THREE.SRGBColorSpace;
  const backFace = mesh(new THREE.CircleGeometry(.203, 48), new THREE.MeshStandardMaterial({map:faceTex}), 0, 0, -.041, clock);
  backFace.rotation.y = Math.PI;
  const disk = cyl(0.23, 0.23, 0.075, m.metal, 0, 0, 0, clock);
  disk.rotation.x = Math.PI / 2;
  mesh(
    new THREE.CircleGeometry(0.203, 48),
    new THREE.MeshStandardMaterial({ map: faceTex }),
    0,
    0,
    0.041,
    clock,
  );
  const rim = mesh(
    new THREE.TorusGeometry(0.22, 0.014, 8, 48),
    m.brass,
    0,
    0,
    0.039,
    clock,
  );
  // Curved chandelier arms and warm practical lights.
  const chandelier = group(-0.15, 2.52, -1.48);
  rod([0, 0, 0], [0, 0.65, 0], 0.022, m.metal, chandelier);
  ball(0.09, m.brass, 0, 0, 0, chandelier);
  for (let i = 0; i < 5; i++) {
    const a = (i * Math.PI * 2) / 5;
    const x = Math.cos(a) * 0.48,
      z = Math.sin(a) * 0.48;
    const path = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(x * 0.65, -0.19, z * 0.65),
      new THREE.Vector3(x, -0.12, z),
      new THREE.Vector3(x, 0.08, z),
    ]);
    mesh(
      new THREE.TubeGeometry(path, 20, 0.016, 7, false),
      m.metal,
      0,
      0,
      0,
      chandelier,
    );
    cyl(0.11, 0.06, 0.13, m.brass, x, 0.08, z, chandelier);
    const b = ball(0.063, m.bulb, x, 0.22, z, chandelier);
    b.scale.y = 1.65;
  }
  for (const pos of [
    [-0.2, 2.64, -1.55],
    [-1.2, 2.73, 3.0],
    [2.2, 2.6, 0.6],
  ]) {
    const l = new THREE.PointLight("#ffe0a3", 6, 7, 2);
    l.position.set(...pos);
    root.add(l);
    lamps.push(l);
  }
  for (const x of [-2.85, 2.85])
    for (const z of [-4, -1, 2, 4]) {
      cyl(0.09, 0.09, 0.018, m.brass, x, 3.09, z);
      cyl(0.067, 0.067, 0.02, m.bulb, x, 3.073, z);
    }
  // Soft contact shadows keep furniture visually grounded without expensive screen effects.
  const sc = document.createElement("canvas");
  sc.width = sc.height = 128;
  const sx = sc.getContext("2d"),
    sg = sx.createRadialGradient(64, 64, 10, 64, 64, 64);
  sg.addColorStop(0, "rgba(35,23,9,.32)");
  sg.addColorStop(1, "rgba(35,23,9,0)");
  sx.fillStyle = sg;
  sx.fillRect(0, 0, 128, 128);
  const sm = new THREE.MeshBasicMaterial({
    map: new THREE.CanvasTexture(sc),
    transparent: true,
    depthWrite: false,
  });
  for (const c of colliders) {
    const s = mesh(
      new THREE.PlaneGeometry((c.maxX - c.minX) * 1.6, (c.maxZ - c.minZ) * 1.6),
      sm,
      (c.maxX + c.minX) / 2,
      0.006,
      (c.maxZ + c.minZ) / 2,
    );
    s.rotation.x = -Math.PI / 2;
    s.castShadow = false;
  }
  outdoorMaterials.forEach(mat => mat.userData.dayColor = mat.color.clone());
  return { root, colliders, lamps, materials: m, outdoorMaterials, paintingReady, ceilingParts: [ceiling, ceilingInset], nativeObjects: { dining, cabinet, table, stool, clock, chandelier, originalArt } };
}

const scene = new THREE.Scene();
scene.background = new THREE.Color("#c9d0b9");
const ambient = new THREE.HemisphereLight("#ffefd4", "#837253", 2.0);
scene.add(ambient);
const sun = new THREE.DirectionalLight("#fff0d1", 3.3);
sun.position.set(8, 7, -3.5);
sun.target.position.set(-1, 0, -1);
scene.add(sun, sun.target);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, {
  left: -8,
  right: 8,
  top: 7,
  bottom: -7,
  near: 0.5,
  far: 25,
});
sun.shadow.bias = -0.0005;
sun.shadow.normalBias = 0.025;
sun.shadow.radius = 3;
const fill = new THREE.DirectionalLight("#e7f0e5", 0.7);
fill.position.set(-2, 2, 4);
scene.add(fill);
const room = createRoom(scene);
room.lamps.forEach((l) => (l.intensity = 3.3));
// main.js already owns sun.target; include the native origin target of fill
// as well so a parent can move/rotate this scene as one rigid room.
scene.add(fill.target);

await room.paintingReady;
onProgress("客厅 · 原始客餐厅及照片挂画");
const views = {
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

const renderSettings = {
 exposure:1.1,environmentIntensity:scene.environmentIntensity,environment:scene.environment,
 background:scene.background.clone(),toneMapping:THREE.ACESFilmicToneMapping,outputColorSpace:THREE.SRGBColorSpace,
 shadowMap:{enabled:true,type:THREE.PCFSoftShadowMap},
 rendererOptions:{antialias:true,powerPreference:"high-performance"},pixelRatioCap:1.7,
 camera:{fov:66,near:.045,far:50,rotationOrder:"YXZ"},
 provenance:["客厅漫游/src/room.js","客厅漫游/src/materials.js","客厅漫游/src/main.js","客厅漫游/src/navigation.js"],
 conflicts:["Native 7 × 10 m living room includes its entire dining corner.",
 "Native outer walls have no entrance aperture; the entry preset is a camera view only."]
};
function setPresentation({mode="native",fullWalls=true,localCameraPosition}={}) {
 // Optional visibility presentation only. No invented openings or geometry edits.
 const showCeiling=mode==="walk"||fullWalls!==false;
 room.ceilingParts.forEach(part=>part.visible=showCeiling);
 if(renderer?.shadowMap)renderer.shadowMap.needsUpdate=true;
}
function setNight(value) {
 const night=Boolean(value);
 ambient.intensity=night?0.55:2.0;
 sun.intensity=night?0.07:3.3;
 fill.intensity=night?0.14:0.7;
 room.lamps.forEach(l=>l.intensity=night?8:3.3);
 room.outdoorMaterials.forEach(mat=>mat.color.copy(mat.userData.dayColor).multiplyScalar(night?.075:1));
 renderSettings.exposure=night?1.05:1.1;
 scene.background.set(night?"#303e44":"#c9d0b9");
 renderSettings.background.copy(scene.background);
 room.materials.bulb.emissiveIntensity=night?3:1.5;
 if(renderer?.shadowMap)renderer.shadowMap.needsUpdate=true;
}
return {
 scene,root:room.root,dimensions:{width:7,depth:10,height:3.2},
 models:new Map(),objects:room.nativeObjects,views,renderSettings,
 entry:{nativeWallNoAperture:true,hasAperture:false,position:null,view:views.entry},
 colliders:room.colliders,materials:room.materials,outdoorMaterials:room.outdoorMaterials,
 lamps:room.lamps,lights:{ambient,sun,fill},ceilingParts:room.ceilingParts,
 setPresentation,update:()=>false,setNight
};
}

