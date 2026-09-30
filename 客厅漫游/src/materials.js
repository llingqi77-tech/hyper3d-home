import * as THREE from "three";
let seed = 1807;
export function random() {
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
export function makeMaterials() {
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
export function paintingTexture(kind = 0) {
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
