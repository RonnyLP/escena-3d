import { Face, HalfEdge, Solid, Vertex } from "./classes.js";




function triangulateFace(face) {
  const verts = [];

  let e = face.edge;
  do {
    if (e.vertex) {
      verts.push(e.vertex);
    }
    e = e.next;
  } while (e !== face.edge);

  // triangulación muy básica: fan triangulation (válida para polígonos convexos)
  const tris = [];
  for (let i = 1; i < verts.length - 1; i++) {
    tris.push(verts[0], verts[i], verts[i+1]);
  }
  return tris;
}

export function brepToMesh(solid, material) {
  const positions = [];

  for (const face of solid.faces) {
    const triList = triangulateFace(face);
    for (let v of triList) {
      positions.push(v.p.x, v.p.y, v.p.z);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();

  return new THREE.Mesh(geometry, material);
}


export function brepToTexturedMesh(solid, texture, options = {}) {
  if (!solid || !solid.faces) {
    console.warn("brepToTexturedMesh: solid no válido");
    return new THREE.Mesh(new THREE.BufferGeometry());
  }

  // --- Normalizar lista de caras ---
  let facesList = Array.isArray(solid.faces)
    ? solid.faces
    : [solid.faces];

  const positions = [];
  const normals = [];
  const uvs = [];

  const scale = options.uvScale || 0.5;

  for (const face of facesList) {
    if (!face) continue;

    let triList;
    try {
      triList = triangulateFace(face);
    } catch (e) {
      console.warn("Error triangulando cara:", e);
      continue;
    }

    if (!triList || triList.length < 3) continue;

    // Calcular normal de la cara
    let N = new THREE.Vector3(0,0,1);
    {
      const a = triList[0], b = triList[1], c = triList[2];

      const abx = b.x - a.x, aby = b.y - a.y, abz = b.z - a.z;
      const acx = c.x - a.x, acy = c.y - a.y, acz = c.z - a.z;

      N.set(
        aby * acz - abz * acy,
        abz * acx - abx * acz,
        abx * acy - aby * acx
      ).normalize();
    }

    // Para cada vértice del triángulo:
    for (let i = 0; i < triList.length; i++) {
      const v = triList[i];

      positions.push(v.p.x, v.p.y, v.p.z);
      normals.push(N.x, N.y, N.z);

      // Proyección simple XY (didáctico)
      uvs.push(v.p.x * scale + 0.5, v.p.y * scale + 0.5);
    }
  }

  // Construir geometría
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.computeVertexNormals();

  // Material con textura
  const material = new THREE.MeshStandardMaterial({
    map: texture,
    side: THREE.DoubleSide,
  });

  return new THREE.Mesh(geometry, material);
}


// export function brepToMesh(solid, material) {

//   console.log("DEBUG solid:", solid);
//   console.log("typeof solid.faces:", typeof (solid && solid.faces));
//   console.log("isArray:", Array.isArray(solid && solid.faces));
//   if (solid && solid.faces && typeof solid.faces === 'object') {
//     console.log("solid.faces keys:", Object.keys(solid.faces).slice(0,20));
//     if (solid.faces && solid.faces.edge) console.log("face.edge exists (possible single face)");
//   }



//   const positions = [];
//   const normals = [];
//   const uvs = [];

//   for (const face of solid.faces) {
//     const triList = triangulateFace(face);

//     for (let i = 0; i < triList.length; i++) {
//       const v = triList[i];

//       positions.push(v.x, v.y, v.z);

//       // normal por producto cruzado
//       let normal = new THREE.Vector3();
//       if (triList.length >= 3) {
//         const a = triList[0];
//         const b = triList[1];
//         const c = triList[2];

//         const abx = b.x - a.x;
//         const aby = b.y - a.y;
//         const abz = b.z - a.z;

//         const acx = c.x - a.x;
//         const acy = c.y - a.y;
//         const acz = c.z - a.z;

//         normal.set(
//           aby * acz - abz * acy,
//           abz * acx - abx * acz,
//           abx * acy - aby * acx
//         ).normalize();
//       }
//       normals.push(normal.x, normal.y, normal.z);

//       // UV mapping simple
//       uvs.push(v.x * 0.5 + 0.5, v.y * 0.5 + 0.5);
//     }
//   }

//   const geometry = new THREE.BufferGeometry();
//   geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
//   geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
//   geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
//   geometry.computeVertexNormals();

//   return new THREE.Mesh(geometry, material);
// }





// function makeFaceFromIndices(solid, indices) {
//   const face = new Face();
//   let firstHe = null;
//   let prevHe = null;

//   for (let i = 0; i < indices.length; i++) {
//     const v = solid.vertices[indices[i]];

//     const he = new HalfEdge();
//     he.vertex = v;
//     he.face = face;

//     if (!firstHe) firstHe = he;
//     if (prevHe) prevHe.next = he;

//     solid.halfEdges.push(he);
//     prevHe = he;
//   }

//   // cerrar el loop
//   prevHe.next = firstHe;
//   face.edge = firstHe;
//   solid.faces.push(face);

//   return face;
// }

function makeFaceFromIndices(solid, indices, clockwise = true) {
  // Convertir índices a vértices reales
  const vertices = indices.map(i => solid.vertices[i]);

  // Delegar en makeFaceFromVertices
  return makeFaceFromVertices(solid, vertices, clockwise);
}



// function makeFaceFromVertices(solid, vertices) {
//   const face = new Face();
//   let firstHe = null;
//   let prevHe = null;

//   for (let i = 0; i < vertices.length; i++) {
//     const he = new HalfEdge();
//     he.vertex = vertices[i];
//     he.face = face;

//     if (!firstHe) firstHe = he;
//     if (prevHe) prevHe.next = he;

//     solid.halfEdges.push(he);

//     prevHe = he;
//   }

//   // Cerrar el loop
//   prevHe.next = firstHe;
//   face.edge = firstHe;

//   solid.faces.push(face);

//   return face;
// }

function makeFaceFromVertices(solid, vertices, clockwise = true) {
  // Si clockwise es false, invertir el orden de los vértices
  const verts = clockwise ? vertices : [...vertices].reverse();

  const face = new Face();
  let firstHe = null;
  let prevHe = null;

  for (let i = 0; i < verts.length; i++) {
    const he = new HalfEdge();
    he.vertex = verts[i];
    he.face = face;

    if (!firstHe) firstHe = he;
    if (prevHe) prevHe.next = he;

    solid.halfEdges.push(he);
    prevHe = he;
  }

  // cerrar el loop
  prevHe.next = firstHe;
  face.edge = firstHe;

  solid.faces.push(face);

  return face;
}





export function makeCube() {
  const s = new Solid();

  // Crear 8 vértices
  const V = [
    new Vertex(-1,-1,-1), new Vertex(1,-1,-1),
    new Vertex(1,1,-1),   new Vertex(-1,1,-1),
    new Vertex(-1,-1,1),  new Vertex(1,-1,1),
    new Vertex(1,1,1),    new Vertex(-1,1,1)
  ];
  s.vertices.push(...V);

  // Índices de las 6 caras del cubo
  const faces = [
    [0,1,2,3], // abajo
    [4,5,6,7], // arriba
    [0,1,5,4], // frente
    [2,3,7,6], // atrás
    [1,2,6,5], // derecha
    [3,0,4,7]  // izquierda
  ];

  // Construir cada cara usando la nueva función
  for (const f of faces) {
    makeFaceFromIndices(s, f);
  }

  return s;
}


export function extrudePolygon(points2D, height = 2) {
  const solid = new Solid();
  const bottom = [];
  const top = [];

  for (let p of points2D) {
    bottom.push(new Vertex(p.x, p.y, 0));
    top.push(new Vertex(p.x, p.y, height));
  }

  solid.vertices.push(...bottom, ...top);

  const n = points2D.length;

  // Cara inferior
  // makeFaceFromIndices(solid, bottom, false);
  makeFaceFromVertices(solid, bottom, false);
  console.log(bottom);
  // Cara superior
  makeFaceFromVertices(solid, top);
  console.log(top);

  // Caras laterales
  for (let i=0;i<n;i++){
    const a = bottom[i];
    const b = bottom[(i+1)%n];
    const c = top[(i+1)%n];
    const d = top[i];
    makeFaceFromVertices(solid, [a,b,c,d]);
  }

  return solid;
}

export function makeCylinder(radius = 1, height = 3, segments = 32) {
  const solid = new Solid();

  const bottom = [];
  const top = [];

  for (let i=0;i<segments;i++) {
    const a = (i / segments) * Math.PI * 2;
    bottom.push(new Vertex(Math.cos(a)*radius, Math.sin(a)*radius, 0));
    top.push(new Vertex(Math.cos(a)*radius, Math.sin(a)*radius, height));
  }

  solid.vertices.push(...bottom, ...top);

  // base
  makeFaceFromVertices(solid, bottom, false);
  console.log(bottom)
  // tapa
  makeFaceFromVertices(solid, top);

  // caras laterales
  for (let i=0;i<segments;i++){
    const a = bottom[i];
    const b = bottom[(i+1)%segments];
    const c = top[(i+1)%segments];
    const d = top[i];
    makeFaceFromVertices(solid, [a,b,c,d]);
  }

  return solid;
}


export function sweepProfile(profile2D, pathVector) {
  const bottom = profile2D.map(p=>new Vertex(p.x,p.y,0));
  const top = profile2D.map(p=>new Vertex(p.x + pathVector.x,
                                          p.y + pathVector.y,
                                          pathVector.z));
  const solid = new Solid();
  solid.vertices.push(...bottom, ...top);

  makeFaceFromVertices(solid, bottom);
  makeFaceFromVertices(solid, top);

  const n = bottom.length;
  for (let i=0;i<n;i++){
    makeFaceFromVertices(solid, [bottom[i], bottom[(i+1)%n], top[(i+1)%n], top[i]]);
  }

  return solid;
}

