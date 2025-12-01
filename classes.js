export class Vertex {
  constructor(x, y, z) {
    this.p = new THREE.Vector3(x, y, z);
    this.edges = [];
  }
}

export class HalfEdge {
  constructor() {
    this.vertex = null;     // donde inicia
    this.next = null;
    this.opposite = null;
    this.face = null;
  }
}

export class Face {
  constructor() {
    this.edge = null;       // half-edge del loop
  }
}

export class Solid {
  constructor() {
    this.vertices = [];
    this.halfEdges = [];
    this.faces = [];
  }
}
