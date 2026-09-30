import "./style.css";
import * as THREE from "three";
import { createRoom } from "./room.js";
import { moveWithCollisions, views } from "./navigation.js";
const $ = (s) => document.querySelector(s),
  host = $("#canvas-host");
let renderer;
try {
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: "high-performance",
  });
} catch (error) {
  $("#load-message").textContent =
    "浏览器未能启动 3D。请启用硬件加速，或使用 Chrome / Edge 打开。";
  throw error;
}
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
renderer.outputColorSpace = THREE.SRGBColorSpace;
host.appendChild(renderer.domElement);
renderer.domElement.tabIndex = 0;
renderer.domElement.setAttribute(
  "aria-label",
  "拖动环顾客厅，使用 W A S D 移动",
);
const scene = new THREE.Scene();
scene.background = new THREE.Color("#c9d0b9");
const camera = new THREE.PerspectiveCamera(66, 1, 0.045, 50);
camera.rotation.order = "YXZ";
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
const keys = new Set(),
  touchMove = new Set();
let yaw = 0,
  pitch = 0,
  dragging = false,
  lastX = 0,
  lastY = 0,
  walking = false,
  seated = false,
  toastTimer,
  transition = false,
  night = false;
function toast(message) {
  $("#toast").textContent = message;
  $("#toast").classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $("#toast").classList.remove("visible"), 3200);
}
function selectView(name, animate = true) {
  if (transition) return;
  transition = true;
  keys.clear();
  touchMove.clear();
  document.exitPointerLock?.();
  const apply = () => {
    const v = views[name];
    camera.position.set(...v.pos);
    camera.lookAt(...v.target);
    yaw = camera.rotation.y;
    pitch = camera.rotation.x;
    seated = name === "sofa";
    $("#height-label").textContent = seated ? "坐姿 1.12 m" : "视高 1.60 m";
    $("#location").textContent = v.name;
    document.querySelectorAll("[data-view]").forEach((b) => {
      b.classList.toggle("selected", b.dataset.view === name);
      b.setAttribute(
        "aria-current",
        b.dataset.view === name ? "true" : "false",
      );
    });
    $("#fade").classList.remove("on");
    transition = false;
    updateMap();
  };
  if (animate) {
    $("#fade").classList.add("on");
    setTimeout(apply, 200);
  } else apply();
}
function resize() {
  const w = host.clientWidth,
    h = host.clientHeight;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(host);
resize();
selectView("overview", false);
function updateMap() {
  const x = 23 + ((camera.position.x + 3.5) / 7) * 134,
    y = 14 + ((camera.position.z + 5) / 10) * 182;
  $("#map-marker").setAttribute(
    "transform",
    `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(-yaw * 180) / Math.PI})`,
  );
}
function rotate(dx, dy) {
  yaw -= dx * 0.003;
  pitch = THREE.MathUtils.clamp(pitch - dy * 0.003, -1.1, 1.1);
}
const canvas = renderer.domElement;
canvas.addEventListener("pointerdown", (e) => {
  if (e.button !== 0) return;
  dragging = true;
  lastX = e.clientX;
  lastY = e.clientY;
  canvas.setPointerCapture(e.pointerId);
  canvas.focus();
});
canvas.addEventListener("pointermove", (e) => {
  if (document.pointerLockElement === canvas) {
    rotate(e.movementX, e.movementY);
  } else if (dragging) {
    rotate(e.clientX - lastX, e.clientY - lastY);
    lastX = e.clientX;
    lastY = e.clientY;
  }
});
for (const event of ["pointerup", "pointercancel", "lostpointercapture"])
  canvas.addEventListener(event, () => (dragging = false));
function setWalking(active) {
  walking = active;
  document.body.classList.toggle("walking", active);
  $("#mode-label").textContent = active ? "自由漫游中" : "第一人称视角";
  $("#enter").innerHTML = active
    ? "正在漫游 <span>↗</span>"
    : "开始自由漫游 <span>↗</span>";
}
$("#enter").onclick = async () => {
  canvas.focus();
  if (matchMedia("(pointer:coarse)").matches) {
    setWalking(true);
    toast("滑动画面环顾，长按左下方箭头移动");
    return;
  }
  try {
    await canvas.requestPointerLock();
  } catch {
    setWalking(true);
    toast("按住画面拖动环顾，W A S D 移动");
  }
};
document.addEventListener("pointerlockchange", () => {
  setWalking(document.pointerLockElement === canvas);
  keys.clear();
  if (walking) toast("移动鼠标环顾 · W A S D 走动 · Esc 退出");
});
window.addEventListener("keydown", (e) => {
  if (e.code === "Escape") {
    setWalking(false);
    keys.clear();
    touchMove.clear();
    return;
  }
  if (document.querySelector("dialog[open]")) return;
  if (
    [
      "KeyW",
      "KeyA",
      "KeyS",
      "KeyD",
      "ArrowUp",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
      "ShiftLeft",
      "ShiftRight",
    ].includes(e.code)
  ) {
    e.preventDefault();
    keys.add(e.code);
  }
});
window.addEventListener("keyup", (e) => keys.delete(e.code));
function clearInput() {
  keys.clear();
  touchMove.clear();
  dragging = false;
}
window.addEventListener("blur", clearInput);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) clearInput();
});
document.querySelectorAll("[data-move]").forEach((b) => {
  b.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    b.setPointerCapture(e.pointerId);
    touchMove.add(b.dataset.move);
  });
  for (const ev of ["pointerup", "pointercancel", "lostpointercapture"])
    b.addEventListener(ev, () => touchMove.delete(b.dataset.move));
});
document
  .querySelectorAll("[data-view]")
  .forEach((b) => (b.onclick = () => selectView(b.dataset.view)));
$("#reset").onclick = () => {
  setWalking(false);
  selectView("overview");
  toast("已回到客厅全景");
};
function setLight(isNight) {
  night = isNight;
  ambient.intensity = night ? 0.55 : 2.0;
  sun.intensity = night ? 0.07 : 3.3;
  fill.intensity = night ? 0.14 : 0.7;
  room.lamps.forEach((l) => (l.intensity = night ? 8 : 3.3));
  room.outdoorMaterials.forEach(mat => mat.color.copy(mat.userData.dayColor).multiplyScalar(night ? .075 : 1));
  renderer.toneMappingExposure = night ? 1.05 : 1.1;
  scene.background.set(night ? "#303e44" : "#c9d0b9");
  room.materials.bulb.emissiveIntensity = night ? 3 : 1.5;
  for (const [id, active] of [
    ["day", !night],
    ["night", night],
  ]) {
    $("#" + id).classList.toggle("active", active);
    $("#" + id).setAttribute("aria-pressed", String(active));
  }
  toast(night ? "灯亮了，家也温暖起来" : "阳光洒进了客厅");
}
$("#day").onclick = () => setLight(false);
$("#night").onclick = () => setLight(true);
function openDialog(id) {
  clearInput();
  document.exitPointerLock?.();
  setWalking(false);
  $(id).showModal();
}
$("#photo").onclick = () => openDialog("#gallery");
$("#help").onclick = () => openDialog("#help-dialog");
$(".close").onclick = () => $("#gallery").close();
$("#help-dialog .close").onclick = () => $("#help-dialog").close();
$("#help-ok").onclick = () => $("#help-dialog").close();
document.querySelectorAll("dialog").forEach((d) =>
  d.addEventListener("click", (e) => {
    if (e.target === d) {
      const r = d.getBoundingClientRect();
      if (
        e.clientX < r.left ||
        e.clientX > r.right ||
        e.clientY < r.top ||
        e.clientY > r.bottom
      )
        d.close();
    }
  }),
);
$("#fullscreen").onclick = async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  } catch {
    toast("此窗口不支持全屏，可在浏览器中按 F11");
  }
};
let previous = performance.now(),
  frames = 0;
function animate(time) {
  requestAnimationFrame(animate);
  const dt = Math.min((time - previous) / 1000, 0.05);
  previous = time;
  const modal = Boolean(document.querySelector("dialog[open]"));
  if (!modal && !transition) {
    if (keys.has("ArrowLeft")) yaw += dt * 1.25;
    if (keys.has("ArrowRight")) yaw -= dt * 1.25;
    let forward =
      Number(
        keys.has("KeyW") || keys.has("ArrowUp") || touchMove.has("forward"),
      ) -
      Number(
        keys.has("KeyS") || keys.has("ArrowDown") || touchMove.has("back"),
      );
    let right =
      Number(keys.has("KeyD") || touchMove.has("right")) -
      Number(keys.has("KeyA") || touchMove.has("left"));
    if (forward || right) {
      if (seated) {
        camera.position.y = 1.6;
        seated = false;
        $("#height-label").textContent = "视高 1.60 m";
      }
      const length = Math.hypot(forward, right);
      forward /= length;
      right /= length;
      const speed =
        (keys.has("ShiftLeft") || keys.has("ShiftRight") ? 2.6 : 1.45) * dt;
      moveWithCollisions(
        camera.position,
        (-Math.sin(yaw) * forward + Math.cos(yaw) * right) * speed,
        (-Math.cos(yaw) * forward - Math.sin(yaw) * right) * speed,
        room.colliders,
      );
      document.querySelectorAll("[data-view]").forEach((b) => {
        b.classList.remove("selected");
        b.removeAttribute("aria-current");
      });
      $("#location").textContent =
        camera.position.z > 1.25 ? "餐厅 · 漫游" : "客厅 · 漫游";
    }
  }
  camera.rotation.set(pitch, yaw, 0, "YXZ");
  renderer.render(scene, camera);
  if (frames++ % 3 === 0) updateMap();
}
requestAnimationFrame(animate);
setTimeout(() => {
  $("#loading").style.opacity = "0";
  setTimeout(() => $("#loading").remove(), 600);
}, 450);
canvas.addEventListener("webglcontextlost", (e) => {
  e.preventDefault();
  toast("3D 显示暂时中断，请刷新页面恢复");
});
