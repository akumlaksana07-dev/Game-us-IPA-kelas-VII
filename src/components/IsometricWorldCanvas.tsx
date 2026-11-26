import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { cozySynth } from '../audio/cozySynth';
import { COMPANIONS } from '../data/companions';
import { REGIONS } from '../data/upgrades';
import {
  CompanionId,
  EvolutionStage,
  GameScreen,
  RegionId,
  WorldEventTrigger,
} from '../types/game';
import {
  buildCompanionMesh,
  buildExplorerMesh,
  CompanionAnimRefs,
} from '../three/companionBuilder';
import { createProceduralTextures } from '../three/proceduralTextures';
import {
  buildRegionWorld,
  groundHeightAt,
  ISLAND_PLAY_RADIUS,
  WorldBuildResult,
} from '../three/worldBuilder';

interface IsometricWorldCanvasProps {
  screen: GameScreen;
  region: RegionId;
  companionId: CompanionId;
  visualStage: EvolutionStage;
  magnetLevel: number;
  sanctuaryLevel: number;
  modalOpen: boolean;
  worldEvent: WorldEventTrigger | null;
  onNearTotemChange: (nearTotemId: number | null) => void;
  onTriggerQuiz: (totemId: number) => void;
  onCollectCrystal: () => void;
}

// Pre-allocated math helpers (zero GC inside animation loop)
const _moveVec = new THREE.Vector3();
const _targetCam = new THREE.Vector3();
const _companionDesired = new THREE.Vector3();
const _lookTarget = new THREE.Vector3();
const _pointerNdc = new THREE.Vector2();

interface ParticleBurst {
  points: THREE.Points;
  velocities: Float32Array;
  life: number;
  maxLife: number;
}

export const IsometricWorldCanvas: React.FC<IsometricWorldCanvasProps> = ({
  screen,
  region,
  companionId,
  visualStage,
  magnetLevel,
  sanctuaryLevel,
  modalOpen,
  worldEvent,
  onNearTotemChange,
  onTriggerQuiz,
  onCollectCrystal,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  // Sync latest React props into refs so WebGL loop never tears down
  const propsRef = useRef({
    screen,
    region,
    companionId,
    visualStage,
    magnetLevel,
    sanctuaryLevel,
    modalOpen,
    onNearTotemChange,
    onTriggerQuiz,
    onCollectCrystal,
  });
  propsRef.current = {
    screen,
    region,
    companionId,
    visualStage,
    magnetLevel,
    sanctuaryLevel,
    modalOpen,
    onNearTotemChange,
    onTriggerQuiz,
    onCollectCrystal,
  };

  const pendingEventRef = useRef<WorldEventTrigger | null>(null);
  const lastHandledTimestampRef = useRef<number>(0);

  useEffect(() => {
    if (worldEvent && worldEvent.timestamp !== lastHandledTimestampRef.current) {
      lastHandledTimestampRef.current = worldEvent.timestamp;
      pendingEventRef.current = worldEvent;
    }
  }, [worldEvent]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Detect Software WebGL cleanly
    const isSoftwareGl = (() => {
      const probeCanvas = document.createElement('canvas');
      const gl = probeCanvas.getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.setPixelRatio(
      isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2),
    );
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();

    // 2. Mandatory Studio Environment Reflection
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envTarget = pmremGenerator.fromScene(roomEnv, 0.04);
    scene.environment = envTarget.texture;
    roomEnv.dispose();
    pmremGenerator.dispose();

    // 3. Isometric-feel Perspective Camera (narrow FOV for crisp diorama depth)
    const camera = new THREE.PerspectiveCamera(
      34,
      container.clientWidth / Math.max(container.clientHeight, 1),
      0.5,
      220,
    );
    camera.position.set(16, 15, 16);
    camera.lookAt(0, 0.5, 0);

    // 4. Three-point Warm/Cool Studio & Outdoor Lighting
    const hemiLight = new THREE.HemisphereLight('#D8F3FF', '#4A5759', 0.85);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight('#FFF3D6', 1.55);
    keyLight.position.set(14, 22, 12);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 2;
    keyLight.shadow.camera.far = 65;
    const d = 20;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight('#A9DEF9', 0.55);
    rimLight.position.set(-14, 10, -14);
    scene.add(rimLight);

    const textures = createProceduralTextures(
      renderer.capabilities.getMaxAnisotropy(),
    );

    // State inside WebGL closure
    let currentRegion: RegionId = propsRef.current.region;
    let currentCompanionId: CompanionId = propsRef.current.companionId;
    let currentStage: EvolutionStage = propsRef.current.visualStage;

    let worldData: WorldBuildResult | null = null;
    const loadWorld = (reg: RegionId) => {
      if (worldData) {
        scene.remove(worldData.worldGroup);
        worldData.disposables.geometries.forEach((g) => g.dispose());
        worldData.disposables.materials.forEach((m) => m.dispose());
      }
      const regDef = REGIONS[reg];
      scene.background = new THREE.Color(regDef.skyColor);
      scene.fog = new THREE.FogExp2(regDef.fogColor, reg === 'pulau-damai' ? 0.011 : 0.015);

      if (reg === 'hutan-berlentera') {
        keyLight.color.set('#FFD89B');
        keyLight.intensity = 1.2;
        hemiLight.intensity = 0.65;
      } else if (reg === 'reruntuhan-melayang') {
        keyLight.color.set('#E2EAFF');
        keyLight.intensity = 1.35;
        hemiLight.intensity = 0.8;
      } else {
        keyLight.color.set('#FFF4D6');
        keyLight.intensity = 1.55;
        hemiLight.intensity = 0.9;
      }

      worldData = buildRegionWorld(reg, textures, isSoftwareGl);
      scene.add(worldData.worldGroup);
      currentRegion = reg;
    };
    loadWorld(currentRegion);

    // Explorer & Companion Actors
    const explorerGroup = buildExplorerMesh(textures.contactShadowMap);
    explorerGroup.position.set(0, groundHeightAt(0, 1.5, currentRegion), 1.5);
    scene.add(explorerGroup);

    let companionGroup = buildCompanionMesh(
      currentCompanionId,
      currentStage,
      textures.contactShadowMap,
      isSoftwareGl,
    );
    companionGroup.position.set(1.35, groundHeightAt(1.35, 1.8, currentRegion), 1.8);
    scene.add(companionGroup);

    const rebuildCompanion = (cid: CompanionId, st: EvolutionStage) => {
      const prevPos = companionGroup.position.clone();
      const prevRot = companionGroup.rotation.y;
      scene.remove(companionGroup);
      companionGroup.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const m = obj as THREE.Mesh;
          m.geometry.dispose();
          if (Array.isArray(m.material)) {
            m.material.forEach((mt) => mt.dispose());
          } else {
            m.material.dispose();
          }
        }
      });
      companionGroup = buildCompanionMesh(
        cid,
        st,
        textures.contactShadowMap,
        isSoftwareGl,
      );
      companionGroup.position.copy(prevPos);
      companionGroup.rotation.y = prevRot;
      scene.add(companionGroup);
      currentCompanionId = cid;
      currentStage = st;
    };

    // Click-to-move destination marker
    const markerRing = new THREE.Mesh(
      new THREE.RingGeometry(0.28, 0.42, 24),
      new THREE.MeshBasicMaterial({
        color: '#FFF3B0',
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
      }),
    );
    markerRing.rotation.x = -Math.PI / 2;
    scene.add(markerRing);

    // Particle bursts pool
    const bursts: ParticleBurst[] = [];
    const spawnBurst = (origin: THREE.Vector3, hexColor: string, count = 26) => {
      const positions = new Float32Array(count * 3);
      const velocities = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        positions[i * 3] = origin.x;
        positions[i * 3 + 1] = origin.y + 0.6;
        positions[i * 3 + 2] = origin.z;
        const theta = Math.random() * Math.PI * 2;
        const speed = 1.6 + Math.random() * 3.0;
        velocities[i * 3] = Math.cos(theta) * speed;
        velocities[i * 3 + 1] = 2.2 + Math.random() * 3.2;
        velocities[i * 3 + 2] = Math.sin(theta) * speed;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const mat = new THREE.PointsMaterial({
        color: hexColor,
        map: textures.glowSpriteMap,
        size: 0.48,
        transparent: true,
        opacity: 1,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const pts = new THREE.Points(geo, mat);
      scene.add(pts);
      bursts.push({ points: pts, velocities, life: 0, maxLife: 1.05 });
    };

    // Pre-warm shaders once on GPU
    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Input state
    const heldKeys = new Set<string>();
    let clickTarget: THREE.Vector3 | null = null;
    let pendingTotemClick: number | null = null;
    let playerHopVel = 0;
    let playerHopY = 0;
    let companionCheerTimer = 0;
    let lastNearTotem: number | null = null;
    let stepAudioCooldown = 0;

    const raycaster = new THREE.Raycaster();
    raycaster.layers.set(1);

    const onKeyDown = (e: KeyboardEvent) => {
      if (propsRef.current.screen !== 'playing' || propsRef.current.modalOpen) {
        return;
      }
      const code = e.code;
      if (
        ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(
          code,
        )
      ) {
        heldKeys.add(code);
        clickTarget = null;
        pendingTotemClick = null;
      } else if (code === 'Space') {
        e.preventDefault();
        if (playerHopY <= 0.01) {
          playerHopVel = 5.4;
          companionCheerTimer = Math.max(companionCheerTimer, 0.55);
          cozySynth.playHop();
        }
      } else if (code === 'KeyE') {
        if (lastNearTotem !== null) {
          cozySynth.playClick();
          propsRef.current.onTriggerQuiz(lastNearTotem);
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      heldKeys.delete(e.code);
    };

    const onWindowBlur = () => {
      heldKeys.clear();
    };

    const onPointerDown = (e: PointerEvent) => {
      if (propsRef.current.screen !== 'playing' || propsRef.current.modalOpen) {
        return;
      }
      if (!worldData) return;
      const rect = renderer.domElement.getBoundingClientRect();
      _pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      _pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(_pointerNdc, camera);
      const targets: THREE.Object3D[] = [
        worldData.groundClickMesh,
        ...worldData.totems.map((t) => t.hitProxy),
      ];
      const hits = raycaster.intersectObjects(targets, false);
      if (hits.length > 0) {
        const hit = hits[0];
        if (hit.object.userData.kind === 'totem') {
          const tid = hit.object.userData.totemId as number;
          const totem = worldData.totems[tid];
          if (totem) {
            const dist = explorerGroup.position.distanceTo(totem.position);
            if (dist < 2.8) {
              cozySynth.playClick();
              propsRef.current.onTriggerQuiz(tid);
            } else {
              clickTarget = totem.position.clone();
              pendingTotemClick = tid;
              (markerRing.material as THREE.MeshBasicMaterial).opacity = 0.85;
              markerRing.position.set(totem.position.x, totem.position.y + 0.08, totem.position.z);
            }
          }
        } else {
          const pt = hit.point;
          const radial = Math.sqrt(pt.x * pt.x + pt.z * pt.z);
          if (radial <= ISLAND_PLAY_RADIUS - 0.8) {
            clickTarget = pt.clone();
            pendingTotemClick = null;
            (markerRing.material as THREE.MeshBasicMaterial).opacity = 0.75;
            markerRing.position.set(pt.x, pt.y + 0.06, pt.z);
          }
        }
      }
    };

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = Math.max(container.clientHeight, 1);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      renderer.setPixelRatio(
        isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2),
      );
    };

    const onContextLost = (e: Event) => {
      e.preventDefault();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onWindowBlur);
    window.addEventListener('resize', onResize);
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);

    const clock = new THREE.Clock();
    let frameId = 0;
    let disposed = false;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) {
          if (sync) gl.deleteSync(sync);
          return;
        }
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    const tick = () => {
      if (disposed) return;

      const dt = Math.min(clock.getDelta(), 0.05);
      const elapsed = clock.getElapsedTime();
      const props = propsRef.current;

      // Sync region, companion, sanctuary upgrades
      if (props.region !== currentRegion) {
        loadWorld(props.region);
        explorerGroup.position.set(0, groundHeightAt(0, 1.5, props.region), 1.5);
        companionGroup.position.set(1.35, groundHeightAt(1.35, 1.8, props.region), 1.8);
        clickTarget = null;
        pendingTotemClick = null;
      }

      if (
        props.companionId !== currentCompanionId ||
        props.visualStage !== currentStage
      ) {
        rebuildCompanion(props.companionId, props.visualStage);
      }

      if (worldData) {
        worldData.habitatGroups.gazebo.visible = props.sanctuaryLevel >= 1;
        worldData.habitatGroups.hammock.visible = props.sanctuaryLevel >= 2;
        worldData.habitatGroups.hotSpring.visible = props.sanctuaryLevel >= 3;
      }

      // Handle triggered 3D celebration / event bursts
      if (pendingEventRef.current) {
        const evt = pendingEventRef.current;
        pendingEventRef.current = null;
        const cColor =
          evt.elementColor || COMPANIONS[currentCompanionId].glowColor;
        if (evt.type === 'correct' || evt.type === 'treat') {
          companionCheerTimer = 1.45;
          spawnBurst(companionGroup.position, cColor, 30);
        } else if (evt.type === 'evolve') {
          companionCheerTimer = 2.2;
          spawnBurst(companionGroup.position, '#FFE066', 44);
          spawnBurst(companionGroup.position, cColor, 28);
        } else if (evt.type === 'crystal') {
          spawnBurst(companionGroup.position, '#FFD166', 14);
        }
      }

      // Player movement (only active when playing & no modal blocking)
      let isMoving = false;
      if (props.screen === 'playing' && !props.modalOpen) {
        _moveVec.set(0, 0, 0);
        // Isometric screen-aligned directions
        if (heldKeys.has('KeyW') || heldKeys.has('ArrowUp')) {
          _moveVec.x -= 1;
          _moveVec.z -= 1;
        }
        if (heldKeys.has('KeyS') || heldKeys.has('ArrowDown')) {
          _moveVec.x += 1;
          _moveVec.z += 1;
        }
        if (heldKeys.has('KeyA') || heldKeys.has('ArrowLeft')) {
          _moveVec.x -= 1;
          _moveVec.z += 1;
        }
        if (heldKeys.has('KeyD') || heldKeys.has('ArrowRight')) {
          _moveVec.x += 1;
          _moveVec.z -= 1;
        }

        if (_moveVec.lengthSq() > 0.01) {
          _moveVec.normalize();
          const speed = 5.6;
          explorerGroup.position.x += _moveVec.x * speed * dt;
          explorerGroup.position.z += _moveVec.z * speed * dt;
          isMoving = true;

          const targetAngle = Math.atan2(_moveVec.x, _moveVec.z);
          const diff =
            ((targetAngle - explorerGroup.rotation.y + Math.PI * 3) %
              (Math.PI * 2)) -
            Math.PI;
          explorerGroup.rotation.y += diff * Math.min(1, dt * 10);
        } else if (clickTarget) {
          const dx = clickTarget.x - explorerGroup.position.x;
          const dz = clickTarget.z - explorerGroup.position.z;
          const dist = Math.sqrt(dx * dx + dz * dz);
          if (dist > 0.35) {
            const speed = 5.6;
            const nx = dx / dist;
            const nz = dz / dist;
            explorerGroup.position.x += nx * speed * dt;
            explorerGroup.position.z += nz * speed * dt;
            isMoving = true;

            const targetAngle = Math.atan2(nx, nz);
            const diff =
              ((targetAngle - explorerGroup.rotation.y + Math.PI * 3) %
                (Math.PI * 2)) -
              Math.PI;
            explorerGroup.rotation.y += diff * Math.min(1, dt * 10);
          } else {
            clickTarget = null;
            if (pendingTotemClick !== null) {
              const tid = pendingTotemClick;
              pendingTotemClick = null;
              cozySynth.playClick();
              props.onTriggerQuiz(tid);
            }
          }
        }
      }

      // Constrain explorer inside island radius
      const rad = Math.sqrt(
        explorerGroup.position.x * explorerGroup.position.x +
          explorerGroup.position.z * explorerGroup.position.z,
      );
      if (rad > ISLAND_PLAY_RADIUS - 0.8) {
        const s = (ISLAND_PLAY_RADIUS - 0.8) / rad;
        explorerGroup.position.x *= s;
        explorerGroup.position.z *= s;
      }

      // Hop physics
      if (playerHopY > 0 || playerHopVel > 0) {
        playerHopY += playerHopVel * dt;
        playerHopVel -= 16.5 * dt;
        if (playerHopY <= 0) {
          playerHopY = 0;
          playerHopVel = 0;
        }
      }

      const groundY = groundHeightAt(
        explorerGroup.position.x,
        explorerGroup.position.z,
        currentRegion,
      );
      explorerGroup.position.y = groundY + playerHopY;

      const explorerActor = explorerGroup.userData.actor as THREE.Group | undefined;
      if (explorerActor) {
        explorerActor.position.y = isMoving
          ? Math.abs(Math.sin(elapsed * 11)) * 0.09
          : Math.sin(elapsed * 2.4) * 0.02;
      }

      if (isMoving) {
        stepAudioCooldown -= dt;
        if (stepAudioCooldown <= 0) {
          stepAudioCooldown = 0.36;
        }
      }

      // Fade click marker ring
      const markerMat = markerRing.material as THREE.MeshBasicMaterial;
      if (markerMat.opacity > 0) {
        markerMat.opacity = Math.max(0, markerMat.opacity - dt * 0.9);
      }

      // Companion smooth spring follow right beside explorer
      const sideOffsetAngle = explorerGroup.rotation.y + Math.PI * 0.65;
      _companionDesired.set(
        explorerGroup.position.x + Math.sin(sideOffsetAngle) * 1.45,
        0,
        explorerGroup.position.z + Math.cos(sideOffsetAngle) * 1.45,
      );
      companionGroup.position.x = THREE.MathUtils.damp(
        companionGroup.position.x,
        _companionDesired.x,
        5.5,
        dt,
      );
      companionGroup.position.z = THREE.MathUtils.damp(
        companionGroup.position.z,
        _companionDesired.z,
        5.5,
        dt,
      );

      const compGroundY = groundHeightAt(
        companionGroup.position.x,
        companionGroup.position.z,
        currentRegion,
      );
      companionGroup.position.y = compGroundY;

      // Companion face direction & lively idle/cheer animation
      const cdx = _companionDesired.x - companionGroup.position.x;
      const cdz = _companionDesired.z - companionGroup.position.z;
      const targetCompYaw =
        cdx * cdx + cdz * cdz > 0.05
          ? Math.atan2(cdx, cdz)
          : explorerGroup.rotation.y;
      const yawDiff =
        ((targetCompYaw - companionGroup.rotation.y + Math.PI * 3) %
          (Math.PI * 2)) -
        Math.PI;
      companionGroup.rotation.y += yawDiff * Math.min(1, dt * 7);

      const animRefs = companionGroup.userData.animRefs as
        | CompanionAnimRefs
        | undefined;
      if (animRefs) {
        if (companionCheerTimer > 0) {
          companionCheerTimer = Math.max(0, companionCheerTimer - dt);
          animRefs.bodyGroup.position.y =
            Math.abs(Math.sin(elapsed * 12)) * 0.38;
          animRefs.bodyGroup.rotation.y = Math.sin(elapsed * 10) * 0.45;
        } else {
          animRefs.bodyGroup.position.y =
            (isMoving
              ? Math.abs(Math.sin(elapsed * 9.5)) * 0.14
              : Math.sin(elapsed * 3.1) * 0.045) +
            (currentStage === 3 ? 0.14 : 0);
          animRefs.bodyGroup.rotation.y = THREE.MathUtils.damp(
            animRefs.bodyGroup.rotation.y,
            0,
            8,
            dt,
          );
        }

        if (animRefs.earLeft && animRefs.earRight) {
          animRefs.earLeft.rotation.x = Math.sin(elapsed * 4.2) * 0.12;
          animRefs.earRight.rotation.x = Math.cos(elapsed * 4.2) * 0.12;
        }
        if (animRefs.tailGroup) {
          animRefs.tailGroup.rotation.y = Math.sin(elapsed * 6.2) * 0.32;
        }
        if (animRefs.wingLeft && animRefs.wingRight) {
          animRefs.wingLeft.rotation.y = 0.45 + Math.sin(elapsed * 4.5) * 0.28;
          animRefs.wingRight.rotation.y =
            -0.45 - Math.sin(elapsed * 4.5) * 0.28;
        }
        if (animRefs.haloGroup) {
          animRefs.haloGroup.rotation.y = elapsed * 1.1;
          animRefs.haloGroup.position.y = 1.38 + Math.sin(elapsed * 2.5) * 0.05;
        }
      }

      // Animate World Props, Totems, Star Crystals, Fireflies
      if (worldData) {
        // Gentle water/cloud ripple
        worldData.waterMesh.position.y =
          (currentRegion === 'reruntuhan-melayang' ? -3.4 : -0.85) +
          Math.sin(elapsed * 0.9) * 0.06;

        worldData.floatingIslets.forEach((islet, idx) => {
          const base = (islet.userData.baseY as number) || 0;
          islet.position.y = base + Math.sin(elapsed * 0.7 + idx * 1.4) * 0.25;
        });

        // Fireflies slow drift
        worldData.fireflyPoints.rotation.y = elapsed * 0.04;
        worldData.fireflyPoints.position.y = Math.sin(elapsed * 1.1) * 0.18;

        // Totems bobbing & proximity detection
        let closestTotem: number | null = null;
        let closestDist = 2.6;
        worldData.totems.forEach((t, idx) => {
          t.crystalMesh.rotation.y = elapsed * 1.2 + idx;
          t.crystalMesh.position.y =
            t.baseY + Math.sin(elapsed * 2.2 + idx * 0.9) * 0.12;
          const dist = explorerGroup.position.distanceTo(t.position);
          if (dist < closestDist) {
            closestDist = dist;
            closestTotem = idx;
          }
          t.ringMesh.scale.setScalar(
            dist < 2.6 ? 1.18 + Math.sin(elapsed * 4) * 0.06 : 1.0,
          );
        });

        if (closestTotem !== lastNearTotem) {
          lastNearTotem = closestTotem;
          props.onNearTotemChange(closestTotem);
        }

        // Star Crystals pickup + magnet pull + gentle respawn
        const magnetRadius =
          props.magnetLevel === 0
            ? 1.75
            : props.magnetLevel === 1
              ? 4.5
              : props.magnetLevel === 2
                ? 6.0
                : props.magnetLevel === 3
                  ? 7.5
                  : 12.0;

        worldData.crystals.forEach((c, idx) => {
          if (!c.active) {
            if (elapsed >= c.respawnAt) {
              c.active = true;
              c.group.visible = true;
              c.group.position.copy(c.position);
            }
            return;
          }

          c.gemMesh.rotation.y = elapsed * 1.8 + idx;
          c.gemMesh.position.y =
            c.baseY + Math.sin(elapsed * 2.6 + idx) * 0.1;

          const dist = explorerGroup.position.distanceTo(c.group.position);
          if (props.screen === 'playing' && !props.modalOpen && dist < magnetRadius) {
            // Pull gently toward explorer if magnet unlocked or very close
            if (dist > 1.25 && props.magnetLevel > 0) {
              c.group.position.x = THREE.MathUtils.damp(
                c.group.position.x,
                explorerGroup.position.x,
                4.5,
                dt,
              );
              c.group.position.z = THREE.MathUtils.damp(
                c.group.position.z,
                explorerGroup.position.z,
                4.5,
                dt,
              );
            } else if (dist <= 1.35) {
              c.active = false;
              c.group.visible = false;
              c.respawnAt = elapsed + 16;
              cozySynth.playCrystalPickup();
              spawnBurst(explorerGroup.position, '#FFE066', 14);
              props.onCollectCrystal();
            }
          }
        });
      }

      // Update particle bursts
      for (let i = bursts.length - 1; i >= 0; i--) {
        const b = bursts[i];
        b.life += dt;
        const pos = b.points.geometry.attributes.position as THREE.BufferAttribute;
        for (let p = 0; p < pos.count; p++) {
          const vx = b.velocities[p * 3];
          const vy = b.velocities[p * 3 + 1] - 4.2 * b.life;
          const vz = b.velocities[p * 3 + 2];
          pos.setXYZ(
            p,
            pos.getX(p) + vx * dt,
            pos.getY(p) + vy * dt,
            pos.getZ(p) + vz * dt,
          );
        }
        pos.needsUpdate = true;
        (b.points.material as THREE.PointsMaterial).opacity = Math.max(
          0,
          1 - b.life / b.maxLife,
        );
        if (b.life >= b.maxLife) {
          scene.remove(b.points);
          b.points.geometry.dispose();
          (b.points.material as THREE.Material).dispose();
          bursts.splice(i, 1);
        }
      }

      // Camera Choreography: Title Screen gentle orbit vs Playing Isometric Follow
      if (props.screen === 'title') {
        const orbitAngle = elapsed * 0.16 + 0.78;
        _targetCam.set(
          Math.cos(orbitAngle) * 19,
          13.5,
          Math.sin(orbitAngle) * 19,
        );
        camera.position.x = THREE.MathUtils.damp(camera.position.x, _targetCam.x, 3, dt);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, _targetCam.y, 3, dt);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, _targetCam.z, 3, dt);
        _lookTarget.set(-1.8, 0.8, 0);
        camera.lookAt(_lookTarget);
      } else {
        _targetCam.set(
          explorerGroup.position.x + 12.8,
          explorerGroup.position.y + 12.2,
          explorerGroup.position.z + 12.8,
        );
        camera.position.x = THREE.MathUtils.damp(camera.position.x, _targetCam.x, 5.2, dt);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, _targetCam.y, 5.2, dt);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, _targetCam.z, 5.2, dt);
        _lookTarget.set(
          explorerGroup.position.x,
          explorerGroup.position.y + 0.65,
          explorerGroup.position.z,
        );
        camera.lookAt(_lookTarget);
      }

      renderer.render(scene, camera);
      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };

    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onWindowBlur);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);

      bursts.forEach((b) => {
        b.points.geometry.dispose();
        (b.points.material as THREE.Material).dispose();
      });
      if (worldData) {
        worldData.disposables.geometries.forEach((g) => g.dispose());
        worldData.disposables.materials.forEach((m) => m.dispose());
      }
      textures.dispose();
      envTarget.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 w-full h-full cursor-pointer"
      aria-label="Dunia 3D Isometrik Lumina Grove"
    />
  );
};
