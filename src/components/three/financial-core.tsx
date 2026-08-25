'use client';

import * as React from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { RoundedBox, Environment, Lightformer } from '@react-three/drei';

/**
 * AYNE FINANCIAL CORE — procedural 3D brand sculpture.
 * Composition (desktop): 1 extruded Ayne "A" core, 3 rings, a fleet of 10
 * minted cryptocurrency coins, orbiting fiat currency characters, 1 sparse
 * particle field, 3 tiny service labels. Everything is generated at runtime —
 * no model files, no HDRs, no external assets beyond the self-hosted font.
 *
 * Materials stay within four families (dark metal, brushed silver, smoked
 * glass, minted coin metal) and all colours come from the Ayne token palette.
 */

export interface SceneProps {
  theme: 'light' | 'dark';
  variant: 'desktop' | 'mobile';
  active: boolean;
  /** Normalised pointer (-1..1) supplied by the wrapper; parallax input. */
  pointer: React.MutableRefObject<{ x: number; y: number }>;
}

/* ----------------------------- palette ---------------------------------- */

const P = {
  navy: '#161b28',
  navyLight: '#232a3d',
  silver: '#c7cdd9',
  silverDark: '#8f97a8',
  paper: '#f4f1ea',
  accent: '#2563d8', // token primary family
  accentSoft: '#7fa8ff',
  emerald: '#1f8a70',
};

/* --------------------------- glyph planes -------------------------------- *
 * Crisp text via CanvasTexture on planes — no font files, no workers, fully
 * CSP-safe. Uses the site's loaded brand font family at draw time.           */

function makeGlyphTexture(text: string, px: number, color: string, weight = 800): THREE.CanvasTexture {
  const pad = 0.35 * px;
  const c = document.createElement('canvas');
  const family = getComputedStyle(document.body).fontFamily.split(',')[0].replace(/['"]/g, '') || 'sans-serif';
  const probe = c.getContext('2d')!;
  probe.font = `${weight} ${px}px ${family}`;
  const w = Math.ceil(probe.measureText(text).width + pad * 2);
  const h = Math.ceil(px * 1.45);
  c.width = w;
  c.height = h;
  const x = c.getContext('2d')!;
  x.font = `${weight} ${px}px ${family}`;
  x.textBaseline = 'middle';
  x.fillStyle = color;
  x.fillText(text, pad, h / 2);
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function TextPlane({
  text,
  size,
  color,
  weight = 800,
  opacity = 1,
  position,
  rotation,
}: {
  text: string;
  size: number;
  color: string;
  weight?: number;
  opacity?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
}) {
  const tex = React.useMemo(() => makeGlyphTexture(text, 220, color, weight), [text, color, weight]);
  React.useEffect(() => () => tex.dispose(), [tex]);
  const aspect = (tex.image as HTMLCanvasElement).width / (tex.image as HTMLCanvasElement).height;
  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={[size * aspect, size]} />
      <meshBasicMaterial map={tex} transparent opacity={opacity} depthWrite={false} side={THREE.DoubleSide} />
    </mesh>
  );
}

/* ------------------------- shared geometry ------------------------------ */

/** Refined stylized "A" silhouette (solid wedge with a notched underside). */
function useCoreGeometry() {
  return React.useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-1.05, -1.15);
    s.lineTo(-0.16, 1.2);
    s.lineTo(0.16, 1.2);
    s.lineTo(1.05, -1.15);
    s.lineTo(0.62, -1.15);
    s.lineTo(0, 0.42);
    s.lineTo(-0.62, -1.15);
    s.closePath();
    const geo = new THREE.ExtrudeGeometry(s, {
      depth: 0.34,
      bevelEnabled: true,
      bevelThickness: 0.045,
      bevelSize: 0.045,
      bevelSegments: 3,
      curveSegments: 8,
    });
    geo.center();
    return geo;
  }, []);
}

/* ------------------------------ materials ------------------------------- */

function useMaterials(theme: 'light' | 'dark') {
  return React.useMemo(() => {
    const dark = theme === 'dark';
    return {
      darkMetal: new THREE.MeshStandardMaterial({
        color: dark ? P.navyLight : P.navy,
        metalness: 0.92,
        roughness: 0.32,
      }),
      // Core material — brushed titanium, light enough to read every facet.
      titanium: new THREE.MeshStandardMaterial({
        color: dark ? '#93a0bd' : '#7e8aa6',
        metalness: 0.55,
        roughness: 0.42,
      }),
      silver: new THREE.MeshStandardMaterial({
        color: dark ? '#d6dbe6' : P.silver,
        metalness: 0.9,
        roughness: 0.28,
      }),
      glass: new THREE.MeshPhysicalMaterial({
        color: dark ? '#3a4a6b' : '#9fb2d8',
        metalness: 0.2,
        roughness: 0.1,
        transparent: true,
        opacity: dark ? 0.28 : 0.22,
        side: THREE.DoubleSide,
      }),
    };
  }, [theme]);
}

/* ------------------------------- core ----------------------------------- */

function Core({
  mats,
  enter,
  coreFlash,
}: {
  mats: ReturnType<typeof useMaterials>;
  enter: React.MutableRefObject<number>;
  coreFlash: React.MutableRefObject<number>;
}) {
  const group = React.useRef<THREE.Group>(null);
  const light = React.useRef<THREE.PointLight>(null);
  const geo = useCoreGeometry();

  useFrame((state) => {
    const g = group.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    g.rotation.y = t * 0.16;
    const k = THREE.MathUtils.clamp(enter.current, 0, 1);
    const s = THREE.MathUtils.lerp(0.6, 1, easeOut(k));
    g.scale.setScalar(s);
    // brief illumination while a conversion passes through
    const f = coreFlash.current;
    mats.titanium.emissive.setStyle(P.accent);
    mats.titanium.emissiveIntensity = f * 0.35;
    if (light.current) light.current.intensity = f * 2.2;
  });

  return (
    <group ref={group}>
      <mesh geometry={geo} material={mats.titanium} />
      {/* Floating exchange crossbar — echo of the logo's bidirectional bar */}
      <RoundedBox args={[1.45, 0.2, 0.26]} radius={0.06} position={[0, -0.28, 0.34]} material={mats.silver} />
      <pointLight ref={light} intensity={0} color={P.accentSoft} distance={5} />
    </group>
  );
}

/* ------------------------------- rings ---------------------------------- */

function Rings({ mats, variant, enter }: { mats: ReturnType<typeof useMaterials>; variant: SceneProps['variant']; enter: React.MutableRefObject<number> }) {
  const g1 = React.useRef<THREE.Group>(null);
  const g2 = React.useRef<THREE.Group>(null);
  const g3 = React.useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const k = easeOut(THREE.MathUtils.clamp(enter.current - 0.25, 0, 1));
    if (g1.current) {
      g1.current.rotation.z = t * 0.07;
      g1.current.scale.setScalar(k);
    }
    if (g2.current) {
      g2.current.rotation.z = -t * 0.05;
      g2.current.scale.setScalar(k);
    }
    if (g3.current) {
      g3.current.rotation.z = t * 0.1;
      g3.current.scale.setScalar(k);
    }
  });

  return (
    <>
      {/* thin metallic */}
      <group ref={g1} rotation={[Math.PI / 2.25, 0.25, 0]}>
        <mesh material={mats.silver}>
          <torusGeometry args={[2.15, 0.013, 8, 96]} />
        </mesh>
      </group>
      {/* transparent glass */}
      <group ref={g2} rotation={[Math.PI / 1.85, -0.35, 0.15]}>
        <mesh material={mats.glass}>
          <torusGeometry args={[2.6, 0.05, 12, 96]} />
        </mesh>
      </group>
      {/* broken / segmented */}
      {variant === 'desktop' && (
        <group ref={g3} rotation={[Math.PI / 2.6, 0.55, -0.2]}>
          {[0, 1, 2, 3].map((i) => (
            <mesh key={i} rotation={[0, 0, (i * Math.PI) / 2 + 0.35]} material={mats.darkMetal}>
              <torusGeometry args={[1.78, 0.022, 8, 32, Math.PI / 3.4]} />
            </mesh>
          ))}
        </group>
      )}
    </>
  );
}

/* -------------------------- currency characters --------------------------- *
 * Fiat money appears ONLY as floating currency characters — the sets rotate
 * so the whole basket shows over time (4 glyphs on desktop, 2 on mobile).    */

const SYMBOL_SETS = [
  ['€', '$', '₺', '£'],
  ['£', '¥', '$', '₽'],
  ['€', '₽', '¥', '$'],
];

function Symbols({ mats, variant, enter }: { mats: ReturnType<typeof useMaterials>; variant: SceneProps['variant']; enter: React.MutableRefObject<number> }) {
  const [setIdx, setSetIdx] = React.useState(0);
  React.useEffect(() => {
    const iv = setInterval(() => setSetIdx((i) => (i + 1) % SYMBOL_SETS.length), 18000);
    return () => clearInterval(iv);
  }, []);
  const chars = SYMBOL_SETS[setIdx].slice(0, variant === 'mobile' ? 2 : 4);

  return (
    <>
      {chars.map((ch, i) => (
        <OrbitingText
          key={`${ch}-${i}`}
          char={ch}
          radius={2.25 + i * 0.35}
          speed={0.09 + i * 0.02}
          phase={i * 1.7 + 1.1}
          y={1.0 - i * 0.65}
          size={0.34}
          color={i === 1 ? P.accent : undefined}
          mats={mats}
          enter={enter}
        />
      ))}
    </>
  );
}

function OrbitingText({
  char,
  radius,
  speed,
  phase,
  y,
  size,
  color,
  mats,
  enter,
}: {
  char: string;
  radius: number;
  speed: number;
  phase: number;
  y: number;
  size: number;
  color?: string;
  mats: ReturnType<typeof useMaterials>;
  enter: React.MutableRefObject<number>;
}) {
  const ref = React.useRef<THREE.Group>(null);
  useFrame((state) => {
    const g = ref.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    const a = t * speed * Math.PI * 2 + phase;
    g.position.set(Math.cos(a) * radius, y + Math.sin(t * 0.6 + phase) * 0.12, Math.sin(a) * 1.2);
    g.rotation.y = Math.sin(t * 0.3 + phase) * 0.4;
    const k = easeOut(THREE.MathUtils.clamp(enter.current - 0.6, 0, 1));
    g.scale.setScalar(k);
  });
  return (
    <group ref={ref}>
      <TextPlane text={char} size={size * 1.4} color={color ?? `#${(mats.silver.color as THREE.Color).getHexString()}`} opacity={0.95} />
    </group>
  );
}

/* ------------------------------ crypto coins ----------------------------- *
 * The main orbit population: a fleet of 10 premium minted coins — procedural
 * cylinder with a striped bump "reeded" edge, torus rims, and a generated
 * face texture used as both color and bump map for an embossed relief look.
 * Desktop shows the whole fleet; mobile shows the 5 majors.                 */

interface CoinDef {
  id: string;
  symbol: string;
  base: string;      // metal base colour
  center?: string;   // two-tone centre medallion
  ring?: string;     // accent ring inlay
  rough: number;
}

const COIN_DEFS: CoinDef[] = [
  { id: 'BTC', symbol: '₿', base: '#8a6f42', center: '#7a6139', rough: 0.38 },
  { id: 'ETH', symbol: 'Ξ', base: '#c3c9d6', center: '#4d5566', rough: 0.3 },
  { id: 'USDT', symbol: '₮', base: '#b9c1cf', ring: '#1f8a70', rough: 0.22 },
  { id: 'USDC', symbol: '$', base: '#b9c1cf', ring: '#2563d8', rough: 0.22 },
  { id: 'BNB', symbol: 'BNB', base: '#a8894a', center: '#8a6f38', rough: 0.32 },
  { id: 'XRP', symbol: 'XRP', base: '#9aa3b2', center: '#3d4452', rough: 0.28 },
  { id: 'SOL', symbol: 'SOL', base: '#8f8aa8', center: '#565073', rough: 0.3 },
  { id: 'ADA', symbol: '₳', base: '#8e9bb0', center: '#43516b', rough: 0.3 },
  { id: 'DOGE', symbol: 'Ð', base: '#b09a5e', center: '#93803f', rough: 0.35 },
  { id: 'LTC', symbol: 'Ł', base: '#c9ced8', center: '#8f97a8', rough: 0.26 },
];

/** Orbit slot per coin — radii/speeds/phases spread so the fleet never clumps. */
interface CoinSlot {
  radius: number;
  speed: number;
  phase: number;
  y: number;
  scale: number;
}

const COIN_SLOTS: CoinSlot[] = [
  { radius: 2.95, speed: 0.1, phase: 0.3, y: 0.6, scale: 1.2 }, // BTC — flagship, slightly larger
  { radius: 3.3, speed: 0.08, phase: 1.05, y: -0.3, scale: 1.05 }, // ETH
  { radius: 2.7, speed: 0.12, phase: 1.8, y: -0.9, scale: 0.95 }, // USDT
  { radius: 3.55, speed: 0.07, phase: 2.5, y: 1.05, scale: 0.95 }, // USDC
  { radius: 3.1, speed: 0.09, phase: 3.2, y: 0.15, scale: 0.9 }, // BNB
  { radius: 2.6, speed: 0.13, phase: 3.9, y: 0.85, scale: 0.85 }, // XRP
  { radius: 3.75, speed: 0.06, phase: 4.6, y: -0.65, scale: 1.0 }, // SOL
  { radius: 2.85, speed: 0.11, phase: 5.3, y: -1.15, scale: 0.85 }, // ADA
  { radius: 3.4, speed: 0.075, phase: 6.0, y: 0.4, scale: 0.9 }, // DOGE
  { radius: 3.0, speed: 0.095, phase: 4.25, y: -0.05, scale: 0.9 }, // LTC
];

/** The 5 majors shown on mobile (indices into COIN_DEFS/COIN_SLOTS). */
const MOBILE_COIN_IDXS = [0, 1, 2, 3, 6];

function makeCoinFace(def: CoinDef): THREE.CanvasTexture {
  const S = 512;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const x = c.getContext('2d')!;
  const family = getComputedStyle(document.body).fontFamily.split(',')[0].replace(/['"]/g, '') || 'sans-serif';
  const cx = S / 2;

  x.fillStyle = def.base;
  x.fillRect(0, 0, S, S);

  // fine radial guilloche spokes
  x.strokeStyle = 'rgba(0,0,0,0.16)';
  x.lineWidth = 1.5;
  for (let i = 0; i < 72; i++) {
    const a = (i / 72) * Math.PI * 2;
    x.beginPath();
    x.moveTo(cx + Math.cos(a) * 150, cx + Math.sin(a) * 150);
    x.lineTo(cx + Math.cos(a) * 232, cx + Math.sin(a) * 232);
    x.stroke();
  }
  // concentric rings
  x.strokeStyle = 'rgba(0,0,0,0.2)';
  for (const r of [150, 234, 244]) {
    x.lineWidth = r === 244 ? 5 : 2;
    x.beginPath();
    x.arc(cx, cx, r, 0, Math.PI * 2);
    x.stroke();
  }
  // accent ring inlay (USDT teal / USDC blue)
  if (def.ring) {
    x.strokeStyle = def.ring;
    x.lineWidth = 12;
    x.beginPath();
    x.arc(cx, cx, 192, 0, Math.PI * 2);
    x.stroke();
  }
  // centre medallion (two-tone)
  x.fillStyle = def.center ?? 'rgba(0,0,0,0.10)';
  x.beginPath();
  x.arc(cx, cx, 148, 0, Math.PI * 2);
  x.fill();
  // embossed symbol (highlight + shadow pass for relief); ticker marks
  // without a currency glyph render as smaller lettering that still fits
  const px = def.symbol.length === 1 ? 200 : def.symbol.length === 2 ? 150 : 110;
  const yOff = px * 0.35;
  x.font = `800 ${px}px ${family}`;
  const sw = x.measureText(def.symbol).width;
  x.fillStyle = 'rgba(255,255,255,0.28)';
  x.fillText(def.symbol, cx - sw / 2 - 3, cx + yOff - 3);
  x.fillStyle = 'rgba(0,0,0,0.42)';
  x.fillText(def.symbol, cx - sw / 2 + 2, cx + yOff + 2);
  x.fillStyle = def.center ? '#e8ebf2' : 'rgba(20,24,34,0.85)';
  x.fillText(def.symbol, cx - sw / 2, cx + yOff);
  // AYNE mint-mark near the rim
  x.font = `700 22px ${family}`;
  x.fillStyle = 'rgba(0,0,0,0.4)';
  const mw = x.measureText('AYNE').width;
  x.fillText('AYNE', cx - mw / 2, S - 36);

  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Vertical-stripe bump for the milled/reeded edge. */
function makeReedTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 16;
  const x = c.getContext('2d')!;
  for (let i = 0; i < 128; i++) {
    x.fillStyle = i % 2 ? '#ffffff' : '#666666';
    x.fillRect(i * 2, 0, 2, 16);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.repeat.set(3, 1);
  return tex;
}

function CryptoCoins({ variant, enter }: { variant: SceneProps['variant']; enter: React.MutableRefObject<number> }) {
  const idxs = variant === 'mobile' ? MOBILE_COIN_IDXS : COIN_DEFS.map((_, i) => i);
  return (
    <>
      {idxs.map((i, order) => (
        <CryptoCoin key={COIN_DEFS[i].id} def={COIN_DEFS[i]} slot={COIN_SLOTS[i]} order={order} enter={enter} />
      ))}
    </>
  );
}

function CryptoCoin({
  def,
  slot,
  order,
  enter,
}: {
  def: CoinDef;
  slot: CoinSlot;
  order: number;
  enter: React.MutableRefObject<number>;
}) {
  const ref = React.useRef<THREE.Group>(null);
  const face = React.useMemo(() => makeCoinFace(def), [def]);
  const reed = React.useMemo(() => makeReedTexture(), []);
  React.useEffect(() => () => { face.dispose(); reed.dispose(); }, [face, reed]);

  const mats = React.useMemo(() => {
    const faceMat = new THREE.MeshStandardMaterial({
      map: face,
      bumpMap: face,
      bumpScale: 0.6,
      color: '#ffffff',
      metalness: 0.85,
      roughness: def.rough,
    });
    const edgeMat = new THREE.MeshStandardMaterial({
      color: def.base,
      bumpMap: reed,
      bumpScale: 0.4,
      metalness: 0.85,
      roughness: def.rough + 0.1,
    });
    return [edgeMat, faceMat, faceMat]; // cylinder: [side, top, bottom]
  }, [face, reed, def]);

  const rimMat = React.useMemo(
    () => new THREE.MeshStandardMaterial({ color: def.base, metalness: 0.9, roughness: def.rough }),
    [def],
  );

  useFrame((state) => {
    const g = ref.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    const a = t * slot.speed * Math.PI * 2 + slot.phase;
    g.position.set(Math.cos(a) * slot.radius, slot.y + Math.sin(t * 0.5 + slot.phase) * 0.14, Math.sin(a) * 1.5);
    // steady self-spin + occasional graceful flip; whole half-turns
    // accumulate so the pose never snaps when the period wraps
    const flipPeriod = 14 + (order % 5) * 3;
    const tf = t + order * 2.3;
    const ft = tf % flipPeriod;
    const flip = (Math.floor(tf / flipPeriod) + easeOut(Math.min(ft / 1.6, 1))) * Math.PI;
    g.rotation.set(Math.PI / 2.15 + Math.sin(t * 0.35 + slot.phase) * 0.12 + flip, 0, t * 0.4 + slot.phase);
    // fleet staggers in shortly after the rings
    const k = easeOut(THREE.MathUtils.clamp(enter.current - 0.45 - order * 0.05, 0, 1));
    g.scale.setScalar(Math.max(k * slot.scale, 0.0001));
  });

  return (
    <group ref={ref}>
      <mesh material={mats}>
        <cylinderGeometry args={[0.3, 0.3, 0.05, 64]} />
      </mesh>
      {/* beveled rims */}
      <mesh position={[0, 0.025, 0]} rotation={[Math.PI / 2, 0, 0]} material={rimMat}>
        <torusGeometry args={[0.288, 0.011, 8, 64]} />
      </mesh>
      <mesh position={[0, -0.025, 0]} rotation={[Math.PI / 2, 0, 0]} material={rimMat}>
        <torusGeometry args={[0.288, 0.011, 8, 64]} />
      </mesh>
    </group>
  );
}

function Labels({ enter, theme }: { enter: React.MutableRefObject<number>; theme: 'light' | 'dark' }) {
  const items = [
    { text: 'SWIFT', pos: [-2.7, 1.7, -0.6] as [number, number, number] },
    { text: 'SEPA', pos: [2.9, -1.5, -0.4] as [number, number, number] },
    { text: 'FX', pos: [-3, -1.1, 0.3] as [number, number, number] },
  ];
  const ref = React.useRef<THREE.Group>(null);
  useFrame((state) => {
    const g = ref.current;
    if (!g) return;
    const k = easeOut(THREE.MathUtils.clamp(enter.current - 0.8, 0, 1));
    g.scale.setScalar(k);
    g.position.y = Math.sin(state.clock.elapsedTime * 0.4) * 0.06;
  });
  return (
    <group ref={ref}>
      {items.map((it) => (
        <TextPlane
          key={it.text}
          text={it.text}
          size={0.16}
          weight={700}
          color={theme === 'dark' ? '#8b93a6' : '#7d8496'}
          opacity={0.75}
          position={it.pos}
        />
      ))}
    </group>
  );
}

/* ---------------------- shared glow sprite texture ----------------------- */

let _glowTex: THREE.CanvasTexture | null = null;
function glowSprite(): THREE.CanvasTexture {
  if (_glowTex) return _glowTex;
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 64;
  const x = c.getContext('2d')!;
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.35, 'rgba(255,255,255,0.55)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, 64, 64);
  _glowTex = new THREE.CanvasTexture(c);
  return _glowTex;
}

/* ------------------------------ particles -------------------------------- */

function Particles({ variant, theme, enter }: { variant: SceneProps['variant']; theme: 'light' | 'dark'; enter: React.MutableRefObject<number> }) {
  const count = variant === 'mobile' ? 50 : 130;
  const ref = React.useRef<THREE.Points>(null);
  const data = React.useMemo(() => {
    const pos = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const r = 2 + Math.random() * 2.4;
      const a = Math.random() * Math.PI * 2;
      pos[i * 3] = Math.cos(a) * r;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 3;
      pos[i * 3 + 2] = Math.sin(a) * r - 0.5;
      seed[i] = Math.random();
    }
    return { pos, seed };
  }, [count]);

  useFrame((_, delta) => {
    const pts = ref.current;
    if (!pts) return;
    const arr = (pts.geometry.attributes.position as THREE.BufferAttribute).array as Float32Array;
    for (let i = 0; i < count; i++) {
      const ix = i * 3;
      // drift slowly toward the core
      arr[ix] *= 1 - delta * 0.05;
      arr[ix + 1] *= 1 - delta * 0.03;
      arr[ix + 2] *= 1 - delta * 0.05;
      const r = Math.hypot(arr[ix], arr[ix + 2]);
      if (r < 0.5) {
        const a = data.seed[i] * Math.PI * 2;
        const nr = 2.6 + data.seed[i] * 1.8;
        arr[ix] = Math.cos(a) * nr;
        arr[ix + 1] = (data.seed[i] - 0.5) * 3;
        arr[ix + 2] = Math.sin(a) * nr;
      }
    }
    (pts.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    const m = pts.material as THREE.PointsMaterial;
    m.opacity = 0.5 * easeOut(THREE.MathUtils.clamp(enter.current - 0.9, 0, 1));
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[data.pos, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        map={glowSprite()}
        color={theme === 'dark' ? P.accentSoft : P.accent}
        transparent
        opacity={0}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/* --------------------------- coin conversion ------------------------------ *
 * The signature moment: every ~11s (16s mobile) ONE coin drifts toward the
 * core, dissolves into blue-white light, the particles cross the core (which
 * briefly illuminates), and the value reconstructs as a DIFFERENT coin on
 * the far side. Elegant dissolution, never an explosion; one at a time.     */

const CONVERSION_PAIRS: [number, number][] = [
  [0, 2], // BTC → USDT
  [1, 3], // ETH → USDC
  [6, 0], // SOL → BTC
  [2, 1], // USDT → ETH
  [8, 2], // DOGE → USDT
  [9, 0], // LTC → BTC
  [5, 3], // XRP → USDC
  [7, 1], // ADA → ETH
];

const N_CONV = 56;

function ConvCoin({
  idx,
  groupRef,
  matRef,
  ringRef,
}: {
  idx: number;
  groupRef: React.RefObject<THREE.Group>;
  matRef: React.MutableRefObject<THREE.Material[]>;
  ringRef?: React.RefObject<THREE.Mesh>;
}) {
  const def = COIN_DEFS[idx];
  const face = React.useMemo(() => makeCoinFace(def), [def]);
  React.useEffect(() => () => face.dispose(), [face]);

  const mats = React.useMemo(() => {
    const faceMat = new THREE.MeshStandardMaterial({
      map: face,
      bumpMap: face,
      bumpScale: 0.6,
      metalness: 0.85,
      roughness: def.rough,
      transparent: true,
      opacity: 0,
    });
    const edgeMat = new THREE.MeshStandardMaterial({
      color: def.base,
      metalness: 0.85,
      roughness: def.rough + 0.1,
      transparent: true,
      opacity: 0,
    });
    return [edgeMat, faceMat, faceMat];
  }, [face, def]);
  React.useEffect(() => {
    matRef.current = [mats[1], mats[0]];
  }, [mats, matRef]);

  return (
    <group ref={groupRef} visible={false}>
      <mesh material={mats}>
        <cylinderGeometry args={[0.3, 0.3, 0.05, 64]} />
      </mesh>
      {/* reconstruct ring-flash on the coin face */}
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]} visible={false}>
        <torusGeometry args={[0.3, 0.02, 8, 48]} />
        <meshBasicMaterial color={P.accentSoft} transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  );
}

function ConversionLayer({
  variant,
  theme,
  enter,
  coreFlash,
}: {
  variant: SceneProps['variant'];
  theme: 'light' | 'dark';
  enter: React.MutableRefObject<number>;
  coreFlash: React.MutableRefObject<number>;
}) {
  const period = variant === 'mobile' ? 16 : 11;
  const [pairIdx, setPairIdx] = React.useState(0);
  const pair = CONVERSION_PAIRS[pairIdx % CONVERSION_PAIRS.length];

  const fromRef = React.useRef<THREE.Group>(null);
  const toRef = React.useRef<THREE.Group>(null);
  const ringRef = React.useRef<THREE.Mesh>(null);
  const fromMats = React.useRef<THREE.Material[]>([]);
  const toMats = React.useRef<THREE.Material[]>([]);
  const ptsRef = React.useRef<THREE.Points>(null);
  const startRef = React.useRef<number | null>(null);
  const seeds = React.useMemo(() => Float32Array.from({ length: N_CONV * 3 }, () => Math.random() - 0.5), []);

  const setOpacity = (mats: THREE.Material[], o: number) =>
    mats.forEach((m) => ((m as THREE.MeshStandardMaterial).opacity = o));

  useFrame((state) => {
    // wait until the entrance has settled, then run cycles
    if (enter.current < 1.6) return;
    if (startRef.current === null) startRef.current = state.clock.elapsedTime + 2;
    const t = state.clock.elapsedTime - startRef.current;
    if (t < 0) return;
    if (t > period) {
      startRef.current = state.clock.elapsedTime;
      setPairIdx((i) => (i + 1) % CONVERSION_PAIRS.length);
      return;
    }

    const A = fromRef.current;
    const B = toRef.current;
    const pts = ptsRef.current;
    if (!A || !B || !pts) return;

    const X0 = -3.4; // entry side
    const X1 = 3.4; // exit side
    const yBase = 0.15;

    // Phase windows (seconds)
    const drift = smooth(t, 0, 2.6); // approach
    const dissolve = smooth(t, 2.6, 3.6); // melt into light
    const cross = smooth(t, 3.4, 5.0); // particles through core
    const rebuild = smooth(t, 5.0, 6.0); // reconstruct
    const exit = smooth(t, 6.2, 8.8); // drift away
    const fadeOut = smooth(t, 8.2, 9.2);

    // FROM coin: drifts -3.4 → -1.1, fades in then dissolves (scale down)
    A.visible = t < 3.8;
    A.position.set(THREE.MathUtils.lerp(X0, -1.05, drift), yBase + Math.sin(t * 1.3) * 0.06, 0.6);
    A.rotation.set(Math.PI / 2.2, 0.5 - drift * 0.4, t * 0.6);
    const aScale = (0.9 + drift * 0.1) * (1 - dissolve);
    A.scale.setScalar(Math.max(aScale, 0.0001));
    setOpacity(fromMats.current, Math.min(drift * 2, 1) * (1 - dissolve));

    // Particle stream: emerges at dissolve, crosses origin, converges at +1.05
    const arr = (pts.geometry.attributes.position as THREE.BufferAttribute).array as Float32Array;
    const p0 = new THREE.Vector3(-1.05, yBase, 0.6);
    const p1 = new THREE.Vector3(1.05, yBase, 0.6);
    for (let i = 0; i < N_CONV; i++) {
      const f = i / N_CONV;
      const lead = THREE.MathUtils.clamp(cross * 1.25 - f * 0.25, 0, 1);
      const spread = Math.sin(lead * Math.PI); // widest mid-flight
      arr[i * 3] = THREE.MathUtils.lerp(p0.x, p1.x, lead) + seeds[i * 3] * 0.5 * spread;
      arr[i * 3 + 1] = THREE.MathUtils.lerp(p0.y, p1.y, lead) + seeds[i * 3 + 1] * 0.45 * spread;
      arr[i * 3 + 2] = THREE.MathUtils.lerp(p0.z, 0, Math.min(lead * 2, 1)) + seeds[i * 3 + 2] * 0.4 * spread;
    }
    (pts.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    const pm = pts.material as THREE.PointsMaterial;
    pm.opacity = Math.min(dissolve * 1.5, 1) * (1 - rebuild) * 0.95;

    // Core illumination while the value passes through
    coreFlash.current = Math.sin(Math.min(Math.max((t - 3.2) / 2.2, 0), 1) * Math.PI);

    // TO coin: reconstructs at +1.05, drifts out, fades
    B.visible = t > 4.8;
    B.position.set(THREE.MathUtils.lerp(1.05, X1, exit), yBase + Math.sin(t * 1.1) * 0.06, 0.6);
    B.rotation.set(Math.PI / 2.2, -0.3 + exit * 0.5, t * 0.6);
    B.scale.setScalar(Math.max(rebuild, 0.0001));
    setOpacity(toMats.current, rebuild * (1 - fadeOut));

    // coin reconstruct ring-flash
    const ring = ringRef.current;
    if (ring) {
      const rf = smooth(t, 5.0, 5.9);
      ring.visible = rf > 0 && rf < 1;
      ring.scale.setScalar(1 + rf * 1.6);
      (ring.material as THREE.MeshBasicMaterial).opacity = Math.sin(rf * Math.PI) * 0.9;
    }
  });

  return (
    <>
      <ConvCoin key={`f-${pairIdx}`} idx={pair[0]} groupRef={fromRef} matRef={fromMats} />
      <ConvCoin key={`t-${pairIdx}`} idx={pair[1]} groupRef={toRef} matRef={toMats} ringRef={ringRef} />
      <points ref={ptsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[new Float32Array(N_CONV * 3), 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.09}
          map={glowSprite()}
          color={theme === 'dark' ? '#bcd2ff' : P.accent}
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </>
  );
}

function smooth(t: number, a: number, b: number) {
  return THREE.MathUtils.smoothstep(t, a, b);
}

/* ------------------------------ rig + scene ------------------------------ */

function easeOut(k: number) {
  return 1 - Math.pow(1 - k, 3);
}

function Rig({ pointer, children }: { pointer: SceneProps['pointer']; children: React.ReactNode }) {
  const ref = React.useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    const g = ref.current;
    if (!g) return;
    // heavy, weighty damping toward the pointer + tiny automatic drift
    const t = state.clock.elapsedTime;
    const targetY = pointer.current.x * 0.16 + Math.sin(t * 0.05) * 0.03;
    const targetX = -pointer.current.y * 0.1 + Math.cos(t * 0.04) * 0.02;
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, targetY, 1.6, delta);
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, targetX, 1.6, delta);
  });
  return <group ref={ref}>{children}</group>;
}

function SceneContent({ theme, variant, pointer }: Omit<SceneProps, 'active'>) {
  const mats = useMaterials(theme);
  const enter = React.useRef(0);
  const coreFlash = React.useRef(0);
  useFrame((_, delta) => {
    // master entrance progress: 0→~1.9 over ~2.8s (staggers gate on offsets)
    enter.current = Math.min(enter.current + delta * 0.68, 1.9);
  });

  const dark = theme === 'dark';

  return (
    <>
      <ambientLight intensity={dark ? 0.35 : 0.55} />
      <directionalLight position={[4, 6, 5]} intensity={dark ? 1.1 : 1.5} color="#ffffff" />
      <pointLight position={[0, 0, 3.2]} intensity={dark ? 1.0 : 0.5} color={P.accent} distance={9} />
      <directionalLight position={[1.5, 0.5, 6]} intensity={dark ? 0.55 : 0.8} color="#ffffff" />
      {/* Procedural studio environment — local cubemap, no downloads. */}
      <Environment resolution={64} frames={1}>
        <Lightformer intensity={dark ? 1.6 : 2.4} position={[0, 4, 3]} scale={[9, 3, 1]} color="#ffffff" />
        <Lightformer intensity={dark ? 1.1 : 1.4} position={[-5, 1, -1]} rotation={[0, Math.PI / 2, 0]} scale={[6, 2, 1]} color="#dfe6f5" />
        <Lightformer intensity={dark ? 1.4 : 1.1} position={[5, -1, 0]} rotation={[0, -Math.PI / 2, 0]} scale={[6, 2, 1]} color={P.accentSoft} />
        <Lightformer intensity={dark ? 0.7 : 0.9} position={[0, -4, -2]} scale={[8, 2, 1]} color={dark ? '#40507a' : '#ffffff'} />
      </Environment>

      <Rig pointer={pointer}>
        <Core mats={mats} enter={enter} coreFlash={coreFlash} />
        <Rings mats={mats} variant={variant} enter={enter} />
        <Symbols mats={mats} variant={variant} enter={enter} />
        <CryptoCoins variant={variant} enter={enter} />
        {variant === 'desktop' && <Labels enter={enter} theme={theme} />}
        <Particles variant={variant} theme={theme} enter={enter} />
        <ConversionLayer variant={variant} theme={theme} enter={enter} coreFlash={coreFlash} />
      </Rig>
    </>
  );
}

export default function FinancialCore({ theme, variant, active, pointer }: SceneProps) {
  return (
    <Canvas
      frameloop={active ? 'always' : 'never'}
      dpr={[1, variant === 'mobile' ? 1.3 : 1.5]}
      camera={{ position: [1.6, 0.5, 7.2], fov: 34 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{ background: 'transparent' }}
      aria-hidden
    >
      <SceneContent theme={theme} variant={variant} pointer={pointer} />
    </Canvas>
  );
}
