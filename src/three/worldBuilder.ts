import * as THREE from 'three';
import { RegionId } from '../types/game';
import { ProceduralTextureSet } from './proceduralTextures';

export interface QuizTotemRef {
  id: number;
  group: THREE.Group;
  crystalMesh: THREE.Mesh;
  ringMesh: THREE.Mesh;
  hitProxy: THREE.Mesh;
  position: THREE.Vector3;
  baseY: number;
  cooldownUntil: number;
}

export interface StarCrystalRef {
  id: number;
  group: THREE.Group;
  gemMesh: THREE.Mesh;
  position: THREE.Vector3;
  baseY: number;
  active: boolean;
  respawnAt: number;
}

export interface WorldBuildResult {
  worldGroup: THREE.Group;
  groundClickMesh: THREE.Mesh;
  waterMesh: THREE.Mesh;
  totems: QuizTotemRef[];
  crystals: StarCrystalRef[];
  fireflyPoints: THREE.Points;
  habitatGroups: {
    gazebo: THREE.Group;
    hammock: THREE.Group;
    hotSpring: THREE.Group;
  };
  floatingIslets: THREE.Group[];
  disposables: { geometries: THREE.BufferGeometry[]; materials: THREE.Material[] };
}

export const ISLAND_PLAY_RADIUS = 16.5;

export function groundHeightAt(x: number, z: number, region: RegionId): number {
  const r = Math.sqrt(x * x + z * z);
  const gentleHill =
    Math.sin(x * 0.22) * Math.cos(z * 0.22) * 0.28 +
    Math.cos(r * 0.35) * 0.16;

  if (region === 'reruntuhan-melayang') {
    // Stepped concentric sanctuary plaza + smooth outer terrace
    if (r < 4.8) return 0.45;
    if (r < 8.5) return 0.22 + gentleHill * 0.45;
    return Math.max(0, gentleHill * 0.55);
  }
  if (region === 'hutan-berlentera') {
    return Math.max(-0.05, gentleHill * 0.85 + 0.12);
  }
  return Math.max(-0.05, gentleHill * 0.75 + 0.15);
}

function buildCompositeTree(
  region: RegionId,
  woodMat: THREE.Material,
  canopyMatA: THREE.Material,
  canopyMatB: THREE.Material,
  blossomMat: THREE.Material,
  scale: number,
): THREE.Group {
  const tree = new THREE.Group();

  // 1. Trunk
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18 * scale, 0.32 * scale, 1.8 * scale, 10),
    woodMat,
  );
  trunk.position.y = 0.9 * scale;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  tree.add(trunk);

  // 2. Branch
  const branch = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08 * scale, 0.13 * scale, 0.9 * scale, 8),
    woodMat,
  );
  branch.position.set(0.28 * scale, 1.45 * scale, 0.1 * scale);
  branch.rotation.z = -0.65;
  tree.add(branch);

  // 3-5. Multi-tiered rounded canopies
  const c1 = new THREE.Mesh(
    new THREE.DodecahedronGeometry(1.05 * scale, 1),
    canopyMatA,
  );
  c1.scale.set(1.15, 0.82, 1.1);
  c1.position.set(0, 2.25 * scale, 0);
  c1.castShadow = true;

  const c2 = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.78 * scale, 1),
    canopyMatB,
  );
  c2.position.set(0.55 * scale, 1.95 * scale, 0.22 * scale);
  c2.castShadow = true;

  const c3 = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.72 * scale, 1),
    canopyMatA,
  );
  c3.position.set(-0.48 * scale, 2.02 * scale, -0.25 * scale);
  c3.castShadow = true;

  tree.add(c1, c2, c3);

  // Accent blossoms or glowing moss pods
  const podGeo = new THREE.SphereGeometry(0.16 * scale, 10, 8);
  const podOffsets: [number, number, number][] = [
    [0.45, 2.55, 0.45],
    [-0.45, 2.4, 0.48],
    [0.1, 2.85, -0.32],
  ];
  podOffsets.forEach(([ox, oy, oz]) => {
    const pod = new THREE.Mesh(podGeo, blossomMat);
    pod.position.set(ox * scale, oy * scale, oz * scale);
    tree.add(pod);
  });

  if (region === 'hutan-berlentera') {
    // Hanging warm paper lantern from branch
    const cord = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, 0.35 * scale, 6),
      woodMat,
    );
    cord.position.set(0.58 * scale, 1.48 * scale, 0.15 * scale);
    const lantern = new THREE.Mesh(
      new THREE.SphereGeometry(0.18 * scale, 12, 10),
      blossomMat,
    );
    lantern.scale.set(0.9, 1.15, 0.9);
    lantern.position.set(0.58 * scale, 1.24 * scale, 0.15 * scale);
    tree.add(cord, lantern);
  }

  return tree;
}

function buildLanternPost(
  woodMat: THREE.Material,
  stoneMat: THREE.Material,
  glowMat: THREE.Material,
): THREE.Group {
  const post = new THREE.Group();

  const plinth = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.28, 0.24, 8),
    stoneMat,
  );
  plinth.position.y = 0.12;
  plinth.castShadow = true;

  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.09, 1.8, 8),
    woodMat,
  );
  pole.position.y = 1.02;
  pole.castShadow = true;

  const arm = new THREE.Mesh(
    new THREE.BoxGeometry(0.45, 0.07, 0.07),
    woodMat,
  );
  arm.position.set(0.18, 1.86, 0);

  const cap = new THREE.Mesh(
    new THREE.ConeGeometry(0.22, 0.14, 6),
    stoneMat,
  );
  cap.position.set(0.36, 1.72, 0);

  const bulb = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.14, 1),
    glowMat,
  );
  bulb.position.set(0.36, 1.54, 0);

  post.add(plinth, pole, arm, cap, bulb);
  return post;
}

function buildSanctuaryHabitats(
  woodMat: THREE.Material,
  stoneMat: THREE.Material,
  fabricMat: THREE.Material,
  waterGlowMat: THREE.Material,
  lanternMat: THREE.Material,
): { gazebo: THREE.Group; hammock: THREE.Group; hotSpring: THREE.Group } {
  // 1. Gazebo Teh Hangat (Tea Gazebo) — 8 parts
  const gazebo = new THREE.Group();
  const deck = new THREE.Mesh(
    new THREE.CylinderGeometry(2.1, 2.25, 0.22, 8),
    woodMat,
  );
  deck.position.y = 0.11;
  deck.receiveShadow = true;
  gazebo.add(deck);

  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2 + Math.PI / 4;
    const pillar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 0.1, 2.1, 8),
      woodMat,
    );
    pillar.position.set(Math.cos(a) * 1.45, 1.25, Math.sin(a) * 1.45);
    pillar.castShadow = true;
    gazebo.add(pillar);
  }

  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(2.5, 1.15, 8),
    fabricMat,
  );
  roof.position.y = 2.75;
  roof.castShadow = true;
  const finial = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.18, 0),
    lanternMat,
  );
  finial.position.y = 3.42;
  const teaTable = new THREE.Mesh(
    new THREE.CylinderGeometry(0.58, 0.45, 0.34, 12),
    woodMat,
  );
  teaTable.position.y = 0.39;
  const teapot = new THREE.Mesh(
    new THREE.SphereGeometry(0.15, 12, 10),
    stoneMat,
  );
  teapot.position.y = 0.68;
  gazebo.add(roof, finial, teaTable, teapot);

  // 2. Ayunan Cahaya Bintang (Starlight Hammock) — 6 parts
  const hammock = new THREE.Group();
  [-1.35, 1.35].forEach((px) => {
    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 0.12, 2.0, 8),
      woodMat,
    );
    post.position.set(px, 1.0, 0);
    post.rotation.z = px < 0 ? 0.14 : -0.14;
    post.castShadow = true;
    hammock.add(post);
  });
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.06, 2.6, 8),
    woodMat,
  );
  beam.rotation.z = Math.PI / 2;
  beam.position.y = 1.9;
  const slingCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-1.1, 1.45, 0),
    new THREE.Vector3(0, 0.72, 0),
    new THREE.Vector3(1.1, 1.45, 0),
  ]);
  const sling = new THREE.Mesh(
    new THREE.TubeGeometry(slingCurve, 16, 0.24, 8, false),
    fabricMat,
  );
  sling.scale.set(1, 0.35, 1.8);
  const starLamp = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.18, 0),
    lanternMat,
  );
  starLamp.position.set(0, 1.62, 0.2);
  hammock.add(beam, sling, starLamp);

  // 3. Kolam Teratai Beruap (Lotus Hot Spring) — 6+ parts
  const hotSpring = new THREE.Group();
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(1.75, 0.32, 12, 24),
    stoneMat,
  );
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.22;
  rim.castShadow = true;
  rim.receiveShadow = true;

  const poolWater = new THREE.Mesh(
    new THREE.CircleGeometry(1.62, 24),
    waterGlowMat,
  );
  poolWater.rotation.x = -Math.PI / 2;
  poolWater.position.y = 0.24;

  const padGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.04, 14);
  const padMat = new THREE.MeshStandardMaterial({ color: '#4EA874', roughness: 0.7 });
  [
    [-0.65, 0.26, 0.45],
    [0.55, 0.26, -0.5],
    [0.35, 0.26, 0.7],
  ].forEach(([lx, ly, lz]) => {
    const pad = new THREE.Mesh(padGeo, padMat);
    pad.position.set(lx, ly, lz);
    const blossom = new THREE.Mesh(
      new THREE.ConeGeometry(0.12, 0.16, 6),
      fabricMat,
    );
    blossom.rotation.x = Math.PI;
    blossom.position.set(lx, ly + 0.09, lz);
    hotSpring.add(pad, blossom);
  });

  hotSpring.add(rim, poolWater);
  return { gazebo, hammock, hotSpring };
}

export function buildRegionWorld(
  region: RegionId,
  textures: ProceduralTextureSet,
  isSoftwareGl: boolean,
): WorldBuildResult {
  const worldGroup = new THREE.Group();
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];

  const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
    geometries.push(g);
    return g;
  };
  const trackMat = <T extends THREE.Material>(m: T): T => {
    materials.push(m);
    return m;
  };

  // Theme Colors per Region
  const palette =
    region === 'pulau-damai'
      ? {
          grass: '#81C784',
          cliff: '#8D7B68',
          water: '#62B6CB',
          wood: '#8C6239',
          canopyA: '#66BB6A',
          canopyB: '#9CCC65',
          blossom: '#FFCAD4',
          lantern: '#FFE082',
          stone: '#B8B5AD',
          fabric: '#F4A261',
          totemColor: '#FFD166',
        }
      : region === 'hutan-berlentera'
        ? {
            grass: '#457B62',
            cliff: '#4A4E69',
            water: '#2A546B',
            wood: '#6D4C3D',
            canopyA: '#2D6A4F',
            canopyB: '#40916C',
            blossom: '#FFB703',
            lantern: '#FFCA3A',
            stone: '#7B8499',
            fabric: '#E07A5F',
            totemColor: '#FFB703',
          }
        : {
            grass: '#8A8FB5',
            cliff: '#5B5982',
            water: '#8ECAE6',
            wood: '#7A6F9B',
            canopyA: '#A594F9',
            canopyB: '#80CED7',
            blossom: '#FDE4CF',
            lantern: '#A2E5FA',
            stone: '#D6D4E0',
            fabric: '#C77DFF',
            totemColor: '#90E0EF',
          };

  // Materials
  const grassMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: palette.grass,
      map: region === 'reruntuhan-melayang' ? textures.stoneMap : textures.meadowMap,
      roughness: 0.88,
      metalness: 0.02,
    }),
  );
  const cliffMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: palette.cliff,
      map: textures.stoneMap,
      roughness: 0.92,
      metalness: 0.04,
    }),
  );
  const woodMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: palette.wood,
      map: textures.woodMap,
      roughness: 0.78,
      metalness: 0.04,
    }),
  );
  const canopyMatA = trackMat(
    new THREE.MeshStandardMaterial({
      color: palette.canopyA,
      roughness: 0.82,
      metalness: 0.02,
    }),
  );
  const canopyMatB = trackMat(
    new THREE.MeshStandardMaterial({
      color: palette.canopyB,
      roughness: 0.78,
      metalness: 0.02,
    }),
  );
  const blossomMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: palette.blossom,
      emissive: region === 'pulau-damai' ? '#000000' : palette.blossom,
      emissiveIntensity: region === 'pulau-damai' ? 0 : 0.65,
      roughness: 0.55,
    }),
  );
  const lanternMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: palette.lantern,
      emissive: palette.lantern,
      emissiveIntensity: 1.15,
      roughness: 0.25,
    }),
  );
  const stoneMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: palette.stone,
      map: textures.stoneMap,
      roughness: 0.68,
      metalness: 0.08,
    }),
  );
  const fabricMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: palette.fabric,
      roughness: 0.85,
      metalness: 0.02,
    }),
  );
  const waterGlowMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: '#88E1F2',
      emissive: '#48CAE4',
      emissiveIntensity: 0.45,
      roughness: 0.18,
      metalness: 0.15,
    }),
  );

  // 1. Main sculpted Island Mass (subdivided disc displaced by groundHeightAt)
  const islandGeo = trackGeo(new THREE.CylinderGeometry(18.5, 14.5, 4.0, 48, 8));
  const posAttr = islandGeo.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    const vx = posAttr.getX(i);
    const vy = posAttr.getY(i);
    const vz = posAttr.getZ(i);
    if (vy > 1.8) {
      // Top surface
      posAttr.setY(i, groundHeightAt(vx, vz, region));
    } else if (vy < -1.8) {
      posAttr.setY(i, -4.2);
    }
  }
  islandGeo.computeVertexNormals();

  const islandTop = new THREE.Mesh(islandGeo, [
    cliffMat,
    grassMat,
    cliffMat,
  ]);
  islandTop.receiveShadow = true;
  islandTop.castShadow = false;
  worldGroup.add(islandTop);

  // Invisible flat-ish raycast proxy for smooth click-to-move
  const clickGeo = trackGeo(new THREE.CircleGeometry(ISLAND_PLAY_RADIUS, 40));
  clickGeo.rotateX(-Math.PI / 2);
  const clickMat = trackMat(new THREE.MeshBasicMaterial({ visible: false }));
  const groundClickMesh = new THREE.Mesh(clickGeo, clickMat);
  groundClickMesh.position.y = 0.25;
  groundClickMesh.layers.set(1);
  worldGroup.add(groundClickMesh);

  // 2. Vast surrounding Ocean / Cloud Sea (no boxed walls!)
  const waterGeo = trackGeo(new THREE.PlaneGeometry(240, 240, 32, 32));
  waterGeo.rotateX(-Math.PI / 2);
  const waterMat = trackMat(
    new THREE.MeshPhysicalMaterial({
      color: palette.water,
      roughness: region === 'reruntuhan-melayang' ? 0.65 : 0.18,
      metalness: 0.12,
      clearcoat: region === 'reruntuhan-melayang' ? 0.2 : 0.85,
      transparent: true,
      opacity: region === 'reruntuhan-melayang' ? 0.72 : 0.9,
    }),
  );
  const waterMesh = new THREE.Mesh(waterGeo, waterMat);
  waterMesh.position.y = region === 'reruntuhan-melayang' ? -3.4 : -0.85;
  waterMesh.receiveShadow = true;
  worldGroup.add(waterMesh);

  // 3. Scenic Peripheral Floating / Surrounding Islets for horizon depth
  const floatingIslets: THREE.Group[] = [];
  const isletSpots: [number, number, number, number][] = [
    [-26, -18, 1.5, 4.2],
    [25, -21, 2.2, 3.6],
    [-24, 22, 0.9, 3.3],
    [27, 19, 1.8, 4.0],
    [0, -30, 2.8, 4.8],
  ];
  isletSpots.forEach(([ix, iz, iy, rad]) => {
    const islet = new THREE.Group();
    const base = new THREE.Mesh(
      trackGeo(new THREE.ConeGeometry(rad, rad * 1.15, 7)),
      cliffMat,
    );
    base.rotation.x = Math.PI;
    base.position.y = -rad * 0.55;
    const cap = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(rad, rad * 0.94, 0.5, 7)),
      grassMat,
    );
    islet.add(base, cap);

    if (region === 'reruntuhan-melayang') {
      const miniCrystal = new THREE.Mesh(
        trackGeo(new THREE.OctahedronGeometry(0.65, 0)),
        lanternMat,
      );
      miniCrystal.position.y = 1.25;
      islet.add(miniCrystal);
    } else {
      const miniTree = buildCompositeTree(
        region,
        woodMat,
        canopyMatA,
        canopyMatB,
        blossomMat,
        0.75,
      );
      miniTree.position.y = 0.2;
      islet.add(miniTree);
    }
    islet.position.set(ix, region === 'reruntuhan-melayang' ? iy + 1.5 : -0.4, iz);
    islet.userData.baseY = islet.position.y;
    worldGroup.add(islet);
    floatingIslets.push(islet);
  });

  // 4. Central Region Landmark (Bridge / Archway / Runic Sanctuary Circle)
  if (region === 'reruntuhan-melayang') {
    const plaza = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(4.6, 4.9, 0.3, 24)),
      stoneMat,
    );
    plaza.position.y = 0.34;
    plaza.receiveShadow = true;
    worldGroup.add(plaza);

    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI * 2) / 6;
      const col = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.24, 0.3, i % 2 === 0 ? 2.4 : 1.7, 8)),
        stoneMat,
      );
      col.position.set(Math.cos(a) * 4.2, 0.4 + (i % 2 === 0 ? 1.2 : 0.85), Math.sin(a) * 4.2);
      col.castShadow = true;
      worldGroup.add(col);
    }
  } else {
    // Cozy stone stepping path around center
    const stepGeo = trackGeo(new THREE.CylinderGeometry(0.55, 0.62, 0.14, 8));
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI * 2) / 8;
      const sx = Math.cos(a) * 3.8;
      const sz = Math.sin(a) * 3.8;
      const step = new THREE.Mesh(stepGeo, stoneMat);
      step.position.set(sx, groundHeightAt(sx, sz, region) + 0.04, sz);
      step.receiveShadow = true;
      worldGroup.add(step);
    }
  }

  // 5. Perimeter Trees & Lantern Posts (Natural outdoor border)
  const treeCoords: [number, number, number][] = [
    [-12.5, -10.2, 1.15],
    [-14.2, -3.5, 0.95],
    [-13.0, 6.2, 1.1],
    [-8.5, 12.6, 1.0],
    [11.8, -11.4, 1.2],
    [14.0, -2.5, 0.92],
    [13.2, 7.5, 1.08],
    [7.8, 13.0, 0.98],
    [-4.2, -13.8, 1.12],
    [4.6, -13.6, 1.02],
  ];
  treeCoords.forEach(([tx, tz, sc]) => {
    const tree = buildCompositeTree(
      region,
      woodMat,
      canopyMatA,
      canopyMatB,
      blossomMat,
      sc,
    );
    tree.position.set(tx, groundHeightAt(tx, tz, region) - 0.05, tz);
    tree.rotation.y = tx * 0.7;
    worldGroup.add(tree);
  });

  const lanternCoords: [number, number][] = [
    [-6.2, -5.8],
    [6.5, -5.6],
    [-6.8, 6.4],
    [6.8, 6.2],
  ];
  lanternCoords.forEach(([lx, lz]) => {
    const post = buildLanternPost(woodMat, stoneMat, lanternMat);
    post.position.set(lx, groundHeightAt(lx, lz, region), lz);
    post.rotation.y = Math.atan2(-lx, -lz);
    worldGroup.add(post);
  });

  // 6. Instanced Rocks & Wildflowers (>= 20 repeated props with color variation)
  const flowerCount = 54;
  const flowerGeo = trackGeo(new THREE.ConeGeometry(0.16, 0.22, 6));
  flowerGeo.rotateX(Math.PI);
  const flowerMat = trackMat(
    new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: 0.7 }),
  );
  const flowerInstanced = new THREE.InstancedMesh(flowerGeo, flowerMat, flowerCount);
  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  const flowerPalette =
    region === 'pulau-damai'
      ? ['#FFB5C2', '#FFF3B0', '#BDE0FE', '#FFC6FF']
      : region === 'hutan-berlentera'
        ? ['#FFD166', '#A8E6CF', '#FFAAA5', '#FFE5B4']
        : ['#CDB4DB', '#A2D2FF', '#BDE0FE', '#FDE4CF'];

  for (let i = 0; i < flowerCount; i++) {
    const angle = i * 2.39996;
    const rad = 4.8 + ((i * 1.7) % 10.5);
    const fx = Math.cos(angle) * rad;
    const fz = Math.sin(angle) * rad;
    const fy = groundHeightAt(fx, fz, region);
    dummy.position.set(fx, fy + 0.12, fz);
    dummy.rotation.set(0, angle, 0);
    const sc = 0.8 + (i % 4) * 0.14;
    dummy.scale.setScalar(sc);
    dummy.updateMatrix();
    flowerInstanced.setMatrixAt(i, dummy.matrix);
    color.set(flowerPalette[i % flowerPalette.length]);
    flowerInstanced.setColorAt(i, color);
  }
  flowerInstanced.instanceMatrix.needsUpdate = true;
  if (flowerInstanced.instanceColor) {
    flowerInstanced.instanceColor.needsUpdate = true;
  }
  flowerInstanced.computeBoundingSphere();
  worldGroup.add(flowerInstanced);

  // 7. Interactive Quiz Totems (6 serene shrines around the island)
  const totemPositions: [number, number][] = [
    [0, -7.8],
    [8.2, -3.0],
    [7.4, 7.6],
    [0, 9.2],
    [-8.0, 7.0],
    [-8.4, -3.2],
  ];
  const totems: QuizTotemRef[] = [];
  const totemCrystalMat = trackMat(
    new THREE.MeshPhysicalMaterial({
      color: palette.totemColor,
      emissive: palette.totemColor,
      emissiveIntensity: 0.72,
      roughness: 0.15,
      metalness: 0.1,
      clearcoat: 1.0,
      transmission: isSoftwareGl ? 0 : 0.35,
    }),
  );
  const ringMat = trackMat(
    new THREE.MeshBasicMaterial({
      color: palette.totemColor,
      transparent: true,
      opacity: 0.42,
      side: THREE.DoubleSide,
    }),
  );
  const proxyMat = trackMat(new THREE.MeshBasicMaterial({ visible: false }));

  totemPositions.forEach(([tx, tz], idx) => {
    const ty = groundHeightAt(tx, tz, region);
    const tGroup = new THREE.Group();
    tGroup.position.set(tx, ty, tz);

    const base = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.65, 0.82, 0.32, 8)),
      stoneMat,
    );
    base.position.y = 0.16;
    base.castShadow = true;
    base.receiveShadow = true;

    const pillar = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.32, 0.45, 0.78, 8)),
      stoneMat,
    );
    pillar.position.y = 0.68;
    pillar.castShadow = true;

    const crystalMesh = new THREE.Mesh(
      trackGeo(new THREE.OctahedronGeometry(0.38, 0)),
      totemCrystalMat,
    );
    crystalMesh.position.y = 1.55;
    crystalMesh.castShadow = true;

    const ringMesh = new THREE.Mesh(
      trackGeo(new THREE.RingGeometry(0.88, 1.05, 28)),
      ringMat,
    );
    ringMesh.rotation.x = -Math.PI / 2;
    ringMesh.position.y = 0.04;

    // Invisible raycast proxy cylinder on Layer 1
    const hitProxy = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(1.0, 1.0, 2.3, 12)),
      proxyMat,
    );
    hitProxy.position.y = 1.15;
    hitProxy.layers.set(1);
    hitProxy.userData = { kind: 'totem', totemId: idx };

    tGroup.add(base, pillar, crystalMesh, ringMesh, hitProxy);
    worldGroup.add(tGroup);

    totems.push({
      id: idx,
      group: tGroup,
      crystalMesh,
      ringMesh,
      hitProxy,
      position: new THREE.Vector3(tx, ty, tz),
      baseY: 1.55,
      cooldownUntil: 0,
    });
  });

  // 8. Collectible Star Crystals (9 floating shards along paths)
  const crystalPositions: [number, number][] = [
    [3.5, -4.5],
    [-3.5, -4.5],
    [5.0, 1.8],
    [-5.0, 1.8],
    [3.8, 5.2],
    [-3.8, 5.2],
    [10.2, 2.5],
    [-10.2, 2.5],
    [0, -11.5],
  ];
  const crystals: StarCrystalRef[] = [];
  const starShardMat = trackMat(
    new THREE.MeshPhysicalMaterial({
      color: '#FFE066',
      emissive: '#FFB703',
      emissiveIntensity: 0.75,
      roughness: 0.12,
      metalness: 0.18,
      clearcoat: 1.0,
    }),
  );

  crystalPositions.forEach(([cx, cz], idx) => {
    const cy = groundHeightAt(cx, cz, region);
    const cGroup = new THREE.Group();
    cGroup.position.set(cx, cy, cz);

    const gemMesh = new THREE.Mesh(
      trackGeo(new THREE.OctahedronGeometry(0.26, 0)),
      starShardMat,
    );
    gemMesh.scale.set(0.85, 1.35, 0.85);
    gemMesh.position.y = 0.65;

    const glowRing = new THREE.Mesh(
      trackGeo(new THREE.RingGeometry(0.32, 0.42, 20)),
      ringMat,
    );
    glowRing.rotation.x = -Math.PI / 2;
    glowRing.position.y = 0.03;

    cGroup.add(gemMesh, glowRing);
    worldGroup.add(cGroup);

    crystals.push({
      id: idx,
      group: cGroup,
      gemMesh,
      position: new THREE.Vector3(cx, cy, cz),
      baseY: 0.65,
      active: true,
      respawnAt: 0,
    });
  });

  // 9. Sanctuary Habitats (unlocked via Sanctuary Treats/Habitats upgrade)
  const habitats = buildSanctuaryHabitats(
    woodMat,
    stoneMat,
    fabricMat,
    waterGlowMat,
    lanternMat,
  );
  habitats.gazebo.position.set(-4.2, groundHeightAt(-4.2, -1.5, region), -1.5);
  habitats.gazebo.visible = false;

  habitats.hammock.position.set(4.5, groundHeightAt(4.5, -1.5, region), -1.5);
  habitats.hammock.rotation.y = -0.4;
  habitats.hammock.visible = false;

  habitats.hotSpring.position.set(0, groundHeightAt(0, 4.6, region), 4.6);
  habitats.hotSpring.visible = false;

  worldGroup.add(habitats.gazebo, habitats.hammock, habitats.hotSpring);

  // 10. Ambient Floating Fireflies / Star Motes
  const fireflyCount = 60;
  const fPositions = new Float32Array(fireflyCount * 3);
  for (let i = 0; i < fireflyCount; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 2 + Math.random() * 14;
    fPositions[i * 3] = Math.cos(a) * r;
    fPositions[i * 3 + 1] = 0.7 + Math.random() * 3.2;
    fPositions[i * 3 + 2] = Math.sin(a) * r;
  }
  const fireflyGeo = trackGeo(new THREE.BufferGeometry());
  fireflyGeo.setAttribute('position', new THREE.BufferAttribute(fPositions, 3));
  const fireflyMat = trackMat(
    new THREE.PointsMaterial({
      color: region === 'pulau-damai' ? '#FFF8D6' : palette.lantern,
      map: textures.glowSpriteMap,
      size: region === 'hutan-berlentera' ? 0.55 : 0.42,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  const fireflyPoints = new THREE.Points(fireflyGeo, fireflyMat);
  worldGroup.add(fireflyPoints);

  return {
    worldGroup,
    groundClickMesh,
    waterMesh,
    totems,
    crystals,
    fireflyPoints,
    habitatGroups: habitats,
    floatingIslets,
    disposables: { geometries, materials },
  };
}
