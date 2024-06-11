import * as THREE from 'three';

const sceneMiddle = new THREE.Vector3(0, 0, 0);
const metaOffset = new THREE.Vector3(0.5, 0.5, 0.5);

function getBody({ debug = false, RAPIER, world }) {
  const size = 0.2;
  const range = 3;
  const density = 0.5;
  let x = Math.random() * range - range * 0.5;
  let y = Math.random() * range - range * 0.5 + 3;
  let z = Math.random() * range - range * 0.5;
  // Create a dynamic rigid-body.
  let rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic()
    .setTranslation(x, y, z)
    .setLinearDamping(2);
  let rigid = world.createRigidBody(rigidBodyDesc);
  let colliderDesc = RAPIER.ColliderDesc.ball(size).setDensity(density);
  world.createCollider(colliderDesc, rigid);

  const color = new THREE.Color().setHSL(Math.random(), 1, 0.5);

  let mesh;
  if (debug === true) {
    const geometry = new THREE.IcosahedronGeometry(size, 3);
    const material = new THREE.MeshBasicMaterial({ 
      color,
    });
    mesh = new THREE.Mesh(geometry, material);
  }

  function update() {
    rigid.resetForces(true);
    let { x, y, z } = rigid.translation();
    let pos = new THREE.Vector3(x, y, z);
    let dir = pos.clone().sub(sceneMiddle).normalize();
    rigid.addForce(dir.multiplyScalar(-0.5), true);
    if ( debug === true) {
      mesh.position.copy(pos);
    }
    pos.multiplyScalar(0.1).add(metaOffset);
    return pos;
  }
  return { color, mesh, rigid, update };
}

export { getBody };