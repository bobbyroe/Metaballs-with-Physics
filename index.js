import * as THREE from "three";
import getLayer from "./src/getLayer.js";
import { getBody } from "./src/getBody.js";
import RAPIER from 'https://cdn.skypack.dev/@dimforge/rapier3d-compat@0.11.2';
import { MarchingCubes } from "jsm/objects/MarchingCubes.js";

const w = window.innerWidth;
const h = window.innerHeight;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
camera.position.z = 5;
const renderer = new THREE.WebGLRenderer();
renderer.setSize(w, h);
document.body.appendChild(renderer.domElement);

let mousePos = new THREE.Vector2();
const textureLoader = new THREE.TextureLoader();

// initialize RAPIER
await RAPIER.init();
let gravity = { x: 0, y: 0, z: 0 };
let world = new RAPIER.World(gravity);

const numBodies = 20;
const bodies = [];
const debugBodies = false;
for (let i = 0; i < numBodies; i++) {
  const body = getBody({debug: debugBodies, RAPIER, world});
  bodies.push(body);
  if (debugBodies) {
    scene.add(body.mesh);
  }
}

// MOUSE RIGID BODY
const matcap = textureLoader.load("./assets/black-n-shiney.jpg");
let bodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(0, 0, 0)
let mouseRigid = world.createRigidBody(bodyDesc);
let dynamicCollider = RAPIER.ColliderDesc.ball(0.5);
world.createCollider(dynamicCollider, mouseRigid);

const geometry = new THREE.IcosahedronGeometry(0.35, 3);
const material = new THREE.MeshMatcapMaterial({
  matcap
});
const mouseMesh = new THREE.Mesh(geometry, material);
mouseMesh.userData = {
  update() {
    mouseRigid.setTranslation({ x: mousePos.x * 4, y: mousePos.y * 4, z: 0 });
    let { x, y, z } = mouseRigid.translation();
    mouseMesh.position.set(x, y, z);
  }
};
scene.add(mouseMesh);

// METABALLS
const metaMat = new THREE.MeshMatcapMaterial({
  matcap,
  vertexColors: true,
  // transparent: true, // debug
  // opacity: 0.8,
});
const metaballs = new MarchingCubes(
  96, // resolution,
  metaMat,
  true, // enableUVs
  true, // enableColors
  90000 // max poly count
);
metaballs.scale.setScalar(5);
metaballs.isolation = 1000;
metaballs.userData = {
  update() {
    metaballs.reset();
    const strength = 0.5; // size-y
    const subtract = 10; // lightness
    bodies.forEach((b) => {
      const { x, y, z } = b.update();
      metaballs.addBall(x, y, z, strength, subtract, b.color.getHex());
    });
    metaballs.update();
  }
};
scene.add(metaballs);

const gradientBackground = getLayer({
  hue: 0.6,
  numSprites: 8,
  opacity: 0.2,
  radius: 10,
  size: 24,
  z: -10.5,
});
scene.add(gradientBackground);

function animate() {
  requestAnimationFrame(animate);
  world.step();
  mouseMesh.userData.update();
  metaballs.userData.update();
  renderer.render(scene, camera);
}

animate();

function handleWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', handleWindowResize, false);

function handleMouseMove(evt) {
  mousePos.x = (evt.clientX / window.innerWidth) * 2 - 1;
  mousePos.y = - (evt.clientY / window.innerHeight) * 2 + 1;
}
window.addEventListener('mousemove', handleMouseMove, false);