#!/usr/bin/env node
/*
 * Read-only, real-GLB source-construction parity audit. No browser, server,
 * dist rebuild, WebGL renderer, or generated output files are involved.
 * Run from any directory: node <repo>/全屋漫游/audit/bathroom-parity.cjs
 * Optionally: --verify-saved (also checks the saved room fingerprints).
 * This does NOT assert parity with the independently served dist page.
 */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');

const repo = path.resolve(__dirname, '../..');
const runtimeModules = process.env.BATHROOM_PARITY_NODE_MODULES ||
  'C:/Users/admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const read = file => fs.readFileSync(path.resolve(repo, file), 'utf8').replace(/\r\n/g, '\n');
const stripImports = text => text.replace(/^import .*;\n/gm, '');
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

function section(text, start, end) {
  const a = text.indexOf(start), b = text.indexOf(end, a + start.length);
  assert(a >= 0 && b > a, 'Native source markers changed: ' + start + ' / ' + end);
  assert.equal(text.indexOf(start, a + start.length), -1, 'Ambiguous source marker: ' + start);
  return text.slice(a, b);
}

async function main() {
  assert(process.argv.slice(2).every(arg => arg === '--verify-saved'), 'Only --verify-saved is supported');
  const canvas = require(path.join(runtimeModules, '@napi-rs/canvas'));
  const threeDir = path.resolve(repo, '厨房漫游/node_modules/three');
  const THREE = await import(pathToFileURL(path.join(threeDir, 'build/three.module.js')));
  const { GLTFLoader } = await import(pathToFileURL(path.join(threeDir, 'examples/jsm/loaders/GLTFLoader.js')));
  const { Reflector } = await import(pathToFileURL(path.join(threeDir, 'examples/jsm/objects/Reflector.js')));
  const threePackage = JSON.parse(fs.readFileSync(path.join(threeDir, 'package.json')));
  const canvasPackage = JSON.parse(fs.readFileSync(path.join(runtimeModules, '@napi-rs/canvas/package.json')));
  const doc = {
    createElement(tag) { assert.equal(tag, 'canvas'); return canvas.createCanvas(1, 1); },
    querySelector() { return null; },
  };

  // Three.js uses these browser globals for real embedded GLB images. The only
  // DOM substitute is a native raster canvas; no GLB geometry or image is mocked.
  global.self = global;
  global.document = doc;
  global.createImageBitmap = async blob => canvas.loadImage(Buffer.from(await blob.arrayBuffer()));
  global.ProgressEvent = class ProgressEvent {
    constructor(type, data) { this.type = type; Object.assign(this, data); }
  };
  const assetInputs = new Map();
  const nativeFetch = global.fetch;
  global.fetch = async (input, options) => {
    const url = typeof input === 'string' ? input : input.url;
    if (url.startsWith('https://bathroom.audit/')) {
      const relative = decodeURIComponent(new URL(url).pathname.slice(1));
      const absolute = path.resolve(repo, relative);
      const relativeCheck = path.relative(repo, absolute);
      assert(!relativeCheck.startsWith('..') && !path.isAbsolute(relativeCheck), 'Asset escaped repository');
      const data = await fs.promises.readFile(absolute);
      assetInputs.set(relative, { path: relative, bytes: data.length, sha256: hash(data) });
      return new Response(data, { headers: { 'Content-Length': String(data.length) } });
    }
    assert(url.startsWith('blob:'), 'Unexpected external request: ' + url);
    return nativeFetch(input, options);
  };
  const assetUrl = relative => 'https://bathroom.audit/' + relative.split('/').map(encodeURIComponent).join('/');
  const assets = new Function(read('公卫2漫游/src/assets.js').replace('export const assets=', 'return '))();
  // Evaluate the actual native model helper, including its original cache. Only
  // BASE_URL is injected so it resolves to this room's existing public directory.
  const helper = stripImports(read('公卫2漫游/src/model.js'))
    .replaceAll('export function', 'function')
    .replaceAll('import.meta.env.BASE_URL', 'nativeAssetBase');
  const { getModel, prepareModel } = new Function('THREE', 'GLTFLoader', 'nativeAssetBase',
    helper + ';return {getModel,prepareModel};')(THREE, GLTFLoader, assetUrl('公卫2漫游/public/'));

  const textureCache = new WeakMap(), materialCache = new WeakMap();
  const pixelSources = new Map();
  function texture(t) {
    if (textureCache.has(t)) return textureCache.get(t);
    const image = t.image;
    let pixels = null;
    if (image?.getContext) {
      pixels = hash(image.getContext('2d').getImageData(0, 0, image.width, image.height).data);
    } else if (image && image.width && image.height && !t.isRenderTargetTexture) {
      const c = canvas.createCanvas(image.width, image.height);
      c.getContext('2d').drawImage(image, 0, 0);
      pixels = hash(c.getContext('2d').getImageData(0, 0, c.width, c.height).data);
    }
    const result = {
      type: t.constructor.name, name: t.name, image: [image?.width, image?.height, pixels],
      offset: t.offset.toArray(), repeat: t.repeat.toArray(), center: t.center.toArray(),
      rotation: t.rotation, wrapS: t.wrapS, wrapT: t.wrapT, anisotropy: t.anisotropy,
      flipY: t.flipY, colorSpace: t.colorSpace, magFilter: t.magFilter,
      minFilter: t.minFilter, format: t.format, typeId: t.type,
    };
    textureCache.set(t, result);
    if (pixels) pixelSources.set(pixels, {
      width: image.width, height: image.height, rgbaSha256: pixels,
      rasterSource: image.getContext ? 'procedural-canvas' : 'decoded-GLB-image',
    });
    return result;
  }
  function material(m) {
    if (materialCache.has(m)) return materialCache.get(m);
    const result = {};
    for (const key of Object.keys(m).sort()) {
      if (['id', 'uuid', 'version', '_listeners', 'userData'].includes(key)) continue;
      const value = m[key];
      if (value?.isTexture) result[key] = texture(value);
      else if (value?.isColor || value?.toArray) result[key] = value.toArray();
      else if (['number', 'string', 'boolean'].includes(typeof value) || value === null) result[key] = value;
      else if (key === 'defines') result[key] = value;
      else if (key === 'uniforms') {
        result[key] = {};
        for (const [uniform, item] of Object.entries(value)) {
          result[key][uniform] = item.value?.isTexture ? texture(item.value) :
            item.value?.toArray ? item.value.toArray() : item.value;
        }
      }
    }
    materialCache.set(m, result);
    return result;
  }
  function geometry(g) {
    const bytes = a => Buffer.from(a.buffer, a.byteOffset, a.byteLength);
    return {
      type: g.type, index: g.index ? hash(bytes(g.index.array)) : null,
      attributes: Object.fromEntries(Object.entries(g.attributes).map(([key, value]) => [key, {
        itemSize: value.itemSize, normalized: value.normalized, array: hash(bytes(value.array)),
      }])), groups: g.groups, drawRange: g.drawRange,
    };
  }
  function snapshot(o) {
    const result = {
      type: o.type, name: o.name, visible: o.visible, position: o.position.toArray(),
      quaternion: o.quaternion.toArray(), scale: o.scale.toArray(), castShadow: o.castShadow,
      receiveShadow: o.receiveShadow, renderOrder: o.renderOrder, frustumCulled: o.frustumCulled,
    };
    if (o.geometry) result.geometry = geometry(o.geometry);
    if (o.material) result.material = [].concat(o.material).map(material);
    if (o.isLight) result.light = {
      color: o.color.toArray(), groundColor: o.groundColor?.toArray(), intensity: o.intensity,
      distance: o.distance, decay: o.decay,
      shadow: o.shadow ? {
        mapSize: o.shadow.mapSize.toArray(), bias: o.shadow.bias, normalBias: o.shadow.normalBias,
        camera: [o.shadow.camera.left, o.shadow.camera.right, o.shadow.camera.top,
          o.shadow.camera.bottom, o.shadow.camera.near, o.shadow.camera.far],
      } : null,
    };
    if (o.isScene) {
      result.background = o.background?.toArray();
      result.environment = o.environment;
      result.environmentIntensity = o.environmentIntensity;
    }
    // Async GLB completion order is not part of scene parity. Preserve hierarchy
    // and multiplicity but canonicalize sibling order and exclude random UUIDs.
    result.children = o.children.map(snapshot).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
    return result;
  }

  const report = {
    schema: 'bathroom-parity-source-v1', executedAt: new Date().toISOString(),
    scope: 'Real GLB + current independent src construction versus canonical factories in Node; NOT served dist/browser/WebGL parity',
    runtime: { node: process.version, platform: process.platform, arch: process.arch,
      three: threePackage.version, canvas: canvasPackage.version },
    normalization: 'SHA-256 of geometry buffers and decoded RGBA; exact numeric transforms/materials; recursive sibling sorting; no UUIDs',
    limitations: [
      'Canvas and embedded GLB images use @napi-rs/canvas, not browser Canvas2D or browser image decoding.',
      'No WebGL draw, Reflector render-target pixels, shader compilation, screenshots, or served dist inventory are verified.',
      'UI, camera controls, resizing and DOM are excluded; bathroom2 native overview wall visibility and settled open curtain are applied explicitly.',
      'Material callback function bodies, userData and object sharing identity are excluded from fingerprints.',
    ],
    inputs: [], rooms: [], pixelSources: [], assets: [],
  };
  const sourcePaths = ['公卫1漫游/src/main.js', '公卫2漫游/src/main.js',
    '公卫2漫游/src/model.js', '公卫2漫游/src/assets.js',
    '全屋漫游/src/canonical/bathroom1.js', '全屋漫游/src/canonical/bathroom2.js'];
  report.inputs = sourcePaths.map(file => {
    const bytes = fs.readFileSync(path.resolve(repo, file));
    return { path: file, bytes: bytes.length, sha256: hash(bytes) };
  });

  for (const n of [1, 2]) {
    const original = read('公卫' + n + '漫游/src/main.js');
    const factoryCode = stripImports(read('全屋漫游/src/canonical/bathroom' + n + '.js'))
      .replace('export async function', 'async function');
    const factory = new Function('THREE', 'GLTFLoader', 'Reflector', 'assets',
      factoryCode + ';return createBathroom' + n + ';')(THREE, GLTFLoader, Reflector, assets);
    let progress = 0;
    const actual = await factory({ assetUrl, onProgress: () => progress++ });
    assert.equal(actual.scene.parent, null, 'Factory must resolve while detached');
    assert.equal(actual.errors.size, 0, JSON.stringify([...actual.errors]));
    let native;
    if (n === 1) {
      let load = section(original, 'const loader=new GLTFLoader();', 'async function loadQueue(){');
      const urlLine = /^  return new Promise\(resolve=>loader\.load\(.+,gltf=>\{/m;
      assert(urlLine.test(load), 'bathroom1 native URL adaptation marker changed');
      load = load.replace(urlLine,
        '  return new Promise(resolve=>loader.load(assetUrl("公卫1漫游/public/assets/"+asset.file),gltf=>{');
      const body = 'const scene=new THREE.Scene();scene.scale.x=-1;scene.position.x=1.42;' +
        'scene.background=new THREE.Color("#d9d6cb");' +
        section(original, 'const hemi =', 'const statusText=') + load +
        ';for(let i=0;i<assets.length;i+=2)await Promise.all(assets.slice(i,i+2).map(loadAsset));' +
        'return {scene,assets,fallback,mirrorSurface};';
      native = await new AsyncFunction('THREE', 'GLTFLoader', 'Reflector', 'document', 'assetUrl', body)
        (THREE, GLTFLoader, Reflector, doc, assetUrl);
    } else {
      const load = section(original, 'async function loadAsset(a){', 'async function loadAll(){');
      const body = 'const scene=new THREE.Scene();scene.background=new THREE.Color("#e9e2d7");' +
        section(original, 'const ambient=', 'const modelGroups=') +
        section(original, 'const modelGroups=', 'const views=') + load +
        ';function renderList(){}function updateCount(){};' +
        'for(let i=0;i<assets.length;i+=3)await Promise.all(assets.slice(i,i+3).map(loadAsset));' +
        'walls.east.visible=false;walls.west.visible=true;walls.north.visible=true;' +
        'const curtain=modelGroups.get("curtain");curtain.scale.x=curtainAmount;' +
        'curtain.position.z=-.89+.89*curtainAmount;return {scene,modelGroups,states};';
      native = await new AsyncFunction('THREE', 'Reflector', 'assets', 'prepareModel', 'getModel', body)
        (THREE, Reflector, assets, prepareModel, getModel);
      assert([...native.states.values()].every(value => value === 'ready'), 'All native GLBs must load');
    }
    const actualSnapshot = snapshot(actual.scene), nativeSnapshot = snapshot(native.scene);
    assert.deepEqual(actualSnapshot, nativeSnapshot, 'bathroom' + n + ' native fingerprint mismatch');
    let nodes = 0, meshes = 0, reflectors = 0;
    actual.scene.traverse(o => { nodes++; if (o.isMesh) meshes++; if (o.isReflector) reflectors++; });
    assert.equal(reflectors, 1);
    assert.equal(progress, n === 1 ? 5 : 23);
    const fingerprint = hash(JSON.stringify(actualSnapshot));
    const inventory = actual.scene.children.map(o => ({
      name: o.name, type: o.type, visible: o.visible, fingerprint: hash(JSON.stringify(snapshot(o))),
    })).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));

    actual.setPresentation({ mode: 'plan' });
    if (n === 2) { assert(!actual.walls.east.visible); assert(!actual.reflectors[0].visible); }
    actual.setPresentation({ mode: 'walk', fullWalls: true, localCameraPosition: new THREE.Vector3(0, 1.6, 0) });
    if (n === 2) assert(Object.values(actual.walls).every(w => w.visible));
    actual.setLight(true); actual.setLight(false);
    actual.setPresentation({ mode: 'overview', fullWalls: false, localCameraPosition:
      new THREE.Vector3(...(n === 1 ? actual.views.overview.camera : actual.views.overview.pos)) });
    actual.update(0);
    report.rooms.push({ room: n, status: 'PASS', nodes, meshes, reflectors, progress,
      modelGroups: actual.models.size, fingerprint, nativeFingerprint: hash(JSON.stringify(nativeSnapshot)),
      dimensions: actual.dimensions, presentationSmokeChecks: 'PASS', inventory });
  }
  report.pixelSources = [...pixelSources.values()].sort((a, b) => a.rgbaSha256.localeCompare(b.rgbaSha256));
  report.assets = [...assetInputs.values()].sort((a, b) => a.path.localeCompare(b.path));
  if (process.argv.includes('--verify-saved')) {
    const saved = JSON.parse(fs.readFileSync(path.join(__dirname, 'bathroom-parity-results.json')));
    for (const room of report.rooms) {
      assert.equal(room.fingerprint, saved.rooms.find(r => r.room === room.room)?.fingerprint,
        'Saved fingerprint changed for bathroom' + room.room);
    }
    report.savedFingerprintCheck = 'PASS';
  }
  process.stdout.write(JSON.stringify(report, null, 2) + '\n');
}

main().catch(error => {
  console.error('bathroom-parity failed:', error.stack || error);
  process.exitCode = 1;
});
