import { brepToMesh, brepToTexturedMesh, extrudePolygon, makeCube, makeCylinder } from "./fronteras-brep.js";




// === Generar textura fractal en canvas ===
function createFractalTexture(size = 256) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  const img = ctx.createImageData(size, size);
  const maxIter = 60;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // Convertir pixel a coordenada compleja
      const cx = (x - size / 2) / (size / 4);
      const cy = (y - size / 2) / (size / 4);

      let zx = 0, zy = 0, iter = 0;
      while (zx * zx + zy * zy < 4 && iter < maxIter) {
        const xt = zx * zx - zy * zy + cx;
        zy = 2 * zx * zy + cy;
        zx = xt;
        iter++;
      }

      const p = (y * size + x) * 4;
      const c = iter === maxIter ? 0 : (iter / maxIter) * 255;

      img.data[p] = c;
      img.data[p + 1] = 0;
      img.data[p + 2] = 255 - c;
      img.data[p + 3] = 255;
    }
  }

  ctx.putImageData(img, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}







// === Selector de modo ===
// "faces" => colores sólidos por cara (flat shading)
// "standard" => MeshStandardMaterial con luces
// const mode = "faces";
const mode = "standard";

// === Escena / cámara / renderer ===
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 1000);
camera.position.set(0, 2, 5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

// === Suelo ===
const floorGeo = new THREE.PlaneGeometry(50, 50);
const floorMat = new THREE.MeshPhongMaterial({ color: 0x777777, side: THREE.DoubleSide });
const floor = new THREE.Mesh(floorGeo, floorMat);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -0.5;
scene.add(floor);

// === Cubo central ===
const cubeGeo = new THREE.BoxGeometry(1, 1, 1);

let cube;
if (mode === "faces") {
  const materials = [
    new THREE.MeshPhongMaterial({ color: 0xff4444, flatShading: true }),
    new THREE.MeshPhongMaterial({ color: 0x44ff44, flatShading: true }),
    new THREE.MeshPhongMaterial({ color: 0x4444ff, flatShading: true }),
    new THREE.MeshPhongMaterial({ color: 0xffff44, flatShading: true }),
    new THREE.MeshPhongMaterial({ color: 0xff44ff, flatShading: true }),
    new THREE.MeshPhongMaterial({ color: 0x44ffff, flatShading: true })
  ];
  cube = new THREE.Mesh(cubeGeo, materials);
} else {
  const mat = new THREE.MeshStandardMaterial({
    color: 0x88aaff,
    roughness: 0.6,
    metalness: 0.1
  });
  cube = new THREE.Mesh(cubeGeo, mat);
}
scene.add(cube);


// === Cubo grande con textura fractal ===
const bigGeo = new THREE.BoxGeometry(2, 2, 2);

// 6 materiales: 1 fractal + 5 colores simples
const fractalTexture = createFractalTexture(512);

const bigMaterials = [
  new THREE.MeshPhongMaterial({ map: fractalTexture }),       // Cara 0: fractal
  new THREE.MeshPhongMaterial({ color: 0x2288ff, flatShading: true }),
  new THREE.MeshPhongMaterial({ color: 0xff8822, flatShading: true }),
  new THREE.MeshPhongMaterial({ color: 0x22ff88, flatShading: true }),
  new THREE.MeshPhongMaterial({ color: 0xffffff, flatShading: true }),
  new THREE.MeshPhongMaterial({ color: 0x444444, flatShading: true })
];

const bigCube = new THREE.Mesh(bigGeo, bigMaterials);
bigCube.position.set(3, 1, 0);   // Lo coloco al lado para que no se solapen
scene.add(bigCube);






// === Nube de puntos ===
// function createPointCloud(count = 2000, spread = 20) {
//   const geometry = new THREE.BufferGeometry();

//   const positions = new Float32Array(count * 3);

//   for (let i = 0; i < count; i++) {
//     positions[i * 3 + 0] = (Math.random() - 0.5) * spread;
//     positions[i * 3 + 1] = (Math.random() - 0.5) * spread;
//     positions[i * 3 + 2] = (Math.random() - 0.5) * spread;
//   }

//   geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

//   const material = new THREE.PointsMaterial({
//     color: 0xffffff,
//     size: 0.05,
//     sizeAttenuation: true,
//   });

//   const points = new THREE.Points(geometry, material);
//   return points;
// }

// const pointCloud = createPointCloud();
// scene.add(pointCloud);

// === Nube de puntos con movimiento (nieve) ===
function createPointCloud(count = 2000, spread = 20, height = 10) {
  const geometry = new THREE.BufferGeometry();

  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    positions[i * 3 + 0] = (Math.random() - 0.5) * spread;
    positions[i * 3 + 1] = Math.random() * height;     // más arriba
    positions[i * 3 + 2] = (Math.random() - 0.5) * spread;
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.05,
    sizeAttenuation: true,
  });

  const points = new THREE.Points(geometry, material);
  points.userData = { count, spread, height }; // guardar datos para animar

  return points;
}

const pointCloud = createPointCloud();
scene.add(pointCloud);





// === Sólidos ===

const s1 = makeCube();
const s2 = extrudePolygon([new THREE.Vector2(0,0), new THREE.Vector2(2,0), new THREE.Vector2(1,1)], 2);
const s3 = makeCylinder(1, 3, 32);

const mesh1 = brepToMesh(s1, new THREE.MeshPhongMaterial({color:0xff0000}));
const mesh2 = brepToMesh(s2, new THREE.MeshPhongMaterial({color:0x00ff00}));
const mesh3 = brepToMesh(s3, new THREE.MeshPhongMaterial({color:0x0000ff}));

mesh1.position.x = -5;
mesh2.position.x = 0;
mesh3.position.x = 5;

scene.add(mesh1, mesh2, mesh3);
// scene.add(mesh1);





const loader = new THREE.TextureLoader();
const texLadrillo = loader.load("tex/image-2.png");
// texLadrillo.wrapS = texLadrillo.wrapT = THREE.RepeatWrapping;
// texLadrillo.repeat.set(1, 1);

const ejemplo = makeCube();
const ejemploMesh = brepToTexturedMesh(ejemplo, texLadrillo);
// const matTex = new THREE.MeshStandardMaterial({
//   map: texLadrillo
// });
scene.add(ejemploMesh);



// === Luces ===
const ambient = new THREE.AmbientLight(0xffffff, 0.25);
const dir = new THREE.DirectionalLight(0xffffff, 0.9);
dir.position.set(5, 10, 7);
scene.add(ambient, dir);

// === Controles Minecraft ===
const keys = {};
let pitch = 0, yaw = 0;
const speed = 0.1;
const mouseSensitivity = 0.0022;

// Teclado
window.addEventListener("keydown", e => {
  keys[e.code || e.key.toLowerCase()] = true;
});
window.addEventListener("keyup", e => {
  keys[e.code || e.key.toLowerCase()] = false;
});

// Mouse (Pointer Lock)
document.body.addEventListener("click", () => {
  if (document.pointerLockElement !== document.body) {
    document.body.requestPointerLock();
  }
});

document.addEventListener("mousemove", (e) => {
  if (document.pointerLockElement !== document.body) return;
  yaw -= e.movementX * mouseSensitivity;
  pitch -= e.movementY * mouseSensitivity;

  const maxPitch = Math.PI / 2 - 0.01;
  pitch = Math.max(-maxPitch, Math.min(maxPitch, pitch));
});

// Animación / Movimiento
function animate() {
  requestAnimationFrame(animate);


  const positions = pointCloud.geometry.attributes.position.array;
  const count = pointCloud.userData.count;

  for (let i = 0; i < count; i++) {
    // bajar poco a poco
    positions[i * 3 + 1] -= 0.03; 

    // si llegó al piso, reubicar arriba
    if (positions[i * 3 + 1] < -2) {
      positions[i * 3 + 1] = pointCloud.userData.height;
      positions[i * 3 + 0] = (Math.random() - 0.5) * pointCloud.userData.spread;
      positions[i * 3 + 2] = (Math.random() - 0.5) * pointCloud.userData.spread;
    }

    // pequeño viento lateral
    positions[i * 3 + 0] += (Math.random() - 0.5) * 0.002;
  }


  camera.rotation.order = "YXZ";
  camera.rotation.y = yaw;
  camera.rotation.x = pitch;

  const forward = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
  const right   = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));

  if (keys["KeyW"] || keys["w"]) camera.position.addScaledVector(forward, -speed);
  if (keys["KeyS"] || keys["s"]) camera.position.addScaledVector(forward,  speed);
  if (keys["KeyA"] || keys["a"]) camera.position.addScaledVector(right,   -speed);
  if (keys["KeyD"] || keys["d"]) camera.position.addScaledVector(right,    speed);

  if (keys["Space"] || keys[" "]) camera.position.y += speed;
  if (keys["ShiftLeft"] || keys["ShiftRight"])
  camera.position.y -= speed;


  pointCloud.geometry.attributes.position.needsUpdate = true;


  renderer.render(scene, camera);
}

animate();

// Resize
addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
