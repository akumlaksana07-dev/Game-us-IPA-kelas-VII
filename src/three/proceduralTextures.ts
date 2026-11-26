import * as THREE from 'three';

export interface ProceduralTextureSet {
  meadowMap: THREE.CanvasTexture;
  stoneMap: THREE.CanvasTexture;
  woodMap: THREE.CanvasTexture;
  contactShadowMap: THREE.CanvasTexture;
  glowSpriteMap: THREE.CanvasTexture;
  dispose: () => void;
}

function makeCanvas(size: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  return [canvas, ctx];
}

export function createProceduralTextures(maxAnisotropy: number): ProceduralTextureSet {
  // 1. Cozy speckled grass/moss surface texture
  const [meadowCanvas, mCtx] = makeCanvas(256);
  mCtx.fillStyle = '#d9ead3';
  mCtx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 900; i++) {
    const x = (Math.sin(i * 12.9898) * 43758.5453) % 1;
    const y = (Math.sin(i * 78.233) * 43758.5453) % 1;
    const px = Math.abs(x) * 256;
    const py = Math.abs(y) * 256;
    mCtx.fillStyle = i % 3 === 0 ? 'rgba(255,255,255,0.16)' : 'rgba(60,110,70,0.12)';
    mCtx.beginPath();
    mCtx.arc(px, py, 1.5 + (i % 4), 0, Math.PI * 2);
    mCtx.fill();
  }
  const meadowMap = new THREE.CanvasTexture(meadowCanvas);
  meadowMap.wrapS = THREE.RepeatWrapping;
  meadowMap.wrapT = THREE.RepeatWrapping;
  meadowMap.repeat.set(6, 6);
  meadowMap.colorSpace = THREE.SRGBColorSpace;
  meadowMap.anisotropy = maxAnisotropy;

  // 2. Ruin stone / cliff texture
  const [stoneCanvas, sCtx] = makeCanvas(256);
  sCtx.fillStyle = '#d6d8e0';
  sCtx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 420; i++) {
    const px = Math.abs((Math.sin(i * 41.2) * 9123.4) % 1) * 256;
    const py = Math.abs((Math.cos(i * 19.7) * 4123.7) % 1) * 256;
    const w = 8 + (i % 18);
    const h = 6 + (i % 12);
    sCtx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.12)' : 'rgba(40,48,70,0.12)';
    sCtx.fillRect(px, py, w, h);
  }
  const stoneMap = new THREE.CanvasTexture(stoneCanvas);
  stoneMap.wrapS = THREE.RepeatWrapping;
  stoneMap.wrapT = THREE.RepeatWrapping;
  stoneMap.repeat.set(4, 4);
  stoneMap.colorSpace = THREE.SRGBColorSpace;
  stoneMap.anisotropy = maxAnisotropy;

  // 3. Warm wood grain texture
  const [woodCanvas, wCtx] = makeCanvas(128);
  wCtx.fillStyle = '#b9895b';
  wCtx.fillRect(0, 0, 128, 128);
  for (let y = 0; y < 128; y += 4) {
    wCtx.fillStyle = y % 8 === 0 ? 'rgba(70,40,18,0.14)' : 'rgba(255,230,195,0.08)';
    wCtx.fillRect(0, y, 128, 2);
  }
  const woodMap = new THREE.CanvasTexture(woodCanvas);
  woodMap.wrapS = THREE.RepeatWrapping;
  woodMap.wrapT = THREE.RepeatWrapping;
  woodMap.colorSpace = THREE.SRGBColorSpace;
  woodMap.anisotropy = maxAnisotropy;

  // 4. Soft radial contact shadow
  const [shadowCanvas, shCtx] = makeCanvas(128);
  const grad = shCtx.createRadialGradient(64, 64, 6, 64, 64, 60);
  grad.addColorStop(0, 'rgba(18, 28, 38, 0.52)');
  grad.addColorStop(0.55, 'rgba(18, 28, 38, 0.22)');
  grad.addColorStop(1, 'rgba(18, 28, 38, 0)');
  shCtx.fillStyle = grad;
  shCtx.fillRect(0, 0, 128, 128);
  const contactShadowMap = new THREE.CanvasTexture(shadowCanvas);
  contactShadowMap.colorSpace = THREE.SRGBColorSpace;

  // 5. Soft glow sprite for fireflies / elemental bursts
  const [glowCanvas, gCtx] = makeCanvas(64);
  const gGrad = gCtx.createRadialGradient(32, 32, 2, 32, 32, 30);
  gGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gGrad.addColorStop(0.35, 'rgba(255, 255, 255, 0.65)');
  gGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  gCtx.fillStyle = gGrad;
  gCtx.fillRect(0, 0, 64, 64);
  const glowSpriteMap = new THREE.CanvasTexture(glowCanvas);
  glowSpriteMap.colorSpace = THREE.SRGBColorSpace;

  return {
    meadowMap,
    stoneMap,
    woodMap,
    contactShadowMap,
    glowSpriteMap,
    dispose: () => {
      meadowMap.dispose();
      stoneMap.dispose();
      woodMap.dispose();
      contactShadowMap.dispose();
      glowSpriteMap.dispose();
    },
  };
}
