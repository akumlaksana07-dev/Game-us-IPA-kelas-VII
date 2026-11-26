import * as THREE from 'three';
import { COMPANIONS } from '../data/companions';
import { CompanionId, EvolutionStage } from '../types/game';

export interface CompanionAnimRefs {
  bodyGroup: THREE.Group;
  earLeft?: THREE.Object3D;
  earRight?: THREE.Object3D;
  tailGroup?: THREE.Object3D;
  wingLeft?: THREE.Object3D;
  wingRight?: THREE.Object3D;
  haloGroup?: THREE.Object3D;
  crestGroup?: THREE.Object3D;
}

export function buildCompanionMesh(
  companionId: CompanionId,
  stage: EvolutionStage,
  contactShadowMap: THREE.Texture,
  isSoftwareGl: boolean,
): THREE.Group {
  const def = COMPANIONS[companionId];
  const root = new THREE.Group();
  root.name = `companion-${companionId}-s${stage}`;

  // Contact shadow disc grounded at y = 0.02
  const shadowMat = new THREE.MeshBasicMaterial({
    map: contactShadowMap,
    transparent: true,
    opacity: 0.48,
    depthWrite: false,
  });
  const shadowPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(1.35 + stage * 0.22, 1.35 + stage * 0.22),
    shadowMat,
  );
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.y = 0.02;
  root.add(shadowPlane);

  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);

  // Calibrated PBR materials with >= 0.25 roughness contrast across parts
  const primaryMat = new THREE.MeshStandardMaterial({
    color: def.primaryColor,
    roughness: 0.72,
    metalness: 0.04,
  });

  const secondaryMat = new THREE.MeshStandardMaterial({
    color: def.secondaryColor,
    roughness: 0.82,
    metalness: 0.02,
  });

  const accentMat = new THREE.MeshStandardMaterial({
    color: def.accentColor,
    roughness: 0.42,
    metalness: 0.12,
  });

  const crystalMat = new THREE.MeshPhysicalMaterial({
    color: def.glowColor,
    emissive: def.glowColor,
    emissiveIntensity: stage === 3 ? 0.85 : 0.45,
    roughness: 0.14,
    metalness: 0.08,
    clearcoat: 1.0,
    clearcoatRoughness: 0.08,
    transmission: isSoftwareGl ? 0 : 0.45,
    transparent: true,
    opacity: isSoftwareGl ? 0.88 : 1.0,
  });

  const eyeMat = new THREE.MeshStandardMaterial({
    color: '#1E2430',
    roughness: 0.18,
    metalness: 0.1,
  });

  const eyeHighlightMat = new THREE.MeshBasicMaterial({ color: '#FFFFFF' });
  const cheekMat = new THREE.MeshStandardMaterial({
    color: companionId === 'fluffox' ? '#FF7B7B' : '#F48FB1',
    roughness: 0.75,
    emissive: '#FF7B7B',
    emissiveIntensity: 0.15,
  });

  const goldTrimMat = new THREE.MeshStandardMaterial({
    color: '#F6D365',
    roughness: 0.22,
    metalness: 0.82,
  });

  const scaleFactor = stage === 1 ? 0.88 : stage === 2 ? 1.04 : 1.18;
  bodyGroup.scale.setScalar(scaleFactor);

  // 1. Primary silhouette: Rounded torso (grounded so feet sit at y=0)
  const torso = new THREE.Mesh(
    new THREE.SphereGeometry(0.36, 24, 20),
    primaryMat,
  );
  torso.scale.set(1.0, 0.96, 1.08);
  torso.position.set(0, 0.44, 0);
  torso.castShadow = true;
  torso.receiveShadow = true;
  bodyGroup.add(torso);

  // Belly patch
  const belly = new THREE.Mesh(
    new THREE.SphereGeometry(0.26, 20, 16),
    secondaryMat,
  );
  belly.scale.set(0.95, 0.9, 0.65);
  belly.position.set(0, 0.41, 0.22);
  bodyGroup.add(belly);

  // 4 cute rounded paws sitting flush at y=0
  const pawPositions: [number, number, number][] = [
    [-0.18, 0.08, 0.16],
    [0.18, 0.08, 0.16],
    [-0.2, 0.08, -0.15],
    [0.2, 0.08, -0.15],
  ];
  const pawGeo = new THREE.SphereGeometry(0.1, 14, 12);
  pawPositions.forEach(([px, py, pz]) => {
    const paw = new THREE.Mesh(pawGeo, secondaryMat);
    paw.scale.set(1.0, 0.78, 1.2);
    paw.position.set(px, py, pz);
    paw.castShadow = true;
    bodyGroup.add(paw);
  });

  // 2. Head group
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.34, 24, 20),
    primaryMat,
  );
  head.scale.set(1.08, 0.94, 0.98);
  head.position.set(0, 0.86, 0.12);
  head.castShadow = true;
  bodyGroup.add(head);

  // Expressive eyes + sparkle highlights + rosy cheeks
  [-0.13, 0.13].forEach((ex) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.055, 14, 12), eyeMat);
    eye.scale.set(0.9, 1.15, 0.7);
    eye.position.set(ex, 0.88, 0.41);
    bodyGroup.add(eye);

    const glint = new THREE.Mesh(
      new THREE.SphereGeometry(0.02, 8, 8),
      eyeHighlightMat,
    );
    glint.position.set(ex + 0.016, 0.905, 0.445);
    bodyGroup.add(glint);

    const cheek = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 12, 10),
      cheekMat,
    );
    cheek.scale.set(1.2, 0.75, 0.5);
    cheek.position.set(ex * 1.65, 0.8, 0.37);
    bodyGroup.add(cheek);
  });

  // Tiny nose
  const nose = new THREE.Mesh(
    new THREE.SphereGeometry(0.032, 10, 10),
    accentMat,
  );
  nose.position.set(0, 0.82, 0.46);
  bodyGroup.add(nose);

  // 3. Species-specific ears & tail
  const earLeft = new THREE.Group();
  const earRight = new THREE.Group();
  earLeft.position.set(-0.22, 1.08, 0.08);
  earRight.position.set(0.22, 1.08, 0.08);

  if (companionId === 'fluffox') {
    const earGeo = new THREE.ConeGeometry(0.11, 0.38 + stage * 0.06, 16);
    const tipGeo = new THREE.ConeGeometry(0.065, 0.14, 14);
    [earLeft, earRight].forEach((ear, idx) => {
      const base = new THREE.Mesh(earGeo, primaryMat);
      base.position.y = 0.14;
      base.castShadow = true;
      const tip = new THREE.Mesh(tipGeo, stage >= 2 ? crystalMat : accentMat);
      tip.position.y = 0.28 + stage * 0.03;
      ear.add(base, tip);
      ear.rotation.z = idx === 0 ? 0.35 : -0.35;
      ear.rotation.x = 0.12;
      bodyGroup.add(ear);
    });
  } else if (companionId === 'mossbun') {
    const earGeo = new THREE.CapsuleGeometry(0.075, 0.28 + stage * 0.05, 6, 12);
    [earLeft, earRight].forEach((ear, idx) => {
      const leafEar = new THREE.Mesh(earGeo, accentMat);
      leafEar.scale.set(1.1, 1.0, 0.55);
      leafEar.position.y = 0.16;
      leafEar.castShadow = true;
      ear.add(leafEar);
      ear.rotation.z = idx === 0 ? 0.26 : -0.26;
      ear.rotation.x = -0.1;
      bodyGroup.add(ear);
    });
  } else if (companionId === 'aqualume') {
    const finShape = new THREE.Shape();
    finShape.moveTo(0, 0);
    finShape.quadraticCurveTo(0.18, 0.16, 0.05, 0.36);
    finShape.quadraticCurveTo(-0.08, 0.22, 0, 0);
    const finGeo = new THREE.ExtrudeGeometry(finShape, {
      depth: 0.03,
      bevelEnabled: true,
      bevelThickness: 0.015,
      bevelSize: 0.015,
      bevelSegments: 2,
    });
    [earLeft, earRight].forEach((ear, idx) => {
      const fin = new THREE.Mesh(finGeo, crystalMat);
      fin.scale.x = idx === 0 ? -1 : 1;
      fin.rotation.y = idx === 0 ? -0.3 : 0.3;
      ear.add(fin);
      ear.rotation.z = idx === 0 ? 0.55 : -0.55;
      bodyGroup.add(ear);
    });
  } else {
    // pyrokit rounded lion-cub ears + warm mane tuft
    const earGeo = new THREE.SphereGeometry(0.11, 14, 12);
    const innerGeo = new THREE.SphereGeometry(0.065, 10, 10);
    [earLeft, earRight].forEach((ear, idx) => {
      const outer = new THREE.Mesh(earGeo, primaryMat);
      outer.scale.set(1, 1, 0.6);
      const inner = new THREE.Mesh(innerGeo, secondaryMat);
      inner.position.z = 0.04;
      ear.add(outer, inner);
      ear.position.set(idx === 0 ? -0.25 : 0.25, 1.09, 0.1);
      bodyGroup.add(ear);
    });
  }

  // Tail Group
  const tailGroup = new THREE.Group();
  tailGroup.position.set(0, 0.36, -0.32);
  const tailCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0.12, -0.22),
    new THREE.Vector3(0, 0.34, -0.32),
  ]);
  const tailTube = new THREE.Mesh(
    new THREE.TubeGeometry(tailCurve, 12, 0.085, 10, false),
    primaryMat,
  );
  tailTube.castShadow = true;
  tailGroup.add(tailTube);

  const tailTip = new THREE.Mesh(
    new THREE.SphereGeometry(stage === 1 ? 0.11 : 0.14, 14, 12),
    stage >= 2 ? crystalMat : secondaryMat,
  );
  tailTip.position.set(0, 0.36, -0.34);
  tailGroup.add(tailTip);
  bodyGroup.add(tailGroup);

  // 4. Evolution-stage silhouettes & accents
  const crestGroup = new THREE.Group();
  crestGroup.position.set(0, 1.18, 0.14);
  bodyGroup.add(crestGroup);

  if (stage === 1) {
    // Sproutling: adorable tiny leaf/bud crest on head
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.025, 0.14, 8),
      accentMat,
    );
    stem.position.y = 0.06;
    const bud = new THREE.Mesh(
      new THREE.SphereGeometry(0.065, 12, 10),
      crystalMat,
    );
    bud.scale.set(1.2, 0.85, 0.9);
    bud.position.set(0.04, 0.14, 0);
    crestGroup.add(stem, bud);
  }

  if (stage >= 2) {
    // Glowling & Astral: cozy flowing scarf/collar + glowing gem medallion
    const collar = new THREE.Mesh(
      new THREE.TorusGeometry(0.24, 0.055, 12, 24),
      accentMat,
    );
    collar.rotation.x = Math.PI / 2 + 0.18;
    collar.position.set(0, 0.64, 0.08);
    bodyGroup.add(collar);

    const gem = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.075, 0),
      crystalMat,
    );
    gem.position.set(0, 0.6, 0.34);
    bodyGroup.add(gem);

    // Floating crown gem on head
    const crownGem = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.09, 0),
      crystalMat,
    );
    crownGem.position.set(0, 0.12, 0.04);
    crestGroup.add(crownGem);
  }

  let wingLeft: THREE.Object3D | undefined;
  let wingRight: THREE.Object3D | undefined;
  let haloGroup: THREE.Group | undefined;

  if (stage === 3) {
    // Astral Form: Radiant wings + orbiting starlight halo + gold trim ring
    const wingShape = new THREE.Shape();
    wingShape.moveTo(0, 0);
    wingShape.bezierCurveTo(0.32, 0.35, 0.58, 0.25, 0.65, -0.05);
    wingShape.bezierCurveTo(0.45, -0.15, 0.22, -0.12, 0, -0.08);

    const wingGeo = new THREE.ExtrudeGeometry(wingShape, {
      depth: 0.025,
      bevelEnabled: true,
      bevelThickness: 0.012,
      bevelSize: 0.012,
      bevelSegments: 2,
    });

    const wL = new THREE.Group();
    const wR = new THREE.Group();
    const meshL = new THREE.Mesh(wingGeo, crystalMat);
    meshL.scale.x = -1;
    const meshR = new THREE.Mesh(wingGeo, crystalMat);

    wL.add(meshL);
    wR.add(meshR);
    wL.position.set(-0.26, 0.62, -0.18);
    wR.position.set(0.26, 0.62, -0.18);
    wL.rotation.y = 0.4;
    wR.rotation.y = -0.4;
    bodyGroup.add(wL, wR);
    wingLeft = wL;
    wingRight = wR;

    // Orbiting Astral Halo with 3 miniature star crystals
    haloGroup = new THREE.Group();
    haloGroup.position.set(0, 1.38, 0.05);
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.34, 0.018, 10, 32),
      goldTrimMat,
    );
    ring.rotation.x = Math.PI / 2 - 0.15;
    haloGroup.add(ring);

    for (let i = 0; i < 3; i++) {
      const angle = (i * Math.PI * 2) / 3;
      const orb = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.055, 0),
        crystalMat,
      );
      orb.position.set(Math.cos(angle) * 0.34, 0, Math.sin(angle) * 0.34);
      haloGroup.add(orb);
    }
    bodyGroup.add(haloGroup);
  }

  const animRefs: CompanionAnimRefs = {
    bodyGroup,
    earLeft,
    earRight,
    tailGroup,
    wingLeft,
    wingRight,
    haloGroup,
    crestGroup,
  };
  root.userData.animRefs = animRefs;

  return root;
}

export function buildExplorerMesh(contactShadowMap: THREE.Texture): THREE.Group {
  const root = new THREE.Group();
  root.name = 'explorer-player';

  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(1.15, 1.15),
    new THREE.MeshBasicMaterial({
      map: contactShadowMap,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.02;
  root.add(shadow);

  const actor = new THREE.Group();
  root.add(actor);

  const coatMat = new THREE.MeshStandardMaterial({
    color: '#4B7F78',
    roughness: 0.78,
    metalness: 0.04,
  });
  const scarfMat = new THREE.MeshStandardMaterial({
    color: '#E89B4C',
    roughness: 0.72,
    metalness: 0.05,
  });
  const skinMat = new THREE.MeshStandardMaterial({
    color: '#FAD7C0',
    roughness: 0.62,
    metalness: 0.02,
  });
  const bootMat = new THREE.MeshStandardMaterial({
    color: '#5C4033',
    roughness: 0.5,
    metalness: 0.08,
  });
  const lanternGlassMat = new THREE.MeshStandardMaterial({
    color: '#FFE699',
    emissive: '#FFB74D',
    emissiveIntensity: 0.85,
    roughness: 0.2,
  });

  // Boots sitting flush at y=0
  [-0.12, 0.12].forEach((bx) => {
    const boot = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.08, 0.14, 6, 10),
      bootMat,
    );
    boot.position.set(bx, 0.14, 0);
    boot.castShadow = true;
    actor.add(boot);
  });

  // Cloak / Coat body (Lathe / Cone-like silhouette)
  const cloak = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.3, 0.56, 18),
    coatMat,
  );
  cloak.position.set(0, 0.48, 0);
  cloak.castShadow = true;
  actor.add(cloak);

  // Cozy Scarf
  const scarf = new THREE.Mesh(
    new THREE.TorusGeometry(0.19, 0.055, 10, 20),
    scarfMat,
  );
  scarf.rotation.x = Math.PI / 2;
  scarf.position.set(0, 0.75, 0);
  actor.add(scarf);

  // Backpack + miniature glowing explorer lantern
  const pack = new THREE.Mesh(
    new THREE.BoxGeometry(0.32, 0.34, 0.18),
    bootMat,
  );
  pack.position.set(0, 0.55, -0.22);
  pack.castShadow = true;
  actor.add(pack);

  const miniLantern = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.07, 0),
    lanternGlassMat,
  );
  miniLantern.position.set(0.14, 0.72, -0.28);
  actor.add(miniLantern);

  // Head
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.23, 20, 16),
    skinMat,
  );
  head.position.set(0, 0.96, 0);
  head.castShadow = true;
  actor.add(head);

  // Eyes
  const eyeMat = new THREE.MeshStandardMaterial({ color: '#1F2937', roughness: 0.2 });
  [-0.08, 0.08].forEach((ex) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.032, 10, 10), eyeMat);
    eye.position.set(ex, 0.96, 0.21);
    actor.add(eye);
  });

  // Cozy Wide-Brimmed Explorer Hat
  const brim = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35, 0.36, 0.04, 24),
    scarfMat,
  );
  brim.position.set(0, 1.13, 0);
  brim.castShadow = true;
  const crown = new THREE.Mesh(
    new THREE.ConeGeometry(0.22, 0.28, 20),
    coatMat,
  );
  crown.position.set(0, 1.27, 0);
  crown.castShadow = true;
  actor.add(brim, crown);

  root.userData.actor = actor;
  return root;
}
