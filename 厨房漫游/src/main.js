import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { createKitchen } from "./kitchen.js";
import { objects, assetTargets } from "./assets.js";

const $ = (selector) => document.querySelector(selector);
// Scene x is the short width (stove wall); scene z is the long east/west run.
const SHORT_EDGE_SCALE = 2.06 / 3.08;
const LONG_EDGE_SCALE = 3.08 / 2.06;
const roomPoint = ([x, y, z]) => [x * SHORT_EDGE_SCALE, y, z * LONG_EDGE_SCALE];
const host = $("#canvas-host");
const scene = new THREE.Scene();
scene.background = new THREE.Color("#d9d6cb");
const camera = new THREE.PerspectiveCamera(48, 1, 0.04, 45);
camera.position.set(...roomPoint([3.25, 2.5, 3.8]));
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.8));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
host.appendChild(renderer.domElement);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.065;
controls.minDistance = 1.55;
controls.maxDistance = 8;
controls.maxPolarAngle = Math.PI * 0.49;
controls.target.set(...roomPoint([0, 1.05, -0.1]));

const kitchen = createKitchen(scene);
const state = { night: false, toastTimer: 0, currentView: "overview" };
function toast(message) {
  $("#toast").textContent = message;
  $("#toast").classList.add("visible");
  clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(() => $("#toast").classList.remove("visible"), 3000);
}

const statusLabel = (status) => ({ completed: "模型已生成", processing: "模型生成中", queued: "等待建模", failed: "待重新生成" })[status] || "场景资产";
function renderObjectList() {
  const list = $("#object-list");
  list.replaceChildren();
  for (const item of objects) {
    const button = document.createElement("button");
    button.className = "object-row";
    button.dataset.object = item.id;
    button.innerHTML = `<span class="object-number">${item.id}</span><span class="object-copy"><strong>${item.name}</strong><small>${item.kind}</small></span><span class="asset-state ${item.status}">${statusLabel(item.status)}</span>`;
    button.addEventListener("click", () => focusObject(item.id));
    list.append(button);
  }
}
renderObjectList();

const views = {
  overview: { camera: [3.25, 2.5, 3.8], target: [0, 1.05, -0.1], label: "厨房全景" },
  cooktop: { camera: [-1.65, 1.8, 1.05], target: [-0.5, 1.1, -0.7], label: "灶台与操作台" },
  sink: { camera: [2.7, 1.85, 1.2], target: [1.05, 1.05, 0.04], label: "水槽与收纳" },
  top: { camera: [0.1, 5.3, 0.1], target: [0, 0.65, -0.08], label: "厨房俯视" },
};
function setView(name, animate = true) {
  const view = views[name];
  if (!view) return;
  state.currentView = name;
  $("#view-label").textContent = view.label;
  document.querySelectorAll("[data-view]").forEach((b) => b.classList.toggle("selected", b.dataset.view === name));
  if (!animate) {
    camera.position.set(...roomPoint(view.camera));
    controls.target.set(...roomPoint(view.target));
    controls.update();
    return;
  }
  const fromPosition = camera.position.clone();
  const fromTarget = controls.target.clone();
  const toPosition = new THREE.Vector3(...roomPoint(view.camera));
  const toTarget = new THREE.Vector3(...roomPoint(view.target));
  const start = performance.now();
  function move(now) {
    const t = Math.min((now - start) / 560, 1);
    const eased = t * t * (3 - 2 * t);
    camera.position.lerpVectors(fromPosition, toPosition, eased);
    controls.target.lerpVectors(fromTarget, toTarget, eased);
    controls.update();
    if (t < 1) requestAnimationFrame(move);
  }
  requestAnimationFrame(move);
}
document.querySelectorAll("[data-view]").forEach((b) => b.addEventListener("click", () => setView(b.dataset.view)));
function focusObject(id) {
  const item = objects.find((x) => x.id === id);
  const target = assetTargets[id];
  if (!item || !target) return;
  document.querySelectorAll(".object-row").forEach((b) => b.classList.toggle("active", b.dataset.object === id));
  const p = new THREE.Vector3(...roomPoint(item.focus));
  const direction = camera.position.clone().sub(controls.target).normalize();
  const distance = Math.max(1.5, Math.min(2.6, target.size.length() * 2));
  const fromPosition = camera.position.clone();
  const fromTarget = controls.target.clone();
  const toPosition = p.clone().add(direction.multiplyScalar(distance));
  const start = performance.now();
  function move(now) {
    const t = Math.min((now - start) / 450, 1), e = t * t * (3 - 2 * t);
    camera.position.lerpVectors(fromPosition, toPosition, e);
    controls.target.lerpVectors(fromTarget, p, e);
    controls.update();
    if (t < 1) requestAnimationFrame(move);
  }
  requestAnimationFrame(move);
  toast(`${item.id} · ${item.name}：${statusLabel(item.status)}`);
}

// Load only the independently generated entry lantern. Other generated assets
// remain in the review folder until each one is visually calibrated.
const modelStatus = $("#asset-progress");
modelStatus.textContent = "厨房场景已就绪 · 正在载入入口吊灯";
const lanternLoader = new GLTFLoader();
lanternLoader.load("/assets/entry-lantern.glb", (gltf) => {
  const item = objects.find((entry) => entry.id === "16");
  const fallback = kitchen.groups.get("16");
  const model = gltf.scene;
  const bounds = new THREE.Box3().setFromObject(model);
  const size = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());
  const desired = [0.55, 0.62, 0.55];
  const scale = Math.min(desired[0] / Math.max(size.x, 0.001), desired[1] / Math.max(size.y, 0.001), desired[2] / Math.max(size.z, 0.001));
  model.scale.setScalar(scale);
  model.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale);
  model.traverse((object) => {
    if (object.isMesh) { object.castShadow = true; object.receiveShadow = true; }
  });
  const placement = new THREE.Group();
  placement.name = "hyper3d-entry-lantern";
  placement.position.set(...roomPoint([0, 1.8, 1.12]));
  placement.add(model);
  scene.add(placement);
  if (fallback) fallback.traverse((object) => { if (object.isMesh) object.visible = false; });
  const row = document.querySelector('[data-object="16"] .asset-state');
  if (row) { row.textContent = "Hyper3D 已接入"; row.className = "asset-state completed"; }
  modelStatus.textContent = `${objects.length} 个物件已编目 · 入口吊灯已接入`;
}, undefined, () => {
  modelStatus.textContent = `${objects.length} 个物件已编目 · 入口吊灯暂用场景模型`;
});

function setLighting(night) {
  state.night = night;
  kitchen.lights.amb.intensity = night ? 0.66 : 2.0;
  kitchen.lights.sun.intensity = night ? 0.07 : 2.5;
  kitchen.lights.ceilingGlow.intensity = night ? 4.8 : 1.3;
  kitchen.lights.lanternBulb.intensity = night ? 4.5 : 0.8;
  renderer.toneMappingExposure = night ? 1 : 1.08;
  scene.background.set(night ? "#303a3d" : "#d9d6cb");
  $("#day").classList.toggle("active", !night);
  $("#night").classList.toggle("active", night);
  $("#day").setAttribute("aria-pressed", String(!night));
  $("#night").setAttribute("aria-pressed", String(night));
  toast(night ? "夜间灯光已开启" : "自然光已开启");
}
$("#day").addEventListener("click", () => setLighting(false));
$("#night").addEventListener("click", () => setLighting(true));
$("#reset").addEventListener("click", () => { document.querySelectorAll(".object-row").forEach((b) => b.classList.remove("active")); setView("overview"); });
$("#help").addEventListener("click", () => $("#help-dialog").showModal());
$("#help-ok").addEventListener("click", () => $("#help-dialog").close());
$("#references").addEventListener("click", () => $("#gallery-dialog").showModal());
document.querySelectorAll(".close").forEach((button) => button.addEventListener("click", () => button.closest("dialog").close()));
$("#fullscreen").addEventListener("click", async () => { try { document.fullscreenElement ? await document.exitFullscreen() : await document.documentElement.requestFullscreen(); } catch { toast("此窗口不支持全屏"); } });

function resize() {
  const w = host.clientWidth, h = host.clientHeight;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(host);
resize();
setView("overview", false);
function animate() { requestAnimationFrame(animate); controls.update(); renderer.render(scene, camera); }
animate();
setTimeout(() => { $("#loading").classList.add("hidden"); }, 550);
